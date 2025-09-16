import express from 'express';
import Joi from 'joi';
import { getPool } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation schemas
const syncDataSchema = Joi.object({
  readings: Joi.array().items(Joi.object({
    id: Joi.string().uuid().optional(),
    stationId: Joi.string().uuid().required(),
    readingDate: Joi.date().required(),
    phLevel: Joi.number().min(0).max(14).optional(),
    tdsLevel: Joi.number().integer().min(0).optional(),
    temperature: Joi.number().optional(),
    pressure: Joi.number().min(0).optional(),
    tankLevelPercentage: Joi.number().integer().min(0).max(100).optional(),
    notes: Joi.string().optional(),
    notesAr: Joi.string().optional(),
    isSynced: Joi.boolean().default(false)
  })).optional(),
  faults: Joi.array().items(Joi.object({
    id: Joi.string().uuid().optional(),
    stationId: Joi.string().uuid().required(),
    title: Joi.string().min(5).max(255).required(),
    titleAr: Joi.string().min(5).max(255).required(),
    description: Joi.string().min(10).required(),
    descriptionAr: Joi.string().min(10).required(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    photoUrl: Joi.string().uri().optional(),
    isSynced: Joi.boolean().default(false)
  })).optional()
});

// Get pending sync data
router.get('/pending', async (req: AuthRequest, res, next) => {
  try {
    const pool = getPool();

    // Get unsynced readings
    const readingsResult = await pool.query(
      `SELECT r.id, r.station_id, r.reading_date, r.ph_level, r.tds_level,
              r.temperature, r.pressure, r.tank_level_percentage, r.notes, r.notes_ar
       FROM daily_readings r
       JOIN stations s ON r.station_id = s.id
       WHERE r.operator_id = $1 AND r.is_synced = false
       ORDER BY r.created_at ASC`,
      [req.user!.id]
    );

    // Get unsynced faults
    const faultsResult = await pool.query(
      `SELECT f.id, f.station_id, f.title, f.title_ar, f.description, f.description_ar,
              f.priority, f.latitude, f.longitude, f.photo_url
       FROM faults f
       JOIN stations s ON f.station_id = s.id
       WHERE f.reported_by = $1 AND f.status = 'open'
       ORDER BY f.created_at ASC`,
      [req.user!.id]
    );

    res.json({
      success: true,
      data: {
        readings: readingsResult.rows.map(reading => ({
          id: reading.id,
          stationId: reading.station_id,
          readingDate: reading.reading_date,
          phLevel: reading.ph_level ? parseFloat(reading.ph_level) : null,
          tdsLevel: reading.tds_level,
          temperature: reading.temperature ? parseFloat(reading.temperature) : null,
          pressure: reading.pressure ? parseFloat(reading.pressure) : null,
          tankLevelPercentage: reading.tank_level_percentage,
          notes: reading.notes,
          notesAr: reading.notes_ar
        })),
        faults: faultsResult.rows.map(fault => ({
          id: fault.id,
          stationId: fault.station_id,
          title: fault.title,
          titleAr: fault.title_ar,
          description: fault.description,
          descriptionAr: fault.description_ar,
          priority: fault.priority,
          latitude: fault.latitude ? parseFloat(fault.latitude) : null,
          longitude: fault.longitude ? parseFloat(fault.longitude) : null,
          photoUrl: fault.photo_url
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Sync data from mobile to server
router.post('/upload', async (req: AuthRequest, res, next) => {
  try {
    const { error, value } = syncDataSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const { readings = [], faults = [] } = value;
    const pool = getPool();
    const results = {
      readings: { created: 0, updated: 0, errors: [] as Array<{ id: any; error: string }> },
      faults: { created: 0, updated: 0, errors: [] as Array<{ id: any; error: string }> }
    };

    // Process readings
    for (const reading of readings) {
      try {
        // Verify station access
        const stationResult = await pool.query(
          'SELECT id FROM stations WHERE id = $1 AND operator_id = $2',
          [reading.stationId, req.user!.id]
        );

        if (stationResult.rows.length === 0) {
          results.readings.errors.push({
            id: reading.id,
            error: 'Station not found or access denied'
          });
          continue;
        }

        if (reading.id) {
          // Update existing reading
          const updateResult = await pool.query(
            `UPDATE daily_readings 
             SET ph_level = COALESCE($1, ph_level),
                 tds_level = COALESCE($2, tds_level),
                 temperature = COALESCE($3, temperature),
                 pressure = COALESCE($4, pressure),
                 tank_level_percentage = COALESCE($5, tank_level_percentage),
                 notes = COALESCE($6, notes),
                 notes_ar = COALESCE($7, notes_ar),
                 is_synced = true,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $8 AND operator_id = $9
             RETURNING id`,
            [
              reading.phLevel, reading.tdsLevel, reading.temperature,
              reading.pressure, reading.tankLevelPercentage,
              reading.notes, reading.notesAr, reading.id, req.user!.id
            ]
          );

          if (updateResult.rows.length > 0) {
            results.readings.updated++;
          } else {
            results.readings.errors.push({
              id: reading.id,
              error: 'Reading not found or access denied'
            });
          }
        } else {
          // Create new reading
          const insertResult = await pool.query(
            `INSERT INTO daily_readings (station_id, operator_id, reading_date, ph_level,
                                        tds_level, temperature, pressure, tank_level_percentage,
                                        notes, notes_ar, is_synced)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
             RETURNING id`,
            [
              reading.stationId, req.user!.id, reading.readingDate,
              reading.phLevel, reading.tdsLevel, reading.temperature,
              reading.pressure, reading.tankLevelPercentage,
              reading.notes, reading.notesAr
            ]
          );

          results.readings.created++;
        }
      } catch (err: any) {
        results.readings.errors.push({
          id: reading.id,
          error: err.message
        });
      }
    }

    // Process faults
    for (const fault of faults) {
      try {
        // Verify station access
        const stationResult = await pool.query(
          'SELECT id FROM stations WHERE id = $1 AND operator_id = $2',
          [fault.stationId, req.user!.id]
        );

        if (stationResult.rows.length === 0) {
          results.faults.errors.push({
            id: fault.id,
            error: 'Station not found or access denied'
          });
          continue;
        }

        if (fault.id) {
          // Update existing fault
          const updateResult = await pool.query(
            `UPDATE faults 
             SET title = COALESCE($1, title),
                 title_ar = COALESCE($2, title_ar),
                 description = COALESCE($3, description),
                 description_ar = COALESCE($4, description_ar),
                 priority = COALESCE($5, priority),
                 latitude = COALESCE($6, latitude),
                 longitude = COALESCE($7, longitude),
                 photo_url = COALESCE($8, photo_url),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $9 AND reported_by = $10
             RETURNING id`,
            [
              fault.title, fault.titleAr, fault.description, fault.descriptionAr,
              fault.priority, fault.latitude, fault.longitude, fault.photoUrl,
              fault.id, req.user!.id
            ]
          );

          if (updateResult.rows.length > 0) {
            results.faults.updated++;
          } else {
            results.faults.errors.push({
              id: fault.id,
              error: 'Fault not found or access denied'
            });
          }
        } else {
          // Create new fault
          const insertResult = await pool.query(
            `INSERT INTO faults (station_id, reported_by, title, title_ar, description, description_ar,
                                priority, latitude, longitude, photo_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING id`,
            [
              fault.stationId, req.user!.id, fault.title, fault.titleAr,
              fault.description, fault.descriptionAr, fault.priority,
              fault.latitude, fault.longitude, fault.photoUrl
            ]
          );

          results.faults.created++;
        }
      } catch (err: any) {
        results.faults.errors.push({
          id: fault.id,
          error: err.message
        });
      }
    }

    logger.info(`User ${req.user!.email} synced data: ${results.readings.created} readings created, ${results.readings.updated} updated, ${results.faults.created} faults created, ${results.faults.updated} updated`);

    res.json({
      success: true,
      message: 'Sync completed',
      data: results
    });
  } catch (error) {
    next(error);
  }
});

// Mark data as synced
router.post('/mark-synced', async (req: AuthRequest, res, next) => {
  try {
    const { ids, type } = req.body;

    if (!Array.isArray(ids) || !type || !['readings', 'faults'].includes(type)) {
      throw createError('Invalid request data', 400);
    }

    const pool = getPool();
    let result;

    if (type === 'readings') {
      result = await pool.query(
        'UPDATE daily_readings SET is_synced = true WHERE id = ANY($1) AND operator_id = $2',
        [ids, req.user!.id]
      );
    } else {
      result = await pool.query(
        'UPDATE faults SET updated_at = CURRENT_TIMESTAMP WHERE id = ANY($1) AND reported_by = $2',
        [ids, req.user!.id]
      );
    }

    logger.info(`User ${req.user!.email} marked ${result.rowCount} ${type} as synced`);

    res.json({
      success: true,
      message: `${result.rowCount} ${type} marked as synced`
    });
  } catch (error) {
    next(error);
  }
});

export default router;

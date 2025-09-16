import express from 'express';
import Joi from 'joi';
import { getPool } from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation schemas
const readingSchema = Joi.object({
  stationId: Joi.string().uuid().required(),
  readingDate: Joi.date().required(),
  phLevel: Joi.number().min(0).max(14).optional(),
  tdsLevel: Joi.number().integer().min(0).optional(),
  temperature: Joi.number().optional(),
  pressure: Joi.number().min(0).optional(),
  tankLevelPercentage: Joi.number().integer().min(0).max(100).optional(),
  notes: Joi.string().optional(),
  notesAr: Joi.string().optional()
});

const updateReadingSchema = Joi.object({
  phLevel: Joi.number().min(0).max(14).optional(),
  tdsLevel: Joi.number().integer().min(0).optional(),
  temperature: Joi.number().optional(),
  pressure: Joi.number().min(0).optional(),
  tankLevelPercentage: Joi.number().integer().min(0).max(100).optional(),
  notes: Joi.string().optional(),
  notesAr: Joi.string().optional()
});

// Get readings with filters
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { stationId, startDate, endDate, limit = '50', offset = '0' } = req.query;
    const pool = getPool();

    let query = `
      SELECT r.id, r.station_id, r.operator_id, r.reading_date, r.ph_level,
             r.tds_level, r.temperature, r.pressure, r.tank_level_percentage,
             r.notes, r.notes_ar, r.is_synced, r.created_at, r.updated_at,
             s.name as station_name, s.name_ar as station_name_ar,
             u.first_name as operator_first_name, u.last_name as operator_last_name
      FROM daily_readings r
      JOIN stations s ON r.station_id = s.id
      JOIN users u ON r.operator_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 0;

    // If user is operator, only show their readings
    if (req.user!.role === 'operator') {
      query += ` AND r.operator_id = $${++paramCount}`;
      params.push(req.user!.id);
    }

    if (stationId) {
      query += ` AND r.station_id = $${++paramCount}`;
      params.push(stationId);
    }

    if (startDate) {
      query += ` AND r.reading_date >= $${++paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND r.reading_date <= $${++paramCount}`;
      params.push(endDate);
    }

    query += ` ORDER BY r.reading_date DESC, r.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(reading => ({
        id: reading.id,
        stationId: reading.station_id,
        stationName: reading.station_name,
        stationNameAr: reading.station_name_ar,
        operatorId: reading.operator_id,
        operatorName: `${reading.operator_first_name} ${reading.operator_last_name}`,
        readingDate: reading.reading_date,
        phLevel: reading.ph_level ? parseFloat(reading.ph_level) : null,
        tdsLevel: reading.tds_level,
        temperature: reading.temperature ? parseFloat(reading.temperature) : null,
        pressure: reading.pressure ? parseFloat(reading.pressure) : null,
        tankLevelPercentage: reading.tank_level_percentage,
        notes: reading.notes,
        notesAr: reading.notes_ar,
        isSynced: reading.is_synced,
        createdAt: reading.created_at,
        updatedAt: reading.updated_at
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get reading by ID
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    let query = `
      SELECT r.id, r.station_id, r.operator_id, r.reading_date, r.ph_level,
             r.tds_level, r.temperature, r.pressure, r.tank_level_percentage,
             r.notes, r.notes_ar, r.is_synced, r.created_at, r.updated_at,
             s.name as station_name, s.name_ar as station_name_ar,
             u.first_name as operator_first_name, u.last_name as operator_last_name
      FROM daily_readings r
      JOIN stations s ON r.station_id = s.id
      JOIN users u ON r.operator_id = u.id
      WHERE r.id = $1
    `;

    const params = [id];

    // If user is operator, ensure they can only access their readings
    if (req.user!.role === 'operator') {
      query += ` AND r.operator_id = $2`;
      params.push(req.user!.id);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      throw createError('Reading not found', 404);
    }

    const reading = result.rows[0];
    res.json({
      success: true,
      data: {
        id: reading.id,
        stationId: reading.station_id,
        stationName: reading.station_name,
        stationNameAr: reading.station_name_ar,
        operatorId: reading.operator_id,
        operatorName: `${reading.operator_first_name} ${reading.operator_last_name}`,
        readingDate: reading.reading_date,
        phLevel: reading.ph_level ? parseFloat(reading.ph_level) : null,
        tdsLevel: reading.tds_level,
        temperature: reading.temperature ? parseFloat(reading.temperature) : null,
        pressure: reading.pressure ? parseFloat(reading.pressure) : null,
        tankLevelPercentage: reading.tank_level_percentage,
        notes: reading.notes,
        notesAr: reading.notes_ar,
        isSynced: reading.is_synced,
        createdAt: reading.created_at,
        updatedAt: reading.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create reading
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { error, value } = readingSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const {
      stationId, readingDate, phLevel, tdsLevel, temperature,
      pressure, tankLevelPercentage, notes, notesAr
    } = value;

    const pool = getPool();

    // Verify station exists and user has access
    let stationQuery = 'SELECT id FROM stations WHERE id = $1';
    const stationParams = [stationId];

    if (req.user!.role === 'operator') {
      stationQuery += ' AND operator_id = $2';
      stationParams.push(req.user!.id);
    }

    const stationResult = await pool.query(stationQuery, stationParams);
    if (stationResult.rows.length === 0) {
      throw createError('Station not found or access denied', 404);
    }

    // Check if reading already exists for this date and station
    const existingReading = await pool.query(
      'SELECT id FROM daily_readings WHERE station_id = $1 AND reading_date = $2',
      [stationId, readingDate]
    );

    if (existingReading.rows.length > 0) {
      throw createError('Reading already exists for this station and date', 409);
    }

    const result = await pool.query(
      `INSERT INTO daily_readings (station_id, operator_id, reading_date, ph_level,
                                  tds_level, temperature, pressure, tank_level_percentage,
                                  notes, notes_ar, is_synced)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
       RETURNING id, station_id, operator_id, reading_date, ph_level, tds_level,
                 temperature, pressure, tank_level_percentage, notes, notes_ar,
                 is_synced, created_at, updated_at`,
      [stationId, req.user!.id, readingDate, phLevel, tdsLevel, temperature,
       pressure, tankLevelPercentage, notes, notesAr]
    );

    const reading = result.rows[0];
    logger.info(`User ${req.user!.email} created reading for station ${stationId}`);

    res.status(201).json({
      success: true,
      message: 'Reading created successfully',
      data: {
        id: reading.id,
        stationId: reading.station_id,
        operatorId: reading.operator_id,
        readingDate: reading.reading_date,
        phLevel: reading.ph_level ? parseFloat(reading.ph_level) : null,
        tdsLevel: reading.tds_level,
        temperature: reading.temperature ? parseFloat(reading.temperature) : null,
        pressure: reading.pressure ? parseFloat(reading.pressure) : null,
        tankLevelPercentage: reading.tank_level_percentage,
        notes: reading.notes,
        notesAr: reading.notes_ar,
        isSynced: reading.is_synced,
        createdAt: reading.created_at,
        updatedAt: reading.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update reading
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = updateReadingSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const { phLevel, tdsLevel, temperature, pressure, tankLevelPercentage, notes, notesAr } = value;
    const pool = getPool();

    let query = `
      UPDATE daily_readings 
      SET ph_level = COALESCE($1, ph_level),
          tds_level = COALESCE($2, tds_level),
          temperature = COALESCE($3, temperature),
          pressure = COALESCE($4, pressure),
          tank_level_percentage = COALESCE($5, tank_level_percentage),
          notes = COALESCE($6, notes),
          notes_ar = COALESCE($7, notes_ar),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
    `;

    const params = [phLevel, tdsLevel, temperature, pressure, tankLevelPercentage, notes, notesAr, id];

    // If user is operator, ensure they can only update their readings
    if (req.user!.role === 'operator') {
      query += ` AND operator_id = $9`;
      params.push(req.user!.id);
    }

    query += ` RETURNING id, station_id, operator_id, reading_date, ph_level, tds_level,
                      temperature, pressure, tank_level_percentage, notes, notes_ar,
                      is_synced, created_at, updated_at`;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      throw createError('Reading not found or access denied', 404);
    }

    const reading = result.rows[0];
    logger.info(`User ${req.user!.email} updated reading ${id}`);

    res.json({
      success: true,
      message: 'Reading updated successfully',
      data: {
        id: reading.id,
        stationId: reading.station_id,
        operatorId: reading.operator_id,
        readingDate: reading.reading_date,
        phLevel: reading.ph_level ? parseFloat(reading.ph_level) : null,
        tdsLevel: reading.tds_level,
        temperature: reading.temperature ? parseFloat(reading.temperature) : null,
        pressure: reading.pressure ? parseFloat(reading.pressure) : null,
        tankLevelPercentage: reading.tank_level_percentage,
        notes: reading.notes,
        notesAr: reading.notes_ar,
        isSynced: reading.is_synced,
        createdAt: reading.created_at,
        updatedAt: reading.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete reading (admin only)
router.delete('/:id', authorize('admin'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    const result = await pool.query(
      'DELETE FROM daily_readings WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw createError('Reading not found', 404);
    }

    logger.info(`Admin ${req.user!.email} deleted reading ${id}`);

    res.json({
      success: true,
      message: 'Reading deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

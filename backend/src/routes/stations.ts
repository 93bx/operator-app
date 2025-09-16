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
const stationSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  nameAr: Joi.string().min(2).max(255).required(),
  locationName: Joi.string().min(2).max(255).required(),
  locationNameAr: Joi.string().min(2).max(255).required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  address: Joi.string().optional(),
  addressAr: Joi.string().optional(),
  capacityLiters: Joi.number().integer().min(0).optional(),
  operatorId: Joi.string().uuid().optional()
});

const updateStationSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  nameAr: Joi.string().min(2).max(255).optional(),
  locationName: Joi.string().min(2).max(255).optional(),
  locationNameAr: Joi.string().min(2).max(255).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  address: Joi.string().optional(),
  addressAr: Joi.string().optional(),
  capacityLiters: Joi.number().integer().min(0).optional(),
  operatorId: Joi.string().uuid().optional(),
  status: Joi.string().valid('active', 'inactive', 'maintenance').optional()
});

// Get all stations
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const pool = getPool();
    let query = `
      SELECT s.id, s.name, s.name_ar, s.location_name, s.location_name_ar,
             s.latitude, s.longitude, s.address, s.address_ar, s.status,
             s.capacity_liters, s.operator_id, s.created_at, s.updated_at,
             u.first_name as operator_first_name, u.last_name as operator_last_name
      FROM stations s
      LEFT JOIN users u ON s.operator_id = u.id
    `;

    const params: any[] = [];
    let paramCount = 0;

    // If user is operator, only show their assigned stations
    if (req.user!.role === 'operator') {
      query += ` WHERE s.operator_id = $${++paramCount}`;
      params.push(req.user!.id);
    }

    query += ' ORDER BY s.created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(station => ({
        id: station.id,
        name: station.name,
        nameAr: station.name_ar,
        locationName: station.location_name,
        locationNameAr: station.location_name_ar,
        latitude: parseFloat(station.latitude),
        longitude: parseFloat(station.longitude),
        address: station.address,
        addressAr: station.address_ar,
        status: station.status,
        capacityLiters: station.capacity_liters,
        operatorId: station.operator_id,
        operatorName: station.operator_first_name && station.operator_last_name 
          ? `${station.operator_first_name} ${station.operator_last_name}` 
          : null,
        createdAt: station.created_at,
        updatedAt: station.updated_at
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get station by ID
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    let query = `
      SELECT s.id, s.name, s.name_ar, s.location_name, s.location_name_ar,
             s.latitude, s.longitude, s.address, s.address_ar, s.status,
             s.capacity_liters, s.operator_id, s.created_at, s.updated_at,
             u.first_name as operator_first_name, u.last_name as operator_last_name
      FROM stations s
      LEFT JOIN users u ON s.operator_id = u.id
      WHERE s.id = $1
    `;

    const params = [id];

    // If user is operator, ensure they can only access their assigned stations
    if (req.user!.role === 'operator') {
      query += ` AND s.operator_id = $2`;
      params.push(req.user!.id);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      throw createError('Station not found', 404);
    }

    const station = result.rows[0];
    res.json({
      success: true,
      data: {
        id: station.id,
        name: station.name,
        nameAr: station.name_ar,
        locationName: station.location_name,
        locationNameAr: station.location_name_ar,
        latitude: parseFloat(station.latitude),
        longitude: parseFloat(station.longitude),
        address: station.address,
        addressAr: station.address_ar,
        status: station.status,
        capacityLiters: station.capacity_liters,
        operatorId: station.operator_id,
        operatorName: station.operator_first_name && station.operator_last_name 
          ? `${station.operator_first_name} ${station.operator_last_name}` 
          : null,
        createdAt: station.created_at,
        updatedAt: station.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create station (admin only)
router.post('/', authorize('admin'), async (req: AuthRequest, res, next) => {
  try {
    const { error, value } = stationSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const {
      name, nameAr, locationName, locationNameAr, latitude, longitude,
      address, addressAr, capacityLiters, operatorId
    } = value;

    const pool = getPool();

    // Verify operator exists if provided
    if (operatorId) {
      const operatorResult = await pool.query(
        'SELECT id, role FROM users WHERE id = $1 AND role = $2',
        [operatorId, 'operator']
      );

      if (operatorResult.rows.length === 0) {
        throw createError('Invalid operator ID', 400);
      }
    }

    const result = await pool.query(
      `INSERT INTO stations (name, name_ar, location_name, location_name_ar,
                            latitude, longitude, address, address_ar, 
                            capacity_liters, operator_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, name, name_ar, location_name, location_name_ar,
                 latitude, longitude, address, address_ar, status,
                 capacity_liters, operator_id, created_at, updated_at`,
      [name, nameAr, locationName, locationNameAr, latitude, longitude,
       address, addressAr, capacityLiters, operatorId]
    );

    const station = result.rows[0];
    logger.info(`Admin ${req.user!.email} created station ${station.name}`);

    res.status(201).json({
      success: true,
      message: 'Station created successfully',
      data: {
        id: station.id,
        name: station.name,
        nameAr: station.name_ar,
        locationName: station.location_name,
        locationNameAr: station.location_name_ar,
        latitude: parseFloat(station.latitude),
        longitude: parseFloat(station.longitude),
        address: station.address,
        addressAr: station.address_ar,
        status: station.status,
        capacityLiters: station.capacity_liters,
        operatorId: station.operator_id,
        createdAt: station.created_at,
        updatedAt: station.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update station (admin only)
router.put('/:id', authorize('admin'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = updateStationSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const {
      name, nameAr, locationName, locationNameAr, latitude, longitude,
      address, addressAr, capacityLiters, operatorId, status
    } = value;

    const pool = getPool();

    // Verify operator exists if provided
    if (operatorId) {
      const operatorResult = await pool.query(
        'SELECT id, role FROM users WHERE id = $1 AND role = $2',
        [operatorId, 'operator']
      );

      if (operatorResult.rows.length === 0) {
        throw createError('Invalid operator ID', 400);
      }
    }

    const result = await pool.query(
      `UPDATE stations 
       SET name = COALESCE($1, name),
           name_ar = COALESCE($2, name_ar),
           location_name = COALESCE($3, location_name),
           location_name_ar = COALESCE($4, location_name_ar),
           latitude = COALESCE($5, latitude),
           longitude = COALESCE($6, longitude),
           address = COALESCE($7, address),
           address_ar = COALESCE($8, address_ar),
           capacity_liters = COALESCE($9, capacity_liters),
           operator_id = COALESCE($10, operator_id),
           status = COALESCE($11, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING id, name, name_ar, location_name, location_name_ar,
                 latitude, longitude, address, address_ar, status,
                 capacity_liters, operator_id, created_at, updated_at`,
      [name, nameAr, locationName, locationNameAr, latitude, longitude,
       address, addressAr, capacityLiters, operatorId, status, id]
    );

    if (result.rows.length === 0) {
      throw createError('Station not found', 404);
    }

    const station = result.rows[0];
    logger.info(`Admin ${req.user!.email} updated station ${station.name}`);

    res.json({
      success: true,
      message: 'Station updated successfully',
      data: {
        id: station.id,
        name: station.name,
        nameAr: station.name_ar,
        locationName: station.location_name,
        locationNameAr: station.location_name_ar,
        latitude: parseFloat(station.latitude),
        longitude: parseFloat(station.longitude),
        address: station.address,
        addressAr: station.address_ar,
        status: station.status,
        capacityLiters: station.capacity_liters,
        operatorId: station.operator_id,
        createdAt: station.created_at,
        updatedAt: station.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete station (admin only)
router.delete('/:id', authorize('admin'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    const result = await pool.query(
      'DELETE FROM stations WHERE id = $1 RETURNING name',
      [id]
    );

    if (result.rows.length === 0) {
      throw createError('Station not found', 404);
    }

    logger.info(`Admin ${req.user!.email} deleted station ${result.rows[0].name}`);

    res.json({
      success: true,
      message: 'Station deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

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
const faultSchema = Joi.object({
  stationId: Joi.string().uuid().required(),
  title: Joi.string().min(5).max(255).required(),
  titleAr: Joi.string().min(5).max(255).required(),
  description: Joi.string().min(10).required(),
  descriptionAr: Joi.string().min(10).required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  photoUrl: Joi.string().uri().optional()
});

const updateFaultSchema = Joi.object({
  title: Joi.string().min(5).max(255).optional(),
  titleAr: Joi.string().min(5).max(255).optional(),
  description: Joi.string().min(10).optional(),
  descriptionAr: Joi.string().min(10).optional(),
  status: Joi.string().valid('open', 'assigned', 'in_progress', 'resolved', 'closed').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  assignedTo: Joi.string().uuid().optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  photoUrl: Joi.string().uri().optional()
});

// Get faults with filters
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { 
      stationId, 
      status, 
      priority, 
      assignedTo, 
      startDate, 
      endDate, 
      limit = '50', 
      offset = '0' 
    } = req.query;
    
    const pool = getPool();

    let query = `
      SELECT f.id, f.station_id, f.reported_by, f.assigned_to, f.title, f.title_ar,
             f.description, f.description_ar, f.status, f.priority, f.latitude, f.longitude,
             f.photo_url, f.resolved_at, f.created_at, f.updated_at,
             s.name as station_name, s.name_ar as station_name_ar,
             reporter.first_name as reporter_first_name, reporter.last_name as reporter_last_name,
             assignee.first_name as assignee_first_name, assignee.last_name as assignee_last_name
      FROM faults f
      JOIN stations s ON f.station_id = s.id
      JOIN users reporter ON f.reported_by = reporter.id
      LEFT JOIN users assignee ON f.assigned_to = assignee.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 0;

    // If user is operator, only show faults for their stations
    if (req.user!.role === 'operator') {
      query += ` AND s.operator_id = $${++paramCount}`;
      params.push(req.user!.id);
    }

    if (stationId) {
      query += ` AND f.station_id = $${++paramCount}`;
      params.push(stationId);
    }

    if (status) {
      query += ` AND f.status = $${++paramCount}`;
      params.push(status);
    }

    if (priority) {
      query += ` AND f.priority = $${++paramCount}`;
      params.push(priority);
    }

    if (assignedTo) {
      query += ` AND f.assigned_to = $${++paramCount}`;
      params.push(assignedTo);
    }

    if (startDate) {
      query += ` AND f.created_at >= $${++paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND f.created_at <= $${++paramCount}`;
      params.push(endDate);
    }

    query += ` ORDER BY 
      CASE f.priority 
        WHEN 'critical' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
      END, f.created_at DESC 
      LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(fault => ({
        id: fault.id,
        stationId: fault.station_id,
        stationName: fault.station_name,
        stationNameAr: fault.station_name_ar,
        reportedBy: fault.reported_by,
        reporterName: `${fault.reporter_first_name} ${fault.reporter_last_name}`,
        assignedTo: fault.assigned_to,
        assigneeName: fault.assignee_first_name && fault.assignee_last_name 
          ? `${fault.assignee_first_name} ${fault.assignee_last_name}` 
          : null,
        title: fault.title,
        titleAr: fault.title_ar,
        description: fault.description,
        descriptionAr: fault.description_ar,
        status: fault.status,
        priority: fault.priority,
        latitude: fault.latitude ? parseFloat(fault.latitude) : null,
        longitude: fault.longitude ? parseFloat(fault.longitude) : null,
        photoUrl: fault.photo_url,
        resolvedAt: fault.resolved_at,
        createdAt: fault.created_at,
        updatedAt: fault.updated_at
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get fault by ID
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    let query = `
      SELECT f.id, f.station_id, f.reported_by, f.assigned_to, f.title, f.title_ar,
             f.description, f.description_ar, f.status, f.priority, f.latitude, f.longitude,
             f.photo_url, f.resolved_at, f.created_at, f.updated_at,
             s.name as station_name, s.name_ar as station_name_ar,
             reporter.first_name as reporter_first_name, reporter.last_name as reporter_last_name,
             assignee.first_name as assignee_first_name, assignee.last_name as assignee_last_name
      FROM faults f
      JOIN stations s ON f.station_id = s.id
      JOIN users reporter ON f.reported_by = reporter.id
      LEFT JOIN users assignee ON f.assigned_to = assignee.id
      WHERE f.id = $1
    `;

    const params = [id];

    // If user is operator, ensure they can only access faults for their stations
    if (req.user!.role === 'operator') {
      query += ` AND s.operator_id = $2`;
      params.push(req.user!.id);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      throw createError('Fault not found', 404);
    }

    const fault = result.rows[0];
    res.json({
      success: true,
      data: {
        id: fault.id,
        stationId: fault.station_id,
        stationName: fault.station_name,
        stationNameAr: fault.station_name_ar,
        reportedBy: fault.reported_by,
        reporterName: `${fault.reporter_first_name} ${fault.reporter_last_name}`,
        assignedTo: fault.assigned_to,
        assigneeName: fault.assignee_first_name && fault.assignee_last_name 
          ? `${fault.assignee_first_name} ${fault.assignee_last_name}` 
          : null,
        title: fault.title,
        titleAr: fault.title_ar,
        description: fault.description,
        descriptionAr: fault.description_ar,
        status: fault.status,
        priority: fault.priority,
        latitude: fault.latitude ? parseFloat(fault.latitude) : null,
        longitude: fault.longitude ? parseFloat(fault.longitude) : null,
        photoUrl: fault.photo_url,
        resolvedAt: fault.resolved_at,
        createdAt: fault.created_at,
        updatedAt: fault.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create fault
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { error, value } = faultSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const {
      stationId, title, titleAr, description, descriptionAr,
      priority, latitude, longitude, photoUrl
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

    const result = await pool.query(
      `INSERT INTO faults (station_id, reported_by, title, title_ar, description, description_ar,
                          priority, latitude, longitude, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, station_id, reported_by, title, title_ar, description, description_ar,
                 status, priority, latitude, longitude, photo_url, created_at, updated_at`,
      [stationId, req.user!.id, title, titleAr, description, descriptionAr,
       priority, latitude, longitude, photoUrl]
    );

    const fault = result.rows[0];
    logger.info(`User ${req.user!.email} created fault for station ${stationId}`);

    res.status(201).json({
      success: true,
      message: 'Fault reported successfully',
      data: {
        id: fault.id,
        stationId: fault.station_id,
        reportedBy: fault.reported_by,
        title: fault.title,
        titleAr: fault.title_ar,
        description: fault.description,
        descriptionAr: fault.description_ar,
        status: fault.status,
        priority: fault.priority,
        latitude: fault.latitude ? parseFloat(fault.latitude) : null,
        longitude: fault.longitude ? parseFloat(fault.longitude) : null,
        photoUrl: fault.photo_url,
        createdAt: fault.created_at,
        updatedAt: fault.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update fault
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = updateFaultSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const {
      title, titleAr, description, descriptionAr, status, priority,
      assignedTo, latitude, longitude, photoUrl
    } = value;

    const pool = getPool();

    // Verify assignee exists if provided
    if (assignedTo) {
      const assigneeResult = await pool.query(
        'SELECT id, role FROM users WHERE id = $1 AND role = $2',
        [assignedTo, 'operator']
      );

      if (assigneeResult.rows.length === 0) {
        throw createError('Invalid assignee ID', 400);
      }
    }

    let query = `
      UPDATE faults 
      SET title = COALESCE($1, title),
          title_ar = COALESCE($2, title_ar),
          description = COALESCE($3, description),
          description_ar = COALESCE($4, description_ar),
          status = COALESCE($5, status),
          priority = COALESCE($6, priority),
          assigned_to = COALESCE($7, assigned_to),
          latitude = COALESCE($8, latitude),
          longitude = COALESCE($9, longitude),
          photo_url = COALESCE($10, photo_url),
          resolved_at = CASE 
            WHEN COALESCE($5, status) = 'resolved' AND resolved_at IS NULL 
            THEN CURRENT_TIMESTAMP 
            ELSE resolved_at 
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
    `;

    const params = [
      title, titleAr, description, descriptionAr, status, priority,
      assignedTo, latitude, longitude, photoUrl, id
    ];

    // If user is operator, ensure they can only update faults for their stations
    if (req.user!.role === 'operator') {
      query += ` AND station_id IN (SELECT id FROM stations WHERE operator_id = $12)`;
      params.push(req.user!.id);
    }

    query += ` RETURNING id, station_id, reported_by, assigned_to, title, title_ar,
                      description, description_ar, status, priority, latitude, longitude,
                      photo_url, resolved_at, created_at, updated_at`;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      throw createError('Fault not found or access denied', 404);
    }

    const fault = result.rows[0];
    logger.info(`User ${req.user!.email} updated fault ${id}`);

    res.json({
      success: true,
      message: 'Fault updated successfully',
      data: {
        id: fault.id,
        stationId: fault.station_id,
        reportedBy: fault.reported_by,
        assignedTo: fault.assigned_to,
        title: fault.title,
        titleAr: fault.title_ar,
        description: fault.description,
        descriptionAr: fault.description_ar,
        status: fault.status,
        priority: fault.priority,
        latitude: fault.latitude ? parseFloat(fault.latitude) : null,
        longitude: fault.longitude ? parseFloat(fault.longitude) : null,
        photoUrl: fault.photo_url,
        resolvedAt: fault.resolved_at,
        createdAt: fault.created_at,
        updatedAt: fault.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete fault (admin only)
router.delete('/:id', authorize('admin'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    const result = await pool.query(
      'DELETE FROM faults WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw createError('Fault not found', 404);
    }

    logger.info(`Admin ${req.user!.email} deleted fault ${id}`);

    res.json({
      success: true,
      message: 'Fault deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

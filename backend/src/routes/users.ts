import express from 'express';
import Joi from 'joi';
import bcrypt from 'bcryptjs';
import { getPool } from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation schemas
const updateUserSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  phone: Joi.string().optional(),
  isActive: Joi.boolean().optional()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

// Get all users (admin only)
router.get('/', authorize('admin'), async (req: AuthRequest, res, next) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, role, phone, is_active, 
              last_login, created_at, updated_at 
       FROM users 
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        phone: user.phone,
        isActive: user.is_active,
        lastLogin: user.last_login,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get current user profile
router.get('/profile', async (req: AuthRequest, res, next) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, role, phone, is_active, 
              last_login, created_at, updated_at 
       FROM users 
       WHERE id = $1`,
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      throw createError('User not found', 404);
    }

    const user = result.rows[0];
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        phone: user.phone,
        isActive: user.is_active,
        lastLogin: user.last_login,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', async (req: AuthRequest, res, next) => {
  try {
    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const { firstName, lastName, phone } = value;
    const pool = getPool();

    const result = await pool.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, email, first_name, last_name, role, phone, updated_at`,
      [firstName, lastName, phone, req.user!.id]
    );

    if (result.rows.length === 0) {
      throw createError('User not found', 404);
    }

    const user = result.rows[0];
    logger.info(`User ${user.email} updated their profile`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        phone: user.phone,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.put('/change-password', async (req: AuthRequest, res, next) => {
  try {
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const { currentPassword, newPassword } = value;
    const pool = getPool();

    // Get current password hash
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      throw createError('User not found', 404);
    }

    const { password_hash } = result.rows[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, password_hash);
    if (!isValidPassword) {
      throw createError('Current password is incorrect', 400);
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, req.user!.id]
    );

    logger.info(`User ${req.user!.email} changed their password`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Update user (admin only)
router.put('/:id', authorize('admin'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const { firstName, lastName, phone, isActive } = value;
    const pool = getPool();

    const result = await pool.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           is_active = COALESCE($4, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, email, first_name, last_name, role, phone, is_active, updated_at`,
      [firstName, lastName, phone, isActive, id]
    );

    if (result.rows.length === 0) {
      throw createError('User not found', 404);
    }

    const user = result.rows[0];
    logger.info(`Admin ${req.user!.email} updated user ${user.email}`);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        phone: user.phone,
        isActive: user.is_active,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete user (admin only)
router.delete('/:id', authorize('admin'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    // Prevent admin from deleting themselves
    if (id === req.user!.id) {
      throw createError('Cannot delete your own account', 400);
    }

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING email',
      [id]
    );

    if (result.rows.length === 0) {
      throw createError('User not found', 404);
    }

    logger.info(`Admin ${req.user!.email} deleted user ${result.rows[0].email}`);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { getPool } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  phone: Joi.string().optional(),
  role: Joi.string().valid('admin', 'operator').default('operator')
});

// Login endpoint
router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const { email, password } = value;
    const pool = getPool();

    // Find user by email
    const result = await pool.query(
      'SELECT id, email, password_hash, first_name, last_name, role, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw createError('Invalid credentials', 401);
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw createError('Account is deactivated', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw createError('Invalid credentials', 401);
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      throw createError('JWT secret not configured', 500);
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    logger.info(`User ${user.email} logged in successfully`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Register endpoint (admin only)
router.post('/register', async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const { email, password, firstName, lastName, phone, role } = value;
    const pool = getPool();

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw createError('User already exists', 409);
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, role, phone, created_at`,
      [email, passwordHash, firstName, lastName, role, phone]
    );

    const newUser = result.rows[0];

    logger.info(`New user registered: ${newUser.email} with role ${newUser.role}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          role: newUser.role,
          phone: newUser.phone,
          createdAt: newUser.created_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Verify token endpoint
router.get('/verify', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('Access token required', 401);
    }

    const token = authHeader.substring(7);
    
    if (!process.env.JWT_SECRET) {
      throw createError('JWT secret not configured', 500);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    
    // Verify user still exists and is active
    const pool = getPool();
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      throw createError('User not found', 401);
    }

    const user = result.rows[0];
    
    if (!user.is_active) {
      throw createError('User account is deactivated', 401);
    }

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        }
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(createError('Invalid token', 401));
    } else if (error.name === 'TokenExpiredError') {
      next(createError('Token expired', 401));
    } else {
      next(error);
    }
  }
});

export default router;

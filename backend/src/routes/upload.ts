import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
  },
  fileFilter: fileFilter
});

// Upload single file
router.post('/single', upload.single('file'), async (req: any, res, next) => {
  try {
    if (!req.file) {
      throw createError('No file uploaded', 400);
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    logger.info(`File uploaded by user ${req.user!.email}: ${req.file.filename}`);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    next(error);
  }
});

// Upload multiple files
router.post('/multiple', upload.array('files', 5), async (req: any, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw createError('No files uploaded', 400);
    }

    const files = req.files.map((file: any) => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    }));
    
    logger.info(`Multiple files uploaded by user ${req.user!.email}: ${req.files.length} files`);

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      data: {
        files: files,
        count: files.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete file
router.delete('/:filename', async (req: any, res, next) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw createError('File not found', 404);
    }

    // Delete file
    fs.unlinkSync(filePath);
    
    logger.info(`File deleted by user ${req.user!.email}: ${filename}`);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get file info
router.get('/:filename', async (req: any, res, next) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw createError('File not found', 404);
    }

    const stats = fs.statSync(filePath);
    
    res.json({
      success: true,
      data: {
        filename: filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        url: `/uploads/${filename}`
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

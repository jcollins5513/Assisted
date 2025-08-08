import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Upload single image
router.post('/image', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw createError('No image file uploaded', 400);
    }

    const uploadedFile = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date()
    };

    res.json({
      message: 'Image uploaded successfully',
      file: uploadedFile
    });
  } catch (error) {
    next(error);
  }
});

// Upload multiple images
router.post('/images', upload.array('images', 10), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw createError('No images uploaded', 400);
    }

    const uploadedFiles = (req.files as Express.Multer.File[]).map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date()
    }));

    res.json({
      message: `${uploadedFiles.length} images uploaded successfully`,
      files: uploadedFiles
    });
  } catch (error) {
    next(error);
  }
});

// Process background removal
router.post('/background-removal', async (req, res, next) => {
  try {
    const { imagePath } = req.body;

    if (!imagePath) {
      throw createError('Image path is required', 400);
    }

    // This would integrate with remote background removal service
    // For now, return a mock response
    const processingResult = {
      originalImage: imagePath,
      processedImage: imagePath.replace('.jpg', '_no-bg.png'),
      processingTime: 15.2,
      success: true,
      quality: 'high'
    };

    res.json({
      message: 'Background removal completed successfully',
      result: processingResult
    });
  } catch (error) {
    next(error);
  }
});

// Get upload status
router.get('/status/:jobId', async (req, res, next) => {
  try {
    const { jobId } = req.params;

    // This would check the status of a background removal job
    const status = {
      jobId,
      status: 'completed',
      progress: 100,
      result: {
        originalImage: 'car-image.jpg',
        processedImage: 'car-image_no-bg.png',
        processingTime: 15.2
      }
    };

    res.json({ status });
  } catch (error) {
    next(error);
  }
});

// Delete uploaded file
router.delete('/:filename', async (req, res, next) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads', filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'File deleted successfully' });
    } else {
      throw createError('File not found', 404);
    }
  } catch (error) {
    next(error);
  }
});

export default router;

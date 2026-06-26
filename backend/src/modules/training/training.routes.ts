import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { authMiddleware } from '../auth/auth.middleware';
import { requireRole } from '../auth/rbac.middleware';
import { trainingController } from './training.controller';
import { UserRole } from '@prisma/client';

const router = Router();

// Ensure upload directory exists.
const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads', 'training-pdfs');
fs.mkdirSync(uploadsDir, { recursive: true });

// Save PDFs directly to disk with a UUID filename. We keep the original
// extension so the static middleware can serve it with the correct Content-Type.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.pdf';
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter: (req: Request, file: any, cb: any) => {
    if (file && file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * POST /api/training
 * Create a new training material
 * Admin only
 * For VIDEO: send title, machineModel, description (optional), type, videoUrl, thumbnailUrl (optional)
 * For PDF: send multipart/form-data with file, title, machineModel, description (optional), type
 */
router.post(
  '/',
  requireRole(UserRole.SUPER_ADMIN),
  upload.single('file'),
  trainingController.create.bind(trainingController)
);

/**
 * GET /api/training
 * List all training materials
 * All authenticated users
 * Query params:
 *   - search: searches title and machineModel
 *   - type: filter by VIDEO or PDF
 *   - machineModel: exact match filter
 */
router.get('/', trainingController.list.bind(trainingController));

/**
 * GET /api/training/:id
 * Get a single training material by ID
 * All authenticated users
 */
router.get('/:id', trainingController.getById.bind(trainingController));

/**
 * DELETE /api/training/:id
 * Delete a training material
 * Admin only
 * Removes the locally-stored PDF file if applicable.
 */
router.delete(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN),
  trainingController.delete.bind(trainingController)
);

export default router;

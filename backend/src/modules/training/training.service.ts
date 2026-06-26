import fs from 'fs';
import path from 'path';
import { prisma } from '../../config/database';
import { config } from '../../config/env';
import { logger } from '../../utils/logger';
import { CreateTrainingMaterialRequest, ListTrainingMaterialsQuery } from './training.types';
import { TrainingMaterialType } from '@prisma/client';
import { randomUUID } from 'crypto';

const UPLOADS_ROOT = path.join(__dirname, '..', '..', '..', 'uploads');
const PDF_PUBLIC_PREFIX = '/uploads/training-pdfs/';

export class TrainingService {
  /**
   * Create a new training material.
   * For PDF type, the file has already been written to disk by multer; we just
   * persist the public URL pointing at the static-served file.
   */
  async create(
    data: CreateTrainingMaterialRequest,
    userId: string,
    pdfFile?: Express.Multer.File
  ) {
    if (data.type === 'VIDEO') {
      if (!data.videoUrl) {
        throw new Error('videoUrl is required for VIDEO type');
      }
      this.validateYouTubeUrl(data.videoUrl);
    } else if (data.type === 'PDF') {
      if (!pdfFile) {
        throw new Error('PDF file is required for PDF type');
      }
      this.validatePdfFile(pdfFile);
    }

    // We persist a RELATIVE path ("/uploads/training-pdfs/<file>") so that the
    // record stays valid even if the server host (BASE_URL) changes — e.g. in
    // local dev when the laptop's LAN IP changes between WiFi networks. The
    // absolute URL is rebuilt at read time.
    let pdfPath: string | null = null;

    if (pdfFile) {
      pdfPath = `${PDF_PUBLIC_PREFIX}${pdfFile.filename}`;
    }

    const trainingMaterial = await prisma.training_materials.create({
      data: {
        id: randomUUID(),
        title: data.title,
        machineModel: data.machineModel,
        description: data.description || null,
        type: data.type as TrainingMaterialType,
        videoUrl: data.type === 'VIDEO' ? data.videoUrl : null,
        pdfUrl: data.type === 'PDF' ? pdfPath : null,
        thumbnailUrl: data.thumbnailUrl || null,
        uploadedBy: userId,
      },
    });

    return this.withResolvedUrls(trainingMaterial);
  }

  async list(query: ListTrainingMaterialsQuery) {
    const filters: any = {};

    if (query.search) {
      filters.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { machineModel: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.type) {
      filters.type = query.type as TrainingMaterialType;
    }

    if (query.machineModel) {
      filters.machineModel = query.machineModel;
    }

    const trainingMaterials = await prisma.training_materials.findMany({
      where: filters,
      include: {
        uploadedByUser: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return trainingMaterials.map((m) => this.withResolvedUrls(m));
  }

  async getById(id: string) {
    const trainingMaterial = await prisma.training_materials.findUnique({
      where: { id },
      include: {
        uploadedByUser: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!trainingMaterial) {
      throw new Error('Training material not found');
    }

    return this.withResolvedUrls(trainingMaterial);
  }

  /**
   * Delete a training material and remove its locally-stored PDF (if any).
   */
  async delete(id: string) {
    const trainingMaterial = await prisma.training_materials.findUnique({
      where: { id },
    });

    if (!trainingMaterial) {
      throw new Error('Training material not found');
    }

    if (trainingMaterial.type === 'PDF' && trainingMaterial.pdfUrl) {
      this.deleteLocalPdf(trainingMaterial.pdfUrl);
    }

    await prisma.training_materials.delete({
      where: { id },
    });

    return { message: 'Training material deleted successfully' };
  }

  private validateYouTubeUrl(url: string) {
    const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\//;
    if (!youtubeUrlRegex.test(url)) {
      throw new Error('Invalid YouTube URL');
    }
  }

  private validatePdfFile(file: Express.Multer.File) {
    const maxSizeBytes = 20 * 1024 * 1024; // 20MB

    if (file.mimetype !== 'application/pdf') {
      throw new Error('Only PDF files are allowed');
    }

    if (file.size > maxSizeBytes) {
      throw new Error('File size must not exceed 20MB');
    }
  }

  /**
   * Returns the absolute URL the mobile app should fetch for a stored pdfUrl.
   * Handles three cases:
   *   - stored as a relative path ("/uploads/..."): prepend current BASE_URL
   *   - stored as a legacy absolute URL that contains "/uploads/...": rewrite
   *     the host to the current BASE_URL so old records keep working when the
   *     server host changes
   *   - any other absolute URL (e.g. external storage): return unchanged
   */
  private resolveUrl(stored: string | null): string | null {
    if (!stored) return stored;
    const base = config.BASE_URL.replace(/\/+$/, '');

    if (stored.startsWith('/')) {
      return `${base}${stored}`;
    }

    const uploadsIdx = stored.indexOf(PDF_PUBLIC_PREFIX);
    if (uploadsIdx !== -1) {
      return `${base}${stored.substring(uploadsIdx)}`;
    }

    return stored;
  }

  private withResolvedUrls<T extends { pdfUrl?: string | null }>(material: T): T {
    return { ...material, pdfUrl: this.resolveUrl(material.pdfUrl ?? null) };
  }

  /**
   * Best-effort removal of the local file backing a stored pdfUrl.
   * Only deletes paths inside the uploads directory to guard against any
   * legacy/external URLs (e.g. old Cloudinary records) that don't map here.
   */
  private deleteLocalPdf(pdfUrl: string) {
    try {
      const marker = PDF_PUBLIC_PREFIX;
      const idx = pdfUrl.indexOf(marker);
      if (idx === -1) {
        return; // Not a locally-stored PDF (likely a legacy Cloudinary URL).
      }
      const filename = pdfUrl.substring(idx + marker.length).split('?')[0];
      if (!filename) return;

      const absPath = path.join(UPLOADS_ROOT, 'training-pdfs', filename);
      const normalized = path.normalize(absPath);
      if (!normalized.startsWith(path.normalize(UPLOADS_ROOT))) {
        return;
      }

      if (fs.existsSync(normalized)) {
        fs.unlinkSync(normalized);
      }
    } catch (error: any) {
      logger.error('Failed to delete local PDF', error.message);
    }
  }
}

export const trainingService = new TrainingService();

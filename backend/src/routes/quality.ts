import { Router } from 'express';
// import { authMiddleware } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { qualityAssessmentService } from '../services/qualityAssessmentService';
import path from 'path';

function withPublicUrls(a: any) {
  const processedFileName = a.imagePath ? path.basename(a.imagePath) : undefined;
  const originalFileName = a.originalPath ? path.basename(a.originalPath) : undefined;
  return {
    ...a,
    imageUrl: processedFileName ? `/uploads/processed/${processedFileName}` : undefined,
    originalUrl: originalFileName ? `/uploads/${originalFileName}` : undefined,
  };
}

const router = Router();

// List assessments
router.get('/', async (_req, res, next) => {
  try {
    const list = qualityAssessmentService.getAssessments();
    res.json({ success: true, data: list.map(withPublicUrls) });
  } catch (error) {
    next(createError('Failed to fetch assessments', 500));
  }
});

// Get assessment by id
router.get('/:id', async (req, res, next) => {
  try {
    const id = req.params['id'] as string;
    if (!id) return next(createError('id param required', 400));
    const item = qualityAssessmentService.getAssessment(id);
    if (!item) return next(createError('Assessment not found', 404));
    res.json({ success: true, data: withPublicUrls(item) });
  } catch (error) {
    next(createError('Failed to fetch assessment', 500));
  }
});

// Create assessments (single or batch)
router.post('/assess', async (req, res, next) => {
  try {
    const body = req.body as { imagePath?: string; originalPath?: string; images?: Array<{ imagePath: string; originalPath: string }> };
    if (Array.isArray(body.images) && body.images.length > 0) {
      const ids = await qualityAssessmentService.batchAssessQuality(body.images, { parallel: true, detailedAnalysis: true });
      return res.status(201).json({ success: true, data: { ids } });
    }
    if (!body.imagePath || !body.originalPath) {
      return next(createError('imagePath and originalPath are required', 400));
    }
    const id = await qualityAssessmentService.assessQuality(body.imagePath, body.originalPath, { detailedAnalysis: true });
    return res.status(201).json({ success: true, data: { id } });
  } catch (error) {
    next(createError('Failed to start assessment', 500));
  }
});

// Manual review
router.post('/:id/review', async (req, res, next) => {
  try {
    const id = req.params['id'] as string;
    if (!id) return next(createError('id param required', 400));
    const { approved, notes, qualityScore } = req.body as { approved: boolean; notes?: string; qualityScore?: number };
    if (approved === undefined) return next(createError('approved is required', 400));
    const payload: { approved: boolean; notes?: string; qualityScore?: number } = { approved };
    if (typeof notes === 'string') payload.notes = notes;
    if (typeof qualityScore === 'number') payload.qualityScore = qualityScore;
    await qualityAssessmentService.reviewAssessment(id, payload);
    const updated = qualityAssessmentService.getAssessment(id);
    res.json({ success: true, data: updated ? withPublicUrls(updated) : null });
  } catch (error) {
    next(createError('Failed to review assessment', 500));
  }
});

// Batch report
router.post('/batch-report', async (req, res, next) => {
  try {
    const { ids } = req.body as { ids: string[] };
    if (!Array.isArray(ids) || ids.length === 0) return next(createError('ids array required', 400));
    const report = await qualityAssessmentService.generateBatchReport(ids);
    res.json({ success: true, data: report });
  } catch (error) {
    next(createError('Failed to generate batch report', 500));
  }
});

export default router;



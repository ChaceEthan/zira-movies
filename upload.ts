import { Router, Request, Response } from 'express';
import { authenticateUser, requireRole } from './auth'; // Assuming auth is in backend/src/routes
import { r2Service } from './cloudflareR2';

const router = Router();

// POST /api/upload/presigned-url
// Generates a pre-signed URL for direct client-side upload to R2.
router.post('/presigned-url', authenticateUser, requireRole(['EDITOR', 'ADMIN', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  const { filename, contentType, contentId, contentTypeCategory, expiresInSeconds = 3600 } = req.body;

  if (!filename || !contentType || !contentId || !contentTypeCategory) {
    return res.status(400).json({ error: 'filename, contentType, contentId, and contentTypeCategory are required.' });
  }

  if (!r2Service.isConfigured()) {
    return res.status(503).json({ error: 'Cloudflare R2 service is not configured on the server.' });
  }

  if (typeof filename !== 'string' || filename.length > 120 || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(filename)) {
    return res.status(400).json({ error: 'filename must contain only letters, numbers, dots, underscores, or hyphens.' });
  }
  if (typeof contentId !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(contentId)) {
    return res.status(400).json({ error: 'Invalid contentId.' });
  }
  if (!Number.isInteger(expiresInSeconds) || expiresInSeconds < 60 || expiresInSeconds > 3600) {
    return res.status(400).json({ error: 'expiresInSeconds must be between 60 and 3600.' });
  }

  const allowedTypes: Record<string, string[]> = {
    movie_poster: ['image/jpeg', 'image/png', 'image/webp'],
    movie_backdrop: ['image/jpeg', 'image/png', 'image/webp'],
    movie_video: ['video/mp4', 'application/vnd.apple.mpegurl'],
    series_poster: ['image/jpeg', 'image/png', 'image/webp'],
    series_backdrop: ['image/jpeg', 'image/png', 'image/webp'],
  };
  if (typeof contentType !== 'string' || !allowedTypes[contentTypeCategory]?.includes(contentType)) {
    return res.status(400).json({ error: 'Unsupported content type for this upload category.' });
  }

  let objectKey: string;
  try {
    switch (contentTypeCategory) {
      case 'movie_poster':
        objectKey = r2Service.getMoviePath(contentId, 'poster', filename);
        break;
      case 'movie_backdrop':
        objectKey = r2Service.getMoviePath(contentId, 'backdrop', filename);
        break;
      case 'movie_video':
        objectKey = r2Service.getMoviePath(contentId, 'video', filename);
        break;
      case 'series_poster':
        objectKey = r2Service.getSeriesPath(contentId, 'poster', filename);
        break;
      case 'series_backdrop':
        objectKey = r2Service.getSeriesPath(contentId, 'backdrop', filename);
        break;
      // Add more cases for episode video, thumbnail, subtitle etc. if needed
      default:
        return res.status(400).json({ error: 'Invalid contentTypeCategory.' });
    }

    const presignedUrl = await r2Service.createPresignedUploadUrl(objectKey, contentType, Number(expiresInSeconds));
    const publicUrl = r2Service.getPublicUrl(objectKey);
    return res.json({ presignedUrl, publicUrl, objectKey });
  } catch (error: any) {
    console.error('Error generating pre-signed URL:', error);
    return res.status(500).json({ error: 'Failed to generate pre-signed URL.' });
  }
});

export default router;
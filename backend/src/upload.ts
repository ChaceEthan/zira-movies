import { Router } from 'express';
import { authenticateUser, requireRole } from './auth';
import { r2Service } from './services/cloudflareR2';

const router = Router();

// POST /api/upload/presigned-url
// Generates a pre-signed URL for direct client-side upload to R2.
router.post('/presigned-url', authenticateUser, requireRole(['EDITOR', 'ADMIN', 'SUPER_ADMIN']), async (req, res) => {
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
    movie_video: ['video/mp4'],
    movie_subtitle: ['text/vtt', 'application/x-subrip'],
    series_poster: ['image/jpeg', 'image/png', 'image/webp'],
    series_backdrop: ['image/jpeg', 'image/png', 'image/webp'],
    episode_video: ['video/mp4'],
    episode_subtitle: ['text/vtt', 'application/x-subrip'],
    episode_thumbnail: ['image/jpeg', 'image/png', 'image/webp'],
    sponsor_banner: ['image/jpeg', 'image/png', 'image/webp'],
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
        objectKey = r2Service.getMoviePath(contentId, 'source', filename);
        break;
      case 'movie_subtitle':
        objectKey = r2Service.getMoviePath(contentId, 'subtitles', filename);
        break;
      case 'series_poster':
        objectKey = r2Service.getSeriesPath(contentId, 'poster', filename);
        break;
      case 'series_backdrop':
        objectKey = r2Service.getSeriesPath(contentId, 'backdrop', filename);
        break;
      case 'episode_video':
      case 'episode_subtitle':
      case 'episode_thumbnail': {
        const seasonNumber = Number(req.body.seasonNumber);
        const episodeNumber = Number(req.body.episodeNumber);
        if (!Number.isInteger(seasonNumber) || seasonNumber < 1 || !Number.isInteger(episodeNumber) || episodeNumber < 1) {
          return res.status(400).json({ error: 'Valid seasonNumber and episodeNumber are required for episode uploads.' });
        }
        const category = contentTypeCategory === 'episode_video' ? 'source' : contentTypeCategory === 'episode_subtitle' ? 'subtitles' : 'thumbnail';
        objectKey = r2Service.getEpisodePath(contentId, seasonNumber, episodeNumber, category, filename);
        break;
      }
      case 'sponsor_banner':
        if (req.body.campaignId !== undefined && (typeof req.body.campaignId !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(req.body.campaignId))) {
          return res.status(400).json({ error: 'Invalid campaignId.' });
        }
        objectKey = r2Service.getSponsorPath(contentId, req.body.campaignId || 'assets', filename);
        break;
      default:
        return res.status(400).json({ error: 'Invalid contentTypeCategory.' });
    }

    const presignedUrl = await r2Service.createPresignedUploadUrl(objectKey, contentType, Number(expiresInSeconds));
    const publicUrl = r2Service.getPublicUrl(objectKey);
    return res.json({ presignedUrl, publicUrl, objectKey });
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    return res.status(503).json({ error: 'Cloudflare R2 is unavailable or misconfigured.' });
  }
});

export default router;
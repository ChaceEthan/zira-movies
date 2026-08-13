import { Router, Request, Response } from 'express';
import { contentService } from '../services/contentService'; // Relative path to services

const router = Router();

// GET /api/content/top-10-featured
// Fetches the top 10 featured movies and series, sorted by their top10Rank.
router.get('/top-10-featured', async (req: Request, res: Response) => {
  try {
    const top10Content = await contentService.getTop10FeaturedContent();
    res.json(top10Content);
  } catch (error: any) {
    console.error('Error fetching top 10 featured content:', error);
    // In a production environment, consider logging the full error but sending a generic message to the client
    res.status(500).json({ error: 'Failed to fetch top 10 featured content.', details: error.message });
  }
});

export default router;
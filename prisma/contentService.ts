import prisma from './prisma';
import { Movie, Series } from '@prisma/client';

// Define a common interface for content to be returned by the service
interface FeaturedContentItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  trailerUrl: string | null;
  isFeatured: boolean;
  isTop10: boolean;
  top10Rank: number | null;
  type: 'Movie' | 'Series'; // To distinguish content type in the frontend
}

export const contentService = {
  /**
   * Fetches the top 10 featured movies and series, sorted by their global top10Rank.
   * Content must be marked as `isFeatured`, `isTop10`, have a `top10Rank`, and be `PUBLISHED`.
   * @returns A promise that resolves to an array of FeaturedContentItem.
   */
  async getTop10FeaturedContent(): Promise<FeaturedContentItem[]> {
    // Fetch all relevant movies that are featured, in top 10, have a rank, and are published
    const featuredMovies = await prisma.movie.findMany({
      where: {
        isFeatured: true,
        isTop10: true,
        top10Rank: { not: null }, // Ensure a rank is assigned
        state: 'PUBLISHED', // Only fetch published content
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        posterUrl: true,
        backdropUrl: true,
        trailerUrl: true,
        isFeatured: true,
        isTop10: true,
        top10Rank: true,
      },
    });

    // Fetch all relevant series that are featured, in top 10, have a rank, and are published
    const featuredSeries = await prisma.series.findMany({
      where: {
        isFeatured: true,
        isTop10: true,
        top10Rank: { not: null }, // Ensure a rank is assigned
        state: 'PUBLISHED', // Only fetch published content
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        posterUrl: true,
        backdropUrl: true,
        trailerUrl: true,
        isFeatured: true,
        isTop10: true,
        top10Rank: true,
      },
    });

    // Combine and map to a common interface, then sort by rank and take the top 10
    const combinedContent: FeaturedContentItem[] = [
      ...featuredMovies.map(m => ({ ...m, type: 'Movie' as const })),
      ...featuredSeries.map(s => ({ ...s, type: 'Series' as const })),
    ];

    return combinedContent
      .sort((a, b) => (a.top10Rank || Infinity) - (b.top10Rank || Infinity)) // Sort by rank, null ranks go to end
      .slice(0, 10); // Take only the top 10
  },
};
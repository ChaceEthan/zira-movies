import { AdPlacementType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from './prisma';
import {
  SEED_GENRES,
  ALL_SEED_MOVIES,
  SEED_SERIES,
  LEGACY_REMOVED_MOVIE_SLUGS,
  LEGACY_REMOVED_SERIES_SLUGS,
} from '../src/catalogSeedData';

const AD_PLACEMENTS: AdPlacementType[] = [
  'HOME_BETWEEN_RAILS',
  'HOME_BOTTOM_BANNER',
  'BROWSE_BANNER',
  'SEARCH_NATIVE',
  'MOVIE_DETAILS_BANNER',
  'SERIES_DETAILS_BANNER',
  'PLAYER_COMPANION',
  'FOOTER_BANNER',
];

export async function seedDatabase(): Promise<{
  moviesSeeded: number;
  seriesSeeded: number;
  genresSeeded: number;
  legacyRemoved: number;
}> {
  // 1. Seed AdPlacement records idempotently
  for (const type of AD_PLACEMENTS) {
    await prisma.adPlacement.upsert({
      where: { type },
      update: {},
      create: {
        type,
        displayName: type.replace(/_/g, ' '),
        active: true,
      },
    });
  }

  // 2. Seed Genres idempotently
  for (const genre of SEED_GENRES) {
    await prisma.genre.upsert({
      where: { slug: genre.slug },
      update: { name: genre.name, description: genre.description },
      create: {
        name: genre.name,
        slug: genre.slug,
        description: genre.description,
      },
    });
  }

  // 3. Remove obsolete fictional seeded movies and series (preserving any admin-uploaded records)
  let legacyRemoved = 0;
  if (typeof (prisma.movie as any).deleteMany === 'function') {
    const deletedMovies = await (prisma.movie as any).deleteMany({
      where: { slug: { in: LEGACY_REMOVED_MOVIE_SLUGS } },
    });
    legacyRemoved += deletedMovies?.count || 0;
  }
  if (typeof (prisma.series as any).deleteMany === 'function') {
    await (prisma.series as any).deleteMany({
      where: { slug: { in: LEGACY_REMOVED_SERIES_SLUGS } },
    });
  }

  // 4. Seed the 6 curated open-licensed / demo movies idempotently
  for (const movie of ALL_SEED_MOVIES) {
    await prisma.movie.upsert({
      where: { slug: movie.slug },
      update: {
        title: movie.title,
        description: movie.description,
        releaseYear: movie.releaseYear,
        durationMinutes: movie.durationMinutes,
        maturityRating: movie.maturityRating,
        language: movie.language,
        subtitlesAvailable: movie.subtitlesAvailable,
        posterUrl: movie.posterUrl,
        backdropUrl: movie.backdropUrl,
        trailerUrl: movie.trailerUrl,
        videoUrl: movie.videoUrl,
        contentRights: {
          upsert: {
            create: {
              rightsStatus: movie.rightsStatus,
              rightsHolder: movie.rightsHolder,
              licenseReference: movie.licenseReference,
              territories: movie.territories,
              rightsStartDate: new Date(Date.now() - 86400000 * 7),
            },
            update: {
              rightsStatus: movie.rightsStatus,
              rightsHolder: movie.rightsHolder,
              licenseReference: movie.licenseReference,
              territories: movie.territories,
            },
          },
        },
      },
      create: {
        title: movie.title,
        slug: movie.slug,
        description: movie.description,
        releaseYear: movie.releaseYear,
        durationMinutes: movie.durationMinutes,
        maturityRating: movie.maturityRating,
        language: movie.language,
        subtitlesAvailable: movie.subtitlesAvailable,
        isFeatured: movie.isFeatured,
        isTrending: movie.isTrending,
        isRwandanContent: movie.isRwandanContent,
        isAfricanContent: movie.isAfricanContent,
        isTop10: movie.isTop10,
        top10Rank: movie.top10Rank ?? null,
        viewCount: movie.viewCount,
        likeCount: movie.likeCount,
        averageRating: movie.averageRating,
        state: movie.state,
        posterUrl: movie.posterUrl,
        backdropUrl: movie.backdropUrl,
        trailerUrl: movie.trailerUrl,
        videoUrl: movie.videoUrl,
        movieGenres: {
          create: movie.genres.map(slug => ({
            genre: { connect: { slug } },
          })),
        },
        contentRights: {
          create: {
            rightsStatus: movie.rightsStatus,
            rightsHolder: movie.rightsHolder,
            licenseReference: movie.licenseReference,
            territories: movie.territories,
            rightsStartDate: new Date(Date.now() - 86400000 * 7),
          },
        },
      },
    });
  }

  // 5. Seed curated open-media demo Series with Seasons & Episodes idempotently
  for (const ser of SEED_SERIES) {
    const upsertedSeries = await prisma.series.upsert({
      where: { slug: ser.slug },
      update: {},
      create: {
        title: ser.title,
        slug: ser.slug,
        description: ser.description,
        releaseYear: ser.releaseYear,
        maturityRating: ser.maturityRating,
        language: ser.language,
        isFeatured: ser.isFeatured,
        isTrending: ser.isTrending,
        isRwandanContent: ser.isRwandanContent,
        isAfricanContent: ser.isAfricanContent,
        isTop10: ser.isTop10,
        top10Rank: ser.top10Rank ?? null,
        viewCount: ser.viewCount,
        averageRating: ser.averageRating,
        state: ser.state,
        posterUrl: ser.posterUrl,
        backdropUrl: ser.backdropUrl,
        trailerUrl: ser.trailerUrl,
        seriesGenres: {
          create: ser.genres.map(slug => ({
            genre: { connect: { slug } },
          })),
        },
        contentRights: {
          create: {
            rightsStatus: ser.rightsStatus,
            rightsHolder: ser.rightsHolder,
            licenseReference: ser.licenseReference,
            territories: ['GLOBAL', 'RW'],
            rightsStartDate: new Date(Date.now() - 86400000 * 7),
          },
        },
      },
    });

    for (const sea of ser.seasons) {
      const upsertedSeason = await prisma.season.upsert({
        where: {
          seriesId_seasonNumber: {
            seriesId: upsertedSeries.id,
            seasonNumber: sea.seasonNumber,
          },
        },
        update: {},
        create: {
          seriesId: upsertedSeries.id,
          seasonNumber: sea.seasonNumber,
          title: sea.title,
          description: sea.description,
        },
      });

      for (const ep of sea.episodes) {
        await prisma.episode.upsert({
          where: {
            seasonId_episodeNumber: {
              seasonId: upsertedSeason.id,
              episodeNumber: ep.episodeNumber,
            },
          },
          update: {},
          create: {
            seasonId: upsertedSeason.id,
            episodeNumber: ep.episodeNumber,
            title: ep.title,
            description: ep.description,
            durationMinutes: ep.durationMinutes,
            thumbnailUrl: ep.thumbnailUrl,
            videoUrl: ep.videoUrl,
            state: ep.state,
          },
        });
      }
    }
  }

  // 6. Optional secure initial Admin provisioning via environment variables
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminInitialPassword = process.env.ADMIN_INITIAL_PASSWORD;
  if (adminEmail && adminInitialPassword && adminInitialPassword.length >= 10) {
    const passwordHash = await bcrypt.hash(adminInitialPassword, 12);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: 'SUPER_ADMIN', emailVerified: true },
      create: {
        email: adminEmail,
        passwordHash,
        displayName: 'ZIRA Administrator',
        role: 'SUPER_ADMIN',
        emailVerified: true,
      },
    });
  }

  return {
    genresSeeded: SEED_GENRES.length,
    moviesSeeded: ALL_SEED_MOVIES.length,
    seriesSeeded: SEED_SERIES.length,
    legacyRemoved,
  };
}

const isDirectExecution = process.argv[1]?.includes('seed');
if (isDirectExecution) {
  seedDatabase()
    .then(summary => {
      console.log(
        `ZIRA catalog seeded: ${summary.moviesSeeded} movies, ${summary.seriesSeeded} series, ${summary.genresSeeded} genres (removed ${summary.legacyRemoved} obsolete fictional entries).`,
      );
    })
    .catch(error => {
      console.error('Database seed failed:', error);
      process.exitCode = 1;
    })
    .finally(async () => prisma.$disconnect());
}

import { Router } from 'express';
import prisma from '../../prisma/prisma';
import { authenticateUser, requireRole, type AuthenticatedRequest } from '../auth';
import {
  getAllInterpreters,
  getInterpreterAssignments,
  upsertInterpreterProfile,
  deleteInterpreterProfile,
  assignContentInterpreter,
} from '../services/platformState';

const router = Router();
const editors = ['EDITOR', 'ADMIN', 'SUPER_ADMIN'];

function formatPublicMovieSummary(movie: any, assignment?: { interpreterSlug: string; interpreterName: string; badgeIndicator?: 'NEW' | 'UPDATED' | null }) {
  const genres = Array.isArray(movie.movieGenres)
    ? movie.movieGenres.map((entry: any) => entry.genre?.slug || entry.genreId).filter(Boolean)
    : Array.isArray(movie.genres)
      ? movie.genres
      : [];
  const rights = movie.contentRights || movie.rights || undefined;
  return {
    ...movie,
    posterUrl: movie.posterUrl || '',
    backdropUrl: movie.backdropUrl || movie.posterUrl || '',
    trailerUrl: movie.trailerUrl || '',
    videoUrl: movie.videoUrl || '',
    subtitlesAvailable: Array.isArray(movie.subtitlesAvailable) ? movie.subtitlesAvailable : ['en'],
    genres: genres.length > 0 ? genres : ['drama'],
    cast: Array.isArray(movie.cast) ? movie.cast : [],
    country: Array.isArray(rights?.territories) && rights.territories.length > 0 ? rights.territories.join(', ') : 'GLOBAL',
    interpreterSlug: assignment?.interpreterSlug || movie.interpreterSlug || undefined,
    interpreterName: assignment?.interpreterName || movie.interpreterName || undefined,
    badgeIndicator: assignment?.badgeIndicator ?? movie.badgeIndicator ?? null,
    rights,
  };
}

function formatPublicSeriesSummary(series: any, assignment?: { interpreterSlug: string; interpreterName: string; badgeIndicator?: 'NEW' | 'UPDATED' | null }) {
  const genres = Array.isArray(series.seriesGenres)
    ? series.seriesGenres.map((entry: any) => entry.genre?.slug || entry.genreId).filter(Boolean)
    : Array.isArray(series.genres)
      ? series.genres
      : [];
  return {
    ...series,
    posterUrl: series.posterUrl || '',
    backdropUrl: series.backdropUrl || series.posterUrl || '',
    trailerUrl: series.trailerUrl || '',
    genres: genres.length > 0 ? genres : ['drama'],
    seasons: Array.isArray(series.seasons) ? series.seasons : [],
    interpreterSlug: assignment?.interpreterSlug || series.interpreterSlug || undefined,
    interpreterName: assignment?.interpreterName || series.interpreterName || undefined,
    badgeIndicator: assignment?.badgeIndicator ?? series.badgeIndicator ?? null,
    rights: series.contentRights || series.rights || undefined,
  };
}

async function buildEnrichedInterpreters(includeInactive = false) {
  const [interpreters, assignments, publishedMovies, publishedSeries] = await Promise.all([
    getAllInterpreters(includeInactive),
    getInterpreterAssignments(),
    prisma.movie.findMany({
      where: { state: 'PUBLISHED' },
      include: { movieGenres: { include: { genre: true } }, contentRights: true },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.series.findMany({
      where: { state: 'PUBLISHED' },
      include: {
        seasons: {
          include: { episodes: { orderBy: { episodeNumber: 'asc' } } },
          orderBy: { seasonNumber: 'asc' },
        },
        seriesGenres: { include: { genre: true } },
        contentRights: true,
      },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    }),
  ]);

  return interpreters.map(interp => {
    const matchingMovies = publishedMovies
      .filter(m => {
        const assign = assignments.movies[m.slug] || assignments.movies[m.id];
        return assign?.interpreterSlug === interp.slug || (m as any).interpreterSlug === interp.slug;
      })
      .map(m => formatPublicMovieSummary(m, assignments.movies[m.slug] || assignments.movies[m.id]));

    const matchingSeries = publishedSeries
      .filter(s => {
        const assign = assignments.series[s.slug] || assignments.series[s.id];
        if (assign?.interpreterSlug === interp.slug || (s as any).interpreterSlug === interp.slug) {
          return true;
        }
        const seasons = Array.isArray((s as any).seasons) ? (s as any).seasons : [];
        return seasons.some((sea: any) =>
          Array.isArray(sea.episodes) &&
          sea.episodes.some((ep: any) => assignments.episodes[ep.id]?.interpreterSlug === interp.slug),
        );
      })
      .map(s => formatPublicSeriesSummary(s, assignments.series[s.slug] || assignments.series[s.id]));

    return {
      ...interp,
      publishedMovies: matchingMovies,
      publishedSeries: matchingSeries,
      movieCount: matchingMovies.length,
      seriesCount: matchingSeries.length,
      totalContentCount: matchingMovies.length + matchingSeries.length,
    };
  });
}

router.get('/', async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const interpreters = await buildEnrichedInterpreters(includeInactive);
    res.json({ interpreters });
  } catch (error) {
    next(error);
  }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const interpreters = await buildEnrichedInterpreters(true);
    const found = interpreters.find(
      i => i.slug === req.params.slug.toLowerCase() || i.id === req.params.slug,
    );
    if (!found) {
      res.status(404).json({ error: 'Interpreter profile not found.' });
      return;
    }
    res.json({ interpreter: found });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticateUser, requireRole(editors), async (req: AuthenticatedRequest, res, next) => {
  try {
    const displayName = typeof req.body.displayName === 'string' ? req.body.displayName.trim() : '';
    if (!displayName) {
      res.status(400).json({ error: 'Interpreter displayName is required.' });
      return;
    }

    const profile = await upsertInterpreterProfile({
      displayName,
      slug: typeof req.body.slug === 'string' ? req.body.slug : undefined,
      photoUrl: typeof req.body.photoUrl === 'string' ? req.body.photoUrl : undefined,
      biography: typeof req.body.biography === 'string' ? req.body.biography : undefined,
      socialLinks: typeof req.body.socialLinks === 'object' && req.body.socialLinks ? req.body.socialLinks : undefined,
      specialtyGenres: Array.isArray(req.body.specialtyGenres) ? req.body.specialtyGenres : undefined,
      isFeatured: typeof req.body.isFeatured === 'boolean' ? req.body.isFeatured : true,
      isExampleProfile: typeof req.body.isExampleProfile === 'boolean' ? req.body.isExampleProfile : false,
      active: typeof req.body.active === 'boolean' ? req.body.active : true,
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.auth!.userId,
        action: 'CREATE_INTERPRETER',
        entityType: 'Interpreter',
        entityId: profile.id,
        metadata: JSON.stringify({ displayName: profile.displayName, slug: profile.slug }),
      },
    });

    const enriched = await buildEnrichedInterpreters(true);
    const full = enriched.find(i => i.slug === profile.slug) || {
      ...profile,
      publishedMovies: [],
      publishedSeries: [],
      movieCount: 0,
      seriesCount: 0,
      totalContentCount: 0,
    };

    res.status(201).json({ interpreter: full });
  } catch (error) {
    next(error);
  }
});

router.patch('/:slugOrId', authenticateUser, requireRole(editors), async (req: AuthenticatedRequest, res, next) => {
  try {
    const existingList = await getAllInterpreters(true);
    const existing = existingList.find(i => i.slug === req.params.slugOrId || i.id === req.params.slugOrId);
    if (!existing) {
      res.status(404).json({ error: 'Interpreter profile not found.' });
      return;
    }

    const updated = await upsertInterpreterProfile({
      id: existing.id,
      displayName: typeof req.body.displayName === 'string' && req.body.displayName.trim() ? req.body.displayName : existing.displayName,
      slug: existing.slug,
      photoUrl: typeof req.body.photoUrl === 'string' ? req.body.photoUrl : existing.photoUrl,
      biography: typeof req.body.biography === 'string' ? req.body.biography : existing.biography,
      socialLinks: typeof req.body.socialLinks === 'object' && req.body.socialLinks ? req.body.socialLinks : existing.socialLinks,
      specialtyGenres: Array.isArray(req.body.specialtyGenres) ? req.body.specialtyGenres : existing.specialtyGenres,
      isFeatured: typeof req.body.isFeatured === 'boolean' ? req.body.isFeatured : existing.isFeatured,
      isExampleProfile: typeof req.body.isExampleProfile === 'boolean' ? req.body.isExampleProfile : existing.isExampleProfile,
      active: typeof req.body.active === 'boolean' ? req.body.active : existing.active,
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.auth!.userId,
        action: 'UPDATE_INTERPRETER',
        entityType: 'Interpreter',
        entityId: updated.id,
        metadata: JSON.stringify({ displayName: updated.displayName, slug: updated.slug, active: updated.active }),
      },
    });

    const enriched = await buildEnrichedInterpreters(true);
    const full = enriched.find(i => i.slug === updated.slug) || updated;
    res.json({ interpreter: full });
  } catch (error) {
    next(error);
  }
});

router.post('/assign', authenticateUser, requireRole(editors), async (req: AuthenticatedRequest, res, next) => {
  try {
    const entityType = req.body.entityType;
    const key = typeof req.body.key === 'string' ? req.body.key.trim() : '';
    if (!['movie', 'series', 'episode'].includes(entityType) || !key) {
      res.status(400).json({ error: 'Valid entityType (movie, series, episode) and key are required.' });
      return;
    }

    await assignContentInterpreter({
      entityType,
      key,
      interpreterSlug: typeof req.body.interpreterSlug === 'string' ? req.body.interpreterSlug : null,
      interpreterName: typeof req.body.interpreterName === 'string' ? req.body.interpreterName : null,
      badgeIndicator:
        req.body.badgeIndicator === 'NEW' || req.body.badgeIndicator === 'UPDATED' || req.body.badgeIndicator === null
          ? req.body.badgeIndicator
          : undefined,
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.auth!.userId,
        action: 'ASSIGN_INTERPRETER',
        entityType,
        entityId: key,
        metadata: JSON.stringify({
          interpreterSlug: req.body.interpreterSlug,
          badgeIndicator: req.body.badgeIndicator,
        }),
      },
    });

    res.json({ message: 'Interpreter assignment updated.' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:slugOrId', authenticateUser, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const removed = await deleteInterpreterProfile(req.params.slugOrId);
    if (!removed) {
      res.status(404).json({ error: 'Interpreter profile not found.' });
      return;
    }

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.auth!.userId,
        action: 'DELETE_INTERPRETER',
        entityType: 'Interpreter',
        entityId: removed.id,
        metadata: JSON.stringify({ displayName: removed.displayName, slug: removed.slug }),
      },
    });

    res.json({ message: `Interpreter "${removed.displayName}" removed.` });
  } catch (error) {
    next(error);
  }
});

export default router;

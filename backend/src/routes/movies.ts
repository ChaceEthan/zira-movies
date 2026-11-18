import { Router } from 'express';
import prisma from '../../prisma/prisma';
import { seedDatabase } from '../../prisma/seed';
import { authenticateUser, requireRole, type AuthenticatedRequest } from '../auth';
import { r2Service } from '../services/cloudflareR2';

const router = Router();
const editors = ['EDITOR', 'ADMIN', 'SUPER_ADMIN'];
const allowedRights = ['OWNED', 'LICENSED', 'PERMISSION_GRANTED', 'PUBLIC_DOMAIN', 'PENDING_VERIFICATION', 'EXPIRED'] as const;
const allowedStates = ['DRAFT', 'UPLOADED', 'PROCESSING', 'READY', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'] as const;
const verifiedPublishRights = ['OWNED', 'LICENSED', 'PERMISSION_GRANTED', 'PUBLIC_DOMAIN'] as const;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90);
}

function parseStringList(value: unknown, fallback: string[] = []): string[] {
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }
  return fallback;
}

function parseOptionalDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function formatMovie(movie: any) {
  const genres = Array.isArray(movie.movieGenres)
    ? movie.movieGenres.map((entry: any) => entry.genre?.slug || entry.genreId).filter(Boolean)
    : Array.isArray(movie.genres)
      ? movie.genres
      : [];
  const cast = Array.isArray(movie.cast)
    ? movie.cast
    : Array.isArray(movie.castMembers)
      ? movie.castMembers.map((cm: any) => cm.castMember?.name || cm.characterName).filter(Boolean)
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
    cast,
    country: Array.isArray(rights?.territories) && rights.territories.length > 0 ? rights.territories.join(', ') : 'GLOBAL',
    rights,
  };
}

async function ensureGenres(slugs: string[]) {
  const cleanSlugs = Array.from(new Set(slugs.map(s => slugify(s)).filter(Boolean)));
  for (const slug of cleanSlugs) {
    const name = slug
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    await prisma.genre.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
  }
  return cleanSlugs;
}

async function resolveUniqueMovieSlug(requestedSlugOrTitle: string, excludeMovieId?: string): Promise<string> {
  const base = slugify(requestedSlugOrTitle) || `movie-${Date.now().toString(36)}`;
  const existing = await prisma.movie.findUnique({ where: { slug: base } });
  if (!existing || existing.id === excludeMovieId) {
    return base;
  }
  return `${base}-${Date.now().toString(36).slice(-4)}`;
}

async function isMediaUrlOrKeyReferencedElsewhere(urlOrKey: string, excludeMovieId: string): Promise<boolean> {
  const targetKey = r2Service.extractObjectKeyFromUrl(urlOrKey);
  const allMovies = await prisma.movie.findMany();
  for (const m of allMovies) {
    if (m.id === excludeMovieId) continue;
    const urls = [m.posterUrl, m.backdropUrl, m.trailerUrl, m.videoUrl].filter(Boolean) as string[];
    if (urls.includes(urlOrKey)) return true;
    if (targetKey && urls.some(u => r2Service.extractObjectKeyFromUrl(u) === targetKey)) return true;
  }

  const allSeries = await prisma.series.findMany();
  for (const s of allSeries) {
    const urls = [s.posterUrl, s.backdropUrl, s.trailerUrl].filter(Boolean) as string[];
    if (urls.includes(urlOrKey)) return true;
    if (targetKey && urls.some(u => r2Service.extractObjectKeyFromUrl(u) === targetKey)) return true;
  }

  if (typeof (prisma.episode as any).findMany === 'function') {
    const allEpisodes = await (prisma.episode as any).findMany();
    for (const ep of allEpisodes) {
      const urls = [ep.thumbnailUrl, ep.videoUrl].filter(Boolean) as string[];
      if (urls.includes(urlOrKey)) return true;
      if (targetKey && urls.some(u => r2Service.extractObjectKeyFromUrl(u) === targetKey)) return true;
    }
  }

  if (typeof (prisma.videoAsset as any).findMany === 'function') {
    const allAssets = await (prisma.videoAsset as any).findMany();
    for (const asset of allAssets) {
      if (asset.movieId === excludeMovieId) continue;
      if (asset.sourceKey === urlOrKey || (targetKey && asset.sourceKey === targetKey)) return true;
    }
  }

  return false;
}

router.get('/', async (_req, res, next) => {
  try {
    let movies = await prisma.movie.findMany({
      where: { state: 'PUBLISHED' },
      include: { movieGenres: { include: { genre: true } }, contentRights: true },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    });
    if (movies.length === 0) {
      const totalCount = await prisma.movie.count();
      if (totalCount === 0) {
        await seedDatabase();
        movies = await prisma.movie.findMany({
          where: { state: 'PUBLISHED' },
          include: { movieGenres: { include: { genre: true } }, contentRights: true },
          orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        });
      }
    }
    res.json({ movies: movies.map(formatMovie) });
  } catch (error) {
    next(error);
  }
});

router.get('/slug/:slug', async (req, res, next) => {
  try {
    const movie = await prisma.movie.findFirst({
      where: { slug: req.params.slug, state: 'PUBLISHED' },
      include: { movieGenres: { include: { genre: true } }, contentRights: true },
    });
    if (!movie) {
      res.status(404).json({ error: 'Movie not found.' });
      return;
    }
    res.json({ movie: formatMovie(movie) });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticateUser, requireRole(editors), async (req: AuthenticatedRequest, res, next) => {
  try {
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
    const year = Number(req.body.releaseYear);
    const duration = Number(req.body.durationMinutes);
    const rightsStatus = allowedRights.includes(req.body.rightsStatus) ? req.body.rightsStatus : 'OWNED';
    if (!title || !description || !Number.isInteger(year) || year < 1900 || year > 2100 || !Number.isInteger(duration) || duration < 1) {
      res.status(400).json({ error: 'Title, description, valid release year, and duration in minutes are required.' });
      return;
    }

    const requestedState = allowedStates.includes(req.body.state) ? req.body.state : 'DRAFT';
    const rightsEndDate = parseOptionalDate(req.body.rightsEndDate);
    if (rightsEndDate === undefined && req.body.rightsEndDate !== undefined) {
      res.status(400).json({ error: 'Invalid rightsEndDate format.' });
      return;
    }

    if (requestedState === 'PUBLISHED') {
      const isExpired = rightsEndDate instanceof Date && rightsEndDate.getTime() < Date.now();
      if (!(verifiedPublishRights as readonly string[]).includes(rightsStatus) || isExpired) {
        res.status(409).json({
          error: 'Cannot publish a movie with unverified or expired content rights. Verify rights or save as DRAFT.',
        });
        return;
      }
    }

    const rawGenres = parseStringList(req.body.genres, ['drama']);
    const genreSlugs = await ensureGenres(rawGenres.length > 0 ? rawGenres : ['drama']);
    const territories = parseStringList(req.body.territories ?? req.body.country, ['GLOBAL', 'RW']);
    const subtitlesAvailable = parseStringList(req.body.subtitlesAvailable, ['en']);
    const slugInput = typeof req.body.slug === 'string' && req.body.slug.trim() ? req.body.slug.trim() : title;
    const uniqueSlug = await resolveUniqueMovieSlug(slugInput);

    const posterUrl = typeof req.body.posterUrl === 'string' && req.body.posterUrl.trim() ? req.body.posterUrl.trim() : null;
    const backdropUrl = typeof req.body.backdropUrl === 'string' && req.body.backdropUrl.trim() ? req.body.backdropUrl.trim() : null;
    const trailerUrl = typeof req.body.trailerUrl === 'string' && req.body.trailerUrl.trim() ? req.body.trailerUrl.trim() : null;
    const videoUrl = typeof req.body.videoUrl === 'string' && req.body.videoUrl.trim() ? req.body.videoUrl.trim() : null;
    const licenseReference =
      typeof req.body.licenseReference === 'string' && req.body.licenseReference.trim()
        ? req.body.licenseReference.trim()
        : null;
    const internalNotes =
      typeof req.body.internalNotes === 'string' && req.body.internalNotes.trim()
        ? req.body.internalNotes.trim()
        : null;

    const movie = await prisma.movie.create({
      data: {
        title,
        slug: uniqueSlug,
        description,
        releaseYear: year,
        durationMinutes: duration,
        maturityRating: typeof req.body.maturityRating === 'string' && req.body.maturityRating.trim() ? req.body.maturityRating.trim() : 'PG-13',
        language: typeof req.body.language === 'string' && req.body.language.trim() ? req.body.language.trim() : 'English',
        subtitlesAvailable: subtitlesAvailable.length > 0 ? subtitlesAvailable : ['en'],
        posterUrl,
        backdropUrl,
        trailerUrl,
        videoUrl,
        isFeatured: Boolean(req.body.isFeatured),
        isTrending: Boolean(req.body.isTrending),
        isRwandanContent: Boolean(req.body.isRwandanContent),
        isAfricanContent: Boolean(req.body.isAfricanContent ?? req.body.isRwandanContent),
        isTop10: Boolean(req.body.isTop10),
        top10Rank: req.body.top10Rank ? Number(req.body.top10Rank) : null,
        averageRating: req.body.averageRating ? Number(req.body.averageRating) : 4.5,
        state: requestedState,
        movieGenres:
          genreSlugs.length > 0
            ? {
                create: genreSlugs.map(slug => ({ genre: { connect: { slug } } })),
              }
            : undefined,
        contentRights: {
          create: {
            rightsStatus,
            rightsHolder:
              typeof req.body.rightsHolder === 'string' && req.body.rightsHolder.trim()
                ? req.body.rightsHolder.trim()
                : 'ZIRA Media Platform',
            licenseReference,
            territories: territories.length > 0 ? territories : ['GLOBAL', 'RW'],
            rightsStartDate: new Date(),
            rightsEndDate: rightsEndDate ?? null,
            internalNotes,
          },
        },
      },
      include: { movieGenres: { include: { genre: true } }, contentRights: true },
    });

    const r2VideoKey = r2Service.extractObjectKeyFromUrl(videoUrl) || (typeof req.body.videoObjectKey === 'string' ? req.body.videoObjectKey.trim() : '');
    if (r2VideoKey && typeof (prisma.videoAsset as any)?.create === 'function') {
      try {
        await prisma.videoAsset.create({
          data: {
            movieId: movie.id,
            sourceKey: r2VideoKey,
            status: 'READY',
          },
        });
      } catch {
        // Non-fatal if VideoAsset already exists or optional metadata fails
      }
    }

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.auth!.userId,
        action: 'CREATE_MOVIE',
        entityType: 'Movie',
        entityId: movie.id,
        metadata: JSON.stringify({
          title: movie.title,
          slug: movie.slug,
          state: movie.state,
          rightsStatus,
        }),
      },
    });
    res.status(201).json({ movie: formatMovie(movie) });
  } catch (error) {
    next(error);
  }
});

router.patch('/:movieId', authenticateUser, requireRole(editors), async (req: AuthenticatedRequest, res, next) => {
  try {
    const existing = await prisma.movie.findUnique({
      where: { id: req.params.movieId },
      include: { contentRights: true, movieGenres: { include: { genre: true } } },
    });
    if (!existing) {
      res.status(404).json({ error: 'Movie not found.' });
      return;
    }

    const data: Record<string, any> = {};
    if (typeof req.body.title === 'string' && req.body.title.trim()) data.title = req.body.title.trim();
    if (typeof req.body.slug === 'string' && req.body.slug.trim()) {
      data.slug = await resolveUniqueMovieSlug(req.body.slug.trim(), existing.id);
    }
    if (typeof req.body.description === 'string' && req.body.description.trim()) data.description = req.body.description.trim();
    if (req.body.releaseYear !== undefined) {
      const year = Number(req.body.releaseYear);
      if (!Number.isInteger(year) || year < 1900 || year > 2100) {
        res.status(400).json({ error: 'Valid release year is required.' });
        return;
      }
      data.releaseYear = year;
    }
    if (req.body.durationMinutes !== undefined) {
      const duration = Number(req.body.durationMinutes);
      if (!Number.isInteger(duration) || duration < 1) {
        res.status(400).json({ error: 'Valid duration in minutes is required.' });
        return;
      }
      data.durationMinutes = duration;
    }
    if (typeof req.body.maturityRating === 'string') data.maturityRating = req.body.maturityRating.trim() || 'PG-13';
    if (typeof req.body.language === 'string') data.language = req.body.language.trim() || 'English';
    if (req.body.subtitlesAvailable !== undefined) {
      const subs = parseStringList(req.body.subtitlesAvailable, ['en']);
      data.subtitlesAvailable = subs.length > 0 ? subs : ['en'];
    }
    if (typeof req.body.posterUrl === 'string') data.posterUrl = req.body.posterUrl.trim() || null;
    if (typeof req.body.backdropUrl === 'string') data.backdropUrl = req.body.backdropUrl.trim() || null;
    if (typeof req.body.trailerUrl === 'string') data.trailerUrl = req.body.trailerUrl.trim() || null;
    if (typeof req.body.videoUrl === 'string') data.videoUrl = req.body.videoUrl.trim() || null;
    if (typeof req.body.isFeatured === 'boolean') data.isFeatured = req.body.isFeatured;
    if (typeof req.body.isTrending === 'boolean') data.isTrending = req.body.isTrending;
    if (typeof req.body.isRwandanContent === 'boolean') data.isRwandanContent = req.body.isRwandanContent;
    if (typeof req.body.isAfricanContent === 'boolean') data.isAfricanContent = req.body.isAfricanContent;
    if (typeof req.body.isTop10 === 'boolean') data.isTop10 = req.body.isTop10;
    if (req.body.top10Rank !== undefined) data.top10Rank = req.body.top10Rank ? Number(req.body.top10Rank) : null;
    if (req.body.averageRating !== undefined) data.averageRating = Number(req.body.averageRating) || 0;

    const effectiveRightsStatus =
      req.body.rightsStatus && allowedRights.includes(req.body.rightsStatus)
        ? req.body.rightsStatus
        : existing.contentRights?.rightsStatus || 'OWNED';
    const parsedEndDate = parseOptionalDate(req.body.rightsEndDate);
    const effectiveRightsEndDate =
      parsedEndDate !== undefined ? parsedEndDate : existing.contentRights?.rightsEndDate || null;

    if (req.body.state !== undefined) {
      if (!allowedStates.includes(req.body.state)) {
        res.status(400).json({ error: 'Invalid content state.' });
        return;
      }
      if (req.body.state === 'PUBLISHED') {
        const isExpired =
          effectiveRightsEndDate instanceof Date && effectiveRightsEndDate.getTime() < Date.now();
        if (!(verifiedPublishRights as readonly string[]).includes(effectiveRightsStatus) || isExpired) {
          res.status(409).json({
            error: 'Cannot publish a movie with unverified or expired content rights. Verify rights or save as DRAFT.',
          });
          return;
        }
      }
      data.state = req.body.state;
    }

    if (req.body.genres !== undefined) {
      const rawGenres = parseStringList(req.body.genres);
      const genreSlugs = await ensureGenres(rawGenres);
      if (genreSlugs.length > 0) {
        data.movieGenres = {
          deleteMany: {},
          create: genreSlugs.map(slug => ({ genre: { connect: { slug } } })),
        };
      }
    }

    const hasRightsUpdate =
      req.body.rightsStatus !== undefined ||
      req.body.rightsHolder !== undefined ||
      req.body.licenseReference !== undefined ||
      req.body.rightsEndDate !== undefined ||
      req.body.territories !== undefined ||
      req.body.country !== undefined ||
      req.body.internalNotes !== undefined;

    if (hasRightsUpdate) {
      const rightsHolder =
        typeof req.body.rightsHolder === 'string' && req.body.rightsHolder.trim()
          ? req.body.rightsHolder.trim()
          : existing.contentRights?.rightsHolder || 'ZIRA Media Platform';
      const licenseReference =
        req.body.licenseReference !== undefined
          ? typeof req.body.licenseReference === 'string' && req.body.licenseReference.trim()
            ? req.body.licenseReference.trim()
            : null
          : existing.contentRights?.licenseReference || null;
      const territories =
        req.body.territories !== undefined || req.body.country !== undefined
          ? parseStringList(req.body.territories ?? req.body.country, ['GLOBAL', 'RW'])
          : existing.contentRights?.territories || ['GLOBAL', 'RW'];
      const internalNotes =
        req.body.internalNotes !== undefined
          ? typeof req.body.internalNotes === 'string' && req.body.internalNotes.trim()
            ? req.body.internalNotes.trim()
            : null
          : existing.contentRights?.internalNotes || null;

      data.contentRights = {
        upsert: {
          create: {
            rightsStatus: effectiveRightsStatus,
            rightsHolder,
            licenseReference,
            territories,
            rightsStartDate: new Date(),
            rightsEndDate: effectiveRightsEndDate,
            internalNotes,
          },
          update: {
            rightsStatus: effectiveRightsStatus,
            rightsHolder,
            licenseReference,
            territories,
            rightsEndDate: effectiveRightsEndDate,
            internalNotes,
          },
        },
      };
    }

    const updated = await prisma.movie.update({
      where: { id: existing.id },
      data,
      include: { movieGenres: { include: { genre: true } }, contentRights: true },
    });
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.auth!.userId,
        action: 'UPDATE_MOVIE',
        entityType: 'Movie',
        entityId: existing.id,
        metadata: JSON.stringify({ title: updated.title, slug: updated.slug, state: updated.state }),
      },
    });
    res.json({ movie: formatMovie(updated) });
  } catch (error) {
    next(error);
  }
});

router.patch('/:movieId/state', authenticateUser, requireRole(editors), async (req: AuthenticatedRequest, res, next) => {
  try {
    const state = req.body.state;
    if (!allowedStates.includes(state)) {
      res.status(400).json({ error: 'Invalid content state.' });
      return;
    }
    const movie = await prisma.movie.findUnique({
      where: { id: req.params.movieId },
      include: { contentRights: true },
    });
    if (!movie) {
      res.status(404).json({ error: 'Movie not found.' });
      return;
    }
    if (state === 'PUBLISHED') {
      const rights = movie.contentRights;
      if (
        !rights ||
        !(verifiedPublishRights as readonly string[]).includes(rights.rightsStatus) ||
        rights.rightsStartDate > new Date() ||
        (rights.rightsEndDate && new Date(rights.rightsEndDate) < new Date())
      ) {
        res.status(409).json({ error: 'Valid, current content rights are required before publishing.' });
        return;
      }
    }
    await prisma.movie.update({ where: { id: movie.id }, data: { state } });
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.auth!.userId,
        action: 'UPDATE_MOVIE_STATE',
        entityType: 'Movie',
        entityId: movie.id,
        metadata: JSON.stringify({ title: movie.title, state }),
      },
    });
    res.json({ message: `Movie state updated to ${state}.` });
  } catch (error) {
    next(error);
  }
});

router.delete('/:movieId', authenticateUser, requireRole(editors), async (req: AuthenticatedRequest, res, next) => {
  try {
    const mode = req.query.mode === 'archive' ? 'archive' : 'permanent';
    const movie = await prisma.movie.findUnique({
      where: { id: req.params.movieId },
      include: { contentRights: true, movieGenres: { include: { genre: true } } },
    });
    if (!movie) {
      res.status(404).json({ error: 'Movie not found.' });
      return;
    }

    if (mode === 'archive') {
      const archived = await prisma.movie.update({
        where: { id: movie.id },
        data: {
          state: 'ARCHIVED',
          isFeatured: false,
          isTrending: false,
          isTop10: false,
        },
        include: { contentRights: true, movieGenres: { include: { genre: true } } },
      });
      await prisma.adminAuditLog.create({
        data: {
          adminId: req.auth!.userId,
          action: 'ARCHIVE_MOVIE',
          entityType: 'Movie',
          entityId: movie.id,
          metadata: JSON.stringify({ title: movie.title, slug: movie.slug, mode: 'archive' }),
        },
      });
      res.json({
        message: `Movie "${movie.title}" archived safely.`,
        mode: 'archive',
        movie: formatMovie(archived),
      });
      return;
    }

    // Permanent deletion requires ADMIN or SUPER_ADMIN role
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.auth?.role || '')) {
      res.status(403).json({ error: 'Permanent movie deletion requires ADMIN or SUPER_ADMIN permissions.' });
      return;
    }

    // Collect candidate media URLs / keys for safe R2 cleanup
    const candidateUrls = [movie.posterUrl, movie.backdropUrl, movie.trailerUrl, movie.videoUrl].filter(
      (v): v is string => typeof v === 'string' && v.trim().length > 0,
    );
    const r2DeletedKeys: string[] = [];
    const r2PreservedSharedKeys: string[] = [];

    if (r2Service.isConfigured()) {
      const checkedKeys = new Set<string>();
      for (const candidateUrl of candidateUrls) {
        const key = r2Service.extractObjectKeyFromUrl(candidateUrl);
        if (!key || checkedKeys.has(key)) continue;
        checkedKeys.add(key);

        const isShared = await isMediaUrlOrKeyReferencedElsewhere(candidateUrl, movie.id);
        if (isShared) {
          r2PreservedSharedKeys.push(key);
          continue;
        }
        try {
          await r2Service.deleteObject(key);
          r2DeletedKeys.push(key);
        } catch {
          // Do not block database record removal if R2 object was already deleted
        }
      }
    }

    await prisma.movie.delete({ where: { id: movie.id } });
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.auth!.userId,
        action: 'DELETE_MOVIE',
        entityType: 'Movie',
        entityId: movie.id,
        metadata: JSON.stringify({
          title: movie.title,
          slug: movie.slug,
          mode: 'permanent',
          r2DeletedKeys,
          r2PreservedSharedKeys,
        }),
      },
    });
    res.json({
      message: `Movie "${movie.title}" permanently deleted.`,
      mode: 'permanent',
      r2DeletedKeys,
      r2PreservedSharedKeys,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

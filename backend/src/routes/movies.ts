import { Router } from 'express';
import prisma from '../../prisma/prisma';
import { seedDatabase } from '../../prisma/seed';
import { authenticateUser, requireRole, type AuthenticatedRequest } from '../auth';

const router = Router();
const editors = ['EDITOR', 'ADMIN', 'SUPER_ADMIN'];
const allowedRights = ['OWNED', 'LICENSED', 'PERMISSION_GRANTED', 'PUBLIC_DOMAIN', 'PENDING_VERIFICATION', 'EXPIRED'] as const;
const allowedStates = ['DRAFT', 'UPLOADED', 'PROCESSING', 'READY', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'] as const;

function slugify(value: string): string {
	return value
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 90);
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
	return {
		...movie,
		posterUrl: movie.posterUrl || '',
		backdropUrl: movie.backdropUrl || movie.posterUrl || '',
		trailerUrl: movie.trailerUrl || '',
		videoUrl: movie.videoUrl || '',
		subtitlesAvailable: Array.isArray(movie.subtitlesAvailable) ? movie.subtitlesAvailable : ['en'],
		genres: genres.length > 0 ? genres : ['drama'],
		cast,
		rights: movie.contentRights || movie.rights || undefined,
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
		if (!title || !description || !Number.isInteger(year) || !Number.isInteger(duration) || duration < 1) {
			res.status(400).json({ error: 'Title, description, release year, and valid duration are required.' });
			return;
		}

		const requestedState = allowedStates.includes(req.body.state) ? req.body.state : 'DRAFT';
		const validPublishRights = ['OWNED', 'LICENSED', 'PERMISSION_GRANTED', 'PUBLIC_DOMAIN'];
		const initialState =
			requestedState === 'PUBLISHED' && validPublishRights.includes(rightsStatus) ? 'PUBLISHED' : requestedState === 'PUBLISHED' ? 'DRAFT' : requestedState;

		const rawGenres = Array.isArray(req.body.genres)
			? req.body.genres
			: typeof req.body.genres === 'string'
				? req.body.genres.split(',').map((s: string) => s.trim())
				: ['drama'];
		const genreSlugs = await ensureGenres(rawGenres);

		const movie = await prisma.movie.create({
			data: {
				title,
				slug: `${slugify(title)}-${Date.now().toString(36)}`,
				description,
				releaseYear: year,
				durationMinutes: duration,
				maturityRating: typeof req.body.maturityRating === 'string' && req.body.maturityRating.trim() ? req.body.maturityRating.trim() : 'PG-13',
				language: typeof req.body.language === 'string' && req.body.language.trim() ? req.body.language.trim() : 'English',
				subtitlesAvailable: Array.isArray(req.body.subtitlesAvailable) ? req.body.subtitlesAvailable : ['en'],
				posterUrl: typeof req.body.posterUrl === 'string' && req.body.posterUrl.trim() ? req.body.posterUrl.trim() : null,
				backdropUrl: typeof req.body.backdropUrl === 'string' && req.body.backdropUrl.trim() ? req.body.backdropUrl.trim() : null,
				trailerUrl: typeof req.body.trailerUrl === 'string' && req.body.trailerUrl.trim() ? req.body.trailerUrl.trim() : null,
				videoUrl: typeof req.body.videoUrl === 'string' && req.body.videoUrl.trim() ? req.body.videoUrl.trim() : null,
				isFeatured: Boolean(req.body.isFeatured),
				isTrending: Boolean(req.body.isTrending),
				isRwandanContent: Boolean(req.body.isRwandanContent),
				isAfricanContent: Boolean(req.body.isAfricanContent ?? req.body.isRwandanContent),
				isTop10: Boolean(req.body.isTop10),
				top10Rank: req.body.top10Rank ? Number(req.body.top10Rank) : null,
				averageRating: req.body.averageRating ? Number(req.body.averageRating) : 4.5,
				state: initialState,
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
						rightsStartDate: new Date(),
					},
				},
			},
			include: { movieGenres: { include: { genre: true } }, contentRights: true },
		});
		await prisma.adminAuditLog.create({
			data: { adminId: req.auth!.userId, action: 'CREATE_MOVIE', entityType: 'Movie', entityId: movie.id },
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
		if (Array.isArray(req.body.subtitlesAvailable)) data.subtitlesAvailable = req.body.subtitlesAvailable;
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
		if (req.body.state !== undefined && allowedStates.includes(req.body.state)) {
			data.state = req.body.state;
		}

		if (req.body.genres !== undefined) {
			const rawGenres = Array.isArray(req.body.genres)
				? req.body.genres
				: typeof req.body.genres === 'string'
					? req.body.genres.split(',').map((s: string) => s.trim())
					: [];
			const genreSlugs = await ensureGenres(rawGenres);
			if (genreSlugs.length > 0) {
				data.movieGenres = {
					deleteMany: {},
					create: genreSlugs.map(slug => ({ genre: { connect: { slug } } })),
				};
			}
		}

		if (req.body.rightsStatus && allowedRights.includes(req.body.rightsStatus)) {
			data.contentRights = {
				upsert: {
					create: {
						rightsStatus: req.body.rightsStatus,
						rightsHolder: typeof req.body.rightsHolder === 'string' && req.body.rightsHolder.trim() ? req.body.rightsHolder.trim() : 'ZIRA Media Platform',
						rightsStartDate: new Date(),
					},
					update: {
						rightsStatus: req.body.rightsStatus,
						...(typeof req.body.rightsHolder === 'string' && req.body.rightsHolder.trim() ? { rightsHolder: req.body.rightsHolder.trim() } : {}),
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
				metadata: JSON.stringify({ title: updated.title, state: updated.state }),
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
		const movie = await prisma.movie.findUnique({ where: { id: req.params.movieId }, include: { contentRights: true } });
		if (!movie) {
			res.status(404).json({ error: 'Movie not found.' });
			return;
		}
		if (state === 'PUBLISHED') {
			const rights = movie.contentRights;
			const validStatuses = ['OWNED', 'LICENSED', 'PERMISSION_GRANTED', 'PUBLIC_DOMAIN'];
			if (!rights || !validStatuses.includes(rights.rightsStatus) || rights.rightsStartDate > new Date() || (rights.rightsEndDate && rights.rightsEndDate < new Date())) {
				res.status(409).json({ error: 'Valid, current content rights are required before publishing.' });
				return;
			}
		}
		await prisma.movie.update({ where: { id: movie.id }, data: { state } });
		await prisma.adminAuditLog.create({
			data: { adminId: req.auth!.userId, action: 'UPDATE_MOVIE_STATE', entityType: 'Movie', entityId: movie.id, metadata: JSON.stringify({ state }) },
		});
		res.json({ message: `Movie state updated to ${state}.` });
	} catch (error) {
		next(error);
	}
});

router.delete('/:movieId', authenticateUser, requireRole(editors), async (req: AuthenticatedRequest, res, next) => {
	try {
		const movie = await prisma.movie.findUnique({ where: { id: req.params.movieId } });
		if (!movie) {
			res.status(404).json({ error: 'Movie not found.' });
			return;
		}
		await prisma.movie.delete({ where: { id: movie.id } });
		await prisma.adminAuditLog.create({
			data: {
				adminId: req.auth!.userId,
				action: 'DELETE_MOVIE',
				entityType: 'Movie',
				entityId: movie.id,
				metadata: JSON.stringify({ title: movie.title }),
			},
		});
		res.json({ message: 'Movie deleted successfully.' });
	} catch (error) {
		next(error);
	}
});

export default router;

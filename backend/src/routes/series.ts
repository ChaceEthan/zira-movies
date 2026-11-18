import { Router } from 'express';
import prisma from '../../prisma/prisma';
import { seedDatabase } from '../../prisma/seed';
import { authenticateUser, requireRole, type AuthenticatedRequest } from '../auth';

const router = Router();
const editors = ['EDITOR', 'ADMIN', 'SUPER_ADMIN'];
const allowedStates = ['DRAFT', 'UPLOADED', 'PROCESSING', 'READY', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'] as const;
const allowedRights = ['OWNED', 'LICENSED', 'PERMISSION_GRANTED', 'PUBLIC_DOMAIN', 'PENDING_VERIFICATION', 'EXPIRED'] as const;

function slugify(value: string): string {
	return value
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 90);
}

function formatSeries(item: any) {
	const genres = Array.isArray(item.seriesGenres)
		? item.seriesGenres.map((entry: any) => entry.genre?.slug || entry.genreId).filter(Boolean)
		: Array.isArray(item.genres)
			? item.genres
			: [];
	return {
		...item,
		posterUrl: item.posterUrl || '',
		backdropUrl: item.backdropUrl || item.posterUrl || '',
		trailerUrl: item.trailerUrl || '',
		genres: genres.length > 0 ? genres : ['drama'],
		seasons: Array.isArray(item.seasons) ? item.seasons : [],
		rights: item.contentRights || item.rights || undefined,
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
		let series = await prisma.series.findMany({
			where: { state: 'PUBLISHED' },
			include: {
				seasons: {
					include: { episodes: { where: { state: 'PUBLISHED' }, orderBy: { episodeNumber: 'asc' } } },
					orderBy: { seasonNumber: 'asc' },
				},
				seriesGenres: { include: { genre: true } },
				contentRights: true,
			},
			orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
		});
		if (series.length === 0) {
			const totalCount = await prisma.series.count();
			if (totalCount === 0) {
				await seedDatabase();
				series = await prisma.series.findMany({
					where: { state: 'PUBLISHED' },
					include: {
						seasons: {
							include: { episodes: { where: { state: 'PUBLISHED' }, orderBy: { episodeNumber: 'asc' } } },
							orderBy: { seasonNumber: 'asc' },
						},
						seriesGenres: { include: { genre: true } },
						contentRights: true,
					},
					orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
				});
			}
		}
		res.json({ series: series.map(formatSeries) });
	} catch (error) {
		next(error);
	}
});

router.get('/slug/:slug', async (req, res, next) => {
	try {
		const item = await prisma.series.findFirst({
			where: { slug: req.params.slug, state: 'PUBLISHED' },
			include: {
				seasons: {
					include: { episodes: { where: { state: 'PUBLISHED' }, orderBy: { episodeNumber: 'asc' } } },
					orderBy: { seasonNumber: 'asc' },
				},
				seriesGenres: { include: { genre: true } },
				contentRights: true,
			},
		});
		if (!item) {
			res.status(404).json({ error: 'Series not found.' });
			return;
		}
		res.json({ series: formatSeries(item) });
	} catch (error) {
		next(error);
	}
});

router.post('/', authenticateUser, requireRole(editors), async (req: AuthenticatedRequest, res, next) => {
	try {
		const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
		const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
		const releaseYear = Number(req.body.releaseYear);
		if (!title || !description || !Number.isInteger(releaseYear)) {
			res.status(400).json({ error: 'Title, description, and release year are required.' });
			return;
		}

		const rightsStatus = allowedRights.includes(req.body.rightsStatus) ? req.body.rightsStatus : 'OWNED';
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

		const series = await prisma.series.create({
			data: {
				title,
				slug: `${slugify(title)}-${Date.now().toString(36)}`,
				description,
				releaseYear,
				maturityRating: typeof req.body.maturityRating === 'string' && req.body.maturityRating.trim() ? req.body.maturityRating.trim() : 'PG-13',
				language: typeof req.body.language === 'string' && req.body.language.trim() ? req.body.language.trim() : 'English',
				posterUrl: typeof req.body.posterUrl === 'string' && req.body.posterUrl.trim() ? req.body.posterUrl.trim() : null,
				backdropUrl: typeof req.body.backdropUrl === 'string' && req.body.backdropUrl.trim() ? req.body.backdropUrl.trim() : null,
				trailerUrl: typeof req.body.trailerUrl === 'string' && req.body.trailerUrl.trim() ? req.body.trailerUrl.trim() : null,
				isFeatured: Boolean(req.body.isFeatured),
				isTrending: Boolean(req.body.isTrending),
				isRwandanContent: Boolean(req.body.isRwandanContent),
				isAfricanContent: Boolean(req.body.isAfricanContent ?? req.body.isRwandanContent),
				isTop10: Boolean(req.body.isTop10),
				top10Rank: req.body.top10Rank ? Number(req.body.top10Rank) : null,
				averageRating: req.body.averageRating ? Number(req.body.averageRating) : 4.6,
				state: initialState,
				seriesGenres:
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
			include: { seasons: { include: { episodes: true } }, seriesGenres: { include: { genre: true } }, contentRights: true },
		});
		await prisma.adminAuditLog.create({
			data: { adminId: req.auth!.userId, action: 'CREATE_SERIES', entityType: 'Series', entityId: series.id },
		});
		res.status(201).json({ series: formatSeries(series) });
	} catch (error) {
		next(error);
	}
});

router.patch('/:seriesId', authenticateUser, requireRole(editors), async (req: AuthenticatedRequest, res, next) => {
	try {
		const existing = await prisma.series.findUnique({
			where: { id: req.params.seriesId },
			include: { contentRights: true },
		});
		if (!existing) {
			res.status(404).json({ error: 'Series not found.' });
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
		if (typeof req.body.maturityRating === 'string') data.maturityRating = req.body.maturityRating.trim() || 'PG-13';
		if (typeof req.body.language === 'string') data.language = req.body.language.trim() || 'English';
		if (typeof req.body.posterUrl === 'string') data.posterUrl = req.body.posterUrl.trim() || null;
		if (typeof req.body.backdropUrl === 'string') data.backdropUrl = req.body.backdropUrl.trim() || null;
		if (typeof req.body.trailerUrl === 'string') data.trailerUrl = req.body.trailerUrl.trim() || null;
		if (typeof req.body.isFeatured === 'boolean') data.isFeatured = req.body.isFeatured;
		if (typeof req.body.isTrending === 'boolean') data.isTrending = req.body.isTrending;
		if (typeof req.body.isRwandanContent === 'boolean') data.isRwandanContent = req.body.isRwandanContent;
		if (typeof req.body.isAfricanContent === 'boolean') data.isAfricanContent = req.body.isAfricanContent;
		if (typeof req.body.isTop10 === 'boolean') data.isTop10 = req.body.isTop10;
		if (req.body.top10Rank !== undefined) data.top10Rank = req.body.top10Rank ? Number(req.body.top10Rank) : null;
		if (req.body.averageRating !== undefined) data.averageRating = Number(req.body.averageRating) || 0;
		if (req.body.state !== undefined && allowedStates.includes(req.body.state)) data.state = req.body.state;

		if (req.body.genres !== undefined) {
			const rawGenres = Array.isArray(req.body.genres)
				? req.body.genres
				: typeof req.body.genres === 'string'
					? req.body.genres.split(',').map((s: string) => s.trim())
					: [];
			const genreSlugs = await ensureGenres(rawGenres);
			if (genreSlugs.length > 0) {
				data.seriesGenres = {
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

		const updated = await prisma.series.update({
			where: { id: existing.id },
			data,
			include: { seasons: { include: { episodes: true } }, seriesGenres: { include: { genre: true } }, contentRights: true },
		});
		await prisma.adminAuditLog.create({
			data: { adminId: req.auth!.userId, action: 'UPDATE_SERIES', entityType: 'Series', entityId: existing.id, metadata: JSON.stringify({ title: updated.title }) },
		});
		res.json({ series: formatSeries(updated) });
	} catch (error) {
		next(error);
	}
});

router.patch('/:seriesId/state', authenticateUser, requireRole(editors), async (req: AuthenticatedRequest, res, next) => {
	try {
		const state = req.body.state;
		if (!allowedStates.includes(state)) {
			res.status(400).json({ error: 'Invalid content state.' });
			return;
		}
		const series = await prisma.series.findUnique({ where: { id: req.params.seriesId }, include: { contentRights: true } });
		if (!series) {
			res.status(404).json({ error: 'Series not found.' });
			return;
		}
		if (state === 'PUBLISHED') {
			const rights = series.contentRights;
			const validStatuses = ['OWNED', 'LICENSED', 'PERMISSION_GRANTED', 'PUBLIC_DOMAIN'];
			if (!rights || !validStatuses.includes(rights.rightsStatus) || rights.rightsStartDate > new Date() || (rights.rightsEndDate && rights.rightsEndDate < new Date())) {
				res.status(409).json({ error: 'Valid, current content rights are required before publishing.' });
				return;
			}
		}
		await prisma.series.update({ where: { id: series.id }, data: { state } });
		await prisma.adminAuditLog.create({
			data: { adminId: req.auth!.userId, action: 'UPDATE_SERIES_STATE', entityType: 'Series', entityId: series.id, metadata: JSON.stringify({ state }) },
		});
		res.json({ message: `Series state updated to ${state}.` });
	} catch (error) {
		next(error);
	}
});

router.delete('/:seriesId', authenticateUser, requireRole(editors), async (req: AuthenticatedRequest, res, next) => {
	try {
		const series = await prisma.series.findUnique({ where: { id: req.params.seriesId } });
		if (!series) {
			res.status(404).json({ error: 'Series not found.' });
			return;
		}
		await prisma.series.delete({ where: { id: series.id } });
		await prisma.adminAuditLog.create({
			data: { adminId: req.auth!.userId, action: 'DELETE_SERIES', entityType: 'Series', entityId: series.id, metadata: JSON.stringify({ title: series.title }) },
		});
		res.json({ message: 'Series deleted successfully.' });
	} catch (error) {
		next(error);
	}
});

// SEASONS & EPISODES
router.post('/:seriesId/seasons', authenticateUser, requireRole(editors), async (req: AuthenticatedRequest, res, next) => {
	try {
		const seasonNumber = Number(req.body.seasonNumber);
		const title = typeof req.body.title === 'string' && req.body.title.trim() ? req.body.title.trim() : `Season ${seasonNumber}`;
		const description = typeof req.body.description === 'string' ? req.body.description.trim() : null;
		if (!Number.isInteger(seasonNumber) || seasonNumber < 1) {
			res.status(400).json({ error: 'A valid positive seasonNumber is required.' });
			return;
		}
		const season = await prisma.season.create({
			data: {
				seriesId: req.params.seriesId,
				seasonNumber,
				title,
				description,
			},
		});
		await prisma.adminAuditLog.create({
			data: { adminId: req.auth!.userId, action: 'CREATE_SEASON', entityType: 'Season', entityId: season.id },
		});
		res.status(201).json({ season });
	} catch (error) {
		next(error);
	}
});

router.delete('/:seriesId/seasons/:seasonId', authenticateUser, requireRole(editors), async (req: AuthenticatedRequest, res, next) => {
	try {
		await prisma.season.delete({ where: { id: req.params.seasonId } });
		await prisma.adminAuditLog.create({
			data: { adminId: req.auth!.userId, action: 'DELETE_SEASON', entityType: 'Season', entityId: req.params.seasonId },
		});
		res.json({ message: 'Season deleted.' });
	} catch (error) {
		next(error);
	}
});

router.post('/:seriesId/seasons/:seasonId/episodes', authenticateUser, requireRole(editors), async (req: AuthenticatedRequest, res, next) => {
	try {
		const episodeNumber = Number(req.body.episodeNumber);
		const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
		const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
		const durationMinutes = Number(req.body.durationMinutes || 45);
		if (!Number.isInteger(episodeNumber) || episodeNumber < 1 || !title || !description || !Number.isInteger(durationMinutes) || durationMinutes < 1) {
			res.status(400).json({ error: 'Valid episodeNumber, title, description, and durationMinutes are required.' });
			return;
		}
		const state = allowedStates.includes(req.body.state) ? req.body.state : 'PUBLISHED';
		const episode = await prisma.episode.create({
			data: {
				seasonId: req.params.seasonId,
				episodeNumber,
				title,
				description,
				durationMinutes,
				thumbnailUrl: typeof req.body.thumbnailUrl === 'string' && req.body.thumbnailUrl.trim() ? req.body.thumbnailUrl.trim() : null,
				videoUrl: typeof req.body.videoUrl === 'string' && req.body.videoUrl.trim() ? req.body.videoUrl.trim() : null,
				state,
			},
		});
		await prisma.adminAuditLog.create({
			data: { adminId: req.auth!.userId, action: 'CREATE_EPISODE', entityType: 'Episode', entityId: episode.id, metadata: JSON.stringify({ title }) },
		});
		res.status(201).json({ episode });
	} catch (error) {
		next(error);
	}
});

router.patch('/episodes/:episodeId', authenticateUser, requireRole(editors), async (req: AuthenticatedRequest, res, next) => {
	try {
		const data: Record<string, any> = {};
		if (typeof req.body.title === 'string' && req.body.title.trim()) data.title = req.body.title.trim();
		if (typeof req.body.description === 'string' && req.body.description.trim()) data.description = req.body.description.trim();
		if (req.body.episodeNumber !== undefined) data.episodeNumber = Number(req.body.episodeNumber);
		if (req.body.durationMinutes !== undefined) data.durationMinutes = Number(req.body.durationMinutes);
		if (typeof req.body.thumbnailUrl === 'string') data.thumbnailUrl = req.body.thumbnailUrl.trim() || null;
		if (typeof req.body.videoUrl === 'string') data.videoUrl = req.body.videoUrl.trim() || null;
		if (req.body.state && allowedStates.includes(req.body.state)) data.state = req.body.state;

		const episode = await prisma.episode.update({
			where: { id: req.params.episodeId },
			data,
		});
		await prisma.adminAuditLog.create({
			data: { adminId: req.auth!.userId, action: 'UPDATE_EPISODE', entityType: 'Episode', entityId: episode.id },
		});
		res.json({ episode });
	} catch (error) {
		next(error);
	}
});

router.delete('/episodes/:episodeId', authenticateUser, requireRole(editors), async (req: AuthenticatedRequest, res, next) => {
	try {
		await prisma.episode.delete({ where: { id: req.params.episodeId } });
		await prisma.adminAuditLog.create({
			data: { adminId: req.auth!.userId, action: 'DELETE_EPISODE', entityType: 'Episode', entityId: req.params.episodeId },
		});
		res.json({ message: 'Episode deleted.' });
	} catch (error) {
		next(error);
	}
});

export default router;

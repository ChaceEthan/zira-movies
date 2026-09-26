import { Router } from 'express';
import prisma from '../../../prisma/prisma';
import { authenticateUser, requireRole, type AuthenticatedRequest } from '../../../auth';

const router = Router();
const editors = ['EDITOR', 'ADMIN', 'SUPER_ADMIN'];
const allowedRights = ['OWNED', 'LICENSED', 'PERMISSION_GRANTED', 'PUBLIC_DOMAIN', 'PENDING_VERIFICATION', 'EXPIRED'] as const;

function slugify(value: string): string {
	return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90);
}

router.get('/', async (_req, res, next) => {
	try {
		const movies = await prisma.movie.findMany({
			where: { state: 'PUBLISHED' },
			include: { movieGenres: { include: { genre: true } }, contentRights: true },
			orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
		});
		res.json({ movies: movies.map(movie => ({ ...movie, genres: movie.movieGenres.map(entry => entry.genre.slug), rights: movie.contentRights })) });
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
		res.json({ movie: { ...movie, genres: movie.movieGenres.map(entry => entry.genre.slug), rights: movie.contentRights } });
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
		const rightsStatus = allowedRights.includes(req.body.rightsStatus) ? req.body.rightsStatus : 'PENDING_VERIFICATION';
		if (!title || !description || !Number.isInteger(year) || !Number.isInteger(duration) || duration < 1) {
			res.status(400).json({ error: 'Title, description, release year, and valid duration are required.' });
			return;
		}

		const movie = await prisma.movie.create({
			data: {
				title,
				slug: `${slugify(title)}-${Date.now().toString(36)}`,
				description,
				releaseYear: year,
				durationMinutes: duration,
				isRwandanContent: Boolean(req.body.isRwandanContent),
				contentRights: {
					create: {
						rightsStatus,
						rightsHolder: typeof req.body.rightsHolder === 'string' && req.body.rightsHolder.trim() ? req.body.rightsHolder.trim() : 'Not recorded',
						rightsStartDate: new Date(),
					},
				},
			},
			include: { contentRights: true },
		});
		await prisma.adminAuditLog.create({ data: { adminId: req.auth!.userId, action: 'CREATE_MOVIE', entityType: 'Movie', entityId: movie.id } });
		res.status(201).json({ movie });
	} catch (error) {
		next(error);
	}
});

router.patch('/:movieId/state', authenticateUser, requireRole(editors), async (req: AuthenticatedRequest, res, next) => {
	try {
		const state = req.body.state;
		const states = ['DRAFT', 'UPLOADED', 'PROCESSING', 'READY', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'] as const;
		if (!states.includes(state)) {
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
		await prisma.adminAuditLog.create({ data: { adminId: req.auth!.userId, action: 'UPDATE_MOVIE_STATE', entityType: 'Movie', entityId: movie.id, metadata: JSON.stringify({ state }) } });
		res.json({ message: `Movie state updated to ${state}.` });
	} catch (error) {
		next(error);
	}
});

export default router;

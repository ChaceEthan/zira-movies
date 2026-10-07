import { Router } from 'express';
import prisma from '../../prisma/prisma';
import { authenticateUser, requireRole, type AuthenticatedRequest } from '../auth';

const router = Router();
const editors = ['EDITOR', 'ADMIN', 'SUPER_ADMIN'];

function slugify(value: string): string {
	return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90);
}

router.get('/', async (_req, res, next) => {
	try {
		const series = await prisma.series.findMany({
			where: { state: 'PUBLISHED' },
			include: {
				seasons: { include: { episodes: { where: { state: 'PUBLISHED' }, orderBy: { episodeNumber: 'asc' } } }, orderBy: { seasonNumber: 'asc' } },
				seriesGenres: { include: { genre: true } },
				contentRights: true,
			},
			orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
		});
		res.json({ series: series.map(item => ({ ...item, genres: item.seriesGenres.map(entry => entry.genre.slug), rights: item.contentRights })) });
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
		const series = await prisma.series.create({
			data: {
				title,
				slug: `${slugify(title)}-${Date.now().toString(36)}`,
				description,
				releaseYear,
				contentRights: {
					create: {
						rightsStatus: 'PENDING_VERIFICATION',
						rightsHolder: 'Not recorded',
						rightsStartDate: new Date(),
					},
				},
			},
			include: { contentRights: true },
		});
		await prisma.adminAuditLog.create({ data: { adminId: req.auth!.userId, action: 'CREATE_SERIES', entityType: 'Series', entityId: series.id } });
		res.status(201).json({ series });
	} catch (error) {
		next(error);
	}
});

router.patch('/:seriesId/state', authenticateUser, requireRole(editors), async (req: AuthenticatedRequest, res, next) => {
	try {
		const states = ['DRAFT', 'UPLOADED', 'PROCESSING', 'READY', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'] as const;
		const state = req.body.state;
		if (!states.includes(state)) {
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
		await prisma.adminAuditLog.create({ data: { adminId: req.auth!.userId, action: 'UPDATE_SERIES_STATE', entityType: 'Series', entityId: series.id, metadata: JSON.stringify({ state }) } });
		res.json({ message: `Series state updated to ${state}.` });
	} catch (error) {
		next(error);
	}
});

export default router;

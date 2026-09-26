import { Router } from 'express';
import prisma from '../../../prisma/prisma';
import { authenticateUser, requireRole, type AuthenticatedRequest } from '../../../auth';

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

export default router;

import { Router } from 'express';
import prisma from '../../../prisma/prisma';
import { authenticateUser, type AuthenticatedRequest } from '../../../auth';

const router = Router();
router.use(authenticateUser);

router.get('/watchlist', async (req: AuthenticatedRequest, res, next) => {
	try {
		const watchlist = await prisma.watchlist.findMany({
			where: { userId: req.auth!.userId },
			include: { movie: true, series: { include: { seasons: { include: { episodes: true } } } } },
			orderBy: { createdAt: 'desc' },
		});
		res.json({ watchlist });
	} catch (error) {
		next(error);
	}
});

router.post('/watchlist', async (req: AuthenticatedRequest, res, next) => {
	try {
		const movieId = typeof req.body.movieId === 'string' ? req.body.movieId : null;
		const seriesId = typeof req.body.seriesId === 'string' ? req.body.seriesId : null;
		if (Boolean(movieId) === Boolean(seriesId)) {
			res.status(400).json({ error: 'Provide exactly one movieId or seriesId.' });
			return;
		}
		const item = await prisma.watchlist.create({ data: { userId: req.auth!.userId, movieId, seriesId } });
		res.status(201).json({ item });
	} catch (error) {
		next(error);
	}
});

router.delete('/watchlist', async (req: AuthenticatedRequest, res, next) => {
	try {
		const movieId = typeof req.body.movieId === 'string' ? req.body.movieId : null;
		const seriesId = typeof req.body.seriesId === 'string' ? req.body.seriesId : null;
		if (Boolean(movieId) === Boolean(seriesId)) {
			res.status(400).json({ error: 'Provide exactly one movieId or seriesId.' });
			return;
		}
		await prisma.watchlist.deleteMany({ where: { userId: req.auth!.userId, movieId, seriesId } });
		res.status(204).end();
	} catch (error) {
		next(error);
	}
});

router.get('/watch-progress', async (req: AuthenticatedRequest, res, next) => {
	try {
		const watchProgress = await prisma.watchProgress.findMany({
			where: { userId: req.auth!.userId },
			include: { movie: true, episode: true },
			orderBy: { updatedAt: 'desc' },
		});
		res.json({ watchProgress });
	} catch (error) {
		next(error);
	}
});

router.post('/watch-progress', async (req: AuthenticatedRequest, res, next) => {
	try {
		const movieId = typeof req.body.movieId === 'string' ? req.body.movieId : null;
		const episodeId = typeof req.body.episodeId === 'string' ? req.body.episodeId : null;
		if (Boolean(movieId) === Boolean(episodeId)) {
			res.status(400).json({ error: 'Provide exactly one movieId or episodeId.' });
			return;
		}
		const positionSeconds = Math.max(0, Math.floor(Number(req.body.positionSeconds) || 0));
		const durationSeconds = Math.max(0, Math.floor(Number(req.body.durationSeconds) || 0));
		if (durationSeconds > 0 && positionSeconds > durationSeconds) {
			res.status(400).json({ error: 'Playback position cannot exceed duration.' });
			return;
		}
		const identity = { userId: req.auth!.userId, movieId, episodeId };
		const existing = await prisma.watchProgress.findFirst({ where: identity });
		const data = {
			positionSeconds,
			durationSeconds,
			percentage: durationSeconds ? Math.min(100, positionSeconds / durationSeconds * 100) : 0,
			completed: durationSeconds > 0 && positionSeconds / durationSeconds >= 0.95,
		};
		const watchProgress = existing
			? await prisma.watchProgress.update({ where: { id: existing.id }, data })
			: await prisma.watchProgress.create({ data: { ...identity, ...data } });
		res.json({ watchProgress });
	} catch (error) {
		next(error);
	}
});

router.patch('/preferences', async (req: AuthenticatedRequest, res, next) => {
	try {
		const data: Record<string, string | boolean> = {};
		if (['AUTO', 'DATA_SAVER', 'HIGH_QUALITY'].includes(req.body.playbackPreference)) data.playbackPreference = req.body.playbackPreference;
		if (typeof req.body.notificationEmail === 'boolean') data.notificationEmail = req.body.notificationEmail;
		if (typeof req.body.notificationPush === 'boolean') data.notificationPush = req.body.notificationPush;
		if (Object.keys(data).length === 0) {
			res.status(400).json({ error: 'No valid preferences provided.' });
			return;
		}
		const user = await prisma.user.update({ where: { id: req.auth!.userId }, data });
		res.json({ user: { id: user.id, playbackPreference: user.playbackPreference, notificationEmail: user.notificationEmail, notificationPush: user.notificationPush } });
	} catch (error) {
		next(error);
	}
});

export default router;

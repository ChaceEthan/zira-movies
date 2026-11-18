import { Router } from 'express';
import prisma from '../../prisma/prisma';
import { r2Service } from '../services/cloudflareR2';
import { authenticateUser, requireRole, type AuthenticatedRequest } from '../auth';

const router = Router();
router.use(authenticateUser, requireRole(['ADMIN', 'SUPER_ADMIN']));

function formatAdminMovie(movie: any) {
	const genres = Array.isArray(movie.movieGenres)
		? movie.movieGenres.map((entry: any) => entry.genre?.slug || entry.genreId).filter(Boolean)
		: Array.isArray(movie.genres)
			? movie.genres
			: [];
	return {
		...movie,
		posterUrl: movie.posterUrl || '',
		backdropUrl: movie.backdropUrl || movie.posterUrl || '',
		trailerUrl: movie.trailerUrl || '',
		videoUrl: movie.videoUrl || '',
		subtitlesAvailable: Array.isArray(movie.subtitlesAvailable) ? movie.subtitlesAvailable : ['en'],
		genres: genres.length > 0 ? genres : ['drama'],
		cast: Array.isArray(movie.cast) ? movie.cast : [],
		rights: movie.contentRights || movie.rights || undefined,
	};
}

function formatAdminSeries(item: any) {
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

router.get('/catalog', async (_req, res, next) => {
	try {
		const [movies, series] = await Promise.all([
			prisma.movie.findMany({
				include: { movieGenres: { include: { genre: true } }, contentRights: true },
				orderBy: [{ createdAt: 'desc' }],
			}),
			prisma.series.findMany({
				include: {
					seasons: {
						include: { episodes: { orderBy: { episodeNumber: 'asc' } } },
						orderBy: { seasonNumber: 'asc' },
					},
					seriesGenres: { include: { genre: true } },
					contentRights: true,
				},
				orderBy: [{ createdAt: 'desc' }],
			}),
		]);
		res.json({
			movies: movies.map(formatAdminMovie),
			series: series.map(formatAdminSeries),
		});
	} catch (error) {
		next(error);
	}
});

router.get('/metrics', async (_req, res, next) => {
	try {
		const [
			totalUsers,
			totalMovies,
			publishedMovies,
			draftMovies,
			totalSeries,
			publishedSeries,
			draftSeries,
			totalEpisodes,
			movieViews,
			seriesViews,
			sponsorImpressions,
			sponsorClicks,
			affiliateClicks,
			pendingMovieRights,
			pendingSeriesRights,
			campaigns,
			verifiedAffiliate,
			monetagSettings,
		] = await Promise.all([
			prisma.user.count(),
			prisma.movie.count(),
			prisma.movie.count({ where: { state: 'PUBLISHED' } }),
			prisma.movie.count({ where: { state: 'DRAFT' } }),
			prisma.series.count(),
			prisma.series.count({ where: { state: 'PUBLISHED' } }),
			prisma.series.count({ where: { state: 'DRAFT' } }),
			prisma.episode.count(),
			prisma.movie.aggregate({ _sum: { viewCount: true } }),
			prisma.series.aggregate({ _sum: { viewCount: true } }),
			prisma.adImpression.count(),
			prisma.adClick.count(),
			prisma.affiliateClick.count(),
			prisma.contentRights.count({ where: { rightsStatus: 'PENDING_VERIFICATION', movieId: { not: null } } }),
			prisma.contentRights.count({ where: { rightsStatus: 'PENDING_VERIFICATION', seriesId: { not: null } } }),
			prisma.sponsorCampaign.aggregate({ _sum: { agreedPrice: true, paidAmount: true } }),
			prisma.affiliateConversion.aggregate({ where: { status: 'VERIFIED' }, _sum: { commissionRevenue: true } }),
			prisma.monetagPlacementSetting.findMany(),
		]);

		const activePlacementsCount = monetagSettings.filter(s => s.enabled).length;

		const metrics = {
			totalUsers,
			totalMovies,
			publishedMovies,
			draftMovies,
			totalSeries,
			publishedSeries,
			draftSeries,
			totalEpisodes,
			totalPlacements: 8,
			activePlacementsCount,
			totalViews: (movieViews._sum.viewCount || 0) + (seriesViews._sum.viewCount || 0),
			totalWatchHours: null,
			totalSponsorImpressions: sponsorImpressions,
			totalSponsorClicks: sponsorClicks,
			totalAffiliateClicks: affiliateClicks,
			pendingRightsCount: pendingMovieRights + pendingSeriesRights,
			r2Configured: r2Service.isConfigured(),
			sponsorContractedRevenue: Number(campaigns._sum.agreedPrice || 0),
			sponsorPaidRevenue: Number(campaigns._sum.paidAmount || 0),
			sponsorOutstandingRevenue: Number(campaigns._sum.agreedPrice || 0) - Number(campaigns._sum.paidAmount || 0),
			affiliateVerifiedRevenue: Number(verifiedAffiliate._sum.commissionRevenue || 0),
		};

		const auditLogs = await prisma.adminAuditLog.findMany({
			include: { admin: { select: { displayName: true } } },
			orderBy: { createdAt: 'desc' },
			take: 100,
		});
		res.json({
			metrics,
			auditLogs: auditLogs.map(({ admin, ...log }) => ({ ...log, adminName: admin?.displayName || 'Administrator' })),
		});
	} catch (error) {
		next(error);
	}
});

router.get('/rights', async (_req, res, next) => {
	try {
		const [movieRights, seriesRights] = await Promise.all([
			prisma.contentRights.findMany({ where: { movieId: { not: null } }, include: { movie: { select: { id: true, title: true, state: true } } } }),
			prisma.contentRights.findMany({ where: { seriesId: { not: null } }, include: { series: { select: { id: true, title: true, state: true } } } }),
		]);
		res.json({ rights: [...movieRights, ...seriesRights] });
	} catch (error) {
		next(error);
	}
});

router.patch('/rights/:rightsId', async (req: AuthenticatedRequest, res, next) => {
	try {
		const states = ['OWNED', 'LICENSED', 'PERMISSION_GRANTED', 'PUBLIC_DOMAIN', 'PENDING_VERIFICATION', 'EXPIRED'];
		if (!states.includes(req.body.rightsStatus)) {
			res.status(400).json({ error: 'Invalid rights status.' });
			return;
		}
		const rights = await prisma.contentRights.update({
			where: { id: req.params.rightsId },
			data: {
				rightsStatus: req.body.rightsStatus,
				...(typeof req.body.rightsHolder === 'string' && req.body.rightsHolder.trim() ? { rightsHolder: req.body.rightsHolder.trim() } : {}),
			},
		});
		await prisma.adminAuditLog.create({
			data: {
				adminId: req.auth!.userId,
				action: 'UPDATE_CONTENT_RIGHTS',
				entityType: 'ContentRights',
				entityId: rights.id,
				metadata: JSON.stringify({ rightsStatus: rights.rightsStatus }),
			},
		});
		res.json({ rights });
	} catch (error) {
		next(error);
	}
});

// Media Asset Management
router.get('/media', async (_req, res, next) => {
	try {
		const [assets, movies, series] = await Promise.all([
			prisma.videoAsset.findMany(),
			prisma.movie.findMany({ select: { id: true, title: true, posterUrl: true, videoUrl: true, trailerUrl: true } }),
			prisma.series.findMany({ select: { id: true, title: true, posterUrl: true, trailerUrl: true } }),
		]);
		const usedUrls = new Set<string>();
		for (const m of movies) {
			if (m.posterUrl) usedUrls.add(m.posterUrl);
			if (m.videoUrl) usedUrls.add(m.videoUrl);
			if (m.trailerUrl) usedUrls.add(m.trailerUrl);
		}
		for (const s of series) {
			if (s.posterUrl) usedUrls.add(s.posterUrl);
			if (s.trailerUrl) usedUrls.add(s.trailerUrl);
		}
		const enriched = assets.map((asset: any) => {
			const url = asset.sourceKey || asset.originalUrl || '';
			return {
				...asset,
				originalUrl: url,
				inUse: Boolean(asset.movieId || asset.episodeId || usedUrls.has(url)),
			};
		});
		res.json({ assets: enriched, r2Configured: r2Service.isConfigured() });
	} catch (error) {
		next(error);
	}
});

router.post('/media', async (req: AuthenticatedRequest, res, next) => {
	try {
		const originalUrl = typeof req.body.originalUrl === 'string' ? req.body.originalUrl.trim() : '';
		if (!originalUrl) {
			res.status(400).json({ error: 'originalUrl is required.' });
			return;
		}

		let resolvedMovieId: string | null = null;
		let resolvedEpisodeId: string | null = null;

		if (typeof req.body.movieId === 'string' && req.body.movieId.trim()) {
			const foundMovie = await prisma.movie.findFirst({
				where: { OR: [{ id: req.body.movieId.trim() }, { slug: req.body.movieId.trim() }] },
			});
			if (foundMovie) resolvedMovieId = foundMovie.id;
		}

		if (!resolvedMovieId && typeof req.body.episodeId === 'string' && req.body.episodeId.trim()) {
			const foundEp = await prisma.episode.findUnique({ where: { id: req.body.episodeId.trim() } });
			if (foundEp) resolvedEpisodeId = foundEp.id;
		}

		if (!resolvedMovieId && !resolvedEpisodeId) {
			const fallbackMovie = await prisma.movie.findFirst();
			if (fallbackMovie) resolvedMovieId = fallbackMovie.id;
		}

		const asset = await prisma.videoAsset.create({
			data: {
				sourceKey: originalUrl,
				movieId: resolvedMovieId,
				episodeId: resolvedEpisodeId,
				status: 'READY',
			},
		});
		await prisma.adminAuditLog.create({
			data: {
				adminId: req.auth!.userId,
				action: 'REGISTER_MEDIA_ASSET',
				entityType: 'VideoAsset',
				entityId: asset.id,
				metadata: JSON.stringify({ originalUrl }),
			},
		});
		res.status(201).json({
			asset: {
				...asset,
				originalUrl: asset.sourceKey || originalUrl,
			},
		});
	} catch (error) {
		next(error);
	}
});

router.delete('/media/:assetId', async (req: AuthenticatedRequest, res, next) => {
	try {
		const asset = await prisma.videoAsset.findUnique({ where: { id: req.params.assetId } });
		if (!asset) {
			res.status(404).json({ error: 'Media asset not found.' });
			return;
		}
		if (r2Service.isConfigured() && req.query.objectKey && typeof req.query.objectKey === 'string') {
			try {
				await r2Service.deleteObject(req.query.objectKey);
			} catch (err) {
				console.warn('Could not delete object from R2:', err);
			}
		}
		await prisma.videoAsset.delete({ where: { id: asset.id } });
		await prisma.adminAuditLog.create({
			data: {
				adminId: req.auth!.userId,
				action: 'DELETE_MEDIA_ASSET',
				entityType: 'VideoAsset',
				entityId: asset.id,
			},
		});
		res.json({ message: 'Media asset removed.' });
	} catch (error) {
		next(error);
	}
});

export default router;

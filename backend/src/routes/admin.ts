import { Router } from 'express';
import prisma from '../../prisma/prisma';
import { r2Service } from '../services/cloudflareR2';
import { authenticateUser, requireRole, type AuthenticatedRequest } from '../auth';
import { getInterpreterAssignments, type InterpreterAssignmentsMap } from '../services/platformState';

const router = Router();
router.use(authenticateUser, requireRole(['ADMIN', 'SUPER_ADMIN']));

function formatAdminMovie(movie: any, assignments?: InterpreterAssignmentsMap) {
	const genres = Array.isArray(movie.movieGenres)
		? movie.movieGenres.map((entry: any) => entry.genre?.slug || entry.genreId).filter(Boolean)
		: Array.isArray(movie.genres)
			? movie.genres
			: [];
	const rights = movie.contentRights || movie.rights || undefined;
	const assign = assignments?.movies[movie.slug] || assignments?.movies[movie.id];
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
		interpreterSlug: assign?.interpreterSlug || movie.interpreterSlug || undefined,
		interpreterName: assign?.interpreterName || movie.interpreterName || undefined,
		badgeIndicator: assign?.badgeIndicator ?? movie.badgeIndicator ?? null,
		rights,
	};
}

function formatAdminSeries(item: any, assignments?: InterpreterAssignmentsMap) {
	const genres = Array.isArray(item.seriesGenres)
		? item.seriesGenres.map((entry: any) => entry.genre?.slug || entry.genreId).filter(Boolean)
		: Array.isArray(item.genres)
			? item.genres
			: [];
	const serAssign = assignments?.series[item.slug] || assignments?.series[item.id];
	const seasons = Array.isArray(item.seasons)
		? item.seasons.map((sea: any) => ({
				...sea,
				episodes: Array.isArray(sea.episodes)
					? sea.episodes.map((ep: any) => {
							const epAssign = assignments?.episodes[ep.id];
							return {
								...ep,
								interpreterSlug: epAssign?.interpreterSlug || ep.interpreterSlug || serAssign?.interpreterSlug || undefined,
								interpreterName: epAssign?.interpreterName || ep.interpreterName || serAssign?.interpreterName || undefined,
							};
					  })
					: [],
		  }))
		: [];
	return {
		...item,
		posterUrl: item.posterUrl || '',
		backdropUrl: item.backdropUrl || item.posterUrl || '',
		trailerUrl: item.trailerUrl || '',
		genres: genres.length > 0 ? genres : ['drama'],
		seasons,
		interpreterSlug: serAssign?.interpreterSlug || item.interpreterSlug || undefined,
		interpreterName: serAssign?.interpreterName || item.interpreterName || undefined,
		badgeIndicator: serAssign?.badgeIndicator ?? item.badgeIndicator ?? null,
		rights: item.contentRights || item.rights || undefined,
	};
}

router.get('/catalog', async (_req, res, next) => {
	try {
		const [movies, series, assignments] = await Promise.all([
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
			getInterpreterAssignments(),
		]);
		res.json({
			movies: movies.map(m => formatAdminMovie(m, assignments)),
			series: series.map(s => formatAdminSeries(s, assignments)),
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
				...(typeof req.body.licenseReference === 'string' ? { licenseReference: req.body.licenseReference.trim() || null } : {}),
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
		const candidateKey =
			(typeof req.query.objectKey === 'string' && req.query.objectKey.trim()) ||
			r2Service.extractObjectKeyFromUrl(asset.sourceKey);
		if (r2Service.isConfigured() && candidateKey) {
			const [movies, series] = await Promise.all([
				prisma.movie.findMany({ select: { posterUrl: true, backdropUrl: true, trailerUrl: true, videoUrl: true } }),
				prisma.series.findMany({ select: { posterUrl: true, backdropUrl: true, trailerUrl: true } }),
			]);
			const isReferenced =
				movies.some(m =>
					[m.posterUrl, m.backdropUrl, m.trailerUrl, m.videoUrl].some(
						u => u === asset.sourceKey || r2Service.extractObjectKeyFromUrl(u) === candidateKey,
					),
				) ||
				series.some(s =>
					[s.posterUrl, s.backdropUrl, s.trailerUrl].some(
						u => u === asset.sourceKey || r2Service.extractObjectKeyFromUrl(u) === candidateKey,
					),
				);
			if (!isReferenced) {
				try {
					await r2Service.deleteObject(candidateKey);
				} catch (err) {
					console.warn('Could not delete object from R2:', err);
				}
			}
		}
		await prisma.videoAsset.delete({ where: { id: asset.id } });
		await prisma.adminAuditLog.create({
			data: {
				adminId: req.auth!.userId,
				action: 'DELETE_MEDIA_ASSET',
				entityType: 'VideoAsset',
				entityId: asset.id,
				metadata: JSON.stringify({ sourceKey: asset.sourceKey }),
			},
		});
		res.json({ message: 'Media asset removed.' });
	} catch (error) {
		next(error);
	}
});

// User Accounts & Roles Management
router.get('/users', async (_req, res, next) => {
	try {
		const users = await prisma.user.findMany({
			orderBy: { createdAt: 'desc' },
			take: 200,
		});
		res.json({
			users: users.map(({ passwordHash: _pw, ...u }: any) => u),
		});
	} catch (error) {
		next(error);
	}
});

router.patch('/users/:userId/role', async (req: AuthenticatedRequest, res, next) => {
	try {
		const allowedRoles = ['USER', 'EDITOR', 'ADMIN', 'SUPER_ADMIN'] as const;
		const role = req.body.role;
		if (!allowedRoles.includes(role)) {
			res.status(400).json({ error: 'Invalid user role.' });
			return;
		}
		if (req.params.userId === req.auth?.userId && !['ADMIN', 'SUPER_ADMIN'].includes(role)) {
			res.status(400).json({ error: 'You cannot demote your own administrator account.' });
			return;
		}
		const updated = await prisma.user.update({
			where: { id: req.params.userId },
			data: { role },
		});
		await prisma.adminAuditLog.create({
			data: {
				adminId: req.auth!.userId,
				action: 'UPDATE_USER_ROLE',
				entityType: 'User',
				entityId: updated.id,
				metadata: JSON.stringify({ email: updated.email, role }),
			},
		});
		const { passwordHash: _pw, ...safeUser } = updated as any;
		res.json({ user: safeUser });
	} catch (error) {
		next(error);
	}
});

export default router;

import { Router } from 'express';
import prisma from '../../prisma/prisma';
import { r2Service } from '../services/cloudflareR2';
import { authenticateUser, requireRole, type AuthenticatedRequest } from '../auth';

const router = Router();
router.use(authenticateUser, requireRole(['ADMIN', 'SUPER_ADMIN']));

router.get('/metrics', async (_req, res, next) => {
	try {
		const [totalUsers, totalMovies, totalSeries, totalEpisodes, movieViews, seriesViews, sponsorImpressions, sponsorClicks, affiliateClicks, pendingMovieRights, pendingSeriesRights, campaigns, verifiedAffiliate] = await Promise.all([
			prisma.user.count(),
			prisma.movie.count(),
			prisma.series.count(),
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
		]);
		const metrics = {
			totalUsers,
			totalMovies,
			totalSeries,
			totalEpisodes,
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
		res.json({ metrics, auditLogs: auditLogs.map(({ admin, ...log }) => ({ ...log, adminName: admin.displayName })) });
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
		const rights = await prisma.contentRights.update({ where: { id: req.params.rightsId }, data: { rightsStatus: req.body.rightsStatus } });
		await prisma.adminAuditLog.create({ data: { adminId: req.auth!.userId, action: 'UPDATE_CONTENT_RIGHTS', entityType: 'ContentRights', entityId: rights.id, metadata: JSON.stringify({ rightsStatus: rights.rightsStatus }) } });
		res.json({ rights });
	} catch (error) {
		next(error);
	}
});

export default router;

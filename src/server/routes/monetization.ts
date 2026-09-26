import { Router } from 'express';
import { AdPlacementType, AffiliateConversionStatus, CampaignPaymentStatus, Prisma } from '@prisma/client';
import prisma from '../../../prisma/prisma';
import { authenticateUser, requireRole, type AuthenticatedRequest } from '../../../auth';

const router = Router();
const admins = ['ADMIN', 'SUPER_ADMIN'];
const placements = Object.values(AdPlacementType);
const monetagScriptOrigins = new Set(
	(process.env.MONETAG_ALLOWED_SCRIPT_ORIGINS || '').split(',').map(origin => origin.trim()).filter(Boolean),
);

function publicUrl(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	try {
		const parsed = new URL(value);
		return ['https:', 'http:'].includes(parsed.protocol) ? parsed.toString() : null;
	} catch {
		return null;
	}
}

function monetagScriptUrl(value: unknown): string | null {
	const url = publicUrl(value);
	if (!url) return null;
	const parsed = new URL(url);
	return parsed.protocol === 'https:' && monetagScriptOrigins.has(parsed.origin) ? parsed.toString() : null;
}

function getMonetagScriptUrl(zoneId: string, tagCode: unknown): string | null {
	if (typeof tagCode !== 'string' || tagCode.length > 2000) return null;
	const match = /^\s*<script\b([^>]*)>\s*<\/script>\s*$/i.exec(tagCode);
	if (!match || /\bon[a-z]+\s*=/i.test(match[1])) return null;
	const src = /\bsrc\s*=\s*(["'])(.*?)\1/i.exec(match[1])?.[2];
	if (!src) return null;
	const embeddedZone = /\bdata-zone\s*=\s*(["'])(.*?)\1/i.exec(match[1])?.[2];
	if (embeddedZone && embeddedZone !== zoneId) return null;
	return monetagScriptUrl(src);
}

function parseUsdAmount(value: unknown, defaultValue = '0'): Prisma.Decimal | null {
	const raw = value ?? defaultValue;
	if ((typeof raw !== 'string' && typeof raw !== 'number') || !/^\d{1,10}(?:\.\d{1,2})?$/.test(String(raw))) return null;
	const amount = new Prisma.Decimal(raw);
	return amount.isFinite() ? amount : null;
}

router.get('/placements', async (req, res, next) => {
	try {
		const placement = req.query.placement;
		if (typeof placement !== 'string' || !placements.includes(placement as AdPlacementType)) {
			res.status(400).json({ error: 'A valid placement is required.' });
			return;
		}
		const now = new Date();
		const campaign = await prisma.sponsorCampaign.findFirst({
			where: {
				placement: placement as AdPlacementType,
				active: true,
				startDate: { lte: now },
				endDate: { gte: now },
				sponsor: { active: true },
			},
			include: { sponsor: true, creatives: true, _count: { select: { impressions: true } } },
			orderBy: { createdAt: 'desc' },
		});
		const eligible = campaign && (campaign.impressionLimit === null || campaign._count.impressions < campaign.impressionLimit)
			? campaign
			: null;
		const setting = await prisma.monetagPlacementSetting.findUnique({ where: { placement: placement as AdPlacementType } });
		if (eligible?.creatives.length) {
			await prisma.adImpression.create({ data: { campaignId: eligible.id } });
			const creative = eligible.creatives[0];
			res.json({
				type: 'SPONSOR',
				campaignId: eligible.id,
				sponsorName: eligible.sponsor.name,
				title: creative.title,
				tagline: creative.tagline || '',
				imageUrl: creative.imageUrl,
				callToAction: creative.callToAction,
				destinationUrl: eligible.destinationUrl,
				monetagEnabled: Boolean(setting?.enabled),
			});
			return;
		}

		const affiliate = await prisma.affiliateCampaign.findFirst({
			where: { placement: placement as AdPlacementType, active: true, startDate: { lte: now }, endDate: { gte: now }, partner: { active: true } },
			include: { partner: true },
			orderBy: { startDate: 'desc' },
		});
		if (!affiliate) {
			res.json(null);
			return;
		}
		await prisma.affiliateImpression.create({ data: { campaignId: affiliate.id } });
		res.json({
			type: 'AFFILIATE',
			campaignId: affiliate.id,
			sponsorName: affiliate.partner.partnerName,
			title: affiliate.campaignName,
			tagline: affiliate.partner.description || '',
			imageUrl: affiliate.imageUrl || '',
			callToAction: 'Learn More',
			destinationUrl: affiliate.destinationUrl,
			trackingUrl: affiliate.trackingUrl,
			monetagEnabled: Boolean(setting?.enabled),
		});
	} catch (error) {
		next(error);
	}
});

router.post('/track-click', async (req, res, next) => {
	try {
		const campaignId = typeof req.body.campaignId === 'string' ? req.body.campaignId : '';
		const type = req.body.type;
		if (!campaignId || !['SPONSOR', 'AFFILIATE'].includes(type)) {
			res.status(400).json({ error: 'A campaignId and valid campaign type are required.' });
			return;
		}
		if (type === 'SPONSOR') {
			const campaign = await prisma.sponsorCampaign.findUnique({ where: { id: campaignId }, select: { id: true, active: true, startDate: true, endDate: true, clickLimit: true, _count: { select: { clicks: true } } } });
			const now = new Date();
			if (!campaign || !campaign.active || campaign.startDate > now || campaign.endDate < now || (campaign.clickLimit !== null && campaign._count.clicks >= campaign.clickLimit)) {
				res.status(404).json({ error: 'Active campaign not found.' });
				return;
			}
			await prisma.adClick.create({ data: { campaignId } });
		} else {
			const campaign = await prisma.affiliateCampaign.findUnique({ where: { id: campaignId }, select: { id: true, active: true, startDate: true, endDate: true, partner: { select: { active: true } } } });
			const now = new Date();
			if (!campaign || !campaign.active || !campaign.partner.active || campaign.startDate > now || campaign.endDate < now) {
				res.status(404).json({ error: 'Active affiliate campaign not found.' });
				return;
			}
			await prisma.affiliateClick.create({ data: { campaignId } });
		}
		res.status(204).end();
	} catch (error) {
		next(error);
	}
});

router.get('/sponsors', authenticateUser, requireRole(admins), async (_req, res, next) => {
	try {
		const [sponsors, campaigns] = await Promise.all([
			prisma.sponsor.findMany({ orderBy: { createdAt: 'desc' } }),
			prisma.sponsorCampaign.findMany({ include: { sponsor: true, creatives: true, _count: { select: { impressions: true, clicks: true } } }, orderBy: { createdAt: 'desc' } }),
		]);
		res.json({ sponsors, campaigns: campaigns.map(campaign => ({ ...campaign, impressionsCount: campaign._count.impressions, clicksCount: campaign._count.clicks, outstandingAmount: Number(campaign.agreedPrice) - Number(campaign.paidAmount) })) });
	} catch (error) {
		next(error);
	}
});

router.post('/sponsors', authenticateUser, requireRole(admins), async (req: AuthenticatedRequest, res, next) => {
	try {
		const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
		const websiteUrl = publicUrl(req.body.websiteUrl);
		if (!name || !websiteUrl) {
			res.status(400).json({ error: 'Sponsor name and a valid website URL are required.' });
			return;
		}
		const sponsor = await prisma.sponsor.create({ data: { name, websiteUrl } });
		await prisma.adminAuditLog.create({ data: { adminId: req.auth!.userId, action: 'CREATE_SPONSOR', entityType: 'Sponsor', entityId: sponsor.id } });
		res.status(201).json({ sponsor });
	} catch (error) {
		next(error);
	}
});

router.patch('/sponsors/:sponsorId', authenticateUser, requireRole(admins), async (req: AuthenticatedRequest, res, next) => {
	try {
		const data: Prisma.SponsorUpdateInput = {};
		if (typeof req.body.name === 'string' && req.body.name.trim()) data.name = req.body.name.trim();
		if (req.body.websiteUrl !== undefined) {
			const websiteUrl = publicUrl(req.body.websiteUrl);
			if (!websiteUrl) {
				res.status(400).json({ error: 'A valid sponsor website URL is required.' });
				return;
			}
			data.websiteUrl = websiteUrl;
		}
		if (typeof req.body.active === 'boolean') data.active = req.body.active;
		if (typeof req.body.contactName === 'string') data.contactName = req.body.contactName.trim() || null;
		if (typeof req.body.contactEmail === 'string') data.contactEmail = req.body.contactEmail.trim() || null;
		if (Object.keys(data).length === 0) {
			res.status(400).json({ error: 'No valid sponsor changes provided.' });
			return;
		}
		const sponsor = await prisma.sponsor.update({ where: { id: req.params.sponsorId }, data });
		await prisma.adminAuditLog.create({ data: { adminId: req.auth!.userId, action: 'UPDATE_SPONSOR', entityType: 'Sponsor', entityId: sponsor.id, metadata: JSON.stringify(req.body) } });
		res.json({ sponsor });
	} catch (error) {
		next(error);
	}
});

router.post('/sponsors/:sponsorId/campaigns', authenticateUser, requireRole(admins), async (req: AuthenticatedRequest, res, next) => {
	try {
		const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
		const destinationUrl = publicUrl(req.body.destinationUrl);
		const startDate = new Date(req.body.startDate);
		const endDate = new Date(req.body.endDate);
		const placement = req.body.placement;
		const agreedPrice = parseUsdAmount(req.body.agreedPrice);
		if (!name || !destinationUrl || !Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime()) || endDate <= startDate || !placements.includes(placement) || !agreedPrice) {
			res.status(400).json({ error: 'Provide a name, valid date range, placement, destination URL, and non-negative agreed price.' });
			return;
		}
		const imageUrl = publicUrl(req.body.imageUrl);
		const title = typeof req.body.creativeTitle === 'string' ? req.body.creativeTitle.trim() : name;
		if (!imageUrl) {
			res.status(400).json({ error: 'A valid creative image URL is required.' });
			return;
		}
		const campaign = await prisma.sponsorCampaign.create({
			data: {
				sponsorId: req.params.sponsorId,
				name,
				destinationUrl,
				startDate,
				endDate,
				placement,
				agreedPrice,
				creatives: { create: { title, imageUrl, tagline: typeof req.body.tagline === 'string' ? req.body.tagline : null } },
			},
			include: { creatives: true, sponsor: true },
		});
		await prisma.adminAuditLog.create({ data: { adminId: req.auth!.userId, action: 'CREATE_SPONSOR_CAMPAIGN', entityType: 'SponsorCampaign', entityId: campaign.id } });
		res.status(201).json({ campaign });
	} catch (error) {
		next(error);
	}
});

router.patch('/sponsors/campaigns/:campaignId', authenticateUser, requireRole(admins), async (req: AuthenticatedRequest, res, next) => {
	try {
		const current = await prisma.sponsorCampaign.findUnique({ where: { id: req.params.campaignId }, include: { creatives: true } });
		if (!current) {
			res.status(404).json({ error: 'Campaign not found.' });
			return;
		}
		const data: Prisma.SponsorCampaignUpdateInput = {};
		if (typeof req.body.active === 'boolean') data.active = req.body.active;
		if (typeof req.body.name === 'string' && req.body.name.trim()) data.name = req.body.name.trim();
		if (req.body.destinationUrl !== undefined) {
			const destinationUrl = publicUrl(req.body.destinationUrl);
			if (!destinationUrl) {
				res.status(400).json({ error: 'A valid campaign destination URL is required.' });
				return;
			}
			data.destinationUrl = destinationUrl;
		}
		if (req.body.placement !== undefined) {
			if (!placements.includes(req.body.placement)) {
				res.status(400).json({ error: 'Invalid campaign placement.' });
				return;
			}
			data.placement = req.body.placement;
		}
		const startDate = req.body.startDate === undefined ? current.startDate : new Date(req.body.startDate);
		const endDate = req.body.endDate === undefined ? current.endDate : new Date(req.body.endDate);
		if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime()) || endDate <= startDate) {
			res.status(400).json({ error: 'Campaign end date must be later than its start date.' });
			return;
		}
		if (req.body.startDate !== undefined) data.startDate = startDate;
		if (req.body.endDate !== undefined) data.endDate = endDate;
		if (req.body.agreedPrice !== undefined) {
			const agreedPrice = parseUsdAmount(req.body.agreedPrice);
			if (!agreedPrice || agreedPrice.lessThan(current.paidAmount)) {
				res.status(400).json({ error: 'Contracted amount cannot be negative or lower than the paid amount.' });
				return;
			}
			data.agreedPrice = agreedPrice;
		}
		if (req.body.paidAmount !== undefined) {
			const paidAmount = parseUsdAmount(req.body.paidAmount);
			if (!paidAmount || paidAmount.greaterThan(current.agreedPrice)) {
				res.status(400).json({ error: 'Paid amount must be between zero and the contracted amount.' });
				return;
			}
			data.paidAmount = paidAmount;
			data.internalPaymentStatus = paidAmount.isZero() ? CampaignPaymentStatus.UNPAID : paidAmount.equals(current.agreedPrice) ? CampaignPaymentStatus.PAID : CampaignPaymentStatus.PARTIAL;
		}
		const creative = current.creatives[0];
		if (creative && (req.body.imageUrl !== undefined || req.body.creativeTitle !== undefined || req.body.tagline !== undefined)) {
			const creativeData: Prisma.AdCreativeUpdateInput = {};
			if (req.body.imageUrl !== undefined) {
				const imageUrl = publicUrl(req.body.imageUrl);
				if (!imageUrl) {
					res.status(400).json({ error: 'A valid creative image URL is required.' });
					return;
				}
				creativeData.imageUrl = imageUrl;
			}
			if (typeof req.body.creativeTitle === 'string' && req.body.creativeTitle.trim()) creativeData.title = req.body.creativeTitle.trim();
			if (typeof req.body.tagline === 'string') creativeData.tagline = req.body.tagline.trim() || null;
			await prisma.adCreative.update({ where: { id: creative.id }, data: creativeData });
		}
		const campaign = await prisma.sponsorCampaign.update({ where: { id: current.id }, data });
		await prisma.adminAuditLog.create({ data: { adminId: req.auth!.userId, action: 'UPDATE_SPONSOR_CAMPAIGN', entityType: 'SponsorCampaign', entityId: campaign.id, metadata: JSON.stringify(req.body) } });
		res.json({ campaign, outstandingAmount: Number(campaign.agreedPrice) - Number(campaign.paidAmount) });
	} catch (error) {
		next(error);
	}
});

router.get('/monetag', authenticateUser, requireRole(admins), async (_req, res, next) => {
	try {
		const settings = await prisma.monetagPlacementSetting.findMany();
		const rows = placements.map(placement => {
			const setting = settings.find(candidate => candidate.placement === placement);
			return { placement, enabled: setting?.enabled ?? false, zoneId: setting?.zoneId || '', tagCode: setting?.tagCode || '' };
		});
		const reported = await prisma.monetagRevenueRecord.aggregate({ _sum: { amount: true } });
		res.json({ placements: rows, reportedRevenue: Number(reported._sum.amount || 0), revenueType: 'REPORTED_ESTIMATE' });
	} catch (error) {
		next(error);
	}
});

router.get('/monetag/placement', async (req, res, next) => {
	try {
		const placement = req.query.placement;
		if (typeof placement !== 'string' || !placements.includes(placement as AdPlacementType)) {
			res.status(400).json({ error: 'A valid placement is required.' });
			return;
		}
		const setting = await prisma.monetagPlacementSetting.findUnique({ where: { placement: placement as AdPlacementType } });
		const scriptUrl = setting?.zoneId ? getMonetagScriptUrl(setting.zoneId, setting.tagCode) : null;
		const enabled = Boolean(setting?.enabled && setting.zoneId && scriptUrl);
		res.json({ placement, enabled, zoneId: enabled ? setting!.zoneId : null, tagCode: enabled ? setting!.tagCode : null });
	} catch (error) {
		next(error);
	}
});

router.patch('/monetag/placements/:placement', authenticateUser, requireRole(admins), async (req: AuthenticatedRequest, res, next) => {
	try {
		const placement = req.params.placement as AdPlacementType;
		const zoneId = typeof req.body.zoneId === 'string' ? req.body.zoneId.trim() : '';
		const tagCode = typeof req.body.tagCode === 'string' ? req.body.tagCode.trim() : '';
		const scriptUrl = tagCode ? getMonetagScriptUrl(zoneId, tagCode) : null;
		if (!placements.includes(placement) || typeof req.body.enabled !== 'boolean' || (zoneId && !/^[A-Za-z0-9_-]{1,80}$/.test(zoneId)) || (tagCode && !scriptUrl)) {
			res.status(400).json({ error: 'Provide a valid placement, enabled flag, Zone ID, and single-script HTTPS publisher tag from an allowlisted origin.' });
			return;
		}
		if (req.body.enabled && (!zoneId || !tagCode || !scriptUrl)) {
			res.status(400).json({ error: 'A Zone ID and verified publisher tag are required before enabling a placement.' });
			return;
		}
		const setting = await prisma.monetagPlacementSetting.upsert({
			where: { placement },
			create: { placement, enabled: req.body.enabled, zoneId: zoneId || null, scriptUrl, tagCode: tagCode || null },
			update: { enabled: req.body.enabled, zoneId: zoneId || null, scriptUrl, tagCode: tagCode || null },
		});
		await prisma.adminAuditLog.create({ data: { adminId: req.auth!.userId, action: 'UPDATE_MONETAG_PLACEMENT', entityType: 'MonetagPlacementSetting', entityId: placement, metadata: JSON.stringify({ enabled: setting.enabled, zoneId: setting.zoneId }) } });
		res.json({ setting });
	} catch (error) {
		next(error);
	}
});

router.post('/monetag/revenue', authenticateUser, requireRole(admins), async (req, res, next) => {
	try {
		const amount = parseUsdAmount(req.body.amount);
		const reportDate = new Date(req.body.reportDate);
		const source = typeof req.body.source === 'string' ? req.body.source.trim() : '';
		const currency = typeof req.body.currency === 'string' ? req.body.currency.toUpperCase() : 'USD';
		if (!amount || currency !== 'USD' || !Number.isFinite(reportDate.getTime()) || !source) {
			res.status(400).json({ error: 'A finite non-negative USD report, report date, and source are required.' });
			return;
		}
		const record = await prisma.monetagRevenueRecord.create({ data: { amount, reportDate, source, currency } });
		res.status(201).json({ record, revenueType: 'REPORTED_ESTIMATE' });
	} catch (error) {
		next(error);
	}
});

router.get('/affiliate', authenticateUser, requireRole(admins), async (_req, res, next) => {
	try {
		const [partners, campaigns, verified] = await Promise.all([
			prisma.affiliatePartner.findMany({ orderBy: { partnerName: 'asc' } }),
			prisma.affiliateCampaign.findMany({ include: { partner: true, _count: { select: { clicks: true } }, conversions: true }, orderBy: { startDate: 'desc' } }),
			prisma.affiliateConversion.aggregate({ where: { status: 'VERIFIED' }, _sum: { commissionRevenue: true } }),
		]);
		res.json({ partners, campaigns: campaigns.map(campaign => ({ ...campaign, clicksCount: campaign._count.clicks })), verifiedRevenue: Number(verified._sum.commissionRevenue || 0) });
	} catch (error) {
		next(error);
	}
});

router.post('/affiliate/partners', authenticateUser, requireRole(admins), async (req: AuthenticatedRequest, res, next) => {
	try {
		const partnerName = typeof req.body.partnerName === 'string' ? req.body.partnerName.trim() : '';
		const websiteUrl = publicUrl(req.body.websiteUrl);
		if (!partnerName || !websiteUrl) {
			res.status(400).json({ error: 'Partner name and valid website URL are required.' });
			return;
		}
		const partner = await prisma.affiliatePartner.create({ data: { partnerName, websiteUrl, description: typeof req.body.description === 'string' ? req.body.description : null } });
		await prisma.adminAuditLog.create({ data: { adminId: req.auth!.userId, action: 'CREATE_AFFILIATE_PARTNER', entityType: 'AffiliatePartner', entityId: partner.id } });
		res.status(201).json({ partner });
	} catch (error) {
		next(error);
	}
});

router.patch('/affiliate/partners/:partnerId', authenticateUser, requireRole(admins), async (req: AuthenticatedRequest, res, next) => {
	try {
		const data: Prisma.AffiliatePartnerUpdateInput = {};
		if (typeof req.body.partnerName === 'string' && req.body.partnerName.trim()) data.partnerName = req.body.partnerName.trim();
		if (typeof req.body.active === 'boolean') data.active = req.body.active;
		if (typeof req.body.description === 'string') data.description = req.body.description.trim() || null;
		if (req.body.websiteUrl !== undefined) {
			const websiteUrl = publicUrl(req.body.websiteUrl);
			if (!websiteUrl) {
				res.status(400).json({ error: 'A valid partner website URL is required.' });
				return;
			}
			data.websiteUrl = websiteUrl;
		}
		if (Object.keys(data).length === 0) {
			res.status(400).json({ error: 'No valid partner changes provided.' });
			return;
		}
		const partner = await prisma.affiliatePartner.update({ where: { id: req.params.partnerId }, data });
		await prisma.adminAuditLog.create({ data: { adminId: req.auth!.userId, action: 'UPDATE_AFFILIATE_PARTNER', entityType: 'AffiliatePartner', entityId: partner.id } });
		res.json({ partner });
	} catch (error) {
		next(error);
	}
});

router.post('/affiliate/campaigns', authenticateUser, requireRole(admins), async (req: AuthenticatedRequest, res, next) => {
	try {
		const campaignName = typeof req.body.campaignName === 'string' ? req.body.campaignName.trim() : '';
		const destinationUrl = publicUrl(req.body.destinationUrl);
		const trackingUrl = publicUrl(req.body.trackingUrl);
		const imageUrl = req.body.imageUrl ? publicUrl(req.body.imageUrl) : null;
		const startDate = new Date(req.body.startDate);
		const endDate = new Date(req.body.endDate);
		if (!campaignName || !req.body.partnerId || !destinationUrl || !trackingUrl || !imageUrl || !Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime()) || endDate <= startDate || !placements.includes(req.body.placement)) {
			res.status(400).json({ error: 'Provide a partner, campaign name, valid affiliate and creative URLs, date range, and placement.' });
			return;
		}
		const campaign = await prisma.affiliateCampaign.create({ data: { partnerId: req.body.partnerId, campaignName, destinationUrl, trackingUrl, imageUrl, placement: req.body.placement, startDate, endDate } });
		await prisma.adminAuditLog.create({ data: { adminId: req.auth!.userId, action: 'CREATE_AFFILIATE_CAMPAIGN', entityType: 'AffiliateCampaign', entityId: campaign.id } });
		res.status(201).json({ campaign });
	} catch (error) {
		next(error);
	}
});

router.patch('/affiliate/campaigns/:campaignId', authenticateUser, requireRole(admins), async (req: AuthenticatedRequest, res, next) => {
	try {
		const data: Prisma.AffiliateCampaignUpdateInput = {};
		if (typeof req.body.active === 'boolean') data.active = req.body.active;
		if (typeof req.body.campaignName === 'string' && req.body.campaignName.trim()) data.campaignName = req.body.campaignName.trim();
		for (const field of ['destinationUrl', 'trackingUrl', 'imageUrl'] as const) {
			if (req.body[field] === undefined) continue;
			const url = req.body[field] === '' && field === 'imageUrl' ? null : publicUrl(req.body[field]);
			if (req.body[field] && !url) {
				res.status(400).json({ error: `Invalid ${field}.` });
				return;
			}
			(data as Record<string, unknown>)[field] = url;
		}
		if (req.body.placement !== undefined) {
			if (!placements.includes(req.body.placement)) {
				res.status(400).json({ error: 'Invalid campaign placement.' });
				return;
			}
			data.placement = req.body.placement;
		}
		const current = await prisma.affiliateCampaign.findUnique({ where: { id: req.params.campaignId } });
		if (!current) {
			res.status(404).json({ error: 'Affiliate campaign not found.' });
			return;
		}
		const startDate = req.body.startDate === undefined ? current.startDate : new Date(req.body.startDate);
		const endDate = req.body.endDate === undefined ? current.endDate : new Date(req.body.endDate);
		if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime()) || endDate <= startDate) {
			res.status(400).json({ error: 'Campaign end date must be later than its start date.' });
			return;
		}
		if (req.body.startDate !== undefined) data.startDate = startDate;
		if (req.body.endDate !== undefined) data.endDate = endDate;
		const campaign = await prisma.affiliateCampaign.update({ where: { id: current.id }, data });
		await prisma.adminAuditLog.create({ data: { adminId: req.auth!.userId, action: 'UPDATE_AFFILIATE_CAMPAIGN', entityType: 'AffiliateCampaign', entityId: campaign.id } });
		res.json({ campaign });
	} catch (error) {
		next(error);
	}
});

router.post('/affiliate/campaigns/:campaignId/conversions', authenticateUser, requireRole(admins), async (req, res, next) => {
	try {
		const externalReference = typeof req.body.externalReference === 'string' ? req.body.externalReference.trim() : '';
		const commissionRevenue = parseUsdAmount(req.body.commissionRevenue);
		const currency = typeof req.body.currency === 'string' ? req.body.currency.toUpperCase() : 'USD';
		if (!commissionRevenue || !externalReference || currency !== 'USD') {
			res.status(400).json({ error: 'An external reference and finite non-negative USD commission are required.' });
			return;
		}
		const conversion = await prisma.affiliateConversion.create({ data: {
			campaignId: req.params.campaignId,
			externalReference,
			commissionRevenue,
			currency,
			status: AffiliateConversionStatus.PENDING,
		} });
		res.status(201).json({ conversion });
	} catch (error) {
		next(error);
	}
});

router.patch('/affiliate/conversions/:conversionId/verify', authenticateUser, requireRole(admins), async (req: AuthenticatedRequest, res, next) => {
	try {
		const status = req.body.status;
		if (![AffiliateConversionStatus.VERIFIED, AffiliateConversionStatus.REJECTED].includes(status)) {
			res.status(400).json({ error: 'Status must be VERIFIED or REJECTED.' });
			return;
		}
		const conversion = await prisma.affiliateConversion.update({ where: { id: req.params.conversionId }, data: { status, verifiedAt: status === AffiliateConversionStatus.VERIFIED ? new Date() : null } });
		await prisma.adminAuditLog.create({ data: { adminId: req.auth!.userId, action: `AFFILIATE_CONVERSION_${status}`, entityType: 'AffiliateConversion', entityId: conversion.id } });
		res.json({ conversion });
	} catch (error) {
		next(error);
	}
});

router.get('/analytics', authenticateUser, requireRole(admins), async (_req, res, next) => {
	try {
		const [sponsorImpressions, sponsorClicks, affiliateImpressions, affiliateClicks, verifiedAffiliateRevenue, sponsorAmounts, reportedMonetag, sponsorCampaigns, affiliateCampaigns] = await Promise.all([
			prisma.adImpression.groupBy({ by: ['campaignId'], _count: { _all: true } }),
			prisma.adClick.groupBy({ by: ['campaignId'], _count: { _all: true } }),
			prisma.affiliateImpression.groupBy({ by: ['campaignId'], _count: { _all: true } }),
			prisma.affiliateClick.groupBy({ by: ['campaignId'], _count: { _all: true } }),
			prisma.affiliateConversion.aggregate({ where: { status: 'VERIFIED' }, _sum: { commissionRevenue: true } }),
			prisma.sponsorCampaign.aggregate({ _sum: { agreedPrice: true, paidAmount: true } }),
			prisma.monetagRevenueRecord.aggregate({ _sum: { amount: true } }),
			prisma.sponsorCampaign.findMany({ select: { id: true, placement: true } }),
			prisma.affiliateCampaign.findMany({ select: { id: true, placement: true } }),
		]);
		const performance = new Map(placements.map(placement => [placement, { impressions: 0, clicks: 0 }]));
		const sponsorPlacement = new Map(sponsorCampaigns.map(campaign => [campaign.id, campaign.placement]));
		const affiliatePlacement = new Map(affiliateCampaigns.map(campaign => [campaign.id, campaign.placement]));
		for (const event of sponsorImpressions) {
			const placement = sponsorPlacement.get(event.campaignId);
			if (placement) performance.get(placement)!.impressions += event._count._all;
		}
		for (const event of sponsorClicks) {
			const placement = sponsorPlacement.get(event.campaignId);
			if (placement) performance.get(placement)!.clicks += event._count._all;
		}
		for (const event of affiliateImpressions) {
			const placement = affiliatePlacement.get(event.campaignId);
			if (placement) performance.get(placement)!.impressions += event._count._all;
		}
		for (const event of affiliateClicks) {
			const placement = affiliatePlacement.get(event.campaignId);
			if (placement) performance.get(placement)!.clicks += event._count._all;
		}
		const impressions = sponsorImpressions.reduce((sum, event) => sum + event._count._all, 0);
		const clicks = sponsorClicks.reduce((sum, event) => sum + event._count._all, 0);
		const totalAffiliateClicks = affiliateClicks.reduce((sum, event) => sum + event._count._all, 0);
		res.json({
			impressions,
			sponsorClicks: clicks,
			affiliateImpressions: affiliateImpressions.reduce((sum, event) => sum + event._count._all, 0),
			affiliateClicks: totalAffiliateClicks,
			ctr: impressions ? clicks / impressions * 100 : 0,
			placementPerformance: [...performance].map(([placement, values]) => ({ placement, ...values, ctr: values.impressions ? values.clicks / values.impressions * 100 : 0 })),
			monetagReportedEstimatedRevenue: Number(reportedMonetag._sum.amount || 0),
			sponsorContractedRevenue: Number(sponsorAmounts._sum.agreedPrice || 0),
			sponsorPaidRevenue: Number(sponsorAmounts._sum.paidAmount || 0),
			sponsorOutstandingRevenue: Number(sponsorAmounts._sum.agreedPrice || 0) - Number(sponsorAmounts._sum.paidAmount || 0),
			affiliateVerifiedRevenue: Number(verifiedAffiliateRevenue._sum.commissionRevenue || 0),
		});
	} catch (error) {
		next(error);
	}
});

export default router;

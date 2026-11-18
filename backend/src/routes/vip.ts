import { Router } from 'express';
import prisma from '../../prisma/prisma';
import { authenticateUser, requireRole, type AuthenticatedRequest } from '../auth';
import { getVipConfig, saveVipConfig, isPaymentGatewayConfigured } from '../services/platformState';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const config = await getVipConfig();
    const paymentGateway = isPaymentGatewayConfigured();
    res.json({
      config,
      vipConfig: config,
      freeViewingGuaranteed: config.freeViewingGuaranteed,
      paymentGateway,
      paymentGatewayConfigured: paymentGateway.configured,
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/config', authenticateUser, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const current = await getVipConfig();

    const updatedPlans = Array.isArray(req.body.plans)
      ? req.body.plans.map((p: any, idx: number) => ({
          id: typeof p.id === 'string' && p.id.trim() ? p.id.trim() : `vip-plan-${idx + 1}`,
          name: typeof p.name === 'string' && p.name.trim() ? p.name.trim() : `VIP Plan ${idx + 1}`,
          nameRw: typeof p.nameRw === 'string' && p.nameRw.trim() ? p.nameRw.trim() : p.name || `VIP ${idx + 1}`,
          durationDays: Math.max(1, Number(p.durationDays) || 30),
          priceRwf: Math.max(0, Number(p.priceRwf) || 0),
          priceUsd: Math.max(0, Number(p.priceUsd) || 0),
          badgeText: typeof p.badgeText === 'string' ? p.badgeText.trim() : undefined,
          popular: Boolean(p.popular),
          active: p.active !== undefined ? Boolean(p.active) : true,
        }))
      : current.plans;

    const updatedBenefits = Array.isArray(req.body.benefits)
      ? req.body.benefits.map((b: any, idx: number) => ({
          id: typeof b.id === 'string' && b.id.trim() ? b.id.trim() : `benefit-${idx + 1}`,
          key: typeof b.key === 'string' && b.key.trim() ? b.key.trim() : `BENEFIT_${idx + 1}`,
          title: typeof b.title === 'string' && b.title.trim() ? b.title.trim() : 'VIP Benefit',
          titleRw: typeof b.titleRw === 'string' && b.titleRw.trim() ? b.titleRw.trim() : b.title || 'VIP Benefit',
          description: typeof b.description === 'string' ? b.description.trim() : '',
          enabled: b.enabled !== undefined ? Boolean(b.enabled) : true,
        }))
      : current.benefits;

    const config = await saveVipConfig({
      vipEnabled: typeof req.body.vipEnabled === 'boolean' ? req.body.vipEnabled : current.vipEnabled,
      adFreeForVip: typeof req.body.adFreeForVip === 'boolean' ? req.body.adFreeForVip : current.adFreeForVip,
      reducedAdsForVip: typeof req.body.reducedAdsForVip === 'boolean' ? req.body.reducedAdsForVip : current.reducedAdsForVip,
      plans: updatedPlans,
      benefits: updatedBenefits,
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.auth!.userId,
        action: 'UPDATE_VIP_CONFIG',
        entityType: 'VipConfig',
        entityId: 'vip_config',
        metadata: JSON.stringify({
          vipEnabled: config.vipEnabled,
          adFreeForVip: config.adFreeForVip,
          reducedAdsForVip: config.reducedAdsForVip,
          plansCount: config.plans.length,
          enabledBenefitsCount: config.benefits.filter(b => b.enabled).length,
        }),
      },
    });

    const paymentGateway = isPaymentGatewayConfigured();
    res.json({
      config,
      vipConfig: config,
      freeViewingGuaranteed: config.freeViewingGuaranteed,
      paymentGateway,
      paymentGatewayConfigured: paymentGateway.configured,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/checkout', async (req, res, next) => {
  try {
    const planId = typeof req.body.planId === 'string' ? req.body.planId.trim() : '';
    const config = await getVipConfig();
    const selectedPlan = config.plans.find(p => p.id === planId && p.active);

    if (!selectedPlan) {
      res.status(404).json({ error: 'Selected VIP plan was not found or is currently inactive.', verifiedPayment: false });
      return;
    }

    const gateway = isPaymentGatewayConfigured();
    if (!gateway.configured) {
      res.status(503).json({
        error:
          'Live VIP payment checkout is not yet active because production payment provider credentials (MTN MoMo / Flutterwave / Stripe) have not been configured by the administrator. All authorized movies and series on ZIRA remain 100% free to watch without VIP.',
        paymentGatewayConfigured: false,
        freeStreamingAvailable: true,
        verifiedPayment: false,
      });
      return;
    }

    res.status(501).json({
      error: 'Verified payment session creation requires live provider webhook verification.',
      paymentGatewayConfigured: true,
      verifiedPayment: false,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

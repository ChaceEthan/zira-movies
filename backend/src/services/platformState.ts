import prisma from '../../prisma/prisma';
import {
  SEED_INTERPRETERS,
  DEFAULT_INTERPRETER_ASSIGNMENTS,
  DEFAULT_VIP_CONFIG,
  createInterpreterAvatarDataUrl,
  type SeedInterpreter,
  type VipPlatformConfig,
} from '../catalogSeedData';

export interface InterpreterAssignmentEntry {
  interpreterSlug: string;
  interpreterName: string;
  badgeIndicator?: 'NEW' | 'UPDATED' | null;
}

export interface InterpreterAssignmentsMap {
  movies: Record<string, InterpreterAssignmentEntry>;
  series: Record<string, InterpreterAssignmentEntry>;
  episodes: Record<string, { interpreterSlug: string; interpreterName: string }>;
}

function slugifyInterpreter(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
}

export async function getAllInterpreters(includeInactive = false): Promise<SeedInterpreter[]> {
  try {
    const flags = await (prisma as any).featureFlag.findMany({
      where: { key: { startsWith: 'interpreter:' } },
    });

    if (!Array.isArray(flags) || flags.length === 0) {
      for (const interp of SEED_INTERPRETERS) {
        await (prisma as any).featureFlag.upsert({
          where: { key: `interpreter:${interp.slug}` },
          update: {},
          create: {
            key: `interpreter:${interp.slug}`,
            description: JSON.stringify(interp),
            enabled: interp.active,
          },
        });
      }
      return includeInactive ? [...SEED_INTERPRETERS] : SEED_INTERPRETERS.filter(i => i.active);
    }

    const parsed: SeedInterpreter[] = [];
    for (const flag of flags) {
      if (!flag.description) continue;
      try {
        const data = JSON.parse(flag.description) as SeedInterpreter;
        const active = flag.enabled ?? data.active ?? true;
        if (!includeInactive && !active) continue;
        parsed.push({ ...data, active });
      } catch {
        // Ignore malformed entry
      }
    }

    return parsed.sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      return a.displayName.localeCompare(b.displayName);
    });
  } catch {
    return includeInactive ? [...SEED_INTERPRETERS] : SEED_INTERPRETERS.filter(i => i.active);
  }
}

export async function getInterpreterAssignments(): Promise<InterpreterAssignmentsMap> {
  try {
    const flag = await (prisma as any).featureFlag.findUnique({
      where: { key: 'interpreter_assignments' },
    });
    if (!flag || !flag.description) {
      await (prisma as any).featureFlag.upsert({
        where: { key: 'interpreter_assignments' },
        update: {},
        create: {
          key: 'interpreter_assignments',
          description: JSON.stringify(DEFAULT_INTERPRETER_ASSIGNMENTS),
          enabled: true,
        },
      });
      return structuredClone(DEFAULT_INTERPRETER_ASSIGNMENTS);
    }
    const parsed = JSON.parse(flag.description);
    return {
      movies: { ...DEFAULT_INTERPRETER_ASSIGNMENTS.movies, ...(parsed?.movies || {}) },
      series: { ...DEFAULT_INTERPRETER_ASSIGNMENTS.series, ...(parsed?.series || {}) },
      episodes: { ...DEFAULT_INTERPRETER_ASSIGNMENTS.episodes, ...(parsed?.episodes || {}) },
    };
  } catch {
    return structuredClone(DEFAULT_INTERPRETER_ASSIGNMENTS);
  }
}

export async function saveInterpreterAssignments(assignments: InterpreterAssignmentsMap): Promise<void> {
  await (prisma as any).featureFlag.upsert({
    where: { key: 'interpreter_assignments' },
    update: {
      description: JSON.stringify(assignments),
      enabled: true,
    },
    create: {
      key: 'interpreter_assignments',
      description: JSON.stringify(assignments),
      enabled: true,
    },
  });
}

export async function assignContentInterpreter(params: {
  entityType: 'movie' | 'series' | 'episode';
  key: string;
  interpreterSlug?: string | null;
  interpreterName?: string | null;
  badgeIndicator?: 'NEW' | 'UPDATED' | null;
}): Promise<void> {
  const assignments = await getInterpreterAssignments();
  const interpreters = await getAllInterpreters(true);

  const rawSlug = params.interpreterSlug ? slugifyInterpreter(params.interpreterSlug) : '';
  const rawName = params.interpreterName ? params.interpreterName.trim() : '';

  const matched =
    interpreters.find(i => i.slug === rawSlug) ||
    interpreters.find(i => i.displayName.toLowerCase() === rawName.toLowerCase());

  const resolvedSlug = matched?.slug || rawSlug;
  const resolvedName = matched?.displayName || rawName;

  if (params.entityType === 'movie') {
    if (!resolvedSlug && !resolvedName) {
      delete assignments.movies[params.key];
    } else {
      const existingBadge = assignments.movies[params.key]?.badgeIndicator ?? 'NEW';
      assignments.movies[params.key] = {
        interpreterSlug: resolvedSlug || slugifyInterpreter(resolvedName),
        interpreterName: resolvedName || resolvedSlug,
        badgeIndicator: params.badgeIndicator !== undefined ? params.badgeIndicator : existingBadge,
      };
    }
  } else if (params.entityType === 'series') {
    if (!resolvedSlug && !resolvedName) {
      delete assignments.series[params.key];
    } else {
      const existingBadge = assignments.series[params.key]?.badgeIndicator ?? 'NEW';
      assignments.series[params.key] = {
        interpreterSlug: resolvedSlug || slugifyInterpreter(resolvedName),
        interpreterName: resolvedName || resolvedSlug,
        badgeIndicator: params.badgeIndicator !== undefined ? params.badgeIndicator : existingBadge,
      };
    }
  } else if (params.entityType === 'episode') {
    if (!resolvedSlug && !resolvedName) {
      delete assignments.episodes[params.key];
    } else {
      assignments.episodes[params.key] = {
        interpreterSlug: resolvedSlug || slugifyInterpreter(resolvedName),
        interpreterName: resolvedName || resolvedSlug,
      };
    }
  }

  await saveInterpreterAssignments(assignments);
}

export async function upsertInterpreterProfile(input: {
  id?: string;
  displayName: string;
  slug?: string;
  photoUrl?: string;
  biography?: string;
  socialLinks?: SeedInterpreter['socialLinks'];
  specialtyGenres?: string[];
  isFeatured?: boolean;
  isExampleProfile?: boolean;
  active?: boolean;
}): Promise<SeedInterpreter> {
  const displayName = input.displayName.trim();
  const slug = slugifyInterpreter(input.slug?.trim() || displayName);
  const existingList = await getAllInterpreters(true);
  const existing = existingList.find(i => i.slug === slug || (input.id && i.id === input.id));

  const profile: SeedInterpreter = {
    id: existing?.id || input.id || `interp-${slug}`,
    displayName,
    slug,
    photoUrl:
      input.photoUrl?.trim() ||
      existing?.photoUrl ||
      createInterpreterAvatarDataUrl(displayName, '#7c2d12', '#f59e0b'),
    biography:
      input.biography?.trim() ||
      existing?.biography ||
      `${displayName} — Kinyarwanda film & series interpreter profile on ZIRA.`,
    socialLinks: input.socialLinks ?? existing?.socialLinks ?? {},
    specialtyGenres: Array.isArray(input.specialtyGenres)
      ? input.specialtyGenres
      : existing?.specialtyGenres || ['action', 'drama'],
    isFeatured: input.isFeatured ?? existing?.isFeatured ?? true,
    isExampleProfile: input.isExampleProfile ?? existing?.isExampleProfile ?? false,
    active: input.active ?? existing?.active ?? true,
    createdAt: existing?.createdAt || new Date().toISOString(),
  };

  await (prisma as any).featureFlag.upsert({
    where: { key: `interpreter:${slug}` },
    update: {
      description: JSON.stringify(profile),
      enabled: profile.active,
    },
    create: {
      key: `interpreter:${slug}`,
      description: JSON.stringify(profile),
      enabled: profile.active,
    },
  });

  return profile;
}

export async function deleteInterpreterProfile(slugOrId: string): Promise<SeedInterpreter | null> {
  const all = await getAllInterpreters(true);
  const found = all.find(i => i.slug === slugOrId || i.id === slugOrId);
  if (!found) return null;

  await (prisma as any).featureFlag.delete({
    where: { key: `interpreter:${found.slug}` },
  });
  return found;
}

export async function getVipConfig(): Promise<VipPlatformConfig> {
  try {
    const flag = await (prisma as any).featureFlag.findUnique({
      where: { key: 'vip_config' },
    });
    if (!flag || !flag.description) {
      await (prisma as any).featureFlag.upsert({
        where: { key: 'vip_config' },
        update: {},
        create: {
          key: 'vip_config',
          description: JSON.stringify(DEFAULT_VIP_CONFIG),
          enabled: DEFAULT_VIP_CONFIG.vipEnabled,
        },
      });
      return structuredClone(DEFAULT_VIP_CONFIG);
    }
    const parsed = JSON.parse(flag.description) as VipPlatformConfig;
    return {
      ...DEFAULT_VIP_CONFIG,
      ...parsed,
      freeViewingGuaranteed: true, // Always enforce free viewing model for regular users
      plans: Array.isArray(parsed.plans) && parsed.plans.length > 0 ? parsed.plans : DEFAULT_VIP_CONFIG.plans,
      benefits: Array.isArray(parsed.benefits) && parsed.benefits.length > 0 ? parsed.benefits : DEFAULT_VIP_CONFIG.benefits,
    };
  } catch {
    return structuredClone(DEFAULT_VIP_CONFIG);
  }
}

export async function saveVipConfig(nextConfig: Partial<VipPlatformConfig>): Promise<VipPlatformConfig> {
  const current = await getVipConfig();
  const merged: VipPlatformConfig = {
    ...current,
    ...nextConfig,
    freeViewingGuaranteed: true,
    plans: Array.isArray(nextConfig.plans) ? nextConfig.plans : current.plans,
    benefits: Array.isArray(nextConfig.benefits) ? nextConfig.benefits : current.benefits,
    updatedAt: new Date().toISOString(),
  };

  await (prisma as any).featureFlag.upsert({
    where: { key: 'vip_config' },
    update: {
      description: JSON.stringify(merged),
      enabled: merged.vipEnabled,
    },
    create: {
      key: 'vip_config',
      description: JSON.stringify(merged),
      enabled: merged.vipEnabled,
    },
  });

  return merged;
}

export function isPaymentGatewayConfigured(): {
  configured: boolean;
  providers: string[];
} {
  const providers: string[] = [];
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.trim()) {
    providers.push('STRIPE');
  }
  if (process.env.FLUTTERWAVE_SECRET_KEY && process.env.FLUTTERWAVE_SECRET_KEY.trim()) {
    providers.push('FLUTTERWAVE');
  }
  if (process.env.MTN_MOMO_API_KEY && process.env.MTN_MOMO_API_KEY.trim()) {
    providers.push('MTN_MOMO');
  }
  return {
    configured: providers.length > 0,
    providers,
  };
}

import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SEED_GENRES, ALL_SEED_MOVIES, SEED_SERIES } from '../src/catalogSeedData';

const AD_PLACEMENTS = [
  'HOME_BETWEEN_RAILS',
  'HOME_BOTTOM_BANNER',
  'BROWSE_BANNER',
  'SEARCH_NATIVE',
  'MOVIE_DETAILS_BANNER',
  'SERIES_DETAILS_BANNER',
  'PLAYER_COMPANION',
  'FOOTER_BANNER',
] as const;

interface MemoryStore {
  genres: any[];
  movies: any[];
  series: any[];
  seasons: any[];
  episodes: any[];
  contentRights: any[];
  users: any[];
  sessions: any[];
  watchlist: any[];
  watchProgress: any[];
  sponsors: any[];
  sponsorCampaigns: any[];
  adCreatives: any[];
  adImpressions: any[];
  adClicks: any[];
  affiliatePartners: any[];
  affiliateCampaigns: any[];
  affiliateClicks: any[];
  affiliateImpressions: any[];
  affiliateConversions: any[];
  monetagSettings: any[];
  monetagRevenue: any[];
  auditLogs: any[];
  adPlacements: any[];
  videoAssets: any[];
}

function createInitialMemoryStore(): MemoryStore {
  const now = new Date();
  const genres = SEED_GENRES.map(g => ({ ...g }));
  const contentRights: any[] = [];
  const seasons: any[] = [];
  const episodes: any[] = [];

  const movies = ALL_SEED_MOVIES.map(m => {
    const rights = {
      id: `rights-${m.id}`,
      movieId: m.id,
      seriesId: null,
      rightsStatus: m.rightsStatus,
      rightsHolder: m.rightsHolder,
      licenseReference: m.licenseReference || `ZIRA-LIC-${m.releaseYear}-${m.slug.slice(0, 8).toUpperCase()}`,
      territories: m.territories || ['GLOBAL', 'RW'],
      rightsStartDate: new Date(Date.now() - 86400000 * 30),
      rightsEndDate: m.rightsEndDate ? new Date(m.rightsEndDate) : null,
      internalNotes: 'Seeded open-licensed / demo catalog entry',
    };
    contentRights.push(rights);
    const movieGenres = m.genres.map(slug => {
      const g = genres.find(gen => gen.slug === slug) || { id: `genre-${slug}`, name: slug, slug, description: '' };
      return { movieId: m.id, genreId: g.id, genre: g };
    });
    return {
      id: m.id,
      title: m.title,
      slug: m.slug,
      description: m.description,
      releaseYear: m.releaseYear,
      durationMinutes: m.durationMinutes,
      maturityRating: m.maturityRating,
      language: m.language,
      subtitlesAvailable: m.subtitlesAvailable,
      isFeatured: m.isFeatured,
      isTrending: m.isTrending,
      isRwandanContent: m.isRwandanContent,
      isAfricanContent: m.isAfricanContent,
      isTop10: m.isTop10,
      top10Rank: m.top10Rank ?? null,
      viewCount: m.viewCount,
      likeCount: m.likeCount,
      averageRating: m.averageRating,
      state: m.state,
      posterUrl: m.posterUrl,
      backdropUrl: m.backdropUrl,
      trailerUrl: m.trailerUrl,
      videoUrl: m.videoUrl,
      cast: m.cast,
      createdAt: now,
      updatedAt: now,
      movieGenres,
      contentRights: rights,
      videoAssets: [],
    };
  });

  const series = SEED_SERIES.map(s => {
    const rights = {
      id: `rights-${s.id}`,
      movieId: null,
      seriesId: s.id,
      rightsStatus: s.rightsStatus,
      rightsHolder: s.rightsHolder,
      licenseReference: `ZIRA-SER-${s.releaseYear}-${s.slug.slice(0, 8).toUpperCase()}`,
      territories: ['GLOBAL', 'RW'],
      rightsStartDate: new Date(Date.now() - 86400000 * 30),
      rightsEndDate: null,
      internalNotes: 'Seeded open-licensed / demo series entry',
    };
    contentRights.push(rights);
    const seriesGenres = s.genres.map(slug => {
      const g = genres.find(gen => gen.slug === slug) || { id: `genre-${slug}`, name: slug, slug, description: '' };
      return { seriesId: s.id, genreId: g.id, genre: g };
    });
    const builtSeasons = s.seasons.map(sea => {
      const builtEpisodes = sea.episodes.map(ep => {
        const epObj = {
          id: ep.id,
          seasonId: sea.id,
          episodeNumber: ep.episodeNumber,
          title: ep.title,
          description: ep.description,
          durationMinutes: ep.durationMinutes,
          thumbnailUrl: ep.thumbnailUrl,
          videoUrl: ep.videoUrl,
          state: ep.state,
        };
        episodes.push(epObj);
        return epObj;
      });
      const seaObj = {
        id: sea.id,
        seriesId: s.id,
        seasonNumber: sea.seasonNumber,
        title: sea.title,
        description: sea.description,
        episodes: builtEpisodes,
      };
      seasons.push(seaObj);
      return seaObj;
    });

    return {
      id: s.id,
      title: s.title,
      slug: s.slug,
      description: s.description,
      releaseYear: s.releaseYear,
      maturityRating: s.maturityRating,
      language: s.language,
      isFeatured: s.isFeatured,
      isTrending: s.isTrending,
      isRwandanContent: s.isRwandanContent,
      isAfricanContent: s.isAfricanContent,
      isTop10: s.isTop10,
      top10Rank: s.top10Rank ?? null,
      viewCount: s.viewCount,
      averageRating: s.averageRating,
      state: s.state,
      posterUrl: s.posterUrl,
      backdropUrl: s.backdropUrl,
      trailerUrl: s.trailerUrl,
      cast: s.cast,
      createdAt: now,
      updatedAt: now,
      seasons: builtSeasons,
      seriesGenres,
      contentRights: rights,
    };
  });

  const configuredAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const configuredAdminPassword = process.env.ADMIN_INITIAL_PASSWORD;
  const initialUsers: any[] = [];

  if (configuredAdminEmail && configuredAdminPassword && configuredAdminPassword.length >= 10) {
    initialUsers.push({
      id: 'admin-user-1',
      email: configuredAdminEmail,
      passwordHash: bcrypt.hashSync(configuredAdminPassword, 10),
      displayName: 'ZIRA Chief Administrator',
      avatar: null,
      role: 'SUPER_ADMIN',
      emailVerified: true,
      playbackPreference: 'AUTO',
      notificationEmail: true,
      notificationPush: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  const defaultSponsor = {
    id: 'sponsor-visit-rwanda-partner',
    name: 'Kigali Fiber & Cloud Connect',
    logoUrl: null,
    websiteUrl: 'https://zira-movies.vercel.app',
    contactName: 'Partnership Desk',
    contactEmail: 'partners@zira.com',
    contactPhone: null,
    notes: 'Featured platform connectivity partner',
    active: true,
    createdAt: now,
    updatedAt: now,
  };

  const defaultCreative = {
    id: 'creative-kigali-fiber-1',
    campaignId: 'campaign-kigali-fiber-1',
    title: 'Stream East African Cinema in Full HD Without Buffering',
    imageUrl: movies[0]?.backdropUrl || '',
    tagline: 'Supporting Rwandan filmmakers, open cinema creators, and community storytelling across Africa.',
    callToAction: 'Explore Catalog',
  };

  const defaultCampaign = {
    id: 'campaign-kigali-fiber-1',
    sponsorId: defaultSponsor.id,
    name: 'East African Cinema Showcase',
    startDate: new Date(Date.now() - 86400000 * 7),
    endDate: new Date(Date.now() + 86400000 * 90),
    active: true,
    budgetNote: 'Launch showcase campaign',
    internalPaymentStatus: 'PAID',
    agreedPrice: new Prisma.Decimal('1200.00'),
    paidAmount: new Prisma.Decimal('1200.00'),
    currency: 'USD',
    placement: 'HOME_BETWEEN_RAILS',
    destinationUrl: 'https://zira-movies.vercel.app/browse',
    impressionLimit: null,
    clickLimit: null,
    sponsor: defaultSponsor,
    creatives: [defaultCreative],
    createdAt: now,
    updatedAt: now,
  };

  const adPlacements = AD_PLACEMENTS.map(type => ({
    type,
    displayName: type.replace(/_/g, ' '),
    active: true,
  }));

  const monetagSettings = AD_PLACEMENTS.map(placement => ({
    placement,
    enabled: false,
    zoneId: null,
    scriptUrl: null,
    tagCode: null,
    updatedAt: now,
  }));

  return {
    genres,
    movies,
    series,
    seasons,
    episodes,
    contentRights,
    users: initialUsers,
    sessions: [],
    watchlist: [],
    watchProgress: [],
    sponsors: [defaultSponsor],
    sponsorCampaigns: [defaultCampaign],
    adCreatives: [defaultCreative],
    adImpressions: [],
    adClicks: [],
    affiliatePartners: [],
    affiliateCampaigns: [],
    affiliateClicks: [],
    affiliateImpressions: [],
    affiliateConversions: [],
    monetagSettings,
    monetagRevenue: [],
    auditLogs: [
      {
        id: 'audit-seed-1',
        adminId: initialUsers[0]?.id || 'system-seed',
        admin: { displayName: initialUsers[0]?.displayName || 'ZIRA System' },
        action: 'SEED_CATALOG',
        entityType: 'Catalog',
        entityId: 'initial-seed',
        metadata: JSON.stringify({ movies: movies.length, series: series.length }),
        createdAt: now,
      },
    ],
    adPlacements,
    videoAssets: [],
  };
}

export const memoryStore: MemoryStore = createInitialMemoryStore();

function attachMovieRelations(movie: any) {
  if (!movie) return null;
  const rights = memoryStore.contentRights.find(r => r.movieId === movie.id) || movie.contentRights || null;
  return {
    ...movie,
    contentRights: rights,
    movieGenres: movie.movieGenres || [],
  };
}

function attachSeriesRelations(ser: any) {
  if (!ser) return null;
  const rights = memoryStore.contentRights.find(r => r.seriesId === ser.id) || ser.contentRights || null;
  const serSeasons = memoryStore.seasons
    .filter(s => s.seriesId === ser.id)
    .sort((a, b) => a.seasonNumber - b.seasonNumber)
    .map(sea => ({
      ...sea,
      episodes: memoryStore.episodes
        .filter(e => e.seasonId === sea.id)
        .sort((a, b) => a.episodeNumber - b.episodeNumber),
    }));
  return {
    ...ser,
    seasons: serSeasons,
    contentRights: rights,
    seriesGenres: ser.seriesGenres || [],
  };
}

const memoryClient: any = {
  $queryRaw: async () => [{ '?column?': 1 }],
  $disconnect: async () => {},
  genre: {
    findMany: async () => [...memoryStore.genres],
    findUnique: async ({ where }: any) => memoryStore.genres.find(g => g.id === where.id || g.slug === where.slug) || null,
    upsert: async ({ where, update, create }: any) => {
      const existing = memoryStore.genres.find(g => g.slug === where.slug || g.id === where.id);
      if (existing) {
        Object.assign(existing, update);
        return existing;
      }
      const item = { id: `genre-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ...create };
      memoryStore.genres.push(item);
      return item;
    },
  },
  movie: {
    count: async (args?: any) => {
      if (args?.where?.state) return memoryStore.movies.filter(m => m.state === args.where.state).length;
      return memoryStore.movies.length;
    },
    aggregate: async () => ({
      _sum: { viewCount: memoryStore.movies.reduce((acc, m) => acc + (m.viewCount || 0), 0) },
    }),
    findMany: async (args?: any) => {
      let list = memoryStore.movies.map(attachMovieRelations);
      if (args?.where?.state) {
        list = list.filter(m => m.state === args.where.state);
      }
      return list;
    },
    findFirst: async (args?: any) => {
      let list = memoryStore.movies.map(attachMovieRelations);
      if (args?.where?.slug) list = list.filter(m => m.slug === args.where.slug);
      if (args?.where?.id) list = list.filter(m => m.id === args.where.id);
      if (args?.where?.state) list = list.filter(m => m.state === args.where.state);
      return list[0] || null;
    },
    findUnique: async ({ where }: any) => {
      const found = memoryStore.movies.find(m => (where.id && m.id === where.id) || (where.slug && m.slug === where.slug));
      return attachMovieRelations(found);
    },
    create: async ({ data }: any) => {
      const id = data.id || `movie-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const now = new Date();
      let rights = null;
      if (data.contentRights?.create) {
        rights = {
          id: `rights-${id}`,
          movieId: id,
          seriesId: null,
          territories: ['GLOBAL'],
          ...data.contentRights.create,
        };
        memoryStore.contentRights.push(rights);
      }
      let movieGenres: any[] = [];
      if (data.movieGenres?.create) {
        const creates = Array.isArray(data.movieGenres.create) ? data.movieGenres.create : [data.movieGenres.create];
        movieGenres = creates.map((entry: any) => {
          const slug = entry.genre?.connect?.slug;
          const genreId = entry.genre?.connect?.id;
          const g = memoryStore.genres.find(gen => gen.slug === slug || gen.id === genreId) || {
            id: `genre-${slug || 'drama'}`,
            name: slug || 'Drama',
            slug: slug || 'drama',
          };
          return { movieId: id, genreId: g.id, genre: g };
        });
      }
      const movie = {
        id,
        title: data.title,
        slug: data.slug,
        description: data.description,
        releaseYear: data.releaseYear,
        durationMinutes: data.durationMinutes,
        maturityRating: data.maturityRating || 'PG-13',
        language: data.language || 'English',
        subtitlesAvailable: data.subtitlesAvailable || ['en'],
        isFeatured: Boolean(data.isFeatured),
        isTrending: Boolean(data.isTrending),
        isRwandanContent: Boolean(data.isRwandanContent),
        isAfricanContent: Boolean(data.isAfricanContent ?? data.isRwandanContent),
        isTop10: Boolean(data.isTop10),
        top10Rank: data.top10Rank ?? null,
        viewCount: data.viewCount ?? 0,
        likeCount: data.likeCount ?? 0,
        averageRating: data.averageRating ?? 4.5,
        state: data.state || 'DRAFT',
        posterUrl: data.posterUrl || null,
        backdropUrl: data.backdropUrl || null,
        trailerUrl: data.trailerUrl || null,
        videoUrl: data.videoUrl || null,
        cast: data.cast || [],
        createdAt: now,
        updatedAt: now,
        movieGenres,
        contentRights: rights,
      };
      memoryStore.movies.unshift(movie);
      return attachMovieRelations(movie);
    },
    update: async ({ where, data }: any) => {
      const movie = memoryStore.movies.find(m => m.id === where.id || m.slug === where.slug);
      if (!movie) {
        const err: any = new Error('Record not found');
        err.code = 'P2025';
        throw err;
      }
      const { contentRights: rightsUpdate, movieGenres: genresUpdate, ...scalarData } = data;
      Object.assign(movie, scalarData, { updatedAt: new Date() });
      if (rightsUpdate?.upsert || rightsUpdate?.update) {
        const rData = rightsUpdate.upsert?.update || rightsUpdate.update;
        const existingRights = memoryStore.contentRights.find(r => r.movieId === movie.id);
        if (existingRights) {
          Object.assign(existingRights, rData);
        } else if (rightsUpdate.upsert?.create) {
          const created = { id: `rights-${movie.id}`, movieId: movie.id, territories: ['GLOBAL'], ...rightsUpdate.upsert.create };
          memoryStore.contentRights.push(created);
          movie.contentRights = created;
        }
      }
      if (genresUpdate?.deleteMany !== undefined && genresUpdate?.create) {
        const creates = Array.isArray(genresUpdate.create) ? genresUpdate.create : [genresUpdate.create];
        movie.movieGenres = creates.map((entry: any) => {
          const slug = entry.genre?.connect?.slug;
          const g = memoryStore.genres.find(gen => gen.slug === slug) || { id: `genre-${slug}`, name: slug, slug };
          return { movieId: movie.id, genreId: g.id, genre: g };
        });
      }
      return attachMovieRelations(movie);
    },
    upsert: async ({ where, update, create }: any) => {
      const existing = memoryStore.movies.find(m => m.slug === where.slug || m.id === where.id);
      if (existing) {
        return memoryClient.movie.update({ where: { id: existing.id }, data: update });
      }
      return memoryClient.movie.create({ data: create });
    },
    delete: async ({ where }: any) => {
      const idx = memoryStore.movies.findIndex(m => m.id === where.id || m.slug === where.slug);
      if (idx === -1) {
        const err: any = new Error('Record not found');
        err.code = 'P2025';
        throw err;
      }
      const [removed] = memoryStore.movies.splice(idx, 1);
      memoryStore.contentRights = memoryStore.contentRights.filter(r => r.movieId !== removed.id);
      return removed;
    },
    deleteMany: async ({ where }: any = {}) => {
      const slugs: string[] = where?.slug?.in || [];
      if (slugs.length === 0) return { count: 0 };
      const before = memoryStore.movies.length;
      const removedIds = new Set(memoryStore.movies.filter(m => slugs.includes(m.slug)).map(m => m.id));
      memoryStore.movies = memoryStore.movies.filter(m => !slugs.includes(m.slug));
      memoryStore.contentRights = memoryStore.contentRights.filter(r => !removedIds.has(r.movieId));
      return { count: before - memoryStore.movies.length };
    },
  },
  series: {
    count: async (args?: any) => {
      if (args?.where?.state) return memoryStore.series.filter(s => s.state === args.where.state).length;
      return memoryStore.series.length;
    },
    aggregate: async () => ({
      _sum: { viewCount: memoryStore.series.reduce((acc, s) => acc + (s.viewCount || 0), 0) },
    }),
    findMany: async (args?: any) => {
      let list = memoryStore.series.map(attachSeriesRelations);
      if (args?.where?.state) {
        list = list.filter(s => s.state === args.where.state);
      }
      return list;
    },
    findFirst: async (args?: any) => {
      let list = memoryStore.series.map(attachSeriesRelations);
      if (args?.where?.slug) list = list.filter(s => s.slug === args.where.slug);
      if (args?.where?.id) list = list.filter(s => s.id === args.where.id);
      if (args?.where?.state) list = list.filter(s => s.state === args.where.state);
      return list[0] || null;
    },
    findUnique: async ({ where }: any) => {
      const found = memoryStore.series.find(s => (where.id && s.id === where.id) || (where.slug && s.slug === where.slug));
      return attachSeriesRelations(found);
    },
    create: async ({ data }: any) => {
      const id = data.id || `series-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const now = new Date();
      let rights = null;
      if (data.contentRights?.create) {
        rights = {
          id: `rights-${id}`,
          movieId: null,
          seriesId: id,
          territories: ['GLOBAL'],
          ...data.contentRights.create,
        };
        memoryStore.contentRights.push(rights);
      }
      let seriesGenres: any[] = [];
      if (data.seriesGenres?.create) {
        const creates = Array.isArray(data.seriesGenres.create) ? data.seriesGenres.create : [data.seriesGenres.create];
        seriesGenres = creates.map((entry: any) => {
          const slug = entry.genre?.connect?.slug;
          const g = memoryStore.genres.find(gen => gen.slug === slug) || { id: `genre-${slug}`, name: slug, slug };
          return { seriesId: id, genreId: g.id, genre: g };
        });
      }
      const ser = {
        id,
        title: data.title,
        slug: data.slug,
        description: data.description,
        releaseYear: data.releaseYear,
        maturityRating: data.maturityRating || 'PG-13',
        language: data.language || 'English',
        isFeatured: Boolean(data.isFeatured),
        isTrending: Boolean(data.isTrending),
        isRwandanContent: Boolean(data.isRwandanContent),
        isAfricanContent: Boolean(data.isAfricanContent ?? data.isRwandanContent),
        isTop10: Boolean(data.isTop10),
        top10Rank: data.top10Rank ?? null,
        viewCount: data.viewCount ?? 0,
        averageRating: data.averageRating ?? 4.6,
        state: data.state || 'DRAFT',
        posterUrl: data.posterUrl || null,
        backdropUrl: data.backdropUrl || null,
        trailerUrl: data.trailerUrl || null,
        cast: data.cast || [],
        createdAt: now,
        updatedAt: now,
        seriesGenres,
        contentRights: rights,
      };
      memoryStore.series.unshift(ser);
      return attachSeriesRelations(ser);
    },
    update: async ({ where, data }: any) => {
      const ser = memoryStore.series.find(s => s.id === where.id || s.slug === where.slug);
      if (!ser) {
        const err: any = new Error('Record not found');
        err.code = 'P2025';
        throw err;
      }
      const { contentRights: rightsUpdate, seriesGenres: genresUpdate, ...scalarData } = data;
      Object.assign(ser, scalarData, { updatedAt: new Date() });
      if (rightsUpdate?.upsert || rightsUpdate?.update) {
        const rData = rightsUpdate.upsert?.update || rightsUpdate.update;
        const existingRights = memoryStore.contentRights.find(r => r.seriesId === ser.id);
        if (existingRights) {
          Object.assign(existingRights, rData);
        } else if (rightsUpdate.upsert?.create) {
          const created = { id: `rights-${ser.id}`, seriesId: ser.id, territories: ['GLOBAL'], ...rightsUpdate.upsert.create };
          memoryStore.contentRights.push(created);
          ser.contentRights = created;
        }
      }
      if (genresUpdate?.deleteMany !== undefined && genresUpdate?.create) {
        const creates = Array.isArray(genresUpdate.create) ? genresUpdate.create : [genresUpdate.create];
        ser.seriesGenres = creates.map((entry: any) => {
          const slug = entry.genre?.connect?.slug;
          const g = memoryStore.genres.find(gen => gen.slug === slug) || { id: `genre-${slug}`, name: slug, slug };
          return { seriesId: ser.id, genreId: g.id, genre: g };
        });
      }
      return attachSeriesRelations(ser);
    },
    upsert: async ({ where, update, create }: any) => {
      const existing = memoryStore.series.find(s => s.slug === where.slug || s.id === where.id);
      if (existing) {
        return memoryClient.series.update({ where: { id: existing.id }, data: update });
      }
      return memoryClient.series.create({ data: create });
    },
    delete: async ({ where }: any) => {
      const idx = memoryStore.series.findIndex(s => s.id === where.id || s.slug === where.slug);
      if (idx === -1) {
        const err: any = new Error('Record not found');
        err.code = 'P2025';
        throw err;
      }
      const [removed] = memoryStore.series.splice(idx, 1);
      const seaIds = memoryStore.seasons.filter(sea => sea.seriesId === removed.id).map(sea => sea.id);
      memoryStore.seasons = memoryStore.seasons.filter(sea => sea.seriesId !== removed.id);
      memoryStore.episodes = memoryStore.episodes.filter(ep => !seaIds.includes(ep.seasonId));
      memoryStore.contentRights = memoryStore.contentRights.filter(r => r.seriesId !== removed.id);
      return removed;
    },
    deleteMany: async ({ where }: any = {}) => {
      const slugs: string[] = where?.slug?.in || [];
      if (slugs.length === 0) return { count: 0 };
      const before = memoryStore.series.length;
      const removedIds = new Set(memoryStore.series.filter(s => slugs.includes(s.slug)).map(s => s.id));
      memoryStore.series = memoryStore.series.filter(s => !slugs.includes(s.slug));
      const seaIds = new Set(memoryStore.seasons.filter(sea => removedIds.has(sea.seriesId)).map(sea => sea.id));
      memoryStore.seasons = memoryStore.seasons.filter(sea => !removedIds.has(sea.seriesId));
      memoryStore.episodes = memoryStore.episodes.filter(ep => !seaIds.has(ep.seasonId));
      memoryStore.contentRights = memoryStore.contentRights.filter(r => !removedIds.has(r.seriesId));
      return { count: before - memoryStore.series.length };
    },
  },
  season: {
    findMany: async ({ where }: any = {}) => {
      return memoryStore.seasons
        .filter(s => !where?.seriesId || s.seriesId === where.seriesId)
        .map(s => ({ ...s, episodes: memoryStore.episodes.filter(e => e.seasonId === s.id) }));
    },
    findUnique: async ({ where }: any) => {
      const sea = memoryStore.seasons.find(
        s =>
          (where.id && s.id === where.id) ||
          (where.seriesId_seasonNumber &&
            s.seriesId === where.seriesId_seasonNumber.seriesId &&
            s.seasonNumber === where.seriesId_seasonNumber.seasonNumber),
      );
      if (!sea) return null;
      return { ...sea, episodes: memoryStore.episodes.filter(e => e.seasonId === sea.id) };
    },
    create: async ({ data }: any) => {
      const sea = {
        id: data.id || `season-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        seriesId: data.seriesId,
        seasonNumber: data.seasonNumber,
        title: data.title,
        description: data.description || null,
        episodes: [],
      };
      memoryStore.seasons.push(sea);
      return sea;
    },
    upsert: async ({ where, update, create }: any) => {
      const existing = await memoryClient.season.findUnique({ where });
      if (existing) {
        Object.assign(existing, update);
        return existing;
      }
      return memoryClient.season.create({ data: create });
    },
    delete: async ({ where }: any) => {
      const idx = memoryStore.seasons.findIndex(s => s.id === where.id);
      if (idx === -1) {
        const err: any = new Error('Record not found');
        err.code = 'P2025';
        throw err;
      }
      const [removed] = memoryStore.seasons.splice(idx, 1);
      memoryStore.episodes = memoryStore.episodes.filter(e => e.seasonId !== removed.id);
      return removed;
    },
  },
  episode: {
    count: async () => memoryStore.episodes.length,
    findMany: async () => [...memoryStore.episodes],
    findUnique: async ({ where }: any) => {
      return (
        memoryStore.episodes.find(
          e =>
            (where.id && e.id === where.id) ||
            (where.seasonId_episodeNumber &&
              e.seasonId === where.seasonId_episodeNumber.seasonId &&
              e.episodeNumber === where.seasonId_episodeNumber.episodeNumber),
        ) || null
      );
    },
    create: async ({ data }: any) => {
      const ep = {
        id: data.id || `ep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        seasonId: data.seasonId,
        episodeNumber: data.episodeNumber,
        title: data.title,
        description: data.description,
        durationMinutes: data.durationMinutes,
        thumbnailUrl: data.thumbnailUrl || null,
        videoUrl: data.videoUrl || null,
        state: data.state || 'PUBLISHED',
      };
      memoryStore.episodes.push(ep);
      return ep;
    },
    update: async ({ where, data }: any) => {
      const ep = memoryStore.episodes.find(e => e.id === where.id);
      if (!ep) {
        const err: any = new Error('Record not found');
        err.code = 'P2025';
        throw err;
      }
      Object.assign(ep, data);
      return ep;
    },
    upsert: async ({ where, update, create }: any) => {
      const existing = await memoryClient.episode.findUnique({ where });
      if (existing) {
        Object.assign(existing, update);
        return existing;
      }
      return memoryClient.episode.create({ data: create });
    },
    delete: async ({ where }: any) => {
      const idx = memoryStore.episodes.findIndex(e => e.id === where.id);
      if (idx === -1) {
        const err: any = new Error('Record not found');
        err.code = 'P2025';
        throw err;
      }
      const [removed] = memoryStore.episodes.splice(idx, 1);
      return removed;
    },
  },
  contentRights: {
    count: async ({ where }: any = {}) => {
      return memoryStore.contentRights.filter(r => {
        if (where?.rightsStatus && r.rightsStatus !== where.rightsStatus) return false;
        if (where?.movieId?.not === null && !r.movieId) return false;
        if (where?.seriesId?.not === null && !r.seriesId) return false;
        return true;
      }).length;
    },
    findMany: async ({ where }: any = {}) => {
      return memoryStore.contentRights
        .filter(r => {
          if (where?.movieId?.not === null && !r.movieId) return false;
          if (where?.seriesId?.not === null && !r.seriesId) return false;
          return true;
        })
        .map(r => ({
          ...r,
          movie: r.movieId ? memoryStore.movies.find(m => m.id === r.movieId) || null : null,
          series: r.seriesId ? memoryStore.series.find(s => s.id === r.seriesId) || null : null,
        }));
    },
    update: async ({ where, data }: any) => {
      const r = memoryStore.contentRights.find(item => item.id === where.id || (where.movieId && item.movieId === where.movieId) || (where.seriesId && item.seriesId === where.seriesId));
      if (!r) {
        const err: any = new Error('Record not found');
        err.code = 'P2025';
        throw err;
      }
      Object.assign(r, data);
      return r;
    },
  },
  user: {
    count: async (args?: any) => {
      let list = memoryStore.users;
      if (args?.where?.role) {
        if (typeof args.where.role === 'string') {
          list = list.filter(u => u.role === args.where.role);
        } else if (Array.isArray(args.where.role?.in)) {
          list = list.filter(u => args.where.role.in.includes(u.role));
        }
      }
      return list.length;
    },
    findUnique: async ({ where }: any) => {
      return memoryStore.users.find(u => (where.id && u.id === where.id) || (where.email && u.email === where.email)) || null;
    },
    create: async ({ data }: any) => {
      if (memoryStore.users.some(u => u.email === data.email)) {
        const err: any = new Error('Unique constraint failed');
        err.code = 'P2002';
        throw err;
      }
      const user = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        email: data.email,
        passwordHash: data.passwordHash || null,
        displayName: data.displayName,
        avatar: data.avatar || null,
        role: data.role || 'USER',
        emailVerified: Boolean(data.emailVerified),
        playbackPreference: data.playbackPreference || 'AUTO',
        notificationEmail: data.notificationEmail ?? true,
        notificationPush: data.notificationPush ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.users.push(user);
      return user;
    },
    update: async ({ where, data }: any) => {
      const user = memoryStore.users.find(u => (where.id && u.id === where.id) || (where.email && u.email === where.email));
      if (!user) {
        const err: any = new Error('Record not found');
        err.code = 'P2025';
        throw err;
      }
      Object.assign(user, data, { updatedAt: new Date() });
      return user;
    },
    upsert: async ({ where, update, create }: any) => {
      const existing = await memoryClient.user.findUnique({ where });
      if (existing) {
        return memoryClient.user.update({ where, data: update });
      }
      return memoryClient.user.create({ data: create });
    },
  },
  session: {
    findUnique: async ({ where }: any) => {
      return memoryStore.sessions.find(s => s.sessionToken === where.sessionToken || s.id === where.id) || null;
    },
    create: async ({ data }: any) => {
      const s = { id: `sess-${Date.now()}`, ...data };
      memoryStore.sessions.push(s);
      return s;
    },
    delete: async ({ where }: any) => {
      memoryStore.sessions = memoryStore.sessions.filter(s => s.id !== where.id);
      return {};
    },
    deleteMany: async ({ where }: any) => {
      memoryStore.sessions = memoryStore.sessions.filter(s => s.sessionToken !== where?.sessionToken);
      return { count: 1 };
    },
  },
  watchlist: {
    findMany: async ({ where }: any) => {
      return memoryStore.watchlist
        .filter(w => !where?.userId || w.userId === where.userId)
        .map(w => ({
          ...w,
          movie: w.movieId ? memoryStore.movies.find(m => m.id === w.movieId) : null,
          series: w.seriesId ? attachSeriesRelations(memoryStore.series.find(s => s.id === w.seriesId)) : null,
        }));
    },
    create: async ({ data }: any) => {
      const item = { id: `wl-${Date.now()}`, createdAt: new Date(), ...data };
      memoryStore.watchlist.push(item);
      return item;
    },
    deleteMany: async ({ where }: any) => {
      memoryStore.watchlist = memoryStore.watchlist.filter(
        w => !(w.userId === where.userId && w.movieId === where.movieId && w.seriesId === where.seriesId),
      );
      return { count: 1 };
    },
  },
  watchProgress: {
    findMany: async ({ where }: any) => {
      return memoryStore.watchProgress
        .filter(wp => !where?.userId || wp.userId === where.userId)
        .map(wp => ({
          ...wp,
          movie: wp.movieId ? memoryStore.movies.find(m => m.id === wp.movieId) : null,
          episode: wp.episodeId ? memoryStore.episodes.find(e => e.id === wp.episodeId) : null,
        }));
    },
    findFirst: async ({ where }: any) => {
      return (
        memoryStore.watchProgress.find(
          wp => wp.userId === where.userId && wp.movieId === where.movieId && wp.episodeId === where.episodeId,
        ) || null
      );
    },
    create: async ({ data }: any) => {
      const wp = { id: `wp-${Date.now()}`, updatedAt: new Date(), ...data };
      memoryStore.watchProgress.push(wp);
      return wp;
    },
    update: async ({ where, data }: any) => {
      const wp = memoryStore.watchProgress.find(item => item.id === where.id);
      if (wp) Object.assign(wp, data, { updatedAt: new Date() });
      return wp;
    },
  },
  adPlacement: {
    upsert: async ({ where, update, create }: any) => {
      const existing = memoryStore.adPlacements.find(p => p.type === where.type);
      if (existing) {
        Object.assign(existing, update);
        return existing;
      }
      const created = { active: true, ...create };
      memoryStore.adPlacements.push(created);
      return created;
    },
  },
  sponsor: {
    findMany: async () => [...memoryStore.sponsors],
    create: async ({ data }: any) => {
      const sp = {
        id: `sponsor-${Date.now()}`,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      memoryStore.sponsors.unshift(sp);
      return sp;
    },
    update: async ({ where, data }: any) => {
      const sp = memoryStore.sponsors.find(s => s.id === where.id);
      if (!sp) {
        const err: any = new Error('Record not found');
        err.code = 'P2025';
        throw err;
      }
      Object.assign(sp, data, { updatedAt: new Date() });
      return sp;
    },
  },
  sponsorCampaign: {
    aggregate: async () => {
      const agreed = memoryStore.sponsorCampaigns.reduce((sum, c) => sum + Number(c.agreedPrice || 0), 0);
      const paid = memoryStore.sponsorCampaigns.reduce((sum, c) => sum + Number(c.paidAmount || 0), 0);
      return {
        _sum: {
          agreedPrice: new Prisma.Decimal(agreed.toFixed(2)),
          paidAmount: new Prisma.Decimal(paid.toFixed(2)),
        },
      };
    },
    findFirst: async ({ where }: any) => {
      const now = new Date();
      const found = memoryStore.sponsorCampaigns.find(c => {
        if (where?.placement && c.placement !== where.placement) return false;
        if (where?.active !== undefined && c.active !== where.active) return false;
        if (new Date(c.startDate) > now || new Date(c.endDate) < now) return false;
        return true;
      });
      if (!found) return null;
      const impressions = memoryStore.adImpressions.filter(i => i.campaignId === found.id).length;
      const sponsor = memoryStore.sponsors.find(s => s.id === found.sponsorId) || found.sponsor;
      return {
        ...found,
        sponsor,
        creatives: found.creatives || [],
        _count: { impressions },
      };
    },
    findMany: async () => {
      return memoryStore.sponsorCampaigns.map(c => {
        const impressions = memoryStore.adImpressions.filter(i => i.campaignId === c.id).length;
        const clicks = memoryStore.adClicks.filter(cl => cl.campaignId === c.id).length;
        const sponsor = memoryStore.sponsors.find(s => s.id === c.sponsorId) || c.sponsor;
        return {
          ...c,
          sponsor,
          _count: { impressions, clicks },
        };
      });
    },
    findUnique: async ({ where }: any) => {
      const c = memoryStore.sponsorCampaigns.find(item => item.id === where.id);
      if (!c) return null;
      const clicks = memoryStore.adClicks.filter(cl => cl.campaignId === c.id).length;
      return { ...c, _count: { clicks } };
    },
    create: async ({ data }: any) => {
      const id = `camp-${Date.now()}`;
      const sponsor = memoryStore.sponsors.find(s => s.id === data.sponsorId) || { id: data.sponsorId, name: 'Sponsor', active: true };
      const creative = data.creatives?.create
        ? { id: `cre-${Date.now()}`, campaignId: id, callToAction: 'Learn More', ...data.creatives.create }
        : null;
      if (creative) memoryStore.adCreatives.push(creative);
      const camp = {
        id,
        sponsorId: data.sponsorId,
        name: data.name,
        destinationUrl: data.destinationUrl,
        startDate: data.startDate,
        endDate: data.endDate,
        placement: data.placement,
        active: true,
        internalPaymentStatus: 'UNPAID',
        agreedPrice: data.agreedPrice || new Prisma.Decimal('0'),
        paidAmount: new Prisma.Decimal('0'),
        currency: 'USD',
        impressionLimit: null,
        clickLimit: null,
        sponsor,
        creatives: creative ? [creative] : [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.sponsorCampaigns.unshift(camp);
      return camp;
    },
    update: async ({ where, data }: any) => {
      const camp = memoryStore.sponsorCampaigns.find(c => c.id === where.id);
      if (!camp) {
        const err: any = new Error('Record not found');
        err.code = 'P2025';
        throw err;
      }
      const { placementConfig, ...rest } = data;
      if (placementConfig?.connect?.type) {
        camp.placement = placementConfig.connect.type;
      }
      Object.assign(camp, rest, { updatedAt: new Date() });
      return camp;
    },
  },
  adCreative: {
    update: async ({ where, data }: any) => {
      const cre = memoryStore.adCreatives.find(c => c.id === where.id);
      if (cre) Object.assign(cre, data);
      return cre;
    },
  },
  adImpression: {
    count: async () => memoryStore.adImpressions.length,
    create: async ({ data }: any) => {
      const imp = { id: `imp-${Date.now()}-${Math.random()}`, createdAt: new Date(), ...data };
      memoryStore.adImpressions.push(imp);
      return imp;
    },
    groupBy: async () => {
      const counts = new Map<string, number>();
      for (const imp of memoryStore.adImpressions) {
        counts.set(imp.campaignId, (counts.get(imp.campaignId) || 0) + 1);
      }
      return [...counts.entries()].map(([campaignId, count]) => ({ campaignId, _count: { _all: count } }));
    },
  },
  adClick: {
    count: async () => memoryStore.adClicks.length,
    create: async ({ data }: any) => {
      const clk = { id: `clk-${Date.now()}-${Math.random()}`, createdAt: new Date(), ...data };
      memoryStore.adClicks.push(clk);
      return clk;
    },
    groupBy: async () => {
      const counts = new Map<string, number>();
      for (const clk of memoryStore.adClicks) {
        counts.set(clk.campaignId, (counts.get(clk.campaignId) || 0) + 1);
      }
      return [...counts.entries()].map(([campaignId, count]) => ({ campaignId, _count: { _all: count } }));
    },
  },
  affiliatePartner: {
    findMany: async () => [...memoryStore.affiliatePartners],
    create: async ({ data }: any) => {
      const p = { id: `affp-${Date.now()}`, active: true, ...data };
      memoryStore.affiliatePartners.push(p);
      return p;
    },
    update: async ({ where, data }: any) => {
      const p = memoryStore.affiliatePartners.find(item => item.id === where.id);
      if (!p) {
        const err: any = new Error('Record not found');
        err.code = 'P2025';
        throw err;
      }
      Object.assign(p, data);
      return p;
    },
  },
  affiliateCampaign: {
    findFirst: async ({ where }: any) => {
      const now = new Date();
      const found = memoryStore.affiliateCampaigns.find(c => {
        if (where?.placement && c.placement !== where.placement) return false;
        if (!c.active) return false;
        if (new Date(c.startDate) > now || new Date(c.endDate) < now) return false;
        return true;
      });
      if (!found) return null;
      const partner = memoryStore.affiliatePartners.find(p => p.id === found.partnerId) || { partnerName: 'Partner', active: true };
      return { ...found, partner };
    },
    findMany: async () => {
      return memoryStore.affiliateCampaigns.map(c => ({
        ...c,
        partner: memoryStore.affiliatePartners.find(p => p.id === c.partnerId) || { partnerName: 'Partner', active: true },
        _count: { clicks: memoryStore.affiliateClicks.filter(cl => cl.campaignId === c.id).length },
        conversions: memoryStore.affiliateConversions.filter(cv => cv.campaignId === c.id),
      }));
    },
    findUnique: async ({ where }: any) => {
      const c = memoryStore.affiliateCampaigns.find(item => item.id === where.id);
      if (!c) return null;
      const partner = memoryStore.affiliatePartners.find(p => p.id === c.partnerId) || { active: true };
      return { ...c, partner };
    },
    create: async ({ data }: any) => {
      const c = { id: `affc-${Date.now()}`, active: true, ...data };
      memoryStore.affiliateCampaigns.push(c);
      return c;
    },
    update: async ({ where, data }: any) => {
      const c = memoryStore.affiliateCampaigns.find(item => item.id === where.id);
      if (!c) {
        const err: any = new Error('Record not found');
        err.code = 'P2025';
        throw err;
      }
      const { placementConfig, ...rest } = data;
      if (placementConfig?.connect?.type) c.placement = placementConfig.connect.type;
      Object.assign(c, rest);
      return c;
    },
  },
  affiliateClick: {
    count: async () => memoryStore.affiliateClicks.length,
    create: async ({ data }: any) => {
      const clk = { id: `affclk-${Date.now()}`, createdAt: new Date(), ...data };
      memoryStore.affiliateClicks.push(clk);
      return clk;
    },
    groupBy: async () => {
      const counts = new Map<string, number>();
      for (const clk of memoryStore.affiliateClicks) {
        counts.set(clk.campaignId, (counts.get(clk.campaignId) || 0) + 1);
      }
      return [...counts.entries()].map(([campaignId, count]) => ({ campaignId, _count: { _all: count } }));
    },
  },
  affiliateImpression: {
    create: async ({ data }: any) => {
      const imp = { id: `affimp-${Date.now()}`, createdAt: new Date(), ...data };
      memoryStore.affiliateImpressions.push(imp);
      return imp;
    },
    groupBy: async () => {
      const counts = new Map<string, number>();
      for (const imp of memoryStore.affiliateImpressions) {
        counts.set(imp.campaignId, (counts.get(imp.campaignId) || 0) + 1);
      }
      return [...counts.entries()].map(([campaignId, count]) => ({ campaignId, _count: { _all: count } }));
    },
  },
  affiliateConversion: {
    aggregate: async ({ where }: any = {}) => {
      const list = memoryStore.affiliateConversions.filter(c => !where?.status || c.status === where.status);
      const sum = list.reduce((acc, c) => acc + Number(c.commissionRevenue || 0), 0);
      return { _sum: { commissionRevenue: new Prisma.Decimal(sum.toFixed(2)) } };
    },
    create: async ({ data }: any) => {
      const conv = { id: `affconv-${Date.now()}`, createdAt: new Date(), ...data };
      memoryStore.affiliateConversions.push(conv);
      return conv;
    },
    update: async ({ where, data }: any) => {
      const conv = memoryStore.affiliateConversions.find(c => c.id === where.id);
      if (!conv) {
        const err: any = new Error('Record not found');
        err.code = 'P2025';
        throw err;
      }
      Object.assign(conv, data);
      return conv;
    },
  },
  monetagPlacementSetting: {
    findMany: async () => [...memoryStore.monetagSettings],
    findUnique: async ({ where }: any) => {
      return memoryStore.monetagSettings.find(s => s.placement === where.placement) || null;
    },
    upsert: async ({ where, create, update }: any) => {
      const existing = memoryStore.monetagSettings.find(s => s.placement === where.placement);
      if (existing) {
        Object.assign(existing, update, { updatedAt: new Date() });
        return existing;
      }
      const item = { updatedAt: new Date(), ...create };
      memoryStore.monetagSettings.push(item);
      return item;
    },
  },
  monetagRevenueRecord: {
    aggregate: async () => {
      const sum = memoryStore.monetagRevenue.reduce((acc, r) => acc + Number(r.amount || 0), 0);
      return { _sum: { amount: new Prisma.Decimal(sum.toFixed(2)) } };
    },
    create: async ({ data }: any) => {
      const rec = { id: `mrev-${Date.now()}`, recordedAt: new Date(), ...data };
      memoryStore.monetagRevenue.push(rec);
      return rec;
    },
  },
  adminAuditLog: {
    findMany: async ({ take = 100 }: any = {}) => {
      return memoryStore.auditLogs.slice(0, take).map(l => ({
        ...l,
        admin: l.admin || { displayName: 'Administrator' },
      }));
    },
    create: async ({ data }: any) => {
      const user = memoryStore.users.find(u => u.id === data.adminId);
      const log = {
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date(),
        admin: { displayName: user?.displayName || 'Administrator' },
        ...data,
      };
      memoryStore.auditLogs.unshift(log);
      return log;
    },
  },
  videoAsset: {
    findMany: async () => [...memoryStore.videoAssets],
    findUnique: async ({ where }: any) => memoryStore.videoAssets.find(a => a.id === where.id) || null,
    create: async ({ data }: any) => {
      const asset = { id: `asset-${Date.now()}`, status: 'READY', createdAt: new Date(), ...data };
      memoryStore.videoAssets.unshift(asset);
      return asset;
    },
    delete: async ({ where }: any) => {
      const idx = memoryStore.videoAssets.findIndex(a => a.id === where.id);
      if (idx === -1) {
        const err: any = new Error('Record not found');
        err.code = 'P2025';
        throw err;
      }
      const [removed] = memoryStore.videoAssets.splice(idx, 1);
      return removed;
    },
  },
};

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim());
let rawPrisma: PrismaClient | null = null;
let dbUnavailable = !hasDatabaseUrl;

if (hasDatabaseUrl) {
  try {
    rawPrisma = new PrismaClient();
  } catch {
    dbUnavailable = true;
  }
}

function isRecoverableDbError(error: any): boolean {
  const code = error?.code;
  const msg = String(error?.message || '');
  return (
    error?.name === 'PrismaClientInitializationError' ||
    code === 'P1001' ||
    code === 'P1002' ||
    code === 'P1003' ||
    code === 'P2021' ||
    code === 'P2022' ||
    msg.includes("Can't reach database server") ||
    msg.includes('does not exist in the current database')
  );
}

function createResilientPrisma(): PrismaClient {
  return new Proxy({} as PrismaClient, {
    get(_target, prop: string) {
      if (dbUnavailable || !rawPrisma) {
        return memoryClient[prop];
      }
      const realModel = (rawPrisma as any)[prop];
      const fallbackModel = memoryClient[prop];
      if (typeof realModel === 'function') {
        return async (...args: any[]) => {
          try {
            return await realModel.apply(rawPrisma, args);
          } catch (error: any) {
            if (isRecoverableDbError(error) && typeof fallbackModel === 'function') {
              dbUnavailable = true;
              return fallbackModel(...args);
            }
            throw error;
          }
        };
      }
      if (realModel && typeof realModel === 'object' && fallbackModel) {
        return new Proxy(realModel, {
          get(modelTarget, method: string) {
            const origMethod = modelTarget[method];
            const fallbackMethod = fallbackModel[method];
            if (typeof origMethod !== 'function') return origMethod;
            return async (...args: any[]) => {
              try {
                return await origMethod.apply(modelTarget, args);
              } catch (error: any) {
                if (isRecoverableDbError(error) && typeof fallbackMethod === 'function') {
                  dbUnavailable = true;
                  return fallbackMethod(...args);
                }
                throw error;
              }
            };
          },
        });
      }
      return realModel;
    },
  });
}

const prisma = createResilientPrisma();

export default prisma;

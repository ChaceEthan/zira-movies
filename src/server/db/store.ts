import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  avatar?: string;
  role: 'USER' | 'EDITOR' | 'ADMIN' | 'SUPER_ADMIN';
  emailVerified: boolean;
  playbackPreference: 'AUTO' | 'DATA_SAVER' | 'HIGH_QUALITY';
  notificationEmail: boolean;
  notificationPush: boolean;
  createdAt: string;
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface ContentRights {
  id: string;
  movieId?: string;
  seriesId?: string;
  rightsStatus: 'OWNED' | 'LICENSED' | 'PERMISSION_GRANTED' | 'PUBLIC_DOMAIN' | 'PENDING_VERIFICATION' | 'EXPIRED';
  rightsHolder: string;
  licenseReference?: string;
  territories: string[];
  rightsStartDate: string;
  rightsEndDate?: string;
  internalNotes?: string;
}

export interface Movie {
  id: string;
  title: string;
  slug: string;
  description: string;
  releaseYear: number;
  durationMinutes: number;
  maturityRating: string;
  language: string;
  subtitlesAvailable: string[];
  isFeatured: boolean;
  isTrending: boolean;
  isRwandanContent: boolean;
  isAfricanContent: boolean;
  isTop10: boolean;
  top10Rank?: number;
  viewCount: number;
  likeCount: number;
  averageRating: number;
  state: 'DRAFT' | 'UPLOADED' | 'PROCESSING' | 'READY' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED';
  posterUrl: string;
  backdropUrl: string;
  trailerUrl: string;
  videoUrl: string;
  hlsUrl?: string;
  genres: string[]; // genre slugs or ids
  cast: string[];
  createdAt: string;
}

export interface Episode {
  id: string;
  seasonId: string;
  episodeNumber: number;
  title: string;
  description: string;
  durationMinutes: number;
  thumbnailUrl: string;
  videoUrl: string;
  hlsUrl?: string;
  state: 'DRAFT' | 'PROCESSING' | 'READY' | 'PUBLISHED';
}

export interface Season {
  id: string;
  seriesId: string;
  seasonNumber: number;
  title: string;
  description?: string;
  episodes: Episode[];
}

export interface Series {
  id: string;
  title: string;
  slug: string;
  description: string;
  releaseYear: number;
  maturityRating: string;
  language: string;
  isFeatured: boolean;
  isTrending: boolean;
  isRwandanContent: boolean;
  isAfricanContent: boolean;
  isTop10: boolean;
  top10Rank?: number;
  viewCount: number;
  averageRating: number;
  state: 'DRAFT' | 'UPLOADED' | 'PROCESSING' | 'READY' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED';
  posterUrl: string;
  backdropUrl: string;
  trailerUrl: string;
  genres: string[];
  seasons: Season[];
  createdAt: string;
}

export interface WatchProgress {
  id: string;
  userId: string;
  movieId?: string;
  seriesId?: string;
  episodeId?: string;
  positionSeconds: number;
  durationSeconds: number;
  percentage: number;
  completed: boolean;
  updatedAt: string;
}

export interface Watchlist {
  id: string;
  userId: string;
  movieId?: string;
  seriesId?: string;
  createdAt: string;
}

export interface Rating {
  id: string;
  userId: string;
  movieId?: string;
  seriesId?: string;
  score: number; // 1 to 5
  createdAt: string;
}

export interface Sponsor {
  id: string;
  name: string;
  logoUrl?: string;
  websiteUrl: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
}

export interface AdCreative {
  id: string;
  campaignId: string;
  title: string;
  imageUrl: string;
  tagline?: string;
  callToAction: string;
}

export interface SponsorCampaign {
  id: string;
  sponsorId: string;
  name: string;
  startDate: string;
  endDate: string;
  active: boolean;
  budgetNote?: string;
  internalPaymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
  placement: 'HOME_BETWEEN_RAILS' | 'HOME_BOTTOM_BANNER' | 'BROWSE_BANNER' | 'SEARCH_NATIVE' | 'MOVIE_DETAILS_BANNER' | 'SERIES_DETAILS_BANNER' | 'PLAYER_COMPANION' | 'FOOTER_BANNER';
  destinationUrl: string;
  impressionLimit?: number;
  clickLimit?: number;
  creatives: AdCreative[];
  impressionsCount: number;
  clicksCount: number;
  createdAt: string;
}

export interface AffiliatePartner {
  id: string;
  partnerName: string;
  description?: string;
  websiteUrl: string;
  active: boolean;
}

export interface AffiliateCampaign {
  id: string;
  partnerId: string;
  campaignName: string;
  imageUrl: string;
  destinationUrl: string;
  trackingUrl: string;
  placement: string;
  startDate: string;
  endDate: string;
  active: boolean;
  clicksCount: number;
}

export interface SponsoredPlacement {
  id: string;
  contentType: 'MOVIE' | 'SERIES';
  contentId: string;
  placement: 'FEATURED' | 'HOME_RAIL' | 'SEARCH_PROMOTION' | 'GENRE_PROMOTION';
  startDate: string;
  endDate: string;
  priority: number;
  active: boolean;
}

export interface AnalyticsEvent {
  id: string;
  userId?: string;
  eventType: string;
  meta?: any;
  ipAddress?: string;
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: any;
  createdAt: string;
}

// Initial Genres
export const INITIAL_GENRES: Genre[] = [
  { id: 'g1', name: 'Action', slug: 'action', description: 'High-octane excitement and adventure' },
  { id: 'g2', name: 'Drama', slug: 'drama', description: 'Deep human emotions and compelling narratives' },
  { id: 'g3', name: 'Romance', slug: 'romance', description: 'Love, passion, and relationship stories' },
  { id: 'g4', name: 'Comedy', slug: 'comedy', description: 'Laughter, satire, and lighthearted fun' },
  { id: 'g5', name: 'Sci-Fi', slug: 'sci-fi', description: 'Futuristic technology and space exploration' },
  { id: 'g6', name: 'Documentary', slug: 'documentary', description: 'Real stories, history, and natural wonders' },
  { id: 'g7', name: 'Kids & Family', slug: 'kids', description: 'Fun for the whole family' },
  { id: 'g8', name: 'African Cinema', slug: 'african', description: 'Rich stories from across the African continent' },
  { id: 'g9', name: 'Rwandan Culture', slug: 'rwandan', description: 'Authentic Rwandan storytelling and heritage' },
];

// Open video sample sources for legal playability
const DEMO_VIDEO_1 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const DEMO_VIDEO_2 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';
const DEMO_VIDEO_3 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
const DEMO_VIDEO_4 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4';
const DEMO_HLS_1 = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

// Initial Movies Seed
export const INITIAL_MOVIES: Movie[] = [
  {
    id: 'm1',
    title: 'Kigali Horizon',
    slug: 'kigali-horizon',
    description: 'In the heart of modern Kigali, two visionary tech founders navigate high-stakes urban innovation, family tradition, and unexpected romance as Rwanda transforms into Africa’s digital hub.',
    releaseYear: 2025,
    durationMinutes: 118,
    maturityRating: 'PG-13',
    language: 'English',
    subtitlesAvailable: ['en', 'rw', 'fr'],
    isFeatured: true,
    isTrending: true,
    isRwandanContent: true,
    isAfricanContent: true,
    isTop10: true,
    top10Rank: 1,
    viewCount: 14250,
    likeCount: 3820,
    averageRating: 4.9,
    state: 'PUBLISHED',
    posterUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: DEMO_VIDEO_3,
    videoUrl: DEMO_VIDEO_1,
    hlsUrl: DEMO_HLS_1,
    genres: ['drama', 'rwandan', 'african'],
    cast: ['Divine Mutoni', 'Jean-Luc Habimana', 'Aline Rukundo'],
    createdAt: new Date('2025-01-10').toISOString(),
  },
  {
    id: 'm2',
    title: 'The Great Rift Expedition',
    slug: 'the-great-rift-expedition',
    description: 'An extraordinary documentary tracking wildlife conservationists, volcanic majesty, and ancient rainforest trails along East Africa’s magnificent Great Rift Valley.',
    releaseYear: 2024,
    durationMinutes: 94,
    maturityRating: 'PG',
    language: 'English',
    subtitlesAvailable: ['en', 'rw', 'fr', 'sw'],
    isFeatured: false,
    isTrending: true,
    isRwandanContent: true,
    isAfricanContent: true,
    isTop10: true,
    top10Rank: 2,
    viewCount: 9800,
    likeCount: 2150,
    averageRating: 4.8,
    state: 'PUBLISHED',
    posterUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=600&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: DEMO_VIDEO_3,
    videoUrl: DEMO_VIDEO_2,
    genres: ['documentary', 'rwandan', 'african'],
    cast: ['Dr. Samuel Ntaganda', 'Grace Umutoni'],
    createdAt: new Date('2025-02-01').toISOString(),
  },
  {
    id: 'm3',
    title: 'Echoes of Umuganura',
    slug: 'echoes-of-umuganura',
    description: 'A vibrant celebration of Rwandan harvest heritage, traditional dance rhythm, and community resilience told through three generations of master drummers in Huye.',
    releaseYear: 2024,
    durationMinutes: 105,
    maturityRating: 'PG-13',
    language: 'Kinyarwanda',
    subtitlesAvailable: ['en', 'rw', 'fr'],
    isFeatured: false,
    isTrending: true,
    isRwandanContent: true,
    isAfricanContent: true,
    isTop10: true,
    top10Rank: 3,
    viewCount: 12100,
    likeCount: 2940,
    averageRating: 4.9,
    state: 'PUBLISHED',
    posterUrl: 'https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?auto=format&fit=crop&w=600&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: DEMO_VIDEO_3,
    videoUrl: DEMO_VIDEO_4,
    genres: ['drama', 'rwandan', 'african'],
    cast: ['Mzee François', 'Keza Diane'],
    createdAt: new Date('2025-01-20').toISOString(),
  },
  {
    id: 'm4',
    title: 'Savannah Velocity',
    slug: 'savannah-velocity',
    description: 'An adrenaline-fueled action thriller set across Nairobi and Akagera, where an elite ranger unit uncovers an international wildlife cyber-crime network.',
    releaseYear: 2025,
    durationMinutes: 122,
    maturityRating: 'R',
    language: 'English',
    subtitlesAvailable: ['en', 'fr', 'sw'],
    isFeatured: true,
    isTrending: true,
    isRwandanContent: false,
    isAfricanContent: true,
    isTop10: true,
    top10Rank: 4,
    viewCount: 18900,
    likeCount: 4120,
    averageRating: 4.7,
    state: 'PUBLISHED',
    posterUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: DEMO_VIDEO_3,
    videoUrl: DEMO_VIDEO_1,
    genres: ['action', 'african'],
    cast: ['Kofi Mensah', 'Amina Yusuf'],
    createdAt: new Date('2025-02-15').toISOString(),
  },
  {
    id: 'm5',
    title: 'Starlight in Musanze',
    slug: 'starlight-in-musanze',
    description: 'A heartwarming romantic comedy about a mountain guide in Musanze who falls for an international astronomer visiting the Virunga observatory.',
    releaseYear: 2025,
    durationMinutes: 98,
    maturityRating: 'PG-13',
    language: 'English',
    subtitlesAvailable: ['en', 'rw'],
    isFeatured: false,
    isTrending: false,
    isRwandanContent: true,
    isAfricanContent: true,
    isTop10: false,
    viewCount: 6400,
    likeCount: 1820,
    averageRating: 4.6,
    state: 'PUBLISHED',
    posterUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: DEMO_VIDEO_3,
    videoUrl: DEMO_VIDEO_2,
    genres: ['romance', 'comedy', 'rwandan'],
    cast: ['Gisèle Uwase', 'David Miller'],
    createdAt: new Date('2025-03-01').toISOString(),
  },
  {
    id: 'm6',
    title: 'Cyber Protocol 2090',
    slug: 'cyber-protocol-2090',
    description: 'In a futuristic solar grid station above Lake Kivu, an AI engineer battles rogue autonomous drones threatening the continent’s power supply.',
    releaseYear: 2025,
    durationMinutes: 110,
    maturityRating: 'PG-13',
    language: 'English',
    subtitlesAvailable: ['en', 'rw', 'fr'],
    isFeatured: false,
    isTrending: false,
    isRwandanContent: true,
    isAfricanContent: true,
    isTop10: false,
    viewCount: 7900,
    likeCount: 1950,
    averageRating: 4.5,
    state: 'PUBLISHED',
    posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: DEMO_VIDEO_3,
    videoUrl: DEMO_VIDEO_4,
    genres: ['sci-fi', 'action', 'rwandan'],
    cast: ['Patrick Bizimana', 'Elena Rostova'],
    createdAt: new Date('2025-03-05').toISOString(),
  }
];

// Initial Series Seed
export const INITIAL_SERIES: Series[] = [
  {
    id: 's1',
    title: 'The Kigali Chronicles',
    slug: 'the-kigali-chronicles',
    description: 'A hit drama series following five ambitious young professionals living, loving, and striving in Kigali’s bustling Nyarutarama and Kimihurura districts.',
    releaseYear: 2025,
    maturityRating: '16+',
    language: 'English & Kinyarwanda',
    isFeatured: true,
    isTrending: true,
    isRwandanContent: true,
    isAfricanContent: true,
    isTop10: true,
    top10Rank: 5,
    viewCount: 28400,
    averageRating: 4.9,
    state: 'PUBLISHED',
    posterUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: DEMO_VIDEO_3,
    genres: ['drama', 'rwandan', 'african'],
    createdAt: new Date('2025-01-01').toISOString(),
    seasons: [
      {
        id: 'sea1',
        seriesId: 's1',
        seasonNumber: 1,
        title: 'Season 1: New Beginnings',
        description: 'Five friends take their first big leaps in Rwanda’s vibrant creative and tech scene.',
        episodes: [
          {
            id: 'ep1',
            seasonId: 'sea1',
            episodeNumber: 1,
            title: 'S1:E1 - The Launch Pad',
            description: 'Clarisse pitch her revolutionary agritech platform at Innovation City while Eric hosts his first rooftop gallery exhibit.',
            durationMinutes: 44,
            thumbnailUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
            videoUrl: DEMO_VIDEO_1,
            hlsUrl: DEMO_HLS_1,
            state: 'PUBLISHED',
          },
          {
            id: 'ep2',
            seasonId: 'sea1',
            episodeNumber: 2,
            title: 'S1:E2 - Coffee & Contracts',
            description: 'An unexpected investor from London challenges Clarisse’s vision, testing her loyalty to her team.',
            durationMinutes: 42,
            thumbnailUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
            videoUrl: DEMO_VIDEO_2,
            state: 'PUBLISHED',
          },
          {
            id: 'ep3',
            seasonId: 'sea1',
            episodeNumber: 3,
            title: 'S1:E3 - Night over Kimihurura',
            description: 'Tensions flare during a celebratory dinner when secrets from Eric’s past come to light.',
            durationMinutes: 48,
            thumbnailUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
            videoUrl: DEMO_VIDEO_4,
            state: 'PUBLISHED',
          }
        ]
      }
    ]
  },
  {
    id: 's2',
    title: 'Akagera Rangers',
    slug: 'akagera-rangers',
    description: 'An inspiring action-adventure series documenting the high-tech conservation rangers protecting Akagera National Park’s lions, rhinos, and elephants.',
    releaseYear: 2024,
    maturityRating: 'PG-13',
    language: 'English',
    isFeatured: false,
    isTrending: true,
    isRwandanContent: true,
    isAfricanContent: true,
    isTop10: true,
    top10Rank: 6,
    viewCount: 16200,
    averageRating: 4.8,
    state: 'PUBLISHED',
    posterUrl: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=600&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: DEMO_VIDEO_3,
    genres: ['action', 'documentary', 'rwandan'],
    createdAt: new Date('2024-11-10').toISOString(),
    seasons: [
      {
        id: 'sea2',
        seriesId: 's2',
        seasonNumber: 1,
        title: 'Season 1: Guardians of the Lake',
        description: 'Tracking wildlife and combating illegal poaching along the eastern border lakes.',
        episodes: [
          {
            id: 'ep4',
            seasonId: 'sea2',
            episodeNumber: 1,
            title: 'S1:E1 - The Pride Awakens',
            description: 'Chief Ranger Bosco leads a night patrol to locate a missing lion cub near Lake Ihema.',
            durationMinutes: 45,
            thumbnailUrl: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=600&q=80',
            videoUrl: DEMO_VIDEO_3,
            state: 'PUBLISHED',
          }
        ]
      }
    ]
  }
];

// Content Rights Seed
export const INITIAL_RIGHTS: ContentRights[] = [
  {
    id: 'cr1',
    movieId: 'm1',
    rightsStatus: 'OWNED',
    rightsHolder: 'ZIRA Original Productions / Rwanda Film Office',
    licenseReference: 'ZIRA-ORIG-2025-001',
    territories: ['GLOBAL'],
    rightsStartDate: '2025-01-01',
    internalNotes: 'Full world rights owned in perpetuity.',
  },
  {
    id: 'cr2',
    movieId: 'm2',
    rightsStatus: 'LICENSED',
    rightsHolder: 'Great Rift Media Ltd',
    licenseReference: 'GRM-LIC-RW-2025',
    territories: ['RWANDA', 'EAST_AFRICA', 'GLOBAL'],
    rightsStartDate: '2025-01-01',
    rightsEndDate: '2028-12-31',
    internalNotes: '3-year non-exclusive regional streaming license.',
  },
  {
    id: 'cr3',
    seriesId: 's1',
    rightsStatus: 'OWNED',
    rightsHolder: 'ZIRA Studios Rwanda',
    licenseReference: 'ZIRA-SERIES-001',
    territories: ['GLOBAL'],
    rightsStartDate: '2025-01-01',
    internalNotes: 'Original digital series.',
  }
];

// Initial Sponsors Seed
export const INITIAL_SPONSORS: Sponsor[] = [
  {
    id: 'sp1',
    name: 'Kigali FiberNet Broadband',
    logoUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=300&q=80',
    websiteUrl: 'https://example.com/fibernet',
    contactName: 'Innocent Niyonzima',
    contactEmail: 'ads@fibernet.rw',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sp2',
    name: 'Afrilink Mobile Pay',
    logoUrl: 'https://images.unsplash.com/photo-1556742049-0a670f4a4591?auto=format&fit=crop&w=300&q=80',
    websiteUrl: 'https://example.com/afrilink',
    contactName: 'Sarah Keza',
    contactEmail: 'marketing@afrilink.africa',
    active: true,
    createdAt: new Date().toISOString(),
  }
];

// Initial Sponsor Campaigns Seed
export const INITIAL_CAMPAIGNS: SponsorCampaign[] = [
  {
    id: 'camp1',
    sponsorId: 'sp1',
    name: 'Ultra Fast Fiber 100Mbps Streaming Special',
    startDate: '2025-01-01',
    endDate: '2026-12-31',
    active: true,
    budgetNote: 'Direct Sponsor V1 Package',
    internalPaymentStatus: 'PAID',
    placement: 'HOME_BETWEEN_RAILS',
    destinationUrl: 'https://example.com/fibernet/zira-promo',
    impressionLimit: 500000,
    clickLimit: 50000,
    impressionsCount: 12400,
    clicksCount: 840,
    createdAt: new Date().toISOString(),
    creatives: [
      {
        id: 'cr_c1',
        campaignId: 'camp1',
        title: 'Stream ZIRA in Pure 4K Ultra HD',
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
        tagline: 'Get 100Mbps FiberNet Broadband in Kigali from 25,000 RWF/mo',
        callToAction: 'Check Coverage',
      }
    ]
  },
  {
    id: 'camp2',
    sponsorId: 'sp2',
    name: 'Send Money Free Across East Africa',
    startDate: '2025-01-01',
    endDate: '2026-12-31',
    active: true,
    budgetNote: 'Direct Mobile Partner Package',
    internalPaymentStatus: 'PAID',
    placement: 'PLAYER_COMPANION',
    destinationUrl: 'https://example.com/afrilink/app',
    impressionsCount: 8900,
    clicksCount: 510,
    createdAt: new Date().toISOString(),
    creatives: [
      {
        id: 'cr_c2',
        campaignId: 'camp2',
        title: 'Zero Fee Mobile Transfers in Rwanda',
        imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
        tagline: 'Instant transfers from your phone with Afrilink Pay',
        callToAction: 'Download App',
      }
    ]
  }
];

// Initial Affiliate Campaigns Seed
export const INITIAL_AFFILIATES: AffiliateCampaign[] = [
  {
    id: 'aff1',
    partnerId: 'ap1',
    campaignName: 'Rwandan Tech Accessories & Smart TVs',
    imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1200&q=80',
    destinationUrl: 'https://example.com/tech-store/tvs',
    trackingUrl: 'https://example.com/tech-store/tvs?ref=zira',
    placement: 'HOME_BOTTOM_BANNER',
    startDate: '2025-01-01',
    endDate: '2026-12-31',
    active: true,
    clicksCount: 310,
  }
];

// Initial Users Seed
export const INITIAL_USERS: User[] = [
  {
    id: 'u_admin',
    email: 'admin@zira.stream',
    passwordHash: '$2a$10$wT0X7Vf4.n7UaQ4v.jN7eO123456789012345678901234567890', // 'admin123' hashed fallback
    displayName: 'ZIRA Super Admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    role: 'SUPER_ADMIN',
    emailVerified: true,
    playbackPreference: 'AUTO',
    notificationEmail: true,
    notificationPush: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'u_demo',
    email: 'viewer@zira.stream',
    passwordHash: '$2a$10$wT0X7Vf4.n7UaQ4v.jN7eO123456789012345678901234567890',
    displayName: 'Kigali Viewer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    role: 'USER',
    emailVerified: true,
    playbackPreference: 'DATA_SAVER',
    notificationEmail: true,
    notificationPush: true,
    createdAt: new Date().toISOString(),
  }
];

// Store Memory Singleton
class MemoryStore {
  movies: Movie[] = [...INITIAL_MOVIES];
  series: Series[] = [...INITIAL_SERIES];
  genres: Genre[] = [...INITIAL_GENRES];
  rights: ContentRights[] = [...INITIAL_RIGHTS];
  users: User[] = [...INITIAL_USERS];
  sponsors: Sponsor[] = [...INITIAL_SPONSORS];
  campaigns: SponsorCampaign[] = [...INITIAL_CAMPAIGNS];
  affiliates: AffiliateCampaign[] = [...INITIAL_AFFILIATES];
  watchProgress: WatchProgress[] = [
    {
      id: 'wp1',
      userId: 'u_demo',
      movieId: 'm1',
      positionSeconds: 2450,
      durationSeconds: 7080,
      percentage: 34.6,
      completed: false,
      updatedAt: new Date().toISOString(),
    }
  ];
  watchlists: Watchlist[] = [
    { id: 'wl1', userId: 'u_demo', movieId: 'm1', createdAt: new Date().toISOString() },
    { id: 'wl2', userId: 'u_demo', seriesId: 's1', createdAt: new Date().toISOString() }
  ];
  ratings: Rating[] = [
    { id: 'r1', userId: 'u_demo', movieId: 'm1', score: 5, createdAt: new Date().toISOString() },
    { id: 'r2', userId: 'u_demo', seriesId: 's1', score: 5, createdAt: new Date().toISOString() }
  ];
  analyticsEvents: AnalyticsEvent[] = [];
  auditLogs: AdminAuditLog[] = [
    {
      id: 'log1',
      adminId: 'u_admin',
      adminName: 'ZIRA Super Admin',
      action: 'PLATFORM_INITIALIZATION',
      entityType: 'SYSTEM',
      entityId: 'sys_01',
      metadata: { note: 'ZIRA V1 production engine booted with Rwandan & African content' },
      createdAt: new Date().toISOString(),
    }
  ];

  constructor() {
    // Generate default password hashes asynchronously
    this.initPasswords();
  }

  private async initPasswords() {
    const hash = await bcrypt.hash('zira2026', 10);
    this.users.forEach(u => u.passwordHash = hash);
  }
}

export const store = new MemoryStore();

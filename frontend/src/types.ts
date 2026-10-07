export type Role = 'USER' | 'EDITOR' | 'ADMIN' | 'SUPER_ADMIN';

export type PlaybackPreference = 'AUTO' | 'DATA_SAVER' | 'HIGH_QUALITY';

export type ContentState = 'DRAFT' | 'UPLOADED' | 'PROCESSING' | 'READY' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED';

export type RightsStatus = 'OWNED' | 'LICENSED' | 'PERMISSION_GRANTED' | 'PUBLIC_DOMAIN' | 'PENDING_VERIFICATION' | 'EXPIRED';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  role: Role;
  emailVerified: boolean;
  playbackPreference: PlaybackPreference;
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
  rightsStatus: RightsStatus;
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
  state: ContentState;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl: string;
  videoUrl: string;
  hlsUrl?: string;
  genres: string[];
  cast: string[];
  createdAt: string;
  rights?: ContentRights;
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
  state: ContentState;
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
  state: ContentState;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl: string;
  genres: string[];
  seasons: Season[];
  createdAt: string;
  rights?: ContentRights;
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
  movie?: Movie;
  series?: Series;
  episode?: Episode;
}

export interface WatchlistItem {
  id: string;
  userId: string;
  movieId?: string;
  seriesId?: string;
  createdAt: string;
  movie?: Movie;
  series?: Series;
}

export interface SponsorBannerPlacement {
  type: 'SPONSOR' | 'AFFILIATE' | 'HOUSE';
  campaignId: string;
  sponsorName: string;
  title: string;
  tagline: string;
  imageUrl: string;
  callToAction: string;
  destinationUrl: string;
  trackingUrl?: string;
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
  placement: string;
  destinationUrl: string;
  impressionLimit?: number;
  clickLimit?: number;
  creatives: AdCreative[];
  impressionsCount: number;
  clicksCount: number;
  createdAt: string;
}

export interface AdminMetrics {
  totalUsers: number;
  totalMovies: number;
  totalSeries: number;
  totalEpisodes: number;
  totalViews: number;
  totalWatchHours: number | null;
  totalSponsorImpressions: number;
  totalSponsorClicks: number;
  totalAffiliateClicks: number;
  pendingRightsCount: number;
  r2Configured: boolean;
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

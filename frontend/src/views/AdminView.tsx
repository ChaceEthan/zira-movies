import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api';
import {
  Shield, Film, Tv, DollarSign, BarChart3,
  Plus, X, AlertTriangle, ShieldCheck, Upload,
  Edit, Trash2, RefreshCw, FileText, ExternalLink, Sparkles, Star, Layers, HardDrive,
  Mic, Crown, Users as UsersIcon
} from 'lucide-react';
import {
  Movie,
  Series,
  Episode,
  AdminMetrics,
  Sponsor,
  SponsorCampaign,
  AdminAuditLog,
  Interpreter,
  VipConfig,
  User,
} from '../types';

interface AdminViewProps {
  token: string;
  movies: Movie[];
  series: Series[];
  onRefreshData: () => void;
}

const AVAILABLE_GENRES = [
  'action',
  'adventure',
  'comedy',
  'drama',
  'romance',
  'thriller',
  'horror',
  'sci-fi',
  'animation',
  'documentary',
  'african-cinema',
  'rwandan-cinema',
];

export function AdminView({ token, movies, series, onRefreshData }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<
    | 'metrics'
    | 'movies'
    | 'series'
    | 'interpreters'
    | 'vip'
    | 'users'
    | 'media'
    | 'rights'
    | 'sponsors'
    | 'monetag'
    | 'affiliate'
    | 'analytics'
    | 'audit'
  >('metrics');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [adminMovies, setAdminMovies] = useState<Movie[]>(movies);
  const [adminSeries, setAdminSeries] = useState<Series[]>(series);
  const [interpretersList, setInterpretersList] = useState<Interpreter[]>([]);
  const [vipConfig, setVipConfig] = useState<VipConfig | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [mediaAssets, setMediaAssets] = useState<any[]>([]);
  const [rightsList, setRightsList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [campaigns, setCampaigns] = useState<SponsorCampaign[]>([]);
  const [monetagPlacements, setMonetagPlacements] = useState<any[]>([]);
  const [monetagRevenue, setMonetagRevenue] = useState(0);
  const [affiliateData, setAffiliateData] = useState<any>({ partners: [], campaigns: [], verifiedRevenue: 0 });
  const [analytics, setAnalytics] = useState<any>(null);
  const [paidInputs, setPaidInputs] = useState<Record<string, string>>({});
  const [statusMsg, setStatusMsg] = useState('');

  // Interpreter management state
  const [editingInterpreterSlug, setEditingInterpreterSlug] = useState<string | null>(null);
  const [interpreterDraft, setInterpreterDraft] = useState({
    displayName: '',
    slug: '',
    photoUrl: '',
    biography: '',
    specialtyGenres: 'action, drama',
    youtubeUrl: '',
    instagramUrl: '',
    isFeatured: true,
    isExampleProfile: false,
    active: true,
  });

  // Movie filter & modal states
  const [movieFilterState, setMovieFilterState] = useState<string>('ALL');
  const [movieSearch, setMovieSearch] = useState('');
  const [showMovieModal, setShowMovieModal] = useState(false);
  const [editingMovieId, setEditingMovieId] = useState<string | null>(null);
  const [movieDraft, setMovieDraft] = useState({
    title: '',
    slug: '',
    description: '',
    releaseYear: '2025',
    durationMinutes: '110',
    maturityRating: 'PG-13',
    language: 'English',
    country: 'GLOBAL, RW',
    subtitlesAvailable: 'en, rw, fr',
    subtitleUrl: '',
    genres: ['drama'] as string[],
    posterUrl: '',
    backdropUrl: '',
    trailerUrl: '',
    videoUrl: '',
    interpreterSlug: '',
    badgeIndicator: 'NEW' as 'NEW' | 'UPDATED' | '',
    narrationPermissionOnly: false,
    rightsStatus: 'OWNED',
    rightsHolder: 'ZIRA Media Platform',
    licenseReference: '',
    rightsEndDate: '',
    state: 'DRAFT',
    isFeatured: false,
    isTrending: false,
    isRwandanContent: true,
    isAfricanContent: true,
  });

  // Series filter & modal states
  const [seriesFilterState, setSeriesFilterState] = useState<string>('ALL');
  const [seriesSearch, setSeriesSearch] = useState('');
  const [showSeriesModal, setShowSeriesModal] = useState(false);
  const [editingSeriesId, setEditingSeriesId] = useState<string | null>(null);
  const [seriesDraft, setSeriesDraft] = useState({
    title: '',
    description: '',
    releaseYear: '2025',
    maturityRating: 'PG-13',
    language: 'English',
    genres: ['drama'] as string[],
    posterUrl: '',
    backdropUrl: '',
    trailerUrl: '',
    interpreterSlug: '',
    badgeIndicator: 'NEW' as 'NEW' | 'UPDATED' | '',
    rightsStatus: 'OWNED',
    rightsHolder: 'ZIRA Media Platform',
    state: 'PUBLISHED',
    isFeatured: false,
    isTrending: false,
    isRwandanContent: true,
    isAfricanContent: true,
  });

  // Series Seasons & Episodes Manager
  const [managingSeries, setManagingSeries] = useState<Series | null>(null);
  const [newSeasonNumber, setNewSeasonNumber] = useState('1');
  const [newSeasonTitle, setNewSeasonTitle] = useState('Season 1');
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [episodeSeasonId, setEpisodeSeasonId] = useState<string>('');
  const [episodeDraft, setEpisodeDraft] = useState({
    episodeNumber: '1',
    title: '',
    description: '',
    durationMinutes: '42',
    thumbnailUrl: '',
    videoUrl: '',
    state: 'PUBLISHED',
  });

  // Destructive Confirmation Modal state
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'movie' | 'series' | 'season' | 'episode' | 'media';
    id: string;
    parentId?: string;
    title: string;
    mode?: 'archive' | 'permanent';
  } | null>(null);

  // Media Upload state
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [lastFailedUpload, setLastFailedUpload] = useState<{
    file: File;
    category: string;
    contentId: string;
    onSuccess?: (url: string) => void;
  } | null>(null);
  const [mediaCategory, setMediaCategory] = useState<'movie_video' | 'movie_poster' | 'series_poster' | 'episode_video' | 'episode_thumbnail'>('movie_video');
  const [mediaContentId, setMediaContentId] = useState('catalog-asset');
  const [externalMediaUrl, setExternalMediaUrl] = useState('');

  // Sponsor & Affiliate states
  const [showAddSponsorModal, setShowAddSponsorModal] = useState(false);
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorWebsite, setSponsorWebsite] = useState('');
  const [editingSponsorId, setEditingSponsorId] = useState<string | null>(null);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [campaignDraft, setCampaignDraft] = useState({
    sponsorId: '',
    name: '',
    destinationUrl: '',
    imageUrl: '',
    creativeTitle: '',
    tagline: '',
    placement: 'HOME_BETWEEN_RAILS',
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16),
    agreedPrice: '0',
  });
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [showAffiliatePartnerModal, setShowAffiliatePartnerModal] = useState(false);
  const [editingAffiliatePartnerId, setEditingAffiliatePartnerId] = useState<string | null>(null);
  const [affiliatePartnerDraft, setAffiliatePartnerDraft] = useState({ partnerName: '', websiteUrl: '', description: '' });
  const [showAffiliateCampaignModal, setShowAffiliateCampaignModal] = useState(false);
  const [editingAffiliateCampaignId, setEditingAffiliateCampaignId] = useState<string | null>(null);
  const [affiliateCampaignDraft, setAffiliateCampaignDraft] = useState({
    partnerId: '',
    campaignName: '',
    destinationUrl: '',
    trackingUrl: '',
    imageUrl: '',
    placement: 'HOME_BOTTOM_BANNER',
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16),
  });
  const [conversionCampaignId, setConversionCampaignId] = useState('');
  const [conversionDraft, setConversionDraft] = useState({ externalReference: '', commissionRevenue: '', currency: 'USD' });
  const [previewPlacement, setPreviewPlacement] = useState<string | null>(null);

  useEffect(() => {
    setAdminMovies(movies);
  }, [movies]);

  useEffect(() => {
    setAdminSeries(series);
  }, [series]);

  const fetchAdminCatalog = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/catalog', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.movies)) setAdminMovies(data.movies);
        if (Array.isArray(data.series)) {
          setAdminSeries(data.series);
          setManagingSeries(prev => (prev ? data.series.find((s: Series) => s.id === prev.id) || null : null));
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  const fetchAdminMetrics = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/metrics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMetrics(data.metrics);
        setAuditLogs(data.auditLogs || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  const fetchRightsData = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/rights', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setRightsList(data.rights || []);
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  const fetchMediaAssets = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/media', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMediaAssets(data.assets || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  const fetchSponsorsData = useCallback(async () => {
    try {
      const res = await apiFetch('/api/monetization/sponsors', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSponsors(data.sponsors || []);
        setCampaigns(data.campaigns || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  const fetchMonetagData = useCallback(async () => {
    try {
      const res = await apiFetch('/api/monetization/monetag', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        setMonetagPlacements(data.placements || []);
        setMonetagRevenue(data.reportedRevenue || 0);
      }
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  const fetchAffiliateData = useCallback(async () => {
    try {
      const res = await apiFetch('/api/monetization/affiliate', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setAffiliateData(data);
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  const fetchMonetizationAnalytics = useCallback(async () => {
    try {
      const res = await apiFetch('/api/monetization/analytics', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setAnalytics(data);
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  const fetchInterpretersData = useCallback(async () => {
    try {
      const res = await apiFetch('/api/interpreters?includeInactive=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInterpretersList(data.interpreters || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  const fetchVipData = useCallback(async () => {
    try {
      const res = await apiFetch('/api/vip', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVipConfig(data.config || null);
      }
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  const fetchUsersData = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  useEffect(() => {
    void fetchAdminCatalog();
    void fetchAdminMetrics();
    void fetchRightsData();
    void fetchMediaAssets();
    void fetchSponsorsData();
    void fetchMonetagData();
    void fetchAffiliateData();
    void fetchMonetizationAnalytics();
    void fetchInterpretersData();
    void fetchVipData();
    void fetchUsersData();
  }, [
    token,
    fetchAdminCatalog,
    fetchAdminMetrics,
    fetchRightsData,
    fetchMediaAssets,
    fetchSponsorsData,
    fetchMonetagData,
    fetchAffiliateData,
    fetchMonetizationAnalytics,
    fetchInterpretersData,
    fetchVipData,
    fetchUsersData,
  ]);

  const refreshAll = async () => {
    await Promise.all([
      fetchAdminCatalog(),
      fetchAdminMetrics(),
      fetchRightsData(),
      fetchMediaAssets(),
      fetchInterpretersData(),
      fetchVipData(),
      fetchUsersData(),
    ]);
    onRefreshData();
  };

  // Upload helper with progress tracking & retry support
  const uploadFileToR2 = async (
    file: File,
    category: string,
    contentId: string,
    extra: Record<string, any> = {},
    onSuccess?: (url: string) => void,
  ): Promise<string | null> => {
    const isImage = category.includes('poster') || category.includes('backdrop') || category.includes('thumbnail') || category.includes('banner');
    const isSubtitle = category.includes('subtitle');
    const maxBytes = isImage ? 10 * 1024 * 1024 : isSubtitle ? 5 * 1024 * 1024 : 2 * 1024 * 1024 * 1024;
    if (file.size > maxBytes) {
      setStatusMsg(
        isImage
          ? 'Image files must be 10 MB or smaller.'
          : isSubtitle
            ? 'Subtitle files must be 5 MB or smaller.'
            : 'Video files must be 2 GB or smaller.',
      );
      return null;
    }

    const effectiveContentType =
      isSubtitle && (file.name.endsWith('.vtt') || file.type === 'text/vtt')
        ? 'text/vtt'
        : isSubtitle && file.name.endsWith('.srt')
          ? 'application/x-subrip'
          : file.type;

    const allowedMime = isImage
      ? ['image/jpeg', 'image/png', 'image/webp']
      : isSubtitle
        ? ['text/vtt', 'application/x-subrip', 'text/plain']
        : ['video/mp4'];
    if (!allowedMime.includes(effectiveContentType)) {
      setStatusMsg(
        isImage
          ? 'Please select a valid JPEG, PNG, or WebP image.'
          : isSubtitle
            ? 'Please select a valid .vtt or .srt subtitle file.'
            : 'Please select a valid MP4 video file.',
      );
      return null;
    }

    setLastFailedUpload(null);
    setUploadProgress(5);
    setUploadStatusText(`Requesting secure R2 upload URL for ${file.name}…`);
    try {
      const cleanName = `${Date.now()}-${file.name.replace(/[^A-Za-z0-9._-]/g, '-')}`;
      const presignRes = await apiFetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          filename: cleanName,
          contentType: effectiveContentType,
          contentId: contentId.replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 64) || 'zira-asset',
          contentTypeCategory: category,
          ...extra,
        }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) {
        throw new Error(presignData.error || 'Cloudflare R2 upload is not configured.');
      }

      setUploadProgress(25);
      setUploadStatusText(`Uploading ${file.name} to Cloudflare R2…`);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', presignData.presignedUrl);
        xhr.setRequestHeader('Content-Type', effectiveContentType);
        xhr.upload.onprogress = event => {
          if (event.lengthComputable) {
            const pct = Math.min(95, Math.round((event.loaded / event.total) * 70) + 25);
            setUploadProgress(pct);
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`R2 upload failed with HTTP ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error('Network error while uploading to Cloudflare R2.'));
        xhr.send(file);
      });

      await apiFetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          originalUrl: presignData.publicUrl,
          movieId: editingMovieId || undefined,
          fileSizeBytes: file.size,
        }),
      });

      setUploadProgress(100);
      setUploadStatusText('Upload complete!');
      setStatusMsg(`Uploaded ${file.name} to Cloudflare R2.`);
      if (onSuccess) onSuccess(presignData.publicUrl as string);
      void fetchMediaAssets();
      setTimeout(() => {
        setUploadProgress(null);
        setUploadStatusText('');
      }, 1500);
      return presignData.publicUrl as string;
    } catch (error: any) {
      setUploadProgress(null);
      setUploadStatusText('');
      setLastFailedUpload({ file, category, contentId, onSuccess });
      setStatusMsg(error.message || 'Upload failed.');
      return null;
    }
  };

  // Movie Actions
  const openAddMovieModal = () => {
    setEditingMovieId(null);
    setLastFailedUpload(null);
    setMovieDraft({
      title: '',
      slug: '',
      description: '',
      releaseYear: String(new Date().getFullYear()),
      durationMinutes: '110',
      maturityRating: 'PG-13',
      language: 'English',
      country: 'GLOBAL, RW',
      subtitlesAvailable: 'en, rw, fr',
      subtitleUrl: '',
      genres: ['drama'],
      posterUrl: '',
      backdropUrl: '',
      trailerUrl: '',
      videoUrl: '',
      interpreterSlug: '',
      badgeIndicator: 'NEW',
      narrationPermissionOnly: false,
      rightsStatus: 'OWNED',
      rightsHolder: 'ZIRA Media Platform',
      licenseReference: '',
      rightsEndDate: '',
      state: 'DRAFT',
      isFeatured: false,
      isTrending: false,
      isRwandanContent: true,
      isAfricanContent: true,
    });
    setShowMovieModal(true);
  };

  const openEditMovieModal = (m: Movie) => {
    setEditingMovieId(m.id);
    setLastFailedUpload(null);
    setMovieDraft({
      title: m.title,
      slug: m.slug || '',
      description: m.description,
      releaseYear: String(m.releaseYear),
      durationMinutes: String(m.durationMinutes),
      maturityRating: m.maturityRating || 'PG-13',
      language: m.language || 'English',
      country: m.rights?.territories?.length ? m.rights.territories.join(', ') : m.country || 'GLOBAL, RW',
      subtitlesAvailable: m.subtitlesAvailable?.length ? m.subtitlesAvailable.join(', ') : 'en',
      subtitleUrl: '',
      genres: m.genres?.length ? m.genres : ['drama'],
      posterUrl: m.posterUrl || '',
      backdropUrl: m.backdropUrl || '',
      trailerUrl: m.trailerUrl || '',
      videoUrl: m.videoUrl || '',
      interpreterSlug: m.interpreterSlug || '',
      badgeIndicator: (m.badgeIndicator as any) || '',
      narrationPermissionOnly: false,
      rightsStatus: m.rights?.rightsStatus || 'OWNED',
      rightsHolder: m.rights?.rightsHolder || 'ZIRA Media Platform',
      licenseReference: m.rights?.licenseReference || '',
      rightsEndDate: m.rights?.rightsEndDate ? String(m.rights.rightsEndDate).slice(0, 10) : '',
      state: m.state || 'DRAFT',
      isFeatured: Boolean(m.isFeatured),
      isTrending: Boolean(m.isTrending),
      isRwandanContent: Boolean(m.isRwandanContent),
      isAfricanContent: Boolean(m.isAfricanContent),
    });
    setShowMovieModal(true);
  };

  const handleSaveMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = editingMovieId ? `/api/movies/${editingMovieId}` : '/api/movies';
      const method = editingMovieId ? 'PATCH' : 'POST';
      const territories = movieDraft.country
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      const subtitlesAvailable = movieDraft.subtitlesAvailable
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      const res = await apiFetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...movieDraft,
          slug: movieDraft.slug.trim() || undefined,
          releaseYear: Number(movieDraft.releaseYear),
          durationMinutes: Number(movieDraft.durationMinutes),
          territories: territories.length > 0 ? territories : ['GLOBAL', 'RW'],
          subtitlesAvailable: subtitlesAvailable.length > 0 ? subtitlesAvailable : ['en'],
          interpreterSlug: movieDraft.interpreterSlug || null,
          badgeIndicator: movieDraft.badgeIndicator || null,
          narrationPermissionOnly: movieDraft.narrationPermissionOnly,
          licenseReference: movieDraft.licenseReference.trim() || null,
          rightsEndDate: movieDraft.rightsEndDate ? new Date(movieDraft.rightsEndDate).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMsg(`Error: ${data.error || 'Could not save movie.'}`);
        return;
      }
      setShowMovieModal(false);
      setEditingMovieId(null);
      await refreshAll();
      setStatusMsg(editingMovieId ? `Updated "${data.movie?.title || movieDraft.title}".` : `Uploaded movie "${data.movie?.title || movieDraft.title}" (${data.movie?.state || 'DRAFT'}).`);
    } catch (err: any) {
      setStatusMsg(err.message || 'Could not save movie.');
    }
  };

  const handlePublishMovie = async (movieId: string, newState: string) => {
    setStatusMsg('');
    try {
      const res = await apiFetch(`/api/movies/${movieId}/state`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ state: newState }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMsg(`Error: ${data.error}`);
      } else {
        setStatusMsg(data.message);
        await refreshAll();
      }
    } catch (err: any) {
      setStatusMsg(`Failed to update state: ${err.message}`);
    }
  };

  const handleToggleMovieFlag = async (movie: Movie, field: 'isFeatured' | 'isTrending') => {
    try {
      const res = await apiFetch(`/api/movies/${movie.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: !movie[field] }),
      });
      if (res.ok) {
        await refreshAll();
        setStatusMsg(`${movie.title} ${field === 'isFeatured' ? 'featured' : 'trending'} status updated.`);
      }
    } catch (err: any) {
      setStatusMsg(err.message);
    }
  };

  // Series Actions
  const openAddSeriesModal = () => {
    setEditingSeriesId(null);
    setSeriesDraft({
      title: '',
      description: '',
      releaseYear: '2025',
      maturityRating: 'PG-13',
      language: 'English',
      genres: ['drama'],
      posterUrl: '',
      backdropUrl: '',
      trailerUrl: '',
      interpreterSlug: '',
      badgeIndicator: 'NEW',
      rightsStatus: 'OWNED',
      rightsHolder: 'ZIRA Media Platform',
      state: 'PUBLISHED',
      isFeatured: false,
      isTrending: false,
      isRwandanContent: true,
      isAfricanContent: true,
    });
    setShowSeriesModal(true);
  };

  const openEditSeriesModal = (s: Series) => {
    setEditingSeriesId(s.id);
    setSeriesDraft({
      title: s.title,
      description: s.description,
      releaseYear: String(s.releaseYear),
      maturityRating: s.maturityRating || 'PG-13',
      language: s.language || 'English',
      genres: s.genres?.length ? s.genres : ['drama'],
      posterUrl: s.posterUrl || '',
      backdropUrl: s.backdropUrl || '',
      trailerUrl: s.trailerUrl || '',
      interpreterSlug: s.interpreterSlug || '',
      badgeIndicator: (s.badgeIndicator as any) || '',
      rightsStatus: s.rights?.rightsStatus || 'OWNED',
      rightsHolder: s.rights?.rightsHolder || 'ZIRA Media Platform',
      state: s.state || 'PUBLISHED',
      isFeatured: Boolean(s.isFeatured),
      isTrending: Boolean(s.isTrending),
      isRwandanContent: Boolean(s.isRwandanContent),
      isAfricanContent: Boolean(s.isAfricanContent),
    });
    setShowSeriesModal(true);
  };

  const handleSaveSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = editingSeriesId ? `/api/series/${editingSeriesId}` : '/api/series';
      const method = editingSeriesId ? 'PATCH' : 'POST';
      const res = await apiFetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...seriesDraft,
          releaseYear: Number(seriesDraft.releaseYear),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMsg(`Error: ${data.error || 'Could not save series.'}`);
        return;
      }
      setShowSeriesModal(false);
      setEditingSeriesId(null);
      await refreshAll();
      setStatusMsg(editingSeriesId ? 'Series updated.' : 'Series created.');
    } catch (err: any) {
      setStatusMsg(err.message || 'Could not save series.');
    }
  };

  const handlePublishSeries = async (seriesId: string, newState: string) => {
    try {
      const res = await apiFetch(`/api/series/${seriesId}/state`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ state: newState }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMsg(`Error: ${data.error}`);
      } else {
        setStatusMsg(data.message);
        await refreshAll();
      }
    } catch (err: any) {
      setStatusMsg(err.message);
    }
  };

  const handleAddSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingSeries) return;
    try {
      const res = await apiFetch(`/api/series/${managingSeries.id}/seasons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ seasonNumber: Number(newSeasonNumber), title: newSeasonTitle }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMsg(data.error || 'Could not add season.');
        return;
      }
      await refreshAll();
      setStatusMsg(`Added Season ${newSeasonNumber} to ${managingSeries.title}.`);
      setNewSeasonNumber(String(Number(newSeasonNumber) + 1));
      setNewSeasonTitle(`Season ${Number(newSeasonNumber) + 1}`);
    } catch (err: any) {
      setStatusMsg(err.message);
    }
  };

  const handleSaveEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingSeries) return;
    const targetSeasonId = episodeSeasonId || managingSeries.seasons[0]?.id;
    if (!targetSeasonId && !editingEpisode) {
      setStatusMsg('Create a season first before adding episodes.');
      return;
    }
    try {
      const endpoint = editingEpisode
        ? `/api/series/episodes/${editingEpisode.id}`
        : `/api/series/${managingSeries.id}/seasons/${targetSeasonId}/episodes`;
      const method = editingEpisode ? 'PATCH' : 'POST';
      const res = await apiFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...episodeDraft,
          episodeNumber: Number(episodeDraft.episodeNumber),
          durationMinutes: Number(episodeDraft.durationMinutes),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMsg(data.error || 'Could not save episode.');
        return;
      }
      setEditingEpisode(null);
      setEpisodeDraft({
        episodeNumber: String(Number(episodeDraft.episodeNumber) + 1),
        title: '',
        description: '',
        durationMinutes: '42',
        thumbnailUrl: '',
        videoUrl: '',
        state: 'PUBLISHED',
      });
      await refreshAll();
      setStatusMsg(editingEpisode ? 'Episode updated.' : 'Episode added to season.');
    } catch (err: any) {
      setStatusMsg(err.message);
    }
  };

  const executeConfirmedDelete = async (overrideMode?: 'archive' | 'permanent') => {
    if (!confirmDelete) return;
    try {
      const deleteMode = overrideMode || confirmDelete.mode || 'permanent';
      let endpoint = '';
      if (confirmDelete.type === 'movie') endpoint = `/api/movies/${confirmDelete.id}?mode=${deleteMode}`;
      else if (confirmDelete.type === 'series') endpoint = `/api/series/${confirmDelete.id}`;
      else if (confirmDelete.type === 'season') endpoint = `/api/series/${confirmDelete.parentId}/seasons/${confirmDelete.id}`;
      else if (confirmDelete.type === 'episode') endpoint = `/api/series/episodes/${confirmDelete.id}`;
      else if (confirmDelete.type === 'media') endpoint = `/api/admin/media/${confirmDelete.id}`;

      const res = await apiFetch(endpoint, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMsg(data.error || 'Delete failed.');
      } else {
        setStatusMsg(data.message || `${confirmDelete.title} removed.`);
        await refreshAll();
      }
    } catch (err: any) {
      setStatusMsg(err.message || 'Delete failed.');
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleUpdateRightsStatus = async (rightsId: string, rightsStatus: string) => {
    try {
      const res = await apiFetch(`/api/admin/rights/${rightsId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rightsStatus }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Could not update rights status.');
      await refreshAll();
      setStatusMsg(`Rights status updated to ${rightsStatus}.`);
    } catch (err: any) {
      setStatusMsg(err.message);
    }
  };

  const saveMonetagPlacement = async (item: any) => {
    try {
      const res = await apiFetch(`/api/monetization/monetag/placements/${item.placement}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled: item.enabled, zoneId: item.zoneId, tagCode: item.tagCode }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Could not update placement.');
      await fetchMonetagData();
      await fetchAdminMetrics();
      setStatusMsg('Monetag placement saved.');
    } catch (error: any) {
      setStatusMsg(error.message || 'Could not update Monetag placement.');
    }
  };

  const updateMonetagDraft = (placement: string, changes: Record<string, unknown>) => {
    setMonetagPlacements(previous => previous.map(item => (item.placement === placement ? { ...item, ...changes } : item)));
  };

  const updateSponsorCampaign = async (campaignId: string, changes: Record<string, unknown>) => {
    try {
      const res = await apiFetch(`/api/monetization/sponsors/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(changes),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Could not update campaign.');
      await fetchSponsorsData();
      await fetchMonetizationAnalytics();
      setStatusMsg('Campaign updated.');
    } catch (error: any) {
      setStatusMsg(error.message || 'Could not update campaign.');
    }
  };

  const updateSponsor = async (sponsorId: string, changes: Record<string, unknown>) => {
    try {
      const res = await apiFetch(`/api/monetization/sponsors/${sponsorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(changes),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Could not update sponsor.');
      await fetchSponsorsData();
      setStatusMsg('Sponsor updated.');
    } catch (error: any) {
      setStatusMsg(error.message || 'Could not update sponsor.');
    }
  };

  const handleCreateSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch(editingSponsorId ? `/api/monetization/sponsors/${editingSponsorId}` : '/api/monetization/sponsors', {
        method: editingSponsorId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: sponsorName, websiteUrl: sponsorWebsite }),
      });
      if (res.ok) {
        setShowAddSponsorModal(false);
        setEditingSponsorId(null);
        setSponsorName('');
        setSponsorWebsite('');
        void fetchSponsorsData();
        setStatusMsg(editingSponsorId ? 'Sponsor updated successfully' : 'Sponsor registered successfully');
      } else {
        setStatusMsg((await res.json()).error || 'Could not save sponsor.');
      }
    } catch (err: any) {
      setStatusMsg(err.message);
    }
  };

  const handleCreateSponsorCampaign = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const { sponsorId, ...campaign } = campaignDraft;
      const res = await apiFetch(
        editingCampaignId ? `/api/monetization/sponsors/campaigns/${editingCampaignId}` : `/api/monetization/sponsors/${sponsorId}/campaigns`,
        {
          method: editingCampaignId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            ...campaign,
            agreedPrice: Number(campaign.agreedPrice),
            startDate: new Date(campaign.startDate).toISOString(),
            endDate: new Date(campaign.endDate).toISOString(),
          }),
        },
      );
      if (!res.ok) throw new Error((await res.json()).error || 'Could not create campaign.');
      setShowCampaignModal(false);
      setEditingCampaignId(null);
      await fetchSponsorsData();
      await fetchMonetizationAnalytics();
      setStatusMsg(editingCampaignId ? 'Sponsor campaign updated.' : 'Sponsor campaign created.');
    } catch (error: any) {
      setStatusMsg(error.message || 'Could not create sponsor campaign.');
    }
  };

  const handleSponsorBannerUpload = async (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setStatusMsg('Banner images must be 5 MB or smaller.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setStatusMsg('Choose a JPEG, PNG, or WebP banner image.');
      return;
    }
    if (!campaignDraft.sponsorId) {
      setStatusMsg('Select a sponsor before uploading a banner.');
      return;
    }

    setUploadingBanner(true);
    try {
      const filename = `${Date.now()}-${file.name.replace(/[^A-Za-z0-9._-]/g, '-')}`;
      const presignResponse = await apiFetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filename, contentType: file.type, contentId: campaignDraft.sponsorId, contentTypeCategory: 'sponsor_banner' }),
      });
      const presignData = await presignResponse.json();
      if (!presignResponse.ok) throw new Error(presignData.error || 'Could not prepare R2 upload.');

      const uploadResponse = await fetch(presignData.presignedUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!uploadResponse.ok) throw new Error(`R2 upload failed with HTTP ${uploadResponse.status}. Check the bucket CORS policy.`);
      setCampaignDraft(previous => ({ ...previous, imageUrl: presignData.publicUrl }));
      setStatusMsg('Banner uploaded to R2.');
    } catch (error: any) {
      setStatusMsg(error.message || 'Could not upload banner.');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleCreateAffiliatePartner = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const res = await apiFetch(
        editingAffiliatePartnerId ? `/api/monetization/affiliate/partners/${editingAffiliatePartnerId}` : '/api/monetization/affiliate/partners',
        {
          method: editingAffiliatePartnerId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(affiliatePartnerDraft),
        },
      );
      if (!res.ok) throw new Error((await res.json()).error || 'Could not create partner.');
      setShowAffiliatePartnerModal(false);
      setEditingAffiliatePartnerId(null);
      setAffiliatePartnerDraft({ partnerName: '', websiteUrl: '', description: '' });
      await fetchAffiliateData();
      setStatusMsg(editingAffiliatePartnerId ? 'Affiliate partner updated.' : 'Affiliate partner created.');
    } catch (error: any) {
      setStatusMsg(error.message || 'Could not create affiliate partner.');
    }
  };

  const handleCreateAffiliateCampaign = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const res = await apiFetch(
        editingAffiliateCampaignId ? `/api/monetization/affiliate/campaigns/${editingAffiliateCampaignId}` : '/api/monetization/affiliate/campaigns',
        {
          method: editingAffiliateCampaignId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            ...affiliateCampaignDraft,
            startDate: new Date(affiliateCampaignDraft.startDate).toISOString(),
            endDate: new Date(affiliateCampaignDraft.endDate).toISOString(),
          }),
        },
      );
      if (!res.ok) throw new Error((await res.json()).error || 'Could not create affiliate campaign.');
      setShowAffiliateCampaignModal(false);
      setEditingAffiliateCampaignId(null);
      await fetchAffiliateData();
      setStatusMsg(editingAffiliateCampaignId ? 'Affiliate campaign updated.' : 'Affiliate campaign created.');
    } catch (error: any) {
      setStatusMsg(error.message || 'Could not create affiliate campaign.');
    }
  };

  const handleRecordConversion = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const res = await apiFetch(`/api/monetization/affiliate/campaigns/${conversionCampaignId}/conversions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...conversionDraft, commissionRevenue: Number(conversionDraft.commissionRevenue) }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Could not record conversion.');
      setConversionDraft({ externalReference: '', commissionRevenue: '', currency: 'USD' });
      await fetchAffiliateData();
      setStatusMsg('Conversion recorded as pending verification.');
    } catch (error: any) {
      setStatusMsg(error.message || 'Could not record affiliate conversion.');
    }
  };

  const setConversionReview = async (conversionId: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      const res = await apiFetch(`/api/monetization/affiliate/conversions/${conversionId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Could not review conversion.');
      await fetchAffiliateData();
      await fetchMonetizationAnalytics();
      setStatusMsg(`Conversion ${status.toLowerCase()}.`);
    } catch (error: any) {
      setStatusMsg(error.message || 'Could not review conversion.');
    }
  };

  const filteredMovies = adminMovies.filter(m => {
    if (movieFilterState !== 'ALL' && m.state !== movieFilterState) return false;
    if (movieSearch.trim()) {
      const q = movieSearch.toLowerCase().trim();
      return m.title.toLowerCase().includes(q) || m.slug.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredSeries = adminSeries.filter(s => {
    if (seriesFilterState !== 'ALL' && s.state !== seriesFilterState) return false;
    if (seriesSearch.trim()) {
      const q = seriesSearch.toLowerCase().trim();
      return s.title.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q);
    }
    return true;
  });

  const publishedMoviesCount = metrics?.publishedMovies ?? adminMovies.filter(m => m.state === 'PUBLISHED').length;
  const draftMoviesCount = metrics?.draftMovies ?? adminMovies.filter(m => m.state !== 'PUBLISHED').length;

  return (
    <div className="grid grid-cols-1 gap-4 pb-16 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-6">
      {/* Admin Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-red-950/40 p-6 rounded-2xl border border-red-900/60 lg:col-span-2">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-red-600 text-white shadow-xl shadow-red-950">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">ZIRA Admin Console</h1>
            <p className="text-xs text-red-300">Content Management System, Monetization, Cloudflare R2 Media & Platform Metrics</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('movies');
              openAddMovieModal();
            }}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg"
          >
            <Upload className="w-3.5 h-3.5" /> Upload Movie
          </button>
          <button
            onClick={() => void refreshAll()}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 border border-neutral-800"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
          </button>
        </div>
      </div>

      {statusMsg && (
        <div role="status" className="p-4 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs font-semibold flex flex-wrap items-center justify-between gap-3 lg:col-span-2">
          <span>{statusMsg}</span>
          <div className="flex items-center gap-2">
            {lastFailedUpload && (
              <button
                type="button"
                onClick={() =>
                  void uploadFileToR2(
                    lastFailedUpload.file,
                    lastFailedUpload.category,
                    lastFailedUpload.contentId,
                    {},
                    lastFailedUpload.onSuccess,
                  )
                }
                className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[11px]"
              >
                Retry Upload ({lastFailedUpload.file.name})
              </button>
            )}
            <button onClick={() => setStatusMsg('')} className="text-neutral-400 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {uploadProgress !== null && (
        <div className="p-4 rounded-xl bg-neutral-900 border border-red-800/60 text-white text-xs space-y-2 lg:col-span-2">
          <div className="flex justify-between font-semibold">
            <span>{uploadStatusText}</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
            <div className="h-full bg-red-600 transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-neutral-800 pb-2 lg:sticky lg:top-24 lg:col-start-1 lg:row-start-3 lg:flex-col lg:items-stretch lg:overflow-visible lg:border-b-0 lg:border-r lg:pr-4">
        {[
          { id: 'metrics', label: 'Dashboard & Stats', icon: BarChart3 },
          { id: 'movies', label: `Movies (${adminMovies.length})`, icon: Film },
          { id: 'series', label: `Series (${adminSeries.length})`, icon: Tv },
          { id: 'interpreters', label: `Abasobanuzi (${interpretersList.length})`, icon: Mic },
          { id: 'vip', label: 'Gura VIP & Benefits', icon: Crown },
          { id: 'users', label: `Users (${usersList.length})`, icon: UsersIcon },
          { id: 'media', label: 'Media & R2 Storage', icon: HardDrive },
          { id: 'rights', label: 'Rights Management', icon: ShieldCheck },
          { id: 'monetag', label: 'Monetag Ads', icon: Sparkles },
          { id: 'sponsors', label: 'Direct Sponsors', icon: DollarSign },
          { id: 'affiliate', label: 'Affiliate', icon: ExternalLink },
          { id: 'analytics', label: 'Revenue & Analytics', icon: BarChart3 },
          { id: 'audit', label: 'Audit Logs', icon: FileText },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`min-h-11 px-4 py-2 rounded-lg text-left text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap lg:w-full ${
                active ? 'bg-red-600 text-white shadow-lg' : 'bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: DASHBOARD & STATS */}
      {activeTab === 'metrics' && metrics && (
        <div className="space-y-6 lg:col-start-2 lg:row-start-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800 space-y-1">
              <span className="text-neutral-400 text-xs font-medium">Total Movies</span>
              <div className="text-2xl font-black text-white">{metrics.totalMovies}</div>
              <div className="text-[11px] text-neutral-400">
                <span className="text-emerald-400 font-semibold">{publishedMoviesCount} Published</span> · {draftMoviesCount} Draft/Unpublished
              </div>
            </div>
            <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800 space-y-1">
              <span className="text-neutral-400 text-xs font-medium">TV Series & Episodes</span>
              <div className="text-2xl font-black text-white">{metrics.totalSeries} Series</div>
              <div className="text-[11px] text-neutral-400">{metrics.totalEpisodes} Total Episodes</div>
            </div>
            <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800 space-y-1">
              <span className="text-neutral-400 text-xs font-medium">Total Stream Views</span>
              <div className="text-2xl font-black text-white">{metrics.totalViews.toLocaleString()}</div>
              <div className="text-[11px] text-neutral-400">{metrics.totalUsers} Account Records</div>
            </div>
            <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800 space-y-1">
              <span className="text-neutral-400 text-xs font-medium">Ad Placements</span>
              <div className="text-2xl font-black text-white">{metrics.totalPlacements ?? 8} Zones</div>
              <div className="text-[11px] text-neutral-400">
                {metrics.activePlacementsCount ?? monetagPlacements.filter(p => p.enabled).length} Monetag Active · {campaigns.filter(c => c.active).length} Sponsor Active
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 space-y-4">
              <h3 className="font-bold text-white text-sm">Monetization Impressions & Clicks</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-neutral-800">
                  <span className="text-neutral-400">Direct Sponsor Ad Impressions</span>
                  <span className="font-bold text-white">{metrics.totalSponsorImpressions}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-neutral-800">
                  <span className="text-neutral-400">Direct Sponsor Clicks</span>
                  <span className="font-bold text-emerald-400">{metrics.totalSponsorClicks}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-neutral-400">Affiliate Partner Clicks</span>
                  <span className="font-bold text-yellow-400">{metrics.totalAffiliateClicks}</span>
                </div>
              </div>
            </div>

            <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 space-y-4">
              <h3 className="font-bold text-white text-sm">Storage & Rights Verification</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-neutral-800">
                  <span className="text-neutral-400">Cloudflare R2 Storage Service</span>
                  <span className={`font-bold ${metrics.r2Configured ? 'text-emerald-400' : 'text-yellow-400'}`}>
                    {metrics.r2Configured ? 'CONFIGURED' : 'NOT CONFIGURED (Direct URL Mode Active)'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-neutral-800">
                  <span className="text-neutral-400">Pending Content Rights Verifications</span>
                  <span className="font-bold text-red-400">{metrics.pendingRightsCount} Items</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-neutral-400">Quick Actions</span>
                  <div className="flex gap-2">
                    <button onClick={() => { setActiveTab('movies'); openAddMovieModal(); }} className="px-2.5 py-1 rounded bg-red-600 text-white font-bold">+ Movie</button>
                    <button onClick={() => { setActiveTab('series'); openAddSeriesModal(); }} className="px-2.5 py-1 rounded bg-neutral-800 text-white font-bold">+ Series</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Content Activity */}
          <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-sm">Recent Content & Administrative Activity</h3>
              <button onClick={() => setActiveTab('audit')} className="text-xs text-red-400 hover:underline">View All Logs</button>
            </div>
            <div className="divide-y divide-neutral-800/60 text-xs">
              {auditLogs.slice(0, 6).map(log => (
                <div key={log.id} className="py-2 flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <span className="font-bold text-red-400">{log.action}</span>
                    <span className="text-neutral-400 ml-2">on {log.entityType}</span>
                    <span className="text-neutral-500 ml-2">by {log.adminName}</span>
                  </div>
                  <span className="font-mono text-[10px] text-neutral-500">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MOVIES CATALOG */}
      {activeTab === 'movies' && (
        <div className="space-y-4 lg:col-start-2 lg:row-start-3">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">Movie Management ({filteredMovies.length} of {adminMovies.length})</h2>
              <p className="text-xs text-neutral-400">Upload movies to Cloudflare R2, manage licensing rights, publish, archive, or delete</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openAddMovieModal}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg"
              >
                <Upload className="w-4 h-4" /> Upload Movie
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 bg-neutral-900/50 p-3 rounded-xl border border-neutral-800 text-xs">
            <input
              type="text"
              placeholder="Filter movies by title or slug…"
              value={movieSearch}
              onChange={e => setMovieSearch(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white"
            />
            <select
              value={movieFilterState}
              onChange={e => setMovieFilterState(e.target.value)}
              className="px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white"
            >
              <option value="ALL">All States</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="READY">READY</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="UPLOADED">UPLOADED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="UNPUBLISHED">UNPUBLISHED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-lg border border-neutral-800">
            <table className="w-full min-w-[860px] bg-neutral-900/60 text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] border-b border-neutral-800">
                <tr>
                  <th className="p-3">Title & Slug</th>
                  <th className="p-3">Year / Runtime</th>
                  <th className="p-3">Genres</th>
                  <th className="p-3">Rights Status</th>
                  <th className="p-3">State</th>
                  <th className="p-3">Flags</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-200">
                {filteredMovies.map(m => {
                  const rStatus = m.rights?.rightsStatus || 'OWNED';
                  return (
                    <tr key={m.id} className="hover:bg-neutral-800/30">
                      <td className="p-3 font-bold text-white flex items-center gap-2.5">
                        <img src={m.posterUrl} alt={m.title} className="w-9 h-12 object-cover rounded bg-neutral-800 shrink-0" />
                        <div>
                          <div>{m.title}</div>
                          <div className="text-[10px] text-neutral-500 font-mono">{m.slug}</div>
                          <div className="text-[10px] text-neutral-400 font-normal">
                            {m.language} · {m.maturityRating}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap">{m.releaseYear} · {m.durationMinutes}m</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {m.genres.slice(0, 3).map(g => (
                            <span key={g} className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px]">{g}</span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            rStatus === 'PENDING_VERIFICATION' || rStatus === 'EXPIRED'
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : 'bg-sky-950 text-sky-300 border border-sky-800'
                          }`}
                        >
                          {rStatus}
                        </span>
                        {m.rights?.licenseReference && (
                          <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{m.rights.licenseReference}</div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          m.state === 'PUBLISHED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : m.state === 'ARCHIVED'
                              ? 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                              : 'bg-yellow-950 text-yellow-400 border border-yellow-800'
                        }`}>
                          {m.state}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => void handleToggleMovieFlag(m, 'isFeatured')}
                            title="Toggle Featured Hero"
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              m.isFeatured ? 'bg-amber-950/80 text-amber-300 border-amber-700' : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                            }`}
                          >
                            <Star className="w-3 h-3 inline mr-0.5" /> Hero
                          </button>
                          <button
                            onClick={() => void handleToggleMovieFlag(m, 'isTrending')}
                            title="Toggle Trending"
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              m.isTrending ? 'bg-red-950/80 text-red-300 border-red-800' : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                            }`}
                          >
                            Trending
                          </button>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          {m.state !== 'PUBLISHED' ? (
                            <button
                              onClick={() => void handlePublishMovie(m.id, 'PUBLISHED')}
                              className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[10px]"
                            >
                              Publish
                            </button>
                          ) : (
                            <button
                              onClick={() => void handlePublishMovie(m.id, 'UNPUBLISHED')}
                              className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-[10px]"
                            >
                              Unpublish
                            </button>
                          )}
                          <button
                            onClick={() => openEditMovieModal(m)}
                            className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                            title={`Edit ${m.title}`}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete({ type: 'movie', id: m.id, title: m.title, mode: 'archive' })}
                            className="p-1.5 rounded bg-red-950/60 hover:bg-red-900 text-red-300"
                            title={`Delete or Archive ${m.title}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SERIES CATALOG */}
      {activeTab === 'series' && (
        <div className="space-y-4 lg:col-start-2 lg:row-start-3">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">TV Series Management ({filteredSeries.length} of {adminSeries.length})</h2>
              <p className="text-xs text-neutral-400">Create series, manage seasons and episodes, and control publication state</p>
            </div>
            <button
              onClick={openAddSeriesModal}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg"
            >
              <Plus className="w-4 h-4" /> Add New Series
            </button>
          </div>

          <div className="flex flex-wrap gap-3 bg-neutral-900/50 p-3 rounded-xl border border-neutral-800 text-xs">
            <input
              type="text"
              placeholder="Filter series by title or slug…"
              value={seriesSearch}
              onChange={e => setSeriesSearch(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white"
            />
            <select
              value={seriesFilterState}
              onChange={e => setSeriesFilterState(e.target.value)}
              className="px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white"
            >
              <option value="ALL">All States</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="UNPUBLISHED">UNPUBLISHED</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-lg border border-neutral-800">
            <table className="w-full min-w-[740px] bg-neutral-900/60 text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] border-b border-neutral-800">
                <tr>
                  <th className="p-3">Series Title</th>
                  <th className="p-3">Year</th>
                  <th className="p-3">Seasons / Episodes</th>
                  <th className="p-3">State</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-200">
                {filteredSeries.map(s => {
                  const epCount = s.seasons?.reduce((acc, sea) => acc + (sea.episodes?.length || 0), 0) || 0;
                  return (
                    <tr key={s.id} className="hover:bg-neutral-800/30">
                      <td className="p-3 font-bold text-white flex items-center gap-2.5">
                        <img src={s.posterUrl} alt={s.title} className="w-9 h-12 object-cover rounded bg-neutral-800 shrink-0" />
                        <div>
                          <div>{s.title}</div>
                          <div className="text-[10px] text-neutral-500 font-mono">{s.slug}</div>
                        </div>
                      </td>
                      <td className="p-3">{s.releaseYear}</td>
                      <td className="p-3">
                        <span className="font-semibold text-white">{s.seasons?.length || 0} Seasons</span> · {epCount} Episodes
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          s.state === 'PUBLISHED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-yellow-950 text-yellow-400 border border-yellow-800'
                        }`}>
                          {s.state}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setManagingSeries(s);
                              setEpisodeSeasonId(s.seasons?.[0]?.id || '');
                              setNewSeasonNumber(String((s.seasons?.length || 0) + 1));
                              setNewSeasonTitle(`Season ${(s.seasons?.length || 0) + 1}`);
                            }}
                            className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-[10px] flex items-center gap-1"
                          >
                            <Layers className="w-3 h-3" /> Seasons & Episodes
                          </button>
                          {s.state !== 'PUBLISHED' ? (
                            <button
                              onClick={() => void handlePublishSeries(s.id, 'PUBLISHED')}
                              className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[10px]"
                            >
                              Publish
                            </button>
                          ) : (
                            <button
                              onClick={() => void handlePublishSeries(s.id, 'UNPUBLISHED')}
                              className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-[10px]"
                            >
                              Unpublish
                            </button>
                          )}
                          <button
                            onClick={() => openEditSeriesModal(s)}
                            className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                            title={`Edit ${s.title}`}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete({ type: 'series', id: s.id, title: s.title })}
                            className="p-1.5 rounded bg-red-950/60 hover:bg-red-900 text-red-300"
                            title={`Delete ${s.title}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MEDIA & R2 STORAGE */}
      {activeTab === 'media' && (
        <div className="space-y-6 lg:col-start-2 lg:row-start-3">
          <div className="bg-neutral-900/60 p-6 rounded-2xl border border-neutral-800 space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div>
                <h2 className="text-lg font-bold text-white">Cloudflare R2 & Media Asset Library</h2>
                <p className="text-xs text-neutral-400">
                  Upload MP4 videos, posters, and thumbnails directly to Cloudflare R2 (never stored inside PostgreSQL)
                </p>
              </div>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                metrics?.r2Configured ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-amber-950 text-amber-300 border-amber-800'
              }`}>
                {metrics?.r2Configured ? 'Cloudflare R2 Connected' : 'R2 Credentials Not Set (External URL Mode)'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2 border-t border-neutral-800">
              <label className="text-neutral-300">
                Asset Category
                <select
                  value={mediaCategory}
                  onChange={e => setMediaCategory(e.target.value as any)}
                  className="mt-1 w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-white"
                >
                  <option value="movie_video">Movie Video (MP4)</option>
                  <option value="movie_poster">Movie Poster (JPG/PNG/WebP)</option>
                  <option value="series_poster">Series Poster (JPG/PNG/WebP)</option>
                  <option value="episode_video">Episode Video (MP4)</option>
                  <option value="episode_thumbnail">Episode Thumbnail (JPG/PNG/WebP)</option>
                </select>
              </label>

              <label className="text-neutral-300">
                Target Content Slug / ID
                <input
                  type="text"
                  value={mediaContentId}
                  onChange={e => setMediaContentId(e.target.value)}
                  placeholder="e.g. kigali-horizon"
                  className="mt-1 w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-white"
                />
              </label>

              <label className="text-neutral-300">
                Upload File to Cloudflare R2
                <input
                  type="file"
                  accept={mediaCategory.includes('video') ? 'video/mp4' : 'image/jpeg,image/png,image/webp'}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      void uploadFileToR2(file, mediaCategory, mediaContentId, { seasonNumber: 1, episodeNumber: 1 });
                    }
                    e.currentTarget.value = '';
                  }}
                  className="mt-1 block w-full text-xs text-neutral-300 file:mr-3 file:rounded-lg file:border-0 file:bg-red-600 file:px-3 file:py-2 file:font-bold file:text-white hover:file:bg-red-500"
                />
              </label>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                if (!externalMediaUrl.trim()) return;
                const res = await apiFetch('/api/admin/media', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ originalUrl: externalMediaUrl.trim() }),
                });
                if (res.ok) {
                  setExternalMediaUrl('');
                  await fetchMediaAssets();
                  setStatusMsg('External media reference registered.');
                }
              }}
              className="flex flex-wrap gap-2 pt-2 border-t border-neutral-800 text-xs"
            >
              <input
                type="url"
                placeholder="Or register an existing CDN / R2 / HLS stream URL (https://…)"
                value={externalMediaUrl}
                onChange={e => setExternalMediaUrl(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white"
              />
              <button type="submit" className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold">
                Register Media URL
              </button>
            </form>
          </div>

          <div className="overflow-x-auto rounded-lg border border-neutral-800">
            <table className="w-full min-w-[640px] bg-neutral-900/60 text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] border-b border-neutral-800">
                <tr>
                  <th className="p-3">Media URL</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Usage</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-200">
                {mediaAssets.map(asset => (
                  <tr key={asset.id}>
                    <td className="p-3 font-mono text-[11px] text-white break-all max-w-md">{asset.originalUrl}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold text-[10px]">{asset.status}</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${asset.inUse ? 'bg-blue-950 text-blue-300' : 'bg-neutral-800 text-neutral-400'}`}>
                        {asset.inUse ? 'Linked to Catalog' : 'Unused'}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => setConfirmDelete({ type: 'media', id: asset.id, title: asset.originalUrl })}
                        className="px-2.5 py-1 rounded bg-red-950/70 hover:bg-red-900 text-red-300 text-[10px] font-bold"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {mediaAssets.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-neutral-500">
                      No custom media assets registered yet. Uploaded posters and videos will appear here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: RIGHTS MANAGEMENT */}
      {activeTab === 'rights' && (
        <div className="space-y-4 lg:col-start-2 lg:row-start-3">
          <div className="p-4 rounded-xl bg-yellow-950/40 border border-yellow-800/60 text-yellow-300 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-yellow-400" /> Content Rights Legal Rule Active
            </div>
            <p className="text-neutral-300">
              ZIRA strictly prevents publishing content when legal rights status is <span className="font-bold text-yellow-400">PENDING VERIFICATION</span> or <span className="font-bold text-red-400">EXPIRED</span>.
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-neutral-800">
            <table className="w-full min-w-[680px] bg-neutral-900/60 text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] border-b border-neutral-800">
                <tr>
                  <th className="p-3">Content Item</th>
                  <th className="p-3">Rights Status</th>
                  <th className="p-3">Rights Holder</th>
                  <th className="p-3">License Ref</th>
                  <th className="p-3">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-200">
                {rightsList.map(r => (
                  <tr key={r.id}>
                    <td className="p-3 font-bold text-white">
                      {r.movie?.title || r.series?.title || 'Unknown Title'}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        ['OWNED', 'LICENSED', 'PERMISSION_GRANTED', 'PUBLIC_DOMAIN'].includes(r.rightsStatus)
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-red-950 text-red-400 border border-red-800'
                      }`}>
                        {r.rightsStatus}
                      </span>
                    </td>
                    <td className="p-3">{r.rightsHolder}</td>
                    <td className="p-3 font-mono text-[10px]">{r.licenseReference || 'N/A'}</td>
                    <td className="p-3">
                      <select
                        aria-label={`Rights status for ${r.movie?.title || r.series?.title || r.id}`}
                        value={r.rightsStatus}
                        onChange={e => void handleUpdateRightsStatus(r.id, e.target.value)}
                        className="rounded bg-neutral-950 border border-neutral-700 px-2 py-1 text-[11px] text-white"
                      >
                        {['OWNED', 'LICENSED', 'PERMISSION_GRANTED', 'PUBLIC_DOMAIN', 'PENDING_VERIFICATION', 'EXPIRED'].map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: DIRECT SPONSORS */}
      {activeTab === 'sponsors' && (
        <div className="space-y-6 lg:col-start-2 lg:row-start-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Direct Sponsor Campaigns</h2>
            <div className="flex gap-2">
              <button onClick={() => { setEditingSponsorId(null); setShowAddSponsorModal(true); }} className="px-3 py-2 rounded bg-neutral-800 text-white text-xs font-semibold"><Plus className="mr-1 inline h-4 w-4" /> Sponsor</button>
              <button disabled={!sponsors.length} onClick={() => { setEditingCampaignId(null); setCampaignDraft(previous => ({ ...previous, sponsorId: sponsors[0].id })); setShowCampaignModal(true); }} className="px-3 py-2 rounded bg-red-600 text-white text-xs font-semibold disabled:opacity-50"><Plus className="mr-1 inline h-4 w-4" /> Campaign</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sponsors.map(sp => (
              <div key={sp.id} className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800 space-y-2">
                <div className="flex justify-between items-center gap-2">
                  <h3 className="font-bold text-white text-sm">{sp.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${sp.active ? 'bg-emerald-950 text-emerald-400' : 'bg-neutral-800 text-neutral-400'}`}>{sp.active ? 'Active' : 'Paused'}</span>
                    <button onClick={() => { setEditingSponsorId(sp.id); setSponsorName(sp.name); setSponsorWebsite(sp.websiteUrl); setShowAddSponsorModal(true); }} aria-label={`Edit ${sp.name}`} className="rounded bg-neutral-800 px-2 py-1 text-[10px] text-white">Edit</button>
                    <button onClick={() => void updateSponsor(sp.id, { active: !sp.active })} aria-label={`${sp.active ? 'Pause' : 'Activate'} ${sp.name}`} className="rounded bg-neutral-800 px-2 py-1 text-[10px] text-neutral-300">{sp.active ? 'Pause' : 'Activate'}</button>
                  </div>
                </div>
                <p className="text-xs text-neutral-400 truncate">{sp.websiteUrl}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">Campaigns and payments</h3>
            {campaigns.map(campaign => {
              const campaignData = campaign as SponsorCampaign & { agreedPrice?: number | string; paidAmount?: number | string; outstandingAmount?: number | string };
              const impressions = campaignData.impressionsCount || 0;
              const clicks = campaignData.clicksCount || 0;
              const now = Date.now();
              const campaignStatus = !campaignData.active ? 'Paused' : new Date(campaignData.startDate).getTime() > now ? 'Scheduled' : new Date(campaignData.endDate).getTime() < now ? 'Ended' : 'Active';
              return (
                <div key={campaign.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-3 items-center border-b border-neutral-800 py-3 text-xs">
                  <div>
                    <div className="font-semibold text-white">{campaign.name}</div>
                    <div className="text-neutral-500">{campaign.placement} · {campaignStatus}</div>
                    <div className="text-neutral-500">{new Date(campaignData.startDate).toLocaleDateString()} – {new Date(campaignData.endDate).toLocaleDateString()} · Payment {campaignData.internalPaymentStatus}</div>
                    <div className="text-neutral-500">{impressions.toLocaleString()} impressions · {clicks.toLocaleString()} clicks · CTR {impressions ? ((clicks / impressions) * 100).toFixed(2) : '0.00'}%</div>
                  </div>
                  <div className="text-neutral-300">Contracted ${Number(campaignData.agreedPrice || 0).toFixed(2)}</div>
                  <div className="text-neutral-300">Paid ${Number(campaignData.paidAmount || 0).toFixed(2)} · Outstanding ${Number(campaignData.outstandingAmount ?? Number(campaignData.agreedPrice || 0) - Number(campaignData.paidAmount || 0)).toFixed(2)}</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => {
                      const creative = campaignData.creatives?.[0];
                      setCampaignDraft({
                        sponsorId: campaignData.sponsorId,
                        name: campaignData.name,
                        destinationUrl: campaignData.destinationUrl,
                        imageUrl: creative?.imageUrl || '',
                        creativeTitle: creative?.title || campaignData.name,
                        tagline: creative?.tagline || '',
                        placement: campaignData.placement,
                        startDate: new Date(campaignData.startDate).toISOString().slice(0, 16),
                        endDate: new Date(campaignData.endDate).toISOString().slice(0, 16),
                        agreedPrice: String(campaignData.agreedPrice || 0),
                      });
                      setEditingCampaignId(campaignData.id);
                      setShowCampaignModal(true);
                    }} className="rounded bg-neutral-800 px-2 py-1 text-white">Edit</button>
                    <input
                      aria-label={`Paid amount for ${campaign.name}`}
                      type="number"
                      min="0"
                      max={Number(campaignData.agreedPrice || 0)}
                      step="0.01"
                      value={paidInputs[campaign.id] ?? String(campaignData.paidAmount || 0)}
                      onChange={event => setPaidInputs(previous => ({ ...previous, [campaign.id]: event.target.value }))}
                      className="w-24 rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-white"
                    />
                    <button onClick={() => void updateSponsorCampaign(campaign.id, { paidAmount: Number(paidInputs[campaign.id] ?? campaignData.paidAmount ?? 0) })} className="rounded bg-neutral-800 px-2 py-1 text-white">Save</button>
                    <button onClick={() => void updateSponsorCampaign(campaign.id, { active: !campaignData.active })} className="rounded bg-neutral-800 px-2 py-1 text-neutral-300">{campaignData.active ? 'Pause' : 'Activate'}</button>
                  </div>
                </div>
              );
            })}
            {campaigns.length === 0 && <p className="text-xs text-neutral-500">No sponsor campaigns recorded.</p>}
          </div>
        </div>
      )}

      {/* TAB 7: MONETAG ADS */}
      {activeTab === 'monetag' && (
        <div className="space-y-4 lg:col-start-2 lg:row-start-3">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white">Monetag placements</h2>
              <p className="text-xs text-neutral-400">Reported estimated revenue: ${Number(monetagRevenue).toFixed(2)}</p>
            </div>
            <span className="text-[10px] text-amber-300">Estimate only; not verified revenue</span>
          </div>
          <p className="border-l-2 border-amber-600 pl-3 text-xs text-neutral-400">
            Use a publisher-approved single-placement in-page tag (e.g. <code className="text-neutral-200">&lt;script src="https://alwingulla.com/88/tag.min.js" data-zone="YOUR_ZONE_ID" async&gt;&lt;/script&gt;</code>). Do not use MultiTag or Onclick popunder tags. New placements remain disabled until a Zone ID and approved tag are saved.
          </p>
          {monetagPlacements.map(item => (
            <div key={item.placement} className="space-y-2 border-b border-neutral-800 py-4">
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                <div>
                  <label className="mb-1 block text-xs text-neutral-300" htmlFor={`monetag-zone-${item.placement}`}>{item.placement.replaceAll('_', ' ')} Zone ID</label>
                  <input id={`monetag-zone-${item.placement}`} value={item.zoneId} onChange={event => updateMonetagDraft(item.placement, { zoneId: event.target.value })} placeholder="e.g. 1049281" className="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-neutral-300" htmlFor={`monetag-tag-${item.placement}`}>Publisher tag snippet</label>
                  <textarea id={`monetag-tag-${item.placement}`} value={item.tagCode} onChange={event => updateMonetagDraft(item.placement, { tagCode: event.target.value })} placeholder='<script src="https://alwingulla.com/88/tag.min.js" data-zone="1049281" async></script>' rows={3} className="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 font-mono text-xs text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs text-neutral-300">
                    <input type="checkbox" checked={item.enabled} onChange={event => updateMonetagDraft(item.placement, { enabled: event.target.checked })} aria-label={`Enable Monetag ${item.placement}`} />
                    Enabled
                  </label>
                  <button onClick={() => setPreviewPlacement(previewPlacement === item.placement ? null : item.placement)} className="rounded bg-neutral-900 border border-neutral-700 px-2.5 py-2 text-xs text-neutral-300">
                    Preview
                  </button>
                  <button onClick={() => void saveMonetagPlacement(item)} className="rounded bg-red-600 hover:bg-red-500 px-3 py-2 text-xs font-bold text-white">Save</button>
                </div>
              </div>
              {previewPlacement === item.placement && (
                <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-950 p-3 text-xs text-neutral-400">
                  <div className="font-bold text-neutral-200 mb-1">Placement Preview: {item.placement}</div>
                  <div>Status: <span className={item.enabled ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{item.enabled ? 'ACTIVE' : 'DISABLED'}</span> · Zone ID: <span className="font-mono text-white">{item.zoneId || 'Not configured'}</span></div>
                  <div className="mt-1 text-[11px] text-neutral-500">Non-intrusive banner container rendered in {item.placement.replaceAll('_', ' ').toLowerCase()} slot when enabled.</div>
                </div>
              )}
            </div>
          ))}
          {monetagPlacements.length === 0 && <p className="text-xs text-neutral-500">No placement configuration is available.</p>}
        </div>
      )}

      {/* TAB 8: AFFILIATE */}
      {activeTab === 'affiliate' && (
        <div className="space-y-5 lg:col-start-2 lg:row-start-3">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h2 className="text-lg font-bold text-white">Affiliate partners and campaigns</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-emerald-300">Verified revenue: ${Number(affiliateData.verifiedRevenue || 0).toFixed(2)}</span>
              <button onClick={() => { setEditingAffiliatePartnerId(null); setAffiliatePartnerDraft({ partnerName: '', websiteUrl: '', description: '' }); setShowAffiliatePartnerModal(true); }} className="rounded bg-neutral-800 px-3 py-2 text-xs text-white"><Plus className="mr-1 inline h-4 w-4" /> Partner</button>
              <button disabled={!affiliateData.partners.length} onClick={() => { setEditingAffiliateCampaignId(null); setAffiliateCampaignDraft(previous => ({ ...previous, partnerId: affiliateData.partners[0].id })); setShowAffiliateCampaignModal(true); }} className="rounded bg-red-600 px-3 py-2 text-xs text-white disabled:opacity-50"><Plus className="mr-1 inline h-4 w-4" /> Campaign</button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {affiliateData.partners.map((partner: any) => (
              <div key={partner.id} className="flex items-center justify-between gap-2 border-b border-neutral-800 py-3">
                <div>
                  <div className="text-sm font-semibold text-white">{partner.partnerName}</div>
                  <a href={partner.websiteUrl} target="_blank" rel="noreferrer" className="text-xs text-neutral-400">{partner.websiteUrl}</a>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingAffiliatePartnerId(partner.id); setAffiliatePartnerDraft({ partnerName: partner.partnerName, websiteUrl: partner.websiteUrl, description: partner.description || '' }); setShowAffiliatePartnerModal(true); }} className="rounded bg-neutral-800 px-2 py-1 text-[10px] text-white">Edit</button>
                  <button onClick={async () => { const res = await apiFetch(`/api/monetization/affiliate/partners/${partner.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ active: !partner.active }) }); if (res.ok) void fetchAffiliateData(); else setStatusMsg((await res.json()).error || 'Could not update partner.'); }} className="rounded bg-neutral-800 px-2 py-1 text-[10px] text-neutral-300">{partner.active ? 'Pause' : 'Activate'}</button>
                </div>
              </div>
            ))}
          </div>
          {affiliateData.campaigns.map((campaign: any) => (
            <div key={campaign.id} className="border-b border-neutral-800 py-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-white">{campaign.campaignName} · {campaign.partner.partnerName}</div>
                  <div className="text-neutral-400">{campaign.placement} · {campaign.clicksCount} clicks · {!campaign.active ? 'Paused' : new Date(campaign.startDate) > new Date() ? 'Scheduled' : new Date(campaign.endDate) < new Date() ? 'Ended' : 'Active'}</div>
                  <div className="text-neutral-500">{new Date(campaign.startDate).toLocaleDateString()} – {new Date(campaign.endDate).toLocaleDateString()}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingAffiliateCampaignId(campaign.id); setAffiliateCampaignDraft({ partnerId: campaign.partnerId, campaignName: campaign.campaignName, destinationUrl: campaign.destinationUrl, trackingUrl: campaign.trackingUrl, imageUrl: campaign.imageUrl || '', placement: campaign.placement, startDate: new Date(campaign.startDate).toISOString().slice(0, 16), endDate: new Date(campaign.endDate).toISOString().slice(0, 16) }); setShowAffiliateCampaignModal(true); }} className="rounded bg-neutral-800 px-2 py-1 text-[10px] text-white">Edit</button>
                  <button onClick={async () => { const res = await apiFetch(`/api/monetization/affiliate/campaigns/${campaign.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ active: !campaign.active }) }); if (res.ok) void fetchAffiliateData(); else setStatusMsg((await res.json()).error || 'Could not update campaign.'); }} className="rounded bg-neutral-800 px-2 py-1 text-[10px] text-neutral-300">{campaign.active ? 'Pause' : 'Activate'}</button>
                </div>
              </div>
              <form onSubmit={handleRecordConversion} className="mt-3 flex flex-wrap items-end gap-2 border-b border-neutral-900 pb-3">
                <input type="hidden" value={conversionCampaignId} />
                <label className="text-neutral-400">External conversion reference<input required value={conversionDraft.externalReference} onChange={event => { setConversionCampaignId(campaign.id); setConversionDraft(previous => ({ ...previous, externalReference: event.target.value })); }} className="mt-1 block rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-white" /></label>
                <label className="text-neutral-400">Commission<input required min="0" step="0.01" type="number" value={conversionCampaignId === campaign.id ? conversionDraft.commissionRevenue : ''} onFocus={() => setConversionCampaignId(campaign.id)} onChange={event => { setConversionCampaignId(campaign.id); setConversionDraft(previous => ({ ...previous, commissionRevenue: event.target.value })); }} className="mt-1 block w-28 rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-white" /></label>
                <button type="submit" disabled={conversionCampaignId !== campaign.id} className="rounded bg-neutral-800 px-3 py-2 text-white disabled:opacity-50">Record pending</button>
              </form>
              <div className="mt-2 flex flex-wrap gap-2">
                {campaign.conversions.map((conversion: any) => (
                  <div key={conversion.id} className={`flex items-center gap-2 rounded px-2 py-1 ${conversion.status === 'VERIFIED' ? 'bg-emerald-950 text-emerald-300' : conversion.status === 'REJECTED' ? 'bg-neutral-800 text-neutral-400' : 'bg-amber-950 text-amber-300'}`}>
                    <span>{conversion.status} · {conversion.currency} {Number(conversion.commissionRevenue).toFixed(2)} · Ref {conversion.externalReference || 'missing'}</span>
                    {conversion.status === 'PENDING' && <><button onClick={() => void setConversionReview(conversion.id, 'VERIFIED')} className="font-bold underline">Verify</button><button onClick={() => void setConversionReview(conversion.id, 'REJECTED')} className="underline">Reject</button></>}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {affiliateData.campaigns.length === 0 && <p className="text-xs text-neutral-500">No affiliate campaigns recorded.</p>}
        </div>
      )}

      {/* TAB 9: REVENUE & ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-5 lg:col-start-2 lg:row-start-3">
          <h2 className="text-lg font-bold text-white">Revenue and placement analytics</h2>
          {analytics && (
            <>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 text-xs">
                <div className="border-b border-neutral-800 py-3"><div className="text-neutral-400">Monetag reported estimate</div><div className="mt-1 text-emerald-300">${Number(analytics.monetagReportedEstimatedRevenue).toFixed(2)}</div></div>
                <div className="border-b border-neutral-800 py-3"><div className="text-neutral-400">Sponsor contracted</div><div className="mt-1 text-white">${Number(analytics.sponsorContractedRevenue).toFixed(2)}</div></div>
                <div className="border-b border-neutral-800 py-3"><div className="text-neutral-400">Sponsor paid</div><div className="mt-1 text-white">${Number(analytics.sponsorPaidRevenue).toFixed(2)}</div></div>
                <div className="border-b border-neutral-800 py-3"><div className="text-neutral-400">Sponsor outstanding</div><div className="mt-1 text-amber-300">${Number(analytics.sponsorOutstandingRevenue).toFixed(2)}</div></div>
                <div className="border-b border-neutral-800 py-3"><div className="text-neutral-400">Affiliate verified</div><div className="mt-1 text-emerald-300">${Number(analytics.affiliateVerifiedRevenue).toFixed(2)}</div></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-neutral-800 text-neutral-400"><tr><th className="py-2">Placement</th><th>Impressions</th><th>Clicks</th><th>CTR</th></tr></thead>
                  <tbody>{analytics.placementPerformance.map((row: any) => <tr key={row.placement} className="border-b border-neutral-900"><td className="py-2 text-neutral-200">{row.placement}</td><td>{row.impressions}</td><td>{row.clicks}</td><td>{Number(row.ctr).toFixed(2)}%</td></tr>)}</tbody>
                </table>
              </div>
            </>
          )}
          {!analytics && <p className="text-xs text-neutral-500">Analytics are unavailable.</p>}
        </div>
      )}

      {/* TAB 10: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="overflow-x-auto rounded-lg border border-neutral-800 lg:col-start-2 lg:row-start-3">
          <table className="w-full min-w-[620px] bg-neutral-900/60 text-left text-xs">
            <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] border-b border-neutral-800">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Admin</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-200">
              {auditLogs.map(log => (
                <tr key={log.id}>
                  <td className="p-3 font-mono text-[10px] text-neutral-400">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="p-3 font-bold text-white">{log.adminName}</td>
                  <td className="p-3 font-bold text-red-400">{log.action}</td>
                  <td className="p-3 text-neutral-400">{log.entityType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: ABASOBANUZI (INTERPRETERS MANAGEMENT) */}
      {activeTab === 'interpreters' && (
        <div className="space-y-6 lg:col-start-2 lg:row-start-3 text-xs">
          <div className="bg-neutral-900/60 p-6 rounded-2xl border border-neutral-800 space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Mic className="w-5 h-5 text-amber-400" /> Abasobanuzi (Interpreter Profiles Management)
                </h2>
                <p className="text-xs text-neutral-400">
                  Create and manage interpreter profiles, biographies, social links, and featured status.
                </p>
              </div>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                if (!interpreterDraft.displayName.trim()) return;
                const endpoint = editingInterpreterSlug
                  ? `/api/interpreters/${editingInterpreterSlug}`
                  : '/api/interpreters';
                const method = editingInterpreterSlug ? 'PATCH' : 'POST';
                const res = await apiFetch(endpoint, {
                  method,
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    displayName: interpreterDraft.displayName.trim(),
                    slug: interpreterDraft.slug.trim() || undefined,
                    photoUrl: interpreterDraft.photoUrl.trim() || undefined,
                    biography: interpreterDraft.biography.trim() || undefined,
                    specialtyGenres: interpreterDraft.specialtyGenres
                      .split(',')
                      .map(s => s.trim())
                      .filter(Boolean),
                    socialLinks: {
                      youtube: interpreterDraft.youtubeUrl.trim() || undefined,
                      instagram: interpreterDraft.instagramUrl.trim() || undefined,
                    },
                    isFeatured: interpreterDraft.isFeatured,
                    isExampleProfile: interpreterDraft.isExampleProfile,
                    active: interpreterDraft.active,
                  }),
                });
                const data = await res.json();
                if (!res.ok) {
                  setStatusMsg(data.error || 'Could not save interpreter.');
                  return;
                }
                setEditingInterpreterSlug(null);
                setInterpreterDraft({
                  displayName: '',
                  slug: '',
                  photoUrl: '',
                  biography: '',
                  specialtyGenres: 'action, drama',
                  youtubeUrl: '',
                  instagramUrl: '',
                  isFeatured: true,
                  isExampleProfile: false,
                  active: true,
                });
                await refreshAll();
                setStatusMsg(
                  editingInterpreterSlug
                    ? `Updated interpreter "${data.interpreter?.displayName}".`
                    : `Created interpreter "${data.interpreter?.displayName}".`,
                );
              }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-neutral-800"
            >
              <div>
                <label className="block text-neutral-300 mb-1">Display Name *</label>
                <input
                  required
                  type="text"
                  value={interpreterDraft.displayName}
                  onChange={e => setInterpreterDraft(p => ({ ...p, displayName: e.target.value }))}
                  placeholder="e.g. Rocky"
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-300 mb-1">Slug (Optional)</label>
                <input
                  type="text"
                  value={interpreterDraft.slug}
                  onChange={e => setInterpreterDraft(p => ({ ...p, slug: e.target.value }))}
                  placeholder="e.g. rocky"
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-neutral-300 mb-1">Profile Photo URL (Optional)</label>
                <input
                  type="text"
                  value={interpreterDraft.photoUrl}
                  onChange={e => setInterpreterDraft(p => ({ ...p, photoUrl: e.target.value }))}
                  placeholder="https://... or auto-generated avatar"
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-neutral-300 mb-1">Biography</label>
                <input
                  type="text"
                  value={interpreterDraft.biography}
                  onChange={e => setInterpreterDraft(p => ({ ...p, biography: e.target.value }))}
                  placeholder="Short biography and narration style..."
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-300 mb-1">Specialty Genres (comma-separated)</label>
                <input
                  type="text"
                  value={interpreterDraft.specialtyGenres}
                  onChange={e => setInterpreterDraft(p => ({ ...p, specialtyGenres: e.target.value }))}
                  placeholder="action, drama, fantasy"
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white"
                />
              </div>
              <div className="sm:col-span-3 flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-neutral-300">
                    <input
                      type="checkbox"
                      checked={interpreterDraft.isFeatured}
                      onChange={e => setInterpreterDraft(p => ({ ...p, isFeatured: e.target.checked }))}
                    />
                    Featured Interpreter
                  </label>
                  <label className="flex items-center gap-2 text-neutral-300">
                    <input
                      type="checkbox"
                      checked={interpreterDraft.active}
                      onChange={e => setInterpreterDraft(p => ({ ...p, active: e.target.checked }))}
                    />
                    Active on Public Catalog
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  {editingInterpreterSlug && (
                    <button
                      type="button"
                      onClick={() => setEditingInterpreterSlug(null)}
                      className="px-3 py-2 rounded-lg bg-neutral-800 text-neutral-300"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black"
                  >
                    {editingInterpreterSlug ? 'Update Interpreter' : '+ Save Interpreter'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="overflow-x-auto rounded-xl border border-neutral-800">
            <table className="w-full min-w-[680px] bg-neutral-900/60 text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] border-b border-neutral-800">
                <tr>
                  <th className="p-3">Interpreter</th>
                  <th className="p-3">Genres</th>
                  <th className="p-3">Movies / Series</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-200">
                {interpretersList.map(interp => (
                  <tr key={interp.id}>
                    <td className="p-3 flex items-center gap-3">
                      <img src={interp.photoUrl} alt={interp.displayName} className="w-10 h-10 rounded-full object-cover border border-amber-500/40" />
                      <div>
                        <div className="font-bold text-white">{interp.displayName}</div>
                        <div className="text-[10px] font-mono text-neutral-500">{interp.slug}</div>
                      </div>
                    </td>
                    <td className="p-3">{interp.specialtyGenres?.join(', ')}</td>
                    <td className="p-3">
                      <span className="font-bold text-amber-400">{interp.movieCount ?? 0} Movies</span> ·{' '}
                      <span className="font-bold text-indigo-400">{interp.seriesCount ?? 0} Series</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          interp.active ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {interp.active ? 'ACTIVE' : 'HIDDEN'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingInterpreterSlug(interp.slug);
                            setInterpreterDraft({
                              displayName: interp.displayName,
                              slug: interp.slug,
                              photoUrl: interp.photoUrl,
                              biography: interp.biography,
                              specialtyGenres: interp.specialtyGenres?.join(', ') || 'action, drama',
                              youtubeUrl: interp.socialLinks?.youtube || '',
                              instagramUrl: interp.socialLinks?.instagram || '',
                              isFeatured: interp.isFeatured,
                              isExampleProfile: interp.isExampleProfile,
                              active: interp.active,
                            });
                          }}
                          className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: VIP PLANS & BENEFITS CONFIGURATION */}
      {activeTab === 'vip' && vipConfig && (
        <div className="space-y-6 lg:col-start-2 lg:row-start-3 text-xs">
          <div className="bg-neutral-900/60 p-6 rounded-2xl border border-neutral-800 space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" /> Gura VIP — Plans &amp; Configurable Benefits
                </h2>
                <p className="text-xs text-neutral-400">
                  Enable or disable individual VIP benefits, configure plan prices/durations, and control VIP ad reduction. Regular users always retain free streaming access.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const res = await apiFetch('/api/vip/config', {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(vipConfig),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    setVipConfig(data.config);
                    setStatusMsg('VIP plans and benefits configuration saved.');
                    onRefreshData();
                  } else {
                    setStatusMsg(data.error || 'Could not save VIP config.');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs"
              >
                Save VIP Configuration
              </button>
            </div>

            <div className="flex flex-wrap gap-6 pt-3 border-t border-neutral-800">
              <label className="flex items-center gap-2 text-neutral-200 font-semibold">
                <input
                  type="checkbox"
                  checked={vipConfig.adFreeForVip}
                  onChange={e => setVipConfig({ ...vipConfig, adFreeForVip: e.target.checked })}
                />
                Ad-Free Experience for VIP Members
              </label>
              <label className="flex items-center gap-2 text-neutral-200 font-semibold">
                <input
                  type="checkbox"
                  checked={vipConfig.reducedAdsForVip}
                  onChange={e => setVipConfig({ ...vipConfig, reducedAdsForVip: e.target.checked })}
                />
                Reduced Advertising Option for VIP Members
              </label>
            </div>

            {/* Individual VIP Benefits Toggles */}
            <div className="space-y-2 pt-3 border-t border-neutral-800">
              <h3 className="font-bold text-white">Configurable VIP Benefits</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {vipConfig.benefits.map((benefit, idx) => (
                  <div key={benefit.id} className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <input
                        type="text"
                        value={benefit.title}
                        onChange={e => {
                          const next = [...vipConfig.benefits];
                          next[idx] = { ...benefit, title: e.target.value };
                          setVipConfig({ ...vipConfig, benefits: next });
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 font-bold text-white"
                      />
                      <p className="text-[11px] text-neutral-400">{benefit.description}</p>
                    </div>
                    <label className="flex items-center gap-1.5 text-amber-400 font-bold shrink-0">
                      <input
                        type="checkbox"
                        checked={benefit.enabled}
                        onChange={e => {
                          const next = [...vipConfig.benefits];
                          next[idx] = { ...benefit, enabled: e.target.checked };
                          setVipConfig({ ...vipConfig, benefits: next });
                        }}
                      />
                      Enabled
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* VIP Plans Editor */}
            <div className="space-y-2 pt-3 border-t border-neutral-800">
              <h3 className="font-bold text-white">VIP Plan Prices &amp; Durations</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {vipConfig.plans.map((plan, idx) => (
                  <div key={plan.id} className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400">{plan.name}</span>
                      <label className="flex items-center gap-1 text-[11px] text-neutral-300">
                        <input
                          type="checkbox"
                          checked={plan.active}
                          onChange={e => {
                            const next = [...vipConfig.plans];
                            next[idx] = { ...plan, active: e.target.checked };
                            setVipConfig({ ...vipConfig, plans: next });
                          }}
                        />
                        Active
                      </label>
                    </div>
                    <div>
                      <label className="block text-neutral-400 text-[10px]">Plan Name (Kinyarwanda)</label>
                      <input
                        type="text"
                        value={plan.nameRw}
                        onChange={e => {
                          const next = [...vipConfig.plans];
                          next[idx] = { ...plan, nameRw: e.target.value };
                          setVipConfig({ ...vipConfig, plans: next });
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-white mt-0.5"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-neutral-400 text-[10px]">Price (RWF)</label>
                        <input
                          type="number"
                          value={plan.priceRwf}
                          onChange={e => {
                            const next = [...vipConfig.plans];
                            next[idx] = { ...plan, priceRwf: Number(e.target.value) };
                            setVipConfig({ ...vipConfig, plans: next });
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-white mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="block text-neutral-400 text-[10px]">Duration (Days)</label>
                        <input
                          type="number"
                          value={plan.durationDays}
                          onChange={e => {
                            const next = [...vipConfig.plans];
                            next[idx] = { ...plan, durationDays: Number(e.target.value) };
                            setVipConfig({ ...vipConfig, plans: next });
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-white mt-0.5"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: USER ACCOUNTS & ROLES */}
      {activeTab === 'users' && (
        <div className="space-y-4 lg:col-start-2 lg:row-start-3 text-xs">
          <div>
            <h2 className="text-lg font-bold text-white">User Accounts &amp; Role Permissions ({usersList.length})</h2>
            <p className="text-xs text-neutral-400">Manage registered accounts and administrator/editor roles</p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-neutral-800">
            <table className="w-full min-w-[640px] bg-neutral-900/60 text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] border-b border-neutral-800">
                <tr>
                  <th className="p-3">Display Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-200">
                {usersList.map(u => (
                  <tr key={u.id}>
                    <td className="p-3 font-bold text-white">{u.displayName}</td>
                    <td className="p-3 font-mono text-neutral-300">{u.email}</td>
                    <td className="p-3">
                      <select
                        value={u.role}
                        onChange={async e => {
                          const role = e.target.value;
                          const res = await apiFetch(`/api/admin/users/${u.id}/role`, {
                            method: 'PATCH',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ role }),
                          });
                          const data = await res.json();
                          if (res.ok) {
                            await fetchUsersData();
                            setStatusMsg(`Updated role for ${u.email} to ${role}.`);
                          } else {
                            setStatusMsg(data.error || 'Could not update role.');
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-neutral-950 border border-neutral-800 text-white font-bold"
                      >
                        <option value="USER">USER</option>
                        <option value="EDITOR">EDITOR</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      </select>
                    </td>
                    <td className="p-3 text-neutral-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* UPLOAD / EDIT MOVIE MODAL */}
      {showMovieModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-3xl space-y-5 overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{editingMovieId ? 'Edit Movie & Media' : 'Upload New Movie'}</h3>
                <p className="text-xs text-neutral-400">Complete metadata, Cloudflare R2 media uploads, and licensing verification</p>
              </div>
              <button onClick={() => setShowMovieModal(false)} className="text-neutral-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveMovie} className="space-y-5 text-xs">
              {/* SECTION A: MOVIE INFORMATION */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <Film className="w-4 h-4 text-red-500" /> A. Movie Information
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-neutral-300 block mb-1">Movie Title *</label>
                    <input
                      required
                      type="text"
                      value={movieDraft.title}
                      onChange={e => {
                        const title = e.target.value;
                        const autoSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                        setMovieDraft(prev => ({
                          ...prev,
                          title,
                          slug: !editingMovieId && (!prev.slug || prev.slug === prev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) ? autoSlug : prev.slug,
                        }));
                      }}
                      placeholder="e.g. Big Buck Bunny"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-300 block mb-1">URL Slug</label>
                    <input
                      type="text"
                      value={movieDraft.slug}
                      onChange={e => setMovieDraft(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="auto-generated-from-title"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-neutral-300 block mb-1">Synopsis / Description *</label>
                    <textarea
                      required
                      value={movieDraft.description}
                      onChange={e => setMovieDraft(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white h-20"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-300 block mb-1">Release Year *</label>
                    <input
                      required
                      type="number"
                      min="1900"
                      max="2100"
                      value={movieDraft.releaseYear}
                      onChange={e => setMovieDraft(prev => ({ ...prev, releaseYear: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-300 block mb-1">Runtime (Minutes) *</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={movieDraft.durationMinutes}
                      onChange={e => setMovieDraft(prev => ({ ...prev, durationMinutes: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-300 block mb-1">Language</label>
                    <input
                      type="text"
                      value={movieDraft.language}
                      onChange={e => setMovieDraft(prev => ({ ...prev, language: e.target.value }))}
                      placeholder="English, Kinyarwanda, French"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-300 block mb-1">Country / Allowed Territories</label>
                    <input
                      type="text"
                      value={movieDraft.country}
                      onChange={e => setMovieDraft(prev => ({ ...prev, country: e.target.value }))}
                      placeholder="GLOBAL, RW"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-300 block mb-1">Age / Maturity Rating</label>
                    <select
                      value={movieDraft.maturityRating}
                      onChange={e => setMovieDraft(prev => ({ ...prev, maturityRating: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white"
                    >
                      <option value="G">G (All Ages)</option>
                      <option value="PG">PG</option>
                      <option value="PG-13">PG-13</option>
                      <option value="16+">16+</option>
                      <option value="R">R / 18+</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-neutral-300 block mb-1">Publication State</label>
                    <select
                      value={movieDraft.state}
                      onChange={e => setMovieDraft(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white"
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="UPLOADED">UPLOADED</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="READY">READY</option>
                      <option value="PUBLISHED">PUBLISHED</option>
                      <option value="UNPUBLISHED">UNPUBLISHED</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-neutral-300 block mb-1">Umusobanuzi (Interpreter)</label>
                    <select
                      value={movieDraft.interpreterSlug}
                      onChange={e => setMovieDraft(prev => ({ ...prev, interpreterSlug: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white"
                    >
                      <option value="">None / Original Audio Only</option>
                      {interpretersList.map(interp => (
                        <option key={interp.id} value={interp.slug}>
                          {interp.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-neutral-300 block mb-1">Card Indicator Badge</label>
                    <select
                      value={movieDraft.badgeIndicator}
                      onChange={e => setMovieDraft(prev => ({ ...prev, badgeIndicator: e.target.value as any }))}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white"
                    >
                      <option value="NEW">NEW</option>
                      <option value="UPDATED">UPDATED</option>
                      <option value="">None</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-neutral-300 block mb-1">Genres & Categories</label>
                    <div className="flex flex-wrap gap-1.5">
                      {AVAILABLE_GENRES.map(g => {
                        const selected = movieDraft.genres.includes(g);
                        return (
                          <button
                            type="button"
                            key={g}
                            onClick={() =>
                              setMovieDraft(prev => ({
                                ...prev,
                                genres: selected ? prev.genres.filter(item => item !== g) : [...prev.genres, g],
                              }))
                            }
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                              selected ? 'bg-red-600 text-white border-red-500' : 'bg-neutral-900 text-neutral-400 border-neutral-700'
                            }`}
                          >
                            {g}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex flex-wrap gap-4 pt-1">
                    <label className="flex items-center gap-2 text-neutral-300">
                      <input type="checkbox" checked={movieDraft.isFeatured} onChange={e => setMovieDraft(prev => ({ ...prev, isFeatured: e.target.checked }))} />
                      Featured on Homepage Hero
                    </label>
                    <label className="flex items-center gap-2 text-neutral-300">
                      <input type="checkbox" checked={movieDraft.isTrending} onChange={e => setMovieDraft(prev => ({ ...prev, isTrending: e.target.checked }))} />
                      Trending Rail
                    </label>
                    <label className="flex items-center gap-2 text-neutral-300">
                      <input type="checkbox" checked={movieDraft.isRwandanContent} onChange={e => setMovieDraft(prev => ({ ...prev, isRwandanContent: e.target.checked }))} />
                      Rwandan Cinema
                    </label>
                    <label className="flex items-center gap-2 text-neutral-300">
                      <input type="checkbox" checked={movieDraft.isAfricanContent} onChange={e => setMovieDraft(prev => ({ ...prev, isAfricanContent: e.target.checked }))} />
                      African Cinema
                    </label>
                  </div>
                </div>
              </div>

              {/* SECTION B: UPLOAD MOVIE IMAGES TO CLOUDFLARE R2 */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <Upload className="w-4 h-4 text-red-500" /> B. Movie Poster & Backdrop Images (Cloudflare R2)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-neutral-300 block">Poster Image (Vertical 2:3 — JPEG, PNG, WebP)</label>
                    <input
                      type="text"
                      value={movieDraft.posterUrl}
                      onChange={e => setMovieDraft(prev => ({ ...prev, posterUrl: e.target.value }))}
                      placeholder="https://… or upload file below"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white"
                    />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={async e => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const targetId = editingMovieId || movieDraft.slug || movieDraft.title || 'movie';
                          await uploadFileToR2(f, 'movie_poster', targetId, {}, url => {
                            setMovieDraft(prev => ({ ...prev, posterUrl: url, backdropUrl: prev.backdropUrl || url }));
                          });
                        }
                      }}
                      className="block w-full text-[11px] text-neutral-400 file:mr-2 file:rounded file:border-0 file:bg-neutral-800 file:px-2.5 file:py-1 file:text-white"
                    />
                    {movieDraft.posterUrl && (
                      <div className="pt-1 flex items-center gap-2">
                        <img src={movieDraft.posterUrl} alt="Poster preview" className="w-12 h-16 object-cover rounded border border-neutral-700" />
                        <span className="text-[10px] text-emerald-400">Poster preview ready</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-neutral-300 block">Backdrop / Hero Banner Image (16:9 — JPEG, PNG, WebP)</label>
                    <input
                      type="text"
                      value={movieDraft.backdropUrl}
                      onChange={e => setMovieDraft(prev => ({ ...prev, backdropUrl: e.target.value }))}
                      placeholder="https://… or upload file below"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white"
                    />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={async e => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const targetId = editingMovieId || movieDraft.slug || movieDraft.title || 'movie';
                          await uploadFileToR2(f, 'movie_backdrop', targetId, {}, url => {
                            setMovieDraft(prev => ({ ...prev, backdropUrl: url }));
                          });
                        }
                      }}
                      className="block w-full text-[11px] text-neutral-400 file:mr-2 file:rounded file:border-0 file:bg-neutral-800 file:px-2.5 file:py-1 file:text-white"
                    />
                    {movieDraft.backdropUrl && (
                      <div className="pt-1 flex items-center gap-2">
                        <img src={movieDraft.backdropUrl} alt="Backdrop preview" className="w-24 h-14 object-cover rounded border border-neutral-700" />
                        <span className="text-[10px] text-emerald-400">Backdrop preview ready</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION C: UPLOAD MOVIE VIDEO & SUBTITLES TO CLOUDFLARE R2 */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-red-500" /> C. Video Stream & Subtitles (Cloudflare R2 Object Storage)
                </div>
                <p className="text-[11px] text-neutral-400">
                  Cloudflare R2 stores and serves original MP4 streams directly (<span className="text-neutral-200 font-semibold">READY</span> upon upload). R2 does not automatically transcode HLS renditions unless an external transcoding pipeline is attached.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-neutral-300 block">Primary Movie Video Stream (MP4)</label>
                    <input
                      type="text"
                      value={movieDraft.videoUrl}
                      onChange={e => setMovieDraft(prev => ({ ...prev, videoUrl: e.target.value }))}
                      placeholder="https://… or upload MP4 below"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white"
                    />
                    <input
                      type="file"
                      accept="video/mp4"
                      onChange={async e => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const targetId = editingMovieId || movieDraft.slug || movieDraft.title || 'movie';
                          await uploadFileToR2(f, 'movie_video', targetId, {}, url => {
                            setMovieDraft(prev => ({
                              ...prev,
                              videoUrl: url,
                              trailerUrl: prev.trailerUrl || url,
                              state: prev.state === 'DRAFT' ? 'READY' : prev.state,
                            }));
                          });
                        }
                      }}
                      className="block w-full text-[11px] text-neutral-400 file:mr-2 file:rounded file:border-0 file:bg-neutral-800 file:px-2.5 file:py-1 file:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-300 block">Trailer Video URL (Optional MP4)</label>
                    <input
                      type="text"
                      value={movieDraft.trailerUrl}
                      onChange={e => setMovieDraft(prev => ({ ...prev, trailerUrl: e.target.value }))}
                      placeholder="https://…"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white"
                    />
                    <input
                      type="file"
                      accept="video/mp4"
                      onChange={async e => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const targetId = editingMovieId || movieDraft.slug || movieDraft.title || 'movie';
                          await uploadFileToR2(f, 'movie_trailer', targetId, {}, url => {
                            setMovieDraft(prev => ({ ...prev, trailerUrl: url }));
                          });
                        }
                      }}
                      className="block w-full text-[11px] text-neutral-400 file:mr-2 file:rounded file:border-0 file:bg-neutral-800 file:px-2.5 file:py-1 file:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-300 block mb-1">Subtitle Languages Available (comma-separated)</label>
                    <input
                      type="text"
                      value={movieDraft.subtitlesAvailable}
                      onChange={e => setMovieDraft(prev => ({ ...prev, subtitlesAvailable: e.target.value }))}
                      placeholder="en, rw, fr"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-300 block mb-1">Upload Subtitle Track (.vtt / .srt to R2)</label>
                    <input
                      type="file"
                      accept=".vtt,.srt,text/vtt,application/x-subrip,text/plain"
                      onChange={async e => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const targetId = editingMovieId || movieDraft.slug || movieDraft.title || 'movie';
                          await uploadFileToR2(f, 'movie_subtitle', targetId, {}, url => {
                            setMovieDraft(prev => ({ ...prev, subtitleUrl: url }));
                          });
                        }
                      }}
                      className="block w-full text-[11px] text-neutral-400 file:mr-2 file:rounded file:border-0 file:bg-neutral-800 file:px-2.5 file:py-1 file:text-white"
                    />
                    {movieDraft.subtitleUrl && (
                      <div className="text-[10px] text-emerald-400 mt-1 truncate">Subtitle uploaded: {movieDraft.subtitleUrl}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION D: MOVIE RIGHTS & LICENSING */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-red-500" /> D. Movie Rights & Licensing Verification
                </div>
                <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 text-[11px] leading-relaxed">
                  <strong className="text-amber-400">Important Legal Distinction:</strong> An interpreter’s permission to use their Kinyarwanda narration does <span className="underline font-bold">not</span> grant permission to redistribute the underlying film unless original film rights are verified (<span className="font-mono">OWNED</span>, <span className="font-mono">LICENSED</span>, <span className="font-mono">PERMISSION_GRANTED</span>, or <span className="font-mono">PUBLIC_DOMAIN</span>).
                </div>
                {(movieDraft.rightsStatus === 'PENDING_VERIFICATION' || movieDraft.rightsStatus === 'EXPIRED') && (
                  <div className="p-3 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-200 text-[11px]">
                    Movies with <span className="font-bold">{movieDraft.rightsStatus}</span> rights cannot be published to the public catalog until rights are verified (<span className="font-mono">OWNED</span>, <span className="font-mono">LICENSED</span>, <span className="font-mono">PERMISSION_GRANTED</span>, or <span className="font-mono">PUBLIC_DOMAIN</span>). Save as <span className="font-bold">DRAFT</span> while verification is pending.
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-neutral-300 block mb-1">Rights Owner / Studio *</label>
                    <input
                      required
                      type="text"
                      value={movieDraft.rightsHolder}
                      onChange={e => setMovieDraft(prev => ({ ...prev, rightsHolder: e.target.value }))}
                      placeholder="e.g. Blender Foundation (CC-BY 3.0)"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-300 block mb-1">License / Permission Reference</label>
                    <input
                      type="text"
                      value={movieDraft.licenseReference}
                      onChange={e => setMovieDraft(prev => ({ ...prev, licenseReference: e.target.value }))}
                      placeholder="e.g. CC-BY-3.0-BLENDER-2008 or Contract #ZIRA-104"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-300 block mb-1">Rights Verification Status</label>
                    <select
                      value={movieDraft.rightsStatus}
                      onChange={e => {
                        const status = e.target.value;
                        setMovieDraft(prev => ({
                          ...prev,
                          rightsStatus: status,
                          state:
                            (status === 'PENDING_VERIFICATION' || status === 'EXPIRED') && prev.state === 'PUBLISHED'
                              ? 'DRAFT'
                              : prev.state,
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white"
                    >
                      <option value="OWNED">OWNED</option>
                      <option value="LICENSED">LICENSED</option>
                      <option value="PERMISSION_GRANTED">PERMISSION_GRANTED</option>
                      <option value="PUBLIC_DOMAIN">PUBLIC_DOMAIN</option>
                      <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                      <option value="EXPIRED">EXPIRED</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-neutral-300 block mb-1">Rights Expiry Date (Optional)</label>
                    <input
                      type="date"
                      value={movieDraft.rightsEndDate}
                      onChange={e => setMovieDraft(prev => ({ ...prev, rightsEndDate: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowMovieModal(false)} className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold">
                  {editingMovieId ? 'Save Movie Changes' : 'Save & Create Movie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT SERIES MODAL */}
      {showSeriesModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">{editingSeriesId ? 'Edit TV Series' : 'Add New TV Series'}</h3>
              <button onClick={() => setShowSeriesModal(false)} className="text-neutral-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveSeries} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="text-neutral-300 block mb-1">Series Title</label>
                <input required type="text" value={seriesDraft.title} onChange={e => setSeriesDraft(prev => ({ ...prev, title: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-neutral-300 block mb-1">Description</label>
                <textarea required value={seriesDraft.description} onChange={e => setSeriesDraft(prev => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white h-20" />
              </div>
              <div>
                <label className="text-neutral-300 block mb-1">Release Year</label>
                <input type="number" value={seriesDraft.releaseYear} onChange={e => setSeriesDraft(prev => ({ ...prev, releaseYear: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-neutral-300 block mb-1">Language</label>
                <input type="text" value={seriesDraft.language} onChange={e => setSeriesDraft(prev => ({ ...prev, language: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-neutral-300 block mb-1">Genres & Categories</label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_GENRES.map(g => {
                    const selected = seriesDraft.genres.includes(g);
                    return (
                      <button
                        type="button"
                        key={g}
                        onClick={() =>
                          setSeriesDraft(prev => ({
                            ...prev,
                            genres: selected ? prev.genres.filter(item => item !== g) : [...prev.genres, g],
                          }))
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                          selected ? 'bg-red-600 text-white border-red-500' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-neutral-300 block mb-1">Poster Image URL</label>
                <input type="text" value={seriesDraft.posterUrl} onChange={e => setSeriesDraft(prev => ({ ...prev, posterUrl: e.target.value }))} placeholder="https://…" className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-neutral-300 block mb-1">Publication State</label>
                <select value={seriesDraft.state} onChange={e => setSeriesDraft(prev => ({ ...prev, state: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="UNPUBLISHED">UNPUBLISHED</option>
                </select>
              </div>
              <div className="sm:col-span-2 flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 text-neutral-300">
                  <input type="checkbox" checked={seriesDraft.isFeatured} onChange={e => setSeriesDraft(prev => ({ ...prev, isFeatured: e.target.checked }))} />
                  Featured Series
                </label>
                <label className="flex items-center gap-2 text-neutral-300">
                  <input type="checkbox" checked={seriesDraft.isTrending} onChange={e => setSeriesDraft(prev => ({ ...prev, isTrending: e.target.checked }))} />
                  Trending Series
                </label>
                <label className="flex items-center gap-2 text-neutral-300">
                  <input type="checkbox" checked={seriesDraft.isRwandanContent} onChange={e => setSeriesDraft(prev => ({ ...prev, isRwandanContent: e.target.checked }))} />
                  Rwanda & East African Series
                </label>
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowSeriesModal(false)} className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold">{editingSeriesId ? 'Save Series' : 'Create Series'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SEASONS & EPISODES MANAGER MODAL */}
      {managingSeries && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-4xl space-y-5 overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-xs">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Seasons & Episodes — {managingSeries.title}</h3>
                <p className="text-neutral-400">Add seasons, upload episode videos & thumbnails, and manage episode order</p>
              </div>
              <button onClick={() => setManagingSeries(null)} className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {/* Add Season Form */}
            <form onSubmit={handleAddSeason} className="flex flex-wrap items-end gap-3 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
              <div>
                <label className="block text-neutral-400 mb-1">Season #</label>
                <input type="number" min="1" required value={newSeasonNumber} onChange={e => setNewSeasonNumber(e.target.value)} className="w-24 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white" />
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="block text-neutral-400 mb-1">Season Title</label>
                <input type="text" required value={newSeasonTitle} onChange={e => setNewSeasonTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white" />
              </div>
              <button type="submit" className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold">
                + Add Season
              </button>
            </form>

            {/* Add / Edit Episode Form */}
            <form onSubmit={handleSaveEpisode} className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
              <div className="sm:col-span-3 font-bold text-white">
                {editingEpisode ? `Editing Episode: ${editingEpisode.title}` : 'Add Episode to Season'}
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">Season</label>
                <select
                  value={episodeSeasonId || managingSeries.seasons?.[0]?.id || ''}
                  onChange={e => setEpisodeSeasonId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white"
                >
                  {managingSeries.seasons?.map(sea => (
                    <option key={sea.id} value={sea.id}>Season {sea.seasonNumber}: {sea.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">Episode #</label>
                <input type="number" min="1" required value={episodeDraft.episodeNumber} onChange={e => setEpisodeDraft(prev => ({ ...prev, episodeNumber: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">Duration (Mins)</label>
                <input type="number" min="1" required value={episodeDraft.durationMinutes} onChange={e => setEpisodeDraft(prev => ({ ...prev, durationMinutes: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-neutral-400 mb-1">Episode Title</label>
                <input type="text" required value={episodeDraft.title} onChange={e => setEpisodeDraft(prev => ({ ...prev, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">Thumbnail URL</label>
                <input type="text" value={episodeDraft.thumbnailUrl} onChange={e => setEpisodeDraft(prev => ({ ...prev, thumbnailUrl: e.target.value }))} placeholder="https://…" className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-neutral-400 mb-1">Episode Description</label>
                <input type="text" required value={episodeDraft.description} onChange={e => setEpisodeDraft(prev => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">Video Stream URL (MP4/HLS)</label>
                <input type="text" value={episodeDraft.videoUrl} onChange={e => setEpisodeDraft(prev => ({ ...prev, videoUrl: e.target.value }))} placeholder="https://…" className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white" />
              </div>
              <div className="sm:col-span-3 flex justify-end gap-2">
                {editingEpisode && (
                  <button type="button" onClick={() => setEditingEpisode(null)} className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300">
                    Cancel Edit
                  </button>
                )}
                <button type="submit" className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold">
                  {editingEpisode ? 'Update Episode' : '+ Add Episode'}
                </button>
              </div>
            </form>

            {/* Existing Seasons & Episodes */}
            <div className="space-y-4">
              {managingSeries.seasons?.map(sea => (
                <div key={sea.id} className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                    <div className="font-bold text-white">Season {sea.seasonNumber}: {sea.title} ({sea.episodes?.length || 0} episodes)</div>
                    <button
                      onClick={() => setConfirmDelete({ type: 'season', id: sea.id, parentId: managingSeries.id, title: `Season ${sea.seasonNumber}` })}
                      className="text-red-400 hover:text-red-300 text-[11px] font-semibold"
                    >
                      Delete Season
                    </button>
                  </div>
                  <div className="divide-y divide-neutral-800/60">
                    {sea.episodes?.map(ep => (
                      <div key={ep.id} className="py-2 flex justify-between items-center gap-2">
                        <div>
                          <span className="font-bold text-white">E{ep.episodeNumber}: {ep.title}</span>
                          <span className="text-neutral-500 ml-2">({ep.durationMinutes}m)</span>
                          <p className="text-neutral-400 text-[11px] line-clamp-1">{ep.description}</p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              setEditingEpisode(ep);
                              setEpisodeSeasonId(sea.id);
                              setEpisodeDraft({
                                episodeNumber: String(ep.episodeNumber),
                                title: ep.title,
                                description: ep.description,
                                durationMinutes: String(ep.durationMinutes),
                                thumbnailUrl: ep.thumbnailUrl || '',
                                videoUrl: ep.videoUrl || '',
                                state: ep.state || 'PUBLISHED',
                              });
                            }}
                            className="px-2 py-1 rounded bg-neutral-800 text-white text-[10px]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setConfirmDelete({ type: 'episode', id: ep.id, title: ep.title })}
                            className="px-2 py-1 rounded bg-red-950/60 text-red-300 text-[10px]"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG FOR DESTRUCTIVE ACTIONS */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-red-900/60 bg-neutral-900 p-6 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />{' '}
              {confirmDelete.type === 'movie' ? `Remove Movie: "${confirmDelete.title}"` : 'Confirm Permanent Deletion'}
            </div>
            {confirmDelete.type === 'movie' ? (
              <div className="space-y-3 text-neutral-300 leading-relaxed">
                <p>
                  Choose how to remove <span className="font-bold text-white">{confirmDelete.title}</span> from the ZIRA catalog:
                </p>
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 space-y-1">
                  <div className="font-bold text-amber-300">Option 1: Archive Movie (Recommended Soft Delete)</div>
                  <p className="text-[11px] text-neutral-400">
                    Immediately hides <span className="text-white font-semibold">{confirmDelete.title}</span> from the public catalog by setting its state to <span className="font-mono">ARCHIVED</span> while preserving database history, analytics, and audit logs.
                  </p>
                </div>
                <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-3 space-y-1">
                  <div className="font-bold text-red-300">Option 2: Permanent Deletion</div>
                  <p className="text-[11px] text-neutral-400">
                    Permanently deletes <span className="text-white font-semibold">{confirmDelete.title}</span> from PostgreSQL and removes its unreferenced Cloudflare R2 media objects (shared R2 assets referenced by other records are safely preserved).
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-neutral-300 leading-relaxed">
                Are you sure you want to permanently delete <span className="font-bold text-white">{confirmDelete.title}</span>? This action will immediately update the public catalog and cannot be undone.
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-semibold">
                Cancel
              </button>
              {confirmDelete.type === 'movie' && (
                <button
                  onClick={() => void executeConfirmedDelete('archive')}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  Archive Movie
                </button>
              )}
              <button
                onClick={() => void executeConfirmedDelete('permanent')}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold"
              >
                {confirmDelete.type === 'movie' ? 'Permanently Delete' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD SPONSOR MODAL */}
      {showAddSponsorModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md space-y-4 overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="text-lg font-bold text-white">{editingSponsorId ? 'Edit Sponsor Partner' : 'Register Sponsor Partner'}</h3>
            <form onSubmit={handleCreateSponsor} className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-300 block mb-1">Sponsor / Company Name</label>
                <input required type="text" value={sponsorName} onChange={e => setSponsorName(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-neutral-300 block mb-1">Website URL</label>
                <input required type="url" value={sponsorWebsite} onChange={e => setSponsorWebsite(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddSponsorModal(false)} className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold">{editingSponsorId ? 'Save Sponsor' : 'Register Sponsor'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCampaignModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl space-y-4 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="text-lg font-bold text-white">{editingCampaignId ? 'Edit Sponsor Campaign' : 'Create Sponsor Campaign'}</h3>
            <form onSubmit={handleCreateSponsorCampaign} className="grid gap-3 sm:grid-cols-2 text-xs">
              <label className="sm:col-span-2 text-neutral-300">Sponsor
                <select required disabled={Boolean(editingCampaignId)} value={campaignDraft.sponsorId} onChange={event => setCampaignDraft(previous => ({ ...previous, sponsorId: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white">
                  <option value="">Select sponsor</option>{sponsors.map(sponsor => <option key={sponsor.id} value={sponsor.id}>{sponsor.name}</option>)}
                </select>
              </label>
              <label className="text-neutral-300">Campaign name<input required value={campaignDraft.name} onChange={event => setCampaignDraft(previous => ({ ...previous, name: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <label className="text-neutral-300">Placement<select value={campaignDraft.placement} onChange={event => setCampaignDraft(previous => ({ ...previous, placement: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white">{['HOME_BETWEEN_RAILS','HOME_BOTTOM_BANNER','BROWSE_BANNER','SEARCH_NATIVE','MOVIE_DETAILS_BANNER','SERIES_DETAILS_BANNER','PLAYER_COMPANION','FOOTER_BANNER'].map(placement => <option key={placement}>{placement}</option>)}</select></label>
              <label className="text-neutral-300 sm:col-span-2">Destination URL<input required type="url" value={campaignDraft.destinationUrl} onChange={event => setCampaignDraft(previous => ({ ...previous, destinationUrl: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <label className="text-neutral-300">Creative title<input required value={campaignDraft.creativeTitle} onChange={event => setCampaignDraft(previous => ({ ...previous, creativeTitle: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <label className="text-neutral-300">Banner image URL<input required type="url" value={campaignDraft.imageUrl} onChange={event => setCampaignDraft(previous => ({ ...previous, imageUrl: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <label className="text-neutral-300">Upload banner from device<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingBanner || !campaignDraft.sponsorId} onChange={event => { void handleSponsorBannerUpload(event.target.files?.[0]); event.currentTarget.value = ''; }} className="mt-1 block w-full text-xs text-neutral-300 file:mr-3 file:rounded file:border-0 file:bg-neutral-800 file:px-3 file:py-2 file:text-white disabled:opacity-50" />{uploadingBanner && <span className="mt-1 block text-amber-300">Uploading…</span>}</label>
              <label className="text-neutral-300 sm:col-span-2">Tagline<input value={campaignDraft.tagline} onChange={event => setCampaignDraft(previous => ({ ...previous, tagline: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <label className="text-neutral-300">Start date<input required type="datetime-local" value={campaignDraft.startDate} onChange={event => setCampaignDraft(previous => ({ ...previous, startDate: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <label className="text-neutral-300">End date<input required type="datetime-local" value={campaignDraft.endDate} onChange={event => setCampaignDraft(previous => ({ ...previous, endDate: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <label className="text-neutral-300">Agreed price<input required min="0" step="0.01" type="number" value={campaignDraft.agreedPrice} onChange={event => setCampaignDraft(previous => ({ ...previous, agreedPrice: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <button type="button" onClick={() => { setShowCampaignModal(false); setEditingCampaignId(null); }} className="rounded bg-neutral-800 px-4 py-2 text-neutral-300">Cancel</button>
                <button type="submit" className="rounded bg-red-600 px-4 py-2 font-bold text-white">{editingCampaignId ? 'Save Campaign' : 'Create Campaign'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAffiliatePartnerModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-lg space-y-4 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="text-lg font-bold text-white">{editingAffiliatePartnerId ? 'Edit Affiliate Partner' : 'Create Affiliate Partner'}</h3>
            <form onSubmit={handleCreateAffiliatePartner} className="space-y-3 text-xs">
              <label className="block text-neutral-300">Partner name<input required value={affiliatePartnerDraft.partnerName} onChange={event => setAffiliatePartnerDraft(previous => ({ ...previous, partnerName: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <label className="block text-neutral-300">Website URL<input required type="url" value={affiliatePartnerDraft.websiteUrl} onChange={event => setAffiliatePartnerDraft(previous => ({ ...previous, websiteUrl: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <label className="block text-neutral-300">Description<input value={affiliatePartnerDraft.description} onChange={event => setAffiliatePartnerDraft(previous => ({ ...previous, description: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <div className="flex justify-end gap-2"><button type="button" onClick={() => { setShowAffiliatePartnerModal(false); setEditingAffiliatePartnerId(null); }} className="rounded bg-neutral-800 px-4 py-2 text-neutral-300">Cancel</button><button type="submit" className="rounded bg-red-600 px-4 py-2 font-bold text-white">Save Partner</button></div>
            </form>
          </div>
        </div>
      )}

      {showAffiliateCampaignModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl space-y-4 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="text-lg font-bold text-white">{editingAffiliateCampaignId ? 'Edit Affiliate Campaign' : 'Create Affiliate Campaign'}</h3>
            <form onSubmit={handleCreateAffiliateCampaign} className="grid gap-3 sm:grid-cols-2 text-xs">
              <label className="text-neutral-300">Partner<select required disabled={Boolean(editingAffiliateCampaignId)} value={affiliateCampaignDraft.partnerId} onChange={event => setAffiliateCampaignDraft(previous => ({ ...previous, partnerId: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white"><option value="">Select partner</option>{affiliateData.partners.map((partner: any) => <option key={partner.id} value={partner.id}>{partner.partnerName}</option>)}</select></label>
              <label className="text-neutral-300">Campaign name<input required value={affiliateCampaignDraft.campaignName} onChange={event => setAffiliateCampaignDraft(previous => ({ ...previous, campaignName: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <label className="text-neutral-300 sm:col-span-2">Affiliate URL<input required type="url" value={affiliateCampaignDraft.destinationUrl} onChange={event => setAffiliateCampaignDraft(previous => ({ ...previous, destinationUrl: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <label className="text-neutral-300 sm:col-span-2">Tracking URL<input required type="url" value={affiliateCampaignDraft.trackingUrl} onChange={event => setAffiliateCampaignDraft(previous => ({ ...previous, trackingUrl: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <label className="text-neutral-300 sm:col-span-2">Creative image URL<input required type="url" value={affiliateCampaignDraft.imageUrl} onChange={event => setAffiliateCampaignDraft(previous => ({ ...previous, imageUrl: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <label className="text-neutral-300">Placement<select value={affiliateCampaignDraft.placement} onChange={event => setAffiliateCampaignDraft(previous => ({ ...previous, placement: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white">{['HOME_BETWEEN_RAILS','HOME_BOTTOM_BANNER','BROWSE_BANNER','SEARCH_NATIVE','MOVIE_DETAILS_BANNER','SERIES_DETAILS_BANNER','PLAYER_COMPANION','FOOTER_BANNER'].map(placement => <option key={placement}>{placement}</option>)}</select></label>
              <label className="text-neutral-300">Start date<input required type="datetime-local" value={affiliateCampaignDraft.startDate} onChange={event => setAffiliateCampaignDraft(previous => ({ ...previous, startDate: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <label className="text-neutral-300">End date<input required type="datetime-local" value={affiliateCampaignDraft.endDate} onChange={event => setAffiliateCampaignDraft(previous => ({ ...previous, endDate: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <div className="sm:col-span-2 flex justify-end gap-2"><button type="button" onClick={() => { setShowAffiliateCampaignModal(false); setEditingAffiliateCampaignId(null); }} className="rounded bg-neutral-800 px-4 py-2 text-neutral-300">Cancel</button><button type="submit" className="rounded bg-red-600 px-4 py-2 font-bold text-white">Save Campaign</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

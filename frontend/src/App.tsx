import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from './api';
import { Navbar, NavView } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { TrailerModal } from './components/TrailerModal';
import { AuthModal } from './components/AuthModal';
import { HomeView } from './views/HomeView';
import { BrowseView } from './views/BrowseView';
import { MovieDetailsView } from './views/MovieDetailsView';
import { SeriesDetailsView } from './views/SeriesDetailsView';
import { MyListView } from './views/MyListView';
import { ProfileView } from './views/ProfileView';
import { AdminView } from './views/AdminView';
import { InterpretersView } from './views/InterpretersView';
import { VipView } from './views/VipView';
import { MoreView } from './views/MoreView';
import { MonetagAd } from './components/MonetagAd';
import {
  Movie,
  Series,
  Episode,
  Genre,
  User,
  WatchProgress,
  WatchlistItem,
  SponsorBannerPlacement,
  Interpreter,
  VipConfig,
} from './types';
import { Shield, Lock, Crown } from 'lucide-react';

const LOCAL_WATCHLIST_KEY = 'zira_public_watchlist_v1';
const LOCAL_PROGRESS_KEY = 'zira_public_watch_progress_v1';

async function parseApiJson(response: Response): Promise<any | undefined> {
  if (!response.headers.get('content-type')?.includes('application/json')) return undefined;
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function readLocalJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function updateSeoMeta({
  title,
  description,
  canonicalPath,
  image,
  type = 'website',
  jsonLd,
}: {
  title: string;
  description: string;
  canonicalPath: string;
  image?: string;
  type?: string;
  jsonLd?: Record<string, any>;
}) {
  document.title = title;
  const origin = window.location.origin || 'https://zira-movies.vercel.app';
  const fullUrl = `${origin}${canonicalPath}`;

  const setMeta = (selector: string, attrName: 'name' | 'property', attrValue: string, content: string) => {
    let el = document.head.querySelector<HTMLMetaElement>(selector);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, attrValue);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  setMeta('meta[name="description"]', 'name', 'description', description);
  setMeta('meta[property="og:title"]', 'property', 'og:title', title);
  setMeta('meta[property="og:description"]', 'property', 'og:description', description);
  setMeta('meta[property="og:type"]', 'property', 'og:type', type);
  setMeta('meta[property="og:url"]', 'property', 'og:url', fullUrl);
  if (image) {
    setMeta('meta[property="og:image"]', 'property', 'og:image', image);
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image);
  }
  setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
  setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
  setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', fullUrl);

  let scriptEl = document.head.querySelector<HTMLScriptElement>('script#zira-jsonld');
  if (jsonLd) {
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = 'zira-jsonld';
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(jsonLd);
  }
}

export default function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>(localStorage.getItem('zira_token') || '');

  useEffect(() => {
    const updateToken = (event: Event) => {
      const refreshedToken = (event as CustomEvent<string>).detail;
      if (typeof refreshedToken === 'string') setToken(refreshedToken);
    };
    window.addEventListener('zira:token-refreshed', updateToken);
    return () => window.removeEventListener('zira:token-refreshed', updateToken);
  }, []);

  // Content state
  const [movies, setMovies] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [interpreters, setInterpreters] = useState<Interpreter[]>([]);
  const [vipConfig, setVipConfig] = useState<VipConfig | null>(null);
  const [paymentGatewayConfigured, setPaymentGatewayConfigured] = useState<boolean>(false);
  const [catalogStatus, setCatalogStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [watchProgressList, setWatchProgressList] = useState<WatchProgress[]>(() =>
    readLocalJson<WatchProgress[]>(LOCAL_PROGRESS_KEY, []),
  );
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() =>
    readLocalJson<WatchlistItem[]>(LOCAL_WATCHLIST_KEY, []),
  );
  const [sponsorPlacement, setSponsorPlacement] = useState<SponsorBannerPlacement | null>(null);
  const [sponsorBottomBanner, setSponsorBottomBanner] = useState<SponsorBannerPlacement | null>(null);

  // Selected item state
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [selectedInterpreterSlug, setSelectedInterpreterSlug] = useState<string | null>(null);

  // Modals
  const [showPlayer, setShowPlayer] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [activeTrailerItem, setActiveTrailerItem] = useState<Movie | Series | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // PWA Install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaBanner, setShowPwaBanner] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPwaBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPwa = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
        setShowPwaBanner(false);
      });
    }
  };

  // Fetch initial public content
  const loadPublicData = useCallback(async () => {
    setCatalogStatus('loading');
    try {
      const [movRes, serRes, spRes, spBotRes, genRes, intRes, vipRes] = await Promise.all([
        apiFetch('/api/movies'),
        apiFetch('/api/series'),
        apiFetch('/api/monetization/placements?placement=HOME_BETWEEN_RAILS'),
        apiFetch('/api/monetization/placements?placement=HOME_BOTTOM_BANNER').catch(() => null),
        apiFetch('/api/genres').catch(() => null),
        apiFetch('/api/interpreters').catch(() => null),
        apiFetch('/api/vip').catch(() => null),
      ]);
      const [movData, serData, spData, spBotData, genData, intData, vipData] = await Promise.all([
        parseApiJson(movRes),
        parseApiJson(serRes),
        parseApiJson(spRes),
        spBotRes ? parseApiJson(spBotRes) : Promise.resolve(undefined),
        genRes ? parseApiJson(genRes) : Promise.resolve(undefined),
        intRes ? parseApiJson(intRes) : Promise.resolve(undefined),
        vipRes ? parseApiJson(vipRes) : Promise.resolve(undefined),
      ]);

      const loadedMovies: Movie[] = movRes.ok && movData && typeof movData === 'object' ? movData.movies || [] : [];
      const loadedSeries: Series[] = serRes.ok && serData && typeof serData === 'object' ? serData.series || [] : [];

      if (movRes.ok && movData && typeof movData === 'object') {
        setMovies(loadedMovies);
      }

      if (serRes.ok && serData && typeof serData === 'object') {
        setSeries(loadedSeries);
      }

      if (intRes?.ok && Array.isArray(intData?.interpreters)) {
        setInterpreters(intData.interpreters);
      }

      if (vipRes?.ok && vipData?.vipConfig) {
        setVipConfig(vipData.vipConfig);
        setPaymentGatewayConfigured(Boolean(vipData.paymentGatewayConfigured));
      }

      if (genRes?.ok && Array.isArray(genData?.genres) && genData.genres.length > 0) {
        setGenres(genData.genres);
      } else {
        const derivedSlugs = Array.from(
          new Set([...loadedMovies.flatMap(m => m.genres || []), ...loadedSeries.flatMap(s => s.genres || [])]),
        );
        setGenres(
          derivedSlugs.map(slug => ({
            id: `genre-${slug}`,
            slug,
            name: slug
              .split('-')
              .map(w => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' '),
          })),
        );
      }

      if (spRes.ok && spData !== undefined) {
        setSponsorPlacement(spData);
      }
      if (spBotRes?.ok && spBotData !== undefined) {
        setSponsorBottomBanner(spBotData);
      }
      setCatalogStatus(
        movRes.ok &&
          serRes.ok &&
          spRes.ok &&
          movData !== undefined &&
          movData !== null &&
          serData !== undefined &&
          serData !== null &&
          spData !== undefined
          ? 'ready'
          : 'unavailable',
      );
    } catch (e) {
      console.error('Failed to load ZIRA catalog:', e);
      setCatalogStatus('unavailable');
    }
  }, []);

  // Fetch admin/user session if token exists
  const loadUserData = useCallback(async () => {
    if (!token) return;
    try {
      const [meRes, wpRes, wlRes] = await Promise.all([
        apiFetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
        apiFetch('/api/user/watch-progress', { headers: { Authorization: `Bearer ${token}` } }),
        apiFetch('/api/user/watchlist', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [meData, wpData, wlData] = await Promise.all([meRes, wpRes, wlRes].map(parseApiJson));

      if (meRes.ok && meData?.user) {
        setUser(meData.user);
      } else if (meRes.status === 401) {
        localStorage.removeItem('zira_token');
        setToken('');
        setUser(null);
      }

      if (wpRes.ok && wpData?.watchProgress?.length) {
        setWatchProgressList(wpData.watchProgress);
      }

      if (wlRes.ok && wlData?.watchlist?.length) {
        setWatchlist(wlData.watchlist);
      }
    } catch (e) {
      console.error('Failed to load user data:', e);
    }
  }, [token]);

  useEffect(() => {
    void loadPublicData();
  }, [loadPublicData]);

  useEffect(() => {
    void loadUserData();
  }, [loadUserData]);

  // Hydrate local watchlist items with full movie/series objects once catalog loads
  useEffect(() => {
    if (movies.length === 0 && series.length === 0) return;
    setWatchlist(prev =>
      prev.map(w => ({
        ...w,
        movie: w.movie || (w.movieId ? movies.find(m => m.id === w.movieId) : undefined),
        series: w.series || (w.seriesId ? series.find(s => s.id === w.seriesId) : undefined),
      })),
    );
  }, [movies, series]);

  // URL routing sync
  const applyPathname = useCallback(
    (pathname: string) => {
      const cleanPath = pathname.replace(/\/+$/, '') || '/';
      if (cleanPath === '/movies') {
        setCurrentView('movies');
      } else if (cleanPath === '/series') {
        setCurrentView('series');
      } else if (cleanPath === '/browse' || cleanPath === '/search') {
        setCurrentView('browse');
      } else if (cleanPath === '/interpreters') {
        setSelectedInterpreterSlug(null);
        setCurrentView('interpreters');
      } else if (cleanPath.startsWith('/interpreter/')) {
        const slug = decodeURIComponent(cleanPath.slice('/interpreter/'.length));
        setSelectedInterpreterSlug(slug || null);
        setCurrentView('interpreters');
      } else if (cleanPath === '/vip') {
        setCurrentView('vip');
      } else if (cleanPath === '/more') {
        setCurrentView('more');
      } else if (cleanPath === '/my-list' || cleanPath === '/mylist') {
        setCurrentView('my-list');
      } else if (cleanPath === '/admin') {
        setCurrentView('admin');
      } else if (cleanPath.startsWith('/movie/')) {
        const slug = decodeURIComponent(cleanPath.slice('/movie/'.length));
        const found = movies.find(m => m.slug === slug);
        if (found) {
          setSelectedMovie(found);
          setCurrentView('movie-details');
        } else if (movies.length > 0) {
          setCurrentView('movies');
        }
      } else if (cleanPath.startsWith('/series/')) {
        const slug = decodeURIComponent(cleanPath.slice('/series/'.length));
        const found = series.find(s => s.slug === slug);
        if (found) {
          setSelectedSeries(found);
          setCurrentView('series-details');
        } else if (series.length > 0) {
          setCurrentView('series');
        }
      } else {
        setCurrentView('home');
      }
    },
    [movies, series],
  );

  useEffect(() => {
    applyPathname(window.location.pathname);
    const onPopState = () => applyPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [applyPathname]);

  // Dynamic SEO & Schema.org structured data
  useEffect(() => {
    const origin = window.location.origin || 'https://zira-movies.vercel.app';
    if (currentView === 'movie-details' && selectedMovie) {
      updateSeoMeta({
        title: `Watch ${selectedMovie.title} (${selectedMovie.releaseYear}) Free | ZIRA Movies`,
        description: selectedMovie.description,
        canonicalPath: `/movie/${selectedMovie.slug}`,
        image: selectedMovie.backdropUrl || selectedMovie.posterUrl,
        type: 'video.movie',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Movie',
          name: selectedMovie.title,
          description: selectedMovie.description,
          dateCreated: String(selectedMovie.releaseYear),
          duration: `PT${selectedMovie.durationMinutes}M`,
          inLanguage: selectedMovie.language,
          genre: selectedMovie.genres,
          image: selectedMovie.posterUrl,
          url: `${origin}/movie/${selectedMovie.slug}`,
        },
      });
    } else if (currentView === 'series-details' && selectedSeries) {
      updateSeoMeta({
        title: `Watch ${selectedSeries.title} (${selectedSeries.releaseYear}) Free | ZIRA Series`,
        description: selectedSeries.description,
        canonicalPath: `/series/${selectedSeries.slug}`,
        image: selectedSeries.backdropUrl || selectedSeries.posterUrl,
        type: 'video.tv_show',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'TVSeries',
          name: selectedSeries.title,
          description: selectedSeries.description,
          startDate: String(selectedSeries.releaseYear),
          inLanguage: selectedSeries.language,
          numberOfSeasons: selectedSeries.seasons?.length || 1,
          genre: selectedSeries.genres,
          image: selectedSeries.posterUrl,
          url: `${origin}/series/${selectedSeries.slug}`,
        },
      });
    } else if (currentView === 'interpreters') {
      updateSeoMeta({
        title: 'Abasobanuzi (Interpreters) — Browse Content by Interpreter | ZIRA Movies',
        description: 'Explore ZIRA interpreter profiles (Abasobanuzi) and watch authorized movies and series organized by narrator.',
        canonicalPath: selectedInterpreterSlug ? `/interpreter/${selectedInterpreterSlug}` : '/interpreters',
      });
    } else if (currentView === 'vip') {
      updateSeoMeta({
        title: 'Gura VIP — Optional VIP Membership & Benefits | ZIRA Movies',
        description: 'Support ZIRA with an optional VIP membership for ad-free browsing, priority HD streaming, and VIP badges. All authorized movies remain 100% free to watch.',
        canonicalPath: '/vip',
      });
    } else if (currentView === 'movies') {
      updateSeoMeta({
        title: 'Filime — Watch Free Movies Online | ZIRA Movies',
        description: 'Browse and stream full-length movies across Action, Drama, Comedy, Horror, Sci-Fi, and Rwandan & East African Cinema with no sign-in required.',
        canonicalPath: '/movies',
      });
    } else if (currentView === 'series') {
      updateSeoMeta({
        title: 'Series — Watch Free TV Series Online | ZIRA Series',
        description: 'Stream complete seasons and episodes of original African and international TV series free on ZIRA.',
        canonicalPath: '/series',
      });
    } else if (currentView === 'browse') {
      updateSeoMeta({
        title: 'Browse All Movies & TV Series | ZIRA Streaming',
        description: 'Search and filter movies and series by genre, release year, maturity rating, and popularity on ZIRA.',
        canonicalPath: '/browse',
      });
    } else {
      updateSeoMeta({
        title: 'ZIRA | Watch Free Movies & TV Series — African & Global Cinema',
        description: 'Stream free movies, East African originals, Rwandan cinema, and global series in HD with zero registration required.',
        canonicalPath: '/',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'ZIRA',
          url: origin,
          description: 'Free movie and TV series streaming platform featuring Rwandan, African, and global cinema.',
        },
      });
    }
  }, [currentView, selectedMovie, selectedSeries, selectedInterpreterSlug]);

  // Handle navigation
  const handleNavigate = (view: NavView | string, slug?: string) => {
    if (view === 'movie' && slug) {
      const found = movies.find(m => m.slug === slug);
      if (found) {
        setSelectedMovie(found);
        setCurrentView('movie-details');
        window.history.pushState({}, '', `/movie/${found.slug}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    } else if (view === 'series' && slug) {
      const found = series.find(s => s.slug === slug);
      if (found) {
        setSelectedSeries(found);
        setCurrentView('series-details');
        window.history.pushState({}, '', `/series/${found.slug}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    const normalizedView = view === 'mylist' ? 'my-list' : view === 'search' ? 'browse' : view;
    if (normalizedView === 'interpreters' && !slug) {
      setSelectedInterpreterSlug(null);
    }

    setCurrentView(normalizedView);
    const routeMap: Record<string, string> = {
      home: '/',
      browse: '/browse',
      movies: '/movies',
      series: '/series',
      interpreters: '/interpreters',
      vip: '/vip',
      more: '/more',
      'my-list': '/my-list',
      admin: '/admin',
    };
    if (routeMap[normalizedView] && window.location.pathname !== routeMap[normalizedView]) {
      window.history.pushState({}, '', routeMap[normalizedView]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectInterpreter = (slug: string | null) => {
    setSelectedInterpreterSlug(slug);
    setCurrentView('interpreters');
    const targetPath = slug ? `/interpreter/${encodeURIComponent(slug)}` : '/interpreters';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectContent = (item: Movie | Series) => {
    if ('durationMinutes' in item) {
      const mov = item as Movie;
      setSelectedMovie(mov);
      setCurrentView('movie-details');
      window.history.pushState({}, '', `/movie/${mov.slug}`);
    } else {
      const ser = item as Series;
      setSelectedSeries(ser);
      setCurrentView('series-details');
      window.history.pushState({}, '', `/series/${ser.slug}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWatchContent = (item: Movie | Series) => {
    if ('durationMinutes' in item) {
      setSelectedMovie(item as Movie);
      setSelectedEpisode(null);
      setShowPlayer(true);
    } else {
      const ser = item as Series;
      setSelectedSeries(ser);
      if (ser.seasons.length > 0 && ser.seasons[0].episodes.length > 0) {
        setSelectedEpisode(ser.seasons[0].episodes[0]);
        setShowPlayer(true);
      }
    }
  };

  const handlePlayEpisode = (ser: Series, ep: Episode) => {
    setSelectedSeries(ser);
    setSelectedEpisode(ep);
    setShowPlayer(true);
  };

  const handleTrailer = (item: Movie | Series) => {
    setActiveTrailerItem(item);
    setShowTrailer(true);
  };

  // Public local-browser watchlist + optional server sync if logged in
  const handleToggleMyList = async (item: Movie | Series) => {
    const isMovie = 'durationMinutes' in item;
    const exists = watchlist.some(w => (isMovie ? w.movieId === item.id : w.seriesId === item.id));

    if (exists) {
      const updated = watchlist.filter(w => (isMovie ? w.movieId !== item.id : w.seriesId !== item.id));
      setWatchlist(updated);
      localStorage.setItem(LOCAL_WATCHLIST_KEY, JSON.stringify(updated));

      if (token && user) {
        await apiFetch('/api/user/watchlist', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(isMovie ? { movieId: item.id } : { seriesId: item.id }),
        }).catch(() => {});
      }
    } else {
      const newItem: WatchlistItem = {
        id: `local_${Date.now()}`,
        userId: user?.id || 'guest',
        movieId: isMovie ? item.id : undefined,
        seriesId: !isMovie ? item.id : undefined,
        createdAt: new Date().toISOString(),
        movie: isMovie ? (item as Movie) : undefined,
        series: !isMovie ? (item as Series) : undefined,
      };
      const updated = [...watchlist, newItem];
      setWatchlist(updated);
      localStorage.setItem(LOCAL_WATCHLIST_KEY, JSON.stringify(updated));

      if (token && user) {
        await apiFetch('/api/user/watchlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(isMovie ? { movieId: item.id } : { seriesId: item.id }),
        }).catch(() => {});
      }
    }
  };

  // Save watch progress locally for public visitors + sync if token exists
  const handleSaveProgress = async (positionSeconds: number, durationSeconds: number) => {
    const movieId = selectedMovie ? selectedMovie.id : undefined;
    const seriesId = selectedSeries ? selectedSeries.id : undefined;
    const episodeId = selectedEpisode ? selectedEpisode.id : undefined;
    const percentage = durationSeconds > 0 ? Math.min(100, Math.round((positionSeconds / durationSeconds) * 100)) : 0;

    setWatchProgressList(prev => {
      const filtered = prev.filter(
        wp => !(wp.movieId === movieId && wp.seriesId === seriesId && wp.episodeId === episodeId),
      );
      const entry: WatchProgress = {
        id: `wp_${movieId || episodeId || Date.now()}`,
        userId: user?.id || 'guest',
        movieId,
        seriesId,
        episodeId,
        positionSeconds,
        durationSeconds,
        percentage,
        completed: percentage >= 90,
        updatedAt: new Date().toISOString(),
      };
      const next = [entry, ...filtered].slice(0, 30);
      localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(next));
      return next;
    });

    if (!token) return;
    try {
      await apiFetch('/api/user/watch-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          movieId,
          seriesId,
          episodeId,
          positionSeconds,
          durationSeconds,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleTrackSponsorClick = async (campaignId: string, type: string) => {
    try {
      await apiFetch('/api/monetization/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, type }),
      });
    } catch {
      // Ignore tracking errors
    }
  };

  const handleUpdatePreferences = async (pref: any) => {
    if (!token) return;
    try {
      const res = await apiFetch('/api/user/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(pref),
      });
      if (res.ok) void loadUserData();
    } catch {
      // Ignore
    }
  };

  const handleLogout = () => {
    void apiFetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('zira_token');
    setToken('');
    setUser(null);
    handleNavigate('home');
  };

  const myListIds = watchlist.map(w => w.movieId || w.seriesId || '').filter(Boolean);
  const isAdmin = Boolean(user && ['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(user.role));

  const activeNavView: NavView =
    currentView === 'my-list'
      ? 'mylist'
      : currentView === 'movie-details'
        ? 'movies'
        : currentView === 'series-details'
          ? 'series'
          : (currentView as NavView);

  let initialPlayerPos = 0;
  if (selectedMovie) {
    const wp = watchProgressList.find(w => w.movieId === selectedMovie.id);
    if (wp) initialPlayerPos = wp.positionSeconds;
  } else if (selectedEpisode) {
    const wp = watchProgressList.find(w => w.episodeId === selectedEpisode.id);
    if (wp) initialPlayerPos = wp.positionSeconds;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-red-600 selection:text-white flex flex-col">
      {/* Top Navigation */}
      <Navbar
        activeView={activeNavView}
        onNavigate={handleNavigate}
        user={user}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
      />

      {/* PWA Install Banner */}
      {showPwaBanner && (
        <div className="bg-gradient-to-r from-red-900 to-neutral-900 px-4 py-2 text-xs flex justify-between items-center border-b border-red-800">
          <span>Install ZIRA App on your device for instant Rwandan & African movie streaming!</span>
          <button onClick={handleInstallPwa} className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 font-bold text-white">
            Install App
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 mb-16 md:mb-0">
        {catalogStatus !== 'ready' && (
          <div role={catalogStatus === 'unavailable' ? 'alert' : 'status'} className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-neutral-200">
            <span>{catalogStatus === 'loading' ? 'Connecting to the ZIRA catalog…' : 'The catalog service is unavailable. You can still browse the app while it reconnects.'}</span>
            {catalogStatus === 'unavailable' && (
              <button onClick={() => void loadPublicData()} className="min-h-11 rounded bg-red-700 px-4 font-semibold text-white hover:bg-red-600">Retry</button>
            )}
          </div>
        )}

        {currentView === 'home' && (
          <HomeView
            movies={movies}
            series={series}
            interpreters={interpreters}
            watchProgressList={watchProgressList}
            myListIds={myListIds}
            onSelectContent={handleSelectContent}
            onWatchContent={handleWatchContent}
            onPlayTrailer={handleTrailer}
            onToggleMyList={handleToggleMyList}
            onSelectInterpreter={slug => handleSelectInterpreter(slug)}
            onNavigateInterpreters={() => handleSelectInterpreter(null)}
            onNavigateVip={() => handleNavigate('vip')}
            sponsorBetweenRails={sponsorPlacement}
            sponsorBottomBanner={sponsorBottomBanner}
            onTrackSponsorClick={handleTrackSponsorClick}
          />
        )}

        {(currentView === 'browse' || currentView === 'movies' || currentView === 'series') && (
          <BrowseView
            movies={movies}
            series={series}
            genres={genres}
            initialType={currentView === 'movies' ? 'MOVIES' : currentView === 'series' ? 'SERIES' : 'ALL'}
            initialSearchQuery={searchQuery}
            onSelectContent={handleSelectContent}
            onWatchContent={handleWatchContent}
            onToggleMyList={handleToggleMyList}
            onSelectInterpreter={slug => handleSelectInterpreter(slug)}
            myListIds={myListIds}
          />
        )}

        {currentView === 'interpreters' && (
          <InterpretersView
            interpreters={interpreters}
            movies={movies}
            series={series}
            selectedSlug={selectedInterpreterSlug}
            onSelectInterpreter={handleSelectInterpreter}
            onSelectContent={handleSelectContent}
            onWatchContent={handleWatchContent}
            onToggleMyList={handleToggleMyList}
            myListIds={myListIds}
          />
        )}

        {currentView === 'vip' && (
          <VipView
            vipConfig={vipConfig}
            paymentGatewayConfigured={paymentGatewayConfigured}
            onContinueFreeStreaming={() => handleNavigate('home')}
          />
        )}

        {currentView === 'more' && (
          <MoreView
            genres={genres}
            user={user}
            onNavigate={handleNavigate}
            onSelectGenre={genreSlug => {
              setSearchQuery(genreSlug);
              handleNavigate('browse');
            }}
            onOpenAuthModal={() => setShowAuthModal(true)}
          />
        )}

        {currentView === 'movie-details' && selectedMovie && (
          <MovieDetailsView
            movie={selectedMovie}
            rights={selectedMovie.rights}
            similarMovies={movies.filter(m => m.id !== selectedMovie.id)}
            onWatch={() => handleWatchContent(selectedMovie)}
            onTrailer={() => handleTrailer(selectedMovie)}
            onToggleMyList={() => void handleToggleMyList(selectedMovie)}
            isInMyList={myListIds.includes(selectedMovie.id)}
            onSelectContent={handleSelectContent}
            onSelectInterpreter={slug => handleSelectInterpreter(slug)}
            sponsorPlacement={sponsorPlacement}
            onTrackSponsorClick={handleTrackSponsorClick}
          />
        )}

        {currentView === 'series-details' && selectedSeries && (
          <SeriesDetailsView
            series={selectedSeries}
            watchProgressList={watchProgressList}
            onPlayEpisode={handlePlayEpisode}
            onTrailer={() => handleTrailer(selectedSeries)}
            onToggleMyList={() => void handleToggleMyList(selectedSeries)}
            isInMyList={myListIds.includes(selectedSeries.id)}
            onSelectInterpreter={slug => handleSelectInterpreter(slug)}
          />
        )}

        {currentView === 'my-list' && (
          <MyListView
            watchlist={watchlist}
            onSelectContent={handleSelectContent}
            onWatchContent={handleWatchContent}
            onToggleMyList={handleToggleMyList}
            myListIds={myListIds}
          />
        )}

        {currentView === 'profile' && user && (
          <ProfileView
            user={user}
            onUpdatePreferences={handleUpdatePreferences}
            onLogout={handleLogout}
          />
        )}

        {currentView === 'admin' && (
          isAdmin && token ? (
            <AdminView
              token={token}
              movies={movies}
              series={series}
              onRefreshData={loadPublicData}
            />
          ) : (
            <div className="max-w-md mx-auto my-16 p-8 rounded-2xl bg-neutral-900 border border-neutral-800 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-800/60 text-red-400 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-black text-white">Protected Administration Area</h1>
              <p className="text-xs text-neutral-400 leading-relaxed">
                The ZIRA Admin Console requires verified administrator credentials and server-side role authorization. Public visitors can browse and watch all movies without signing in.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => handleNavigate('home')}
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold"
                >
                  Back to Streaming
                </button>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-950"
                >
                  <Shield className="w-4 h-4" /> Administrator Sign In
                </button>
              </div>
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <MonetagAd placement="FOOTER_BANNER" className="px-4 py-3" />
      <footer className="border-t border-neutral-900 bg-neutral-950 py-8 px-4 text-center text-xs text-neutral-500 space-y-3 mb-14 md:mb-0">
        <div className="font-bold text-neutral-300 tracking-wider">ZIRA • STREAM • WATCH • ENJOY</div>
        <p>Free, legal streaming platform for Rwanda, East Africa, and global audiences.</p>
        <div className="flex flex-wrap justify-center items-center gap-4 text-[11px] text-neutral-400">
          <button onClick={() => handleNavigate('home')} className="hover:text-white">Ahabanza</button>
          <button onClick={() => handleNavigate('movies')} className="hover:text-white">Filime</button>
          <button onClick={() => handleNavigate('series')} className="hover:text-white">Series</button>
          <button onClick={() => handleSelectInterpreter(null)} className="hover:text-white">Abasobanuzi</button>
          <button onClick={() => handleNavigate('vip')} className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1">
            <Crown className="w-3 h-3" /> Gura VIP
          </button>
          <button onClick={() => handleNavigate('more')} className="hover:text-white">Ibindi</button>
          {isAdmin && (
            <button
              onClick={() => handleNavigate('admin')}
              className="text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
            >
              <Shield className="w-3 h-3" /> Admin Console
            </button>
          )}
        </div>
        <p className="text-[10px] text-neutral-600">© 2026 ZIRA Media Ltd. All rights reserved.</p>
      </footer>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeView={activeNavView}
        onNavigate={handleNavigate}
      />

      {/* Video Player Modal */}
      {showPlayer && (selectedMovie || selectedSeries) && (
        <VideoPlayerModal
          item={selectedMovie || selectedSeries!}
          episode={selectedEpisode || undefined}
          initialPosition={initialPlayerPos}
          onClose={() => setShowPlayer(false)}
          onSaveProgress={handleSaveProgress}
          playbackPreference={user?.playbackPreference}
        />
      )}

      {/* Trailer Modal */}
      {showTrailer && activeTrailerItem && (
        <TrailerModal
          item={activeTrailerItem}
          onClose={() => {
            setShowTrailer(false);
            setActiveTrailerItem(null);
          }}
        />
      )}

      {/* Admin Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={(u, t) => {
            setUser(u);
            setToken(t);
            void loadUserData();
            handleNavigate('admin');
          }}
        />
      )}
    </div>
  );
}

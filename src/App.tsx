import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from './api';
import { Navbar } from './components/Navbar';
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
import { Movie, Series, Episode, Genre, User, WatchProgress, WatchlistItem, SponsorBannerPlacement } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>(localStorage.getItem('zira_token') || '');

  // Content state
  const [movies, setMovies] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [watchProgressList, setWatchProgressList] = useState<WatchProgress[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [sponsorPlacement, setSponsorPlacement] = useState<SponsorBannerPlacement | null>(null);

  // Selected item state
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);

  // Modals
  const [showPlayer, setShowPlayer] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [activeTrailerItem, setActiveTrailerItem] = useState<Movie | Series | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // PWA Install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaBanner, setShowPwaBanner] = useState(false);

  // Listen for PWA beforeinstallprompt
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
    try {
      const [movRes, serRes, spRes] = await Promise.all([
        apiFetch('/api/movies'),
        apiFetch('/api/series'),
        apiFetch('/api/monetization/placements?placement=HOME_BETWEEN_RAILS'),
      ]);

      if (movRes.ok) {
        const movData = await movRes.json();
        setMovies(movData.movies || []);
      }

      if (serRes.ok) {
        const serData = await serRes.json();
        setSeries(serData.series || []);
      }

      if (spRes.ok) {
        const spData = await spRes.json();
        setSponsorPlacement(spData);
      }
    } catch (e) {
      console.error('Failed to load ZIRA catalog:', e);
    }
  }, []);

  // Fetch user profile & private data if token exists
  const loadUserData = useCallback(async () => {
    if (!token) return;
    try {
      const [meRes, wpRes, wlRes] = await Promise.all([
        apiFetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
        apiFetch('/api/user/watch-progress', { headers: { Authorization: `Bearer ${token}` } }),
        apiFetch('/api/user/watchlist', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(meData.user);
      } else {
        // Token expired
        localStorage.removeItem('zira_token');
        setToken('');
        setUser(null);
      }

      if (wpRes.ok) {
        const wpData = await wpRes.json();
        setWatchProgressList(wpData.watchProgress || []);
      }

      if (wlRes.ok) {
        const wlData = await wlRes.json();
        setWatchlist(wlData.watchlist || []);
      }
    } catch (e) {
      console.error('Failed to load user data:', e);
    }
  }, [token]);

  useEffect(() => {
    loadPublicData();
  }, [loadPublicData]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Handle navigation
  const handleNavigate = (view: string, slug?: string) => {
    setCurrentView(view);
    if (view === 'movie' && slug) {
      const found = movies.find(m => m.slug === slug);
      if (found) setSelectedMovie(found);
    } else if (view === 'series' && slug) {
      const found = series.find(s => s.slug === slug);
      if (found) setSelectedSeries(found);
    }
  };

  const handleSelectContent = (item: Movie | Series) => {
    if ('durationMinutes' in item) {
      setSelectedMovie(item as Movie);
      setCurrentView('movie-details');
    } else {
      setSelectedSeries(item as Series);
      setCurrentView('series-details');
    }
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

  const handleToggleMyList = async (item: Movie | Series) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const isMovie = 'durationMinutes' in item;
    const exists = watchlist.some(w => (isMovie ? w.movieId === item.id : w.seriesId === item.id));

    if (exists) {
      // Remove
      setWatchlist(prev => prev.filter(w => (isMovie ? w.movieId !== item.id : w.seriesId !== item.id)));
      await apiFetch('/api/user/watchlist', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(isMovie ? { movieId: item.id } : { seriesId: item.id }),
      });
    } else {
      // Add
      const tempItem: WatchlistItem = {
        id: `temp_${Date.now()}`,
        userId: user.id,
        movieId: isMovie ? item.id : undefined,
        seriesId: !isMovie ? item.id : undefined,
        createdAt: new Date().toISOString(),
        movie: isMovie ? (item as Movie) : undefined,
        series: !isMovie ? (item as Series) : undefined,
      };
      setWatchlist(prev => [...prev, tempItem]);

      await apiFetch('/api/user/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(isMovie ? { movieId: item.id } : { seriesId: item.id }),
      });
    }
  };

  const handleSaveProgress = async (positionSeconds: number, durationSeconds: number) => {
    if (!token) return;

    try {
      await apiFetch('/api/user/watch-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          movieId: selectedMovie ? selectedMovie.id : undefined,
          seriesId: selectedSeries ? selectedSeries.id : undefined,
          episodeId: selectedEpisode ? selectedEpisode.id : undefined,
          positionSeconds,
          durationSeconds,
        })
      });
      loadUserData();
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
    } catch (e) {}
  };

  const handleUpdatePreferences = async (pref: any) => {
    if (!token) return;
    try {
      const res = await apiFetch('/api/user/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(pref),
      });
      if (res.ok) loadUserData();
    } catch (e) {}
  };

  const handleLogout = () => {
    localStorage.removeItem('zira_token');
    setToken('');
    setUser(null);
    setWatchlist([]);
    setWatchProgressList([]);
    setCurrentView('home');
  };

  const myListIds = watchlist.map(w => w.movieId || w.seriesId || '').filter(Boolean);

  // Initial position for resume
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
        currentView={currentView}
        onNavigate={handleNavigate}
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
      />

      {/* PWA Install Banner */}
      {showPwaBanner && (
        <div className="bg-gradient-to-r from-red-900 to-neutral-900 px-4 py-2 text-xs flex justify-between items-center border-b border-red-800">
          <span>📱 Install ZIRA PWA App on your phone for faster Rwandan movie streaming!</span>
          <button onClick={handleInstallPwa} className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 font-bold text-white">
            Install App
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 mb-16 md:mb-0">
        {currentView === 'home' && (
          <HomeView
            movies={movies}
            series={series}
            watchProgressList={watchProgressList}
            onSelectContent={handleSelectContent}
            onWatchContent={handleWatchContent}
            onTrailerContent={handleTrailer}
            onToggleMyList={handleToggleMyList}
            myListIds={myListIds}
            sponsorPlacement={sponsorPlacement}
            onTrackSponsorClick={handleTrackSponsorClick}
          />
        )}

        {(currentView === 'browse' || currentView === 'movies' || currentView === 'series') && (
          <BrowseView
            movies={movies}
            series={series}
            genres={genres}
            initialSearchQuery={searchQuery}
            onSelectContent={handleSelectContent}
            onWatchContent={handleWatchContent}
            onToggleMyList={handleToggleMyList}
            myListIds={myListIds}
          />
        )}

        {currentView === 'movie-details' && selectedMovie && (
          <MovieDetailsView
            movie={selectedMovie}
            similarMovies={movies.filter(m => m.id !== selectedMovie.id)}
            onWatch={() => handleWatchContent(selectedMovie)}
            onTrailer={() => handleTrailer(selectedMovie)}
            onToggleMyList={() => handleToggleMyList(selectedMovie)}
            isInMyList={myListIds.includes(selectedMovie.id)}
            onSelectContent={handleSelectContent}
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
            onToggleMyList={() => handleToggleMyList(selectedSeries)}
            isInMyList={myListIds.includes(selectedSeries.id)}
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
          <AdminView
            token={token}
            movies={movies}
            series={series}
            onRefreshData={loadPublicData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-8 px-4 text-center text-xs text-neutral-500 space-y-2 hidden md:block">
        <div className="font-bold text-neutral-300">ZIRA • STREAM • WATCH • ENJOY</div>
        <p>Free, legal streaming platform for Rwanda, Africa, and global audiences.</p>
        <p className="text-[10px] text-neutral-600">© 2026 ZIRA Media Ltd. All rights reserved.</p>
      </footer>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={handleNavigate}
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
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

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={(u, t) => {
            setUser(u);
            setToken(t);
            loadUserData();
          }}
        />
      )}
    </div>
  );
}

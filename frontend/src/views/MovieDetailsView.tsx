import React, { useState } from 'react';
import { Play, Film, Plus, Check, Star, Share2, Shield, Calendar, Clock, Globe, Award } from 'lucide-react';
import { Movie, ContentRights, SponsorBannerPlacement } from '../types';
import { ContentRail } from '../components/ContentRail';
import { SponsorBanner } from '../components/SponsorBanner';
import { MonetagAd } from '../components/MonetagAd';

interface MovieDetailsViewProps {
  movie: Movie;
  rights?: ContentRights;
  similarMovies: Movie[];
  onWatch: (movie: Movie) => void;
  onTrailer: (movie: Movie) => void;
  onToggleMyList: (movie: Movie) => void;
  isInMyList: boolean;
  onSelectContent: (item: Movie) => void;
  sponsorPlacement: SponsorBannerPlacement | null;
  onTrackSponsorClick: (campaignId: string, type: string) => void;
}

export function MovieDetailsView({
  movie,
  rights,
  similarMovies,
  onWatch,
  onTrailer,
  onToggleMyList,
  isInMyList,
  onSelectContent,
  sponsorPlacement,
  onTrackSponsorClick,
}: MovieDetailsViewProps) {
  const [copiedShare, setCopiedShare] = useState(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: movie.title,
        text: `Stream ${movie.title} on ZIRA`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 3000);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Backdrop Header */}
      <div className="relative w-full h-[60vh] min-h-[420px] max-h-[600px] overflow-hidden rounded-3xl border border-neutral-800 shadow-2xl">
        <img
          src={movie.backdropUrl}
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/60 to-transparent"></div>

        <div className="absolute bottom-0 left-0 p-6 md:p-12 max-w-3xl z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            {movie.isRwandanContent && (
              <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 font-bold">
                🇷🇼 Rwandan Original
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
              {movie.maturityRating}
            </span>
            <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-400 font-bold border border-red-800">
              HD 4K
            </span>
            <span className="text-neutral-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {movie.releaseYear}
            </span>
            <span className="text-neutral-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {movie.durationMinutes} mins
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight">
            {movie.title}
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-neutral-300 leading-relaxed max-w-2xl">
            {movie.description}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onWatch(movie)}
              className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm sm:text-base flex items-center gap-2 shadow-xl shadow-red-950 hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-5 h-5 fill-white" />
              Watch Movie
            </button>

            <button
              onClick={() => onTrailer(movie)}
              className="px-4 py-3 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 text-white font-semibold text-sm flex items-center gap-2 border border-neutral-700 backdrop-blur-md"
            >
              <Film className="w-4 h-4" />
              Official Trailer
            </button>

            <button
              onClick={() => onToggleMyList(movie)}
              className={`p-3 rounded-xl border backdrop-blur-md transition-all ${
                isInMyList
                  ? 'bg-red-950/80 text-red-400 border-red-800'
                  : 'bg-neutral-900/80 text-neutral-200 border-neutral-700 hover:bg-neutral-800'
              }`}
              title={isInMyList ? 'Remove from My List' : 'Add to My List'}
            >
              {isInMyList ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>

            <button
              onClick={handleShare}
              className="p-3 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 relative"
              title="Share"
            >
              <Share2 className="w-5 h-5" />
              {copiedShare && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-bold whitespace-nowrap">
                  Link Copied!
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Cast & Language Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-neutral-900/40 p-6 rounded-2xl border border-neutral-800 space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-neutral-800 pb-2">
              Cast & Crew
            </h2>
            <div className="flex flex-wrap gap-2">
              {movie.cast.map(c => (
                <span key={c} className="px-3 py-1.5 rounded-xl bg-neutral-800 text-neutral-200 text-xs font-semibold border border-neutral-700">
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-neutral-900/40 p-6 rounded-2xl border border-neutral-800 space-y-3">
            <h2 className="text-lg font-bold text-white border-b border-neutral-800 pb-2">
              Audio & Subtitle Availability
            </h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-neutral-400 block mb-1">Audio Languages</span>
                <span className="font-semibold text-white">{movie.language}</span>
              </div>
              <div>
                <span className="text-neutral-400 block mb-1">Subtitles</span>
                <span className="font-semibold text-white">
                  {movie.subtitlesAvailable.map(s => s.toUpperCase()).join(', ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Content Rights Summary (Admin / Info) */}
        <div className="space-y-6">
          {rights && (
            <div className="bg-neutral-900/70 p-6 rounded-2xl border border-neutral-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                <Shield className="w-4 h-4 text-red-500" />
                <span>Rights & Licensing Status</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-neutral-800">
                  <span className="text-neutral-400">Status</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800">
                    {rights.rightsStatus}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-800">
                  <span className="text-neutral-400">Rights Holder</span>
                  <span className="text-neutral-200 font-medium truncate max-w-[160px]">{rights.rightsHolder}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-neutral-400">Territories</span>
                  <span className="text-neutral-200">{rights.territories.join(', ')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sponsor Banner */}
      <MonetagAd placement="MOVIE_DETAILS_BANNER" />
      <SponsorBanner placementData={sponsorPlacement} onTrackClick={onTrackSponsorClick} />

      {/* Similar Titles Rail */}
      {similarMovies.length > 0 && (
        <ContentRail
          title="More Like This"
          items={similarMovies}
          onSelect={onSelectContent}
          onWatch={onWatch}
          onToggleMyList={onToggleMyList}
          myListIds={isInMyList ? [movie.id] : []}
        />
      )}
    </div>
  );
}

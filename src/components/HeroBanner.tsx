import React from 'react';
import { Play, Film, Plus, Check, Star, Sparkles, Volume2, Info } from 'lucide-react';
import { Movie, Series } from '../types';

interface HeroBannerProps {
  item: Movie | Series;
  onWatch: (item: Movie | Series) => void;
  onTrailer: (item: Movie | Series) => void;
  onToggleMyList: (item: Movie | Series) => void;
  isInMyList: boolean;
  onMoreInfo: (item: Movie | Series) => void;
}

export function HeroBanner({
  item,
  onWatch,
  onTrailer,
  onToggleMyList,
  isInMyList,
  onMoreInfo,
}: HeroBannerProps) {
  const isMovie = 'durationMinutes' in item;

  return (
    <div className="relative w-full h-[70vh] min-h-[480px] max-h-[680px] overflow-hidden rounded-2xl border border-neutral-800/50 my-2 shadow-2xl group">
      {/* Backdrop Image */}
      <img
        src={item.backdropUrl}
        alt={item.title}
        className="absolute inset-0 w-full h-full object-cover object-center scale-105 group-hover:scale-100 transition-transform duration-1000 ease-out"
      />

      {/* Cinematic Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent w-full md:w-3/4"></div>

      {/* Content Area */}
      <div className="absolute bottom-0 left-0 p-6 md:p-12 max-w-2xl z-10 space-y-3.5">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          {item.isRwandanContent && (
            <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
              🇷🇼 Rwandan Original
            </span>
          )}
          {item.isAfricanContent && !item.isRwandanContent && (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              🌍 African Showcase
            </span>
          )}
          <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
            {item.maturityRating}
          </span>
          <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800 font-bold">
            HD 4K
          </span>
          <span className="text-neutral-400 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            {item.averageRating}
          </span>
          <span className="text-neutral-400">{item.releaseYear}</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-md">
          {item.title}
        </h1>

        {/* Short Description */}
        <p className="text-xs sm:text-sm md:text-base text-neutral-300 line-clamp-3 leading-relaxed max-w-xl">
          {item.description}
        </p>

        {/* Genres */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 font-medium">
          {item.genres.map(g => (
            <span key={g} className="capitalize hover:text-white transition-colors">
              • {g}
            </span>
          ))}
        </div>

        {/* CTA Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => onWatch(item)}
            className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm sm:text-base flex items-center gap-2 shadow-xl shadow-red-950/80 hover:scale-105 active:scale-95 transition-all"
          >
            <Play className="w-5 h-5 fill-white" />
            Watch Now
          </button>

          <button
            onClick={() => onTrailer(item)}
            className="px-4 py-3 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-white font-semibold text-sm flex items-center gap-2 border border-neutral-700/80 backdrop-blur-md hover:scale-105 transition-all"
          >
            <Film className="w-4 h-4 text-neutral-300" />
            Trailer
          </button>

          <button
            onClick={() => onToggleMyList(item)}
            className={`p-3 rounded-xl border backdrop-blur-md transition-all ${
              isInMyList
                ? 'bg-red-950/60 text-red-400 border-red-800'
                : 'bg-neutral-900/80 text-neutral-200 border-neutral-700 hover:bg-neutral-800'
            }`}
            title={isInMyList ? 'Remove from My List' : 'Add to My List'}
          >
            {isInMyList ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </button>

          <button
            onClick={() => onMoreInfo(item)}
            className="px-4 py-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 text-sm font-semibold flex items-center gap-1.5 border border-neutral-800 backdrop-blur-md"
          >
            <Info className="w-4 h-4" /> Details
          </button>
        </div>
      </div>
    </div>
  );
}

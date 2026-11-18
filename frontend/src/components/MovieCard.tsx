import React, { useState } from 'react';
import { Play, Plus, Check, Star, Film, Mic } from 'lucide-react';
import { Movie, Series, WatchProgress } from '../types';

interface MovieCardProps {
  item: Movie | Series;
  onSelect: (item: Movie | Series) => void;
  onWatch?: (item: Movie | Series) => void;
  onToggleMyList?: (item: Movie | Series) => void;
  onSelectInterpreter?: (slug: string) => void;
  isInMyList?: boolean;
  progressPercentage?: number;
  watchProgress?: WatchProgress;
  showRank?: number;
  layout?: 'grid' | 'rail';
}

export function MovieCard({
  item,
  onSelect,
  onWatch,
  onToggleMyList,
  onSelectInterpreter,
  isInMyList = false,
  progressPercentage,
  watchProgress,
  showRank,
  layout = 'grid',
}: MovieCardProps) {
  const effectiveProgress = progressPercentage ?? watchProgress?.percentage;
  const [imgError, setImgError] = useState(false);
  const isSeries = 'seasons' in item;
  const primaryGenre =
    item.genres && item.genres.length > 0
      ? item.genres[0]
          .split('-')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      : 'Drama';

  const badge =
    item.badgeIndicator ||
    (item.releaseYear >= 2024 ? 'NEW' : item.isTrending ? 'UPDATED' : null);

  return (
    <div
      onClick={() => onSelect(item)}
      className={`group relative flex flex-col rounded-xl overflow-hidden bg-[#0d111a] border border-neutral-800/90 hover:border-amber-500/60 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-amber-950/20 ${
        layout === 'rail'
          ? showRank
            ? 'w-44 sm:w-52 md:w-56 flex-shrink-0'
            : 'w-40 sm:w-48 md:w-52 flex-shrink-0'
          : 'w-full'
      }`}
    >
      {/* Top-10 Rank Number Overlay */}
      {showRank && (
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 z-20 pointer-events-none select-none">
          <span
            className="text-6xl sm:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-amber-400 via-red-600 to-black/90 drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]"
            style={{ WebkitTextStroke: '1.5px rgba(255,255,255,0.28)' }}
          >
            {showRank}
          </span>
        </div>
      )}

      {/* Poster Container (2:3 Aspect Ratio) */}
      <div className="relative w-full aspect-[2/3] overflow-hidden bg-neutral-900">
        {!imgError && item.posterUrl ? (
          <img
            src={item.posterUrl}
            alt={item.title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-900 via-red-950/40 to-neutral-950 flex flex-col items-center justify-center p-4 text-center">
            <Film className="w-9 h-9 text-red-500/60 mb-2" />
            <span className="text-xs font-bold text-neutral-200 line-clamp-2">{item.title}</span>
            <span className="text-[10px] text-neutral-500 mt-1">{item.releaseYear}</span>
          </div>
        )}

        {/* Subtle Bottom Vignette on Poster */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d111a] via-transparent to-black/30 opacity-90" />

        {/* Top Left: Movie or Series Label */}
        <div className="absolute top-2 left-2 flex flex-wrap items-center gap-1 z-10">
          <span
            className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded shadow-md ${
              isSeries
                ? 'bg-indigo-600/95 text-white border border-indigo-400/40'
                : 'bg-red-600/95 text-white border border-red-400/40'
            }`}
          >
            {isSeries ? 'SERIES' : 'FILIME'}
          </span>
        </div>

        {/* Top Right: NEW or UPDATED Indicator */}
        {badge && (
          <div className="absolute top-2 right-2 z-10">
            <span
              className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded shadow-md ${
                badge === 'NEW'
                  ? 'bg-amber-400 text-neutral-950'
                  : 'bg-emerald-500 text-neutral-950'
              }`}
            >
              {badge === 'NEW' ? 'NEW' : 'UPDATED'}
            </span>
          </div>
        )}

        {/* Bottom Left on Poster: Interpreter Badge */}
        {item.interpreterName && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              if (onSelectInterpreter && item.interpreterSlug) {
                onSelectInterpreter(item.interpreterSlug);
              } else {
                onSelect(item);
              }
            }}
            className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-lg bg-black/85 hover:bg-amber-500 hover:text-neutral-950 text-amber-300 border border-amber-500/40 backdrop-blur-md transition-colors text-left group/interp"
            title={`Umusobanuzi: ${item.interpreterName}`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Mic className="w-3 h-3 text-amber-400 group-hover/interp:text-neutral-950 flex-shrink-0" />
              <span className="text-[11px] font-extrabold truncate">{item.interpreterName}</span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider opacity-80 flex-shrink-0">
              HD
            </span>
          </button>
        )}

        {/* Hover Play Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              if (onWatch) onWatch(item);
              else onSelect(item);
            }}
            aria-label={`Watch ${item.title}`}
            className="w-11 h-11 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform"
          >
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </button>
          {onToggleMyList && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onToggleMyList(item);
              }}
              aria-label={isInMyList ? 'Remove from watchlist' : 'Add to watchlist'}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${
                isInMyList
                  ? 'bg-amber-500 text-neutral-950 border-amber-400'
                  : 'bg-neutral-900/90 text-white border-neutral-600 hover:border-white'
              }`}
            >
              {isInMyList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Continue Watching Progress Bar */}
        {effectiveProgress !== undefined && effectiveProgress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800 z-20">
            <div
              className="h-full bg-red-600 transition-all duration-300"
              style={{ width: `${Math.min(100, effectiveProgress)}%` }}
            />
          </div>
        )}
      </div>

      {/* Card Footer Metadata: Title, Release Year, Genre, Rating */}
      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between bg-[#0d111a]">
        <div>
          <h3 className="font-bold text-xs sm:text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-1 leading-snug">
            {item.title}
          </h3>
          <div className="mt-1 flex items-center justify-between gap-1 text-[11px] text-neutral-400">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-semibold text-neutral-300">{item.releaseYear}</span>
              <span className="text-neutral-600">•</span>
              <span className="truncate text-neutral-400">{primaryGenre}</span>
            </div>
            <span className="flex items-center gap-0.5 text-amber-400 font-bold flex-shrink-0">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {item.averageRating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

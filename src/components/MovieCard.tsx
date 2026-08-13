import React from 'react';
import { Play, Plus, Check, Star, ShieldCheck } from 'lucide-react';
import { Movie, Series, WatchProgress } from '../types';

interface MovieCardProps {
  key?: string;
  item: Movie | Series;
  rank?: number;
  watchProgress?: WatchProgress;
  onSelect: (item: Movie | Series) => void;
  onWatch: (item: Movie | Series) => void;
  onToggleMyList?: (item: Movie | Series) => void;
  isInMyList?: boolean;
}

export function MovieCard({
  item,
  rank,
  watchProgress,
  onSelect,
  onWatch,
  onToggleMyList,
  isInMyList = false,
}: MovieCardProps) {
  const isMovie = 'durationMinutes' in item;

  return (
    <div className="group relative flex-none w-36 sm:w-44 md:w-52 flex flex-col cursor-pointer select-none">
      {/* Top 10 Ranking Badge */}
      {rank !== undefined && (
        <div className="absolute -left-3 -top-2 z-20 font-black text-5xl sm:text-6xl tracking-tighter text-neutral-900 stroke-red-600 drop-shadow-[0_2px_4px_rgba(229,9,20,0.8)] select-none pointer-events-none">
          <span className="bg-clip-text text-transparent bg-gradient-to-b from-red-500 to-red-800">
            #{rank}
          </span>
        </div>
      )}

      {/* Card Poster Container */}
      <div
        onClick={() => onSelect(item)}
        className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800/80 shadow-md group-hover:shadow-2xl group-hover:border-red-600/60 transition-all duration-300 transform group-hover:-translate-y-1"
      >
        <img
          src={item.posterUrl}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
          {/* Top badges */}
          <div className="flex justify-between items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-red-600 text-white font-extrabold text-[10px]">
              HD
            </span>
            <span className="px-1.5 py-0.5 rounded bg-neutral-900/90 text-neutral-300 text-[10px] font-medium border border-neutral-700">
              {item.maturityRating}
            </span>
          </div>

          {/* Quick Play & Action Buttons */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onWatch(item);
              }}
              className="p-2.5 rounded-full bg-red-600 text-white shadow-lg shadow-red-950 hover:bg-red-500 hover:scale-110 active:scale-95 transition-all"
              title="Watch Now"
            >
              <Play className="w-4 h-4 fill-white" />
            </button>

            {onToggleMyList && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMyList(item);
                }}
                className={`p-2 rounded-full border transition-all ${
                  isInMyList
                    ? 'bg-red-950 text-red-400 border-red-700'
                    : 'bg-neutral-900/90 text-white border-neutral-700 hover:bg-neutral-800'
                }`}
                title={isInMyList ? 'Remove from My List' : 'Add to My List'}
              >
                {isInMyList ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Watch Progress Bar */}
        {watchProgress && watchProgress.percentage > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-neutral-800">
            <div
              className="h-full bg-red-600 transition-all duration-300"
              style={{ width: `${watchProgress.percentage}%` }}
            ></div>
          </div>
        )}
      </div>

      {/* Info below poster */}
      <div className="mt-2 space-y-0.5">
        <h3 className="font-bold text-xs sm:text-sm text-neutral-100 truncate group-hover:text-red-400 transition-colors">
          {item.title}
        </h3>
        <div className="flex items-center justify-between text-[11px] text-neutral-400">
          <span className="flex items-center gap-1 font-medium">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            {item.averageRating}
          </span>
          <span>{item.releaseYear}</span>
          <span className="capitalize">{item.genres[0]}</span>
        </div>
      </div>
    </div>
  );
}

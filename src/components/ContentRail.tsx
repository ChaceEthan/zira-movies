import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { Movie, Series, WatchProgress } from '../types';

interface ContentRailProps {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  items: (Movie | Series)[];
  watchProgressMap?: Record<string, WatchProgress>;
  showRankings?: boolean;
  onSelect: (item: Movie | Series) => void;
  onWatch: (item: Movie | Series) => void;
  onToggleMyList?: (item: Movie | Series) => void;
  myListIds?: string[];
}

export function ContentRail({
  title,
  icon,
  subtitle,
  items,
  watchProgressMap = {},
  showRankings = false,
  onSelect,
  onWatch,
  onToggleMyList,
  myListIds = [],
}: ContentRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const distance = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -distance : distance,
        behavior: 'smooth',
      });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="relative my-6 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-2 sm:px-4">
        <div className="flex items-center gap-2">
          {icon && <span className="text-red-500">{icon}</span>}
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-neutral-400">{subtitle}</p>}
          </div>
        </div>

        {/* Scroll Controls (Desktop) */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontally Scrollable Rail */}
      <div
        ref={scrollRef}
        className="flex items-center gap-3 sm:gap-4 overflow-x-auto scrollbar-none px-2 sm:px-4 py-2 no-scrollbar scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item, idx) => {
          const progress = watchProgressMap[item.id];
          const isInMyList = myListIds.includes(item.id);
          return (
            <MovieCard
              key={item.id}
              item={item}
              rank={showRankings ? idx + 1 : undefined}
              watchProgress={progress}
              onSelect={onSelect}
              onWatch={onWatch}
              onToggleMyList={onToggleMyList}
              isInMyList={isInMyList}
            />
          );
        })}
      </div>
    </section>
  );
}

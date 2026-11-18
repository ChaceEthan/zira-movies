import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Movie, Series, WatchProgress } from '../types';
import { MovieCard } from './MovieCard';

interface ContentRailProps {
  title: string;
  subtitle?: string;
  items: (Movie | Series)[];
  onSelect: (item: Movie | Series) => void;
  onWatch?: (item: Movie | Series) => void;
  onToggleMyList?: (item: Movie | Series) => void;
  onSelectInterpreter?: (slug: string) => void;
  onViewAll?: () => void;
  myListIds?: string[];
  progressMap?: Record<string, WatchProgress>;
  isTop10Rail?: boolean;
  displayMode?: 'grid' | 'rail';
}

export function ContentRail({
  title,
  subtitle,
  items,
  onSelect,
  onWatch,
  onToggleMyList,
  onSelectInterpreter,
  onViewAll,
  myListIds = [],
  progressMap = {},
  isTop10Rail = false,
  displayMode = 'grid',
}: ContentRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!items || items.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const scrollAmount = clientWidth * 0.75;
    scrollRef.current.scrollTo({
      left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="py-3 sm:py-4 relative group/rail">
      <div className="flex items-end justify-between mb-3 px-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-amber-400 to-red-600 inline-block" />
            <h2 className="text-base sm:text-xl font-black text-white tracking-tight">
              {title}
            </h2>
          </div>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5 pl-3.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/40 transition-colors"
            >
              <span>Reba Zose</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {displayMode === 'rail' && (
            <div className="hidden md:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scroll('left')}
                className="p-1.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors"
                aria-label="Scroll Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                className="p-1.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors"
                aria-label="Scroll Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {displayMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {items.map((item, index) => {
            const progress = progressMap[item.id];
            return (
              <MovieCard
                key={item.id}
                item={item}
                layout="grid"
                onSelect={onSelect}
                onWatch={onWatch}
                onToggleMyList={onToggleMyList}
                onSelectInterpreter={onSelectInterpreter}
                isInMyList={myListIds.includes(item.id)}
                progressPercentage={progress?.percentage}
                showRank={isTop10Rail ? item.top10Rank || index + 1 : undefined}
              />
            );
          })}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-2 scroll-smooth"
        >
          {items.map((item, index) => {
            const progress = progressMap[item.id];
            return (
              <MovieCard
                key={item.id}
                item={item}
                layout="rail"
                onSelect={onSelect}
                onWatch={onWatch}
                onToggleMyList={onToggleMyList}
                onSelectInterpreter={onSelectInterpreter}
                isInMyList={myListIds.includes(item.id)}
                progressPercentage={progress?.percentage}
                showRank={isTop10Rail ? item.top10Rank || index + 1 : undefined}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

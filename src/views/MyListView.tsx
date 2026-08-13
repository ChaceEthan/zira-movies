import React from 'react';
import { Bookmark, Film } from 'lucide-react';
import { MovieCard } from '../components/MovieCard';
import { Movie, Series, WatchlistItem, WatchProgress } from '../types';

interface MyListViewProps {
  watchlist: WatchlistItem[];
  watchProgressMap?: Record<string, WatchProgress>;
  onSelectContent: (item: Movie | Series) => void;
  onWatchContent: (item: Movie | Series) => void;
  onToggleMyList: (item: Movie | Series) => void;
  myListIds: string[];
}

export function MyListView({
  watchlist,
  watchProgressMap = {},
  onSelectContent,
  onWatchContent,
  onToggleMyList,
  myListIds,
}: MyListViewProps) {
  const items = watchlist
    .map(w => w.movie || w.series)
    .filter((item): item is Movie | Series => item !== undefined);

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
        <Bookmark className="w-8 h-8 text-red-500" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">My List</h1>
          <p className="text-xs text-neutral-400">Your saved movies and series ready to stream anytime</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-neutral-900/30 rounded-2xl border border-neutral-800 space-y-3">
          <Film className="w-12 h-12 text-neutral-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">Your List is Empty</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Explore movies and series on ZIRA and tap the plus button to add titles to your personal list.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {items.map(item => (
            <div key={item.id} className="w-full flex justify-center">
              <MovieCard
                item={item}
                watchProgress={watchProgressMap[item.id]}
                onSelect={onSelectContent}
                onWatch={onWatchContent}
                onToggleMyList={onToggleMyList}
                isInMyList={true}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

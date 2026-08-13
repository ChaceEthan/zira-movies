import React, { useState, useMemo } from 'react';
import { MovieCard } from '../components/MovieCard';
import { Movie, Series, Genre, WatchProgress } from '../types';
import { Search, Filter, Film, Tv, Sparkles } from 'lucide-react';

interface BrowseViewProps {
  movies: Movie[];
  series: Series[];
  genres: Genre[];
  initialSearchQuery?: string;
  watchProgressMap?: Record<string, WatchProgress>;
  onSelectContent: (item: Movie | Series) => void;
  onWatchContent: (item: Movie | Series) => void;
  onToggleMyList?: (item: Movie | Series) => void;
  myListIds?: string[];
}

export function BrowseView({
  movies,
  series,
  genres,
  initialSearchQuery = '',
  watchProgressMap = {},
  onSelectContent,
  onWatchContent,
  onToggleMyList,
  myListIds = [],
}: BrowseViewProps) {
  const [query, setQuery] = useState(initialSearchQuery);
  const [selectedType, setSelectedType] = useState<'ALL' | 'MOVIES' | 'SERIES'>('ALL');
  const [selectedGenre, setSelectedGenre] = useState<string>('ALL');
  const [selectedMaturity, setSelectedMaturity] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'views'>('newest');

  const filteredItems = useMemo(() => {
    let list: (Movie | Series)[] = [];
    if (selectedType === 'MOVIES') list = movies;
    else if (selectedType === 'SERIES') list = series;
    else list = [...movies, ...series];

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        ('cast' in item && item.cast.some(c => c.toLowerCase().includes(q)))
      );
    }

    if (selectedGenre !== 'ALL') {
      list = list.filter(item => item.genres.includes(selectedGenre));
    }

    if (selectedMaturity !== 'ALL') {
      list = list.filter(item => item.maturityRating === selectedMaturity);
    }

    if (sortBy === 'rating') {
      list.sort((a, b) => b.averageRating - a.averageRating);
    } else if (sortBy === 'views') {
      list.sort((a, b) => b.viewCount - a.viewCount);
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [movies, series, selectedType, query, selectedGenre, selectedMaturity, sortBy]);

  return (
    <div className="space-y-6 pb-16">
      {/* Search Header & Filter Controls */}
      <div className="space-y-4 bg-neutral-900/60 p-4 sm:p-6 rounded-2xl border border-neutral-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              <Film className="w-7 h-7 text-red-500" />
              Browse ZIRA Catalog
            </h1>
            <p className="text-xs text-neutral-400">Discover authorized movies, originals, and series from Rwanda & worldwide</p>
          </div>

          {/* Type Selector Pills */}
          <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => setSelectedType('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedType === 'ALL' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Content
            </button>
            <button
              onClick={() => setSelectedType('MOVIES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedType === 'MOVIES' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Movies
            </button>
            <button
              onClick={() => setSelectedType('SERIES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedType === 'SERIES' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Series
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-neutral-800/80">
          {/* Search Input */}
          <div className="col-span-2 sm:col-span-1 relative">
            <input
              type="text"
              placeholder="Search title, cast..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-600"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
          </div>

          {/* Genre Dropdown */}
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="w-full py-2 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-red-600 capitalize"
          >
            <option value="ALL">All Genres</option>
            {genres.map(g => (
              <option key={g.id} value={g.slug}>
                {g.name}
              </option>
            ))}
          </select>

          {/* Maturity Filter */}
          <select
            value={selectedMaturity}
            onChange={(e) => setSelectedMaturity(e.target.value)}
            className="w-full py-2 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-red-600"
          >
            <option value="ALL">All Maturity Ratings</option>
            <option value="G">G - All Ages</option>
            <option value="PG">PG - Parent Guidance</option>
            <option value="PG-13">PG-13</option>
            <option value="R">R - 18+</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full py-2 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-red-600"
          >
            <option value="newest">Sort: Recently Added</option>
            <option value="rating">Sort: Highest Rated</option>
            <option value="views">Sort: Most Popular</option>
          </select>
        </div>
      </div>

      {/* Grid of Results */}
      <div>
        <div className="flex justify-between items-center mb-4 px-1">
          <span className="text-xs font-semibold text-neutral-400">
            Showing {filteredItems.length} titles
          </span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-16 space-y-3 bg-neutral-900/30 rounded-2xl border border-neutral-800">
            <Film className="w-12 h-12 text-neutral-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No content matched your search</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Try adjusting your search keywords, clear genre filters, or choose "All Content".
            </p>
            <button
              onClick={() => {
                setQuery('');
                setSelectedGenre('ALL');
                setSelectedMaturity('ALL');
                setSelectedType('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-neutral-800 text-white text-xs font-semibold hover:bg-neutral-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {filteredItems.map(item => {
              const progress = watchProgressMap[item.id];
              const isInMyList = myListIds.includes(item.id);
              return (
                <div key={item.id} className="w-full flex justify-center">
                  <MovieCard
                    item={item}
                    watchProgress={progress}
                    onSelect={onSelectContent}
                    onWatch={onWatchContent}
                    onToggleMyList={onToggleMyList}
                    isInMyList={isInMyList}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

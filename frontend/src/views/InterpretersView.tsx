import React, { useState } from 'react';
import {
  Mic,
  Film,
  Tv,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  Search,
  Info,
  Award,
} from 'lucide-react';
import { Interpreter, Movie, Series } from '../types';
import { MovieCard } from '../components/MovieCard';

interface InterpretersViewProps {
  interpreters: Interpreter[];
  movies: Movie[];
  series: Series[];
  selectedSlug: string | null;
  onSelectInterpreter: (slug: string | null) => void;
  onSelectContent: (item: Movie | Series) => void;
  onWatchContent: (item: Movie | Series) => void;
  onToggleMyList: (item: Movie | Series) => void;
  myListIds: string[];
}

export function InterpretersView({
  interpreters,
  movies,
  series,
  selectedSlug,
  onSelectInterpreter,
  onSelectContent,
  onWatchContent,
  onToggleMyList,
  myListIds,
}: InterpretersViewProps) {
  const [filterText, setFilterText] = useState('');

  const activeInterpreters = interpreters.filter(i => i.active);
  const selectedInterpreter = selectedSlug
    ? activeInterpreters.find(i => i.slug === selectedSlug) || null
    : null;

  // Individual Interpreter Profile View
  if (selectedInterpreter) {
    const interpMovies =
      selectedInterpreter.publishedMovies && selectedInterpreter.publishedMovies.length > 0
        ? selectedInterpreter.publishedMovies
        : movies.filter(m => m.interpreterSlug === selectedInterpreter.slug);

    const interpSeries =
      selectedInterpreter.publishedSeries && selectedInterpreter.publishedSeries.length > 0
        ? selectedInterpreter.publishedSeries
        : series.filter(s => s.interpreterSlug === selectedInterpreter.slug);

    const allInterpContent: (Movie | Series)[] = [...interpMovies, ...interpSeries];

    return (
      <div className="space-y-6 pb-16">
        <button
          type="button"
          onClick={() => onSelectInterpreter(null)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-bold border border-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>Subira ku Basobanuzi Bose (All Interpreters)</span>
        </button>

        {/* Interpreter Profile Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0e131f] via-[#131926] to-[#1e140a] border border-neutral-800 p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <img
              src={selectedInterpreter.photoUrl}
              alt={selectedInterpreter.displayName}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-amber-500/50 shadow-xl flex-shrink-0"
            />

            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Mic className="w-3.5 h-3.5" />
                  <span>Umusobanuzi</span>
                </span>
                {selectedInterpreter.isFeatured && (
                  <span className="px-2.5 py-1 rounded-full bg-red-600/20 text-red-300 border border-red-500/40 text-[11px] font-bold flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>Featured</span>
                  </span>
                )}
                {selectedInterpreter.isExampleProfile && (
                  <span className="px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700 text-[10px] font-semibold">
                    Illustrative Example Profile
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {selectedInterpreter.displayName}
              </h1>

              <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
                {selectedInterpreter.biography}
              </p>

              {/* Specialty Genres */}
              {selectedInterpreter.specialtyGenres?.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {selectedInterpreter.specialtyGenres.map(g => (
                    <span
                      key={g}
                      className="px-2.5 py-0.5 rounded-lg bg-neutral-900/90 text-neutral-300 border border-neutral-800 text-[11px] font-semibold capitalize"
                    >
                      {g.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
              )}

              {/* Social Links */}
              {selectedInterpreter.socialLinks &&
                Object.values(selectedInterpreter.socialLinks).some(Boolean) && (
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {Object.entries(selectedInterpreter.socialLinks).map(([platform, url]) => {
                      if (!url) return null;
                      return (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-bold text-amber-400 border border-neutral-800 capitalize transition-colors"
                        >
                          <span>{platform}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      );
                    })}
                  </div>
                )}
            </div>

            {/* Stats Card */}
            <div className="w-full md:w-auto grid grid-cols-3 gap-2.5 bg-black/40 border border-neutral-800/90 rounded-2xl p-4">
              <div className="text-center px-2">
                <div className="text-xl sm:text-2xl font-black text-amber-400">
                  {interpMovies.length}
                </div>
                <div className="text-[10px] font-bold uppercase text-neutral-400">Filime</div>
              </div>
              <div className="text-center px-2 border-x border-neutral-800">
                <div className="text-xl sm:text-2xl font-black text-red-400">
                  {interpSeries.length}
                </div>
                <div className="text-[10px] font-bold uppercase text-neutral-400">Series</div>
              </div>
              <div className="text-center px-2">
                <div className="text-xl sm:text-2xl font-black text-white">
                  {allInterpContent.length}
                </div>
                <div className="text-[10px] font-bold uppercase text-neutral-400">Zose Hamwe</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Associated with this Interpreter */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-amber-400" />
              <span>
                Filime na Series za {selectedInterpreter.displayName} ({allInterpContent.length})
              </span>
            </h2>
          </div>

          {allInterpContent.length === 0 ? (
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-10 text-center space-y-2">
              <Mic className="w-10 h-10 text-neutral-600 mx-auto" />
              <p className="text-sm font-bold text-neutral-300">
                Nta filime zemewe zirashyirwa kuri uyu musobanuzi.
              </p>
              <p className="text-xs text-neutral-500">
                Ubuyobozi bwa ZIRA bushobora kongeramo filime binyuze muri Admin Console.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {allInterpContent.map(item => (
                <MovieCard
                  key={item.id}
                  item={item}
                  layout="grid"
                  onSelect={onSelectContent}
                  onWatch={onWatchContent}
                  onToggleMyList={onToggleMyList}
                  onSelectInterpreter={slug => onSelectInterpreter(slug)}
                  isInMyList={myListIds.includes(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Directory of All Interpreters
  const filteredInterpreters = activeInterpreters.filter(
    interp =>
      interp.displayName.toLowerCase().includes(filterText.toLowerCase()) ||
      interp.biography.toLowerCase().includes(filterText.toLowerCase()) ||
      interp.specialtyGenres?.some(g => g.toLowerCase().includes(filterText.toLowerCase())),
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0e131f] via-[#151c2c] to-[#1f1508] border border-neutral-800 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-extrabold">
            <Mic className="w-3.5 h-3.5" />
            <span>ABASOBANUZI BA FILIME</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Hitamo Umusobanuzi Ukunda
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            Kanda ku izina ry'umusobanuzi urebe filime na series zose zifite uburenganzira bwemewe ziri kumwe n'uwo musobanuzi.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            placeholder="Shakisha umusobanuzi (Rocky, Sankara...)"
            className="w-full bg-neutral-900 border border-neutral-700 focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Transparency Notice for Example Profiles */}
      <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800/80 p-3.5 sm:p-4 flex items-start gap-3 text-xs text-neutral-400">
        <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p>
          <strong className="text-neutral-200">Icyitonderwa ku Myirondoro y'Abasobanuzi:</strong> Imyirondoro irangwa n'ikirango cya{' '}
          <span className="text-amber-300 font-semibold">Illustrative Example Profile</span> ni ingero zigaragaza imikorere ya sisitemu y'Abasobanuzi kuri ZIRA kandi ivugururwa n'ubuyobozi bwa ZIRA muri Admin Console.
        </p>
      </div>

      {/* Interpreters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInterpreters.map(interp => {
          const movieCount =
            interp.movieCount ??
            movies.filter(m => m.interpreterSlug === interp.slug).length;
          const seriesCount =
            interp.seriesCount ??
            series.filter(s => s.interpreterSlug === interp.slug).length;
          const totalCount = interp.totalContentCount ?? movieCount + seriesCount;

          return (
            <div
              key={interp.id}
              onClick={() => onSelectInterpreter(interp.slug)}
              className="group rounded-2xl bg-[#0d111a] hover:bg-[#111726] border border-neutral-800 hover:border-amber-500/60 p-5 cursor-pointer transition-all shadow-lg flex flex-col justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <img
                  src={interp.photoUrl}
                  alt={interp.displayName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-amber-500/40 group-hover:scale-105 transition-transform flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white group-hover:text-amber-400 transition-colors truncate">
                      {interp.displayName}
                    </h2>
                    {interp.isFeatured && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                    {interp.biography}
                  </p>
                  {interp.specialtyGenres?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {interp.specialtyGenres.slice(0, 3).map(g => (
                        <span
                          key={g}
                          className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-800 text-[10px] font-semibold capitalize"
                        >
                          {g.replace(/-/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-neutral-300 font-semibold">
                  <span className="flex items-center gap-1">
                    <Film className="w-3.5 h-3.5 text-red-500" />
                    {movieCount} Filime
                  </span>
                  <span className="flex items-center gap-1">
                    <Tv className="w-3.5 h-3.5 text-indigo-400" />
                    {seriesCount} Series
                  </span>
                </div>
                <span className="text-amber-400 font-extrabold group-hover:translate-x-0.5 transition-transform">
                  Reba Zose ({totalCount}) →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

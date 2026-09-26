import React, { useState } from 'react';
import { Play, Plus, Check, Star, Share2, Tv, Clock, Film } from 'lucide-react';
import { Series, Episode, WatchProgress } from '../types';
import { MonetagAd } from '../components/MonetagAd';

interface SeriesDetailsViewProps {
  series: Series;
  watchProgressList: WatchProgress[];
  onPlayEpisode: (series: Series, episode: Episode) => void;
  onTrailer: (series: Series) => void;
  onToggleMyList: (series: Series) => void;
  isInMyList: boolean;
}

export function SeriesDetailsView({
  series,
  watchProgressList,
  onPlayEpisode,
  onTrailer,
  onToggleMyList,
  isInMyList,
}: SeriesDetailsViewProps) {
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);

  const activeSeason = series.seasons.find(s => s.seasonNumber === selectedSeasonNumber) || series.seasons[0];

  // Watch progress map for episodes
  const episodeProgressMap: Record<string, WatchProgress> = {};
  watchProgressList.forEach(wp => {
    if (wp.episodeId) episodeProgressMap[wp.episodeId] = wp;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Backdrop Header */}
      <div className="relative w-full h-[55vh] min-h-[400px] max-h-[550px] overflow-hidden rounded-3xl border border-neutral-800 shadow-2xl">
        <img
          src={series.backdropUrl}
          alt={series.title}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/60 to-transparent"></div>

        <div className="absolute bottom-0 left-0 p-6 md:p-12 max-w-3xl z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            {series.isRwandanContent && (
              <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 font-bold">
                🇷🇼 Rwandan Series
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
              {series.maturityRating}
            </span>
            <span className="text-neutral-400 font-bold">
              {series.seasons.length} Season{series.seasons.length > 1 ? 's' : ''}
            </span>
            <span className="text-neutral-400">{series.releaseYear}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {series.title}
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-neutral-300 leading-relaxed max-w-2xl">
            {series.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {activeSeason && activeSeason.episodes.length > 0 && (
              <button
                onClick={() => onPlayEpisode(series, activeSeason.episodes[0])}
                className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm sm:text-base flex items-center gap-2 shadow-xl shadow-red-950 hover:scale-105 active:scale-95 transition-all"
              >
                <Play className="w-5 h-5 fill-white" />
                Start S1:E1
              </button>
            )}

            <button
              onClick={() => onTrailer(series)}
              className="px-4 py-3 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 text-white font-semibold text-sm flex items-center gap-2 border border-neutral-700 backdrop-blur-md"
            >
              <Film className="w-4 h-4" />
              Trailer
            </button>

            <button
              onClick={() => onToggleMyList(series)}
              className={`p-3 rounded-xl border backdrop-blur-md transition-all ${
                isInMyList
                  ? 'bg-red-950/80 text-red-400 border-red-800'
                  : 'bg-neutral-900/80 text-neutral-200 border-neutral-700 hover:bg-neutral-800'
              }`}
              title={isInMyList ? 'Remove from My List' : 'Add to My List'}
            >
              {isInMyList ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <MonetagAd placement="SERIES_DETAILS_BANNER" />

      {/* Season Picker Tabs */}
      {series.seasons.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <span className="font-bold text-white text-sm mr-2">Seasons:</span>
            {series.seasons.map(sea => (
              <button
                key={sea.id}
                onClick={() => setSelectedSeasonNumber(sea.seasonNumber)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedSeasonNumber === sea.seasonNumber
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                Season {sea.seasonNumber}
              </button>
            ))}
          </div>

          {/* Episode Cards Grid */}
          {activeSeason && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Episodes ({activeSeason.episodes.length})</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeSeason.episodes.map(ep => {
                  const progress = episodeProgressMap[ep.id];
                  return (
                    <div
                      key={ep.id}
                      onClick={() => onPlayEpisode(series, ep)}
                      className="group bg-neutral-900/60 border border-neutral-800 hover:border-red-600/50 rounded-2xl p-3 flex gap-3 cursor-pointer shadow-md transition-all"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-36 aspect-video rounded-xl overflow-hidden bg-neutral-800 flex-shrink-0">
                        <img
                          src={ep.thumbnailUrl}
                          alt={ep.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                          <div className="p-2 rounded-full bg-red-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="w-4 h-4 fill-white" />
                          </div>
                        </div>

                        {progress && progress.percentage > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800">
                            <div className="h-full bg-red-600" style={{ width: `${progress.percentage}%` }}></div>
                          </div>
                        )}
                      </div>

                      {/* Episode Metadata */}
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="font-bold text-xs sm:text-sm text-white group-hover:text-red-400 transition-colors line-clamp-1">
                              {ep.title}
                            </h4>
                          </div>
                          <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                            {ep.description}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-neutral-500 mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {ep.durationMinutes}m
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

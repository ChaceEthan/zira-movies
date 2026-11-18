import React from 'react';
import { HeroBanner } from '../components/HeroBanner';
import { ContentRail } from '../components/ContentRail';
import { SponsorBanner } from '../components/SponsorBanner';
import { MonetagAd } from '../components/MonetagAd';
import { Movie, Series, WatchProgress, SponsorBannerPlacement } from '../types';
import { Flame, Sparkles, Trophy, Globe, Film, Tv } from 'lucide-react';

interface HomeViewProps {
  movies: Movie[];
  series: Series[];
  watchProgressList: WatchProgress[];
  onSelectContent: (item: Movie | Series) => void;
  onWatchContent: (item: Movie | Series) => void;
  onTrailerContent: (item: Movie | Series) => void;
  onToggleMyList: (item: Movie | Series) => void;
  myListIds: string[];
  sponsorPlacement: SponsorBannerPlacement | null;
  onTrackSponsorClick: (campaignId: string, type: string) => void;
}

export function HomeView({
  movies,
  series,
  watchProgressList,
  onSelectContent,
  onWatchContent,
  onTrailerContent,
  onToggleMyList,
  myListIds,
  sponsorPlacement,
  onTrackSponsorClick,
}: HomeViewProps) {
  const heroItem = movies.find(m => m.isFeatured) || series.find(s => s.isFeatured) || movies[0];

  const watchProgressMap: Record<string, WatchProgress> = {};
  watchProgressList.forEach(wp => {
    if (wp.movieId) watchProgressMap[wp.movieId] = wp;
    if (wp.seriesId) watchProgressMap[wp.seriesId] = wp;
  });

  const continueWatchingItems = watchProgressList
    .map(wp => {
      if (wp.movieId) return movies.find(m => m.id === wp.movieId);
      if (wp.seriesId) return series.find(s => s.id === wp.seriesId);
      return null;
    })
    .filter((item): item is Movie | Series => item !== null && item !== undefined);

  const trendingItems = [...movies, ...series].filter(item => item.isTrending);
  const popularMovies = [...movies].sort((a, b) => b.viewCount - a.viewCount).slice(0, 14);
  const popularSeries = [...series].sort((a, b) => b.viewCount - a.viewCount);
  const top10Items = [...movies, ...series]
    .filter(item => item.isTop10)
    .sort((a, b) => (a.top10Rank || 99) - (b.top10Rank || 99));
  const rwandanItems = [...movies, ...series].filter(item => item.isRwandanContent);
  const africanItems = [...movies, ...series].filter(item => item.isAfricanContent);

  const actionItems = movies.filter(m => m.genres.includes('action') || m.genres.includes('adventure'));
  const sciFiItems = [...movies, ...series].filter(m => m.genres.includes('sci-fi'));
  const thrillerHorrorItems = [...movies, ...series].filter(m => m.genres.includes('thriller') || m.genres.includes('horror'));
  const comedyRomanceItems = [...movies, ...series].filter(m => m.genres.includes('comedy') || m.genres.includes('romance'));
  const dramaItems = movies.filter(m => m.genres.includes('drama'));
  const docAnimItems = [...movies, ...series].filter(m => m.genres.includes('documentary') || m.genres.includes('animation'));

  return (
    <div className="space-y-6 pb-12">
      {/* Featured Hero Banner */}
      {heroItem && (
        <HeroBanner
          item={heroItem}
          onWatch={onWatchContent}
          onTrailer={onTrailerContent}
          onToggleMyList={onToggleMyList}
          isInMyList={myListIds.includes(heroItem.id)}
          onMoreInfo={onSelectContent}
        />
      )}

      <MonetagAd placement="HOME_BOTTOM_BANNER" />

      {/* Continue Watching Rail */}
      {continueWatchingItems.length > 0 && (
        <ContentRail
          title="Continue Watching"
          icon={<Flame className="w-5 h-5 text-red-500" />}
          subtitle="Resume right where you left off in this browser"
          items={continueWatchingItems}
          watchProgressMap={watchProgressMap}
          onSelect={onSelectContent}
          onWatch={onWatchContent}
          onToggleMyList={onToggleMyList}
          myListIds={myListIds}
        />
      )}

      {/* Trending Now Rail */}
      <ContentRail
        title="Trending Now"
        icon={<Flame className="w-5 h-5 text-red-500" />}
        subtitle="Most watched movies and series across ZIRA right now"
        items={trendingItems}
        watchProgressMap={watchProgressMap}
        onSelect={onSelectContent}
        onWatch={onWatchContent}
        onToggleMyList={onToggleMyList}
        myListIds={myListIds}
      />

      {/* Popular Movies Rail */}
      <ContentRail
        title="Popular Movies"
        icon={<Sparkles className="w-5 h-5 text-amber-400" />}
        subtitle="Blockbuster features, open cinema hits, and audience favorites"
        items={popularMovies}
        watchProgressMap={watchProgressMap}
        onSelect={onSelectContent}
        onWatch={onWatchContent}
        onToggleMyList={onToggleMyList}
        myListIds={myListIds}
      />

      <MonetagAd placement="HOME_BETWEEN_RAILS" />

      {/* Direct Sponsor Banner Placement */}
      <SponsorBanner placementData={sponsorPlacement} onTrackClick={onTrackSponsorClick} />

      {/* Top 10 Today */}
      <ContentRail
        title="Top 10 Today"
        icon={<Trophy className="w-5 h-5 text-yellow-500" />}
        subtitle="Ranked daily based on viewer activity"
        items={top10Items}
        showRankings={true}
        watchProgressMap={watchProgressMap}
        onSelect={onSelectContent}
        onWatch={onWatchContent}
        onToggleMyList={onToggleMyList}
        myListIds={myListIds}
      />

      {/* Popular TV Series */}
      {popularSeries.length > 0 && (
        <ContentRail
          title="Binge-Worthy TV Series"
          icon={<Tv className="w-5 h-5 text-red-400" />}
          subtitle="Multi-episode originals, mysteries, and anthology series"
          items={popularSeries}
          watchProgressMap={watchProgressMap}
          onSelect={onSelectContent}
          onWatch={onWatchContent}
          onToggleMyList={onToggleMyList}
          myListIds={myListIds}
        />
      )}

      {/* Rwandan Cinema Showcase */}
      <ContentRail
        title="Rwanda & East African Cinema"
        icon={<Globe className="w-5 h-5 text-yellow-400" />}
        subtitle="Proudly made in Rwanda & East Africa with local storytellers and cast"
        items={rwandanItems}
        watchProgressMap={watchProgressMap}
        onSelect={onSelectContent}
        onWatch={onWatchContent}
        onToggleMyList={onToggleMyList}
        myListIds={myListIds}
      />

      {/* African Movies & Series */}
      <ContentRail
        title="African Cinema & Pan-African Hits"
        icon={<Globe className="w-5 h-5 text-emerald-400" />}
        subtitle="Acclaimed cinema from across the African continent"
        items={africanItems}
        watchProgressMap={watchProgressMap}
        onSelect={onSelectContent}
        onWatch={onWatchContent}
        onToggleMyList={onToggleMyList}
        myListIds={myListIds}
      />

      {/* Action & Adventure */}
      {actionItems.length > 0 && (
        <ContentRail
          title="Action & High-Octane Adventure"
          icon={<Film className="w-5 h-5 text-red-400" />}
          items={actionItems}
          watchProgressMap={watchProgressMap}
          onSelect={onSelectContent}
          onWatch={onWatchContent}
          onToggleMyList={onToggleMyList}
          myListIds={myListIds}
        />
      )}

      {/* Science Fiction */}
      {sciFiItems.length > 0 && (
        <ContentRail
          title="Science Fiction & Future Worlds"
          icon={<Sparkles className="w-5 h-5 text-cyan-400" />}
          items={sciFiItems}
          watchProgressMap={watchProgressMap}
          onSelect={onSelectContent}
          onWatch={onWatchContent}
          onToggleMyList={onToggleMyList}
          myListIds={myListIds}
        />
      )}

      {/* Thrillers & Horror */}
      {thrillerHorrorItems.length > 0 && (
        <ContentRail
          title="Suspense, Thrillers & Late-Night Horror"
          icon={<Film className="w-5 h-5 text-purple-400" />}
          items={thrillerHorrorItems}
          watchProgressMap={watchProgressMap}
          onSelect={onSelectContent}
          onWatch={onWatchContent}
          onToggleMyList={onToggleMyList}
          myListIds={myListIds}
        />
      )}

      {/* Comedy & Romance */}
      {comedyRomanceItems.length > 0 && (
        <ContentRail
          title="Comedy & Romance"
          icon={<Film className="w-5 h-5 text-pink-400" />}
          items={comedyRomanceItems}
          watchProgressMap={watchProgressMap}
          onSelect={onSelectContent}
          onWatch={onWatchContent}
          onToggleMyList={onToggleMyList}
          myListIds={myListIds}
        />
      )}

      {/* Drama */}
      {dramaItems.length > 0 && (
        <ContentRail
          title="Acclaimed Dramas"
          icon={<Film className="w-5 h-5 text-blue-400" />}
          items={dramaItems}
          watchProgressMap={watchProgressMap}
          onSelect={onSelectContent}
          onWatch={onWatchContent}
          onToggleMyList={onToggleMyList}
          myListIds={myListIds}
        />
      )}

      {/* Animation & Documentary */}
      {docAnimItems.length > 0 && (
        <ContentRail
          title="Animation & Documentaries"
          icon={<Film className="w-5 h-5 text-emerald-400" />}
          items={docAnimItems}
          watchProgressMap={watchProgressMap}
          onSelect={onSelectContent}
          onWatch={onWatchContent}
          onToggleMyList={onToggleMyList}
          myListIds={myListIds}
        />
      )}
    </div>
  );
}

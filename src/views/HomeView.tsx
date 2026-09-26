import React from 'react';
import { HeroBanner } from '../components/HeroBanner';
import { ContentRail } from '../components/ContentRail';
import { SponsorBanner } from '../components/SponsorBanner';
import { MonetagAd } from '../components/MonetagAd';
import { Movie, Series, WatchProgress, SponsorBannerPlacement } from '../types';
import { Flame, Sparkles, Trophy, Globe, Heart, Shield, Film, Tv } from 'lucide-react';

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
  // Hero Item: Featured movie or series
  const heroItem = movies.find(m => m.isFeatured) || series.find(s => s.isFeatured) || movies[0];

  // Watch progress map
  const watchProgressMap: Record<string, WatchProgress> = {};
  watchProgressList.forEach(wp => {
    if (wp.movieId) watchProgressMap[wp.movieId] = wp;
    if (wp.seriesId) watchProgressMap[wp.seriesId] = wp;
  });

  // Continue Watching list
  const continueWatchingItems = watchProgressList
    .map(wp => {
      if (wp.movieId) return movies.find(m => m.id === wp.movieId);
      if (wp.seriesId) return series.find(s => s.id === wp.seriesId);
      return null;
    })
    .filter((item): item is Movie | Series => item !== null && item !== undefined);

  // Filtered Rails
  const trendingItems = [...movies, ...series].filter(item => item.isTrending);
  const top10Items = [...movies, ...series].filter(item => item.isTop10).sort((a, b) => (a.top10Rank || 99) - (b.top10Rank || 99));
  const rwandanItems = [...movies, ...series].filter(item => item.isRwandanContent);
  const africanItems = [...movies, ...series].filter(item => item.isAfricanContent);

  const actionItems = movies.filter(m => m.genres.includes('action'));
  const dramaItems = movies.filter(m => m.genres.includes('drama'));
  const documentaryItems = movies.filter(m => m.genres.includes('documentary'));

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
          subtitle="Resume right where you left off"
          items={continueWatchingItems}
          watchProgressMap={watchProgressMap}
          onSelect={onSelectContent}
          onWatch={onWatchContent}
          onToggleMyList={onToggleMyList}
          myListIds={myListIds}
        />
      )}

      {/* Trending in Rwanda Rail */}
      <ContentRail
        title="Trending in Rwanda"
        icon={<Flame className="w-5 h-5 text-red-500" />}
        subtitle="Most watched movies and series across Rwanda right now"
        items={trendingItems}
        watchProgressMap={watchProgressMap}
        onSelect={onSelectContent}
        onWatch={onWatchContent}
        onToggleMyList={onToggleMyList}
        myListIds={myListIds}
      />

      <MonetagAd placement="HOME_BETWEEN_RAILS" />

      {/* Direct Sponsor Banner Placement */}
      <SponsorBanner placementData={sponsorPlacement} onTrackClick={onTrackSponsorClick} />

      {/* Top 10 Today in Rwanda */}
      <ContentRail
        title="Top 10 Today"
        icon={<Trophy className="w-5 h-5 text-yellow-500" />}
        subtitle="Ranked daily based on Rwandan viewer activity"
        items={top10Items}
        showRankings={true}
        watchProgressMap={watchProgressMap}
        onSelect={onSelectContent}
        onWatch={onWatchContent}
        onToggleMyList={onToggleMyList}
        myListIds={myListIds}
      />

      {/* Rwandan Cinema Showcase */}
      <ContentRail
        title="Rwandan Cinema & Original Storytelling"
        icon={<Globe className="w-5 h-5 text-yellow-400" />}
        subtitle="Proudly made in Rwanda with local storytellers and cast"
        items={rwandanItems}
        watchProgressMap={watchProgressMap}
        onSelect={onSelectContent}
        onWatch={onWatchContent}
        onToggleMyList={onToggleMyList}
        myListIds={myListIds}
      />

      {/* African Movies & Series */}
      <ContentRail
        title="African Stories & Hits"
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
          title="Action & High Velocity"
          icon={<Film className="w-5 h-5 text-red-400" />}
          items={actionItems}
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
          title="Deep Dramas & Emotional Tales"
          icon={<Film className="w-5 h-5 text-blue-400" />}
          items={dramaItems}
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

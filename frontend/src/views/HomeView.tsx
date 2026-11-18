import React from 'react';
import { Mic, Crown, Sparkles, Play, ArrowRight, ShieldCheck } from 'lucide-react';
import {
  Movie,
  Series,
  WatchProgress,
  SponsorBannerPlacement,
  Interpreter,
} from '../types';
import { HeroBanner } from '../components/HeroBanner';
import { ContentRail } from '../components/ContentRail';
import { SponsorBanner } from '../components/SponsorBanner';
import { MonetagAd } from '../components/MonetagAd';

interface HomeViewProps {
  movies: Movie[];
  series: Series[];
  interpreters?: Interpreter[];
  watchProgressList: WatchProgress[];
  myListIds: string[];
  onSelectContent: (item: Movie | Series) => void;
  onWatchContent: (item: Movie | Series) => void;
  onPlayTrailer: (item: Movie | Series) => void;
  onToggleMyList: (item: Movie | Series) => void;
  onSelectInterpreter?: (slug: string) => void;
  onNavigateInterpreters?: () => void;
  onNavigateVip?: () => void;
  sponsorBetweenRails: SponsorBannerPlacement | null;
  sponsorBottomBanner: SponsorBannerPlacement | null;
  onTrackSponsorClick: (campaignId: string, type: string) => void;
  hideAds?: boolean;
}

export function HomeView({
  movies,
  series,
  interpreters = [],
  watchProgressList,
  myListIds,
  onSelectContent,
  onWatchContent,
  onPlayTrailer,
  onToggleMyList,
  onSelectInterpreter,
  onNavigateInterpreters,
  onNavigateVip,
  sponsorBetweenRails,
  sponsorBottomBanner,
  onTrackSponsorClick,
  hideAds = false,
}: HomeViewProps) {
  const allContent: (Movie | Series)[] = [...movies, ...series];

  // 1. Featured Movies / Hero Banner
  const featuredItems = allContent.filter(item => item.isFeatured);
  const heroItems = featuredItems.length > 0 ? featuredItems : allContent.slice(0, 5);

  // Build progress map by item ID
  const progressMap: Record<string, WatchProgress> = {};
  watchProgressList.forEach(wp => {
    const id = wp.movieId || wp.seriesId;
    if (id && !wp.completed && wp.percentage > 2 && wp.percentage < 95) {
      progressMap[id] = wp;
    }
  });

  const continueWatchingItems = Object.keys(progressMap)
    .map(id => allContent.find(c => c.id === id))
    .filter((c): c is Movie | Series => c !== undefined);

  // 2. Trending Today
  const trendingToday = allContent
    .filter(item => item.isTrending)
    .sort((a, b) => b.viewCount - a.viewCount);

  // 3. Filime Nshya (New Movies)
  const filimeNshya = [...movies].sort((a, b) => {
    if ((a.badgeIndicator === 'NEW') !== (b.badgeIndicator === 'NEW')) {
      return a.badgeIndicator === 'NEW' ? -1 : 1;
    }
    return b.releaseYear - a.releaseYear;
  });

  // 4. Series Nshya (New Series)
  const seriesNshya = [...series].sort((a, b) => b.releaseYear - a.releaseYear);

  // 5. Filime Zikunzwe (Popular Movies)
  const filimeZikunzwe = [...movies].sort((a, b) => b.viewCount - a.viewCount);

  // 6. Series Zikunzwe (Popular Series)
  const seriesZikunzwe = [...series].sort((a, b) => b.viewCount - a.viewCount);

  // 7. Action
  const actionItems = allContent.filter(
    item => item.genres.includes('action') || item.genres.includes('adventure') || item.genres.includes('sci-fi'),
  );

  // 8. Drama
  const dramaItems = allContent.filter(
    item => item.genres.includes('drama') || item.genres.includes('rwandan-cinema') || item.genres.includes('fantasy'),
  );

  // 9. Comedy
  const comedyItems = allContent.filter(
    item => item.genres.includes('comedy') || item.genres.includes('family') || item.genres.includes('animation'),
  );

  // 10. Horror
  const horrorItems = allContent.filter(
    item => item.genres.includes('horror') || item.genres.includes('mystery') || item.genres.includes('thriller'),
  );

  // 11. Recently Updated
  const recentlyUpdated = [...allContent].sort((a, b) => {
    if ((a.badgeIndicator === 'UPDATED') !== (b.badgeIndicator === 'UPDATED')) {
      return a.badgeIndicator === 'UPDATED' ? -1 : 1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const featuredInterpreters = interpreters.filter(i => i.active);

  return (
    <div className="space-y-4 sm:space-y-6 pb-16">
      {/* 1. Featured Movies / Hero Banner */}
      {heroItems[0] && (
        <HeroBanner
          item={heroItems[0]}
          onWatch={onWatchContent}
          onTrailer={onPlayTrailer}
          onMoreInfo={onSelectContent}
          onToggleMyList={onToggleMyList}
          isInMyList={myListIds.includes(heroItems[0].id)}
        />
      )}

      {/* Free Streaming Guarantee + Optional VIP Highlight Strip */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0d121d] via-[#111827] to-[#1a1409] border border-neutral-800/90 p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
            <Play className="w-5 h-5 text-emerald-400 fill-emerald-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-white">
                Kureba Filime ku Ubuntu (100% Free Authorized Streaming)
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-700/50 text-[10px] font-bold">
                NO COMPULSORY SUBSCRIPTION
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5">
              Reba filime na series zose zemewe ku rubuga rwa ZIRA nta kiguzi. Ushobora no guhitamo VIP kugira ngo ugabanye kwamamaza.
            </p>
          </div>
        </div>

        {onNavigateVip && (
          <button
            type="button"
            onClick={onNavigateVip}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-neutral-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md flex-shrink-0 transition-transform hover:scale-105"
          >
            <Crown className="w-4 h-4 fill-neutral-950" />
            <span>Reba Ibyiza bya VIP</span>
          </button>
        )}
      </div>

      {/* Abasobanuzi (Featured Interpreters Quick Strip) */}
      {featuredInterpreters.length > 0 && (
        <section className="bg-[#0b0f17] border border-neutral-800/90 rounded-2xl p-3.5 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                Abasobanuzi (Interpreters)
              </h2>
              <span className="hidden sm:inline-block text-[10px] font-semibold text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                Hitamo umusobanuzi ukunda
              </span>
            </div>
            {onNavigateInterpreters && (
              <button
                type="button"
                onClick={onNavigateInterpreters}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <span>Abasobanuzi Bose</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar pb-1">
            {featuredInterpreters.map(interp => (
              <button
                key={interp.id}
                type="button"
                onClick={() => onSelectInterpreter && onSelectInterpreter(interp.slug)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/50 transition-all flex-shrink-0 group"
              >
                <img
                  src={interp.photoUrl}
                  alt={interp.displayName}
                  className="w-9 h-9 rounded-full object-cover border border-amber-500/40 group-hover:scale-105 transition-transform"
                />
                <div className="text-left">
                  <div className="text-xs font-extrabold text-white group-hover:text-amber-400 transition-colors">
                    {interp.displayName}
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    {interp.totalContentCount ?? 0} Filime &amp; Series
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Continue Watching Rail (if user has active watch progress) */}
      {continueWatchingItems.length > 0 && (
        <ContentRail
          title="Komeza Kureba (Continue Watching)"
          subtitle="Subukura aho wari ugeze"
          items={continueWatchingItems}
          onSelect={onSelectContent}
          onWatch={onWatchContent}
          onToggleMyList={onToggleMyList}
          onSelectInterpreter={onSelectInterpreter}
          myListIds={myListIds}
          progressMap={progressMap}
        />
      )}

      {/* 2. Trending Today */}
      <ContentRail
        title="Trending Today"
        subtitle="Filime na Series ziri kurebwa cyane uyu munsi"
        items={trendingToday}
        onSelect={onSelectContent}
        onWatch={onWatchContent}
        onToggleMyList={onToggleMyList}
        onSelectInterpreter={onSelectInterpreter}
        myListIds={myListIds}
        isTop10Rail={true}
      />

      {/* Homepage Advertisement Block 1 (Between Sections) */}
      {!hideAds && (
        <>
          <MonetagAd placement="HOME_BETWEEN_RAILS" />
          <SponsorBanner
            placementData={sponsorBetweenRails}
            onTrackClick={onTrackSponsorClick}
          />
        </>
      )}

      {/* 3. Filime Nshya */}
      <ContentRail
        title="Filime Nshya"
        subtitle="Filime nshya zasohotse zifite uburenganzira bwemewe"
        items={filimeNshya}
        onSelect={onSelectContent}
        onWatch={onWatchContent}
        onToggleMyList={onToggleMyList}
        onSelectInterpreter={onSelectInterpreter}
        myListIds={myListIds}
      />

      {/* 4. Series Nshya */}
      <ContentRail
        title="Series Nshya"
        subtitle="Urukurikirane rw'ibice bishya (Seasons &amp; Episodes)"
        items={seriesNshya}
        onSelect={onSelectContent}
        onWatch={onWatchContent}
        onToggleMyList={onToggleMyList}
        onSelectInterpreter={onSelectInterpreter}
        myListIds={myListIds}
      />

      {/* 5. Filime Zikunzwe */}
      <ContentRail
        title="Filime Zikunzwe"
        subtitle="Filime zakunzwe kurusha izindi kuri ZIRA"
        items={filimeZikunzwe}
        onSelect={onSelectContent}
        onWatch={onWatchContent}
        onToggleMyList={onToggleMyList}
        onSelectInterpreter={onSelectInterpreter}
        myListIds={myListIds}
      />

      {/* 6. Series Zikunzwe */}
      <ContentRail
        title="Series Zikunzwe"
        subtitle="Series zikunzwe cyane mu Kinyarwanda n'Icyongereza"
        items={seriesZikunzwe}
        onSelect={onSelectContent}
        onWatch={onWatchContent}
        onToggleMyList={onToggleMyList}
        onSelectInterpreter={onSelectInterpreter}
        myListIds={myListIds}
      />

      {/* 7. Action */}
      <ContentRail
        title="Action"
        subtitle="Filime z'imirwano, ubutwari n'ibikorwa bikomeye"
        items={actionItems}
        onSelect={onSelectContent}
        onWatch={onWatchContent}
        onToggleMyList={onToggleMyList}
        onSelectInterpreter={onSelectInterpreter}
        myListIds={myListIds}
      />

      {/* 8. Drama */}
      <ContentRail
        title="Drama"
        subtitle="Inkuru zikora ku mutima n'ubuzima busanzwe"
        items={dramaItems}
        onSelect={onSelectContent}
        onWatch={onWatchContent}
        onToggleMyList={onToggleMyList}
        onSelectInterpreter={onSelectInterpreter}
        myListIds={myListIds}
      />

      {/* 9. Comedy */}
      <ContentRail
        title="Comedy"
        subtitle="Filime zisekeje kandi zinezeza umuryango wose"
        items={comedyItems}
        onSelect={onSelectContent}
        onWatch={onWatchContent}
        onToggleMyList={onToggleMyList}
        onSelectInterpreter={onSelectInterpreter}
        myListIds={myListIds}
      />

      {/* 10. Horror */}
      <ContentRail
        title="Horror"
        subtitle="Filime ziteye ubwoba, amayobera na suspense"
        items={horrorItems}
        onSelect={onSelectContent}
        onWatch={onWatchContent}
        onToggleMyList={onToggleMyList}
        onSelectInterpreter={onSelectInterpreter}
        myListIds={myListIds}
      />

      {/* 11. Recently Updated */}
      <ContentRail
        title="Recently Updated"
        subtitle="Filime na Series ziherutse kongerwamo cyangwa kuvugururwa"
        items={recentlyUpdated}
        onSelect={onSelectContent}
        onWatch={onWatchContent}
        onToggleMyList={onToggleMyList}
        onSelectInterpreter={onSelectInterpreter}
        myListIds={myListIds}
      />

      {/* Bottom Homepage Advertisement Block */}
      {!hideAds && (
        <>
          <MonetagAd placement="HOME_BOTTOM_BANNER" />
          <SponsorBanner
            placementData={sponsorBottomBanner}
            onTrackClick={onTrackSponsorClick}
          />
        </>
      )}
    </div>
  );
}

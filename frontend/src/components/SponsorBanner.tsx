import React from 'react';
import { ExternalLink, Sparkles, ShieldCheck } from 'lucide-react';
import { SponsorBannerPlacement } from '../types';

interface SponsorBannerProps {
  placementData: SponsorBannerPlacement | null;
  onTrackClick?: (campaignId: string, type: string) => void;
}

export function SponsorBanner({ placementData, onTrackClick }: SponsorBannerProps) {
  if (!placementData) return null;

  const handleClick = () => {
    if (onTrackClick) {
      onTrackClick(placementData.campaignId, placementData.type);
    }
    if (placementData.destinationUrl && placementData.destinationUrl.startsWith('http')) {
      window.open(placementData.destinationUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="w-full my-6 px-2 sm:px-4">
      <div
        onClick={handleClick}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-red-950/40 border border-neutral-800 hover:border-red-600/40 shadow-xl transition-all duration-300 cursor-pointer group"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 gap-4">
          {/* Banner Image */}
          <div className="w-full sm:w-1/3 aspect-[21/9] sm:aspect-[16/9] max-h-36 rounded-xl overflow-hidden bg-neutral-800 relative">
            <img
              src={placementData.imageUrl}
              alt={placementData.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-bold text-red-400 border border-red-800/50 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-red-500" />
              {placementData.type === 'SPONSOR' ? 'DIRECT SPONSOR' : placementData.type === 'AFFILIATE' ? 'FEATURED PARTNER' : 'ZIRA PROMO'}
            </div>
          </div>

          {/* Banner Copy & Call to Action */}
          <div className="flex-1 space-y-1.5 text-left">
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
              <span>{placementData.sponsorName}</span>
            </div>
            <h3 className="text-base sm:text-xl font-bold text-white group-hover:text-red-400 transition-colors">
              {placementData.title}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-300 line-clamp-2 leading-relaxed">
              {placementData.tagline}
            </p>
          </div>

          {/* Action Button */}
          <div className="w-full sm:w-auto flex justify-end">
            <button className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-neutral-800 group-hover:bg-red-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-neutral-700 group-hover:border-red-500 shadow-lg transition-all">
              <span>{placementData.callToAction}</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';

interface ZiraLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
}

export function ZiraLogo({ size = 'md', showTagline = false }: ZiraLogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7 text-sm',
    md: 'w-9 h-9 text-base',
    lg: 'w-12 h-12 text-xl',
    xl: 'w-16 h-16 text-2xl',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  return (
    <div className="flex items-center gap-2.5 select-none group cursor-pointer">
      {/* Icon Emblem: Glowing Crimson Z Badge */}
      <div className={`relative flex items-center justify-center font-black tracking-tighter text-white rounded-xl bg-gradient-to-tr from-red-700 via-red-600 to-rose-500 shadow-lg shadow-red-950/60 border border-red-500/30 ${iconSizes[size]}`}>
        <span className="relative z-10 transform -skew-x-6 drop-shadow-md">Z</span>
        <div className="absolute inset-0 bg-red-500/20 rounded-xl blur-md group-hover:bg-red-500/40 transition-all duration-300"></div>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col">
        <div className={`font-black tracking-wider text-white font-sans ${textSizes[size]}`}>
          ZIRA<span className="text-red-500 font-extrabold">.</span>
        </div>
        {showTagline && (
          <span className="text-[10px] tracking-widest font-semibold text-neutral-400 uppercase -mt-1">
            STREAM • WATCH • ENJOY
          </span>
        )}
      </div>
    </div>
  );
}

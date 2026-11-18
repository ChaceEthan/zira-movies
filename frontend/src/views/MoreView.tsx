import React from 'react';
import {
  Film,
  Tv,
  Mic,
  Crown,
  Bookmark,
  ShieldCheck,
  User as UserIcon,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import { Genre, User } from '../types';
import { NavView } from '../components/Navbar';

interface MoreViewProps {
  genres: Genre[];
  user: User | null;
  onNavigate: (view: NavView) => void;
  onSelectGenre: (genreSlug: string) => void;
  onOpenAuthModal: () => void;
}

export function MoreView({
  genres,
  user,
  onNavigate,
  onSelectGenre,
  onOpenAuthModal,
}: MoreViewProps) {
  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      <div className="rounded-3xl bg-gradient-to-r from-[#0d121d] via-[#131b2e] to-[#1a120b] border border-neutral-800 p-6 sm:p-8 space-y-2 shadow-xl">
        <span className="text-xs font-black uppercase tracking-widest text-amber-400">
          IBINDI • EXPLORE ZIRA
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          Ibindi &amp; Ibyiciro bya Filime
        </h1>
        <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl">
          Shakisha filime ukurikije ibyiciro (Genres), abasobanuzi, urutonde rwawe, cyangwa amakuru ku burenganzira bwa filime.
        </p>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => onNavigate('movies')}
          className="p-4 sm:p-5 rounded-2xl bg-[#0d111a] hover:bg-neutral-900 border border-neutral-800 hover:border-red-500/50 text-left space-y-2 transition-all group"
        >
          <Film className="w-6 h-6 text-red-500 group-hover:scale-110 transition-transform" />
          <div className="font-black text-sm sm:text-base text-white">Filime Zose</div>
          <p className="text-[11px] text-neutral-400">Reba filime zose zemewe ku rubuga</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('series')}
          className="p-4 sm:p-5 rounded-2xl bg-[#0d111a] hover:bg-neutral-900 border border-neutral-800 hover:border-indigo-500/50 text-left space-y-2 transition-all group"
        >
          <Tv className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
          <div className="font-black text-sm sm:text-base text-white">Series Zose</div>
          <p className="text-[11px] text-neutral-400">Seasons n'ibice byose (Episodes)</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('interpreters')}
          className="p-4 sm:p-5 rounded-2xl bg-[#0d111a] hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 text-left space-y-2 transition-all group"
        >
          <Mic className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
          <div className="font-black text-sm sm:text-base text-white">Abasobanuzi</div>
          <p className="text-[11px] text-neutral-400">Rocky, Sankara, Gaheza, Perfect n'abandi</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('vip')}
          className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#1c1507] to-[#0d111a] border border-amber-500/40 hover:border-amber-400 text-left space-y-2 transition-all group"
        >
          <Crown className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
          <div className="font-black text-sm sm:text-base text-amber-300">Gura VIP</div>
          <p className="text-[11px] text-neutral-300">Kureba nta matangazo yamamaza (Optional)</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('mylist')}
          className="p-4 sm:p-5 rounded-2xl bg-[#0d111a] hover:bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 text-left space-y-2 transition-all group"
        >
          <Bookmark className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
          <div className="font-black text-sm sm:text-base text-white">Urutonde Rwanjye</div>
          <p className="text-[11px] text-neutral-400">Filime wabonye cyangwa wabikiye nyuma</p>
        </button>

        <button
          type="button"
          onClick={() => (user ? onNavigate('profile') : onOpenAuthModal())}
          className="p-4 sm:p-5 rounded-2xl bg-[#0d111a] hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-600 text-left space-y-2 transition-all group"
        >
          <UserIcon className="w-6 h-6 text-neutral-300 group-hover:scale-110 transition-transform" />
          <div className="font-black text-sm sm:text-base text-white">
            {user ? user.displayName : 'Konti Yanjye (Sign In)'}
          </div>
          <p className="text-[11px] text-neutral-400">
            {user ? 'amagenamiterere ya konti yawe' : 'Injira cyangwa ufungure konti ku bushake'}
          </p>
        </button>
      </div>

      {/* Genres Grid */}
      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
          <Compass className="w-5 h-5 text-amber-400" />
          <span>Ibyiciro bya Filime (Browse by Genre)</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {genres.map(genre => (
            <button
              key={genre.id}
              type="button"
              onClick={() => onSelectGenre(genre.slug)}
              className="p-3.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 text-left transition-all"
            >
              <div className="font-bold text-xs sm:text-sm text-white">{genre.name}</div>
              {genre.description && (
                <div className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                  {genre.description}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Rights & Legal Authorization Policy */}
      <div className="rounded-2xl bg-[#0b0f17] border border-neutral-800 p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
          <ShieldCheck className="w-5 h-5" />
          <span>Politiki y'Uburenganzira bwa Filime n'Abasobanuzi (Content Rights Policy)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-neutral-300 leading-relaxed">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>
              ZIRA itangaza gusa filime na series zifite uburenganzira bwemewe (Owned, Licensed, Permission Granted, cyangwa Public Domain / Creative Commons).
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span>
              Uruhushya rw'umusobanuzi (Narration Permission) rwonyine ntabwo rusimbura uruhushya rwa nyiri filime y'umwimerere (Underlying Film Distribution Rights).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

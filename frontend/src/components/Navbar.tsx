import React, { useState } from 'react';
import {
  Film,
  Search,
  User as UserIcon,
  ShieldAlert,
  Menu,
  X,
  LogOut,
  Crown,
  Mic,
  Tv,
  Home,
  LayoutGrid,
  Bookmark,
} from 'lucide-react';
import { User } from '../types';

export type NavView =
  | 'home'
  | 'movies'
  | 'series'
  | 'interpreters'
  | 'interpreter-details'
  | 'vip'
  | 'more'
  | 'browse'
  | 'mylist'
  | 'search'
  | 'profile'
  | 'admin'
  | 'movie-details'
  | 'series-details';

interface NavbarProps {
  activeView: NavView;
  onNavigate: (view: NavView) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  user: User | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export function Navbar({
  activeView,
  onNavigate,
  searchQuery,
  onSearchChange,
  user,
  onOpenAuthModal,
  onLogout,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const isAdmin = Boolean(user && ['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(user.role));

  const navItems: { id: NavView; label: string; sublabel: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Ahabanza', sublabel: 'Home', icon: Home },
    { id: 'movies', label: 'Filime', sublabel: 'Movies', icon: Film },
    { id: 'series', label: 'Series', sublabel: 'TV Series', icon: Tv },
    { id: 'interpreters', label: 'Abasobanuzi', sublabel: 'Interpreters', icon: Mic },
    { id: 'more', label: 'Ibindi', sublabel: 'More', icon: LayoutGrid },
  ];

  const handleNavClick = (view: NavView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#07090e]/95 backdrop-blur-xl border-b border-neutral-800/80 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: ZIRA Brand Logo + Desktop Nav */}
        <div className="flex items-center gap-5 lg:gap-7">
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 text-left group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-950/60 group-hover:scale-105 transition-transform border border-red-500/40">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black tracking-tighter text-white">
                ZIRA<span className="text-red-500">.</span>
              </span>
              <span className="hidden xl:inline-block ml-2 text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-neutral-900 text-amber-400 border border-amber-500/30">
                AGASOBANUYE &amp; HD
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
            {navItems.map(item => {
              const isActive =
                activeView === item.id ||
                (item.id === 'interpreters' && activeView === 'interpreter-details');
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-red-600/15 text-red-400 border border-red-500/30 shadow-sm'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-900/80'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Search Icon/Bar, Prominent Gold "Gura VIP" Button, User Account */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Desktop Search Input */}
          <div className="relative hidden sm:block w-44 lg:w-60">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Shakisha filime, umusobanuzi..."
              value={searchQuery}
              onChange={e => {
                onSearchChange(e.target.value);
                if (activeView !== 'search' && e.target.value.trim().length > 0) {
                  onNavigate('search');
                }
              }}
              onFocus={() => {
                if (searchQuery.trim().length > 0) onNavigate('search');
              }}
              className="w-full bg-neutral-900/90 border border-neutral-800 focus:border-amber-500/70 rounded-full pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition-all"
            />
          </div>

          {/* Mobile Search Icon Button */}
          <button
            onClick={() => {
              setMobileSearchOpen(prev => !prev);
              if (!mobileSearchOpen) onNavigate('search');
            }}
            aria-label="Search movies and interpreters"
            className={`sm:hidden p-2 rounded-xl border transition-colors ${
              activeView === 'search' || mobileSearchOpen
                ? 'bg-neutral-800 text-amber-400 border-amber-500/40'
                : 'bg-neutral-900/90 text-neutral-300 border-neutral-800 hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Prominent Gold/Yellow "Gura VIP" Button */}
          <button
            onClick={() => handleNavClick('vip')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-lg ${
              activeView === 'vip'
                ? 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-neutral-950 ring-2 ring-amber-300/60 shadow-amber-500/30 scale-[1.02]'
                : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-neutral-950 shadow-amber-500/20 hover:scale-105 active:scale-95'
            }`}
          >
            <Crown className="w-4 h-4 fill-neutral-950 text-neutral-950 flex-shrink-0" />
            <span>Gura VIP</span>
          </button>

          {/* Admin Console Button — Strictly visible ONLY to authenticated administrators */}
          {isAdmin && (
            <button
              onClick={() => handleNavClick('admin')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                activeView === 'admin'
                  ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-950/50'
                  : 'bg-neutral-900/90 text-red-400 border-red-900/50 hover:bg-red-950/60'
              }`}
              title="ZIRA Administrator Console"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Admin</span>
            </button>
          )}

          {/* User Profile / Sign In */}
          {user ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleNavClick('profile')}
                className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-neutral-200 transition-colors"
                title={user.displayName}
              >
                <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-[11px] font-bold text-white">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden xl:inline truncate max-w-[96px]">{user.displayName}</span>
              </button>
              <button
                onClick={onLogout}
                title="Sign Out"
                className="hidden sm:flex p-2 rounded-xl bg-neutral-900 hover:bg-red-950/50 text-neutral-400 hover:text-red-400 border border-neutral-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 font-bold text-xs border border-neutral-800 transition-all"
            >
              <UserIcon className="w-3.5 h-3.5 text-neutral-400" />
              <span>Injira</span>
            </button>
          )}

          {/* Mobile Drawer Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Open menu"
            className="md:hidden p-2 rounded-xl bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expandable Mobile Search Bar */}
      {mobileSearchOpen && (
        <div className="sm:hidden px-3 pb-3 pt-1 bg-[#07090e] border-b border-neutral-800/80">
          <div className="relative">
            <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Shakisha filime, series cyangwa umusobanuzi..."
              value={searchQuery}
              onChange={e => {
                onSearchChange(e.target.value);
                if (activeView !== 'search') onNavigate('search');
              }}
              className="w-full bg-neutral-900 border border-neutral-700 focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#090d14] border-b border-neutral-800 px-4 pt-3 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left text-xs font-bold border transition-all ${
                    isActive
                      ? 'bg-red-600/20 text-red-400 border-red-500/40'
                      : 'bg-neutral-900/70 text-neutral-300 border-neutral-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <div>
                    <div className="leading-tight">{item.label}</div>
                    <div className="text-[10px] text-neutral-500 font-normal">{item.sublabel}</div>
                  </div>
                </button>
              );
            })}
            <button
              onClick={() => handleNavClick('mylist')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left text-xs font-bold border transition-all ${
                activeView === 'mylist'
                  ? 'bg-red-600/20 text-red-400 border-red-500/40'
                  : 'bg-neutral-900/70 text-neutral-300 border-neutral-800 hover:text-white'
              }`}
            >
              <Bookmark className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div>
                <div className="leading-tight">Urutonde Rwanjye</div>
                <div className="text-[10px] text-neutral-500 font-normal">Watchlist</div>
              </div>
            </button>
          </div>

          <div className="pt-2 border-t border-neutral-800 flex items-center justify-between gap-2">
            {user ? (
              <>
                <button
                  onClick={() => handleNavClick('profile')}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-neutral-900 text-neutral-200 text-xs font-bold border border-neutral-800 text-left flex items-center gap-2"
                >
                  <UserIcon className="w-4 h-4 text-red-400" />
                  <span className="truncate">{user.displayName}</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleNavClick('admin')}
                    className="py-2.5 px-3 rounded-xl bg-red-950/60 text-red-300 text-xs font-bold border border-red-800/50 flex items-center gap-1.5"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Admin</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-neutral-900 text-neutral-400 hover:text-red-400 text-xs font-bold border border-neutral-800"
                >
                  ohoka
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onOpenAuthModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs border border-neutral-700 flex items-center justify-center gap-2"
              >
                <UserIcon className="w-4 h-4 text-amber-400" />
                <span>Injira / Iyandikishe (Optional Sign In)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

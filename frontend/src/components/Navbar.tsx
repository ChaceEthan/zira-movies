import React, { useState } from 'react';
import { Search, Bell, User as UserIcon, Shield, Bookmark, Film, Tv, Sparkles, LogOut, Settings } from 'lucide-react';
import { ZiraLogo } from './ZiraLogo';
import { User } from '../types';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, slug?: string) => void;
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
}

export function Navbar({
  currentView,
  onNavigate,
  user,
  onOpenAuth,
  onLogout,
  onSearchChange,
  searchQuery,
}: NavbarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Sparkles },
    { id: 'browse', label: 'Browse', icon: Film },
    { id: 'movies', label: 'Movies', icon: Film },
    { id: 'series', label: 'Series', icon: Tv },
    { id: 'my-list', label: 'My List', icon: Bookmark },
  ];

  const isAdmin = user && ['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(user.role);

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/60 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Logo & Navigation */}
        <div className="flex min-w-0 items-center gap-3 lg:gap-8">
          <div onClick={() => onNavigate('home')}>
            <ZiraLogo size="md" showTagline={false} />
          </div>

          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map(item => {
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-neutral-800 text-white font-semibold shadow-sm'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            {isAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all ${
                  currentView === 'admin'
                    ? 'bg-red-950/80 text-red-400 border border-red-800/50'
                    : 'text-red-400/90 hover:bg-red-950/40 hover:text-red-300'
                }`}
              >
                <Shield className="w-4 h-4 text-red-500" />
                Admin Console
              </button>
            )}
          </nav>
        </div>

        {/* Right: Search, Free Badge, Notifications, Profile */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Free Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/50 border border-red-800/40 text-red-400 text-xs font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            100% FREE
          </div>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search movies, series, cast..."
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                if (currentView !== 'browse') onNavigate('browse');
              }}
              className="w-28 sm:w-56 md:w-64 pl-9 pr-3 py-2 rounded-full bg-neutral-900 border border-neutral-800 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>

          {/* Notifications button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-4 z-50 text-xs">
                <div className="font-bold text-neutral-200 mb-2 border-b border-neutral-800 pb-2 flex justify-between items-center">
                  <span>Notifications</span>
                  <span className="text-[10px] text-red-400 font-normal">New Releases</span>
                </div>
                <div className="space-y-2.5">
                  <div className="p-2 rounded bg-neutral-800/50 hover:bg-neutral-800 transition-colors cursor-pointer" onClick={() => { setShowNotifications(false); onNavigate('movie', 'kigali-horizon'); }}>
                    <p className="font-semibold text-white">🎬 Kigali Horizon Released!</p>
                    <p className="text-neutral-400 mt-0.5">Stream the latest original Rwandan feature film now in HD.</p>
                  </div>
                  <div className="p-2 rounded bg-neutral-800/50 hover:bg-neutral-800 transition-colors cursor-pointer" onClick={() => { setShowNotifications(false); onNavigate('series', 'the-kigali-chronicles'); }}>
                    <p className="font-semibold text-white">📺 The Kigali Chronicles S1 Ep 3</p>
                    <p className="text-neutral-400 mt-0.5">New episode now streaming with Kinyarwanda & English subtitles.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile / Auth Menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1 rounded-full border border-neutral-800 hover:border-neutral-700 transition-colors"
              >
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-2 z-50 text-xs">
                  <div className="px-4 py-2 border-b border-neutral-800">
                    <p className="font-bold text-white text-sm">{user.displayName}</p>
                    <p className="text-neutral-400 text-xs truncate">{user.email}</p>
                    <div className="mt-1 inline-block px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono text-[10px]">
                      Role: {user.role}
                    </div>
                  </div>

                  <button
                    onClick={() => { setShowProfileMenu(false); onNavigate('profile'); }}
                    className="w-full text-left px-4 py-2 text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2"
                  >
                    <UserIcon className="w-4 h-4" /> Profile & Settings
                  </button>

                  <button
                    onClick={() => { setShowProfileMenu(false); onNavigate('my-list'); }}
                    className="w-full text-left px-4 py-2 text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2"
                  >
                    <Bookmark className="w-4 h-4" /> My List
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => { setShowProfileMenu(false); onNavigate('admin'); }}
                      className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-950/40 flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" /> Admin Dashboard
                    </button>
                  )}

                  <div className="border-t border-neutral-800 mt-1 pt-1">
                    <button
                      onClick={() => { setShowProfileMenu(false); onLogout(); }}
                      className="w-full text-left px-4 py-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-red-950/50 transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

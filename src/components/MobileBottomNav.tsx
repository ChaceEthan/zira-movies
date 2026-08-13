import React from 'react';
import { Sparkles, Film, Tv, Bookmark, User as UserIcon, Shield } from 'lucide-react';
import { User } from '../types';

interface MobileBottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  user: User | null;
  onOpenAuth: () => void;
}

export function MobileBottomNav({ currentView, onNavigate, user, onOpenAuth }: MobileBottomNavProps) {
  const isAdmin = user && ['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(user.role);

  const items = [
    { id: 'home', label: 'Home', icon: Sparkles },
    { id: 'browse', label: 'Browse', icon: Film },
    { id: 'movies', label: 'Movies', icon: Film },
    { id: 'series', label: 'Series', icon: Tv },
    { id: 'my-list', label: 'My List', icon: Bookmark },
  ];

  if (isAdmin) {
    items.push({ id: 'admin', label: 'Admin', icon: Shield });
  } else {
    items.push({ id: 'profile', label: 'Profile', icon: UserIcon });
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-lg border-t border-neutral-800/80 px-2 py-1.5 flex items-center justify-around shadow-2xl">
      {items.map(item => {
        const Icon = item.icon;
        const active = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'profile' && !user) {
                onOpenAuth();
              } else {
                onNavigate(item.id);
              }
            }}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-all min-w-[56px] min-h-[48px] ${
              active
                ? 'text-red-500 font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Icon className={`w-5 h-5 ${active ? 'scale-110' : ''} transition-transform`} />
            <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

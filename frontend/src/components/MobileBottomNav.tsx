import React from 'react';
import { Home, Film, Tv, Mic, LayoutGrid } from 'lucide-react';
import { NavView } from './Navbar';

interface MobileBottomNavProps {
  activeView: NavView;
  onNavigate: (view: NavView) => void;
}

export function MobileBottomNav({ activeView, onNavigate }: MobileBottomNavProps) {
  const navItems: { id: NavView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Ahabanza', icon: Home },
    { id: 'movies', label: 'Filime', icon: Film },
    { id: 'series', label: 'Series', icon: Tv },
    { id: 'interpreters', label: 'Abasobanuzi', icon: Mic },
    { id: 'more', label: 'Ibindi', icon: LayoutGrid },
  ];

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#07090e]/95 backdrop-blur-xl border-t border-neutral-800/90 px-1.5 py-1.5 flex items-center justify-around shadow-2xl"
    >
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive =
          activeView === item.id ||
          (item.id === 'interpreters' && activeView === 'interpreter-details') ||
          (item.id === 'movies' && activeView === 'movie-details') ||
          (item.id === 'series' && activeView === 'series-details');

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[60px] ${
              isActive ? 'text-amber-400 font-extrabold' : 'text-neutral-400 hover:text-neutral-200 font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-colors ${
                isActive ? 'bg-amber-500/15 text-amber-400' : ''
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 leading-none">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

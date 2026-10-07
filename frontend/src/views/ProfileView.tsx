import React, { useState } from 'react';
import { User, PlaybackPreference } from '../types';
import { User as UserIcon, Settings, Wifi, Bell, Shield, LogOut, Check } from 'lucide-react';

interface ProfileViewProps {
  user: User;
  onUpdatePreferences: (pref: { playbackPreference: PlaybackPreference; notificationEmail: boolean; displayName: string }) => void;
  onLogout: () => void;
}

export function ProfileView({ user, onUpdatePreferences, onLogout }: ProfileViewProps) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [playbackPref, setPlaybackPref] = useState<PlaybackPreference>(user.playbackPreference || 'AUTO');
  const [notificationEmail, setNotificationEmail] = useState(user.notificationEmail);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePreferences({
      displayName,
      playbackPreference: playbackPref,
      notificationEmail,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center gap-4 bg-neutral-900/60 p-6 rounded-2xl border border-neutral-800">
        <img
          src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
          alt={user.displayName}
          className="w-16 h-16 rounded-full object-cover border-2 border-red-600 shadow-xl"
        />
        <div>
          <h1 className="text-2xl font-bold text-white">{user.displayName}</h1>
          <p className="text-xs text-neutral-400">{user.email}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-mono text-[10px]">
              Role: {user.role}
            </span>
            <span className="px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
              100% Free Plan
            </span>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6 bg-neutral-900/40 p-6 rounded-2xl border border-neutral-800">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-neutral-800 pb-3">
          <Settings className="w-5 h-5 text-red-500" />
          Account & Streaming Preferences
        </h2>

        {savedSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            Preferences updated successfully!
          </div>
        )}

        {/* Display Name */}
        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-red-600"
          />
        </div>

        {/* Data Saver & Playback Preferences */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <Wifi className="w-4 h-4 text-red-500" />
            Video Playback & Data Saver Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'AUTO', label: 'Auto Quality', desc: 'Adapts dynamically to network speed' },
              { id: 'DATA_SAVER', label: 'Data Saver', desc: 'Optimized low bitrate for mobile networks' },
              { id: 'HIGH_QUALITY', label: 'High Quality', desc: 'Prefers 1080p Full HD stream' },
            ].map(item => (
              <div
                key={item.id}
                onClick={() => setPlaybackPref(item.id as PlaybackPreference)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  playbackPref === item.id
                    ? 'bg-red-950/60 border-red-600 text-white'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs">{item.label}</div>
                <div className="text-[10px] text-neutral-400 mt-0.5">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="flex justify-between items-center pt-2 border-t border-neutral-800">
          <div>
            <p className="font-semibold text-white text-xs">Email Notifications</p>
            <p className="text-[10px] text-neutral-400">Receive alerts when new Rwandan movies or series release</p>
          </div>
          <button
            type="button"
            onClick={() => setNotificationEmail(!notificationEmail)}
            className={`px-3 py-1 rounded font-bold text-xs ${notificationEmail ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-400'}`}
          >
            {notificationEmail ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>

        <div className="pt-2 flex justify-between items-center">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-red-950 transition-all"
          >
            Save Settings
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-red-400 text-xs font-semibold flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </form>
    </div>
  );
}

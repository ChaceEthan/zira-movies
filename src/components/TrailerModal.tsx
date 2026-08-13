import React from 'react';
import { X } from 'lucide-react';
import { Movie, Series } from '../types';

interface TrailerModalProps {
  item: Movie | Series;
  onClose: () => void;
}

export function TrailerModal({ item, onClose }: TrailerModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-neutral-800">
          <div>
            <h3 className="font-bold text-white text-base sm:text-lg">{item.title} — Official Trailer</h3>
            <p className="text-xs text-neutral-400">{item.releaseYear} • {item.genres.join(', ')}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="aspect-video w-full bg-black">
          <video
            src={item.trailerUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'}
            controls
            autoPlay
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}

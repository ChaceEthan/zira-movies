import React, { useState, useRef, useEffect } from 'react';
import {
  X, Play, Pause, Volume2, VolumeX, Maximize, Settings,
  RotateCcw, RotateCw, SkipForward, Subtitles, Wifi, Tv,
  Check, ShieldAlert, Sparkles
} from 'lucide-react';
import Hls from 'hls.js';
import { Movie, Series, Episode } from '../types';
import { MonetagAd } from './MonetagAd';

interface VideoPlayerModalProps {
  item: Movie | Series;
  episode?: Episode;
  initialPosition?: number;
  onClose: () => void;
  onSaveProgress: (position: number, duration: number) => void;
  onNextEpisode?: () => void;
  playbackPreference?: 'AUTO' | 'DATA_SAVER' | 'HIGH_QUALITY';
}

export function VideoPlayerModal({
  item,
  episode,
  initialPosition = 0,
  onClose,
  onSaveProgress,
  onNextEpisode,
  playbackPreference = 'AUTO',
}: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialPosition);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [selectedQuality, setSelectedQuality] = useState('Auto');
  const [availableQualities, setAvailableQualities] = useState<Array<{ index: number; label: string }>>([]);
  const [isDataSaver, setIsDataSaver] = useState(playbackPreference === 'DATA_SAVER');
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('Off');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showSettings, setShowSettings] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [playerError, setPlayerError] = useState('');

  const hideControlsTimer = useRef<any>(null);

  const title = episode ? `${item.title} - ${episode.title}` : item.title;
  const videoSrc = episode?.videoUrl || ('videoUrl' in item ? item.videoUrl : '');
  const hlsSrc = episode?.hlsUrl || ('hlsUrl' in item ? item.hlsUrl : '');

  // HLS stream setup & fallback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setPlayerError('');
    setAvailableQualities([]);

    if (hlsSrc && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.on(Hls.Events.LEVELS_UPDATED, () => {
        const qualities = new Map<number, { index: number; label: string }>();
        hls.levels.forEach((level, index) => {
          if ([360, 480, 720, 1080].includes(level.height)) {
            qualities.set(level.height, { index, label: `${level.height}p` });
          }
        });
        setAvailableQualities(Array.from(qualities.values()).sort((left, right) => left.index - right.index));
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setPlayerError('This video is currently unavailable. Please try again later.');
          hls.destroy();
        }
      });
      hls.loadSource(hlsSrc);
      hls.attachMedia(video);
      return () => {
        hlsRef.current = null;
        hls.destroy();
      };
    } else if (hlsSrc && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsSrc;
    } else if (videoSrc) {
      video.src = videoSrc;
    } else {
      setPlayerError('No playable video is available for this title.');
    }
  }, [videoSrc, hlsSrc]);

  const selectQuality = (quality: string) => {
    setSelectedQuality(quality);
    setIsDataSaver(false);
    if (quality === 'Auto') {
      if (hlsRef.current) hlsRef.current.currentLevel = -1;
      return;
    }
    const rendition = availableQualities.find(item => item.label === quality);
    if (rendition && hlsRef.current) hlsRef.current.currentLevel = rendition.index;
  };

  const toggleDataSaver = () => {
    const enabled = !isDataSaver;
    setIsDataSaver(enabled);
    if (enabled && availableQualities.length > 0 && hlsRef.current) {
      hlsRef.current.currentLevel = availableQualities[0].index;
      setSelectedQuality(availableQualities[0].label);
    } else if (hlsRef.current) {
      hlsRef.current.currentLevel = -1;
      setSelectedQuality('Auto');
    }
  };

  // Set initial position
  useEffect(() => {
    if (videoRef.current && initialPosition > 0) {
      videoRef.current.currentTime = initialPosition;
    }
  }, [initialPosition]);

  // Periodic progress sync with backend
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.duration > 0) {
        onSaveProgress(Math.floor(videoRef.current.currentTime), Math.floor(videoRef.current.duration));
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [onSaveProgress]);

  // Control auto-hide
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      if (isPlaying) setControlsVisible(false);
    }, 3500);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        void videoRef.current.play().catch(() => setPlayerError('Playback could not start. Please try again.'));
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVolume = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = nextVolume;
      videoRef.current.muted = nextVolume === 0;
    }
    setVolume(nextVolume);
    setIsMuted(nextVolume === 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const seekRelative = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden select-none"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
        onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
        onCanPlay={() => setPlayerError('')}
        onError={() => setPlayerError('This video is currently unavailable. Please try again later.')}
        onEnded={() => {
          setIsPlaying(false);
          if (onNextEpisode) onNextEpisode();
        }}
        className="absolute inset-0 w-full h-full object-contain bg-black cursor-pointer"
        onClick={togglePlay}
      />

      {playerError && (
        <div role="alert" className="absolute inset-x-4 top-1/2 z-20 mx-auto max-w-md -translate-y-1/2 rounded-lg border border-neutral-700 bg-neutral-950/95 p-5 text-center shadow-2xl">
          <ShieldAlert className="mx-auto mb-3 h-6 w-6 text-amber-400" />
          <p className="text-sm font-semibold text-white">Playback unavailable</p>
          <p className="mt-1 text-xs text-neutral-300">{playerError}</p>
        </div>
      )}

      {/* Top Bar Overlay */}
      <div className={`relative z-20 p-4 lg:p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (videoRef.current) onSaveProgress(Math.floor(videoRef.current.currentTime), Math.floor(videoRef.current.duration));
              onClose();
            }}
            className="p-2 rounded-full bg-neutral-900/80 text-white hover:bg-neutral-800 border border-neutral-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm sm:text-lg font-bold text-white drop-shadow">{title}</h2>
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              {isDataSaver && availableQualities.length > 0 && (
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800/50">
                  ⚡ Data Saver Mode Active
                </span>
              )}
              <span>Quality: {selectedQuality}</span>
            </div>
          </div>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-2">
          {/* Settings button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-full bg-neutral-900/80 text-neutral-300 hover:text-white border border-neutral-800"
            title="Quality & Audio Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Panel Modal Popup */}
      {showSettings && (
        <div className="absolute top-16 right-6 z-30 w-72 bg-neutral-900/95 border border-neutral-800 rounded-2xl p-4 shadow-2xl text-xs space-y-4 backdrop-blur-xl">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
            <span className="font-bold text-white">Playback Settings</span>
            <button onClick={() => setShowSettings(false)} className="text-neutral-400 hover:text-white"><X className="w-4 h-4" /></button>
          </div>

          {/* Quality Picker */}
          <div>
            <label className="text-neutral-400 font-semibold mb-1 block">Video Quality</label>
            <div className="grid grid-cols-3 gap-1">
              {['Auto', ...availableQualities.map(quality => quality.label)].map(q => (
                <button
                  key={q}
                  onClick={() => selectQuality(q)}
                  className={`py-1 px-2 rounded text-center font-bold ${
                    selectedQuality === q ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
            {availableQualities.length === 0 && <p className="mt-2 text-[10px] text-neutral-500">This source has no selectable HLS renditions.</p>}
          </div>

          {/* Data Saver Toggle */}
          <div className="flex justify-between items-center pt-1 border-t border-neutral-800">
            <div>
              <p className="font-semibold text-white">Data Saver</p>
              <p className="text-[10px] text-neutral-400">Reduces video data consumption on mobile</p>
            </div>
            <button
              onClick={toggleDataSaver}
              disabled={availableQualities.length === 0}
              className={`px-3 py-1 rounded font-bold disabled:cursor-not-allowed disabled:opacity-40 ${isDataSaver ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400'}`}
            >
              {isDataSaver ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Subtitles */}
          <div className="pt-1 border-t border-neutral-800">
            <label className="text-neutral-400 font-semibold mb-1 block">Subtitles</label>
            <div className="flex flex-wrap gap-1">
              <span className="text-neutral-500">Subtitle tracks are unavailable for this source.</span>
            </div>
          </div>
        </div>
      )}

      {/* Center Controls (Mobile Tap Play) */}
      <div className={`relative z-10 flex items-center justify-center gap-6 my-auto transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0'}`}>
        <button
          onClick={() => seekRelative(-10)}
          className="p-3 rounded-full bg-neutral-900/60 text-white hover:bg-neutral-800/80 backdrop-blur-md"
          title="Seek 10s back"
        >
          <RotateCcw className="w-6 h-6" />
        </button>

        <button
          onClick={togglePlay}
          className="p-5 rounded-full bg-red-600 text-white shadow-2xl hover:bg-red-500 hover:scale-110 active:scale-95 transition-all"
        >
          {isPlaying ? <Pause className="w-8 h-8 fill-white" /> : <Play className="w-8 h-8 fill-white ml-0.5" />}
        </button>

        <button
          onClick={() => seekRelative(10)}
          className="p-3 rounded-full bg-neutral-900/60 text-white hover:bg-neutral-800/80 backdrop-blur-md"
          title="Seek 10s forward"
        >
          <RotateCw className="w-6 h-6" />
        </button>
      </div>

      <MonetagAd placement="PLAYER_COMPANION" className="relative z-10 mx-auto max-h-20 w-full max-w-2xl overflow-hidden" />

      {/* Bottom Control Bar */}
      <div className={`relative z-20 p-4 lg:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent space-y-2 transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0'}`}>
        {/* Progress Timeline Slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-neutral-300">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-red-600"
          />
          <span className="text-xs font-mono text-neutral-400">{formatTime(duration)}</span>
        </div>

        {/* Bottom Control Buttons */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-white hover:text-red-500 transition-colors">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            <button onClick={toggleMute} className="text-white hover:text-neutral-300 transition-colors">
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              aria-label="Volume"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 accent-red-600"
            />

            {onNextEpisode && (
              <button
                onClick={onNextEpisode}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold"
              >
                <span>Next Episode</span>
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleFullscreen} className="text-white hover:text-red-500 transition-colors">
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

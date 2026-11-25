import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Music,
  Play,
  Pause,
  FolderOpen,
  AlertCircle,
  Volume2,
  Loader2,
  Check,
  Sparkles,
} from 'lucide-react';
import { MusicConfig } from '../../types';
import {
  DEFAULT_MUSIC_CONFIG,
  MUSIC_PRESETS,
  STATIC_MUSIC_FOLDER,
  resolveStaticMusicUrl,
} from '../../constants/cmsDefaults';

interface MusicManagerProps {
  music: MusicConfig;
  onChange: (updatedMusic: MusicConfig) => void;
}

export const MusicManager: React.FC<MusicManagerProps> = ({ music, onChange }) => {
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const resolvedSrc = useMemo(() => resolveStaticMusicUrl(music.url), [music.url]);

  const isLegacyNonStaticUrl = useMemo(() => {
    const raw = (music.url || '').trim().toLowerCase();
    return (
      raw.startsWith('idb://') ||
      raw.startsWith('indexeddb://') ||
      raw.startsWith('blob:') ||
      raw.includes('firebasestorage.googleapis.com') ||
      raw.includes('.firebasestorage.app')
    );
  }, [music.url]);

  // Clean up preview audio on unmount so no duplicate audio plays
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      }
    };
  }, []);

  // Reset preview playback when selected track URL changes
  useEffect(() => {
    setPreviewError(null);
    setIsPlayingPreview(false);
    setIsLoadingPreview(false);
    setCurrentTime(0);
    setDuration(0);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [resolvedSrc]);

  // Handle Play / Pause Preview
  const togglePreview = () => {
    if (!audioRef.current || !resolvedSrc) return;
    setPreviewError(null);

    if (isPlayingPreview) {
      audioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      setIsLoadingPreview(true);
      audioRef.current
        .play()
        .then(() => {
          setIsPlayingPreview(true);
          setIsLoadingPreview(false);
        })
        .catch(() => {
          setIsPlayingPreview(false);
          setIsLoadingPreview(false);
          setPreviewError(
            `File audio "${resolvedSrc}" belum ditemukan atau tidak dapat diputar. Pastikan file MP3 sudah berada di folder public${STATIC_MUSIC_FOLDER}/.`
          );
        });
    }
  };

  // Handle Seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Select track from available static music list
  const handleSelectTrack = (track: { title: string; artist: string; url: string }) => {
    setPreviewError(null);
    onChange({
      ...music,
      title: track.title,
      artist: track.artist,
      url: track.url,
      isCustomUpload: false,
      fileName: '',
      fileSize: '',
    });
  };

  const handleApplyDefaultStatic = () => {
    handleSelectTrack(DEFAULT_MUSIC_CONFIG);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Hidden audio element for admin preview */}
      <audio
        ref={audioRef}
        src={resolvedSrc}
        preload="metadata"
        playsInline
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onCanPlay={() => {
          setIsLoadingPreview(false);
          setPreviewError(null);
        }}
        onWaiting={() => {
          if (isPlayingPreview) setIsLoadingPreview(true);
        }}
        onEnded={() => {
          setIsPlayingPreview(false);
          setCurrentTime(0);
        }}
        onError={() => {
          setIsPlayingPreview(false);
          setIsLoadingPreview(false);
          setPreviewError(
            `File audio "${resolvedSrc}" belum ditemukan di public${STATIC_MUSIC_FOLDER}/. Pastikan file MP3 sudah ditempatkan dengan nama yang sesuai.`
          );
        }}
      />

      {/* Section Header */}
      <div>
        <h3 className="font-serif text-2xl text-[#1F1D1B] font-medium">
          Pengaturan Musik Latar Belakang
        </h3>
        <p className="text-xs text-[#8C827A] font-light mt-0.5">
          Pilih lagu dari daftar musik statis Vercel (<code className="text-[#1F1D1B]">public{STATIC_MUSIC_FOLDER}/</code>) atau masukkan path MP3 relatif. Konfigurasi tersimpan otomatis ke Firestore.
        </p>
      </div>

      {/* Migration notice if Firestore still holds legacy local/Firebase Storage URL */}
      {isLegacyNonStaticUrl && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">URL musik lama terdeteksi di konfigurasi tersimpan</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Saat ini website otomatis mengalihkan ke jalur statis Vercel ({DEFAULT_MUSIC_CONFIG.url}). Klik tombol di samping untuk memperbarui data Firestore.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleApplyDefaultStatic}
            className="px-3.5 py-2 rounded-xl bg-amber-900 hover:bg-amber-950 text-white text-[11px] font-medium shrink-0 cursor-pointer"
          >
            Perbarui ke Path Statis
          </button>
        </div>
      )}

      {/* 1. Active Music Player Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#EFE8DC] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#EFE8DC]">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#C5A059]/15 flex items-center justify-center text-[#C5A059] shrink-0">
              <Music className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-[#8C827A] font-medium block">
                  Musik Aktif Undangan
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium rounded-full">
                  <FolderOpen className="w-2.5 h-2.5" />
                  Vercel Static
                </span>
              </div>
              <h4 className="text-base font-semibold text-[#1F1D1B] truncate">{music.title}</h4>
              <p className="text-xs text-[#70675F] font-light truncate">
                {music.artist} • <span className="font-mono text-[11px]">{resolvedSrc}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={togglePreview}
            disabled={!resolvedSrc}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#242220] hover:bg-[#383431] disabled:opacity-50 text-xs font-medium text-white transition-all shadow-xs cursor-pointer shrink-0"
          >
            {isLoadingPreview ? (
              <>
                <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin" />
                <span>Memuat...</span>
              </>
            ) : isPlayingPreview ? (
              <>
                <Pause className="w-4 h-4 text-[#D4AF37]" />
                <span>Jeda Preview</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-[#D4AF37]" />
                <span>Putar Musik</span>
              </>
            )}
          </button>
        </div>

        {previewError && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{previewError}</span>
          </div>
        )}

        {/* Audio Timeline & Progress Bar */}
        {resolvedSrc && (
          <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EFE8DC] space-y-2">
            <div className="flex items-center justify-between text-[11px] text-[#70675F] font-mono">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-[#C5A059]" />
                {formatTime(currentTime)}
              </span>
              <span>{formatTime(duration)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-[#E8DFD3] rounded-lg appearance-none cursor-pointer accent-[#C5A059]"
            />
          </div>
        )}

        {/* Playback Configuration Switches */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
          <label className="flex items-center justify-between p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E8DFD3] cursor-pointer hover:border-[#D6C7B2] transition-colors">
            <div>
              <span className="font-medium text-[#1F1D1B] block">Autoplay Saat Dibuka</span>
              <span className="text-[11px] text-[#8C827A] font-light">
                Putar otomatis begitu tamu klik &apos;Buka Undangan&apos;
              </span>
            </div>
            <input
              type="checkbox"
              checked={music.autoPlay}
              onChange={(e) => onChange({ ...music, autoPlay: e.target.checked })}
              className="w-4 h-4 rounded text-[#C5A059] accent-[#C5A059] cursor-pointer shrink-0 ml-3"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E8DFD3] cursor-pointer hover:border-[#D6C7B2] transition-colors">
            <div>
              <span className="font-medium text-[#1F1D1B] block">Putar Berulang (Loop)</span>
              <span className="text-[11px] text-[#8C827A] font-light">
                Ulangi musik secara mulus bila durasi selesai
              </span>
            </div>
            <input
              type="checkbox"
              checked={music.loop !== false}
              onChange={(e) => onChange({ ...music, loop: e.target.checked })}
              className="w-4 h-4 rounded text-[#C5A059] accent-[#C5A059] cursor-pointer shrink-0 ml-3"
            />
          </label>
        </div>
      </div>

      {/* 2. Available Static Music List (public/music/ramdan-resti/) */}
      <div className="bg-white rounded-2xl p-6 border border-[#EFE8DC] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <h4 className="text-sm font-semibold text-[#1F1D1B]">
                Daftar Lagu Statis Vercel
              </h4>
            </div>
            <p className="text-xs text-[#8C827A] font-light mt-1">
              Pilih lagu yang tersedia di folder{' '}
              <code className="px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#E8DFD3] text-[#1F1D1B]">
                public{STATIC_MUSIC_FOLDER}/
              </code>
              . Setiap file MP3 yang diletakkan di folder tersebut otomatis dapat diakses publik oleh semua perangkat.
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          {MUSIC_PRESETS.map((track) => {
            const isCurrent = resolvedSrc === track.url;
            return (
              <div
                key={track.id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isCurrent
                    ? 'border-[#C5A059] bg-[#FAF8F5] ring-1 ring-[#C5A059]'
                    : 'border-[#EFE8DC] hover:border-[#D6C7B2] bg-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#EFE8DC] flex items-center justify-center text-[#70675F] shrink-0">
                    {isCurrent ? (
                      <Check className="w-4 h-4 text-[#C5A059]" />
                    ) : (
                      <Music className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-semibold text-[#1F1D1B] truncate">{track.title}</h5>
                    <p className="text-[11px] text-[#8C827A] font-light truncate">
                      {track.artist} • <span className="font-mono">{track.url}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSelectTrack(track)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isCurrent
                        ? 'bg-[#C5A059] text-white'
                        : 'border border-[#D6C7B2] hover:bg-[#FAF8F5] text-[#3D3833]'
                    }`}
                  >
                    {isCurrent ? 'Dipilih' : 'Gunakan Lagu Ini'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Custom Relative Path / Track Details */}
      <div className="bg-white rounded-2xl p-5 border border-[#EFE8DC] shadow-xs space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-[#1F1D1B]">
            Path File MP3 Lokal Kustom
          </h4>
          <p className="text-xs text-[#8C827A] font-light mt-0.5">
            Jika Anda menambahkan file MP3 dengan nama lain ke folder{' '}
            <code className="text-[#1F1D1B]">public{STATIC_MUSIC_FOLDER}/</code>, masukkan URL relatifnya di sini (contoh:{' '}
            <code className="text-[#1F1D1B]">{STATIC_MUSIC_FOLDER}/nama-lagu.mp3</code>).
          </p>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-[#3D3833] mb-1">URL / Path File Audio MP3</label>
            <input
              type="text"
              value={isLegacyNonStaticUrl ? DEFAULT_MUSIC_CONFIG.url : music.url}
              onChange={(e) => {
                const rawVal = e.target.value;
                onChange({
                  ...music,
                  url: rawVal,
                  isCustomUpload: false,
                });
              }}
              placeholder={`${STATIC_MUSIC_FOLDER}/nama-lagu.mp3`}
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8DFD3] rounded-xl focus:outline-none focus:border-[#C5A059] font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#3D3833] mb-1">Judul Lagu</label>
              <input
                type="text"
                value={music.title}
                onChange={(e) => onChange({ ...music, title: e.target.value })}
                placeholder="Judul Lagu"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8DFD3] rounded-xl focus:outline-none focus:border-[#C5A059]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#3D3833] mb-1">Penyanyi / Artis</label>
              <input
                type="text"
                value={music.artist}
                onChange={(e) => onChange({ ...music, artist: e.target.value })}
                placeholder="Nama Penyanyi"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8DFD3] rounded-xl focus:outline-none focus:border-[#C5A059]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

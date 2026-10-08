import React, { useState, useRef, useEffect } from 'react';
import {
  Music,
  Play,
  Pause,
  UploadCloud,
  FileAudio,
  Trash2,
  Check,
  Sparkles,
  HardDrive,
  AlertCircle,
  Volume2,
} from 'lucide-react';
import { MusicConfig } from '../../types';
import {
  saveCustomAudio,
  getCustomAudioMetadata,
  deleteCustomAudio,
  resolveAudioUrl,
  formatBytes,
  DEFAULT_AUDIO_KEY,
  AudioMetadata,
} from '../../services/audioStorageService';

interface MusicManagerProps {
  music: MusicConfig;
  onChange: (updatedMusic: MusicConfig) => void;
}

export const MusicManager: React.FC<MusicManagerProps> = ({ music, onChange }) => {
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [storedMeta, setStoredMeta] = useState<AudioMetadata | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Curated royalty-free wedding acoustic tracks
  const curatedTracks = [
    {
      title: 'Acoustic Wedding Serenade',
      artist: 'Acoustic Memories',
      url: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
    },
    {
      title: 'Romantic Piano & Strings',
      artist: 'Classical Romance',
      url: 'https://assets.mixkit.co/music/preview/mixkit-beautiful-dream-493.mp3',
    },
    {
      title: 'Gentle Wedding Walk',
      artist: 'Love & Warmth',
      url: 'https://assets.mixkit.co/music/preview/mixkit-tender-love-177.mp3',
    },
    {
      title: 'A Thousand Moments',
      artist: 'Acoustic Guitars',
      url: 'https://assets.mixkit.co/music/preview/mixkit-delicate-touch-576.mp3',
    },
  ];

  // Check for existing custom audio in IndexedDB on component mount
  useEffect(() => {
    let isMounted = true;
    getCustomAudioMetadata(DEFAULT_AUDIO_KEY)
      .then((meta) => {
        if (isMounted && meta) {
          setStoredMeta(meta);
        }
      })
      .catch((err) => console.warn('[MusicManager] Could not read metadata:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  // Resolve current music URL to playable audio src
  useEffect(() => {
    let isMounted = true;
    if (!music.url) {
      setResolvedSrc('');
      return;
    }

    resolveAudioUrl(music.url)
      .then((url) => {
        if (isMounted) {
          setResolvedSrc(url);
          if (audioRef.current) {
            audioRef.current.src = url;
            if (isPlayingPreview) {
              audioRef.current.play().catch(() => setIsPlayingPreview(false));
            }
          }
        }
      })
      .catch((err) => {
        console.warn('[MusicManager] Resolve URL error:', err);
        if (isMounted) setResolvedSrc(music.url);
      });

    return () => {
      isMounted = false;
    };
  }, [music.url]);

  // Handle Play / Pause Preview
  const togglePreview = () => {
    if (!audioRef.current || !resolvedSrc) return;
    if (isPlayingPreview) {
      audioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlayingPreview(true))
        .catch((e) => {
          console.warn('[MusicManager] Play failed:', e);
          setIsPlayingPreview(false);
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

  // Select Curated Preset
  const handleSelectCuratedTrack = (track: { title: string; artist: string; url: string }) => {
    setUploadSuccess(null);
    setUploadError(null);
    onChange({
      ...music,
      title: track.title,
      artist: track.artist,
      url: track.url,
      isCustomUpload: false,
    });
  };

  // Process File Upload (MP3)
  const processUploadedFile = async (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);

    // Validate type
    const isAudio =
      file.type.includes('audio') ||
      file.name.toLowerCase().endsWith('.mp3') ||
      file.name.toLowerCase().endsWith('.m4a') ||
      file.name.toLowerCase().endsWith('.wav');

    if (!isAudio) {
      setUploadError('Format file tidak didukung. Harap unggah file audio MP3 atau format sejenis.');
      return;
    }

    // Validate size (max 25MB)
    const maxSizeBytes = 25 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setUploadError('Ukuran file terlalu besar. Batas maksimal file MP3 adalah 25MB.');
      return;
    }

    setIsUploading(true);

    try {
      // Store into IndexedDB for persistent storage across refreshes
      const result = await saveCustomAudio(file, file.name, DEFAULT_AUDIO_KEY);
      setStoredMeta(result.metadata);

      // Clean file title: remove extension and format
      const cleanedTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      const updatedMusic: MusicConfig = {
        ...music,
        url: result.url,
        title: cleanedTitle || 'Lagu Pernikahan',
        artist: 'File MP3 Kustom',
        isCustomUpload: true,
        fileName: file.name,
        fileSize: result.metadata.formattedSize,
        audioKey: result.key,
        uploadedAt: result.metadata.updatedAt,
      };

      onChange(updatedMusic);
      setUploadSuccess(`"${file.name}" (${result.metadata.formattedSize}) berhasil disimpan permanen!`);

      // Auto play preview
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current
            .play()
            .then(() => setIsPlayingPreview(true))
            .catch(() => {});
        }
      }, 300);
    } catch (err) {
      console.error('[MusicManager] Upload error:', err);
      setUploadError('Gagal menyimpan file audio ke peramban. Silakan coba lagi.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  // Use previously stored custom audio
  const handleUseStoredCustomAudio = () => {
    if (!storedMeta) return;
    const virtualUrl = `idb://${DEFAULT_AUDIO_KEY}`;
    onChange({
      ...music,
      url: virtualUrl,
      title: storedMeta.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      artist: 'File MP3 Kustom',
      isCustomUpload: true,
      fileName: storedMeta.name,
      fileSize: storedMeta.formattedSize,
      audioKey: DEFAULT_AUDIO_KEY,
    });
    setUploadSuccess(`Menggunakan file kustom "${storedMeta.name}"`);
  };

  // Delete stored custom audio
  const handleDeleteCustomAudio = async () => {
    if (!window.confirm('Hapus file musik kustom ini dari penyimpanan peramban?')) {
      return;
    }

    try {
      if (isPlayingPreview) {
        audioRef.current?.pause();
        setIsPlayingPreview(false);
      }
      await deleteCustomAudio(DEFAULT_AUDIO_KEY);
      setStoredMeta(null);
      setUploadSuccess(null);

      // Revert to first curated track if current music was the custom upload
      if (music.isCustomUpload || music.url.includes(DEFAULT_AUDIO_KEY)) {
        const fallback = curatedTracks[0];
        onChange({
          ...music,
          title: fallback.title,
          artist: fallback.artist,
          url: fallback.url,
          isCustomUpload: false,
          fileName: undefined,
          fileSize: undefined,
        });
      }
    } catch (err) {
      console.error('[MusicManager] Delete error:', err);
    }
  };

  const isCurrentCustom =
    music.isCustomUpload || music.url.startsWith('idb://') || music.url.startsWith('indexeddb://');

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Hidden audio element for preview */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onEnded={() => {
          setIsPlayingPreview(false);
          setCurrentTime(0);
        }}
        onError={() => {
          setIsPlayingPreview(false);
        }}
      />

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mp3,audio/mpeg,audio/wav,audio/m4a,.mp3"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Section Header */}
      <div>
        <h3 className="font-serif text-2xl text-[#1F1D1B] font-medium">
          Pengaturan Musik Latar Belakang
        </h3>
        <p className="text-xs text-[#8C827A] font-light mt-0.5">
          Unggah lagu MP3 pilihan Anda sendiri atau pilih instrumen akustik. Musik tersimpan permanen dan diputar otomatis saat tamu membuka undangan.
        </p>
      </div>

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
                {isCurrentCustom && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#C5A059]/15 text-[#8C6D3F] text-[10px] font-medium rounded-full">
                    <HardDrive className="w-2.5 h-2.5" />
                    MP3 Kustom
                  </span>
                )}
              </div>
              <h4 className="text-base font-semibold text-[#1F1D1B] truncate">{music.title}</h4>
              <p className="text-xs text-[#70675F] font-light truncate">
                {music.artist} {music.fileSize ? `• ${music.fileSize}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={togglePreview}
            disabled={!resolvedSrc}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#242220] hover:bg-[#383431] disabled:opacity-50 text-xs font-medium text-white transition-all shadow-xs cursor-pointer shrink-0"
          >
            {isPlayingPreview ? (
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
                Putar otomatis begitu tamu klik 'Buka Undangan'
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

      {/* 2. Upload MP3 Feature Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#EFE8DC] shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-[#C5A059]" />
              <h4 className="text-sm font-semibold text-[#1F1D1B]">Unggah File MP3 Latar Belakang</h4>
            </div>
            <p className="text-xs text-[#8C827A] font-light mt-1">
              Gunakan lagu MP3 favorit pernikahan Anda. File disimpan di peramban (IndexedDB) sehingga tetap tersimpan permanen dan tidak hilang saat halaman di-refresh.
            </p>
          </div>
          <span className="px-2.5 py-1 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg text-[10px] font-medium text-[#70675F] shrink-0">
            Maks 25 MB
          </span>
        </div>

        {/* Drag & Drop Upload Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? 'border-[#C5A059] bg-[#C5A059]/10 scale-[1.005]'
              : 'border-[#E2D8C9] hover:border-[#C5A059] bg-[#FAF8F5] hover:bg-[#F7F3EC]'
          } ${isUploading ? 'opacity-60 pointer-events-none' : ''}`}
        >
          <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-[#E8DFD3] flex items-center justify-center text-[#C5A059]">
            {isUploading ? (
              <div className="w-6 h-6 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileAudio className="w-7 h-7" />
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-[#1F1D1B]">
              {isUploading ? 'Sedang menyimpan file MP3...' : 'Klik untuk memilih file MP3 atau seret ke sini'}
            </p>
            <p className="text-[11px] text-[#8C827A] mt-1 font-light">
              Mendukung format audio .mp3, .m4a, .wav (Disarankan MP3 dengan bitrate 128 - 192 kbps)
            </p>
          </div>

          <button
            type="button"
            disabled={isUploading}
            className="px-4 py-2 bg-white hover:bg-[#FAF8F5] text-[#242220] border border-[#D6C7B2] rounded-xl text-xs font-medium shadow-xs transition-colors pointer-events-none"
          >
            Pilih File dari Komputer
          </button>
        </div>

        {/* Feedback alerts */}
        {uploadError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {/* Stored Custom File Details Banner (if exists) */}
        {storedMeta && (
          <div className="p-4 rounded-xl border border-[#E8DFD3] bg-[#FAF8F5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#C5A059]/20 flex items-center justify-center text-[#C5A059] shrink-0">
                <FileAudio className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#1F1D1B] truncate">
                    {storedMeta.name}
                  </span>
                  <span className="text-[10px] text-[#70675F]">({storedMeta.formattedSize})</span>
                </div>
                <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Tersimpan di browser (tidak hilang saat refresh)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {!isCurrentCustom ? (
                <button
                  type="button"
                  onClick={handleUseStoredCustomAudio}
                  className="px-3 py-1.5 bg-[#C5A059] hover:bg-[#B38E47] text-white rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-xs"
                >
                  Gunakan File Ini
                </button>
              ) : (
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-medium">
                  Sedang Digunakan
                </span>
              )}

              <button
                type="button"
                onClick={handleDeleteCustomAudio}
                title="Hapus file dari penyimpanan"
                className="p-1.5 text-[#8C827A] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Curated Royalty-Free Presets */}
      <div className="bg-white rounded-2xl p-5 border border-[#EFE8DC] shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#C5A059]" />
          <h4 className="text-sm font-semibold text-[#1F1D1B]">Pilihan Musik Akustik Pernikahan</h4>
        </div>
        <p className="text-xs text-[#8C827A] font-light">
          Pilihan musik instrumen berlisensi bebas royalti yang tenang dan syahdu jika tidak memiliki file MP3 sendiri.
        </p>

        <div className="space-y-2 pt-2">
          {curatedTracks.map((track, i) => {
            const isCurrent = !isCurrentCustom && music.url === track.url;
            return (
              <div
                key={i}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isCurrent
                    ? 'border-[#C5A059] bg-[#FAF8F5] ring-1 ring-[#C5A059]'
                    : 'border-[#EFE8DC] hover:border-[#D6C7B2] bg-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-[#70675F] shrink-0">
                    <Music className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <h5 className="text-xs font-semibold text-[#1F1D1B] truncate">{track.title}</h5>
                    <span className="text-[11px] text-[#8C827A] font-light">{track.artist}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSelectCuratedTrack(track)}
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

      {/* 4. Optional Direct URL Input */}
      <div className="bg-white rounded-2xl p-5 border border-[#EFE8DC] shadow-xs space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-[#1F1D1B]">Atau Masukkan URL Audio MP3 Langsung</h4>
          <p className="text-xs text-[#8C827A] font-light mt-0.5">
            Jika lagu Anda telah di-hosting di server external, CDN, atau Google Drive direct link.
          </p>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-[#3D3833] mb-1">URL File Audio MP3</label>
            <input
              type="url"
              value={isCurrentCustom ? '' : music.url}
              onChange={(e) => {
                setUploadSuccess(null);
                onChange({
                  ...music,
                  url: e.target.value,
                  isCustomUpload: false,
                });
              }}
              placeholder={isCurrentCustom ? 'Sedang menggunakan file kustom yang diunggah' : 'https://example.com/audio/lagu-nikah.mp3'}
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8DFD3] rounded-xl focus:outline-none focus:border-[#C5A059]"
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

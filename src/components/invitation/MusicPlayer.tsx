import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { resolveAudioUrl } from '../../services/audioStorageService';

const FALLBACK_AUDIO_URLS = [
  'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
  'https://assets.mixkit.co/music/preview/mixkit-valley-sunset-127.mp3',
];

export interface MusicPlayerHandle {
  unlockAndPlay: () => void;
}

interface MusicPlayerProps {
  musicUrl: string;
  autoPlayTrigger?: boolean;
  autoPlayEnabled?: boolean;
  loopEnabled?: boolean;
}

function getInitialSyncAudioUrl(musicUrl: string): string {
  const trimmed = (musicUrl || '').trim();
  if (!trimmed) return FALLBACK_AUDIO_URLS[0];
  if (trimmed.startsWith('idb://') || trimmed.startsWith('indexeddb://')) {
    return '';
  }
  return trimmed;
}

export const MusicPlayer = forwardRef<MusicPlayerHandle, MusicPlayerProps>(
  ({ musicUrl, autoPlayTrigger = false, autoPlayEnabled = true, loopEnabled = true }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [resolvedSrc, setResolvedSrc] = useState<string>(() => getInitialSyncAudioUrl(musicUrl));
    const [fallbackIndex, setFallbackIndex] = useState<number>(0);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const hasStartedRef = useRef<boolean>(false);
    const userPausedRef = useRef<boolean>(false);
    const wasPlayingBeforeHideRef = useRef<boolean>(false);

    // Resolve URL synchronously for HTTP/HTTPS/data URLs, and asynchronously only for idb://
    useEffect(() => {
      let isMounted = true;
      setFallbackIndex(0);

      const syncUrl = getInitialSyncAudioUrl(musicUrl);
      if (syncUrl) {
        setResolvedSrc(syncUrl);
        return () => {
          isMounted = false;
        };
      }

      const targetUrl = musicUrl || FALLBACK_AUDIO_URLS[0];
      resolveAudioUrl(targetUrl)
        .then((url) => {
          if (isMounted) {
            setResolvedSrc(url || FALLBACK_AUDIO_URLS[0]);
          }
        })
        .catch(() => {
          if (isMounted) {
            setResolvedSrc(FALLBACK_AUDIO_URLS[0]);
          }
        });

      return () => {
        isMounted = false;
      };
    }, [musicUrl]);

    // Synchronously start or resume playback within user gesture stack when called directly
    const attemptPlay = useCallback(
      (fromUserGesture = false) => {
        const audio = audioRef.current;
        if (!audio || !resolvedSrc) return;
        if (!fromUserGesture && userPausedRef.current) return;

        try {
          audio.muted = false;
          if (audio.readyState === 0) {
            audio.load();
          }
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                hasStartedRef.current = true;
                setIsPlaying(true);
              })
              .catch(() => {
                // Mobile Safari / Android WebView blocked async play; keep gesture listeners armed
                setIsPlaying(false);
              });
          } else {
            hasStartedRef.current = true;
            setIsPlaying(true);
          }
        } catch {
          setIsPlaying(false);
        }
      },
      [resolvedSrc]
    );

    useImperativeHandle(
      ref,
      () => ({
        unlockAndPlay: () => {
          if (!autoPlayEnabled) return;
          userPausedRef.current = false;
          attemptPlay(true);
        },
      }),
      [autoPlayEnabled, attemptPlay]
    );

    // Attempt autoplay automatically when invitation opens or audio source finishes resolving
    useEffect(() => {
      if (autoPlayEnabled && autoPlayTrigger && resolvedSrc && !userPausedRef.current && !hasStartedRef.current) {
        attemptPlay(false);
      }
    }, [autoPlayEnabled, autoPlayTrigger, resolvedSrc, attemptPlay]);

    // Persistent gesture unlock fallback for strict iOS Safari / Android Chrome / WhatsApp WebViews:
    // Unlike `{ once: true }`, stays active only until playback actually succeeds or user manually pauses.
    useEffect(() => {
      if (!autoPlayEnabled || !autoPlayTrigger || !resolvedSrc || isPlaying || userPausedRef.current) {
        return;
      }

      const handleGestureUnlock = () => {
        if (!hasStartedRef.current && !userPausedRef.current) {
          attemptPlay(true);
        }
      };

      window.addEventListener('pointerdown', handleGestureUnlock, { passive: true });
      window.addEventListener('touchend', handleGestureUnlock, { passive: true });
      window.addEventListener('click', handleGestureUnlock, { passive: true });
      window.addEventListener('keydown', handleGestureUnlock, { passive: true });

      return () => {
        window.removeEventListener('pointerdown', handleGestureUnlock);
        window.removeEventListener('touchend', handleGestureUnlock);
        window.removeEventListener('click', handleGestureUnlock);
        window.removeEventListener('keydown', handleGestureUnlock);
      };
    }, [autoPlayEnabled, autoPlayTrigger, resolvedSrc, isPlaying, attemptPlay]);

    // Battery & CPU optimization: pause when backgrounded/tab switched, resume when returning
    useEffect(() => {
      const handleVisibilityChange = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (document.hidden) {
          if (!audio.paused) {
            wasPlayingBeforeHideRef.current = true;
            audio.pause();
          }
        } else if (wasPlayingBeforeHideRef.current && !userPausedRef.current) {
          wasPlayingBeforeHideRef.current = false;
          attemptPlay(false);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }, [attemptPlay]);

    const handleAudioError = () => {
      if (fallbackIndex < FALLBACK_AUDIO_URLS.length) {
        const nextFallback = FALLBACK_AUDIO_URLS[fallbackIndex];
        setFallbackIndex((prev) => prev + 1);
        if (nextFallback && nextFallback !== resolvedSrc) {
          setResolvedSrc(nextFallback);
        }
      }
    };

    const togglePlay = () => {
      const audio = audioRef.current;
      if (!audio) return;

      if (isPlaying || !audio.paused) {
        userPausedRef.current = true;
        wasPlayingBeforeHideRef.current = false;
        audio.pause();
        setIsPlaying(false);
      } else {
        userPausedRef.current = false;
        attemptPlay(true);
      }
    };

    return (
      <>
        <audio
          ref={audioRef}
          src={resolvedSrc || undefined}
          loop={loopEnabled}
          preload="metadata"
          playsInline
          onPlay={() => {
            hasStartedRef.current = true;
            setIsPlaying(true);
          }}
          onPause={() => setIsPlaying(false)}
          onError={handleAudioError}
        />
        <button
          id="btn-toggle-music"
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Matikan musik' : 'Putar musik'}
          className="fixed top-5 right-5 z-40 w-10 h-10 rounded-full bg-[#FFFFFF]/90 backdrop-blur-md border border-[#E4DCCE] shadow-md flex items-center justify-center text-[#2A2725] hover:bg-white active:scale-95 transition-all duration-300 cursor-pointer group"
        >
          {isPlaying ? (
            <div className="relative flex items-center justify-center">
              <Volume2 className="w-4 h-4 text-[#B89B72]" />
              <span className="absolute -inset-1 rounded-full border border-[#B89B72]/40 animate-ping" />
            </div>
          ) : (
            <VolumeX className="w-4 h-4 text-[#8C827A] group-hover:text-[#2A2725]" />
          )}
        </button>
      </>
    );
  }
);

MusicPlayer.displayName = 'MusicPlayer';

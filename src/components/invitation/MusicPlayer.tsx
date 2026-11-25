import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AlertCircle, Loader2, Play, RotateCw, Volume2, VolumeX } from 'lucide-react';
import { resolveStaticMusicUrl } from '../../constants/cmsDefaults';

export interface MusicPlayerHandle {
  unlockAndPlay: () => void;
}

interface MusicPlayerProps {
  musicUrl: string;
  autoPlayTrigger?: boolean;
  autoPlayEnabled?: boolean;
  loopEnabled?: boolean;
}

export const MusicPlayer = forwardRef<MusicPlayerHandle, MusicPlayerProps>(
  ({ musicUrl, autoPlayTrigger = false, autoPlayEnabled = true, loopEnabled = true }, ref) => {
    const resolvedSrc = useMemo(() => resolveStaticMusicUrl(musicUrl), [musicUrl]);

    const [isBuffering, setIsBuffering] = useState<boolean>(false);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(false);
    const [audioError, setAudioError] = useState<string | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const hasStartedRef = useRef<boolean>(false);
    const userPausedRef = useRef<boolean>(false);
    const isAttemptingPlayRef = useRef<boolean>(false);
    const wasPlayingBeforeHideRef = useRef<boolean>(false);

    // Reset playback tracking cleanly when track URL changes
    useEffect(() => {
      hasStartedRef.current = false;
      setIsPlaying(false);
      setIsBuffering(false);
      setAutoplayBlocked(false);
      setAudioError(null);
    }, [resolvedSrc]);

    // Ensure single audio instance & clean release on unmount
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

    // Core play execution: single audio element, prevents overlapping play() calls
    const attemptPlay = useCallback(
      (fromUserGesture = false) => {
        const audio = audioRef.current;
        if (!audio || !resolvedSrc) return;

        if (!fromUserGesture && userPausedRef.current) return;
        if (!audio.paused) {
          hasStartedRef.current = true;
          setIsPlaying(true);
          setAutoplayBlocked(false);
          return;
        }
        if (isAttemptingPlayRef.current && !fromUserGesture) return;

        try {
          isAttemptingPlayRef.current = true;
          audio.muted = false;
          setAudioError(null);

          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                isAttemptingPlayRef.current = false;
                hasStartedRef.current = true;
                setIsPlaying(true);
                setIsBuffering(false);
                setAutoplayBlocked(false);
              })
              .catch((err: unknown) => {
                isAttemptingPlayRef.current = false;
                const name = (err as { name?: string })?.name || '';
                setIsPlaying(false);
                setIsBuffering(false);

                if (name === 'AbortError') {
                  return;
                }

                // Autoplay blocked by browser policy (iOS Safari, Firefox, mobile WebView, etc.)
                setAutoplayBlocked(true);
              });
          } else {
            isAttemptingPlayRef.current = false;
            hasStartedRef.current = true;
            setIsPlaying(true);
            setAutoplayBlocked(false);
          }
        } catch {
          isAttemptingPlayRef.current = false;
          setIsPlaying(false);
          setAutoplayBlocked(true);
        }
      },
      [resolvedSrc]
    );

    // Triggered synchronously when visitor clicks "Buka Undangan"
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

    // Autoplay attempt when invitation opens (e.g. direct/initial opened states)
    useEffect(() => {
      if (autoPlayEnabled && autoPlayTrigger && resolvedSrc && !userPausedRef.current && !hasStartedRef.current) {
        attemptPlay(false);
      }
    }, [autoPlayEnabled, autoPlayTrigger, resolvedSrc, attemptPlay]);

    // Fallback user-gesture unlock when browser blocks initial autoplay
    useEffect(() => {
      if (!autoPlayEnabled || !autoPlayTrigger || !resolvedSrc || isPlaying || userPausedRef.current || audioError) {
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

      return () => {
        window.removeEventListener('pointerdown', handleGestureUnlock);
        window.removeEventListener('touchend', handleGestureUnlock);
        window.removeEventListener('click', handleGestureUnlock);
      };
    }, [autoPlayEnabled, autoPlayTrigger, resolvedSrc, isPlaying, audioError, attemptPlay]);

    // Pause when tab/app is backgrounded, resume when returning
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

    const handleRetry = () => {
      const audio = audioRef.current;
      if (!audio || !resolvedSrc) return;
      userPausedRef.current = false;
      setAudioError(null);
      setIsBuffering(true);
      audio.load();
      attemptPlay(true);
    };

    const togglePlay = () => {
      if (audioError) {
        handleRetry();
        return;
      }

      const audio = audioRef.current;
      if (!audio) return;

      if (isPlaying || !audio.paused) {
        userPausedRef.current = true;
        wasPlayingBeforeHideRef.current = false;
        audio.pause();
        setIsPlaying(false);
        setAutoplayBlocked(false);
      } else {
        userPausedRef.current = false;
        attemptPlay(true);
      }
    };

    const showManualPlayPill =
      autoPlayTrigger &&
      !isPlaying &&
      !isBuffering &&
      !userPausedRef.current &&
      (autoplayBlocked || !hasStartedRef.current) &&
      !audioError &&
      Boolean(resolvedSrc);

    const showErrorPill = autoPlayTrigger && Boolean(audioError);

    return (
      <>
        <audio
          ref={audioRef}
          src={resolvedSrc}
          loop={loopEnabled}
          preload="metadata"
          playsInline
          onLoadStart={() => {
            if (resolvedSrc && autoPlayTrigger) setIsBuffering(true);
          }}
          onLoadedData={() => {
            setIsBuffering(false);
            setAudioError(null);
          }}
          onCanPlay={() => {
            setIsBuffering(false);
            setAudioError(null);
          }}
          onCanPlayThrough={() => {
            setIsBuffering(false);
            setAudioError(null);
          }}
          onWaiting={() => {
            if (autoPlayTrigger && !userPausedRef.current) setIsBuffering(true);
          }}
          onPlaying={() => {
            hasStartedRef.current = true;
            setIsPlaying(true);
            setIsBuffering(false);
            setAutoplayBlocked(false);
            setAudioError(null);
          }}
          onPlay={() => {
            hasStartedRef.current = true;
            setIsPlaying(true);
            setAutoplayBlocked(false);
          }}
          onPause={() => {
            setIsPlaying(false);
            setIsBuffering(false);
          }}
          onEnded={() => {
            if (!loopEnabled) {
              setIsPlaying(false);
            }
          }}
          onError={() => {
            setIsPlaying(false);
            setIsBuffering(false);
            setAudioError('File audio tidak dapat dimuat. Ketuk untuk mencoba lagi.');
          }}
        />

        <div className="fixed top-5 right-5 z-40 flex items-center gap-2">
          {/* Manual Play prompt if browser blocked autoplay after "Buka Undangan" */}
          {showManualPlayPill && (
            <button
              type="button"
              onClick={() => {
                userPausedRef.current = false;
                attemptPlay(true);
              }}
              className="px-3 py-1.5 rounded-full bg-[#FFFFFF]/95 backdrop-blur-md border border-[#D6C7B2] shadow-md flex items-center gap-1.5 text-[11px] font-medium text-[#242220] hover:bg-white active:scale-95 transition-all cursor-pointer animate-in fade-in"
            >
              <Play className="w-3 h-3 text-[#B89B72] fill-[#B89B72]" />
              <span>Putar Musik</span>
            </button>
          )}

          {/* Error Retry Pill */}
          {showErrorPill && (
            <button
              type="button"
              onClick={handleRetry}
              title={audioError || 'Audio gagal dimuat'}
              className="px-3 py-1.5 rounded-full bg-[#FFFFFF]/95 backdrop-blur-md border border-amber-300 shadow-md flex items-center gap-1.5 text-[11px] font-medium text-amber-900 hover:bg-white active:scale-95 transition-all cursor-pointer"
            >
              <RotateCw className="w-3 h-3 text-amber-700" />
              <span>Muat Ulang Musik</span>
            </button>
          )}

          {/* Main Floating Play / Pause Button */}
          <button
            id="btn-toggle-music"
            type="button"
            onClick={togglePlay}
            aria-label={
              audioError
                ? 'Muat ulang musik'
                : isPlaying
                ? 'Jeda musik'
                : 'Putar musik'
            }
            title={
              audioError
                ? audioError
                : isPlaying
                ? 'Jeda musik'
                : 'Putar musik'
            }
            className="w-10 h-10 rounded-full bg-[#FFFFFF]/90 backdrop-blur-md border border-[#E4DCCE] shadow-md flex items-center justify-center text-[#2A2725] hover:bg-white active:scale-95 transition-all duration-300 cursor-pointer group"
          >
            {isBuffering ? (
              <Loader2 className="w-4 h-4 text-[#B89B72] animate-spin" />
            ) : audioError ? (
              <AlertCircle className="w-4 h-4 text-amber-600" />
            ) : isPlaying ? (
              <div className="relative flex items-center justify-center">
                <Volume2 className="w-4 h-4 text-[#B89B72]" />
                <span className="absolute -inset-1 rounded-full border border-[#B89B72]/40 animate-ping" />
              </div>
            ) : (
              <VolumeX className="w-4 h-4 text-[#8C827A] group-hover:text-[#2A2725]" />
            )}
          </button>
        </div>
      </>
    );
  }
);

MusicPlayer.displayName = 'MusicPlayer';

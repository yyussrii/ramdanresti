import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { resolveAudioUrl } from '../../services/audioStorageService';

interface MusicPlayerProps {
  musicUrl: string;
  autoPlayTrigger?: boolean;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ musicUrl, autoPlayTrigger }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasTriggeredPlay = useRef<boolean>(false);

  // Resolve audio URL (handles idb://, https://, and remote device fallbacks)
  useEffect(() => {
    let isMounted = true;
    const targetUrl = musicUrl || 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3';

    resolveAudioUrl(targetUrl)
      .then((url) => {
        if (isMounted) {
          setResolvedSrc(url || 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3');
        }
      })
      .catch((err) => {
        console.warn('[MusicPlayer] Failed to resolve audio URL:', err);
        if (isMounted) {
          setResolvedSrc('https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [musicUrl]);

  // Robust play execution function
  const attemptPlay = () => {
    if (!audioRef.current || !resolvedSrc) return;
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          hasTriggeredPlay.current = true;
        })
        .catch((err) => {
          console.info('[Audio] Autoplay pending user interaction:', err);
          setIsPlaying(false);
        });
    }
  };

  // Autoplay trigger when user clicks "Buka Undangan"
  useEffect(() => {
    if (autoPlayTrigger && resolvedSrc) {
      attemptPlay();
    }
  }, [autoPlayTrigger, resolvedSrc]);

  // Mobile User Interaction listener:
  // If the mobile browser blocked autoplay when page loaded, the very first touch/click
  // anywhere on the screen (or on "Buka Undangan") will instantly unlock and play the audio
  useEffect(() => {
    if (!resolvedSrc) return;

    const handleFirstUserInteraction = () => {
      if (autoPlayTrigger && !isPlaying && !hasTriggeredPlay.current) {
        attemptPlay();
      }
    };

    window.addEventListener('click', handleFirstUserInteraction, { once: true, passive: true });
    window.addEventListener('touchstart', handleFirstUserInteraction, { once: true, passive: true });

    return () => {
      window.removeEventListener('click', handleFirstUserInteraction);
      window.removeEventListener('touchstart', handleFirstUserInteraction);
    };
  }, [resolvedSrc, autoPlayTrigger, isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          hasTriggeredPlay.current = true;
        })
        .catch((e) => console.warn('[Audio] Play error:', e));
    }
  };

  if (!resolvedSrc) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={resolvedSrc}
        loop
        preload="auto"
      />
      <button
        id="btn-toggle-music"
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
};


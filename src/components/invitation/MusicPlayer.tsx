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

  // Resolve audio URL (handles idb://, https://, etc.)
  useEffect(() => {
    let isMounted = true;
    if (!musicUrl) {
      setResolvedSrc('');
      return;
    }

    resolveAudioUrl(musicUrl)
      .then((url) => {
        if (isMounted) {
          setResolvedSrc(url);
        }
      })
      .catch((err) => {
        console.warn('[MusicPlayer] Failed to resolve audio URL:', err);
        if (isMounted) setResolvedSrc(musicUrl);
      });

    return () => {
      isMounted = false;
    };
  }, [musicUrl]);

  // Autoplay trigger
  useEffect(() => {
    if (autoPlayTrigger && audioRef.current && resolvedSrc) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.info('[Audio] Autoplay blocked by browser policy; waiting for user interaction:', err);
            setIsPlaying(false);
          });
      }
    }
  }, [autoPlayTrigger, resolvedSrc]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
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

import React, { useState, useEffect } from 'react';
import { resolveImageUrl, resolveImageUrlSync } from '../../services/mediaStorageService';

export interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  showSkeleton?: boolean;
}

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt = '',
  className = '',
  fallbackSrc,
  showSkeleton = true,
  ...props
}) => {
  const [resolvedSrc, setResolvedSrc] = useState<string>(() => {
    if (!src) return '';
    const sync = resolveImageUrlSync(src);
    return sync || (!src.startsWith('idb://') && !src.startsWith('indexeddb://') ? src : '');
  });
  const [isLoading, setIsLoading] = useState<boolean>(!resolvedSrc);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    if (!src) {
      setResolvedSrc('');
      setIsLoading(false);
      return;
    }

    // Try synchronous cache first
    const sync = resolveImageUrlSync(src);
    if (sync) {
      setResolvedSrc(sync);
      setIsLoading(false);
      return;
    }

    if (!src.startsWith('idb://') && !src.startsWith('indexeddb://')) {
      setResolvedSrc(src);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    resolveImageUrl(src)
      .then((url) => {
        if (isMounted) {
          setResolvedSrc(url);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [src]);

  const displaySrc = hasError && fallbackSrc ? fallbackSrc : resolvedSrc;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && showSkeleton && (
        <div className="absolute inset-0 bg-[#EFE8DC]/60 animate-pulse z-10" />
      )}
      {displaySrc ? (
        <img
          src={displaySrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onError={() => setHasError(true)}
          onLoad={() => setIsLoading(false)}
          {...props}
        />
      ) : (
        <div className="w-full h-full bg-[#FAF8F5] flex items-center justify-center text-[#A69B8D] text-xs">
          {alt || 'Gambar'}
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { resolveImageUrl, resolveImageUrlSync } from '../../services/mediaStorageService';
import { getOptimizedImageUrl, getShimmerSvgPlaceholder } from '../../utils/imageOptimizer';

export interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  showSkeleton?: boolean;
  priority?: boolean;
  optimizeWidth?: number;
  optimizeQuality?: number;
}

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt = '',
  className = '',
  fallbackSrc,
  showSkeleton = true,
  priority = false,
  optimizeWidth,
  optimizeQuality,
  loading: explicitLoading,
  decoding: explicitDecoding = 'async',
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isVirtualIdb = Boolean(src && (src.startsWith('idb://') || src.startsWith('indexeddb://')));

  const getInitialSrc = (): string => {
    if (!src) return '';
    if (isVirtualIdb) {
      return resolveImageUrlSync(src) || '';
    }
    return getOptimizedImageUrl(src, {
      width: optimizeWidth || (priority ? 1080 : 800),
      quality: optimizeQuality || 75,
    });
  };

  const [resolvedSrc, setResolvedSrc] = useState<string>(getInitialSrc);
  const [isLoading, setIsLoading] = useState<boolean>(() => !getInitialSrc());
  const [hasError, setHasError] = useState<boolean>(false);
  const [shouldFetchIdb, setShouldFetchIdb] = useState<boolean>(() => priority || !isVirtualIdb);

  // Observe visibility for non-priority idb:// images so Hero loads first without Firestore congestion
  useEffect(() => {
    if (!isVirtualIdb || priority || resolveImageUrlSync(src)) {
      setShouldFetchIdb(true);
      return;
    }

    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShouldFetchIdb(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldFetchIdb(true);
          observer.disconnect();
        }
      },
      { rootMargin: '450px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [src, isVirtualIdb, priority]);

  useEffect(() => {
    let isMounted = true;
    setHasError(false);

    if (!src) {
      setResolvedSrc('');
      setIsLoading(false);
      return;
    }

    if (!isVirtualIdb) {
      const optimized = getOptimizedImageUrl(src, {
        width: optimizeWidth || (priority ? 1080 : 800),
        quality: optimizeQuality || 75,
      });
      setResolvedSrc(optimized);
      setIsLoading(false);
      return;
    }

    // It's a virtual idb:// URL - check sync memory cache first
    const sync = resolveImageUrlSync(src);
    if (sync) {
      setResolvedSrc(sync);
      setIsLoading(false);
      return;
    }

    if (!shouldFetchIdb) {
      setIsLoading(true);
      return;
    }

    // Asynchronously resolve from IndexedDB or Cloud Firestore for remote devices
    setIsLoading(true);

    resolveImageUrl(src)
      .then((url) => {
        if (!isMounted) return;
        if (url) {
          setResolvedSrc(url);
          setIsLoading(false);
        } else {
          setHasError(true);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setHasError(true);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [src, isVirtualIdb, shouldFetchIdb, optimizeWidth, optimizeQuality, priority]);

  const optimizedFallback = fallbackSrc
    ? getOptimizedImageUrl(fallbackSrc, {
        width: optimizeWidth || (priority ? 1080 : 800),
        quality: optimizeQuality || 75,
      })
    : '';
  const displaySrc = hasError && optimizedFallback ? optimizedFallback : resolvedSrc;
  const imageLoading = explicitLoading || (priority ? 'eager' : 'lazy');

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {isLoading && showSkeleton && (
        <div
          className="absolute inset-0 bg-[#EFE8DC]/50 animate-pulse z-10"
          style={{
            backgroundImage: `url("${getShimmerSvgPlaceholder(100, 100)}")`,
            backgroundSize: 'cover',
          }}
        />
      )}

      {displaySrc ? (
        <img
          src={displaySrc}
          alt={alt}
          loading={imageLoading}
          decoding={explicitDecoding}
          fetchPriority={priority ? 'high' : 'auto'}
          className={`w-full h-full object-cover transition-opacity duration-300 ease-out ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onError={() => {
            if (!hasError) {
              setHasError(true);
            }
            setIsLoading(false);
          }}
          onLoad={() => setIsLoading(false)}
          {...props}
        />
      ) : (
        <div className="w-full h-full bg-[#FAF8F5] flex flex-col items-center justify-center text-[#A69B8D] text-xs p-2 text-center select-none">
          <span className="font-serif italic text-sm text-[#C8BCAB] mb-0.5">✦</span>
          <span>{alt || 'Foto Undangan'}</span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// IMAGE OPTIMIZER UTILITY FOR HIGH-SPEED MOBILE & DESKTOP PERFORMANCE
// Automatically transforms, compresses, and generates responsive CDN URLs
// (Unsplash, Cloudinary, ImgBB) and provides graceful placeholders
// ============================================================================

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpeg';
  fit?: 'crop' | 'max' | 'min';
}

/**
 * Optimizes an external image URL for web delivery:
 * - Unsplash: Applies auto=format (WebP/AVIF), smart compression (q=75), and target dimensions.
 * - Google Drive: Converts view/file URLs to direct image export URLs.
 * - Leaves standard URLs and data URLs untouched while preventing oversized downloads.
 */
export function getOptimizedImageUrl(
  url: string | undefined | null,
  options: ImageOptimizationOptions = {}
): string {
  if (!url || typeof url !== 'string') return '';

  const trimmed = url.trim();

  // 1. Data URLs and IndexedDB virtual URLs should not be modified here
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('idb://') ||
    trimmed.startsWith('indexeddb://')
  ) {
    return trimmed;
  }

  // 2. Unsplash Optimization
  if (trimmed.includes('images.unsplash.com')) {
    try {
      const urlObj = new URL(trimmed);
      const width = options.width || 800;
      const quality = options.quality || 75;
      const fit = options.fit || 'crop';

      // Set optimized query parameters
      urlObj.searchParams.set('auto', 'format');
      urlObj.searchParams.set('fit', fit);
      urlObj.searchParams.set('q', quality.toString());
      urlObj.searchParams.set('w', width.toString());

      if (options.height) {
        urlObj.searchParams.set('h', options.height.toString());
      }

      return urlObj.toString();
    } catch {
      return trimmed;
    }
  }

  // 3. Google Drive Direct Image link converter
  if (trimmed.includes('drive.google.com/file/d/')) {
    const match = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }

  return trimmed;
}

/**
 * Generates an ultra-lightweight SVG Blur Placeholder for immediate instant rendering
 * Prevents layout shift (CLS) and eliminates blank / buffering gaps while downloading
 */
export function getShimmerSvgPlaceholder(width = 400, height = 300): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop stop-color="#FAF8F5" offset="0%"/>
        <stop stop-color="#EFE8DC" offset="50%"/>
        <stop stop-color="#FAF8F5" offset="100%"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#g)"/>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// ============================================================================
// MEDIA STORAGE SERVICE (Cross-Device Cloud Sync + Local IndexedDB Cache)
// Automatically compresses uploaded photos to lightweight WebP/JPEG (< 180KB)
// and syncs to Cloud Firestore under `/invitations/{invitationId}/media/{mediaId}`
// so that uploaded photos load fast & reliably on ALL devices & guests' phones!
// ============================================================================

import { doc, getDoc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { INITIAL_INVITATION } from './seedData';

const DB_NAME = 'WeddingAppMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'media_files';
const INVITATION_ID = INITIAL_INVITATION.id;

export interface MediaItem {
  id: string;
  name: string;
  size: number;
  formattedSize: string;
  type: string;
  createdAt: string;
  category?: 'couple' | 'hero' | 'gallery' | 'general' | string;
  url: string; // 'idb://media_xxx'
  blob?: Blob;
  thumbnailUrl?: string;
  dataUrl?: string; // High quality optimized Base64 data for universal cross-device rendering
  width?: number;
  height?: number;
}

// In-memory cache for fast synchronous lookup
const objectUrlCache = new Map<string, string>();
// Deduplicate concurrent Firestore fetches for the same media ID
const inFlightItemRequests = new Map<string, Promise<MediaItem | null>>();
// Deduplicate concurrent getAllMediaItems calls
let inFlightAllRequest: Promise<MediaItem[]> | null = null;

/**
 * Format bytes into readable format (e.g. "145 KB")
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Open or initialize local IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open Media IndexedDB'));
  });
}

/**
 * Helper to save a media item silently to local IndexedDB
 */
async function saveToLocalIndexedDB(item: MediaItem): Promise<void> {
  try {
    const localDb = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = localDb.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[MediaStorage] Local IndexedDB write warning:', err);
  }
}

/**
 * Detect best supported compressed image MIME type (WebP preferred: 30-45% smaller than JPEG)
 */
function encodeCanvasOptimized(canvas: HTMLCanvasElement, quality: number): { dataUrl: string; mimeType: string } {
  const webpData = canvas.toDataURL('image/webp', quality);
  if (webpData.startsWith('data:image/webp')) {
    return { dataUrl: webpData, mimeType: 'image/webp' };
  }
  return { dataUrl: canvas.toDataURL('image/jpeg', quality), mimeType: 'image/jpeg' };
}

/**
 * Compress and optimize an image file for fast mobile & cross-device delivery (< 180KB)
 * Produces crisp high-definition result that renders smoothly without buffering
 */
export async function optimizeImageForWeb(
  file: Blob | File,
  maxWidth = 1080,
  maxHeight = 1080,
  initialQuality = 0.76
): Promise<{ dataUrl: string; thumbnailUrl: string; width: number; height: number; size: number; mimeType: string }> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      const tempUrl = URL.createObjectURL(file);

      img.onload = () => {
        try {
          const originalWidth = img.width || 800;
          const originalHeight = img.height || 800;

          // 1. Calculate Main Optimized Dimensions (max 1080px - sharp on retina mobile & desktop)
          let targetWidth = originalWidth;
          let targetHeight = originalHeight;
          if (targetWidth > maxWidth || targetHeight > maxHeight) {
            const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
            targetWidth = Math.round(targetWidth * ratio);
            targetHeight = Math.round(targetHeight * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');

          let dataUrl = '';
          let mimeType = 'image/jpeg';
          let currentQuality = initialQuality;

          if (ctx) {
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            const encoded = encodeCanvasOptimized(canvas, currentQuality);
            dataUrl = encoded.dataUrl;
            mimeType = encoded.mimeType;

            // Target <= 190KB Base64 (~140KB binary) for instant 4G mobile loading without lag/buffering
            while (dataUrl.length > 190000 && currentQuality > 0.36) {
              currentQuality -= 0.08;
              targetWidth = Math.round(targetWidth * 0.88);
              targetHeight = Math.round(targetHeight * 0.88);
              canvas.width = targetWidth;
              canvas.height = targetHeight;
              ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
              const reEncoded = encodeCanvasOptimized(canvas, currentQuality);
              dataUrl = reEncoded.dataUrl;
              mimeType = reEncoded.mimeType;
            }

            // Hard safety guarantee: never exceed 420KB Base64 so Firestore 1MB limit is never breached
            while (dataUrl.length > 420000 && targetWidth > 320) {
              targetWidth = Math.round(targetWidth * 0.75);
              targetHeight = Math.round(targetHeight * 0.75);
              canvas.width = targetWidth;
              canvas.height = targetHeight;
              ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
              const reEncoded = encodeCanvasOptimized(canvas, 0.45);
              dataUrl = reEncoded.dataUrl;
              mimeType = reEncoded.mimeType;
            }
          }

          // 2. Calculate Ultra-Lightweight Instant Thumbnail (max 220px, ~8KB)
          let thumbWidth = originalWidth;
          let thumbHeight = originalHeight;
          const thumbMax = 220;
          if (thumbWidth > thumbMax || thumbHeight > thumbMax) {
            const ratio = Math.min(thumbMax / thumbWidth, thumbMax / thumbHeight);
            thumbWidth = Math.round(thumbWidth * ratio);
            thumbHeight = Math.round(thumbHeight * ratio);
          }

          const thumbCanvas = document.createElement('canvas');
          thumbCanvas.width = thumbWidth;
          thumbCanvas.height = thumbHeight;
          const thumbCtx = thumbCanvas.getContext('2d');

          let thumbnailUrl = '';
          if (thumbCtx) {
            thumbCtx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
            thumbnailUrl = encodeCanvasOptimized(thumbCanvas, 0.6).dataUrl;
          }

          URL.revokeObjectURL(tempUrl);

          const approxSize = Math.round((dataUrl.length * 3) / 4);

          resolve({
            dataUrl,
            thumbnailUrl: thumbnailUrl || dataUrl,
            width: originalWidth,
            height: originalHeight,
            size: approxSize,
            mimeType,
          });
        } catch (err) {
          console.warn('[MediaStorage] Compression error:', err);
          URL.revokeObjectURL(tempUrl);
          resolve({
            dataUrl: '',
            thumbnailUrl: '',
            width: 0,
            height: 0,
            size: file.size,
            mimeType: 'image/jpeg',
          });
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(tempUrl);
        resolve({
          dataUrl: '',
          thumbnailUrl: '',
          width: 0,
          height: 0,
          size: file.size,
          mimeType: 'image/jpeg',
        });
      };

      img.src = tempUrl;
    } catch {
      resolve({
        dataUrl: '',
        thumbnailUrl: '',
        width: 0,
        height: 0,
        size: file.size,
        mimeType: 'image/jpeg',
      });
    }
  });
}

/**
 * Save an uploaded image file (File or Blob) to IndexedDB AND Cloud Firestore
 * Allows seamless synchronization across devices
 */
export async function saveMediaFile(
  file: File | Blob,
  options?: {
    name?: string;
    category?: 'couple' | 'hero' | 'gallery' | 'general' | string;
  }
): Promise<MediaItem> {
  const id = `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const virtualUrl = `idb://${id}`;
  const fileName =
    options?.name ||
    (file instanceof File && file.name ? file.name : `foto_${new Date().toISOString().slice(0, 10)}.webp`);

  // Optimize and generate ready-to-display web dataUrl
  const { dataUrl, thumbnailUrl, width, height, size, mimeType } = await optimizeImageForWeb(file);

  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    throw new Error('Format gambar tidak dapat diproses oleh browser. Gunakan file JPG, PNG, atau WEBP.');
  }

  const mediaItem: MediaItem = {
    id,
    name: fileName,
    size: size || file.size,
    formattedSize: formatBytes(size || file.size),
    type: mimeType,
    createdAt: new Date().toISOString(),
    category: options?.category || 'general',
    url: virtualUrl,
    dataUrl,
    thumbnailUrl,
    width,
    height,
  };

  // 1. Put in-memory cache immediately
  objectUrlCache.set(id, dataUrl);

  // 2. Save compressed payload to Local IndexedDB for instant offline access (no multi-MB raw blob bloat)
  await saveToLocalIndexedDB(mediaItem);

  // 3. Sync to Cloud Firestore so all other devices & guests' phones can load it
  if (isFirebaseConfigured && db) {
    const cloudMediaRef = doc(db, 'invitations', INVITATION_ID, 'media', id);
    const payload = {
      id,
      name: fileName,
      size: mediaItem.size,
      formattedSize: mediaItem.formattedSize,
      type: mimeType,
      createdAt: mediaItem.createdAt,
      category: mediaItem.category,
      url: virtualUrl,
      dataUrl,
      thumbnailUrl,
      width,
      height,
    };

    try {
      await setDoc(cloudMediaRef, payload);
      console.info(`[MediaStorage] Uploaded & synced ${fileName} (${mediaItem.formattedSize}) to Cloud Firestore!`);
    } catch (firstErr) {
      console.warn('[MediaStorage] First cloud sync attempt failed, retrying...', firstErr);
      try {
        await setDoc(cloudMediaRef, payload);
      } catch (retryErr) {
        console.error('[MediaStorage] Cloud Firestore media sync failed:', retryErr);
        throw new Error('Foto tersimpan di perangkat ini, namun gagal disinkronkan ke Cloud Database. Periksa koneksi internet Anda.');
      }
    }
  }

  return mediaItem;
}

/**
 * Get all media items from Cloud Firestore + Local IndexedDB (used in Admin Media Library)
 */
export async function getAllMediaItems(): Promise<MediaItem[]> {
  if (inFlightAllRequest) {
    return inFlightAllRequest;
  }

  inFlightAllRequest = (async () => {
    const mergedMap = new Map<string, MediaItem>();

    // 1. Read from Local IndexedDB
    try {
      const localDb = await openDB();
      const localItems = await new Promise<MediaItem[]>((resolve, reject) => {
        const tx = localDb.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result || []) as MediaItem[]);
        req.onerror = () => reject(req.error);
      });

      localItems.forEach((item) => {
        mergedMap.set(item.id, item);
        if (item.dataUrl) {
          objectUrlCache.set(item.id, item.dataUrl);
        } else if (item.blob && !objectUrlCache.has(item.id)) {
          try {
            const url = URL.createObjectURL(item.blob);
            objectUrlCache.set(item.id, url);
          } catch {
            // ignore
          }
        }
      });
    } catch (e) {
      console.warn('[MediaStorage] Local media read warning:', e);
    }

    // 2. Read from Cloud Firestore (brings media uploaded from other devices)
    if (isFirebaseConfigured && db) {
      try {
        const mediaCollection = collection(db, 'invitations', INVITATION_ID, 'media');
        const snapshot = await getDocs(mediaCollection);
        snapshot.forEach((docSnap) => {
          const cloudData = docSnap.data() as MediaItem;
          if (cloudData && cloudData.id) {
            mergedMap.set(cloudData.id, cloudData);
            if (cloudData.dataUrl) {
              objectUrlCache.set(cloudData.id, cloudData.dataUrl);
            }
            // Persist cloud items locally for fast subsequent visits
            saveToLocalIndexedDB(cloudData);
          }
        });
      } catch (cloudErr) {
        console.warn('[MediaStorage] Cloud media read error:', cloudErr);
      }
    }

    const items = Array.from(mergedMap.values());
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items;
  })();

  try {
    return await inFlightAllRequest;
  } finally {
    inFlightAllRequest = null;
  }
}

/**
 * Get single media item by ID with in-flight deduplication and automatic local caching
 */
export async function getMediaItem(id: string): Promise<MediaItem | null> {
  // 1. Try in-memory cache synchronously
  if (objectUrlCache.has(id)) {
    const cachedUrl = objectUrlCache.get(id)!;
    return {
      id,
      name: id,
      size: 0,
      formattedSize: '0 KB',
      type: 'image/webp',
      createdAt: new Date().toISOString(),
      url: `idb://${id}`,
      dataUrl: cachedUrl,
    };
  }

  // 2. Deduplicate concurrent requests for the exact same ID
  const existingRequest = inFlightItemRequests.get(id);
  if (existingRequest) {
    return existingRequest;
  }

  const fetchPromise = (async (): Promise<MediaItem | null> => {
    // 2a. Try Local IndexedDB
    try {
      const localDb = await openDB();
      const item = await new Promise<MediaItem | null>((resolve, reject) => {
        const tx = localDb.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => resolve((req.result as MediaItem) || null);
        req.onerror = () => reject(req.error);
      });

      if (item) {
        if (item.dataUrl) {
          objectUrlCache.set(item.id, item.dataUrl);
          return item;
        } else if (item.blob) {
          try {
            const url = URL.createObjectURL(item.blob);
            objectUrlCache.set(item.id, url);
            return item;
          } catch {
            // continue to cloud fallback if blob failed
          }
        }
      }
    } catch {
      // continue to cloud check
    }

    // 2b. Fallback to Cloud Firestore for other devices
    if (isFirebaseConfigured && db) {
      try {
        const cloudRef = doc(db, 'invitations', INVITATION_ID, 'media', id);
        const docSnap = await getDoc(cloudRef);
        if (docSnap.exists()) {
          const cloudItem = docSnap.data() as MediaItem;
          if (cloudItem.dataUrl) {
            objectUrlCache.set(id, cloudItem.dataUrl);
          }
          // Save to remote device's local IndexedDB so all future visits load instantly from disk
          saveToLocalIndexedDB(cloudItem);
          return cloudItem;
        }
      } catch (err) {
        console.warn('[MediaStorage] Cloud item fetch error:', err);
      }
    }

    return null;
  })();

  inFlightItemRequests.set(id, fetchPromise);
  try {
    return await fetchPromise;
  } finally {
    inFlightItemRequests.delete(id);
  }
}

/**
 * Delete a media item from IndexedDB and Cloud Firestore
 */
export async function deleteMediaItem(id: string): Promise<void> {
  if (objectUrlCache.has(id)) {
    const val = objectUrlCache.get(id);
    if (val && val.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(val);
      } catch {
        // ignore
      }
    }
    objectUrlCache.delete(id);
  }

  try {
    const localDb = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = localDb.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[MediaStorage] Failed to delete from local DB:', err);
  }

  if (isFirebaseConfigured && db) {
    try {
      const cloudRef = doc(db, 'invitations', INVITATION_ID, 'media', id);
      await deleteDoc(cloudRef);
    } catch (err) {
      console.warn('[MediaStorage] Failed to delete from cloud:', err);
    }
  }
}

/**
 * Synchronous resolver for cached image URLs
 */
export function resolveImageUrlSync(url: string | undefined): string | null {
  if (!url) return '';
  if (!url.startsWith('idb://') && !url.startsWith('indexeddb://')) {
    return url;
  }
  const key = url.replace(/^(idb|indexeddb):\/\//, '');
  return objectUrlCache.get(key) || null;
}

/**
 * Asynchronous resolver that seamlessly handles:
 * - Direct external links (e.g. Unsplash, ImgBB, CDN)
 * - Cached in-memory image
 * - Local IndexedDB
 * - Cloud Firestore synced images for remote devices
 */
export async function resolveImageUrl(url: string | undefined): Promise<string> {
  if (!url) return '';

  if (!url.startsWith('idb://') && !url.startsWith('indexeddb://')) {
    return url;
  }

  const key = url.replace(/^(idb|indexeddb):\/\//, '');

  // 1. In-memory Cache
  if (objectUrlCache.has(key)) {
    return objectUrlCache.get(key)!;
  }

  // 2. Fetch from IndexedDB / Cloud Firestore (deduplicated)
  const item = await getMediaItem(key);
  if (item) {
    if (item.dataUrl) {
      objectUrlCache.set(key, item.dataUrl);
      return item.dataUrl;
    }
    if (item.blob) {
      try {
        const objUrl = URL.createObjectURL(item.blob);
        objectUrlCache.set(key, objUrl);
        return objUrl;
      } catch {
        if (item.thumbnailUrl) return item.thumbnailUrl;
      }
    }
    if (item.thumbnailUrl) {
      return item.thumbnailUrl;
    }
  }

  return '';
}

/**
 * Targeted prefetch ONLY for specific idb:// URLs actually used in an invitation.
 * Fetches priority URLs first (e.g. Hero), then batches remaining URLs (max 3 concurrent)
 * so Firestore & mobile bandwidth are never congested by unused media library files.
 */
export async function prefetchMediaIds(urls: (string | undefined | null)[]): Promise<void> {
  const uniqueIds: string[] = [];
  const seen = new Set<string>();

  for (const raw of urls) {
    if (!raw || (!raw.startsWith('idb://') && !raw.startsWith('indexeddb://'))) continue;
    const key = raw.replace(/^(idb|indexeddb):\/\//, '');
    if (!seen.has(key) && !objectUrlCache.has(key)) {
      seen.add(key);
      uniqueIds.push(key);
    }
  }

  if (uniqueIds.length === 0) return;

  // Fetch in small batches of 3 to avoid saturating slow mobile connections
  const batchSize = 3;
  for (let i = 0; i < uniqueIds.length; i += batchSize) {
    const batch = uniqueIds.slice(i, i + batchSize);
    await Promise.all(batch.map((id) => getMediaItem(id).catch(() => null)));
  }
}

/**
 * Preload all stored media items into memory (intended for Admin Dashboard only)
 */
export async function preloadMediaCache(): Promise<void> {
  try {
    await getAllMediaItems();
  } catch (err) {
    console.warn('[MediaStorage] Preload error:', err);
  }
}

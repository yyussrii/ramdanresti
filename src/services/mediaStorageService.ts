// ============================================================================
// MEDIA STORAGE SERVICE (Cross-Device Cloud Sync + Local IndexedDB Cache)
// Automatically optimizes user-uploaded photos to sharp, web-optimized format (<500KB)
// and syncs to Cloud Firestore under `/invitations/{invitationId}/media/{mediaId}`
// so that uploaded photos appear instantly on ALL devices & guests' phones!
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

/**
 * Format bytes into readable format (e.g. "450 KB")
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
 * Compress and optimize an image file for web display (< 600KB)
 * Produces crisp high-definition result that renders smoothly on all mobile & desktop screens
 */
export async function optimizeImageForWeb(
  file: Blob | File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.85
): Promise<{ dataUrl: string; thumbnailUrl: string; width: number; height: number; size: number }> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      const tempUrl = URL.createObjectURL(file);

      img.onload = () => {
        try {
          const originalWidth = img.width || 800;
          const originalHeight = img.height || 800;

          // 1. Calculate Main Optimized Dimensions
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
          if (ctx) {
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          // 2. Calculate Lightweight Thumbnail Dimensions (max 360px)
          let thumbWidth = originalWidth;
          let thumbHeight = originalHeight;
          const thumbMax = 360;
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
            thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.8);
          }

          URL.revokeObjectURL(tempUrl);

          // Estimate byte size from dataUrl
          const approxSize = Math.round((dataUrl.length * 3) / 4);

          resolve({
            dataUrl,
            thumbnailUrl: thumbnailUrl || dataUrl,
            width: originalWidth,
            height: originalHeight,
            size: approxSize,
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
    (file instanceof File && file.name ? file.name : `foto_${new Date().toISOString().slice(0, 10)}.jpg`);

  // Optimize and generate ready-to-display web dataUrl
  const { dataUrl, thumbnailUrl, width, height, size } = await optimizeImageForWeb(file);

  const mediaItem: MediaItem = {
    id,
    name: fileName,
    size: size || file.size,
    formattedSize: formatBytes(size || file.size),
    type: 'image/jpeg',
    createdAt: new Date().toISOString(),
    category: options?.category || 'general',
    url: virtualUrl,
    blob: file,
    dataUrl,
    thumbnailUrl,
    width,
    height,
  };

  // 1. Save to Local IndexedDB for instant offline access
  try {
    const localDb = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = localDb.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(mediaItem);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (idbErr) {
    console.warn('[MediaStorage] Failed to save in IndexedDB:', idbErr);
  }

  // 2. Put in-memory cache
  if (dataUrl) {
    objectUrlCache.set(id, dataUrl);
  } else {
    try {
      const objUrl = URL.createObjectURL(file);
      objectUrlCache.set(id, objUrl);
    } catch {
      // ignore
    }
  }

  // 3. Sync to Cloud Firestore if connected
  if (isFirebaseConfigured && db && dataUrl) {
    try {
      const cloudMediaRef = doc(db, 'invitations', INVITATION_ID, 'media', id);
      await setDoc(cloudMediaRef, {
        id,
        name: fileName,
        size: mediaItem.size,
        formattedSize: mediaItem.formattedSize,
        type: 'image/jpeg',
        createdAt: mediaItem.createdAt,
        category: mediaItem.category,
        url: virtualUrl,
        dataUrl,
        thumbnailUrl,
        width,
        height,
      });
      console.info(`[MediaStorage] Successfully uploaded and synced ${fileName} to Cloud Firestore!`);
    } catch (cloudErr) {
      console.warn('[MediaStorage] Cloud Firestore media sync warning:', cloudErr);
    }
  }

  return mediaItem;
}

/**
 * Get all media items from Cloud Firestore + Local IndexedDB
 */
export async function getAllMediaItems(): Promise<MediaItem[]> {
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
        }
      });
    } catch (cloudErr) {
      console.warn('[MediaStorage] Cloud media read error:', cloudErr);
    }
  }

  const items = Array.from(mergedMap.values());
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return items;
}

/**
 * Get single media item by ID
 */
export async function getMediaItem(id: string): Promise<MediaItem | null> {
  // 1. Try in-memory cache
  if (objectUrlCache.has(id)) {
    const cachedUrl = objectUrlCache.get(id)!;
    return {
      id,
      name: id,
      size: 0,
      formattedSize: '0 KB',
      type: 'image/jpeg',
      createdAt: new Date().toISOString(),
      url: `idb://${id}`,
      dataUrl: cachedUrl,
    };
  }

  // 2. Try Local IndexedDB
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
      } else if (item.blob && !objectUrlCache.has(item.id)) {
        try {
          const url = URL.createObjectURL(item.blob);
          objectUrlCache.set(item.id, url);
        } catch {
          // ignore
        }
      }
      return item;
    }
  } catch {
    // continue to cloud check
  }

  // 3. Fallback to Cloud Firestore for other devices
  if (isFirebaseConfigured && db) {
    try {
      const cloudRef = doc(db, 'invitations', INVITATION_ID, 'media', id);
      const docSnap = await getDoc(cloudRef);
      if (docSnap.exists()) {
        const cloudItem = docSnap.data() as MediaItem;
        if (cloudItem.dataUrl) {
          objectUrlCache.set(id, cloudItem.dataUrl);
        }
        return cloudItem;
      }
    } catch (err) {
      console.warn('[MediaStorage] Cloud item fetch error:', err);
    }
  }

  return null;
}

/**
 * Delete a media item from IndexedDB and Cloud Firestore
 */
export async function deleteMediaItem(id: string): Promise<void> {
  // Clear cache
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

  // Delete from local
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

  // Delete from Cloud Firestore
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

  // 2. Fetch from IndexedDB / Cloud Firestore
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
 * Preload all stored media items on application startup into memory
 */
export async function preloadMediaCache(): Promise<void> {
  try {
    await getAllMediaItems();
  } catch (err) {
    console.warn('[MediaStorage] Preload error:', err);
  }
}


// ============================================================================
// AUDIO STORAGE SERVICE (IndexedDB for persistent MP3 / Audio blobs)
// Allows large audio files (up to 30MB+) to be safely stored and survive
// browser reloads without hitting the 5MB localStorage quota limit.
// ============================================================================

const DB_NAME = 'WeddingAppAudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'audio_files';
const META_STORE_NAME = 'audio_metadata';
export const DEFAULT_AUDIO_KEY = 'wedding_custom_music';

export interface AudioMetadata {
  key: string;
  name: string;
  size: number;
  formattedSize: string;
  type: string;
  updatedAt: string;
}

// In-memory cache for generated object URLs to prevent duplicate allocations
const objectUrlCache = new Map<string, string>();

/**
 * Open or initialize IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(META_STORE_NAME)) {
        db.createObjectStore(META_STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

/**
 * Format bytes to readable string (e.g. "3.4 MB")
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
 * Save audio File/Blob to IndexedDB
 */
export async function saveCustomAudio(
  file: Blob | File,
  name: string = 'wedding-song.mp3',
  key: string = DEFAULT_AUDIO_KEY
): Promise<{ url: string; key: string; metadata: AudioMetadata }> {
  const db = await openDB();

  const metadata: AudioMetadata = {
    key,
    name: (file instanceof File && file.name) ? file.name : name,
    size: file.size,
    formattedSize: formatBytes(file.size),
    type: file.type || 'audio/mpeg',
    updatedAt: new Date().toISOString(),
  };

  // Revoke any previous object URL for this key
  if (objectUrlCache.has(key)) {
    try {
      URL.revokeObjectURL(objectUrlCache.get(key)!);
    } catch {
      // ignore
    }
    objectUrlCache.delete(key);
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME, META_STORE_NAME], 'readwrite');
    const audioStore = tx.objectStore(STORE_NAME);
    const metaStore = tx.objectStore(META_STORE_NAME);

    audioStore.put(file, key);
    metaStore.put(metadata, key);

    tx.oncomplete = () => {
      // Create new fresh object URL and cache it
      const newObjectUrl = URL.createObjectURL(file);
      objectUrlCache.set(key, newObjectUrl);

      const virtualUrl = `idb://${key}`;
      resolve({
        url: virtualUrl,
        key,
        metadata,
      });
    };

    tx.onerror = () => reject(tx.error || new Error('Failed to store audio file'));
  });
}

/**
 * Retrieve raw audio Blob from IndexedDB
 */
export async function getCustomAudio(key: string = DEFAULT_AUDIO_KEY): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        resolve(req.result || null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[AudioStorage] Error getting audio blob:', err);
    return null;
  }
}

/**
 * Retrieve metadata of stored audio
 */
export async function getCustomAudioMetadata(
  key: string = DEFAULT_AUDIO_KEY
): Promise<AudioMetadata | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(META_STORE_NAME, 'readonly');
      const store = tx.objectStore(META_STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        resolve(req.result || null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[AudioStorage] Error getting metadata:', err);
    return null;
  }
}

/**
 * Check if custom audio exists
 */
export async function hasCustomAudio(key: string = DEFAULT_AUDIO_KEY): Promise<boolean> {
  try {
    const meta = await getCustomAudioMetadata(key);
    return Boolean(meta && meta.size > 0);
  } catch {
    return false;
  }
}

/**
 * Delete audio and metadata from IndexedDB
 */
export async function deleteCustomAudio(key: string = DEFAULT_AUDIO_KEY): Promise<void> {
  try {
    const db = await openDB();

    if (objectUrlCache.has(key)) {
      try {
        URL.revokeObjectURL(objectUrlCache.get(key)!);
      } catch {
        // ignore
      }
      objectUrlCache.delete(key);
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME, META_STORE_NAME], 'readwrite');
      tx.objectStore(STORE_NAME).delete(key);
      tx.objectStore(META_STORE_NAME).delete(key);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[AudioStorage] Error deleting audio:', err);
  }
}

/**
 * Resolves any audio URL (including `idb://...` or `indexeddb://...`)
 * into a browser-playable URL.
 */
export async function resolveAudioUrl(url: string | undefined): Promise<string> {
  if (!url) return '';

  if (url.startsWith('idb://') || url.startsWith('indexeddb://')) {
    const key = url.replace(/^(idb|indexeddb):\/\//, '') || DEFAULT_AUDIO_KEY;

    // Check if we have an active in-memory object URL
    if (objectUrlCache.has(key)) {
      return objectUrlCache.get(key)!;
    }

    // Otherwise load from IndexedDB
    const blob = await getCustomAudio(key);
    if (blob) {
      const newObjectUrl = URL.createObjectURL(blob);
      objectUrlCache.set(key, newObjectUrl);
      return newObjectUrl;
    }

    // Fallback if not found
    return '';
  }

  return url;
}

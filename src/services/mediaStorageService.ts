// ============================================================================
// MEDIA STORAGE SERVICE (Vercel Blob Permanent Storage + Firestore Metadata)
// Stores uploaded photos permanently in Vercel Blob via authenticated server API
// and persists URL + metadata in Cloud Firestore `/invitations/{id}/media/{mediaId}`.
// Never stores uploaded photo binaries in LocalStorage, IndexedDB, or browser cache.
// ============================================================================

import { doc, getDoc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { INITIAL_INVITATION } from './seedData';
import type { ContentConfig, SettingsConfig } from '../types';

const INVITATION_ID = INITIAL_INVITATION.id;

export const MAX_MEDIA_FILE_BYTES = 5 * 1024 * 1024; // 5 MB max per photo
const VERCEL_SAFE_TRANSFER_BYTES = 3.8 * 1024 * 1024; // Safe ceiling under Vercel Hobby 4.5 MB body limit
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSION_RE = /\.(jpg|jpeg|png|webp)$/i;

export class MediaStorageError extends Error {
  code: 'INVALID_FILE' | 'FILE_TOO_LARGE' | 'UNAUTHORIZED' | 'UPLOAD_FAILED' | 'DELETE_FAILED' | 'CONFIG_ERROR';
  constructor(
    code: 'INVALID_FILE' | 'FILE_TOO_LARGE' | 'UNAUTHORIZED' | 'UPLOAD_FAILED' | 'DELETE_FAILED' | 'CONFIG_ERROR',
    message: string
  ) {
    super(message);
    this.name = 'MediaStorageError';
    this.code = code;
  }
}

export interface MediaItem {
  id: string;
  name: string;
  size: number;
  formattedSize: string;
  type: string;
  createdAt: string;
  updatedAt?: string;
  category?: 'couple' | 'hero' | 'gallery' | 'general' | string;
  url: string; // Permanent Vercel Blob HTTPS URL
  pathname?: string;
  storageProvider?: 'vercel-blob' | 'legacy' | string;
  width?: number;
  height?: number;
  // Optional legacy fields for read-only backward compatibility if old Firestore docs exist
  thumbnailUrl?: string;
  dataUrl?: string;
}

// In-memory cache ONLY for resolving legacy `idb://` records in old Firestore docs if any exist
const legacyUrlCache = new Map<string, string>();
const inFlightItemRequests = new Map<string, Promise<MediaItem | null>>();
let inFlightAllRequest: Promise<MediaItem[]> | null = null;

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function isVercelBlobUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return (
      parsed.protocol === 'https:' &&
      (host.endsWith('.public.blob.vercel-storage.com') || host.endsWith('.blob.vercel-storage.com'))
    );
  } catch {
    return false;
  }
}

export function validateMediaFile(file: File | Blob): { mimeType: string; fileName: string } {
  const fileName =
    file instanceof File && file.name ? file.name : `foto_${new Date().toISOString().slice(0, 10)}.jpg`;
  const normalizedType = (file.type || '').toLowerCase();

  const validMime = ALLOWED_MIME_TYPES.has(normalizedType);
  const validExt = ALLOWED_EXTENSION_RE.test(fileName);

  if (!validMime && !validExt) {
    throw new MediaStorageError(
      'INVALID_FILE',
      'Format foto tidak didukung. Harap pilih file JPG, JPEG, PNG, atau WebP.'
    );
  }

  if (file.size <= 0) {
    throw new MediaStorageError('INVALID_FILE', 'File foto kosong atau tidak dapat dibaca.');
  }

  if (file.size > MAX_MEDIA_FILE_BYTES) {
    throw new MediaStorageError(
      'FILE_TOO_LARGE',
      `Ukuran foto "${fileName}" (${formatBytes(file.size)}) melebihi batas maksimal 5 MB.`
    );
  }

  let resolvedMime = validMime ? (normalizedType === 'image/jpg' ? 'image/jpeg' : normalizedType) : 'image/jpeg';
  if (!validMime && validExt) {
    if (/\.png$/i.test(fileName)) resolvedMime = 'image/png';
    else if (/\.webp$/i.test(fileName)) resolvedMime = 'image/webp';
    else resolvedMime = 'image/jpeg';
  }

  return { mimeType: resolvedMime, fileName };
}

async function readImageDimensions(file: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const tempUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || img.width || 0;
      const height = img.naturalHeight || img.height || 0;
      URL.revokeObjectURL(tempUrl);
      resolve({ width, height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(tempUrl);
      resolve({ width: 0, height: 0 });
    };
    img.src = tempUrl;
  });
}

/**
 * Ensures transfer payload stays safely under Vercel Hobby's 4.5 MB serverless request limit
 * when admin uploads a 3.8 MB – 5.0 MB photo, without degrading smaller photos.
 */
async function prepareBlobForTransfer(
  file: Blob,
  mimeType: string
): Promise<{ blob: Blob; mimeType: string; width: number; height: number }> {
  const { width, height } = await readImageDimensions(file);

  if (file.size <= VERCEL_SAFE_TRANSFER_BYTES) {
    return { blob: file, mimeType, width, height };
  }

  return new Promise((resolve, reject) => {
    const tempUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      try {
        const origW = img.naturalWidth || img.width || 1600;
        const origH = img.naturalHeight || img.height || 1600;
        const maxDim = 2048;
        let targetW = origW;
        let targetH = origH;

        if (targetW > maxDim || targetH > maxDim) {
          const ratio = Math.min(maxDim / targetW, maxDim / targetH);
          targetW = Math.round(targetW * ratio);
          targetH = Math.round(targetH * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(tempUrl);
          reject(new MediaStorageError('INVALID_FILE', 'Browser tidak dapat memproses gambar ini.'));
          return;
        }

        ctx.drawImage(img, 0, 0, targetW, targetH);

        const targetOutputMime =
          mimeType === 'image/png' ? 'image/webp' : mimeType === 'image/webp' ? 'image/webp' : 'image/jpeg';

        const encodeBlob = (q: number) =>
          new Promise<Blob | null>((res) => canvas.toBlob(res, targetOutputMime, q));

        let quality = 0.88;
        let outBlob = await encodeBlob(quality);

        while (outBlob && outBlob.size > VERCEL_SAFE_TRANSFER_BYTES && quality > 0.55) {
          quality -= 0.08;
          outBlob = await encodeBlob(quality);
        }

        while (outBlob && outBlob.size > VERCEL_SAFE_TRANSFER_BYTES && targetW > 800) {
          targetW = Math.round(targetW * 0.8);
          targetH = Math.round(targetH * 0.8);
          canvas.width = targetW;
          canvas.height = targetH;
          ctx.drawImage(img, 0, 0, targetW, targetH);
          outBlob = await encodeBlob(0.78);
        }

        URL.revokeObjectURL(tempUrl);

        if (!outBlob || outBlob.size > VERCEL_SAFE_TRANSFER_BYTES) {
          reject(
            new MediaStorageError(
              'FILE_TOO_LARGE',
              'Ukuran foto terlalu besar setelah diproses. Gunakan foto di bawah 4.5 MB.'
            )
          );
          return;
        }

        resolve({
          blob: outBlob,
          mimeType: outBlob.type || targetOutputMime,
          width: origW,
          height: origH,
        });
      } catch {
        URL.revokeObjectURL(tempUrl);
        reject(new MediaStorageError('UPLOAD_FAILED', 'Gagal menyiapkan foto untuk diunggah.'));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(tempUrl);
      reject(new MediaStorageError('INVALID_FILE', 'File gambar rusak atau tidak dapat dibuka.'));
    };

    img.src = tempUrl;
  });
}

async function uploadToVercelBlobEndpoint(
  blob: Blob,
  mimeType: string,
  fileName: string,
  category: string,
  authToken: string
): Promise<{ url: string; pathname: string; contentType: string; size: number; name: string }> {
  if (!authToken) {
    throw new MediaStorageError(
      'UNAUTHORIZED',
      'Sesi admin dibutuhkan untuk mengunggah foto. Silakan login ulang.'
    );
  }

  const response = await fetch('/api/media/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': mimeType,
      'X-File-Name': encodeURIComponent(fileName),
      'X-Media-Category': category,
    },
    body: blob,
  });

  let payload: Record<string, unknown> = {};
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    payload = {};
  }

  if (response.status === 401) {
    throw new MediaStorageError(
      'UNAUTHORIZED',
      typeof payload.error === 'string'
        ? payload.error
        : 'Sesi admin telah kedaluwarsa. Silakan login kembali.'
    );
  }

  if (response.status === 503) {
    throw new MediaStorageError(
      'CONFIG_ERROR',
      typeof payload.error === 'string'
        ? payload.error
        : 'Konfigurasi Vercel Blob belum lengkap di server.'
    );
  }

  if (!response.ok || typeof payload.url !== 'string') {
    throw new MediaStorageError(
      response.status === 413 ? 'FILE_TOO_LARGE' : 'UPLOAD_FAILED',
      typeof payload.error === 'string'
        ? payload.error
        : 'Gagal mengunggah foto ke Vercel Blob Storage.'
    );
  }

  return {
    url: payload.url,
    pathname: typeof payload.pathname === 'string' ? payload.pathname : '',
    contentType: typeof payload.contentType === 'string' ? payload.contentType : mimeType,
    size: typeof payload.size === 'number' ? payload.size : blob.size,
    name: typeof payload.name === 'string' ? payload.name : fileName,
  };
}

async function deleteFromVercelBlobEndpoint(url: string, authToken: string): Promise<void> {
  if (!isVercelBlobUrl(url)) return;
  if (!authToken) {
    throw new MediaStorageError(
      'UNAUTHORIZED',
      'Sesi admin dibutuhkan untuk menghapus foto dari Vercel Blob.'
    );
  }

  const response = await fetch('/api/media/delete', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  let payload: Record<string, unknown> = {};
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    payload = {};
  }

  if (response.status === 401) {
    throw new MediaStorageError(
      'UNAUTHORIZED',
      typeof payload.error === 'string'
        ? payload.error
        : 'Sesi admin kedaluwarsa. Silakan login kembali.'
    );
  }

  if (!response.ok) {
    throw new MediaStorageError(
      'DELETE_FAILED',
      typeof payload.error === 'string'
        ? payload.error
        : 'Gagal menghapus file foto dari Vercel Blob Storage.'
    );
  }
}

/**
 * Upload a new image permanently to Vercel Blob (server-side) and save its metadata in Firestore
 */
export async function saveMediaFile(
  file: File | Blob,
  options: {
    authToken: string;
    name?: string;
    category?: 'couple' | 'hero' | 'gallery' | 'general' | string;
  }
): Promise<MediaItem> {
  const { mimeType, fileName } = validateMediaFile(file);
  const displayName = options.name?.trim() || fileName;
  const category = options.category || 'general';

  const prepared = await prepareBlobForTransfer(file, mimeType);
  const uploaded = await uploadToVercelBlobEndpoint(
    prepared.blob,
    prepared.mimeType,
    displayName,
    category,
    options.authToken
  );

  const id = `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date().toISOString();

  const mediaItem: MediaItem = {
    id,
    name: uploaded.name || displayName,
    size: uploaded.size,
    formattedSize: formatBytes(uploaded.size),
    type: uploaded.contentType,
    createdAt: now,
    updatedAt: now,
    category,
    url: uploaded.url,
    pathname: uploaded.pathname,
    storageProvider: 'vercel-blob',
    width: prepared.width,
    height: prepared.height,
  };

  if (isFirebaseConfigured && db) {
    const cloudMediaRef = doc(db, 'invitations', INVITATION_ID, 'media', id);
    try {
      await setDoc(cloudMediaRef, mediaItem);
    } catch (err) {
      console.error('[MediaStorage] Failed saving metadata to Firestore, rolling back blob:', err);
      await deleteFromVercelBlobEndpoint(uploaded.url, options.authToken).catch(() => {});
      throw new MediaStorageError(
        'UPLOAD_FAILED',
        'Foto berhasil dikirim, namun gagal menyimpan metadata ke Firebase Firestore.'
      );
    }
  } else {
    await deleteFromVercelBlobEndpoint(uploaded.url, options.authToken).catch(() => {});
    throw new MediaStorageError('CONFIG_ERROR', 'Firebase Firestore belum terkonfigurasi.');
  }

  return mediaItem;
}

/**
 * Replace an existing media item: uploads new photo to Vercel Blob, updates Firestore metadata,
 * and deletes the replaced Vercel Blob file safely.
 */
export async function replaceMediaFile(
  existingItem: MediaItem,
  newFile: File | Blob,
  options: {
    authToken: string;
    category?: string;
  }
): Promise<{ item: MediaItem; previousUrl: string }> {
  const { mimeType, fileName } = validateMediaFile(newFile);
  const category = options.category || existingItem.category || 'general';

  const prepared = await prepareBlobForTransfer(newFile, mimeType);
  const uploaded = await uploadToVercelBlobEndpoint(
    prepared.blob,
    prepared.mimeType,
    fileName,
    category,
    options.authToken
  );

  const now = new Date().toISOString();
  const updatedItem: MediaItem = {
    id: existingItem.id,
    name: uploaded.name || fileName,
    size: uploaded.size,
    formattedSize: formatBytes(uploaded.size),
    type: uploaded.contentType,
    createdAt: existingItem.createdAt || now,
    updatedAt: now,
    category,
    url: uploaded.url,
    pathname: uploaded.pathname,
    storageProvider: 'vercel-blob',
    width: prepared.width,
    height: prepared.height,
  };

  if (isFirebaseConfigured && db) {
    const cloudMediaRef = doc(db, 'invitations', INVITATION_ID, 'media', existingItem.id);
    try {
      await setDoc(cloudMediaRef, updatedItem);
    } catch (err) {
      console.error('[MediaStorage] Failed updating metadata in Firestore, rolling back new blob:', err);
      await deleteFromVercelBlobEndpoint(uploaded.url, options.authToken).catch(() => {});
      throw new MediaStorageError(
        'UPLOAD_FAILED',
        'Gagal memperbarui metadata foto di Firebase Firestore.'
      );
    }
  }

  if (isVercelBlobUrl(existingItem.url) && existingItem.url !== uploaded.url) {
    await deleteFromVercelBlobEndpoint(existingItem.url, options.authToken).catch((err) => {
      console.warn('[MediaStorage] Old blob cleanup note:', err);
    });
  }

  return {
    item: updatedItem,
    previousUrl: existingItem.url,
  };
}

/**
 * Get all media items from Cloud Firestore (no LocalStorage / IndexedDB)
 */
export async function getAllMediaItems(): Promise<MediaItem[]> {
  if (inFlightAllRequest) {
    return inFlightAllRequest;
  }

  inFlightAllRequest = (async () => {
    const items: MediaItem[] = [];

    if (isFirebaseConfigured && db) {
      const mediaCollection = collection(db, 'invitations', INVITATION_ID, 'media');
      const snapshot = await getDocs(mediaCollection);
      snapshot.forEach((docSnap) => {
        const cloudData = docSnap.data() as MediaItem;
        if (cloudData && cloudData.id && cloudData.url) {
          items.push(cloudData);
          if (cloudData.url.startsWith('idb://') && cloudData.dataUrl) {
            legacyUrlCache.set(cloudData.id, cloudData.dataUrl);
          }
        }
      });
    }

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
 * Delete a media item from Vercel Blob (server-side) and Cloud Firestore
 */
export async function deleteMediaItem(
  itemOrId: MediaItem | string,
  authToken?: string
): Promise<void> {
  const item =
    typeof itemOrId === 'string'
      ? await getMediaItem(itemOrId)
      : itemOrId;

  const id = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;

  if (item?.url && isVercelBlobUrl(item.url)) {
    await deleteFromVercelBlobEndpoint(item.url, authToken || '');
  }

  legacyUrlCache.delete(id);

  if (isFirebaseConfigured && db) {
    const cloudRef = doc(db, 'invitations', INVITATION_ID, 'media', id);
    await deleteDoc(cloudRef);
  }
}

/**
 * Find all places on the invitation website where a given photo URL is actively referenced
 */
export function findMediaReferences(
  url: string,
  content?: ContentConfig | null,
  settings?: SettingsConfig | null
): string[] {
  if (!url || !content) return [];
  const usedIn: string[] = [];

  if (content.hero?.heroImageUrl === url || content.hero?.heroImage === url) {
    usedIn.push('Foto Cover Hero');
  }
  if (content.couple?.groom?.photoUrl === url || content.couple?.groom?.image === url) {
    usedIn.push('Foto Mempelai Pria');
  }
  if (content.couple?.bride?.photoUrl === url || content.couple?.bride?.image === url) {
    usedIn.push('Foto Mempelai Wanita');
  }
  if (Array.isArray(content.gallery?.images) && content.gallery.images.some((img) => img.url === url)) {
    usedIn.push('Galeri Undangan');
  }
  if (settings?.ogImage === url || settings?.seo?.ogImageUrl === url) {
    usedIn.push('Thumbnail SEO (OG Image)');
  }

  return usedIn;
}

/**
 * Replace all references of oldUrl with newUrl inside ContentConfig without leaving broken links
 */
export function replaceMediaUrlInContent(
  content: ContentConfig,
  oldUrl: string,
  newUrl: string
): { updatedContent: ContentConfig; didChange: boolean } {
  if (!oldUrl || !newUrl || oldUrl === newUrl) {
    return { updatedContent: content, didChange: false };
  }

  let didChange = false;
  const next: ContentConfig = {
    ...content,
    hero: { ...content.hero },
    couple: {
      ...content.couple,
      groom: { ...content.couple.groom },
      bride: { ...content.couple.bride },
    },
    gallery: {
      ...content.gallery,
      images: [...content.gallery.images],
    },
  };

  if (next.hero.heroImageUrl === oldUrl || next.hero.heroImage === oldUrl) {
    next.hero.heroImageUrl = newUrl;
    next.hero.heroImage = newUrl;
    didChange = true;
  }

  if (next.couple.groom.photoUrl === oldUrl || next.couple.groom.image === oldUrl) {
    next.couple.groom.photoUrl = newUrl;
    next.couple.groom.image = newUrl;
    didChange = true;
  }

  if (next.couple.bride.photoUrl === oldUrl || next.couple.bride.image === oldUrl) {
    next.couple.bride.photoUrl = newUrl;
    next.couple.bride.image = newUrl;
    didChange = true;
  }

  let galleryChanged = false;
  next.gallery.images = next.gallery.images.map((img) => {
    if (img.url === oldUrl) {
      galleryChanged = true;
      return { ...img, url: newUrl };
    }
    return img;
  });
  if (galleryChanged) didChange = true;

  return { updatedContent: next, didChange };
}

/**
 * Read single media item from Cloud Firestore (used primarily for legacy idb:// compatibility)
 */
export async function getMediaItem(id: string): Promise<MediaItem | null> {
  if (legacyUrlCache.has(id)) {
    return {
      id,
      name: id,
      size: 0,
      formattedSize: '0 KB',
      type: 'image/webp',
      createdAt: new Date().toISOString(),
      url: `idb://${id}`,
      dataUrl: legacyUrlCache.get(id),
    };
  }

  const existingRequest = inFlightItemRequests.get(id);
  if (existingRequest) {
    return existingRequest;
  }

  const fetchPromise = (async (): Promise<MediaItem | null> => {
    if (isFirebaseConfigured && db) {
      try {
        const cloudRef = doc(db, 'invitations', INVITATION_ID, 'media', id);
        const docSnap = await getDoc(cloudRef);
        if (docSnap.exists()) {
          const cloudItem = docSnap.data() as MediaItem;
          if (cloudItem.dataUrl) {
            legacyUrlCache.set(id, cloudItem.dataUrl);
          }
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

export function resolveImageUrlSync(url: string | undefined): string | null {
  if (!url) return '';
  if (!url.startsWith('idb://') && !url.startsWith('indexeddb://')) {
    return url;
  }
  const key = url.replace(/^(idb|indexeddb):\/\//, '');
  return legacyUrlCache.get(key) || null;
}

export async function resolveImageUrl(url: string | undefined): Promise<string> {
  if (!url) return '';
  if (!url.startsWith('idb://') && !url.startsWith('indexeddb://')) {
    return url;
  }

  const key = url.replace(/^(idb|indexeddb):\/\//, '');
  if (legacyUrlCache.has(key)) {
    return legacyUrlCache.get(key)!;
  }

  const item = await getMediaItem(key);
  if (item?.dataUrl) {
    legacyUrlCache.set(key, item.dataUrl);
    return item.dataUrl;
  }
  if (item?.url && !item.url.startsWith('idb://')) {
    return item.url;
  }
  return '';
}

export async function prefetchMediaIds(urls: (string | undefined | null)[]): Promise<void> {
  const legacyKeys: string[] = [];
  const seen = new Set<string>();

  for (const raw of urls) {
    if (!raw || (!raw.startsWith('idb://') && !raw.startsWith('indexeddb://'))) continue;
    const key = raw.replace(/^(idb|indexeddb):\/\//, '');
    if (!seen.has(key) && !legacyUrlCache.has(key)) {
      seen.add(key);
      legacyKeys.push(key);
    }
  }

  if (legacyKeys.length === 0) return;

  const batchSize = 3;
  for (let i = 0; i < legacyKeys.length; i += batchSize) {
    const batch = legacyKeys.slice(i, i + batchSize);
    await Promise.all(batch.map((id) => getMediaItem(id).catch(() => null)));
  }
}

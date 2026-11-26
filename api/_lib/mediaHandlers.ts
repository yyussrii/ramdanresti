import type { IncomingMessage, ServerResponse } from 'node:http';
import { put, del } from '@vercel/blob';
import {
  checkLoginRateLimit,
  clearFailedLogins,
  getClientIp,
  isAdminAuthConfigured,
  recordFailedLogin,
  signAdminToken,
  verifyAdminBearerToken,
  verifyAdminPasscode,
} from './adminAuth';

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB strict limit
const MAX_JSON_BODY_BYTES = 16 * 1024; // 16 KB
const ALLOWED_BLOB_PREFIX = 'ramdan-resti/media/';

export interface RequestWithBody extends IncomingMessage {
  body?: unknown;
}

function sendJson(res: ServerResponse, statusCode: number, data: Record<string, unknown>): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(data));
}

async function readRawBody(req: RequestWithBody, maxBytes: number): Promise<Buffer> {
  if (Buffer.isBuffer(req.body)) {
    if (req.body.length > maxBytes) {
      const err = new Error('PAYLOAD_TOO_LARGE');
      (err as Error & { statusCode?: number }).statusCode = 413;
      throw err;
    }
    return req.body;
  }

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    let settled = false;

    const fail = (err: Error & { statusCode?: number }) => {
      if (settled) return;
      settled = true;
      reject(err);
    };

    req.on('data', (chunk: Buffer | string) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalBytes += buf.length;
      if (totalBytes > maxBytes) {
        const err = new Error('PAYLOAD_TOO_LARGE') as Error & { statusCode?: number };
        err.statusCode = 413;
        req.destroy();
        fail(err);
        return;
      }
      chunks.push(buf);
    });

    req.on('end', () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks));
    });

    req.on('error', (err) => fail(err));
  });
}

async function readJsonBody(req: RequestWithBody): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body as Record<string, unknown>;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  const raw = await readRawBody(req, MAX_JSON_BODY_BYTES);
  if (raw.length === 0) return {};
  try {
    return JSON.parse(raw.toString('utf8')) as Record<string, unknown>;
  } catch {
    return {};
  }
}

interface DetectedImageFormat {
  mime: 'image/jpeg' | 'image/png' | 'image/webp';
  ext: 'jpg' | 'png' | 'webp';
}

function detectImageFormatFromMagicBytes(buf: Buffer): DetectedImageFormat | null {
  // JPEG: FF D8 FF
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return { mime: 'image/png', ext: 'png' };
  }

  // WebP: RIFF....WEBP
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }

  return null;
}

function sanitizeFileName(rawHeader: string | string[] | undefined, ext: string): {
  displayName: string;
  slugBase: string;
} {
  const rawValue = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  let decoded = '';
  if (rawValue) {
    try {
      decoded = decodeURIComponent(rawValue).trim();
    } catch {
      decoded = rawValue.trim();
    }
  }

  const baseWithoutDir = decoded.split(/[\\/]/).pop() || '';
  const withoutExt = baseWithoutDir.replace(/\.[a-zA-Z0-9]+$/, '');
  const cleanDisplay = withoutExt.replace(/[^\w\s.-]/g, '').trim().slice(0, 60) || 'foto-undangan';
  const slugBase =
    cleanDisplay
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'foto';

  return {
    displayName: `${cleanDisplay}.${ext}`,
    slugBase,
  };
}

function isValidVercelBlobUrl(rawUrl: string): URL | null {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') {
      return null;
    }
    const host = parsed.hostname.toLowerCase();
    const isBlobHost =
      host.endsWith('.public.blob.vercel-storage.com') ||
      host.endsWith('.blob.vercel-storage.com');
    if (!isBlobHost) {
      return null;
    }
    if (!parsed.pathname.startsWith(`/${ALLOWED_BLOB_PREFIX}`)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function handleAdminLogin(req: RequestWithBody, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Metode tidak diizinkan.' });
    return;
  }

  if (!isAdminAuthConfigured()) {
    sendJson(res, 503, {
      error:
        'ADMIN_PASSCODE belum dikonfigurasi pada server. Tambahkan ADMIN_PASSCODE di Vercel Environment Variables atau file .env.',
      code: 'ADMIN_PASSCODE_NOT_CONFIGURED',
    });
    return;
  }

  const clientIp = getClientIp(req);
  const rateLimit = checkLoginRateLimit(clientIp);
  if (!rateLimit.allowed) {
    sendJson(res, 429, {
      error: `Terlalu banyak percobaan masuk. Silakan coba lagi dalam ${rateLimit.retryAfterSeconds} detik.`,
    });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const passcode = typeof body.passcode === 'string' ? body.passcode : '';
    if (!passcode.trim() || passcode.length > 128) {
      sendJson(res, 400, { error: 'Kata sandi wajib diisi.' });
      return;
    }

    if (!verifyAdminPasscode(passcode)) {
      recordFailedLogin(clientIp);
      sendJson(res, 401, { error: 'Kata sandi admin salah. Silakan periksa kembali.' });
      return;
    }

    clearFailedLogins(clientIp);
    const { token, expiresAt } = signAdminToken();
    sendJson(res, 200, { token, expiresAt });
  } catch (err) {
    console.error('[AdminLogin] Error:', err);
    sendJson(res, 500, { error: 'Terjadi kesalahan saat memverifikasi sesi admin.' });
  }
}

export async function handleMediaUpload(req: RequestWithBody, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Metode tidak diizinkan.' });
    return;
  }

  const adminSession = verifyAdminBearerToken(req.headers.authorization);
  if (!adminSession) {
    sendJson(res, 401, {
      error: 'Sesi admin tidak valid atau telah kedaluwarsa. Silakan login ulang.',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!blobToken) {
    sendJson(res, 503, {
      error:
        'BLOB_READ_WRITE_TOKEN belum dikonfigurasi. Hubungkan Vercel Blob Storage ke project dan atur Environment Variable BLOB_READ_WRITE_TOKEN.',
      code: 'BLOB_TOKEN_NOT_CONFIGURED',
    });
    return;
  }

  const declaredContentType = (req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  const allowedDeclaredTypes = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/octet-stream',
    '',
  ]);
  if (!allowedDeclaredTypes.has(declaredContentType)) {
    sendJson(res, 400, {
      error: 'Format tidak didukung. Hanya file JPG, JPEG, PNG, dan WebP yang diperbolehkan.',
    });
    return;
  }

  const contentLengthHeader = req.headers['content-length'];
  if (contentLengthHeader) {
    const declaredLength = Number(contentLengthHeader);
    if (!Number.isNaN(declaredLength) && declaredLength > MAX_IMAGE_SIZE_BYTES) {
      sendJson(res, 413, {
        error: 'Ukuran foto melebihi batas maksimal 5 MB.',
      });
      return;
    }
  }

  try {
    const buffer = await readRawBody(req, MAX_IMAGE_SIZE_BYTES);
    if (buffer.length === 0) {
      sendJson(res, 400, { error: 'File gambar kosong.' });
      return;
    }

    const detected = detectImageFormatFromMagicBytes(buffer);
    if (!detected) {
      sendJson(res, 400, {
        error: 'File tidak valid. Pastikan file benar-benar gambar JPG, JPEG, PNG, atau WebP.',
      });
      return;
    }

    const { displayName, slugBase } = sanitizeFileName(req.headers['x-file-name'], detected.ext);
    const blobPathname = `${ALLOWED_BLOB_PREFIX}${Date.now()}-${slugBase}.${detected.ext}`;

    const uploaded = await put(blobPathname, buffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType: detected.mime,
      token: blobToken,
    });

    sendJson(res, 200, {
      url: uploaded.url,
      pathname: uploaded.pathname,
      contentType: uploaded.contentType || detected.mime,
      size: buffer.length,
      name: displayName,
    });
  } catch (err) {
    const statusCode = (err as Error & { statusCode?: number }).statusCode;
    if (statusCode === 413 || (err instanceof Error && err.message === 'PAYLOAD_TOO_LARGE')) {
      sendJson(res, 413, { error: 'Ukuran foto melebihi batas maksimal 5 MB.' });
      return;
    }
    console.error('[MediaUpload] Vercel Blob upload failed:', err);
    sendJson(res, 500, {
      error: 'Gagal mengunggah foto ke Vercel Blob Storage. Silakan coba lagi.',
    });
  }
}

export async function handleMediaDelete(req: RequestWithBody, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    sendJson(res, 405, { error: 'Metode tidak diizinkan.' });
    return;
  }

  const adminSession = verifyAdminBearerToken(req.headers.authorization);
  if (!adminSession) {
    sendJson(res, 401, {
      error: 'Sesi admin tidak valid atau telah kedaluwarsa. Silakan login ulang.',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!blobToken) {
    sendJson(res, 503, {
      error: 'BLOB_READ_WRITE_TOKEN belum dikonfigurasi pada server.',
      code: 'BLOB_TOKEN_NOT_CONFIGURED',
    });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const rawUrl = typeof body.url === 'string' ? body.url.trim() : '';
    const parsedUrl = isValidVercelBlobUrl(rawUrl);

    if (!parsedUrl) {
      sendJson(res, 400, { error: 'URL Vercel Blob tidak valid.' });
      return;
    }

    await del(parsedUrl.toString(), { token: blobToken });
    sendJson(res, 200, { success: true });
  } catch (err) {
    console.error('[MediaDelete] Vercel Blob delete failed:', err);
    sendJson(res, 500, {
      error: 'Gagal menghapus file dari Vercel Blob Storage.',
    });
  }
}

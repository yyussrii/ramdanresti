
import { list } from '@vercel/blob';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { verifyAdminBearerToken } from '../_lib/adminAuth.js';

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  if (!verifyAdminBearerToken(req.headers.authorization)) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();

  if (!token) {
    res.statusCode = 503;
    res.end(JSON.stringify({ error: 'Blob token not configured' }));
    return;
  }

  try {
    const result = await list({
      prefix: 'ramdan-resti/media/',
      limit: 1000,
      token,
    });

    res.statusCode = 200;
    res.end(JSON.stringify({
      blobs: result.blobs,
      hasMore: result.hasMore,
      cursor: result.cursor ?? null,
    }));
  } catch (error) {
    console.error('[MediaList] Error:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({
      error: 'Gagal membaca daftar foto Vercel Blob',
    }));
  }
}

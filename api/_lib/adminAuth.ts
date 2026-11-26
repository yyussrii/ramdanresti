import crypto from 'node:crypto';
import type { IncomingMessage } from 'node:http';

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 10;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const failedLoginAttempts = new Map<string, RateLimitEntry>();
let ephemeralProcessKey: Buffer | null = null;

function getSigningKey(): Buffer | null {
  const explicitSecret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (explicitSecret && explicitSecret.length >= 16) {
    return crypto.createHash('sha256').update(explicitSecret).digest();
  }

  const passcode = process.env.ADMIN_PASSCODE?.trim();
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim() || '';
  if (passcode) {
    return crypto
      .createHash('sha256')
      .update(`${passcode}:${blobToken}`)
      .digest();
  }

  if (!ephemeralProcessKey) {
    ephemeralProcessKey = crypto.randomBytes(32);
  }
  return ephemeralProcessKey;
}

export function isAdminAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSCODE && process.env.ADMIN_PASSCODE.trim().length > 0);
}

export function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

export function checkLoginRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = failedLoginAttempts.get(ip);
  if (!entry) {
    return { allowed: true };
  }
  if (now > entry.resetAt) {
    failedLoginAttempts.delete(ip);
    return { allowed: true };
  }
  if (entry.count >= MAX_FAILED_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }
  return { allowed: true };
}

export function recordFailedLogin(ip: string): void {
  const now = Date.now();
  const existing = failedLoginAttempts.get(ip);
  if (!existing || now > existing.resetAt) {
    failedLoginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  } else {
    existing.count += 1;
  }
}

export function clearFailedLogins(ip: string): void {
  failedLoginAttempts.delete(ip);
}

export function verifyAdminPasscode(inputPasscode: string): boolean {
  const configured = process.env.ADMIN_PASSCODE?.trim();
  if (!configured) {
    return false;
  }

  const inputDigest = crypto.createHash('sha256').update(inputPasscode.trim()).digest();
  const expectedDigest = crypto.createHash('sha256').update(configured).digest();
  return crypto.timingSafeEqual(inputDigest, expectedDigest);
}

export interface AdminTokenPayload {
  role: 'admin';
  iat: number;
  exp: number;
}

export function signAdminToken(): { token: string; expiresAt: number } {
  const key = getSigningKey();
  if (!key) {
    throw new Error('Admin session signing key is unavailable');
  }

  const iat = Date.now();
  const exp = iat + SESSION_TTL_MS;
  const payload: AdminTokenPayload = { role: 'admin', iat, exp };
  const payloadEncoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', key)
    .update(payloadEncoded)
    .digest('base64url');

  return {
    token: `${payloadEncoded}.${signature}`,
    expiresAt: exp,
  };
}

export function verifyAdminBearerToken(authorizationHeader?: string): AdminTokenPayload | null {
  if (!authorizationHeader || typeof authorizationHeader !== 'string') {
    return null;
  }

  const match = authorizationHeader.match(/^Bearer\s+([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/);
  if (!match) {
    return null;
  }

  const key = getSigningKey();
  if (!key) {
    return null;
  }

  const [payloadEncoded, providedSig] = match[1].split('.');
  if (!payloadEncoded || !providedSig) {
    return null;
  }

  const expectedSig = crypto
    .createHmac('sha256', key)
    .update(payloadEncoded)
    .digest('base64url');

  const providedBuf = Buffer.from(providedSig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(payloadEncoded, 'base64url').toString('utf8')
    ) as AdminTokenPayload;

    if (
      decoded &&
      decoded.role === 'admin' &&
      typeof decoded.exp === 'number' &&
      decoded.exp > Date.now()
    ) {
      return decoded;
    }
  } catch {
    return null;
  }

  return null;
}

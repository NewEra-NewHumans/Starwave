export const DEFAULT_FIREBASE_PROJECT_ID = 'ai-studio-applet-webapp-9b00f';

const FIREBASE_JWK_ENDPOINT =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

const BUILTIN_ALLOWED_ORIGINS = new Set([
  'https://ais-dev-2kwv3nezb3vv6xudicy4hq-754510241237.asia-northeast1.run.app',
  'https://ais-pre-2kwv3nezb3vv6xudicy4hq-754510241237.asia-northeast1.run.app',
  'https://localhost',
  'capacitor://localhost',
  'ionic://localhost',
  'app://localhost',
]);

export interface VerifiedFirebaseUser {
  uid: string;
  emailVerified: boolean;
  email?: string;
}

interface JwkEntry extends JsonWebKey {
  kid?: string;
  alg?: string;
  use?: string;
}

let jwkCache: {
  expiresAtMs: number;
  lastFetchedAtMs: number;
  keysByKid: Map<string, CryptoKey>;
} = {
  expiresAtMs: 0,
  lastFetchedAtMs: 0,
  keysByKid: new Map(),
};

function base64UrlToBytes(b64url: string): Uint8Array<ArrayBuffer> {
  const normalized = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(normalized + padding);
  const buf = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function parseMaxAgeMs(cacheControl: string | null): number {
  if (!cacheControl) return 300_000;
  const match = cacheControl.match(/max-age=(\d+)/i);
  if (!match) return 300_000;
  const seconds = Number(match[1]);
  if (!Number.isFinite(seconds)) return 300_000;
  return Math.max(60_000, Math.min(3_600_000, seconds * 1000));
}

async function getFirebasePublicKey(kid: string): Promise<CryptoKey | null> {
  const now = Date.now();
  const cacheValid = now < jwkCache.expiresAtMs && jwkCache.keysByKid.size > 0;
  if (cacheValid) {
    const cached = jwkCache.keysByKid.get(kid);
    if (cached) return cached;
    // Unknown kid: throttle forced JWK refresh to once every 15s
    if (now - jwkCache.lastFetchedAtMs < 15_000) {
      return null;
    }
  }

  try {
    const resp = await fetch(FIREBASE_JWK_ENDPOINT, {
      headers: { Accept: 'application/json' },
    });
    if (!resp.ok) {
      return jwkCache.keysByKid.get(kid) || null;
    }
    const payload = (await resp.json()) as { keys?: JwkEntry[] };
    const nextMap = new Map<string, CryptoKey>();
    if (Array.isArray(payload.keys)) {
      for (const jwk of payload.keys) {
        if (!jwk || typeof jwk.kid !== 'string' || jwk.kty !== 'RSA') continue;
        try {
          const cryptoKey = await globalThis.crypto.subtle.importKey(
            'jwk',
            jwk,
            { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
            false,
            ['verify']
          );
          nextMap.set(jwk.kid, cryptoKey);
        } catch {
          // Skip malformed JWK entry
        }
      }
    }
    if (nextMap.size > 0) {
      jwkCache = {
        expiresAtMs: now + parseMaxAgeMs(resp.headers.get('cache-control')),
        lastFetchedAtMs: now,
        keysByKid: nextMap,
      };
    }
    return jwkCache.keysByKid.get(kid) || null;
  } catch {
    return jwkCache.keysByKid.get(kid) || null;
  }
}

export async function verifyFirebaseIdToken(
  token: string,
  projectId = DEFAULT_FIREBASE_PROJECT_ID
): Promise<VerifiedFirebaseUser | null> {
  if (!token || typeof token !== 'string' || token.length > 8192) {
    return null;
  }
  const parts = token.trim().split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, sigB64] = parts;
  if (!headerB64 || !payloadB64 || !sigB64) return null;

  try {
    const decoder = new TextDecoder();
    const header = JSON.parse(decoder.decode(base64UrlToBytes(headerB64))) as {
      alg?: unknown;
      kid?: unknown;
    };
    if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) {
      return null;
    }

    const payload = JSON.parse(decoder.decode(base64UrlToBytes(payloadB64))) as {
      aud?: unknown;
      iss?: unknown;
      sub?: unknown;
      exp?: unknown;
      iat?: unknown;
      auth_time?: unknown;
      email?: unknown;
      email_verified?: unknown;
    };

    const expectedProject = (projectId || DEFAULT_FIREBASE_PROJECT_ID).trim();
    const expectedIssuer = `https://securetoken.google.com/${expectedProject}`;
    const nowSec = Math.floor(Date.now() / 1000);

    if (payload.aud !== expectedProject || payload.iss !== expectedIssuer) {
      return null;
    }
    if (
      typeof payload.sub !== 'string' ||
      payload.sub.length < 1 ||
      payload.sub.length > 128 ||
      !/^[a-zA-Z0-9_\-]+$/.test(payload.sub)
    ) {
      return null;
    }
    if (typeof payload.exp !== 'number' || payload.exp <= nowSec - 30) {
      return null;
    }
    if (typeof payload.iat !== 'number' || payload.iat > nowSec + 60) {
      return null;
    }
    if (
      payload.auth_time !== undefined &&
      (typeof payload.auth_time !== 'number' || payload.auth_time > nowSec + 60)
    ) {
      return null;
    }

    const publicKey = await getFirebasePublicKey(header.kid);
    if (!publicKey) return null;

    const signingBytes = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const sigBytes = base64UrlToBytes(sigB64);

    const valid = await globalThis.crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      sigBytes,
      signingBytes
    );
    if (!valid) return null;

    return {
      uid: payload.sub,
      emailVerified: payload.email_verified === true,
      email: typeof payload.email === 'string' ? payload.email : undefined,
    };
  } catch {
    return null;
  }
}

export function extractBearerToken(authHeader: string | null | undefined): string | null {
  if (!authHeader || typeof authHeader !== 'string') return null;
  const match = authHeader.match(/^Bearer\s+([A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+)$/);
  return match ? match[1] : null;
}

export function normalizeOriginString(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === 'null') return null;
  try {
    const parsed = new URL(trimmed);
    if (!parsed.host) return null;
    return `${parsed.protocol}//${parsed.host}`.toLowerCase();
  } catch {
    return null;
  }
}

export function resolveAllowedCorsOrigin(
  originHeader: string | null | undefined,
  envAllowedOrigins?: string,
  requestOrigin?: string | null
): string | null {
  const candidate = normalizeOriginString(originHeader);
  if (!candidate) return null;

  const normalizedReqOrigin = normalizeOriginString(requestOrigin);
  if (normalizedReqOrigin && candidate === normalizedReqOrigin) {
    return candidate;
  }

  if (BUILTIN_ALLOWED_ORIGINS.has(candidate)) {
    return candidate;
  }

  try {
    const parsed = new URL(candidate);
    if (
      parsed.protocol === 'http:' &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
    ) {
      return candidate;
    }
  } catch {
    return null;
  }

  if (envAllowedOrigins && typeof envAllowedOrigins === 'string') {
    for (const item of envAllowedOrigins.split(',')) {
      const normalizedItem = normalizeOriginString(item);
      if (normalizedItem && normalizedItem === candidate) {
        return candidate;
      }
    }
  }

  return null;
}

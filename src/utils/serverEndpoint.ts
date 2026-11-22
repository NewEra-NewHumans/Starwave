const STORAGE_KEY = 'sr_server_url_v1';

export const DEFAULT_TRIAL_SERVER_URL =
  'https://ais-pre-2kwv3nezb3vv6xudicy4hq-754510241237.asia-northeast1.run.app';

function normalizeOrigin(raw: string): string {
  return raw.trim().replace(/\/+$/, '');
}

function isPackagedNativeOrigin(): boolean {
  if (typeof window === 'undefined') return false;
  const proto = window.location.protocol;
  const host = window.location.hostname;
  if (proto === 'file:' || proto === 'capacitor:' || proto === 'app:') {
    return true;
  }
  const hasCapacitor =
    typeof (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
      .Capacitor?.isNativePlatform === 'function' &&
    Boolean(
      (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
        .Capacitor?.isNativePlatform?.()
    );
  const hasElectron = Boolean(
    (window as unknown as { starRippleNative?: { isDesktop?: boolean } }).starRippleNative
      ?.isDesktop
  );
  if (hasCapacitor || hasElectron) return true;
  return proto === 'https:' && host === 'localhost';
}

function isSafeServerOrigin(raw: string): boolean {
  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol === 'https:') return true;
    if (
      parsed.protocol === 'http:' &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function getConfiguredServerOrigin(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && isSafeServerOrigin(saved)) {
      return normalizeOrigin(saved);
    }
  } catch {
    // ignore storage errors
  }
  const envUrl = import.meta.env.VITE_SERVER_URL;
  if (typeof envUrl === 'string' && isSafeServerOrigin(envUrl)) {
    return normalizeOrigin(envUrl);
  }
  return '';
}

export function getServerEndpoint(): string {
  const configured = getConfiguredServerOrigin();
  if (configured) return configured;

  if (typeof window !== 'undefined') {
    if (isPackagedNativeOrigin()) {
      return DEFAULT_TRIAL_SERVER_URL;
    }
    if (
      window.location.protocol === 'http:' ||
      window.location.protocol === 'https:'
    ) {
      return window.location.origin;
    }
  }
  return DEFAULT_TRIAL_SERVER_URL;
}

export function setServerEndpoint(url: string): boolean {
  const cleaned = normalizeOrigin(url);
  try {
    if (!cleaned) {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    }
    if (isSafeServerOrigin(cleaned)) {
      localStorage.setItem(STORAGE_KEY, cleaned);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function apiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const configured = getConfiguredServerOrigin();
  if (configured) return `${configured}${cleanPath}`;
  if (isPackagedNativeOrigin()) {
    return `${DEFAULT_TRIAL_SERVER_URL}${cleanPath}`;
  }
  return cleanPath;
}

export function wsUrl(path = '/ws'): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = getServerEndpoint();
  const wsBase = base.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');
  return `${wsBase}${cleanPath}`;
}

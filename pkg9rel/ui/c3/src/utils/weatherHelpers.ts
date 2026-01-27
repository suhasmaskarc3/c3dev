// Shared weather utilities for the navbar widget

export const createTimedCache = (ttlMs: number) => {
  const m = new Map<string, { d: any; t: number }>();
  return {
    get: (k: string) => {
      const v = m.get(k);
      if (!v) return null;
      if (Date.now() - v.t > ttlMs) {
        m.delete(k);
        return null;
      }
      return v.d;
    },
    set: (k: string, d: any) => m.set(k, { d, t: Date.now() }),
  };
};

export const fetchWithTimeout = (url: string, ms = 5000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
};

export const formatTz = (s: number) => {
  if (typeof s !== 'number') return 'Unknown Timezone';
  const h = s / 3600;
  const map: Record<string, string> = {
    '-5': 'Eastern',
    '-6': 'Central',
    '-7': 'Mountain',
    '-8': 'Pacific',
    '-9': 'Alaska',
    '-10': 'Hawaii',
  };
  return `${map[h] || 'Pacific'} Time Zone (UTC${h < 0 ? '-' : '+'}${Math.abs(h).toString().padStart(2, '0')}:00)`;
};

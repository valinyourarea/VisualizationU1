// frontend/src/services/api.ts

const DEFAULT_API_URL = 'http://localhost:4000/api';
const API_URL = (import.meta.env?.VITE_API_URL as string) || DEFAULT_API_URL;
const DEBUG = import.meta.env?.DEV === true;

function joinUrl(base: string, endpoint: string) {
  const b = base.replace(/\/+$/, '');
  const e = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${b}${e}`;
}

export class ApiService {
  private baseURL: string;

  constructor(base = API_URL) {
    this.baseURL = base;
  }

  private async parseResponse(res: Response) {
    // 204 No Content
    if (res.status === 204) return null;

    const ct = res.headers.get('content-type') || '';

    // JSON explícito
    if (ct.includes('application/json')) {
      return res.json();
    }

    // Intenta texto → JSON (por si el server no setea content-type)
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return text;
    }
  }

  private async request(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs = 15000
  ) {
    const url = joinUrl(this.baseURL, endpoint);

    // AbortController para timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    // Content-Type solo si enviamos body
    const headers: Record<string, string> = {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers as Record<string, string> | undefined),
    };

    const cfg: RequestInit = {
      method: options.method || 'GET',
      ...options,
      headers,
      signal: controller.signal,
    };

    if (DEBUG) console.info('[API] →', cfg.method, url);

    try {
      const res = await fetch(url, cfg);
      const payload = await this.parseResponse(res);

      if (DEBUG) console.info('[API] ←', res.status, res.statusText, 'for', url);

      if (!res.ok) {
        if (DEBUG) {
          console.error('[API] error payload:', {
            url,
            status: res.status,
            statusText: res.statusText,
            body: payload,
          });
        }
        throw new Error(`HTTP ${res.status} ${res.statusText} @ ${url}`);
      }

      return payload;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new Error(`Timeout after ${timeoutMs}ms @ ${url}`);
      }
      if (DEBUG) console.error('[API] request failed:', err);
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint: string, data?: unknown) {
    return this.request(endpoint, {
      method: 'POST',
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  }

  put(endpoint: string, data?: unknown) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  }

  delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiService();

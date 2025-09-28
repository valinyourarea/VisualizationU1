// src/services/api.ts
const DEFAULT_API_URL = 'http://localhost:4000/api';
const API_URL = (import.meta.env?.VITE_API_URL as string) || DEFAULT_API_URL;

// Activa logs solo en dev
const DEBUG = import.meta.env?.DEV === true;

function joinUrl(base: string, endpoint: string) {
  const b = base.replace(/\/+$/, '');
  const e = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${b}${e}`;
}

export type ApiErrorInfo = {
  url: string;
  status: number;
  statusText: string;
  body?: unknown;
};

export class ApiService {
  private baseURL: string;

  constructor(base = API_URL) {
    this.baseURL = base;
  }

  private async parseResponse(res: Response) {
    // 204 No Content → null
    if (res.status === 204) return null;

    const ct = res.headers.get('content-type') || '';

    // Si es JSON, intenta parsear como JSON
    if (ct.includes('application/json')) {
      return await res.json();
    }

    // Si no declara JSON, intenta JSON y si falla, devuelve texto
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return text; // podría ser HTML, texto plano, etc.
    }
  }

  private async request(endpoint: string, options: RequestInit = {}, timeoutMs = 15000) {
    const url = joinUrl(this.baseURL, endpoint);

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    // Solo enviamos Content-Type si hay body
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
        const err: ApiErrorInfo = {
          url,
          status: res.status,
          statusText: res.statusText,
          body: payload,
        };
        if (DEBUG) console.error('[API] error payload:', err);
        throw new Error(`HTTP ${err.status} ${err.statusText} @ ${url}`);
      }

      return payload;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        const msg = `Timeout after ${timeoutMs}ms @ ${url}`;
        if (DEBUG) console.error('[API] abort:', msg);
        throw new Error(msg);
      }
      if (DEBUG) console.error('[API] request failed:', err);
      throw err;
    } finally {
      clearTimeout(id);
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

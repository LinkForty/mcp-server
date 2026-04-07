/**
 * Thin HTTP client for the LinkForty Cloud API.
 * Authenticates via API key (Bearer token).
 */
import type { Config } from './config.js';

export class LinkFortyClient {
  constructor(private config: Config) {}

  async request<T = unknown>(
    path: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      body?: unknown;
      query?: Record<string, string | number | boolean | undefined>;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, query } = options;

    let url = `${this.config.baseUrl}${path}`;

    if (query) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value));
        }
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.config.apiKey}`,
      Accept: 'application/json',
    };

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      let message = `${method} ${path} failed: ${response.status} ${response.statusText}`;
      try {
        const parsed = JSON.parse(text) as { message?: string; error?: string };
        if (parsed.message) message += ` — ${parsed.message}`;
        else if (parsed.error) message += ` — ${parsed.error}`;
      } catch {
        if (text) message += ` — ${text.substring(0, 200)}`;
      }
      throw new Error(message);
    }

    // Some endpoints return empty bodies (e.g. DELETE)
    const text = await response.text();
    if (!text) return undefined as T;

    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }

  // Convenience methods
  get<T = unknown>(path: string, query?: Record<string, string | number | boolean | undefined>) {
    return this.request<T>(path, { method: 'GET', query });
  }

  post<T = unknown>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'POST', body });
  }

  put<T = unknown>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'PUT', body });
  }

  patch<T = unknown>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'PATCH', body });
  }

  delete<T = unknown>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

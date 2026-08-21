/**
 * Single entry point for every backend call.
 *
 * Token model (post-hardening):
 *   • refresh token → httpOnly cookie, set by the API. JS can never read it,
 *     so an XSS payload cannot steal a long-lived session.
 *   • access token  → kept in MEMORY only (this module variable). It dies with
 *     the tab; on reload we silently mint a new one from the cookie.
 *   • `smart_user`  → a non-sensitive UI cache. Never trusted for authorization
 *     (the server re-checks the JWT and the role on every request).
 */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

export const USER_KEY = "smart_user";
const SESSION_FLAG = "smart_session";

export type UserRole = "learner" | "company" | "admin" | "mentor";

export interface SessionUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  username?: string;
  phone?: string;
  bio?: string;
}

export type IdentifiedSessionUser =
  | (SessionUser & { id: string })
  | (SessionUser & { _id: string });

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function getToken(): string | null {
  return accessToken;
}

/** UI-level "is someone logged in?" — survives reloads, carries no secret. */
export function hasSession(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SESSION_FLAG) === "1";
}

export function getCachedUser<T = IdentifiedSessionUser>(): T | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) ?? "null");
  } catch {
    return null;
  }
}

export function storeSession(data: {
  accessToken: string;
  user: unknown;
}): void {
  accessToken = data.accessToken;
  localStorage.setItem(SESSION_FLAG, "1");
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("user-updated"));
  }
}

export function cacheUser(user: unknown): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("user-updated"));
  }
}

export function clearSession(): void {
  accessToken = null;
  localStorage.removeItem(SESSION_FLAG);
  localStorage.removeItem(USER_KEY);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("user-updated"));
  }
}

/** Exchanges the httpOnly cookie for a fresh access token. De-duplicated. */
async function refreshSession(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include", // sends the httpOnly cookie
      });
      if (!res.ok) return null;

      const data = await res.json();
      storeSession(data);
      return data.accessToken as string;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/** Ends the server session (clears the cookie) and wipes local state. */
export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } finally {
    clearSession();
  }
}

/**
 * Drop-in replacement for `fetch` against the API:
 * base URL + bearer token + JSON headers + transparent refresh.
 */
function getOfflineCache(path: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`offline_cache:${path}`);
}

function setOfflineCache(path: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`offline_cache:${path}`, value);
  } catch (e) {
    console.error("Cache limit reached", e);
  }
}

// ── Client-side In-flight Deduplication and Memory Cache ──────────────────
const inFlightRequests = new Map<string, Promise<Response>>();
const memCache = new Map<string, { body: string; headers: [string, string][]; status: number; statusText: string; expiresAt: number }>();
const DEFAULT_GET_TTL_MS = 8000; // 8 seconds memory cache for rapid re-renders

export function invalidateClientApiCache(pattern?: string | RegExp): void {
  if (!pattern) {
    memCache.clear();
    return;
  }
  for (const key of memCache.keys()) {
    if (typeof pattern === "string" ? key.includes(pattern) : pattern.test(key)) {
      memCache.delete(key);
    }
  }
}

export async function apiFetch(
  path: string,
  init: RequestInit & { bypassCache?: boolean; ttlMs?: number } = {},
): Promise<Response> {
  const method = (init.method || "GET").toUpperCase();
  const isGet = method === "GET";

  // When a mutating request happens, invalidate relevant cached GET requests
  if (!isGet) {
    invalidateClientApiCache();
  }

  // Check In-Memory Cache for fast GET responses
  if (isGet && !init.bypassCache) {
    const cached = memCache.get(path);
    if (cached && Date.now() < cached.expiresAt) {
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers: new Headers(cached.headers),
      });
    }
  }

  // In-flight request deduplication for concurrent GETs
  if (isGet && !init.bypassCache && inFlightRequests.has(path)) {
    const inFlight = inFlightRequests.get(path)!;
    const res = await inFlight;
    return res.clone();
  }

  // Check offline state before dispatching
  if (typeof window !== "undefined" && !navigator.onLine && isGet) {
    const cached = getOfflineCache(path);
    if (cached) {
      return new Response(cached, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const send = (token: string | null) => {
    const headers = new Headers(init.headers);
    headers.delete("Authorization"); // callers must never set this themselves
    if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });
  };

  const isAuthCall =
    path.startsWith("/auth/login") ||
    path.startsWith("/auth/register") ||
    path.startsWith("/auth/google") ||
    path.startsWith("/auth/refresh");

  // No access token in memory (e.g. right after a page reload) but a session
  // exists → mint one from the cookie before firing the real request.
  if (!accessToken && !isAuthCall && hasSession()) {
    await refreshSession();
  }

  const executeFetch = async (): Promise<Response> => {
    let response: Response;
    try {
      response = await send(accessToken);
    } catch (err) {
      if (isGet) {
        const cached = getOfflineCache(path);
        if (cached) {
          return new Response(cached, {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
      throw err;
    }

    if (response.status === 401 && !isAuthCall) {
      const fresh = await refreshSession();
      if (fresh) {
        try {
          response = await send(fresh);
        } catch (err) {
          if (isGet) {
            const cached = getOfflineCache(path);
            if (cached) {
              return new Response(cached, {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }
          }
          throw err;
        }
      } else {
        clearSession();
      }
    }

    // Cache successful GET responses in memory & offline storage
    if (response.ok && isGet) {
      try {
        const clone = response.clone();
        const text = await clone.text();
        const headersArr: [string, string][] = [];
        response.headers.forEach((v, k) => headersArr.push([k, v]));

        memCache.set(path, {
          body: text,
          headers: headersArr,
          status: response.status,
          statusText: response.statusText,
          expiresAt: Date.now() + (init.ttlMs ?? DEFAULT_GET_TTL_MS),
        });

        setOfflineCache(path, text);
      } catch (e) {
        // Ignore cache storage errors
      }
    }

    return response;
  };

  if (isGet && !init.bypassCache) {
    const promise = executeFetch().finally(() => {
      inFlightRequests.delete(path);
    });
    inFlightRequests.set(path, promise);
    const res = await promise;
    return res.clone();
  }

  return executeFetch();
}

// ── Download progress ─────────────────────────────────────────────────────

export interface DownloadProgress {
  /** 0–100, or null when the server does not declare a length. */
  percent: number | null;
  /** Bytes received so far. Always available. */
  loaded: number;
  /** Total bytes, or null when unknown. */
  total: number | null;
  /** True when the size is unknown and `percent` cannot be computed. */
  indeterminate: boolean;
}

export interface ProgressInit extends RequestInit {
  onProgress?: (progress: DownloadProgress) => void;
  bypassCache?: boolean;
  ttlMs?: number;
}

/**
 * Like `apiFetch`, but reports download progress as the body streams in.
 *
 * The percentage comes from `Content-Length`. That header is absent whenever
 * the response is compressed or chunked — which is the common case for a JSON
 * API behind gzip — so callers must handle `percent: null` by showing an
 * indeterminate indicator rather than a fake number. Inventing a percentage
 * from a guessed total is worse than admitting the size is unknown: a bar that
 * jumps backwards reads as a bug.
 *
 * The returned Response is reconstructed from the streamed bytes, so callers
 * use `.json()` / `.text()` exactly as they would with `apiFetch`.
 */
export async function apiFetchWithProgress(
  path: string,
  init: ProgressInit = {},
): Promise<Response> {
  const { onProgress, ...rest } = init;

  // Progress requires a fresh stream, so never serve this from the memory cache.
  const response = await apiFetch(path, { ...rest, bypassCache: true });

  if (!onProgress || !response.body || !response.ok) return response;

  const header = response.headers.get("Content-Length");
  const total = header ? Number(header) : null;
  const hasTotal = total !== null && Number.isFinite(total) && total > 0;

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  const report = () =>
    onProgress({
      percent: hasTotal ? Math.min(100, Math.round((loaded / total!) * 100)) : null,
      loaded,
      total: hasTotal ? total : null,
      indeterminate: !hasTotal,
    });

  report();

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      loaded += value.length;
      report();
    }
  }

  // The stream is consumed, so hand back an equivalent Response over the bytes.
  const merged = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  // A body that arrived with no declared length still finished at 100%.
  onProgress({ percent: 100, loaded, total: hasTotal ? total : loaded, indeterminate: false });

  return new Response(merged, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

/** Progress-reporting JSON fetch. Throws on error responses, like `apiJson`. */
export async function apiJsonWithProgress<T>(
  path: string,
  init: ProgressInit = {},
): Promise<T> {
  const res = await apiFetchWithProgress(path, init);
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(extractErrorMessage(data, `Request failed (${res.status})`));
  }
  return data as T;
}

export function extractErrorMessage(data: unknown, fallback: string): string {
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    if (typeof obj.message === "string" && obj.message.trim()) {
      return obj.message;
    }
    if (Array.isArray(obj.message) && obj.message.length > 0) {
      return obj.message.map((m) => String(m)).join(". ");
    }
    if (typeof obj.error === "string" && obj.error.trim()) {
      return obj.error;
    }
  }
  return fallback;
}

/** Convenience wrapper that parses JSON and throws on error responses. */
export async function apiJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await apiFetch(path, init);
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = extractErrorMessage(data, `Request failed (${res.status})`);
    throw new Error(message);
  }
  return data as T;
}

/** Server-verified identity. Never trust the cached `smart_user` blob. */
export async function fetchMe(): Promise<IdentifiedSessionUser | null> {
  if (!hasSession()) return null;
  try {
    const me = await apiJson<IdentifiedSessionUser>("/auth/me");
    cacheUser(me);
    return me;
  } catch {
    return null;
  }
}

export function getUserId(user: Pick<SessionUser, "id" | "_id"> | null): string | null {
  return user?.id ?? user?._id ?? null;
}

/** Safely extracts a user-facing message without weakening catch variables. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  return extractErrorMessage(error, fallback);
}

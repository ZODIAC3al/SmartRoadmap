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

export function getCachedUser<T = any>(): T | null {
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
}

export function cacheUser(user: unknown): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  accessToken = null;
  localStorage.removeItem(SESSION_FLAG);
  localStorage.removeItem(USER_KEY);
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
export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
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

  let response = await send(accessToken);

  if (response.status === 401 && !isAuthCall) {
    const fresh = await refreshSession();
    if (fresh) {
      response = await send(fresh);
    } else {
      clearSession();
    }
  }

  return response;
}

/** Convenience wrapper that parses JSON and throws on error responses. */
export async function apiJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await apiFetch(path, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error((data as any)?.message ?? `Request failed (${res.status})`);
  return data as T;
}

/** Server-verified identity. Never trust the cached `smart_user` blob. */
export async function fetchMe(): Promise<any | null> {
  if (!hasSession()) return null;
  try {
    const me = await apiJson<any>("/auth/me");
    cacheUser(me);
    return me;
  } catch {
    return null;
  }
}

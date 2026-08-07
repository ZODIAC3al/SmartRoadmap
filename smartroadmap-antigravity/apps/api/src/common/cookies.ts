import type { Response } from 'express';

export const REFRESH_COOKIE = 'sr_refresh';

/**
 * The refresh token lives in an httpOnly cookie: JavaScript (and therefore any
 * XSS payload) cannot read it. The access token stays in memory only.
 *
 * `path` is scoped to the refresh endpoint, so the cookie is never even sent on
 * ordinary API calls — which also neutralises CSRF for every other route.
 */
export function setRefreshCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd, // HTTPS-only in production
    sameSite: isProd ? 'none' : 'lax', // 'none' because web and API are different origins
    path: '/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30d — keep in sync with JWT_REFRESH_EXPIRY
  });
}

export function clearRefreshCookie(res: Response): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/auth',
  });
}

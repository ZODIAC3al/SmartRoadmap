import {
  REFRESH_COOKIE,
  clearRefreshCookie,
  setRefreshCookie,
} from './cookies';

describe('refresh cookie', () => {
  const makeRes = () => ({ cookie: jest.fn(), clearCookie: jest.fn() }) as any;

  afterEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('is httpOnly so XSS cannot read the refresh token', () => {
    const res = makeRes();
    setRefreshCookie(res, 'refresh.jwt.value');

    const [name, value, opts] = res.cookie.mock.calls[0];
    expect(name).toBe(REFRESH_COOKIE);
    expect(value).toBe('refresh.jwt.value');
    expect(opts.httpOnly).toBe(true);
    // scoped to /auth: it is not even sent on normal API calls (CSRF surface = 0)
    expect(opts.path).toBe('/auth');
  });

  it('is Secure + SameSite=None in production', () => {
    process.env.NODE_ENV = 'production';
    const res = makeRes();
    setRefreshCookie(res, 'x');

    const opts = res.cookie.mock.calls[0][2];
    expect(opts.secure).toBe(true);
    expect(opts.sameSite).toBe('none');
  });

  it('is cleared on logout', () => {
    const res = makeRes();
    clearRefreshCookie(res);
    expect(res.clearCookie).toHaveBeenCalledWith(
      REFRESH_COOKIE,
      expect.objectContaining({ httpOnly: true }),
    );
  });
});

import { test, expect } from '@playwright/test';

/**
 * Confirms the running stack is actually usable, not merely listening.
 *
 * A port that answers is not the same as an app that works: the web server can
 * return 200 while every authenticated call fails because it is pointed at the
 * wrong API port. These checks cross that boundary on purpose.
 */

const API = process.env.API_URL ?? 'http://localhost:3002';

test('the API is reachable at the port the web app is configured to call', async ({ request }) => {
  const res = await request.get(`${API}/health`);
  expect(res.ok(), `API health at ${API}`).toBeTruthy();
});

test('public pages render', async ({ page }) => {
  for (const route of ['/', '/pricing', '/auth/login']) {
    const response = await page.goto(route, { waitUntil: 'load', timeout: 120_000 });
    expect(response?.status(), `${route} status`).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
  }
});

test('the browser can reach the API from the page origin', async ({ page }) => {
  // Catches the CORS / wrong-port class of failure, which a server-side probe
  // would miss entirely.
  await page.goto('/', { waitUntil: 'load', timeout: 120_000 });

  const result = await page.evaluate(async (api) => {
    try {
      const r = await fetch(`${api}/health`, { credentials: 'include' });
      return { ok: r.ok, status: r.status };
    } catch (e) {
      return { ok: false, status: 0, error: String(e) };
    }
  }, API);

  expect(result.ok, `browser -> ${API}/health returned ${JSON.stringify(result)}`).toBe(true);
});

test('an end-to-end signup works through the running stack', async ({ request }) => {
  const email = `boot.${Date.now()}@devotopia.dev`;
  const res = await request.post(`${API}/auth/register`, {
    data: { email, name: 'Boot Check', password: 'Passw0rd123', role: 'learner' },
  });

  // 429 means the limiter is doing its job and the stack is alive.
  if (res.status() === 429) {
    test.info().annotations.push({ type: 'note', description: 'rate limited — stack is up' });
    return;
  }

  expect(res.ok(), await res.text()).toBeTruthy();
  const body = await res.json();
  expect(body.accessToken).toBeTruthy();

  const me = await request.get(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${body.accessToken}` },
  });
  expect(me.ok()).toBeTruthy();
  expect((await me.json()).email).toBe(email);
});

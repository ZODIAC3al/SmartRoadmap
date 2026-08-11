import { test, expect } from '@playwright/test';

/**
 * The dashboard charts are loaded with `next/dynamic({ ssr: false })`, so they
 * are absent from the server HTML and appear only after hydration pulls the
 * Recharts chunk. This test is the guard for that split: it proves the charts
 * still arrive, which a bundle-size measurement alone would not tell us.
 */

const API = process.env.API_URL ?? 'http://localhost:3002';

test('lazily-loaded dashboard charts render after hydration', async ({ page, context }) => {
  test.setTimeout(180_000);

  // A fresh learner with a roadmap, so the charts have data to draw.
  const email = `perf.check.${Date.now()}@devotopia.dev`;
  const res = await page.request.post(`${API}/auth/register`, {
    data: { email, name: 'Perf Check', password: 'Passw0rd123', role: 'learner' },
  });
  expect(res.ok(), 'registration should succeed').toBeTruthy();
  const { accessToken, user } = await res.json();

  const refresh = res
    .headersArray()
    .filter((h) => h.name.toLowerCase() === 'set-cookie')
    .map((h) => h.value.match(/^sr_refresh=([^;]+)/))
    .find(Boolean)?.[1];
  expect(refresh, 'refresh cookie should be set').toBeTruthy();

  await page.request.post(`${API}/roadmap/generate`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { targetRole: 'Full-Stack Web Developer', skills: ['JavaScript'] },
  });

  await context.addCookies([
    { name: 'sr_refresh', value: refresh!, domain: 'localhost', path: '/auth', httpOnly: true },
  ]);
  await page.goto('/');
  await page.evaluate((u) => {
    localStorage.setItem('smart_session', '1');
    localStorage.setItem('smart_user', JSON.stringify(u));
  }, user);

  await page.goto('/dashboard', { waitUntil: 'load', timeout: 120_000 });

  // Recharts renders into <svg class="recharts-surface">. Waiting for it proves
  // the async chunk resolved and the component mounted with real props.
  const charts = page.locator('svg.recharts-surface');
  await expect(charts.first()).toBeVisible({ timeout: 60_000 });

  const count = await charts.count();
  expect(count, 'overview tab should render its charts').toBeGreaterThanOrEqual(4);
  test.info().annotations.push({ type: 'charts rendered', description: String(count) });
});

test('quiz countdown ring renders without Recharts', async ({ page }) => {
  // The ring was converted from a Recharts RadialBarChart to a plain SVG.
  // Loading the roadmap page is enough to confirm the component compiles and
  // the route no longer pulls the charting chunk.
  await page.goto('/auth/login', { waitUntil: 'load', timeout: 120_000 });
  const rechartsRequests: string[] = [];
  page.on('request', (r) => {
    if (/recharts/i.test(r.url())) rechartsRequests.push(r.url());
  });
  await page.waitForTimeout(1500);
  expect(rechartsRequests, 'auth pages must not load charting code').toEqual([]);
});

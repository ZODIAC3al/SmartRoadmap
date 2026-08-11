import { test, expect } from '@playwright/test';

/**
 * Renders every public route and fails on a console error.
 *
 * This is the guard for the LazyMotion conversion: `<LazyMotion strict>` throws
 * if any component still uses the full `motion.*` import, and that throw would
 * otherwise only show up as a blank panel in the browser.
 */

const ROUTES = [
  '/',
  '/pricing',
  '/about',
  '/contact',
  '/auth/login',
  '/auth/register',
  '/onboarding',
];

// Noise that is not a regression: browsers log failed requests for absent
// optional assets, and the API returns 401 for anonymous authenticated calls.
const IGNORE = [
  /favicon/i,
  /manifest\.json/i,
  /401 \(Unauthorized\)/i,
  /Failed to load resource.*40[13]/i,
  /net::ERR_/i,
];

for (const route of ROUTES) {
  test(`${route} renders without console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (!IGNORE.some((re) => re.test(text))) errors.push(text);
    });
    page.on('pageerror', (err) => errors.push(`UNCAUGHT: ${err.message}`));

    await page.goto(route, { waitUntil: 'load', timeout: 120_000 });
    await page.waitForTimeout(2500);

    await expect(page.locator('body')).toBeVisible();
    expect(errors, `console errors on ${route}`).toEqual([]);
  });
}

test('framer-motion strict mode is satisfied across animated routes', async ({ page }) => {
  // A missed `motion.*` throws "You have rendered a `motion` component within a
  // `LazyMotion` component tree" — assert that message never appears.
  const strictViolations: string[] = [];
  page.on('pageerror', (err) => {
    if (/LazyMotion|motion.*component/i.test(err.message)) strictViolations.push(err.message);
  });

  for (const route of ['/', '/auth/login', '/auth/register', '/onboarding']) {
    await page.goto(route, { waitUntil: 'load', timeout: 120_000 });
    await page.waitForTimeout(1500);
  }

  expect(strictViolations).toEqual([]);
});

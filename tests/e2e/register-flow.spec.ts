import { test, expect } from '@playwright/test';

/**
 * Registration through the real two-step UI.
 *
 * The register page catches every failure the same way — it shows the message
 * and resets to step 1 — so a network error and a validation error look
 * identical to the user. Driving the actual form is the only way to tell that
 * the whole path works: form state, apiFetch, CORS, the cookie, and the
 * redirect that follows.
 */

/**
 * Fill step 1 and advance.
 *
 * The inputs are React-controlled, so a value typed before hydration lands in
 * the DOM but never reaches component state — `handleNext` then sees empty
 * fields and refuses to advance. In `next dev` the first request to a route
 * also pays for compilation, which widens that window enough to matter. So we
 * wait for the control to be ready, then verify the value actually stuck
 * before clicking.
 */
async function completeStepOne(page: import('@playwright/test').Page, email: string) {
  const name = page.getByPlaceholder('Daniel Ahmadi');
  const continueBtn = page.getByRole('button', { name: /Continue to Onboarding/i });
  const submit = page.getByRole('button', { name: 'Register', exact: true });

  await expect(continueBtn).toBeEnabled({ timeout: 60_000 });

  // Retry the whole fill-and-advance, not just the fill. Checking the input
  // value is not enough: a pre-hydration fill writes to the DOM while React's
  // state stays empty, so the value reads back correctly and `handleNext` still
  // rejects it with "Please populate all credential fields". Reaching step 2 is
  // the only proof that component state actually received the input.
  await expect(async () => {
    await name.fill('Mohamed Elsaeed');
    await page.locator('input[type="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill('Passw0rd123');
    await continueBtn.click();
    await expect(submit).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 60_000 });
}

test('a learner can register through the two-step form', async ({ page }) => {
  test.setTimeout(120_000);

  const networkFailures: string[] = [];
  page.on('requestfailed', (r) => {
    if (r.url().includes('/auth/')) {
      networkFailures.push(`${r.method()} ${r.url()} :: ${r.failure()?.errorText}`);
    }
  });

  await page.goto('/auth/register', { waitUntil: 'domcontentloaded', timeout: 60_000 });

  // ── Step 1: credentials ──────────────────────────────────────────────────
  const email = `flow.${Date.now()}@devotopia.dev`;
  await completeStepOne(page, email);

  // ── Step 2: profile, then submit ─────────────────────────────────────────
  // The step indicator is styled uppercase and appears more than once, so the
  // submit button is the reliable signal that step 2 mounted.
  const submit = page.getByRole("button", { name: "Register", exact: true });
  await expect(submit).toBeVisible({ timeout: 30_000 });

  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/auth/register') && r.request().method() === 'POST', {
      timeout: 60_000,
    }),
    submit.click(),
  ]);

  expect(networkFailures, 'the register call must not fail at the network layer').toEqual([]);
  expect(response.status(), await response.text().catch(() => '')).toBe(201);

  // A successful learner registration lands on onboarding.
  await page.waitForURL(/\/onboarding/, { timeout: 30_000 });

  // And the session the app relies on is now present.
  const session = await page.evaluate(() => localStorage.getItem('smart_session'));
  expect(session).toBe('1');
});

test('the register page surfaces a real API error rather than failing silently', async ({ page }) => {
  // Registering the same address twice must produce a readable message, not a
  // blank screen — this is the path that showed "Failed to fetch" when the API
  // was down, so it is worth asserting it stays informative.
  const email = `dupe.${Date.now()}@devotopia.dev`;

  const first = await page.request.post(
    `${process.env.API_URL ?? 'http://localhost:3002'}/auth/register`,
    { data: { email, name: 'Dupe Check', password: 'Passw0rd123', role: 'learner' } },
  );
  expect(first.ok()).toBeTruthy();

  await page.goto('/auth/register', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await completeStepOne(page, email);

  const submit = page.getByRole("button", { name: "Register", exact: true });
  await expect(submit).toBeVisible({ timeout: 30_000 });
  await submit.click();

  // The form resets to step 1 and explains itself. "Failed to fetch" here would
  // mean the request never reached the API, which is a different fault entirely.
  await expect(page.getByPlaceholder('Daniel Ahmadi')).toBeVisible({ timeout: 30_000 });
  const body = await page.locator('body').innerText();
  expect(body, 'a duplicate email must report the API error, not a network failure')
    .not.toContain('Failed to fetch');
});

/**
 * Captures the UI screenshots embedded in the project documentation.
 *
 * Registers a fresh learner and a company through the API, generates a roadmap,
 * then walks the real interface. Screenshots are taken at 2× device pixel ratio
 * so they stay legible when scaled into an A4 page.
 *
 *   node capture-ui.mjs <output-dir>
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const WEB = process.env.WEB_URL ?? 'http://localhost:3001';
const API = process.env.API_URL ?? 'http://localhost:3002';
const OUT = process.argv[2] || 'ui-shots';
mkdirSync(OUT, { recursive: true });

const stamp = Date.now();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function register(creds) {
  const r = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds),
  });
  const body = await r.json();
  if (!r.ok) throw new Error(`register ${r.status}: ${JSON.stringify(body)}`);
  const refresh = (r.headers.getSetCookie() || [])
    .map((c) => c.match(/^sr_refresh=([^;]+)/))
    .find(Boolean)?.[1];
  return { ...body, refresh };
}

const browser = await chromium.launch({ args: ['--force-color-profile=srgb'] });

// Playwright sets viewport and pixel ratio on the context, not the browser.
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

async function go(url) {
  try {
    await page.goto(WEB + url, { waitUntil: 'networkidle', timeout: 90_000 });
  } catch {
    console.log('  (slow)', url);
  }
}

async function shot(name, { full = false, wait = 3000 } = {}) {
  await sleep(wait);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: full });
  console.log('  captured', name);
}

async function applySession(target, session) {
  await target.context().addCookies([{
    name: 'sr_refresh', value: session.refresh,
    domain: 'localhost', path: '/auth', httpOnly: true,
  }]);
  await target.goto(WEB + '/', { waitUntil: 'networkidle', timeout: 90_000 });
  await target.evaluate((u) => {
    localStorage.setItem('smart_session', '1');
    localStorage.setItem('smart_user', JSON.stringify(u));
  }, session.user);
}

// ── Public pages ───────────────────────────────────────────────────────────
console.log('public pages…');
await go('/');
await shot('ui-01-landing');
await go('/pricing');
await shot('ui-02-pricing');
await go('/auth/register');
await shot('ui-03-register');
await go('/auth/login');
await shot('ui-04-login');

// ── Learner ────────────────────────────────────────────────────────────────
console.log('learner journey…');
const learner = await register({
  email: `doc.learner.${stamp}@devotopia.dev`,
  name: 'Sarah Mitchell',
  password: 'Passw0rd123',
  role: 'learner',
});
await applySession(page, learner);

await go('/onboarding');
await shot('ui-05-onboarding');

const gen = await fetch(`${API}/roadmap/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${learner.accessToken}` },
  body: JSON.stringify({
    targetRole: 'Full-Stack Web Developer',
    skills: ['JavaScript', 'HTML', 'CSS', 'Git'],
    education: 'Bachelor of Computer Science',
    experienceYears: 1,
  }),
});
const roadmap = await gen.json().then((j) => j.roadmap || j).catch(() => ({}));
const modules = roadmap.modules || [];
console.log('  roadmap modules:', modules.length);

await go('/dashboard');
await shot('ui-06-dashboard', { wait: 5000 });
await shot('ui-07-dashboard-full', { full: true, wait: 800 });

await go('/roadmap');
await shot('ui-08-roadmap', { wait: 6000 });

if (modules[0]?.id) {
  const quizUrl = `/quiz/${encodeURIComponent(modules[0].id)}`;
  await go(quizUrl);           // warm the route (dev compiles on first hit)
  await sleep(8000);
  await go(quizUrl);
  try {
    await page.waitForFunction(
      () => /Question \d of \d/i.test(document.body.innerText),
      null, { timeout: 60_000 },
    );
    await shot('ui-09-assessment', { wait: 1500 });
  } catch {
    console.log('  ! assessment did not render in time');
  }
}

for (const [name, url] of [
  ['ui-10-cv', '/cv'],
  ['ui-11-passport', '/passport'],
  ['ui-12-jobs', '/hiring'],
  ['ui-13-resources', '/resources'],
  ['ui-14-community', '/community'],
  ['ui-15-mentors', '/mentors'],
  ['ui-16-achievements', '/achievements'],
  ['ui-17-practice', '/practice'],
  ['ui-18-calendar', '/calendar'],
  ['ui-19-profile', '/profile'],
]) {
  await go(url);
  await shot(name, { wait: 4000 });
}

// ── Theme and locale ───────────────────────────────────────────────────────
console.log('theme and locale…');
await go('/dashboard');
await page.evaluate(() => {
  localStorage.setItem('theme', 'smartdark');
  document.documentElement.setAttribute('data-theme', 'smartdark');
});
await shot('ui-20-dark', { wait: 3000 });

await page.evaluate(() => {
  localStorage.setItem('theme', 'smartlight');
  localStorage.setItem('locale', 'ar');
});
await go('/dashboard');
await shot('ui-21-arabic-dashboard', { wait: 4000 });
await go('/roadmap');
await shot('ui-22-arabic-roadmap', { wait: 5000 });
await page.evaluate(() => localStorage.setItem('locale', 'en'));

// ── Company ────────────────────────────────────────────────────────────────
console.log('company…');
try {
  const ccontext = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const cpage = await ccontext.newPage();
  const company = await register({
    email: `doc.company.${stamp}@devotopia.dev`,
    name: 'Northwind Technologies',
    password: 'Passw0rd123',
    role: 'company',
  });
  await applySession(cpage, company);

  await cpage.goto(WEB + '/company', { waitUntil: 'networkidle', timeout: 90_000 });
  await sleep(5000);
  await cpage.screenshot({ path: path.join(OUT, 'ui-23-company-dashboard.png') });
  console.log('  captured ui-23-company-dashboard');

  await cpage.goto(WEB + '/hiring', { waitUntil: 'networkidle', timeout: 90_000 });
  await sleep(4000);
  await cpage.screenshot({ path: path.join(OUT, 'ui-24-company-candidates.png') });
  console.log('  captured ui-24-company-candidates');
} catch (e) {
  console.log('  ! company flow:', String(e).slice(0, 160));
}

// ── Mobile viewport ────────────────────────────────────────────────────────
console.log('mobile…');
try {
  const mcontext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const m = await mcontext.newPage();
  await m.goto(WEB + '/', { waitUntil: 'networkidle', timeout: 90_000 });
  await sleep(3500);
  await m.screenshot({ path: path.join(OUT, 'ui-25-mobile-landing.png') });
  console.log('  captured ui-25-mobile-landing');
} catch (e) {
  console.log('  ! mobile:', String(e).slice(0, 120));
}

await browser.close();
console.log('done →', OUT);

import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { measureRoute, reportTable, type PageMetrics } from './measure';

/**
 * Baseline page-load timings for the public routes.
 *
 * These are budgets, not assertions about correctness: a failure here means the
 * site got slower, which is a real regression even when every feature works.
 */

const PUBLIC_ROUTES = ['/', '/pricing', '/about', '/contact', '/auth/login', '/auth/register'];

// Budgets are deliberately generous for `next dev`, which compiles on demand
// and ships an unminified bundle. Tighten them once measured against `next start`.
const BUDGET = {
  lcp: 4000,
  cls: 0.1,
  jsKb: 6000,
};

const collected: PageMetrics[] = [];

test.describe('public route load performance', () => {
  // `next dev` compiles a route on first request; that can outlast the default
  // 30s test timeout on a cold start without the site being slow for users.
  test.describe.configure({ timeout: 240_000 });

  for (const route of PUBLIC_ROUTES) {
    test(`${route} loads within budget`, async ({ page }) => {
      // Warm the route first: in dev the first hit pays for compilation, which
      // is a build cost, not a user-facing one.
      await page.goto(route, { waitUntil: 'load', timeout: 180_000 });

      const m = await measureRoute(page, route);
      collected.push(m);

      test.info().annotations.push({
        type: 'metrics',
        description:
          `LCP ${m.lcp}ms · FCP ${m.fcp}ms · TTFB ${m.ttfb}ms · ` +
          `CLS ${m.cls} · ${m.requests} reqs · ${m.transferredKb}KB ` +
          `(JS ${m.jsKb}KB, CSS ${m.cssKb}KB, img ${m.imageKb}KB) · ` +
          `longest task ${m.longestTaskMs}ms · LCP element: ${m.lcpElement}`,
      });

      expect(m.lcp, `LCP on ${route}`).toBeLessThan(BUDGET.lcp);
      expect(m.cls, `CLS on ${route}`).toBeLessThan(BUDGET.cls);
      expect(m.jsKb, `JS payload on ${route}`).toBeLessThan(BUDGET.jsKb);
    });
  }

  test.afterAll(() => {
    if (!collected.length) return;
    const table = reportTable(collected);
    console.log('\n' + table + '\n');
    mkdirSync('output/perf', { recursive: true });
    writeFileSync('output/perf/baseline.md', '# Page load metrics\n\n' + table + '\n');
    writeFileSync('output/perf/baseline.json', JSON.stringify(collected, null, 2));
  });
});

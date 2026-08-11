import type { Page } from '@playwright/test';

export interface PageMetrics {
  route: string;
  /** Time to first byte from the Next.js server. */
  ttfb: number;
  /** DOM parsed and blocking scripts executed. */
  domContentLoaded: number;
  /** First Contentful Paint — first pixel of real content. */
  fcp: number;
  /** Largest Contentful Paint — when the main content is visible. */
  lcp: number;
  /** Total load event time. */
  load: number;
  /** Cumulative Layout Shift — visual stability, lower is better. */
  cls: number;
  /** Bytes transferred over the wire, and the raw resource count. */
  transferredKb: number;
  requests: number;
  jsKb: number;
  cssKb: number;
  imageKb: number;
  /** Longest single main-thread task; > 50 ms blocks interaction. */
  longestTaskMs: number;
  /** What actually painted last — the thing to optimise when LCP is high. */
  lcpElement: string;
}

/**
 * Loads a route and reports what the user actually waits for.
 *
 * LCP and CLS are only final once the page settles, so we install the
 * observers before navigation and read them after the network goes quiet.
 */
export async function measureRoute(page: Page, route: string): Promise<PageMetrics> {
  await page.addInitScript(() => {
    (window as any).__perf = { lcp: 0, cls: 0, longestTask: 0, lcpElement: '' };
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        (window as any).__perf.lcp = entry.startTime;
        // Record what painted, so a slow LCP names its own cause.
        const el = entry.element as Element | undefined;
        (window as any).__perf.lcpElement = entry.url
          ? `img ${String(entry.url).split('/').pop()}`
          : el
            ? `<${el.tagName.toLowerCase()}> ${(el.textContent || '').trim().slice(0, 40)}`
            : '(unknown)';
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        if (!entry.hadRecentInput) (window as any).__perf.cls += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        (window as any).__perf.longestTask = Math.max(
          (window as any).__perf.longestTask,
          entry.duration,
        );
      }
    }).observe({ type: 'longtask', buffered: true });
  });

  await page.goto(route, { waitUntil: 'load', timeout: 120_000 });
  // Let late work (lazy chunks, fonts, deferred images) land before reading.
  await page
    .waitForLoadState('networkidle', { timeout: 30_000 })
    .catch(() => { /* a page that polls never goes idle — measure it anyway */ });
  await page.waitForTimeout(1200);

  return page.evaluate((r) => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const res = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0;
    const perf = (window as any).__perf;

    const kb = (n: number) => Math.round((n / 1024) * 10) / 10;
    const sumBy = (test: (u: string, t: string) => boolean) =>
      res.filter((x) => test(x.name, x.initiatorType)).reduce((a, x) => a + x.transferSize, 0);

    return {
      route: r,
      ttfb: Math.round(nav.responseStart - nav.requestStart),
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
      fcp: Math.round(fcp),
      lcp: Math.round(perf.lcp),
      load: Math.round(nav.loadEventEnd - nav.startTime),
      cls: Math.round(perf.cls * 1000) / 1000,
      transferredKb: kb(res.reduce((a, x) => a + x.transferSize, 0) + nav.transferSize),
      requests: res.length,
      jsKb: kb(sumBy((u, t) => t === 'script' || /\.js(\?|$)/.test(u))),
      cssKb: kb(sumBy((u, t) => t === 'link' && /\.css(\?|$)/.test(u))),
      imageKb: kb(sumBy((u, t) => t === 'img' || /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/.test(u))),
      longestTaskMs: Math.round(perf.longestTask),
      lcpElement: perf.lcpElement || '(none)',
    };
  }, route);
}

/** Renders a metrics table into the Playwright report and stdout. */
export function reportTable(rows: PageMetrics[]): string {
  const head = [
    'route', 'TTFB', 'FCP', 'LCP', 'DCL', 'load', 'CLS', 'reqs', 'total KB', 'JS KB', 'longest task',
  ];
  const body = rows.map((m) => [
    m.route,
    `${m.ttfb}ms`,
    `${m.fcp}ms`,
    `${m.lcp}ms`,
    `${m.domContentLoaded}ms`,
    `${m.load}ms`,
    `${m.cls}`,
    `${m.requests}`,
    `${m.transferredKb}`,
    `${m.jsKb}`,
    `${m.longestTaskMs}ms`,
  ]);
  const widths = head.map((h, i) =>
    Math.max(h.length, ...body.map((r) => r[i].length)),
  );
  const line = (cells: string[]) =>
    '| ' + cells.map((c, i) => c.padEnd(widths[i])).join(' | ') + ' |';
  return [
    line(head),
    '|' + widths.map((w) => '-'.repeat(w + 2)).join('|') + '|',
    ...body.map(line),
  ].join('\n');
}

import { test, expect } from '@playwright/test';

interface PerfSample { route: string; fcp: number; domContentLoaded: number; loadEvent: number; transferKB: number; resources: number; }

const samples: PerfSample[] = [];

async function measure(page: any, route: string): Promise<PerfSample> {
  return await page.evaluate((r: string) => {
    const n = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0;
    const res = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const transfer = res.reduce((s, x) => s + (x.transferSize || 0), 0) + (n.transferSize || 0);
    return { route: r, fcp: Math.round(fcp), domContentLoaded: Math.round(n.domContentLoadedEventEnd), loadEvent: Math.round(n.loadEventEnd), transferKB: Math.round(transfer / 1024), resources: res.length };
  }, route);
}

test.describe('Smoke & performance (guest)', () => {
  test('home renders, no uncaught JS errors, perf within ceiling', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', e => pageErrors.push(e.message));

    await page.goto('/', { waitUntil: 'load' });
    await expect(page.locator('app-header')).toBeVisible();

    const s = await measure(page, '/');
    samples.push(s);
    console.log('[perf]', JSON.stringify(s));

    expect(pageErrors, pageErrors.join('\n')).toHaveLength(0);
    expect(s.fcp, `FCP ${s.fcp}ms`).toBeLessThan(8000);
  });

  test('products page renders a grid', async ({ page }) => {
    await page.goto('/products', { waitUntil: 'load' });
    await expect(page.locator('app-header')).toBeVisible();
    await expect(page.locator('app-product-card').first()).toBeVisible({ timeout: 25000 });
    samples.push(await measure(page, '/products'));
    console.log('[perf]', JSON.stringify(samples.at(-1)));
  });

  test('offers page renders', async ({ page }) => {
    await page.goto('/offers', { waitUntil: 'load' });
    await expect(page.locator('app-header')).toBeVisible();
    samples.push(await measure(page, '/offers'));
    console.log('[perf]', JSON.stringify(samples.at(-1)));
  });

  test('product details page renders its gallery', async ({ page, request }) => {
    const res = await request.get('http://localhost:3000/api/products?limit=1');
    const data = await res.json();
    const p = Array.isArray(data) ? data[0] : (data.products || data.data || [])[0];
    await page.goto(`/product/${p.id}`, { waitUntil: 'load' });
    await expect(page.locator('app-image-gallery img.main-image')).toBeVisible({ timeout: 25000 });
    samples.push(await measure(page, '/product'));
    console.log('[perf]', JSON.stringify(samples.at(-1)));
  });

  test.afterAll(() => {
    console.log('\n===== PERF SUMMARY =====');
    for (const s of samples) {
      console.log(`${s.route.padEnd(12)} FCP=${String(s.fcp).padStart(5)}ms  DCL=${String(s.domContentLoaded).padStart(5)}ms  load=${String(s.loadEvent).padStart(5)}ms  transfer=${String(s.transferKB).padStart(5)}KB  res=${s.resources}`);
    }
    console.log('========================\n');
  });
});

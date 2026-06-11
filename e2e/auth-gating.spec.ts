import { test, expect } from '@playwright/test';

test.describe('Auth gating', () => {
  test('guest: no notifications bell, and /cart opens the login drawer', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await expect(page.locator('app-header')).toBeVisible();
    expect(await page.locator('a[href="/notifications"]').count()).toBe(0);

    await page.goto('/cart', { waitUntil: 'load' });
    await expect(page.locator('.auth-drawer-panel.open')).toBeVisible();
  });

  test('logged-in: notifications bell is visible with an unread badge', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: 'e2e/.auth/user.json' });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'load' });
    const bell = page.locator('a[href="/notifications"]:visible').first();
    await expect(bell).toBeVisible();
    // unread badge (welcome + coupon + general were seeded) shows a number
    await expect(bell.locator('.header-badge, .badge')).toBeVisible();
    await ctx.close();
  });
});

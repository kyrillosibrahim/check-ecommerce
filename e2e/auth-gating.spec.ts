import { test, expect } from '@playwright/test';

test.describe('Auth gating', () => {
  test('guest: no notifications bell, and /cart opens the login drawer', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await expect(page.locator('app-header')).toBeVisible();
    expect(await page.locator('a[href="/notifications"]').count()).toBe(0);

    await page.goto('/cart', { waitUntil: 'load' });
    await expect(page.locator('.auth-drawer-panel.open')).toBeVisible();
  });

  test('guest: add-to-cart prompts login and does NOT add the item', async ({ page }) => {
    await page.goto('/products', { waitUntil: 'load' });
    const card = page.locator('app-product-card').first();
    await expect(card).toBeVisible({ timeout: 25000 });

    await card.locator('button.btn-primary').first().click();

    // Login drawer opens, and nothing was added (no cart badge anywhere).
    await expect(page.locator('.auth-drawer-panel.open')).toBeVisible();
    await expect(
      page.locator('a[href="/cart"] .header-badge, a[href="/cart"] .badge, .mobile-bottom-nav-badge')
    ).toHaveCount(0);
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

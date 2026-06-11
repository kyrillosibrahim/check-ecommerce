import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json' });

test.describe('Notifications page', () => {
  test('shows welcome, coupon card (copyable + countdown) and a general linked message', async ({ page }) => {
    await page.goto('/notifications', { waitUntil: 'load' });
    await expect(page.locator('.notif-title')).toBeVisible();

    // State 2 — welcome
    await expect(page.getByText(/الانضمام فى كاف/).first()).toBeVisible();

    // State 4 — coupon card with code, percentage field and a countdown
    const coupon = page.locator('.coupon-box').first();
    await expect(coupon).toBeVisible();
    await expect(coupon.getByText('PWTEST10')).toBeVisible();
    await expect(coupon.getByText('نسبة الخصم')).toBeVisible();
    await expect(coupon.getByText(/ينتهى خلال/)).toBeVisible();

    // State 5 — general message that carries a link
    const general = page.locator('.notif-card.clickable', { hasText: 'عرض اليوم' });
    await expect(general).toBeVisible();
    await general.click();
    await expect(page).toHaveURL(/\/offers/);
  });

  test('clicking the bell navigates to the notifications page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page.locator('a[href="/notifications"]:visible').first().click();
    await expect(page).toHaveURL(/\/notifications/);
    await expect(page.locator('.notif-title')).toBeVisible();
  });
});

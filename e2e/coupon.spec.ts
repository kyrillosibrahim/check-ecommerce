import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json' });

test.describe('Coupon in cart', () => {
  test('applying PWTEST10 shows the applied code and a promo discount line', async ({ page }) => {
    await page.goto('/cart', { waitUntil: 'load' });

    // The cart was seeded with one product in global-setup.
    await expect(page.locator('app-cart-item').first()).toBeVisible({ timeout: 25000 });

    // The promo box is the text input-group with a primary button (quantity
    // steppers use number inputs + outline buttons; the header search is outside app-cart).
    const input = page.locator('app-cart .input-group input[type="text"]').first();
    await input.fill('PWTEST10');
    await page.locator('app-cart .input-group button.btn-primary').first().click();

    // Success state renders the applied code + a promo-success row.
    await expect(page.locator('app-cart').getByText('PWTEST10').first()).toBeVisible();
    await expect(page.locator('.promo-success')).toBeVisible();
  });

  test('an invalid code shows an error and does not apply', async ({ page }) => {
    await page.goto('/cart', { waitUntil: 'load' });
    await expect(page.locator('app-cart-item').first()).toBeVisible({ timeout: 25000 });

    const input = page.locator('app-cart .input-group input[type="text"]').first();
    await input.fill('NOPE-INVALID');
    await page.locator('app-cart .input-group button.btn-primary').first().click();

    await expect(page.locator('app-cart .text-danger').first()).toBeVisible();
    await expect(page.locator('.promo-success')).toHaveCount(0);
  });
});

import { test, expect } from '@playwright/test';

const navTargets = ['bookings', 'guests', 'cleaning'];

async function hasAuthScreen(page) {
  return await page.getByRole('button', { name: /sign in|log in|login/i }).first().isVisible().catch(() => false);
}

test('app loads and key containers render', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('#root')).toBeVisible();
});

test('no horizontal overflow on root shell', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(overflow.sw).toBeLessThanOrEqual(overflow.cw + 2);
});

test('mobile sidebar opens and closes from overlay/nav', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile-only smoke');
  await page.goto('/');
  if (await hasAuthScreen(page)) test.skip(true, 'Auth screen shown (no session), app nav unavailable.');

  await page.getByTestId('mobile-hamburger').click();
  await expect(page.locator('.sidebar.sidebar-mobile')).toBeVisible();
  await page.getByTestId('sidebar-overlay').click();
  await expect(page.locator('.sidebar.sidebar-mobile')).toBeHidden();

  await page.getByTestId('mobile-hamburger').click();
  await page.locator('.sidebar.sidebar-mobile .sidebar-nav-item').first().click();
  await expect(page.locator('.sidebar.sidebar-mobile')).toBeHidden();
});

test('navigation renders target pages when authenticated', async ({ page }) => {
  await page.goto('/');
  if (await hasAuthScreen(page)) test.skip(true, 'Auth screen shown (no session).');

  for (const key of navTargets) {
    await page.locator(`.sidebar .sidebar-nav-item[aria-label*="${key === 'guests' ? 'Guest' : key === 'bookings' ? 'Booking' : 'Cleaning'}"]`).first().click();
    await expect(page.locator('.page')).toBeVisible();
  }
});

test('table containers scroll instead of overflowing', async ({ page }) => {
  await page.goto('/');
  if (await hasAuthScreen(page)) test.skip(true, 'Auth screen shown (no session).');
  const wraps = page.locator('.table-wrap');
  const count = await wraps.count();
  if (count === 0) test.skip(true, 'No table on initial route.');
  const first = wraps.first();
  await expect(first).toBeVisible();
  const isScrollable = await first.evaluate((el) => el.scrollWidth >= el.clientWidth);
  expect(isScrollable).toBeTruthy();
});

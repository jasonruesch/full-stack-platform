import { expect, test } from '@playwright/test';
import { login } from './helpers';

test('redirects unauthenticated visitors to login', async ({ page }) => {
  await page.goto('/collections');
  await expect(page).toHaveURL(/\/login/);
});

test('signs in and lists the seeded collections', async ({ page }) => {
  await login(page);
  await expect(
    page.getByRole('heading', { name: 'Collections', level: 1 }),
  ).toBeVisible();
  await expect(page.getByText('Reading List')).toBeVisible();
});

test('opens a collection and searches its bookmarks (GraphQL)', async ({
  page,
}) => {
  await login(page);
  await page.getByRole('link', { name: /Reading List/ }).click();
  await expect(page).toHaveURL(/\/collections\/.+/);

  // Seeded bookmarks render; searching nonsense shows the empty state.
  const search = page.getByPlaceholder('Search bookmarks…');
  await expect(search).toBeVisible();
  await search.fill('zzzznomatchhh');
  await expect(page.getByText('No matches')).toBeVisible();
});

test('creates a new collection', async ({ page }) => {
  await login(page);
  const name = `E2E ${Date.now()}`;
  await page.getByRole('button', { name: /new collection/i }).click();
  await page.getByLabel('Name').fill(name);
  await page.getByRole('button', { name: /^create$/i }).click();
  // Navigates into the new (empty) collection.
  await expect(
    page.getByRole('heading', { name, level: 1 }),
  ).toBeVisible();
  await expect(page.getByText('No bookmarks yet')).toBeVisible();
});

import { expect, type Page } from '@playwright/test';

export const DEMO = { email: 'demo@bookmarkvault.app', password: 'password' };

/** Sign in with the seeded demo account and land on the collections page. */
export async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(DEMO.email);
  await page.getByLabel('Password').fill(DEMO.password);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/collections$/);
}

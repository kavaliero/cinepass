import { expect, test } from '@playwright/test';

test.describe('Cinépass - happy path', () => {
  test('charge la home et affiche les films groupés par âge', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Cinépass/i })).toBeVisible();
    // Au moins une section d'âge doit apparaître
    await expect(page.getByText(/3-5 ans|6-8 ans|9-12 ans/).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('peut filtrer par recherche', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder(/Rechercher/i).fill('Toy Story');
    await expect(page.getByText(/Toy Story/).first()).toBeVisible({ timeout: 5_000 });
  });

  test('cliquer sur un film cycle son statut', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder(/Rechercher/i).fill('Toy Story');
    const card = page.getByRole('button', { name: /Toy Story/ }).first();
    await card.waitFor({ state: 'visible' });
    // Status par défaut = "À voir" (⭐). Click -> "Vu" (✅)
    await card.click();
    await expect(card).toContainText('✅', { timeout: 5_000 });
  });
});

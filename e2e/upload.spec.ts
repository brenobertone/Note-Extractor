import { test, expect } from '@playwright/test';

test('has title and upload component', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/SnapFlow/);

  // Check if upload component is present
  const uploadButton = page.getByRole('button', {
    name: 'Upload & Categorize',
    exact: true,
  });
  await expect(uploadButton).toBeVisible();
});

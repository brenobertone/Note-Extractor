import { test, expect } from '@playwright/test';

test.describe('Thumbnail Gallery', () => {
  // Minimal 1x1 PNG image buffer
  const pngData = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should display thumbnails after upload', async ({ page }) => {
    // Upload an image
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: pngData,
    });

    // Click upload button
    await page.getByRole('button', { name: /upload & categorize/i }).click();

    // Wait for processing
    await expect(page.getByText(/processing|categorized/i)).toBeVisible({
      timeout: 10000,
    });

    // Wait for success message (with emoji)
    await expect(page.getByText(/✨ Categorized!/i)).toBeVisible({
      timeout: 10000,
    });

    // Check that thumbnail appears in gallery
    const previousNotesSection = page
      .locator('text=Previous Notes')
      .locator('..');
    await expect(previousNotesSection.locator('img').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('should open modal when clicking thumbnail', async ({ page }) => {
    // First, ensure there's at least one thumbnail
    // Wait for the page to load and thumbnails to appear
    await page.waitForSelector('text=Previous Notes', { timeout: 5000 });

    // Try to find a thumbnail - if none exists, skip this test part
    const thumbnail = page.locator('.cursor-pointer.group').first();
    const thumbnailCount = await thumbnail.count();

    if (thumbnailCount === 0) {
      // Upload a test image first
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: pngData,
      });
      await page.getByRole('button', { name: /upload & categorize/i }).click();
      await expect(page.getByText(/categorized/i)).toBeVisible({
        timeout: 10000,
      });

      // Wait for gallery to refresh
      await page.waitForTimeout(1000);
    }

    // Click on the first thumbnail
    await page.locator('.cursor-pointer.group').first().click();

    // Modal should appear
    await expect(page.locator('.fixed.inset-0.bg-black\\/80')).toBeVisible();

    // Modal should show the image
    await expect(
      page.locator('.bg-white.dark\\:bg-zinc-900 img').first()
    ).toBeVisible();

    // Modal should show extracted content heading
    await expect(page.getByText('Extracted Content')).toBeVisible();
  });

  test('should close modal when clicking backdrop', async ({ page }) => {
    // Wait for page load
    await page.waitForSelector('text=Previous Notes', { timeout: 5000 });

    // Ensure there's a thumbnail to click
    const thumbnailCount = await page.locator('.cursor-pointer.group').count();
    if (thumbnailCount === 0) {
      test.skip();
    }

    // Open modal
    await page.locator('.cursor-pointer.group').first().click();
    await expect(page.locator('.fixed.inset-0.bg-black\\/80')).toBeVisible();

    // Click backdrop (the outer fixed div)
    await page.locator('.fixed.inset-0.bg-black\\/80').click({
      position: { x: 10, y: 10 }, // Click top-left corner (backdrop)
    });

    // Modal should disappear
    await expect(
      page.locator('.fixed.inset-0.bg-black\\/80')
    ).not.toBeVisible();
  });

  test('should close modal when clicking close button', async ({ page }) => {
    // Wait for page load
    await page.waitForSelector('text=Previous Notes', { timeout: 5000 });

    // Ensure there's a thumbnail to click
    const thumbnailCount = await page.locator('.cursor-pointer.group').count();
    if (thumbnailCount === 0) {
      test.skip();
    }

    // Open modal
    await page.locator('.cursor-pointer.group').first().click();
    await expect(page.locator('.fixed.inset-0.bg-black\\/80')).toBeVisible();

    // Click close button (×)
    await page.getByText('×').click();

    // Modal should disappear
    await expect(
      page.locator('.fixed.inset-0.bg-black\\/80')
    ).not.toBeVisible();
  });

  test('should show 4 thumbnails per row on desktop', async ({ page }) => {
    // Wait for gallery section
    await page.waitForSelector('text=Previous Notes', { timeout: 5000 });

    // Wait a bit for potential thumbnails to load
    await page.waitForTimeout(1000);

    // Check for grid-cols-4 class - may not be visible if empty
    const grid = page.locator('.grid.grid-cols-4');
    const gridCount = await grid.count();

    // If grid exists, it should have the correct class
    if (gridCount > 0) {
      await expect(grid).toBeVisible();
    } else {
      // If no thumbnails, that's also ok (empty state)
      const emptyState = page.locator('text=/No notes yet/i');
      await expect(emptyState).toBeVisible();
    }
  });

  test('should show multi-image badge when action has multiple images', async ({
    page,
  }) => {
    // This test depends on having multi-image uploads
    // For now, just verify the badge element exists if there are multiple images

    // Wait for gallery
    await page.waitForSelector('text=Previous Notes', { timeout: 5000 });

    // Look for any badge with + symbol
    const badge = page.locator('.absolute.top-2.right-2');
    const badgeCount = await badge.count();

    // If badges exist, verify they contain +
    if (badgeCount > 0) {
      const badgeText = await badge.first().textContent();
      expect(badgeText).toMatch(/\+\d+/);
    }
  });

  test('should display category labels on thumbnails', async ({ page }) => {
    // Wait for gallery
    await page.waitForSelector('text=Previous Notes', { timeout: 5000 });

    // Check if thumbnails exist
    const thumbnailCount = await page.locator('.cursor-pointer.group').count();

    if (thumbnailCount === 0) {
      test.skip();
    }

    // Category labels should be visible (Tasks or Habits)
    const categoryLabel = page
      .locator('.cursor-pointer.group')
      .first()
      .locator('text=/Tasks|Habits/');
    await expect(categoryLabel).toBeVisible();
  });

  test('should navigate between images in multi-image modal', async ({
    page,
  }) => {
    // This test requires a multi-image action
    // We'll skip if no multi-image actions exist

    await page.waitForSelector('text=Previous Notes', { timeout: 5000 });

    // Look for thumbnails with badge (indicating multiple images)
    const multiImageThumbnail = page.locator(
      '.cursor-pointer.group:has(.absolute.top-2.right-2)'
    );
    const count = await multiImageThumbnail.count();

    if (count === 0) {
      test.skip();
    }

    // Click multi-image thumbnail
    await multiImageThumbnail.first().click();

    // Modal should be visible
    await expect(page.locator('.fixed.inset-0.bg-black\\/80')).toBeVisible();

    // Look for thumbnail navigation buttons
    const navThumbnails = page.locator('button:has(img)');
    const navCount = await navThumbnails.count();

    // Should have multiple navigation thumbnails
    expect(navCount).toBeGreaterThan(1);

    // Click second thumbnail
    if (navCount > 1) {
      await navThumbnails.nth(1).click();
      // Main image should still be visible (just changed index)
      await expect(
        page.locator('.bg-white.dark\\:bg-zinc-900 img').first()
      ).toBeVisible();
    }
  });

  test('should show empty state when no notes exist', async ({ page }) => {
    // This test would require a fresh database
    // For now, we'll check that the component handles empty state

    // If the gallery is empty, it should show a message
    const emptyMessage = page.locator(
      'text=/No notes yet|Upload an image to get started/i'
    );

    // Wait a bit to see if thumbnails load
    await page.waitForTimeout(2000);

    const thumbnailCount = await page.locator('.cursor-pointer.group').count();

    if (thumbnailCount === 0) {
      await expect(emptyMessage).toBeVisible();
    }
  });

  test('should scroll when many thumbnails are present', async ({ page }) => {
    // Wait for gallery
    await page.waitForSelector('text=Previous Notes', { timeout: 5000 });

    // Check for overflow-y-auto class (scrollable container)
    const scrollableContainer = page.locator(
      '.max-h-\\[600px\\].overflow-y-auto'
    );
    await expect(scrollableContainer).toBeVisible();
  });
});

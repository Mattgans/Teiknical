import { test, expect } from '@playwright/test';

test('four minimal tabs display CSV results and support filtering', async ({ page }, testInfo) => {
  const errors = [];
  const dataRequests = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => { if (request.url().includes('/data/')) dataRequests.push(request.url()); });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '1. Data management' })).toBeVisible();
  await expect(page.getByText('10,500', { exact: true })).toBeVisible();
  expect(dataRequests.every((url) => url.endsWith('.csv'))).toBe(true);

  await page.getByRole('tab', { name: 'Part 2' }).click();
  await page.getByLabel('Search sample ID').fill('sample00000');
  await expect(page.getByText('5 rows', { exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: /^Population/ }).click();
  await page.getByRole('option', { name: 'B cells', exact: true }).click();
  await expect(page.getByText('1 row', { exact: true })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download CSV' }).click();
  expect((await download).suggestedFilename()).toBe('cell_frequencies.csv');
  await page.getByLabel('Search sample ID').fill('not-a-sample');
  await expect(page.getByText('No matching rows. Try a different filter.')).toBeVisible();

  await page.getByRole('tab', { name: 'Part 3' }).click();
  await expect(page.getByRole('img')).toHaveCount(5);
  await expect(page.getByRole('cell', { name: 'Yes', exact: true })).toHaveCount(1);
  await expect(page.getByRole('cell', { name: 'No', exact: true })).toHaveCount(4);
  await expect(page.getByText(/CD4 T cells are 0.64 percentage points higher/)).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('response-desktop.png'), fullPage: true });

  await page.getByRole('tab', { name: 'Part 4' }).click();
  await expect(page.getByText('10206.15', { exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: /^Project/ }).click();
  await page.getByRole('option', { name: 'prj3', exact: true }).click();
  await expect(page.getByText('272 rows', { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByRole('tab', { name: 'Part 4' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('baseline-mobile.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('missing CSV shows recovery instructions', async ({ page }) => {
  await page.route('**/data/database_summary.csv', (route) => route.fulfill({ status: 404, body: '' }));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Run python pipeline.py');
});

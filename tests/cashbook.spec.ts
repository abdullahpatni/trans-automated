import { test, expect } from '@playwright/test';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { selectDateRange, loadDateRange } from './utils/dateHelper';

test.use({
  storageState: 'ivcargo.json',
});

test('Cash Booking excel download', async ({ page }) => {
  await page.goto('https://ivcargo.in/ivcargo/CashStatementReport.do?pageId=50');

  console.log('➡️ Navigating to Report...');
  await page.getByRole('link', { name: 'Report' }).click();

  await page.getByText('☰').click();
  await page.getByRole('link', { name: 'Cash Statement' }).click();

  // Select date
  const dateRange = loadDateRange();
  await selectDateRange(page, dateRange);


  const downloadsFolder = path.join(os.homedir(), 'Downloads');
  if (!fs.existsSync(downloadsFolder)) {
    fs.mkdirSync(downloadsFolder, { recursive: true });
  }

  // Get all region options
  const regionOptions = await page.locator('#region option').all();

  for (const regionOption of regionOptions) {
    const regionValue = await regionOption.getAttribute('value');
    const regionText = await regionOption.textContent();

    if (!regionValue || regionValue === '-1') continue;

    console.log(`🌍 Region: ${regionText} (${regionValue})`);
    await page.locator('#region').selectOption(regionValue);
    await page.waitForTimeout(1000); // Let subregions load

    const subRegionOptions = await page.locator('#subRegion option').all();

    for (const subRegionOption of subRegionOptions) {
      const subRegionValue = await subRegionOption.getAttribute('value');
      const subRegionText = await subRegionOption.textContent();

      if (!subRegionValue || subRegionValue === '-1') continue;

      console.log(`  🏙️ SubRegion: ${subRegionText} (${subRegionValue})`);
      await page.locator('#subRegion').selectOption(subRegionValue);
      await page.waitForTimeout(1000); // Let branches load

      const branchOptions = await page.locator('#branch option').all();

      for (const branchOption of branchOptions) {
        const branchValue = await branchOption.getAttribute('value');
        const branchText = await branchOption.textContent();

        if (!branchValue || branchValue === '-1') continue;

        console.log(`    🏢 Branch: ${branchText} (${branchValue})`);

        await page.locator('#branch').selectOption(branchValue);
        // await page.locator('#type').selectOption('1');
        // await page.locator('#reportType').selectOption('1');

        await page.getByRole('button', { name: 'Find' }).click();

        // Wait for result panel to load
        try {
          await page.waitForSelector('#bottom-border-boxshadow .panel-body', { timeout: 5000 });
        } catch {
          console.warn(`    ⚠️  Results panel did not load for: ${regionText} → ${subRegionText} → ${branchText}`);
          continue;
        }

        // Check if "No Records Found" is displayed
        const resultText = await page.locator('#bottom-border-boxshadow .panel-body').innerText();
        if (resultText.includes('No Records Found')) {
          console.warn(`    ⚠️  No records found for: ${regionText} → ${subRegionText} → ${branchText}`);
          continue;
        }

        const downloadLinks = await page.locator('xpath=//*[@id="excelDownLoadLink"]').all();

        // Define the indices you want to click: 0 (1st) and 2 (3rd)
        const indicesToClick = [0, 2];

        // Corresponding suffixes for filenames
        const suffixes = ['cash', 'cashless'];

        for (let i = 0; i < indicesToClick.length; i++) {
          const index = indicesToClick[i];
          const suffix = suffixes[i];

          const downloadLink = downloadLinks[index];
          if (!downloadLink) {
            console.warn(`    ⚠️  Download link at index ${index} not found.`);
            continue;
          }

          try {
            const [download] = await Promise.all([
              page.waitForEvent('download', { timeout: 5000 }),
              downloadLink.click(),
            ]);

            const safeRegion = regionText?.replace(/[^a-z0-9]/gi, '_') ?? 'region';
            const safeSubRegion = subRegionText?.replace(/[^a-z0-9]/gi, '_') ?? 'subregion';
            const safeBranch = branchText?.replace(/[^a-z0-9]/gi, '_') ?? 'branch';

            const fileName = `ivcargo_${safeRegion}_${safeSubRegion}_${safeBranch}_${suffix}_${Date.now()}.xls`;
            const filePath = path.join(downloadsFolder, fileName);

            await download.saveAs(filePath);
            console.log(`      ✅ Saved (${suffix}): ${filePath}`);
          } catch (err) {
            console.warn(`    ❌ Download failed or timed out for: ${regionText} → ${subRegionText} → ${branchText} [${suffix}]`);
            continue;
          }
        }


      }
    }
  }

  console.log('🎉 All downloads complete. Missing or failed ones were skipped.');
});

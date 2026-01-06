import { Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

interface DateRange {
  fromYear?: string;
  fromMonth?: string;
  fromDateMonth?: string;
  fromDay?: string;
  fromDateDay?: string;
  toDateDay?: string;
  toDateMonth?: string;
}

export async function selectDateRange(page: Page, dateRange: DateRange) {
  // Determine which date properties are available
  const fromDay = dateRange.fromDay || dateRange.fromDateDay;
  const fromMonth = dateRange.fromMonth || dateRange.fromDateMonth;
  const toDay = dateRange.toDateDay;
  const toMonth = dateRange.toDateMonth;

  // Select from date
  await page.locator('#fromDateField').getByRole('img', { name: 'Popup' }).click();
  
  // If fromYear exists, it means we need to select year too (billregister case)
  if (dateRange.fromYear) {
    await page.getByRole('combobox').nth(4).selectOption(dateRange.fromYear);
  }
  
  if (fromMonth) {
    await page.getByRole('combobox').nth(3).selectOption(fromMonth);
  }
  
  if (fromDay) {
    await page.getByRole('link', { name: fromDay, exact: true }).click();
  }

  // Select to date
  await page.locator('#toDateField').getByRole('img', { name: 'Popup' }).click();
  
  if (toMonth) {
    await page.getByRole('combobox').nth(3).selectOption(toMonth);
  }
  
  if (toDay) {
    await page.getByRole('link', { name: toDay, exact: true }).click();
  }
}

export function loadDateRange(): DateRange {
  const dateFilePath = path.join(__dirname, '..', '..', 'input.json');
  const dateRange = JSON.parse(fs.readFileSync(dateFilePath, 'utf-8'));
  return dateRange;
}

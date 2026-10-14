import { test, expect } from '@playwright/test';
import { config, computeDiff, normalizeValue } from '../../../tools/compare';
import * as fs from 'fs';
import * as path from 'path';

test.describe('CSS Comparison Suite', () => {
  test.setTimeout(120000);

  test('Compare CSS properties across India Capitals pages', async ({ browser }) => {
    const context = await browser.newContext({ viewport: config.viewport });
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    console.log(`Navigating Site 1: ${config.url1}`);
    await page1.goto(config.url1, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page1.waitForTimeout(2000);

    console.log(`Navigating Site 2: ${config.url2}`);
    await page2.goto(config.url2, { waitUntil: 'networkidle', timeout: 60000 });
    await page2.waitForTimeout(2000);

    const groupedDiffs: Record<string, Array<{ Property: string; 'Site 1': string; 'Site 2': string; Diff: string }>> = {};
    const flatDiffs: Array<{ Element: string; Property: string; 'Site 1': string; 'Site 2': string; Diff: string }> = [];
    const summaryList: Array<{ Element: string; TotalDifferences: number }> = [];
    let grandTotal = 0;

    for (const [name, target] of Object.entries(config.elements)) {
      const loc1 = typeof target.page1 === 'function' ? target.page1(page1) : page1.locator(target.page1);
      const loc2 = typeof target.page2 === 'function' ? target.page2(page2) : page2.locator(target.page2);

      const getStyles = async (locator: any) => {
        try {
          const first = locator.first();
          await first.waitFor({ state: 'visible', timeout: 5000 });
          return await first.evaluate((el: Element, props: string[]) => {
            const cs = window.getComputedStyle(el);
            const res: Record<string, string> = {};
            for (const p of props) res[p] = cs.getPropertyValue(p);
            return res;
          }, config.props);
        } catch {
          return 'NOT FOUND';
        }
      };

      const s1 = await getStyles(loc1);
      const s2 = await getStyles(loc2);

      const elementDiffs: Array<{ Property: string; 'Site 1': string; 'Site 2': string; Diff: string }> = [];

      for (const prop of config.props) {
        const v1 = s1 === 'NOT FOUND' ? 'NOT FOUND' : s1[prop] || '';
        const v2 = s2 === 'NOT FOUND' ? 'NOT FOUND' : s2[prop] || '';

        const diff = computeDiff(v1, v2, prop);
        if (diff !== '') {
          const row = {
            Property: prop,
            'Site 1': v1 === 'NOT FOUND' ? 'NOT FOUND' : normalizeValue(v1),
            'Site 2': v2 === 'NOT FOUND' ? 'NOT FOUND' : normalizeValue(v2),
            Diff: diff,
          };
          elementDiffs.push(row);
          flatDiffs.push({ Element: name, ...row });
        }
      }

      groupedDiffs[name] = elementDiffs;
      summaryList.push({ Element: name, TotalDifferences: elementDiffs.length });
      grandTotal += elementDiffs.length;

      console.log(`\n===== ${name} =====`);
      if (elementDiffs.length === 0) {
        console.log('No differences');
      } else {
        console.table(elementDiffs);
      }
    }

    await context.close();

    console.log('\n======================================================');
    console.log('       SUMMARY: TOTAL DIFFERENCES PER ELEMENT         ');
    console.log('======================================================');
    console.table(summaryList);
    console.log(`Grand Total of Differences: ${grandTotal}\n`);

    expect(flatDiffs.length).toBeGreaterThan(0);
  });
});

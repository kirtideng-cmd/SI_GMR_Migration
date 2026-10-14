/**
 * Playwright CSS Comparison Script
 *
 * Compares computed CSS properties across two pages and outputs per-element diff tables.
 *
 * RUN INSTRUCTIONS:
 *   npx ts-node compare.ts
 *   (or: npm run compare)
 */

import { chromium } from 'playwright';
import type { Page, Locator } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------------------------
export const config = {
  url1: 'https://www.gmrsports.in/india-capitals',
  url2: 'https://gmr.surface.fan-os.net/indiaCapitals',
  viewport: { width: 1440, height: 900 },
  props: [
    'font-size',
    'font-weight',
    'line-height',
    'color',
    'font-family',
    'padding',
    'margin',
    'gap',
    'border',
    'border-radius',
    'background',
    'box-shadow',
    'position',
    'width',
    'height',
    'text-shadow',
    'object-fit',
    'z-index',
  ],
  elements: {
    'section heading ("News")': {
      page1: '.landing-news .title',
      page2: 'section:has-text("News") .template-header p',
    },
    '"More" button': {
      page1: '.landing-news a:has-text("More")',
      page2: 'section:has-text("News") a:has-text("More")',
    },
    'big card': {
      page1: '.landing-news .first-list article',
      page2: 'section:has-text("News") .template-body article:first-of-type',
    },
    'big card title': {
      page1: '.landing-news .first-list article .article-title',
      page2: 'section:has-text("News") .template-body article:first-of-type p.body_lg_bold',
    },
    'small card': {
      page1: '.landing-news .second-list article',
      page2: 'section:has-text("News") .template-body article:nth-of-type(3)',
    },
    'small card title': {
      page1: '.landing-news .second-list article .article-title',
      page2: 'section:has-text("News") .template-body article:nth-of-type(3) p.h2_bold',
    },
    'category label': {
      page1: '.landing-news article .meta-category',
      page2: 'section:has-text("News") .template-body article .badge-site',
    },
    'card image': {
      page1: '.landing-news article img',
      page2: 'section:has-text("News") .template-body article img',
    },
    'scroll-to-top button': {
      page1: '.btn-top-scroll, button[aria-label="back to top"]',
      page2: '.fx-scroll-top-btn, button[aria-label="Scroll to top"]',
    },
  } as Record<string, { page1: string | ((p: Page) => Locator); page2: string | ((p: Page) => Locator) }>,
};

// ---------------------------------------------------------------------------
// NORMALIZATION & DIFF HELPERS
// ---------------------------------------------------------------------------

/**
 * Normalizes color representations:
 * - Treats rgb() and rgba() with alpha 1 as equal
 * - Removes superfluous whitespace
 */
function normalizeColor(str: string): string {
  return str
    .replace(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*1(?:\.0+)?\s*\)/gi, 'rgb($1, $2, $3)')
    .replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/gi, (_match, r, g, b, a) => {
      if (a === undefined || a === '1' || a === '1.0') {
        return `rgb(${r}, ${g}, ${b})`;
      }
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    });
}

/**
 * Normalizes a CSS property value before comparison:
 * 1. Trim whitespace and lowercase text values.
 * 2. Normalize colors so rgb() and rgba() with alpha 1 are treated as equal.
 * 3. Round numeric px values to 2 decimals.
 * 4. Remove redundant quotes and normalize spaces.
 */
export function normalizeValue(val: string): string {
  if (!val) return '';
  let s = val.trim().toLowerCase();
  s = normalizeColor(s);

  // Round px values to 2 decimals
  s = s.replace(/(-?\d+(?:\.\d+)?)px/g, (_m, num) => {
    const rounded = Math.round(parseFloat(num) * 100) / 100;
    return `${rounded}px`;
  });

  s = s.replace(/['"]/g, '');
  s = s.replace(/\s+/g, ' ');
  return s;
}

/**
 * Parses shorthand multi-values (1 to 4 space-separated values) into top, right, bottom, left.
 */
function parseSides(val: string): { top: number; right: number; bottom: number; left: number; unit: string } | null {
  const parts = val.trim().split(/\s+/);
  if (parts.length === 0 || parts.length > 4) return null;

  const parsed: { num: number; unit: string }[] = [];
  for (const p of parts) {
    const match = p.match(/^(-?\d+(?:\.\d+)?)(px|%|em|rem)?$/);
    if (!match) return null;
    parsed.push({ num: parseFloat(match[1]), unit: match[2] || 'px' });
  }

  const unit = parsed[0].unit;
  if (parsed.some((p) => p.unit !== unit)) return null;

  const nums = parsed.map((p) => p.num);
  let t = 0,
    r = 0,
    b = 0,
    l = 0;
  if (nums.length === 1) {
    t = r = b = l = nums[0];
  } else if (nums.length === 2) {
    t = b = nums[0];
    r = l = nums[1];
  } else if (nums.length === 3) {
    t = nums[0];
    r = l = nums[1];
    b = nums[2];
  } else {
    t = nums[0];
    r = nums[1];
    b = nums[2];
    l = nums[3];
  }

  return { top: t, right: r, bottom: b, left: l, unit };
}

/**
 * Computes difference description between two property values.
 * Returns empty string if there is no difference.
 */
export function computeDiff(value1: string, value2: string, prop: string = ''): string {
  // Missing element check
  if (value1 === 'NOT FOUND' || value2 === 'NOT FOUND') {
    return 'N/A';
  }

  const v1Trim = value1.trim().toLowerCase();
  const v2Trim = value2.trim().toLowerCase();

  // Skip comparing if both sides are 'auto' or empty
  if ((!v1Trim && !v2Trim) || (v1Trim === 'auto' && v2Trim === 'auto')) {
    return '';
  }

  const norm1 = normalizeValue(value1);
  const norm2 = normalizeValue(value2);

  // Equal values after normalization
  if (norm1 === norm2) {
    return '';
  }

  const pLower = prop.toLowerCase();

  // Multi-value properties: padding, margin, border-radius
  if (['padding', 'margin', 'border-radius'].includes(pLower)) {
    const s1 = parseSides(norm1);
    const s2 = parseSides(norm2);
    if (s1 && s2 && s1.unit === s2.unit) {
      // If both were single values without multiple tokens, show simple unit diff
      if (!norm1.includes(' ') && !norm2.includes(' ')) {
        const diff = Math.round((s2.top - s1.top) * 100) / 100;
        if (diff === 0) return '';
        const sign = diff > 0 ? `+${diff}` : `${diff}`;
        return `${sign}${s1.unit}`;
      }

      const cornerLabels =
        pLower === 'border-radius'
          ? ['top-left', 'top-right', 'bottom-right', 'bottom-left']
          : ['top', 'right', 'bottom', 'left'];
      const keys = ['top', 'right', 'bottom', 'left'] as const;
      const diffs: string[] = [];
      for (let i = 0; i < 4; i++) {
        const k = keys[i];
        const label = cornerLabels[i];
        const diff = Math.round((s2[k] - s1[k]) * 100) / 100;
        if (diff !== 0) {
          const sign = diff > 0 ? `+${diff}` : `${diff}`;
          diffs.push(`${label} ${sign}${s1.unit}`);
        }
      }
      if (diffs.length > 0) {
        return diffs.join(', ');
      }
      return '';
    }
  }

  // Numeric values with units (px, %, em, rem)
  const unitRegex = /^(-?\d+(?:\.\d+)?)(px|%|em|rem)$/;
  const u1 = norm1.match(unitRegex);
  const u2 = norm2.match(unitRegex);
  if (u1 && u2 && u1[2] === u2[2]) {
    const diff = Math.round((parseFloat(u2[1]) - parseFloat(u1[1])) * 100) / 100;
    if (diff === 0) return '';
    const sign = diff > 0 ? `+${diff}` : `${diff}`;
    return `${sign}${u1[2]}`;
  }

  // Plain numbers (font-weight, z-index, opacity)
  const numRegex = /^(-?\d+(?:\.\d+)?)$/;
  const n1 = norm1.match(numRegex);
  const n2 = norm2.match(numRegex);
  if (n1 && n2) {
    const diff = Math.round((parseFloat(n2[1]) - parseFloat(n1[1])) * 100) / 100;
    if (diff === 0) return '';
    return diff > 0 ? `+${diff}` : `${diff}`;
  }

  // Colors (rgb, rgba, or prop name 'color')
  if (
    pLower === 'color' ||
    norm1.startsWith('rgb(') ||
    norm1.startsWith('rgba(') ||
    norm2.startsWith('rgb(') ||
    norm2.startsWith('rgba(')
  ) {
    return 'changed';
  }

  // Text values (position, display, font-family, object-fit) or general fallback
  return 'changed';
}

// ---------------------------------------------------------------------------
// PLAYWRIGHT LOCATOR & STYLE EXTRACTION
// ---------------------------------------------------------------------------

function resolveLocator(page: Page, target: string | ((p: Page) => Locator)): Locator {
  return typeof target === 'function' ? target(page) : page.locator(target);
}

async function getStyles(
  locator: Locator,
  props: string[],
  timeout = 5000
): Promise<Record<string, string> | 'NOT FOUND'> {
  try {
    const firstEl = locator.first();
    await firstEl.waitFor({ state: 'visible', timeout });
    return await firstEl.evaluate((el, requestedProps) => {
      const computed = window.getComputedStyle(el);
      const styles: Record<string, string> = {};
      for (const prop of requestedProps) {
        styles[prop] = computed.getPropertyValue(prop);
      }
      return styles;
    }, props);
  } catch {
    return 'NOT FOUND';
  }
}

function escapeCsv(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

// ---------------------------------------------------------------------------
// HTML REPORT GENERATOR
// ---------------------------------------------------------------------------

interface ElementDiffRow {
  Property: string;
  'Site 1': string;
  'Site 2': string;
  Diff: string;
}

function generateHtmlReport(
  groupedDiffs: Record<string, ElementDiffRow[]>,
  summary: Array<{ Element: string; TotalDifferences: number }>,
  grandTotal: number
): string {
  const timestamp = new Date().toLocaleString();

  const summaryRowsHtml = summary
    .map(
      (s) => `
      <tr>
        <td><strong>${s.Element}</strong></td>
        <td style="text-align:center;">
          <span class="badge ${s.TotalDifferences > 0 ? 'badge-danger' : 'badge-success'}">
            ${s.TotalDifferences}
          </span>
        </td>
      </tr>`
    )
    .join('');

  const sectionsHtml = Object.entries(groupedDiffs)
    .map(([elementName, rows]) => {
      if (rows.length === 0) {
        return `
        <div class="element-card">
          <div class="element-header">
            <h3>===== ${elementName} =====</h3>
            <span class="badge badge-success">No differences</span>
          </div>
          <p class="no-diff-msg">All compared CSS properties match perfectly.</p>
        </div>`;
      }

      const tableRowsHtml = rows
        .map(
          (r) => `
        <tr class="diff-row">
          <td class="prop-col"><code>${r.Property}</code></td>
          <td class="val-col">${escapeHtml(r['Site 1'])}</td>
          <td class="val-col">${escapeHtml(r['Site 2'])}</td>
          <td class="diff-col"><span class="diff-chip">${escapeHtml(r.Diff)}</span></td>
        </tr>`
        )
        .join('');

      return `
      <div class="element-card">
        <div class="element-header">
          <h3>===== ${elementName} =====</h3>
          <span class="badge badge-danger">${rows.length} difference${rows.length === 1 ? '' : 's'}</span>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Property</th>
                <th>Site 1</th>
                <th>Site 2</th>
                <th>Diff</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>
        </div>
      </div>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSS Migration Comparison Report</title>
  <style>
    :root {
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --border: #e2e8f0;
      --text: #0f172a;
      --text-muted: #64748b;
      --danger-bg: #fee2e2;
      --danger-text: #991b1b;
      --danger-chip: #fca5a5;
      --success-bg: #dcfce7;
      --success-text: #166534;
      --primary: #2563eb;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 32px 24px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    header {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px 28px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; color: var(--text); }
    .meta-info {
      font-size: 13px;
      color: var(--text-muted);
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 12px;
    }
    .meta-item strong { color: var(--text); }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 20px;
    }
    .stat-card {
      background: #f1f5f9;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    .stat-number { font-size: 28px; font-weight: 700; color: var(--primary); }
    .stat-number.danger { color: #dc2626; }
    .stat-label { font-size: 13px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }

    .summary-section {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .summary-section h2 { font-size: 18px; margin-bottom: 16px; }

    .element-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .element-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 12px;
    }
    .element-header h3 { font-size: 16px; font-weight: 600; font-family: monospace; }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-danger { background: var(--danger-bg); color: var(--danger-text); }
    .badge-success { background: var(--success-bg); color: var(--success-text); }
    .no-diff-msg { color: var(--success-text); font-weight: 500; font-size: 14px; }

    .table-container { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th {
      background: #f8fafc;
      text-align: left;
      padding: 10px 14px;
      font-weight: 600;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td { padding: 12px 14px; border-bottom: 1px solid var(--border); }
    tr.diff-row { background-color: var(--danger-bg); }
    tr.diff-row:hover { background-color: #fecaca; }
    .prop-col code { font-weight: 600; color: #1e293b; }
    .val-col { font-family: monospace; font-size: 13px; color: #334155; word-break: break-all; }
    .diff-col { white-space: nowrap; }
    .diff-chip {
      background: #ffffff;
      border: 1px solid var(--danger-chip);
      color: var(--danger-text);
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Playwright CSS Comparison Report</h1>
      <p style="color: var(--text-muted); font-size: 14px;">Element-by-element computed style diff across desktop viewports.</p>
      
      <div class="meta-info">
        <div class="meta-item"><strong>Generated:</strong> ${timestamp}</div>
        <div class="meta-item"><strong>Viewport:</strong> ${config.viewport.width}x${config.viewport.height}</div>
        <div class="meta-item"><strong>Site 1:</strong> <a href="${config.url1}" target="_blank">${config.url1}</a></div>
        <div class="meta-item"><strong>Site 2:</strong> <a href="${config.url2}" target="_blank">${config.url2}</a></div>
      </div>

      <div class="summary-grid">
        <div class="stat-card">
          <div class="stat-number">${Object.keys(config.elements).length}</div>
          <div class="stat-label">Total Elements</div>
        </div>
        <div class="stat-card">
          <div class="stat-number ${grandTotal > 0 ? 'danger' : ''}">${summary.filter((s) => s.TotalDifferences > 0).length}</div>
          <div class="stat-label">Elements with Diffs</div>
        </div>
        <div class="stat-card">
          <div class="stat-number danger">${grandTotal}</div>
          <div class="stat-label">Grand Total Differences</div>
        </div>
      </div>
    </header>

    <section class="summary-section">
      <h2>Differences per Element Summary</h2>
      <table>
        <thead>
          <tr>
            <th>Element</th>
            <th style="text-align:center;">Total Differences</th>
          </tr>
        </thead>
        <tbody>
          ${summaryRowsHtml}
        </tbody>
      </table>
    </section>

    <section>
      ${sectionsHtml}
    </section>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ---------------------------------------------------------------------------
// MAIN COMPARISON RUNNER
// ---------------------------------------------------------------------------

async function runComparison() {
  console.log(`Starting CSS comparison at viewport ${config.viewport.width}x${config.viewport.height}...\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: config.viewport });

  const page1 = await context.newPage();
  const page2 = await context.newPage();

  console.log(`Navigating Site 1: ${config.url1}`);
  await page1.goto(config.url1, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page1.waitForTimeout(2000);

  console.log(`Navigating Site 2: ${config.url2}`);
  await page2.goto(config.url2, { waitUntil: 'networkidle', timeout: 60000 });
  await page2.waitForTimeout(2000);

  const groupedDiffs: Record<string, ElementDiffRow[]> = {};
  const flatDiffsForCsv: Array<{ Element: string; Property: string; 'Site 1': string; 'Site 2': string; Diff: string }> = [];
  const summaryList: Array<{ Element: string; TotalDifferences: number }> = [];

  let grandTotal = 0;

  for (const [name, target] of Object.entries(config.elements)) {
    const loc1 = resolveLocator(page1, target.page1);
    const loc2 = resolveLocator(page2, target.page2);

    const rawStyles1 = await getStyles(loc1, config.props);
    const rawStyles2 = await getStyles(loc2, config.props);

    const elementDiffs: ElementDiffRow[] = [];

    for (const prop of config.props) {
      const v1 = rawStyles1 === 'NOT FOUND' ? 'NOT FOUND' : rawStyles1[prop] || '';
      const v2 = rawStyles2 === 'NOT FOUND' ? 'NOT FOUND' : rawStyles2[prop] || '';

      const diff = computeDiff(v1, v2, prop);

      // Record only when there is a difference
      if (diff !== '') {
        const displayVal1 = v1 === 'NOT FOUND' ? 'NOT FOUND' : normalizeValue(v1);
        const displayVal2 = v2 === 'NOT FOUND' ? 'NOT FOUND' : normalizeValue(v2);

        const row: ElementDiffRow = {
          Property: prop,
          'Site 1': displayVal1,
          'Site 2': displayVal2,
          Diff: diff,
        };

        elementDiffs.push(row);
        flatDiffsForCsv.push({
          Element: name,
          Property: prop,
          'Site 1': displayVal1,
          'Site 2': displayVal2,
          Diff: diff,
        });
      }
    }

    groupedDiffs[name] = elementDiffs;
    summaryList.push({
      Element: name,
      TotalDifferences: elementDiffs.length,
    });
    grandTotal += elementDiffs.length;

    // 1. Console output: Heading + table per element
    console.log(`\n===== ${name} =====`);
    if (elementDiffs.length === 0) {
      console.log('No differences');
    } else {
      console.table(elementDiffs);
    }
  }

  await browser.close();

  // 2. Summary at the end
  console.log('\n======================================================');
  console.log('       SUMMARY: TOTAL DIFFERENCES PER ELEMENT         ');
  console.log('======================================================');
  console.table(summaryList);
  console.log(`Grand Total of Differences: ${grandTotal}\n`);

  // 3. Save diff-report.csv: Element, Property, Site 1, Site 2, Diff
  const csvHeaders = ['Element', 'Property', 'Site 1', 'Site 2', 'Diff'];
  const csvRows = flatDiffsForCsv.map((d) =>
    [escapeCsv(d.Element), escapeCsv(d.Property), escapeCsv(d['Site 1']), escapeCsv(d['Site 2']), escapeCsv(d.Diff)].join(',')
  );
  const csvPath = path.resolve('diff-report.csv');
  fs.writeFileSync(csvPath, [csvHeaders.join(','), ...csvRows].join('\n'), 'utf-8');
  console.log(`Saved CSV report:  ${csvPath}`);

  // 4. Save diff-report.json: grouped by element
  const jsonPath = path.resolve('diff-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(groupedDiffs, null, 2), 'utf-8');
  console.log(`Saved JSON report: ${jsonPath}`);

  // 5. Save diff-report.html: readable report with light-red highlights
  const htmlPath = path.resolve('diff-report.html');
  const htmlContent = generateHtmlReport(groupedDiffs, summaryList, grandTotal);
  fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
  console.log(`Saved HTML report: ${htmlPath}`);
}

// Execute when run directly
if (require.main === module) {
  runComparison().catch((err) => {
    console.error('Execution failed:', err);
    process.exit(1);
  });
}

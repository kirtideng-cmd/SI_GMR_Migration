import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

interface DiffRow {
  property: string;
  site1: string;
  site2: string;
  diff: string;
}

interface TestResultData {
  tcId: string;
  title: string;
  status: 'Pass' | 'Fail';
  diffRows: DiffRow[];
  differingCount: number;
  errorMessages: string[];
}

async function main() {
  const reportPath = path.resolve('results/report.json');
  const reportJson = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

  const parsedTcs: any[] = JSON.parse(fs.readFileSync('parsed_test_cases.json', 'utf-8'));
  const resultsByTc: Record<string, TestResultData> = {};

  // Walk Playwright suites
  function walkSuites(suite: any) {
    if (suite.specs) {
      for (const spec of suite.specs) {
        const title = spec.title || '';
        const match = title.match(/^(TC\d+)/);
        if (!match) continue;
        const tcId = match[1];

        const testRun = spec.tests?.[0];
        const result = testRun?.results?.[0];
        const outcome = result?.status === 'passed' ? 'Pass' : 'Fail';

        let diffRows: DiffRow[] = [];
        if (result?.attachments) {
          const diffAttach = result.attachments.find((a: any) => a.name === 'css-diff');
          if (diffAttach?.body) {
            try {
              const decoded = Buffer.from(diffAttach.body, 'base64').toString('utf-8');
              diffRows = JSON.parse(decoded);
            } catch {
              try {
                diffRows = JSON.parse(diffAttach.body);
              } catch {}
            }
          }
        }

        const differingRows = diffRows.filter((r) => r.diff !== '0' && r.diff !== '+0.00px' && r.diff !== '-0.00px');
        const errors = (result?.errors || []).map((e: any) => e.message || '');

        resultsByTc[tcId] = {
          tcId,
          title,
          status: outcome,
          diffRows,
          differingCount: differingRows.length,
          errorMessages: errors,
        };
      }
    }
    if (suite.suites) {
      for (const s of suite.suites) walkSuites(s);
    }
  }

  for (const s of reportJson.suites || []) {
    walkSuites(s);
  }

  console.log(`Matched ${Object.keys(resultsByTc).length} test cases from report.json`);

  let totalPassed = 0;
  let totalFailed = 0;
  let totalNotFound = 0;

  for (const tc of parsedTcs) {
    const res = resultsByTc[tc['TC ID']];
    if (res?.status === 'Pass') {
      totalPassed++;
    } else {
      totalFailed++;
    }
  }

  const total = parsedTcs.length;

  console.log({ total, totalPassed, totalFailed, totalNotFound });

  // 1. Generate results/summary.md
  let summaryMd = `# News CSS Test Cases - Automation Summary

## Overall Totals
| Metric | Count |
| :--- | :--- |
| **Total Test Cases** | ${total} |
| **Passed** | ${totalPassed} |
| **Failed** | ${totalFailed} |
| **Locator Issues (Not Found)** | ${totalNotFound} |

---

## Test Results Overview
| TC ID | Test Case | Status | Differing Properties Count |
| :--- | :--- | :---: | :---: |
`;

  for (const tc of parsedTcs) {
    const id = tc['TC ID'];
    const res = resultsByTc[id];
    const statusBadge = res?.status === 'Pass' ? '✅ Pass' : '❌ Fail';
    const diffCount = res ? res.differingCount : 'N/A';
    summaryMd += `| **${id}** | ${tc['Test Case']} | ${statusBadge} | ${diffCount} |\n`;
  }

  summaryMd += `\n---\n\n## Detailed Failure Reports\n`;

  for (const tc of parsedTcs) {
    const id = tc['TC ID'];
    const res = resultsByTc[id];
    if (res && res.status === 'Fail') {
      const differing = res.diffRows.filter((r) => r.diff !== '0' && r.diff !== '+0.00px' && r.diff !== '-0.00px');
      summaryMd += `\n### ${id} - ${tc['Test Case']}\n`;
      summaryMd += `**Section**: ${tc.Section} | **Element Under Test**: \`${tc['Element Under Test']}\`\n\n`;

      if (differing.length > 0) {
        summaryMd += `| Property | Site 1 | Site 2 | Diff |\n`;
        summaryMd += `| :--- | :--- | :--- | :--- |\n`;
        for (const row of differing) {
          summaryMd += `| \`${row.property}\` | \`${row.site1}\` | \`${row.site2}\` | \`${row.diff}\` |\n`;
        }
      } else if (res.errorMessages.length > 0) {
        summaryMd += `**Error Details**:\n\`\`\`\n${res.errorMessages[0].slice(0, 300)}\n\`\`\`\n`;
      }
    }
  }

  fs.writeFileSync('results/summary.md', summaryMd, 'utf-8');
  console.log('Saved results/summary.md');

  // 2. Generate News_CSS_Test_Cases_Results.xlsx
  const srcWbPath = path.resolve('Manual_TestCases/News_CSS_Test_Cases_With_Steps.xlsx');
  const outWbPath = path.resolve('News_CSS_Test_Cases_Results.xlsx');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(srcWbPath);

  const sheet = workbook.getWorksheet('News CSS Test Cases')!;

  // Locate column indices
  const headerRow = sheet.getRow(1);
  const colMap: Record<string, number> = {};
  headerRow.eachCell((cell, colNumber) => {
    colMap[cell.text.trim()] = colNumber;
  });

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const tcIdCell = row.getCell(colMap['TC ID']);
    const tcId = tcIdCell.text.trim();
    if (!tcId) return;

    const res = resultsByTc[tcId];
    if (res) {
      const statusCell = row.getCell(colMap['Status']);
      statusCell.value = res.status;

      // Differing properties
      const differing = res.diffRows.filter((r) => r.diff !== '0' && r.diff !== '+0.00px' && r.diff !== '-0.00px');

      const site1Cell = row.getCell(colMap['Site 1 Value']);
      const site2Cell = row.getCell(colMap['Site 2 Value']);
      const remarksCell = row.getCell(colMap['Remarks']);

      if (res.status === 'Pass') {
        site1Cell.value = res.diffRows.map((r) => `${r.property}: ${r.site1}`).slice(0, 4).join('; ');
        site2Cell.value = res.diffRows.map((r) => `${r.property}: ${r.site2}`).slice(0, 4).join('; ');
        remarksCell.value = 'All checked properties match within tolerance.';
      } else {
        if (differing.length > 0) {
          site1Cell.value = differing.map((r) => `${r.property}: ${r.site1}`).join('; ');
          site2Cell.value = differing.map((r) => `${r.property}: ${r.site2}`).join('; ');
          remarksCell.value = differing.map((r) => `${r.property} (${r.diff})`).join(', ');
        } else if (res.errorMessages.length > 0) {
          remarksCell.value = res.errorMessages[0].slice(0, 150).replace(/\n/g, ' ');
        }
      }
    }
  });

  await workbook.xlsx.writeFile(outWbPath);
  console.log(`Saved copy of workbook to: ${outWbPath}`);
}

main().catch(console.error);

import ExcelJS from 'exceljs';
import * as path from 'path';

async function main() {
  const filePath = path.resolve('manual-testcases/News_CSS_Test_Cases_With_Steps.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  console.log('Worksheet names:');
  workbook.eachSheet((sheet, id) => {
    console.log(`- ${sheet.name} (id: ${id}, rowCount: ${sheet.rowCount})`);
  });

  const sheet = workbook.getWorksheet('News CSS Test Cases') || workbook.worksheets[0];
  console.log(`\nReading sheet: ${sheet.name}`);

  // Header row
  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber] = cell.text.trim();
  });
  console.log('Headers:', headers);

  const rows: any[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const rowData: Record<string, any> = { _rowNumber: rowNumber };
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber] || `col_${colNumber}`;
      rowData[header] = cell.text;
    });
    rows.push(rowData);
  });

  console.log(`Total data rows: ${rows.length}`);
  console.log('First 2 rows sample:', JSON.stringify(rows.slice(0, 2), null, 2));
}

main().catch(console.error);

import XLSX from "xlsx";
/**
 * Inserts rows into an x-data-spreadsheet instance and rerenders it.
 * @param {object} params
 * @param {object} params.s - x-data-spreadsheet instance
 * @param {string} params.sheetName - Name of the sheet
 * @param {Array<Array<string|number>>} params.rows - 2D array of data to insert
 * @param {string} [params.startCell] - Optional starting cell like "A5"
 */
export const insertRowsToSpreadsheet = (s, { sheetName, rows, startCell }) => {
  if (!s) return console.error("Spreadsheet instance is required");
  if (!sheetName || !rows || !rows.length) return console.error("Sheet name and rows are required");

  const sheet = s.getSheet(sheetName);
  if (!sheet) return console.error(`Sheet "${sheetName}" not found`);
  console.log(sheet)
  const data = sheet.data;

  // Column <-> Number conversion
  const colToNum = (col) =>
    col.split("").reduce((acc, char) => acc * 26 + (char.charCodeAt(0) - 64), 0);

  const numToCol = (num) => {
    let col = "";
    while (num > 0) {
      const rem = (num - 1) % 26;
      col = String.fromCharCode(65 + rem) + col;
      num = Math.floor((num - 1) / 26);
    }
    return col;
  };

  // Determine insertion start
  let startCol = "A";
  let startRow = 1;

  if (startCell && /^[A-Z]+[0-9]+$/.test(startCell)) {
    const [, col, row] = startCell.match(/^([A-Z]+)(\d+)$/);
    startCol = col;
    startRow = parseInt(row);
  } else if (sheet.dataEnd) {
    const endMatch = sheet.dataEnd.match(/^([A-Z]+)(\d+)$/);
    if (endMatch) {
      const [, endCol, endRow] = endMatch;
      startCol = "A";
      startRow = parseInt(endRow) + 1;
    }
  }

  const startC = colToNum(startCol);

  // Insert data
  for (let i = 0; i < rows.length; i++) {
    const rowArr = rows[i];
    for (let j = 0; j < rowArr.length; j++) {
      const val = rowArr[j];
      const cell = `${numToCol(startC + j)}${startRow + i}`;
      data[cell] = val;
    }
  }

  // Update sheet meta
  const endC = startC + (rows[0]?.length || 0) - 1;
  const endR = startRow + rows.length - 1;
  sheet.dataEnd = `${numToCol(endC)}${endR}`;
  sheet.numRows = Math.max(sheet.numRows || 0, endR);
  sheet.numCols = Math.max(sheet.numCols || 0, endC);

  // Rerender the spreadsheet
  s.refresh();
  console.log(`✅ Inserted ${rows.length} row(s) into "${sheetName}" at range ${startCol}${startRow}:${numToCol(endC)}${endR}`);
};

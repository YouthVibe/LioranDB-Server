"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "../utils/useAuth";
import { xtos, stox } from "../lib/xlsxspread";

const XLSX_URL = "/js/xlsx.js";
const XSPREAD_CSS = "/css/xs.css";
const XSPREAD_JS = "/js/xspreadsheet.js";
// const XLSX_URL = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
// const XSPREAD_CSS = "https://cdn.jsdelivr.net/npm/x-data-spreadsheet@1.1.9/dist/xspreadsheet.css";
// const XSPREAD_JS = "https://cdn.jsdelivr.net/npm/x-data-spreadsheet@1.1.9/dist/xspreadsheet.js";

export default function SpreadsheetClient({ isMobile, setSpreadsheetInstance, NEXT_PUBLIC_CLERK_BACKEND_URL, setSpreadsheetReady }) {
  const ref = useRef();
  const spreadsheet = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const { getToken } = useAuth();

  // Load external scripts & styles
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = XSPREAD_CSS;
    document.head.appendChild(link);

    const scriptXLSX = document.createElement("script");
    scriptXLSX.src = XLSX_URL;
    scriptXLSX.onload = () => {
      const scriptX = document.createElement("script");
      scriptX.src = XSPREAD_JS;
      scriptX.onload = () => { setLoaded(true); };
      document.body.appendChild(scriptX);
    };
    document.body.appendChild(scriptXLSX);

    const customStyle = document.createElement("style");
    customStyle.textContent = `
      .x-spreadsheet-sheet-list { position: sticky !important; bottom: 0 !important; z-index: 10 !important; background-color: #f5f5f5 !important; }
      .x-spreadsheet, .x-spreadsheet-sheet, .x-spreadsheet-overlayer { overflow: hidden !important; }
    `;
    document.head.appendChild(customStyle);
  }, []);

  function getSheetRef(spreadsheet, sheetName = "Sheet1") {
    const data = spreadsheet.getData();
    const sheet = Array.isArray(data) ? data.find(s => s.name === sheetName) : data;

    if (!sheet || !sheet.rows) return null;

    const rowKeys = Object.keys(sheet.rows).map(Number);
    if (!rowKeys.length) return null;

    let minRow = Infinity;
    let maxRow = -Infinity;
    let minCol = Infinity;
    let maxCol = -Infinity;

    rowKeys.forEach(r => {
      const row = sheet.rows[r];
      if (!row || !row.cells) return; // ✅ skip empty rows safely

      const cellCols = Object.keys(row.cells).map(Number);
      if (cellCols.length) {
        minRow = Math.min(minRow, r);
        maxRow = Math.max(maxRow, r);
        minCol = Math.min(minCol, ...cellCols);
        maxCol = Math.max(maxCol, ...cellCols);
      }
    });

    // ✅ if still no cells found
    if (minCol === Infinity || maxCol === -Infinity) return null;

    // Convert number to Excel letter
    const colToLetter = n => {
      let s = "";
      while (n >= 0) {
        s = String.fromCharCode((n % 26) + 65) + s;
        n = Math.floor(n / 26) - 1;
      }
      return s;
    };

    const startRef = `${colToLetter(minCol)}${minRow + 1}`;
    const endRef = `${colToLetter(maxCol)}${maxRow + 1}`;
    return `${startRef}:${endRef}`;
  }

  function convertSheetResponseToXData(data) {
    const { sheetsNames = [], sheetsData = {} } = data;

    return sheetsNames.map((sheetName) => {
      const sheet = sheetsData[sheetName] || {};
      const { data: cellData = {}, merge = [], ref, numRows, numCols } = sheet;
      const rows = {};

      // 🧩 Process all cell data
      for (const [cellAddr, cell] of Object.entries(cellData)) {
        const match = cellAddr.match(/([A-Z]+)([0-9]+)/);
        if (!match) continue;
        const [, colLetters, rowNumber] = match;

        const colIndex =
          colLetters.split("").reduce((acc, char) => acc * 26 + (char.charCodeAt(0) - 64), 0) - 1;
        const rowIndex = parseInt(rowNumber, 10) - 1;

        if (!rows[rowIndex]) rows[rowIndex] = { cells: {} };

        rows[rowIndex].cells[colIndex] = {
          text: String(cell.v ?? ""),
          tokens: cell.tokens || [],
        };
      }

      // 🧮 Convert merge objects → "C1:D1" style ranges
      const merges = Array.isArray(merge)
        ? merge.map((m) => {
          const startCol = String.fromCharCode(65 + (m.s?.c ?? 0));
          const endCol = String.fromCharCode(65 + (m.e?.c ?? 0));
          const startRow = (m.s?.r ?? 0) + 1;
          const endRow = (m.e?.r ?? 0) + 1;
          return `${startCol}${startRow}:${endCol}${endRow}`;
        })
        : [];

      // 🧱 Fill missing rows (optional)
      const totalRows = numRows ?? Math.max(Object.keys(rows).length, 20);
      for (let i = 0; i < totalRows; i++) {
        if (!rows[i]) rows[i] = { cells: {} };
      }

      return {
        name: sheetName,
        rows,
        merges, // 👈 plural “merges” — correct for x-data-spreadsheet
        ref,
      };
    });
  }

  // Initialize spreadsheet
  useEffect(() => {
    if (!loaded) return;

    async function initSheet() {
      if (!ref.current) return; // Add this line to ensure ref.current is not null
      try {
        const token = await getToken();
        const res = await fetch(NEXT_PUBLIC_CLERK_BACKEND_URL + "/user/sheet", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include", // important for HttpOnly cookies
        });

        const data = res.ok ? await res.json() : null;
        console.log("📝 Sheet data:", data);

        const s = window.x_spreadsheet(ref.current, {
          row: { len: 100, height: 25 },
          col: { len: 100, width: 100, indexWidth: 60 },
          showToolbar: true,
          showGrid: true,
          showContextmenu: true,
          mode: isMobile ? 'read' : 'write', // Disable editing for phone
          view: { height: () => ref.current ? ref.current.clientHeight : 0, width: () => ref.current ? ref.current.clientWidth : 0 },
        });

        if (data) s.loadData(convertSheetResponseToXData(data));
        else s.loadData([{ name: "Sheet1" }]);

        localStorage.setItem("spreadsheetData", JSON.stringify(s.getData()));

        spreadsheet.current = s;
        setSpreadsheetInstance(s);

        // Attach change listener immediately
        let changeTimeout = null;
        s.on("change", (newData) => {
          if (changeTimeout) clearTimeout(changeTimeout);
          changeTimeout = setTimeout(() => handleChange(newData, getToken), 500);
        });

        setSpreadsheetReady(true);

        // Expose insertRows function globally
        window.insertRowsToSpreadsheet = ({ sheetName, rows, startCell }) => insertRows(sheetName, rows, startCell);
        window.editCells = ({ sheetName, newValues, range }) => editCells(sheetName, newValues, range);
        window.loadDataObject = (data) => loadDataObject(data);
        window.loadData = (data) => loadData(data);
      } catch (err) {
        console.error("❌ Error loading sheet:", err);
        setSpreadsheetReady(true);
      }
    }

    initSheet();
  }, [loaded, getToken, setSpreadsheetInstance]);

  async function handleChange(data) {
    try {
      const token = await getToken(); // 🔑 Clerk auth token

      // 🧠 1. Load previous data
      const prevSheets = JSON.parse(localStorage.getItem("spreadsheetData")) || [];
      const prevSheet = Array.isArray(prevSheets) ? prevSheets[0] : prevSheets || null;
      const currentSheet = data;
      // const ref = getSheetRef(spreadsheet.current, data.name)

      // 🔤 Utility to convert cell ref like "C1" -> { c:2, r:0 }
      const parseCellRef = (ref) => {
        const col = ref.match(/[A-Z]+/)[0];
        const row = parseInt(ref.match(/[0-9]+/)[0], 10);
        const c = col.split("").reduce((r, ch) => r * 26 + (ch.charCodeAt(0) - 64), 0) - 1;
        return { c, r: row - 1 };
      };

      // 🔄 Convert merges ("A1:B2") → [{s:{},e:{}}]
      const normalizeMerges = (merges) => {
        if (!Array.isArray(merges)) return [];
        return merges.map((m) => {
          const [start, end] = m.split(":");
          return { s: parseCellRef(start), e: parseCellRef(end) };
        });
      };

      // 🧾 2. Compare cells
      const changes = {};
      const currRows = currentSheet.rows || {};
      const prevRows = prevSheet?.rows || {};

      for (const [rKey, currRow] of Object.entries(currRows)) {
        if (rKey === "len") continue;
        const prevRow = prevRows[rKey] || { cells: {} };

        for (const [cKey, currCell] of Object.entries(currRow.cells || {})) {
          const prevCell = prevRow.cells?.[cKey];
          const prevText = prevCell?.text || "";
          const currText = currCell?.text || "";

          if (prevText !== currText) {
            // Convert 0,1,2 → A,B,C etc.
            const colLetter = String.fromCharCode(65 + parseInt(cKey));
            const cellRef = `${colLetter}${parseInt(rKey) + 1}`;

            changes[cellRef] = {
              t: "s",
              v: currText,
              h: currText,
              w: currText,
              tokens: currCell.tokens || currText.split(" "),
            };
          }
        }
      }

      // 🔍 3. Compare merges — only if changed
      const prevMerges = normalizeMerges(prevSheet?.merges || []);
      const currMerges = normalizeMerges(currentSheet.merges || []);

      const mergesChanged =
        JSON.stringify(prevMerges) !== JSON.stringify(currMerges);

      // 🧩 4. Build diff object (only include what changed)
      const diffResult = {};
      if (Object.keys(changes).length > 0) diffResult.changes = changes;
      if (mergesChanged && currMerges.length > 0) diffResult.merge = currMerges;

      // 💾 5. Save current sheet
      localStorage.setItem("spreadsheetData", JSON.stringify([currentSheet]));

      // 🪶 6. Log & return
      console.log("🧩 Diff Result:", diffResult);
      // 🚀 Send changes to backend
      if (Object.keys(diffResult).length > 0) {
        await fetch(NEXT_PUBLIC_CLERK_BACKEND_URL + "/user/changes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(diffResult),
          credentials: "include", // important for HttpOnly cookies
        });
      }


      return diffResult;

    } catch (err) {
      console.error("❌ Error in handleChange:", err);
      return {};
    }
  }

  // loadDataObject function
  function loadDataObject(data) {
    if (!spreadsheet.current) return console.error("Spreadsheet instance not available");
    spreadsheet.current.loadData(convertSheetResponseToXData(data));
  }

  function loadData(data) {
    if (!spreadsheet.current) return console.error("Spreadsheet instance not available");
    spreadsheet.current.loadData(data);
  }

  // Insert rows function
  function insertRows(sheetName, rows, startCell) {
    try {
      if (!sheetName || !rows || !rows.length) return console.error("Sheet name and rows are required");

      const sheets = spreadsheet.current.getData();
      const targetSheet = sheets.find((s) => s.name === sheetName);
      if (!targetSheet) return console.error(`❌ Sheet "${sheetName}" not found`);

      const sheetData = targetSheet.rows || {};

      const colToNum = (col) => col.split("").reduce((acc, char) => acc * 26 + (char.charCodeAt(0) - 64), 0);

      let startCol = "A";
      let startRow = 1;

      if (startCell && /^[A-Z]+[0-9]+$/.test(startCell)) {
        const [, col, row] = startCell.match(/^([A-Z]+)(\d+)$/);
        startCol = col;
        startRow = parseInt(row);
      } else {
        const existingRows = Object.keys(sheetData).filter((k) => !isNaN(k)).map(Number);
        startRow = existingRows.length ? Math.max(...existingRows) + 2 : 1;
      }

      const startC = colToNum(startCol);

      rows.forEach((rowArr, i) => {
        const rowIndex = startRow + i - 1;
        rowArr.forEach((val, j) => {
          const colIndex = startC + j - 1;
          spreadsheet.current.cellText(rowIndex, colIndex, String(val ?? ""));
        });
      });

      spreadsheet.current.render();

      console.log(`✅ Inserted ${rows.length} row(s) into "${sheetName}" starting at ${startCol}${startRow}`);
    } catch (err) {
      console.error("❌ Failed to insert rows:", err);
    }
  }

  // Edit cells function
  function editCells(sheetName, newValues, range) {
    try {
      if (!sheetName || !newValues || !range)
        return console.error("Sheet name, range, and newValues are required");

      const sheets = spreadsheet.current.getData();
      const targetSheet = sheets.find((s) => s.name === sheetName);
      if (!targetSheet)
        return console.error(`❌ Sheet "${sheetName}" not found`);

      const sheetData = targetSheet.rows || {};

      // Convert column letter(s) to number
      const colToNum = (col) =>
        col.split("").reduce((acc, char) => acc * 26 + (char.charCodeAt(0) - 64), 0);

      // Parse range (e.g., "B2:D4")
      const match = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
      if (!match)
        return console.error("Invalid range format. Use format like 'B2:D4'");

      const [, startColLetter, startRowStr, endColLetter, endRowStr] = match;
      const startCol = colToNum(startColLetter);
      const endCol = colToNum(endColLetter);
      const startRow = parseInt(startRowStr);
      const endRow = parseInt(endRowStr);

      // Update cells
      newValues.forEach((rowArr, i) => {
        rowArr.forEach((val, j) => {
          const rowIndex = startRow + i - 1;
          const colIndex = startCol + j - 1;

          // Only update within range
          if (rowIndex <= endRow && colIndex <= endCol) {
            spreadsheet.current.cellText(rowIndex, colIndex, String(val ?? ""));
          }
        });
      });

      // 👇 Force UI refresh after all edits
      if (spreadsheet.current && typeof spreadsheet.current.reRender === "function") {
        spreadsheet.current.reRender();
      } else {
        spreadsheet.current.reloadData();
      }

      console.log(`✅ Edited cells in "${sheetName}" for range ${range} and re-rendered`);
    } catch (err) {
      console.error("❌ Failed to edit cells:", err);
    }
  }


  return <div ref={ref} style={{ width: "100%", height: "100%", overflow: "hidden" }} />;
}

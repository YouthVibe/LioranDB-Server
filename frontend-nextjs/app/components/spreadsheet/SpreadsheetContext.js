"use client";
import {
  createContext,
  useContext,
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  useReducer,
  useCallback,
  useTransition,
  useEffect
} from "react";
import * as XLSX from "xlsx-js-style";
import { useAuth } from "../../utils/useAuth"

// 🧩 Create Context
const SpreadsheetContext = createContext();

export const SpreadsheetProvider = forwardRef(function SpreadsheetProvider(
  { children },
  ref
) {
  // 🧠 State
  // const [cells, setCells] = useReducer(cellsReducer, new Map());
  // const [cellStyles, setCellStyles] = useState(new Map());
  const { getToken } = useAuth();
  const [isPending, startTransition] = useTransition();
  const cellRefs = useRef(new Map());
  const [selectedCells, setSelectedCells] = useState([{ row: 1, col: "A" }]);
  // Each sheet stores its own cells + styles
  // ──────────────────────────────────────────────────────
  // 1. HISTORY STATE
  // ──────────────────────────────────────────────────────
  const HISTORY_LIMIT = 50;                     // max undo steps
  const [history, setHistory] = useState([]); // [{cells, styles}]
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [sheets, setSheets] = useState({
    Sheet1: {
      cells: new Map(),
      styles: new Map(),
    },
  });

  const [activeSheet, setActiveSheet] = useState("Sheet1");
  const currentSheet = sheets[activeSheet];

  const cells = currentSheet?.cells || new Map();
  const cellStyles = currentSheet?.styles || new Map();

  const syncChangeToBackend = async (address, cellObject) => {
    try {
      const token = await getToken();
      if (!token) {
        console.error("❌ No token found");
        return;
      }
  
      // Backend expects this shape
      const body = {
        changes: {
          [address]: cellObject, // full object (v, t, s)
        },
        merge: undefined,
        ref: undefined,
      };
  
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/changes`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Clerk auth
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.error("❌ Sync failed:", error);
    }
  };
  

  const setCells = (action) => {
    setSheets((prev) => {
      const current = prev[activeSheet];

      const updatedCells = cellsReducer(current.cells, action);

      const address = `${action.col}${action.row}`;
      const fullCellData = action.value || null;

      // 🔥 EXACT SYNC — send full cell object
      syncChangeToBackend(address, fullCellData, activeSheet);

      return {
        ...prev,
        [activeSheet]: {
          ...current,
          cells: updatedCells,
        },
      };
    });
  };


  const setCellStyles = (updater) => {
    setSheets((prev) => {
      const newSheets = { ...prev };
      const oldStyles = new Map(newSheets[activeSheet].styles);
      const newStyles =
        typeof updater === "function" ? updater(oldStyles) : new Map(updater);
      newSheets[activeSheet] = { ...newSheets[activeSheet], styles: newStyles };
      return newSheets;
    });
  };

  // ➕ Add a new sheet
  const addSheet = useCallback((name) => {
    setSheets((prev) => {
      if (prev[name]) return prev; // already exists
      return {
        ...prev,
        [name]: { cells: new Map(), styles: new Map() },
      };
    });
    setActiveSheet(name);
    console.log(`🆕 Added new sheet: ${name}`);
  }, []);

  // 🗑️ Delete a sheet
  const deleteSheet = useCallback((name) => {
    setSheets((prev) => {
      const newSheets = { ...prev };
      delete newSheets[name];
      const remaining = Object.keys(newSheets);
      setActiveSheet(remaining[0] || null);
      return newSheets;
    });
    console.log(`🗑️ Deleted sheet: ${name}`);
  }, []);

  // 🏷️ Rename a sheet
  const renameSheet = useCallback((oldName, newName) => {
    setSheets((prev) => {
      if (!prev[oldName] || prev[newName]) return prev;
      const newSheets = { ...prev };
      newSheets[newName] = newSheets[oldName];
      delete newSheets[oldName];
      return newSheets;
    });
    if (activeSheet === oldName) setActiveSheet(newName);
    console.log(`✏️ Renamed sheet: ${oldName} → ${newName}`);
  }, [activeSheet]);


  // ✅ Helper to select single cell
  const selectCell = useCallback((col, row) => {
    setSelectedCells([{ col, row }]);
  }, []);

  // ✅ Helper to select range (fixes column/row/full selection issue)
  const selectRange = useCallback((start, end) => {
    const cellsInRange = [];
    const startCol = start.col.charCodeAt(0);
    const endCol = end.col.charCodeAt(0);

    for (let r = start.row; r <= end.row; r++) {
      for (let c = startCol; c <= endCol; c++) {
        cellsInRange.push({ row: r, col: String.fromCharCode(c) });
      }
    }

    setSelectedCells(cellsInRange);
  }, []);

  // 🔑 Helpers
  const getCellKey = useCallback((col, row) => `${col}${row}`, []);

  // ⚙️ Reducer
  function cellsReducer(state, action) {
    switch (action.type) {
      case "SET_CELL": {
        const key = `${action.col}${action.row}`;
        const newMap = new Map(state);
        newMap.set(key, action.value);
        return newMap;
      }

      case "BULK_UPDATE": {
        const newMap = new Map(state);
        for (const [key, value] of action.payload.entries()) {
          newMap.set(key, value);
        }
        return newMap;
      }

      case "REPLACE_ALL_CELLS":
        return new Map(action.payload);

      default:
        return state;
    }
  }

  // 🧾 Cell Getters/Setters
  const getCell = useCallback(
    (col, row) => cells.get(getCellKey(col, row)) || "",
    [cells, getCellKey]
  );

  // 🎨 Apply Styles
  const applyStyle = useCallback((col, row, styleKey, value) => {
    const key = getCellKey(col, row);
    setCellStyles((prev) => {
      const newMap = new Map(prev);
      const existingStyle = newMap.get(key) || {};
      newMap.set(key, { ...existingStyle, [styleKey]: value });
      return newMap;
    });
  }, [getCellKey]);

  // 🔁 Rerender Helpers
  const rerenderCells = useCallback((cellKeys = []) => {
    for (const key of cellKeys) {
      const cell = cellRefs.current.get(key);
      if (cell?.refresh) cell.refresh();
    }
  }, []);

  const rerenderAllCells = useCallback(() => {
    const allCellKeys = Array.from(cellRefs.current.keys());
    for (const key of allCellKeys) {
      const cell = cellRefs.current.get(key);
      if (cell?.refresh) cell.refresh();
    }
    console.log(`🔁 Sheet re-rendered: ${allCellKeys.length} cells refreshed`);
  }, []);

  // 📘 Workbook Loading (async + non-blocking)
  const loadWorkbook = useCallback(async (workbook) => {
    if (!workbook || !workbook.SheetNames?.length) return;

    console.time("WorkbookLoad");
    const newSheets = {};

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const newMap = new Map();

      json.forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
          const colLetter = String.fromCharCode(65 + colIndex);
          const key = `${colLetter}${rowIndex + 1}`;
          newMap.set(key, value);
        });
      });

      newSheets[sheetName] = {
        cells: newMap,
        styles: new Map(), // XLSX-js-style could later restore style info
      };

      console.log(`📄 Loaded sheet: ${sheetName} (${newMap.size} cells)`);
    }

    // ✅ Replace all existing sheets synchronously
    setSheets(newSheets);
    setActiveSheet(workbook.SheetNames[0]);

    // ✅ Re-render visible cells when browser is idle
    requestIdleCallback(() => rerenderAllCells());

    console.timeEnd("WorkbookLoad");
    console.log(`📥 Loaded workbook with ${workbook.SheetNames.length} sheets`);
  }, [rerenderAllCells]);

  // 📤 Export Workbook
  const exportWorkbook = useCallback(() => {
    const wb = XLSX.utils.book_new();

    for (const [sheetName, { cells }] of Object.entries(sheets)) {
      const cellEntries = Array.from(cells.entries());
      let ws;

      if (cellEntries.length === 0) {
        // Insert default A1 cell
        ws = XLSX.utils.aoa_to_sheet([[""]]);
        console.log(`📤 Exported EMPTY sheet: ${sheetName} (default A1 created)`);
      } else {
        const data = [];

        for (const [key, value] of cellEntries) {
          const match = key.match(/^([A-Z]+)(\d+)$/);
          if (!match) continue;

          const [, col, row] = match;
          const rowIndex = parseInt(row, 10) - 1;
          const colIndex =
            col.split("").reduce((acc, char) => acc * 26 + (char.charCodeAt(0) - 64), 0) - 1;

          if (!data[rowIndex]) data[rowIndex] = [];
          data[rowIndex][colIndex] = value ?? "";
        }

        ws = XLSX.utils.aoa_to_sheet(data);
      }

      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }

    console.log(`📤 Exported workbook with ${Object.keys(sheets).length} sheets`);
    return wb;
  }, [sheets]);

  // 💾 Save Workbook
  const saveWorkbook = useCallback(
    (filename = "spreadsheet.xlsx") => {
      try {
        // Optional: If any cell is editing, force a global rerender/save (but with onBlur, unlikely needed)
        rerenderAllCells(); // Ensures any pending local changes are reflected (rare)
        const wb = exportWorkbook();
        XLSX.writeFile(wb, filename); // Uncomment to actually save
        // console.log("WB", wb);
        console.log(`✅ Saved multi-sheet workbook as ${filename}`);
      } catch (error) {
        console.error("❌ Error saving workbook:", error);
      }
    },
    [exportWorkbook, rerenderAllCells]
  );

  const newBlankSheet = useCallback((rows = 20, cols = 10) => {
    const newMap = new Map();

    for (let r = 1; r <= rows; r++) {
      for (let c = 0; c < cols; c++) {
        const colLetter = String.fromCharCode(65 + c); // A, B, C...
        const key = `${colLetter}${r}`;
        newMap.set(key, ""); // empty cell
      }
    }

    // Replace all existing cells with blank ones
    startTransition(() => {
      setCells({
        type: "REPLACE_ALL_CELLS",
        payload: newMap,
      });
    });

    // Clear all styles
    setCellStyles(new Map());

    // Re-render visible cells only when browser is idle
    requestIdleCallback(() => rerenderAllCells());

    console.log(`🆕 Created new blank sheet: ${rows}x${cols}`);
  }, [setCells, rerenderAllCells]);

  // Insert row at index (1-based), shift others down
  const insertRow = useCallback((rowIndex, position = "below") => {
    const newMap = new Map();
    const shift = position === "below" ? 0 : -1;

    // Iterate over existing cells
    for (const [key, value] of cells.entries()) {
      const match = key.match(/^([A-Z]+)(\d+)$/);
      if (!match) continue;
      const [_, col, row] = match;
      const r = parseInt(row, 10);
      let newRow = r;
      if (r > rowIndex) newRow = r + 1; // shift row down
      else if (r === rowIndex && position === "above") newRow = r + 1;
      newMap.set(`${col}${newRow}`, value);
    }

    // Add empty cells for the new row
    const colCount = Math.max(...Array.from(cells.keys()).map(k => k.charCodeAt(0) - 64));
    for (let c = 0; c < colCount; c++) {
      const colLetter = String.fromCharCode(65 + c);
      newMap.set(`${colLetter}${rowIndex + (position === "below" ? 1 : 0)}`, "");
    }

    setCells({ type: "REPLACE_ALL_CELLS", payload: newMap });
    requestIdleCallback(() => rerenderAllCells());
    console.log(`🆕 Inserted row at ${rowIndex} (${position})`);
  }, [cells, setCells, rerenderAllCells]);

  const insertColumn = useCallback((col, position = "right") => {
    const newMap = new Map();
    const colCode = col.charCodeAt(0);

    for (const [key, value] of cells.entries()) {
      const match = key.match(/^([A-Z]+)(\d+)$/);
      if (!match) continue;
      const [_, c, row] = match;
      let newColCode = c.charCodeAt(0);
      if (newColCode > colCode || (newColCode === colCode && position === "right")) newColCode += 1;
      newMap.set(`${String.fromCharCode(newColCode)}${row}`, value);
    }

    // Fill new column with empty cells
    const rowCount = Math.max(...Array.from(cells.keys()).map(k => parseInt(k.match(/\d+$/)[0])));
    const newColLetter = String.fromCharCode(colCode + (position === "right" ? 1 : 0));
    for (let r = 1; r <= rowCount; r++) {
      newMap.set(`${newColLetter}${r}`, "");
    }

    setCells({ type: "REPLACE_ALL_CELLS", payload: newMap });
    requestIdleCallback(() => rerenderAllCells());
    console.log(`🆕 Inserted column ${newColLetter} (${position})`);
  }, [cells, setCells, rerenderAllCells]);

  const deleteRow = useCallback((rowIndex) => {
    const newMap = new Map();
    for (const [key, value] of cells.entries()) {
      const match = key.match(/^([A-Z]+)(\d+)$/);
      if (!match) continue;
      const [_, col, row] = match;
      const r = parseInt(row, 10);
      if (r === rowIndex) continue; // skip deleted row
      const newRow = r > rowIndex ? r - 1 : r; // shift rows up
      newMap.set(`${col}${newRow}`, value);
    }

    setCells({ type: "REPLACE_ALL_CELLS", payload: newMap });
    requestIdleCallback(() => rerenderAllCells());
    console.log(`❌ Deleted row ${rowIndex}`);
  }, [cells, setCells, rerenderAllCells]);

  const deleteColumn = useCallback((col) => {
    const colCode = col.charCodeAt(0);
    const newMap = new Map();

    for (const [key, value] of cells.entries()) {
      const match = key.match(/^([A-Z]+)(\d+)$/);
      if (!match) continue;
      const [_, c, row] = match;
      const cCode = c.charCodeAt(0);
      if (cCode === colCode) continue; // skip deleted column
      const newColCode = cCode > colCode ? cCode - 1 : cCode; // shift left
      newMap.set(`${String.fromCharCode(newColCode)}${row}`, value);
    }

    setCells({ type: "REPLACE_ALL_CELLS", payload: newMap });
    requestIdleCallback(() => rerenderAllCells());
    console.log(`❌ Deleted column ${col}`);
  }, [cells, setCells, rerenderAllCells]);

  // ──────────────────────────────────────────────────────
  // 2. PUSH SNAPSHOT (used by every mutating function)
  // ──────────────────────────────────────────────────────
  const pushSnapshot = useCallback(() => {
    setSheets((prev) => {
      const cur = prev[activeSheet];
      const snapshot = {
        cells: new Map(cur.cells),
        styles: new Map(cur.styles),
      };

      setHistory((h) => {
        // truncate future (redo) when we branch
        const trimmed = h.slice(0, historyIndex + 1);
        const next = [...trimmed, snapshot];
        if (next.length > HISTORY_LIMIT) next.shift();
        return next;
      });
      setHistoryIndex((i) => i + 1);
      return prev;
    });
  }, [activeSheet, historyIndex]);

  // ──────────────────────────────────────────────────────
  // 3. UNDO / REDO
  // ──────────────────────────────────────────────────────
  const undo = useCallback(() => {
    if (historyIndex < 0) return;
    const snapshot = history[historyIndex];
    setSheets((prev) => ({
      ...prev,
      [activeSheet]: {
        cells: new Map(snapshot.cells),
        styles: new Map(snapshot.styles),
      },
    }));
    setHistoryIndex((i) => i - 1);
    requestIdleCallback(() => rerenderAllCells());
  }, [activeSheet, history, historyIndex, rerenderAllCells]);

  const redo = useCallback(() => {
    if (historyIndex + 1 >= history.length) return;
    const snapshot = history[historyIndex + 1];
    setSheets((prev) => ({
      ...prev,
      [activeSheet]: {
        cells: new Map(snapshot.cells),
        styles: new Map(snapshot.styles),
      },
    }));
    setHistoryIndex((i) => i + 1);
    requestIdleCallback(() => rerenderAllCells());
  }, [activeSheet, history, historyIndex, rerenderAllCells]);

  // ──────────────────────────────────────────────────────
  // 4. CLIPBOARD (in-memory)
  // ──────────────────────────────────────────────────────
  const clipboardRef = useRef({ cells: new Map(), styles: new Map() });
  // ──────────────────────────────────────────────────────
  // 5. copyCells
  // ──────────────────────────────────────────────────────
  const copyCells = useCallback((positions) => {
    const cellsMap = new Map();
    const stylesMap = new Map();

    positions.forEach(([row, col]) => {
      const key = `${col}${row}`;
      const value = cells.get(key);
      if (value !== undefined) cellsMap.set(key, value);

      const style = cellStyles.get(key);
      if (style) stylesMap.set(key, { ...style });
    });

    clipboardRef.current = { cells: cellsMap, styles: stylesMap };
    console.log(`Copied ${cellsMap.size} cells`);
  }, [cells, cellStyles]);
  // ──────────────────────────────────────────────────────
  // 6. pasteCells (paste at top-left corner)
  // ──────────────────────────────────────────────────────
  const pasteCells = useCallback((startRow, startCol) => {
    const { cells: srcCells, styles: srcStyles } = clipboardRef.current;
    if (srcCells.size === 0) return;

    pushSnapshot(); // ← history

    // Find source bounds
    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    for (const k of srcCells.keys()) {
      const [, rStr, cStr] = k.match(/^([A-Z]+)(\d+)$/);
      const r = Number(rStr), c = cStr.charCodeAt(0);
      minR = Math.min(minR, r); maxR = Math.max(maxR, r);
      minC = Math.min(minC, c); maxC = Math.max(maxC, c);
    }
    const height = maxR - minR + 1;
    const width = maxC - minC + 1;

    // Destination offset
    const rowOffset = startRow - minR;
    const colOffset = startCol.charCodeAt(0) - minC;

    const updates = new Map();

    srcCells.forEach((value, key) => {
      const [, colLetter, rowStr] = key.match(/^([A-Z]+)(\d+)$/);
      const srcRow = Number(rowStr);
      const srcColCode = colLetter.charCodeAt(0);

      const dstRow = srcRow + rowOffset;
      const dstColCode = srcColCode + colOffset;
      const dstColLetter = String.fromCharCode(dstColCode);
      const dstKey = `${dstColLetter}${dstRow}`;

      updates.set(dstKey, value);
    });

    // Bulk-update cells
    setCells({ type: "BULK_UPDATE", payload: updates });

    // ---- styles ----
    const styleUpdates = new Map();
    srcStyles.forEach((style, key) => {
      const [, colLetter, rowStr] = key.match(/^([A-Z]+)(\d+)$/);
      const srcRow = Number(rowStr);
      const srcColCode = colLetter.charCodeAt(0);

      const dstRow = srcRow + rowOffset;
      const dstColCode = srcColCode + colOffset;
      const dstColLetter = String.fromCharCode(dstColCode);
      const dstKey = `${dstColLetter}${dstRow}`;

      styleUpdates.set(dstKey, style);
    });

    setCellStyles((prev) => {
      const next = new Map(prev);
      styleUpdates.forEach((st, k) => next.set(k, { ...next.get(k), ...st }));
      return next;
    });

    requestIdleCallback(() => rerenderAllCells());
  }, [pushSnapshot, setCells, setCellStyles, rerenderAllCells]);
  // ──────────────────────────────────────────────────────
  // 7. moveCells (copy then clear source)
  // ──────────────────────────────────────────────────────
  const moveCells = useCallback((startRow, startCol) => {
    // 1. copy
    const src = clipboardRef.current;
    if (src.cells.size === 0) return;

    pushSnapshot();

    // 2. paste (reuse paste logic)
    pasteCells(startRow, startCol);

    // 3. clear source cells
    const clearKeys = Array.from(src.cells.keys());
    const emptyUpdates = new Map();
    clearKeys.forEach((k) => emptyUpdates.set(k, ""));

    setCells({ type: "BULK_UPDATE", payload: emptyUpdates });

    // also clear source styles
    setCellStyles((prev) => {
      const next = new Map(prev);
      clearKeys.forEach((k) => next.delete(k));
      return next;
    });

    // reset clipboard (optional)
    clipboardRef.current = { cells: new Map(), styles: new Map() };

    requestIdleCallback(() => rerenderAllCells());
  }, [pasteCells, pushSnapshot, setCells, setCellStyles, rerenderAllCells]);

  const setCell = useCallback((col, row, value) => {
    pushSnapshot(); // Add history before mutating
    setCells({ type: "SET_CELL", col, row, value });
    rerenderCells([`${col}${row}`]);
  }, [pushSnapshot]);
  useEffect(() => {
    // Expose spreadsheet API to window
    window.insertRow = insertRow;
    window.insertColumn = insertColumn;

    window.deleteSheet = deleteSheet;

    window.undo = undo;
    window.redo = redo;

    window.exportWorkbook = exportWorkbook;

    window.getWorkbook = () => workbook;
    window.getActiveSheet = () => activeSheet;
    window.getSheetNames = () => sheetNames;
    window.saveWorkbook = () => saveWorkbook();

    return () => {
      // Cleanup on unmount
      delete window.insertRow;
      delete window.insertColumn;

      delete window.deleteSheet;

      delete window.undo;
      delete window.redo;

      delete window.exportWorkbook;

      delete window.getWorkbook;
      delete window.getActiveSheet;
      delete window.getSheetNames;
    };
  }, [
    activeSheet,
    insertRow,
    insertColumn,
    deleteSheet,
    undo,
    redo,
    exportWorkbook,
    saveWorkbook
  ]);

  // 🧠 Expose all through ref
  useImperativeHandle(ref, () => ({
    loadWorkbook,
    saveWorkbook,
    exportWorkbook,
    getCell,
    setCell,
    applyStyle,
    rerenderAllCells,
    cells,
    cellStyles,
    addSheet,
    deleteSheet,
    renameSheet,
    setActiveSheet,
    copyCells,
    pasteCells,
    moveCells,
    undo,
    redo,
  }));

  // 🌐 Provider
  return (
    <SpreadsheetContext.Provider
      value={{
        sheets,
        activeSheet,
        setActiveSheet,
        addSheet,
        deleteSheet,
        renameSheet,
        cells,
        setCells,
        cellStyles,
        setCellStyles,
        selectCell,
        selectRange,
        applyStyle,
        newBlankSheet,
        cellRefs,
        isPending,
        selectedCells,
        setSelectedCells,
        selectCell,
        selectRange,
        insertRow,
        insertColumn,
        deleteRow,
        deleteColumn,
        copyCells,
        pasteCells,
        moveCells,
        undo,
        redo,
        exportWorkbook,
      }}
    >
      {children}
    </SpreadsheetContext.Provider>
  );
});

// 🪄 Hook
export const useSpreadsheet = () => useContext(SpreadsheetContext);

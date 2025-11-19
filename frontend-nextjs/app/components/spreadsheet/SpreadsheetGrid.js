"use client";
import SpreadsheetCell from "./SpreadsheetCell";
import { useSpreadsheet } from "./SpreadsheetContext";
import { useEffect, useState, useMemo } from "react";
import { Virtuoso } from "react-virtuoso";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";

function colToNumber(col) {
  return col.split('').reduce((acc, c) => acc * 26 + (c.charCodeAt(0) - 64), 0);
}

function numberToCol(num) {
  let col = '';
  while (num > 0) {
    const mod = (num - 1) % 26;
    col = String.fromCharCode(65 + mod) + col;
    num = Math.floor((num - 1) / 26);
  }
  return col;
}

export default function SpreadsheetGrid({
  width = "100%",
  height = "calc(100vh - 225px)",
}) {
  const {
    selectedCells,
    setSelectedCells,
    selectCell,
    selectRange,
    cellRefs,
    insertRow,
    insertColumn,
    deleteRow,
    deleteColumn,
    cells,
    copyCells,
    pasteCells,
    moveCells,
    setCells,
    setCellStyles,
    exportWorkbook,
  } = useSpreadsheet();

  const gridDimensions = useMemo(() => {
    let maxRow = 0;
    let maxCol = 0;
    for (const key of cells.keys()) {
      const match = key.match(/^([A-Z]+)(\d+)$/);
      if (match) {
        const colNum = colToNumber(match[1]);
        const row = parseInt(match[2], 10);
        maxRow = Math.max(maxRow, row);
        maxCol = Math.max(maxCol, colNum);
      }
    }
    maxCol = Math.max(maxCol, 10); // Minimum 10 columns
    const colLetters = [];
    for (let i = 1; i <= maxCol; i++) {
      colLetters.push(numberToCol(i));
    }
    return { maxRow, colLetters };
  }, [cells]);

  const { maxRow, colLetters } = gridDimensions;
  const totalRows = Math.max(maxRow, 20); // Minimum 20 rows

  const [colWidths, setColWidths] = useState(() => Array(colLetters.length).fill(120));
  const [rowHeights, setRowHeights] = useState(() => Array(totalRows).fill(30));

  useEffect(() => {
    setColWidths((prev) => {
      const newLen = colLetters.length;
      if (prev.length === newLen) return prev;
      const newWidths = Array(newLen).fill(120);
      const minLen = Math.min(prev.length, newLen);
      for (let i = 0; i < minLen; i++) {
        newWidths[i] = prev[i];
      }
      return newWidths;
    });

    setRowHeights((prev) => {
      const newLen = totalRows;
      if (prev.length === newLen) return prev;
      const newHeights = Array(newLen).fill(30);
      const minLen = Math.min(prev.length, newLen);
      for (let i = 0; i < minLen; i++) {
        newHeights[i] = prev[i];
      }
      return newHeights;
    });
  }, [colLetters, totalRows]);

  // --- Column resize
  const startColResize = (colIndex, e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = colWidths[colIndex];

    const onMouseMove = (me) => {
      const diff = me.clientX - startX;
      setColWidths((prev) =>
        prev.map((w, i) =>
          i === colIndex ? Math.max(60, startWidth + diff) : w
        )
      );
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // --- Row resize
  const startRowResize = (rowIndex, e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = rowHeights[rowIndex];

    const onMouseMove = (me) => {
      const diff = me.clientY - startY;
      setRowHeights((prev) =>
        prev.map((h, i) =>
          i === rowIndex ? Math.max(20, startHeight + diff) : h
        )
      );
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // --- Enter key → move down
  // useEffect(() => {
  //   const handleKeyDown = (e) => {
  //     if (e.key === "Enter") {
  //       e.preventDefault();
  //       setSelectedCells((prev) => {
  //         if (prev.length === 0) return prev;
  //         const lastCell = prev[prev.length - 1];
  //         const next = { col: lastCell.col, row: lastCell.row + 1 };
  //         cellRefs.current[`${next.col}${next.row}`]?.focus();
  //         return [next];
  //       });
  //     }
  //   };

  //   window.addEventListener("keydown", handleKeyDown);
  //   return () => window.removeEventListener("keydown", handleKeyDown);
  // }, [setSelectedCells, cellRefs]);

  // --- Multi-cell selection (drag)
  const [isSelecting, setIsSelecting] = useState(false);
  const [startCell, setStartCell] = useState(null);

  const handleMouseDown = (col, row, e) => {
    const cell = { col, row };

    if (e.shiftKey && selectedCells.length > 0) {
      const last = selectedCells[selectedCells.length - 1];
      selectRange(last, cell);
    } else if (e.ctrlKey || e.metaKey) {
      setSelectedCells((prev) => {
        const exists = prev.some((c) => c.col === col && c.row === row);
        if (exists) {
          return prev.filter((c) => !(c.col === col && c.row === row));
        } else {
          return [...prev, cell];
        }
      });
    } else {
      selectCell(col, row);
    }

    setStartCell(cell);
    setIsSelecting(true);
  };

  const handleMouseEnter = (col, row) => {
    if (isSelecting && startCell) {
      selectRange(startCell, { col, row });
    }
  };

  useEffect(() => {
    const handleMouseUp = () => setIsSelecting(false);
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  // --- Header selection
  const handleColHeaderClick = (col) => {
    const start = { col, row: 1 };
    const end = { col, row: totalRows };
    selectRange(start, end);
  };

  const handleRowHeaderClick = (row) => {
    const start = { col: colLetters[0], row };
    const end = { col: colLetters[colLetters.length - 1], row };
    selectRange(start, end);
  };

  const handleCornerClick = () => {
    const start = { col: colLetters[0], row: 1 };
    const end = { col: colLetters[colLetters.length - 1], row: totalRows };
    selectRange(start, end);
  };

  // --- Helper: selected → [[row, col]]
  const getSelectedPositions = () => {
    return selectedCells.map(c => [c.row, c.col]);
  };

  // --- Cut (copy + clear source)
  const cutSelection = () => {
    copyCells(getSelectedPositions());
    const updates = new Map();
    const styleDeletes = new Set();
    selectedCells.forEach(c => {
      const key = `${c.col}${c.row}`;
      updates.set(key, "");
      styleDeletes.add(key);
    });
    setCells({ type: "BULK_UPDATE", payload: updates });
    setCellStyles(prev => {
      const next = new Map(prev);
      styleDeletes.forEach(k => next.delete(k));
      return next;
    });
  };

  // --- Keyboard shortcuts (Ctrl+C, V, X)
  useEffect(() => {
    const handler = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (selectedCells.length === 0) return;

      const target = selectedCells[0]; // top-left of selection

      if (e.key === "c") {
        e.preventDefault();
        copyCells(getSelectedPositions());
      } else if (e.key === "v") {
        e.preventDefault();
        pasteCells(target.row, target.col);
      } else if (e.key === "x") {
        e.preventDefault();
        cutSelection();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedCells, copyCells, pasteCells, cutSelection]);

  return (
    <div
      className="overflow-auto border-slate-800 bg-slate-950 spreadsheet-scrollbar"
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
    >
      {/* <div className="min-w-max">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            console.log("Exporting workbook...", exportWorkbook());
          }}
          className="mb-2"
        >
          Test
        </Button>
      </div> */}
      <div className="min-w-max">
        <table className="border-collapse select-none w-full">
          <thead>
            <tr>
              {/* Corner */}
              <th
                className="w-10 h-8 bg-slate-950 border border-slate-800 cursor-pointer active:bg-blue-500/40 relative"
                onClick={handleCornerClick}
              >
                {/* <ContextMenu>
                  <ContextMenuTrigger className="w-full h-full" />
                  <ContextMenuContent>
                    <ContextMenuItem onSelect={() => copyCells(getSelectedPositions())}>
                      Copy All
                    </ContextMenuItem>
                    <ContextMenuItem onSelect={() => pasteCells(1, colLetters[0])}>
                      Paste All
                    </ContextMenuItem>
                    <ContextMenuItem onSelect={cutSelection}>
                      Cut All
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu> */}
              </th>

              {/* Column Headers */}
              {colLetters.map((col, i) => (
                <th
                  key={col}
                  style={{ width: colWidths[i] }}
                  onClick={() => handleColHeaderClick(col)}
                  className="relative text-center text-sm font-semibold bg-slate-950 border border-slate-800 text-gray-300 cursor-pointer active:bg-blue-500/60 transition-colors duration-100"
                >
                  <ContextMenu>
                    <ContextMenuTrigger className="w-full h-full flex items-center justify-center">
                      {col}
                    </ContextMenuTrigger>
                    <ContextMenuContent className="bg-slate-300 text-slate-900">
                      {/* <ContextMenuItem onSelect={() => copyCells(getSelectedPositions())}>
                        Copy Column
                      </ContextMenuItem>
                      <ContextMenuItem onSelect={() => pasteCells(1, col)}>
                        Paste Column
                      </ContextMenuItem>
                      <ContextMenuItem onSelect={cutSelection}>
                        Cut Column
                      </ContextMenuItem> */}
                      <ContextMenuItem onSelect={() => insertColumn(col, "left")}>
                        Insert Left
                      </ContextMenuItem>
                      <ContextMenuItem onSelect={() => insertColumn(col, "right")}>
                        Insert Right
                      </ContextMenuItem>
                      <ContextMenuItem onSelect={() => deleteColumn(col)}>
                        Delete Column
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>

                  <div
                    onMouseDown={(e) => startColResize(i, e)}
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500/40"
                  />
                </th>
              ))}
            </tr>
          </thead>
        </table>

        {/* Virtualized Rows */}
        <Virtuoso
          style={{ height: `calc(${height} - 40px)` }}
          totalCount={totalRows}
          itemContent={(rowIndex) => (
            <table
              className="border-collapse select-none w-full"
              style={{ tableLayout: "fixed" }}
            >
              <tbody>
                <tr style={{ height: rowHeights[rowIndex] }}>
                  {/* Row Header */}
                  <th
                    className="w-10 text-center bg-slate-950 border border-slate-800 text-gray-400 font-medium relative cursor-pointer active:bg-blue-500/40"
                    onClick={() => handleRowHeaderClick(rowIndex + 1)}
                  >
                    <ContextMenu>
                      <ContextMenuTrigger className="w-full h-full flex items-center justify-center relative">
                        {rowIndex + 1}
                        <div
                          onMouseDown={(e) => startRowResize(rowIndex, e)}
                          className="absolute bottom-0 left-0 w-full h-1 cursor-row-resize hover:bg-blue-500/40"
                        />
                      </ContextMenuTrigger>
                      <ContextMenuContent className="bg-slate-300 text-slate-900">
                        {/* <ContextMenuItem onSelect={() => copyCells(getSelectedPositions())}>
                          Copy Row
                        </ContextMenuItem>
                        <ContextMenuItem onSelect={() => pasteCells(rowIndex + 1, colLetters[0])}>
                          Paste Row
                        </ContextMenuItem>
                        <ContextMenuItem onSelect={cutSelection}>
                          Cut Row
                        </ContextMenuItem> */}
                        <ContextMenuItem onSelect={() => insertRow(rowIndex + 1, "above")}>
                          Insert Above
                        </ContextMenuItem>
                        <ContextMenuItem onSelect={() => insertRow(rowIndex + 1, "below")}>
                          Insert Below
                        </ContextMenuItem>
                        <ContextMenuItem onSelect={() => deleteRow(rowIndex + 1)}>
                          Delete Row
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  </th>

                  {/* Row Cells */}
                  {colLetters.map((col, colIndex) => (
                    <SpreadsheetCell
                      key={`${col}${rowIndex + 1}`}
                      row={rowIndex + 1}
                      col={col}
                      isSelected={selectedCells.some(
                        (c) => c.col === col && c.row === rowIndex + 1
                      )}
                      onMouseDown={(e) => handleMouseDown(col, rowIndex + 1, e)}
                      onMouseEnter={() => handleMouseEnter(col, rowIndex + 1)}
                      refKey={`${col}${rowIndex + 1}`}
                      ref={(el) => cellRefs.current.set(`${col}${rowIndex + 1}`, el)}
                      width={colWidths[colIndex]}
                    />
                  ))}
                </tr>
              </tbody>
            </table>
          )}
        />
      </div>
    </div>
  );
}
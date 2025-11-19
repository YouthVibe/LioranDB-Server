"use client";

import { useSpreadsheet } from "./SpreadsheetContext";
import { evaluateFormula } from "./FormulaEvaluator";
import React, {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";

const SpreadsheetCell = forwardRef(function SpreadsheetCell(
  { row, col, isSelected, onSelect, refKey, width },
  ref
) {
  const { cells, setCells, cellStyles, cellRefs, selectedCells, setSelectedCells, selectCell, selectRange } = useSpreadsheet();
  const key = `${col}${row}`;
  const inputRef = useRef();
  const [isEditing, setIsEditing] = useState(false);

  // ✅ Read value from Map (supports both Map & plain object)
  const getCellValue = () => {
    const value = cells instanceof Map ? cells.get(key) : cells[key];
    return value ?? ""; // ← Always return string
  };

  // ✅ Local state for editing
  const [inputValue, setInputValue] = useState(getCellValue());

  // ✅ Update local state when global cell value changes
  useEffect(() => {
    const latest = getCellValue();
    const safeLatest = latest ?? ""; // ← Add this
    if (safeLatest !== inputValue) {
      setInputValue(safeLatest);
    }
  }, [cells, col, row]);

  // ✅ Refresh for rerenderCells()
  const refresh = () => setInputValue(getCellValue());

  // ✅ Register cell ref
  useEffect(() => {
    cellRefs.current.set(refKey, { current: { refresh } });
    return () => {
      cellRefs.current.delete(refKey);
    };
  }, [refKey]);

  useImperativeHandle(ref, () => ({ refresh }));

  // ✅ Formula evaluation
  const displayValue = inputValue;
  // const displayValue =
  //   inputValue.startsWith("=") && typeof evaluateFormula === "function"
  //     ? evaluateFormula(inputValue, cells)
  //     : inputValue;
  // const safeValue = inputValue ?? "";
  // const isFormula = safeValue.startsWith("=");

  // const displayValue = isEditing
  //   ? safeValue
  //   : isFormula
  //     ? evaluateFormula(safeValue, cells)
  //     : safeValue;

  const style =
    cellStyles instanceof Map
      ? cellStyles.get(key) || {}
      : cellStyles[key] || {};

  // ✅ Handle typing
  const handleChange = (e) => {
    if (selectedCells.length > 1) return; // ignore typing if multi-selection
    const val = e.target.value;
    setInputValue(val);
    // Removed debounce - only update local state during typing; save on blur/enter
  };


  // ✅ Fill handle logic (drag to copy)
  const handleMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();

    const startRow = row;
    const startCol = col;
    const startValue = getCellValue();

    const onMouseMove = (moveEvent) => {
      const target = document.elementFromPoint(
        moveEvent.clientX,
        moveEvent.clientY
      );
      if (!target) return;
      const cellTd = target.closest("td");
      if (!cellTd) return;
      const match = cellTd.getAttribute("data-ref");
      if (!match) return;
      const [, dragCol, dragRow] = match.match(/([A-Z]+)(\d+)/) || [];
      if (!dragCol || !dragRow) return;
      const endRow = parseInt(dragRow);
      const fillDown = endRow - startRow;

      if (fillDown > 0) {
        // Fill cells downward
        for (let r = startRow + 1; r <= endRow; r++) {
          const key = `${col}${r}`;
          const valueToSet = !isNaN(Number(startValue))
            ? String(Number(startValue) + (r - startRow))
            : startValue;

          setCells({
            type: "SET_CELL",
            col,
            row: r,
            value: valueToSet,
          });
        }
      }
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };
  const handleDoubleClick = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (isEditing) {
        // Save value
        setCells({ type: "SET_CELL", col, row, value: inputValue });
        setIsEditing(false);
        // Move selection down
        selectCell(col, row + 1);
      } else {
        // Start editing if not editing yet
        setIsEditing(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      e.preventDefault();
    } else if (e.key === "Escape" && isEditing) {
      // Revert to original value and exit editing
      setInputValue(getCellValue());
      setIsEditing(false);
      e.preventDefault();
    }
  };

  const handleSelect = (e) => {
    const cell = { col, row };

    if (e.shiftKey && selectedCells.length > 0) {
      const last = selectedCells[selectedCells.length - 1];
      selectRange(last, cell);
    } else if (e.ctrlKey || e.metaKey) {
      setSelectedCells((prev) => {
        const exists = prev.some(c => c.col === col && c.row === row);
        if (exists) return prev;
        return [...prev, cell];
      });
    } else {
      selectCell(col, row);
    }

    // ✅ exit edit mode on single click
    setIsEditing(false);
  };


  const isSelectedCell = selectedCells.some(c => c.col === col && c.row === row);
  // ✅ Determine if this cell is the last in selected range
  // Compute the "bottom-right" cell of current selection
  let lastCell = null;
  if (selectedCells.length > 0) {
    const rows = selectedCells.map(c => c.row);
    const cols = selectedCells.map(c => c.col);
    const maxRow = Math.max(...rows);
    const maxCol = cols.reduce((a, b) => (a > b ? a : b));
    lastCell = { row: maxRow, col: maxCol };
  }

  const isLastSelected = lastCell?.row === row && lastCell?.col === col;


  return (
    <td
      onClick={handleSelect}
      data-ref={key}
      style={{
        width: `${width}px`,
        height: "100%",
        position: "relative",
      }}
      className={`border border-slate-900 ${isSelectedCell
        ? "bg-blue-800/40"
        : "bg-slate-950 hover:bg-slate-800/60"
        }`}
    >
      <input
        ref={inputRef}
        value={displayValue}
        onChange={handleChange}
        onDoubleClick={handleDoubleClick}   // ✅ double-click starts editing
        onKeyDown={handleKeyDown}           // ✅ handle Enter
        readOnly={!isEditing}               // ✅ read-only unless editing
        className="absolute top-0 left-0 w-full h-full px-2 text-sm bg-transparent text-gray-200 outline-none"
        onBlur={() => {
          if (isEditing) {
            setCells({ type: "SET_CELL", col, row, value: inputValue });
            setIsEditing(false);
          }
        }}
        style={{
          fontWeight: style.bold ? "bold" : "normal",
          fontStyle: style.italic ? "italic" : "normal",
          textDecoration: style.underline ? "underline" : "none",
          textAlign: style.align || "left",
          fontSize: style.fontSize ? `${style.fontSize}px` : "14px",
          boxSizing: "border-box",
        }}
      />



      {/* ✅ Fill handle on last selected cell only */}
      {isSelected && isLastSelected && (
        <div
          onMouseDown={handleMouseDown}
          className="absolute w-2 h-2 bg-blue-500 bottom-0 right-0 cursor-crosshair rounded-sm"
        ></div>
      )}

    </td>
  );
});

export default React.memo(SpreadsheetCell);
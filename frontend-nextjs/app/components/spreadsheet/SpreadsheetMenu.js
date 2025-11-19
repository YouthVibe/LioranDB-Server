"use client";
import { useSpreadsheet } from "./SpreadsheetContext";
import { AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline } from "lucide-react";

export default function SpreadsheetMenu() {
  const { selectedCell, cells, applyStyle } = useSpreadsheet();
  const key = `${selectedCell.col}${selectedCell.row}`;
  const value = cells[key] || "";

  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-950 text-gray-300 text-sm">
      {/* Cell and Value */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-blue-400">
          {selectedCell.col}
          {selectedCell.row}
        </span>
        <span className="opacity-70">|</span>
        <span className="truncate w-[250px]">{value || " "}</span>
      </div>

      {/* Formatting Options */}
      <div className="flex items-center gap-2">
        <select
          onChange={(e) => applyStyle("fontSize", e.target.value)}
          className="bg-slate-900 border border-slate-700 text-gray-300 text-xs rounded px-1 py-0.5"
        >
          {[10, 12, 14, 16, 18, 20, 24, 28].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <button onClick={() => applyStyle("bold", true)} className="p-1 hover:bg-slate-800 rounded">
          <Bold className="w-4 h-4" />
        </button>
        <button onClick={() => applyStyle("italic", true)} className="p-1 hover:bg-slate-800 rounded">
          <Italic className="w-4 h-4" />
        </button>
        <button onClick={() => applyStyle("underline", true)} className="p-1 hover:bg-slate-800 rounded">
          <Underline className="w-4 h-4" />
        </button>
        <button onClick={() => applyStyle("align", "left")} className="p-1 hover:bg-slate-800 rounded">
          <AlignLeft className="w-4 h-4" />
        </button>
        <button onClick={() => applyStyle("align", "center")} className="p-1 hover:bg-slate-800 rounded">
          <AlignCenter className="w-4 h-4" />
        </button>
        <button onClick={() => applyStyle("align", "right")} className="p-1 hover:bg-slate-800 rounded">
          <AlignRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
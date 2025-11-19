"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Copy } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { useSpreadsheet } from "./SpreadsheetContext"; // adjust path

export default function SpreadsheetSheets() {
  const {
    sheets,
    activeSheet,
    setActiveSheet,
    addSheet: addSheetContext,
    deleteSheet: deleteSheetContext,
    renameSheet: renameSheetContext,
    duplicateSheet: duplicateSheetContext, // new helper
  } = useSpreadsheet();

  const [renamingSheet, setRenamingSheet] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  // ➕ Add new sheet
  const addSheet = () => {
    let i = Object.keys(sheets).length + 1;
    let newName = `Sheet${i}`;
    while (sheets[newName]) {
      i++;
      newName = `Sheet${i}`;
    }
    addSheetContext(newName); // context handles adding + activating
    setActiveSheet(newName);
  };

  // 🗑️ Delete sheet
  const deleteSheet = (name) => {
    if (Object.keys(sheets).length === 1) return; // prevent deleting last sheet
    deleteSheetContext(name); // context handles switching active sheet
  };

  // 📄 Duplicate sheet
  const duplicateSheet = (name) => {
    let i = 1;
    let copyName = `${name}_copy`;
    while (sheets[copyName]) {
      i++;
      copyName = `${name}_copy${i}`;
    }
    duplicateSheetContext(name, copyName); // duplicate sheet in context
    setActiveSheet(copyName);
  };

  // ✏️ Rename sheet
  const startRenaming = (name) => {
    setRenamingSheet(name);
    setRenameValue(name);
  };

  const finishRenaming = () => {
    if (renameValue.trim() !== "" && !sheets[renameValue.trim()]) {
      renameSheetContext(renamingSheet, renameValue.trim());
    }
    setRenamingSheet(null);
    setRenameValue("");
  };

  return (
    <div className="flex items-center gap-2 p-2 border-t border-slate-800 bg-slate-950/90 backdrop-blur-md overflow-x-auto scrollbar-hide">
      {/* Add New Sheet */}
      <div className="sticky left-0 bg-slate-950/90 z-10 pr-2">
        <Button
          size="sm"
          variant="ghost"
          className="text-gray-300 hover:bg-slate-800/70 hover:text-white rounded-xl transition-all duration-200"
          onClick={addSheet}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Sheet Tabs */}
      <div className="flex items-center gap-1">
        {Object.keys(sheets).map((sheet) => (
          <ContextMenu key={sheet}>
            <ContextMenuTrigger asChild>
              {renamingSheet === sheet ? (
                <Input
                  size="sm"
                  className="w-28 h-7 text-sm bg-slate-800/70 border border-slate-700 text-gray-200 focus:ring-1 focus:ring-blue-500 rounded-xl"
                  value={renameValue}
                  autoFocus
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={finishRenaming}
                  onKeyDown={(e) => e.key === "Enter" && finishRenaming()}
                />
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className={`px-3 py-1 rounded-xl transition-all duration-200 ${
                    activeSheet === sheet
                      ? "bg-slate-300 text-slate-900"
                      : "text-gray-300 hover:bg-slate-800/70 hover:text-white"
                  }`}
                  onClick={() => setActiveSheet(sheet)}
                >
                  {sheet}
                </Button>
              )}
            </ContextMenuTrigger>

            <ContextMenuContent className="w-44 bg-slate-900/95 border border-slate-700 text-gray-200 rounded-xl shadow-lg backdrop-blur-sm">
              <ContextMenuItem
                onClick={() => startRenaming(sheet)}
                className="hover:bg-slate-800/80 rounded-md"
              >
                ✏️ Rename
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => deleteSheet(sheet)}
                className="hover:bg-red-500/20 rounded-md"
                disabled={Object.keys(sheets).length === 1}
              >
                🗑️ Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>
    </div>
  );
}

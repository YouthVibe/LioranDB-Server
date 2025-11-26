"use client";
import { Button } from "@/components/ui/button";
import { Plus, Undo2, Redo2 } from "lucide-react";
import { useEffect } from "react";

export default function SpreadsheetToolbar() {
  // Handle keyboard shortcuts globally (Ctrl+Z / Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleUndo = () => {
    document.execCommand("undo");
  };

  const handleRedo = () => {
    document.execCommand("redo");
  };

  return (
    <div className="flex items-center gap-2 p-2 border-b border-slate-800 bg-slate-950">
      <Button
        size="sm"
        variant="ghost"
        className="text-gray-300 hover:bg-slate-800"
        onClick={handleUndo}
      >
        <Undo2 className="w-4 h-4 mr-1" /> Undo
      </Button>

      <Button
        size="sm"
        variant="ghost"
        className="text-gray-300 hover:bg-slate-800"
        onClick={handleRedo}
      >
        <Redo2 className="w-4 h-4 mr-1" /> Redo
      </Button>
    </div>
  );
}

"use client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function SpreadsheetContextMenu({ trigger, type, onAction }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="bg-slate-950 text-gray-300 border border-slate-800">
        {type === "cell" && (
          <>
            <DropdownMenuItem onClick={() => onAction("copy")}>Copy</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("paste")}>Paste</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("clear")}>Clear</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("insertFormula")}>Insert Formula</DropdownMenuItem>
          </>
        )}
        {type === "row" && (
          <>
            <DropdownMenuItem onClick={() => onAction("insertAbove")}>Insert Row Above</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("insertBelow")}>Insert Row Below</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("deleteRow")}>Delete Row</DropdownMenuItem>
          </>
        )}
        {type === "col" && (
          <>
            <DropdownMenuItem onClick={() => onAction("insertLeft")}>Insert Column Left</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("insertRight")}>Insert Column Right</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("deleteCol")}>Delete Column</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
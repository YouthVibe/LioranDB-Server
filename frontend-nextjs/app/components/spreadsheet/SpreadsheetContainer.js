"use client";
import { forwardRef } from "react";
import { SpreadsheetProvider } from "./SpreadsheetContext";
import SpreadsheetToolbar from "./SpreadsheetToolbar";
import SpreadsheetSheets from "./SpreadsheetSheets";
import SpreadsheetGrid from "./SpreadsheetGrid";

const SpreadsheetContainer = forwardRef((props, ref) => {
  return (
    <SpreadsheetProvider ref={ref}>
      <div className="flex flex-col w-full h-full bg-slate-950 text-gray-200">
        {/* Toolbar at top */}
        <div className="sticky top-0 z-50 bg-slate-950 border-b border-slate-800">
          <SpreadsheetToolbar />
        </div>

        {/* Grid fills remaining space */}
        <div className="flex-1 overflow-auto">
          <SpreadsheetGrid rows={30} cols={10} />
        </div>

        {/* Sheet Tabs below toolbar */}
        <div className="sticky top-[40px] z-40 bg-slate-950 border-b border-slate-800">
          <SpreadsheetSheets />
        </div>
      </div>
    </SpreadsheetProvider>
  );
});

export default SpreadsheetContainer;

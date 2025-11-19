"use client";
import { useRef, useEffect } from "react";
import SpreadsheetContainer from "./spreadsheet";
import * as XLSX from "xlsx";
import { stox } from "../lib/xlsxspread";

export default function SpreadsheetClient({
  isMobile,
  setSpreadsheetInstance,
  NEXT_PUBLIC_CLERK_BACKEND_URL,
  setSpreadsheetReady,
}) {
  const spreadsheetRef = useRef();
  const fileInputRef = useRef();

  // ✅ When the Spreadsheet is ready
  useEffect(() => {
    if (spreadsheetRef.current) {
      const instance = spreadsheetRef.current;

      // Pass instance to parent
      setSpreadsheetInstance?.(instance);
      setSpreadsheetReady?.(true);

      // 🌍 Make global
      if (typeof window !== "undefined") {
        window.spreadsheet = instance;

        // --- Global helpers ---
        window.saveWorkbook = (filename = "MyHusharSheet.xlsx") => {
          instance.saveWorkbook(filename);
        };

        window.loadWorkbook = async (file) => {
          try {
            const reader = new FileReader();
            reader.onload = (evt) => {
              const data = evt.target.result;
              const workbook = XLSX.read(data, { type: "binary" });
              instance.loadWorkbook(workbook);
            };
            reader.readAsBinaryString(file);
          } catch (err) {
            console.error("❌ Failed to load file globally:", err);
          }
        };

        window.setCellValue = (col, row, value) => {
          instance.setCell(col, row, value);
        };

        window.getCellValue = (col, row) => {
          return instance.getCell(col, row);
        };

        console.log("🌍 Global spreadsheet functions ready:", window);
      }

      console.log("✅ Spreadsheet instance ready");
    }
  }, [setSpreadsheetInstance, setSpreadsheetReady]);

  return (
    <div className="w-full h-full overflow-hidden">
      {/* Hidden File Input */}
      <input
        type="file"
        id="fileInput"
        ref={fileInputRef}
        className="hidden"
        accept=".xlsx"
      />
      {/* Spreadsheet */}
      <SpreadsheetContainer ref={spreadsheetRef} />
    </div>
  );
}

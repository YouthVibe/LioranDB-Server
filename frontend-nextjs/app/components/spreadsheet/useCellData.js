"use client";
import { useSpreadsheet } from "./SpreadsheetContext";

export function useCellData(row, col) {
  const { cells, setCells } = useSpreadsheet();

  const value = cells?.[`${row}-${col}`] || "";

  const updateValue = (newValue) => {
    setCells((prev) => ({
      ...prev,
      [`${row}-${col}`]: newValue,
    }));
  };

  return { value, updateValue };
}

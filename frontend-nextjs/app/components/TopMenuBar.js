"use client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Save, Menu, LogIn } from "lucide-react";
import * as XLSX from "xlsx-js-style";
import { stox, xtos } from "../lib/xlsxspread";
import { SignedIn, SignedOut } from "../utils/AuthWrappers";
import { SignInButton, SignUpButton } from "../utils/AuthButtons";
import { AuthProvider } from "../utils/AuthContext";
import UserMenu from "./UserMenu"; // adjust the path
import { useAuth } from "../utils/useAuth";
import { MessageSquare, Folder } from "lucide-react"; // icons
import { ArrowUp, Zap, RefreshCw } from "lucide-react";
import ModeToggle from "./ModeToggle";
import { useTheme } from "next-themes";
import { useEffect } from "react";

function Dropdown({ label, children }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">{label}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white">{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function TopMenuBar({ s, wb, setWb, fileName, setFileName, NEXT_PUBLIC_CLERK_BACKEND_URL, isMobile, setActivePanel, activeTab, setActiveTab }) {
  const { resolvedTheme } = useTheme();
  const { getToken } = useAuth();
  // New Blank Sheet
  const handleNewBlankSheet = async () => {
    // Blank workbook using XLSX
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(Array(99).fill([]));
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    window.loadData(stox(workbook));
    setWb(workbook);
    setFileName("Untitled");

    try {
      // ===========================
      // 🧩 Get Clerk Token
      // ===========================
      const token = await window.Clerk?.session?.getToken();

      // ===========================
      // 1️⃣ Upload to backend (only if logged in)
      // ===========================
      if (token) {
        try {
          const uploadRes = await fetch(NEXT_PUBLIC_CLERK_BACKEND_URL + "/file/create-blank", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const uploadResult = await uploadRes.json();
          if (!uploadRes.ok) throw new Error(uploadResult.error || "Upload failed");

          console.log("✅ Workbook uploaded:", uploadResult);
        } catch (err) {
          console.warn("⚠️ Upload skipped or failed:", err.message);
        }
      } else {
        console.log("⚠️ Not logged in — skipping upload.");
      }
    } catch (err) {
      console.error("❌ Open failed:", err);
      alert("Failed to open workbook: " + err.message);
    }
  }
  // ✅ Open handler
  const handleOpenFile = () => {
    const input = document.getElementById("fileInput");
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        // ===========================
        // 🧩 Get Clerk Token
        // ===========================
        const token = await getToken();

        // ===========================
        // 1️⃣ Upload to backend (only if logged in)
        // ===========================
        if (token) {
          try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("isWorkbook", "true");
            formData.append("name", file.name);
            formData.append("description", "Workbook upload");

            const uploadRes = await fetch(NEXT_PUBLIC_CLERK_BACKEND_URL + "/file/upload", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData,
            });

            const uploadResult = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadResult.error || "Upload failed");

            console.log("✅ Workbook uploaded:", uploadResult);
            setWb(uploadResult.workbook);
          } catch (err) {
            console.warn("⚠️ Upload skipped or failed:", err.message);
          }
        } else {
          console.log("⚠️ Not logged in — skipping upload.");
        }

        // ===========================
        // 2️⃣ Load locally via XLSX
        // ===========================
        const reader = new FileReader();
        reader.onload = (evt) => {
          const data = evt.target.result;
          try {
            const workbook = XLSX.read(data, { type: "binary" });
            // let xspreadData = stox(workbook);

            // console.log("✅ Workbook loaded:", xspreadData);
            // window.loadData(xspreadData);
            s.loadWorkbook(workbook);
            setWb(workbook);
            setFileName(file.name.replace(/\.xlsx$/, ""));
            console.log("✅ Workbook loaded using XLSX");
          } catch (err) {
            console.error("❌ Failed to parse XLSX:", err);
            alert("Failed to parse XLSX file: " + err.message);
          }
        };
        reader.readAsBinaryString(file);
      } catch (err) {
        console.error("❌ Open failed:", err);
        alert("Failed to open workbook: " + err.message);
      }
    };
    input.click();
  };

  // ✅ Save handler
  const handleSaveFile = async () => {
    try {
      // Clean file name: remove spaces + invalid chars
      let cleanName = fileName
        .replaceAll(" ", "")
        .replace(/[<>:"/\\|?*]+/g, "")
        .trim();

      if (!cleanName) cleanName = "Untitled";

      const finalFileName = `${cleanName}.xlsx`;

      window.saveWorkbook(finalFileName);
      console.log("✅ File saved:", finalFileName);
    } catch (err) {
      console.error("❌ Save failed:", err);
      alert("Failed to save file: " + err.message);
    }
  };

  return (
    <header className="flex items-center justify-between bg-slate-950 border-b p-2 shadow-sm relative border-b-slate-800">
      <div className="flex items-center gap-6 w-full">
        <a href="/" className="text-lg font-bold text-slate-300">Hushar Spreadsheet</a>

        {isMobile ? (
          <div className="absolute right-2 top-2 text-slate-300">
            <div className="flex items-center gap-2">
              <Dropdown label="Show">
                <DropdownMenuItem onSelect={() => setActivePanel('files')}>Show File Explorer</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setActivePanel('spreadsheet')}>Show Spreadsheet</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setActivePanel('ai')}>Show AI Chat</DropdownMenuItem>
              </Dropdown>
              <Dropdown label={<Menu className="w-5 h-5" />}>
                <DropdownMenuItem onSelect={handleNewBlankSheet}>New Blank Workbook</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => s.addSheet()}>New Sheet</DropdownMenuItem>
                <DropdownMenuItem onSelect={handleOpenFile}>Open</DropdownMenuItem>
                <DropdownMenuItem onSelect={handleSaveFile}>Save</DropdownMenuItem>
                <input type="file" id="fileInput" style={{ display: "none" }} accept=".xlsx,.csv,.xls" />
                <div className="flex items-center gap-2 p-2">
                  <input
                    type="text"
                    className="border border-gray-300 rounded-md px-2 py-1"
                    placeholder="File Name"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                  />
                </div>
              </Dropdown>
              <AuthProvider>
                <SignedOut>
                  <div>
                    <a href="/auth/login">Login</a>
                  </div>
                </SignedOut>
                <SignedIn>
                  {/* <UserButton /> */}
                  <UserMenu />
                </SignedIn>
              </AuthProvider>
            </div>
          </div>
        ) : (
          <>
            {/* Dropdown Menus */}
            <div className="flex gap-4 text-slate-300">
              <Dropdown label="File">
                <DropdownMenuItem onSelect={handleNewBlankSheet}>New Blank Workbook</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => s.addSheet()}>New Sheet</DropdownMenuItem>
                <DropdownMenuItem onSelect={handleOpenFile}>Open</DropdownMenuItem>
                <DropdownMenuItem onSelect={handleSaveFile}>Save</DropdownMenuItem>
                <input type="file" id="fileInput" style={{ display: "none" }} accept=".xlsx,.csv,.xls" />
              </Dropdown>
            </div>

            {/* File Name Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="border border-slate-800 rounded-md px-2 py-1 text-slate-300"
                placeholder="File Name"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      {!isMobile && (
        <div className="flex gap-2">

          <SignedIn>

            {/* <ModeToggle></ModeToggle> */}

            <Button
              onClick={() => setActiveTab("ai")}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-200 ${activeTab === "ai"
                ? "text-blue-400"
                : "text-slate-300 hover:text-slate-500"
                }`}
            >
              <MessageSquare
                className="w-5 h-5"
                fill={activeTab === "ai" ? "currentColor" : "none"}
              />
            </Button>
            <Button
              onClick={() => setActiveTab("files")}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-200 ${activeTab === "files"
                ? "text-emerald-400"
                : "text-slate-300 hover:text-slate-500"
                }`}
            >
              <Folder
                className="w-5 h-5"
                fill={activeTab === "files" ? "currentColor" : "none"}
              />
            </Button>

          </SignedIn>

          <Button size="icon" variant="ghost" onClick={handleSaveFile} className="text-slate-300">
            <Save className="w-20 h-20" />
          </Button>


          {/* ✅ Clerk Auth */}
          {/* <AuthProvider> */}
          <SignedOut>
            <Button asChild variant="outline" size="sm" className="bg-slate-300 hover:bg-slate-400">
              <a href="/auth/login" className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Login
              </a>
            </Button>
          </SignedOut>
          <SignedIn>
            {/* <UserButton /> */}
            <UserMenu />
          </SignedIn>
          {/* </AuthProvider> */}
        </div>
      )}
    </header>
  );
}

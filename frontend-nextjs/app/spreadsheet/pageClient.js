"use client";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useState, useEffect, useRef } from "react";
import TopMenuBar from "../components/TopMenuBar";
// import SpreadsheetClient from "../components/SpreadsheetClientOld";
import SpreadsheetClient from "../components/SpreadsheetClient";
import FileExplorer from "../components/FileExplorer";
import AIChat from "../components/AIChat";
import { useAuth } from "../utils/useAuth";
import { getSocket } from "../lib/socket";
import * as Worker from "../lib/Worker";
import { MessageSquare, Folder } from "lucide-react"; // icons
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SpreadsheetContainer from "../components/spreadsheet";
import * as XLSX from "xlsx";
import { forwardRef } from "react";
import { SpreadsheetProvider } from "../components/spreadsheet/SpreadsheetContext";
import SpreadsheetToolbar from "../components/spreadsheet/SpreadsheetToolbar";
import SpreadsheetGrid from "../components/spreadsheet/SpreadsheetGrid";
import { ArrowUp, Zap, RefreshCw } from "lucide-react";

const Home = forwardRef(({ NEXT_PUBLIC_CLERK_BACKEND_URL }, ref) => {
  const [activePanel, setActivePanel] = useState('spreadsheet'); // 'files', 'spreadsheet', 'ai'
  const [showLeft, setShowLeft] = useState(true); // For desktop
  const [showRight, setShowRight] = useState(true); // For desktop
  // const [spreadsheetInstance, setspreadsheetInstance] = useState(false);
  const spreadsheetInstance = useRef(null);
  const [wb, setWb] = useState(null);
  const [spreadsheetReady, setSpreadsheetReady] = useState(false);
  const [filesReady, setFilesReady] = useState(false);
  const [aiReady, setAiReady] = useState(false); // reserved for later
  const { getToken, fetchUser } = useAuth();
  const [fileName, setFileName] = useState("Hushar Spreadsheet");
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveMessage, setApproveMessage] = useState("");
  const [approveAction, setApproveAction] = useState(null);
  const [eventFunction, setEventFunction] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [files, setFiles] = useState([]);
  const socketRef = useRef(null);
  const toolQueue = useRef([]);
  const [isMobile, setIsMobile] = useState(false);
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState("ai");


  // 🧠 Funny random messages
  const funnyMessages = [
    "Loading your genius sheet...",
    "Stealing your formulas (jk)...",
    "Polishing cells until they shine ✨",
    "Convincing the spreadsheet to cooperate...",
    "Feeding Excel some caffeine ☕",
    "Hacking matrix for faster cells...",
    "Calibrating AI neurons (don’t worry)...",
    "Almost there... probably...",
    "Plotting charts of your success 📈",
    "Making your spreadsheet feel loved ❤️"
  ];

  const leaveMessages = [
    "I will not let you leave the damn sheet until you do your work :)",
    "Nope. You're grounded here!",
    "Escape is disabled. Work more 💪",
    "The leave button is on vacation 🏖️",
    "Error 404: Motivation not found.",
    "Haha nice try... get back to work!",
    "Leaving? Not on my watch!",
    "Work harder, not leave harder 😎",
    "Spreadsheet loves you, don’t leave ❤️",
    "System says: Denied, loser 😜"
  ];

  const windowThemes = [
    "bg-gradient-to-br from-pink-400 to-pink-600",
    "bg-gradient-to-br from-blue-400 to-blue-600",
    "bg-gradient-to-br from-green-400 to-green-600",
    "bg-gradient-to-br from-purple-400 to-purple-600",
    "bg-gradient-to-br from-orange-400 to-orange-600",
    "bg-gradient-to-br from-red-400 to-red-600",
    "bg-gradient-to-br from-teal-400 to-teal-600",
    "bg-gradient-to-br from-indigo-400 to-indigo-600",
    "bg-gradient-to-br from-emerald-400 to-emerald-600",
    "bg-gradient-to-br from-rose-400 to-rose-600"
  ];

  const [loadingMessage, setLoadingMessage] = useState(
    funnyMessages[Math.floor(Math.random() * funnyMessages.length)]
  );
  const [leaveMessage, setLeaveMessage] = useState("");
  const [theme, setTheme] = useState(windowThemes[Math.floor(Math.random() * windowThemes.length)]);
  const [loadingVisible, setLoadingVisible] = useState(true); // for animation
  const [loadingDone, setLoadingDone] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      const user = await fetchUser();
      setUserId(user?.sub);
      // alert(token);
    })();
  }, [fetchUser, getToken]);

  // 🧩 Handle readiness animation
  useEffect(() => {
    if (spreadsheetReady && filesReady) {
      const timer = setTimeout(() => {
        // Start closing animation
        setLoadingVisible(false);

        // After 0.8s remove it fully
        setTimeout(() => setLoadingDone(true), 2000);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [spreadsheetReady, filesReady]);

  // 📶 Socket setup
  useEffect(() => {
    if (!spreadsheetInstance.current) return;
    while (toolQueue.current.length) {
      const toolCall = toolQueue.current.shift();
      Worker.insertRowsToSpreadsheet(spreadsheetInstance.current, { ...toolCall });
    }
  }, [spreadsheetInstance.current]);

  useEffect(() => {
    if (!userId) return;
    if (!socketRef.current) socketRef.current = getSocket();
    const socket = socketRef.current;

    const handleConnect = async () => {
      console.log("🟢 Connected:", socket.id);
      try {
        const token = await getToken();
        await fetch(NEXT_PUBLIC_CLERK_BACKEND_URL + "/user/socketId", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ socketId: socket.id }),
        });
        console.log("✅ Socket ID updated on server");
      } catch (err) {
        console.error("❌ Failed to update socket ID:", err);
      }
    };

    if (socket.connected) handleConnect();
    else socket.on("connect", handleConnect);

    socket.on(`requestApproval`, (data) => {
      console.log("📩 Approval request:", data);
      setApproveMessage(data.message);
      setApproveAction(() => () => {
        socket.emit(`approval:${userId}`, { approved: true });
      });
      setShowApproveModal(true);
      setChatMessages((prev) => [
        ...prev,
        { role: "tool", content: data.message, payload: data.payload, toolName: data.tool },
      ]);
    });

    socket.on("tool", (data) => {
      console.log("📩 Workbook updated:", data);
      if (data.show === true) {
        setChatMessages((prev) => [
          ...prev,
          { role: "tool", content: data.message, payload: data.payload, toolName: data.tool },
        ]);
      } else {
        if (data.tool === "insertRowsToSheet") {
          if (window.insertRowsToSpreadsheet) {
            window.insertRowsToSpreadsheet(data.payload);
          } else toolQueue.current.push(data.payload);
        }
        if (data.tool === "editCells") {
          if (window.editCells) {
            window.editCells(data.payload);
          } else toolQueue.current.push(data.payload);
        }
      }
    });

    const communicate = (event, data) => {
      if (!socket.connected) return;
      socket.emit(event, data);
    };
    setEventFunction(() => communicate);

    return () => {
      socket.off("connect", handleConnect);
      socket.off(`requestApproval:${userId}`);
      socket.off(`toolAction:${userId}`);
      socket.off("tool");
    };
  }, [userId]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  // ✅ When the Spreadsheet is ready
  useEffect(() => {
    const loadWorkbookFromServer = async (instance) => {
      try {
        // return;
        const token = await getToken();
        const res = await fetch(
          NEXT_PUBLIC_CLERK_BACKEND_URL + "/user/sheet",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );

        const data = await res.json();
        console.log("📩 Workbook loaded from server:", data);

        // 🧱 Convert your backend JSON into XLSX workbook
        const workbook = {
          SheetNames: data.sheetsNames,
          Sheets: {},
        };

        data.sheetsNames.forEach((sheetName) => {
          const sheetData = data.sheetsData[sheetName];
          const sheet = {};

          // copy all cell data (A1, B2, etc.)
          Object.entries(sheetData.data).forEach(([cell, cellObj]) => {
            sheet[cell] = {
              t: cellObj.t,
              v: cellObj.v,
              w: cellObj.w,
            };
          });

          // define the range ref (important for Excel)
          sheet["!ref"] = sheetData.ref || sheetData.dataStart + ":" + sheetData.dataEnd;

          workbook.Sheets[sheetName] = sheet;
        });

        // ✅ Load workbook into instance
        instance.loadWorkbook(workbook);
        console.log("✅ Workbook successfully loaded into spreadsheet");
      } catch (err) {
        console.error("❌ Failed to load workbook from server:", err);
      }
    };

    const setup = async () => {
      if (spreadsheetInstance.current) {
        const instance = spreadsheetInstance.current;
        if (setSpreadsheetReady) setSpreadsheetReady(true);

        // 🌍 Expose helpers
        // if (typeof window !== "undefined") {
        //   window.spreadsheet = instance;

        //   window.saveWorkbook = async (filename = "MyHusharSheet.xlsx") => {
        //     try {
        //       const wb = await instance.exportWorkbook();
        //       await instance.saveWorkbook(filename, wb);
        //       console.log("💾 Workbook saved:", filename);
        //     } catch (err) {
        //       console.error("❌ Save failed:", err);
        //     }
        //   };

        //   window.loadWorkbook = async (file) => {
        //     try {
        //       const reader = new FileReader();
        //       reader.onload = (evt) => {
        //         const data = evt.target.result;
        //         const workbook = XLSX.read(data, { type: "binary" });
        //         instance.loadWorkbook(workbook);
        //       };
        //       reader.readAsBinaryString(file);
        //     } catch (err) {
        //       console.error("❌ Failed to load workbook:", err);
        //     }
        //   };

        //   window.setCellValue = (col, row, value) => {
        //     try {
        //       instance.setCell(col, row, value);
        //     } catch (err) {
        //       console.error("❌ Failed to set cell:", err);
        //     }
        //   };

        //   window.getCellValue = (col, row) => {
        //     try {
        //       return instance.getCell(col, row);
        //     } catch (err) {
        //       console.error("❌ Failed to get cell:", err);
        //       return null;
        //     }
        //   };

        //   console.log("🌍 Global spreadsheet functions ready");
        // }

        // 🔥 Load workbook from your backend
        await loadWorkbookFromServer(instance);

        console.log("✅ Spreadsheet instance ready");
      }
    };

    setup();
  }, [spreadsheetInstance.current]);

  const handleLeaveClick = () => {
    setLeaveMessage(leaveMessages[Math.floor(Math.random() * leaveMessages.length)]);
    setTimeout(() => setLeaveMessage(""), 5000);
  };

  return (
    <SpreadsheetProvider ref={ref}>
      <main className="flex flex-col h-screen relative overflow-hidden bg-slate-950">
        {/* {!loadingDone && (
        <div
          className={`absolute inset-0 flex items-center justify-center z-50 transition-all duration-500 ${loadingVisible ? "backdrop-blur-lg opacity-100" : "backdrop-blur-0 opacity-0"
            }`}
        >
          <div
            className={`rounded-2xl shadow-2xl text-white p-6 w-80 transform transition-all duration-500 ${loadingVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"
              } ${theme}`}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">

              </div>
              <span className="text-sm opacity-70">Hushar Loading...</span>
            </div>

            <p className="text-center font-medium mb-4 animate-pulse">{loadingMessage}</p>

            <div className="space-y-2 text-sm">
              <p>
                Spreadsheet:{" "}
                <span className={spreadsheetReady ? "text-green-300" : "text-gray-200"}>
                  {spreadsheetReady ? "✅ Loaded" : "⏳ Loading..."}
                </span>
              </p>
              <p>
                File Explorer:{" "}
                <span className={filesReady ? "text-green-300" : "text-gray-200"}>
                  {filesReady ? "✅ Loaded" : "⏳ Loading..."}
                </span>
              </p>
            </div>

            <button
              onClick={handleLeaveClick}
              className="mt-4 bg-white text-black px-3 py-1 rounded-lg text-sm font-semibold hover:bg-gray-100 w-full transition"
            >
              Leave
            </button>

            {leaveMessage && (
              <p className="text-xs text-center mt-2 animate-bounce">{leaveMessage}</p>
            )}
          </div>
        </div>
      )} */}

        <TopMenuBar
          s={spreadsheetInstance.current}
          wb={wb}
          setWb={setWb}
          fileName={fileName}
          setFileName={setFileName}
          NEXT_PUBLIC_CLERK_BACKEND_URL={NEXT_PUBLIC_CLERK_BACKEND_URL}
          isMobile={isMobile}
          setActivePanel={setActivePanel}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <ResizablePanelGroup
          id="main-resizable-group"
          direction={isMobile ? "vertical" : "horizontal"}
          className="flex-1"
        >
          {/* Spreadsheet Area */}
          <ResizablePanel minSize={60} defaultSize={70} className="overflow-hidden spreadsheet-scrollbar">
            {/* 👇 No extra div with overflow */}
            <SpreadsheetContainer ref={spreadsheetInstance} />
          </ResizablePanel>



          <ResizableHandle className="bg-slate-800" />

          <ResizablePanel
            defaultSize={30}
            minSize={25}
            className="overflow-hidden bg-slate-950 flex flex-col"
          >
            <div className="flex flex-col h-full">

              {/* ---------- Scrollable Content: AIChat or FileExplorer ---------- */}
              {/* pb-20 = space for bottom tab bar only */}
              <div className="flex-1 overflow-y-auto pb-20">
                {activeTab === "ai" ? (
                  <AIChat
                    userId={userId}
                    s={spreadsheetInstance.current}
                    approveAction={approveAction}
                    approveMessage={approveMessage}
                    showApproveModal={showApproveModal}
                    setApproveAction={setApproveAction}
                    setApproveMessage={setApproveMessage}
                    setShowApproveModal={setShowApproveModal}
                    socket={socketRef.current}
                    chatMessages={chatMessages}
                    setChatMessages={setChatMessages}
                    files={files}
                    NEXT_PUBLIC_CLERK_BACKEND_URL={NEXT_PUBLIC_CLERK_BACKEND_URL}
                    setAiReady={setAiReady}
                  />
                ) : (
                  <FileExplorer
                    files={files}
                    setFiles={setFiles}
                    NEXT_PUBLIC_CLERK_BACKEND_URL={NEXT_PUBLIC_CLERK_BACKEND_URL}
                    setFilesReady={setFilesReady}
                  />
                )}
              </div>
            </div>
          </ResizablePanel>

        </ResizablePanelGroup>

      </main>
    </SpreadsheetProvider>
  );
})
export default Home;

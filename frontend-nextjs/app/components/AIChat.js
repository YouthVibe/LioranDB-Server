"use client";
import React, { useState, useRef, useEffect } from "react";
import { SignedIn, SignedOut } from "../utils/AuthWrappers";
import { SignInButton, SignUpButton } from "../utils/AuthButtons";
import { AuthProvider } from "../utils/AuthContext";
import { useAuth } from "../utils/useAuth";
import { emitSocketEvent } from "../lib/socket.js";
import { xtos } from "../lib/xlsxspread";
import { FaFileExcel, FaFolder, FaFile, FaChevronRight, FaPlus, FaUpload, FaRegFolder, FaRegFile, FaTrash, FaEdit } from 'react-icons/fa';
import { IconCheck, IconInfoCircle, IconPlus } from "@tabler/icons-react"
import { ArrowUpIcon, Search } from "lucide-react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent } from "@/components/ui/sheet"
// import { Toast } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"

// 🔹 AIChat Component
export default function AIChat({
  s,
  socket,
  approveAction,
  approveMessage,
  showApproveModal,
  setApproveAction,
  setApproveMessage,
  setShowApproveModal,
  userId,
  communicate,
  chatMessages,
  setChatMessages,
  files,
  NEXT_PUBLIC_CLERK_BACKEND_URL,
  setAiReady
}) {
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("auto");
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistoryList, setChatHistoryList] = useState([]);
  const [activeMessageIndex, setActiveMessageIndex] = useState(null);
  const [HFID, setHFID] = useState(null);
  const { getToken } = useAuth();
  const chatContainerRef = useRef(null);
  const [selectedFilesa, setSelectedFilesa] = useState([]);
  const [showFileList, setShowFileList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredMessageIndex, setHoveredMessageIndex] = useState(null);

  useEffect(() => {
    const handleClickOutside = () => setActiveMessageIndex(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);


  const handleStop = () => {
    socket.emit("handleStop");
  }

  const handleDeleteHistoryFile = async (fileId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this chat history?");
    if (!confirmDelete) return;

    const token = await getToken();

    try {
      const res = await fetch(`${NEXT_PUBLIC_CLERK_BACKEND_URL}/ai/history/${fileId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include", // important for HttpOnly cookies
      });

      if (!res.ok) throw new Error("Failed to delete history file");

      // Optimistically update UI
      setChatHistoryList((prev) => prev.filter((f) => f._id !== fileId));

      // If the deleted chat was currently open, clear it
      if (HFID === fileId) {
        setHFID(null);
        setChatMessages([]);
      }

      alert("Chat history deleted successfully.");
    } catch (err) {
      console.error("Error deleting history file:", err);
      alert("Failed to delete chat history. Try again later.");
    }
  };


  const handleFileSelect = (file) => {
    setSelectedFilesa((prev) => {
      const alreadySelected = prev.find((f) => f.fileId === file.fileId);
      if (alreadySelected) {
        // Remove if clicked again
        // return prev.filter((f) => f.fileId !== file.fileId);
        return prev
      } else {
        // Add new
        return [...prev, { fileId: file.fileId, name: file.name }];
      }
    });
    setShowFileList(false);
  };

  // 🔹 Scroll to bottom when chat updates
  useEffect(() => {
    if (chatContainerRef.current)
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [chatMessages]);

  // 🔹 Handle Send Message
  const handleSend = async () => {
    if (!message.trim()) return;
    const token = await getToken();

    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: message },
    ]);

    try {
      setIsLoading(true);
      // Replace loader with actual response
      setChatMessages((prev) => [
        ...prev,
        // { role: "user", content: message },
        { role: "network", content: "⏳ AI is thinking..." }
        // { role: "assistant", content: aiRes },
      ]);
      setMessage("");

      // console.log("Token", token)

      const res = await fetch(NEXT_PUBLIC_CLERK_BACKEND_URL + "/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include", // important for HttpOnly cookies
        body: JSON.stringify({ prompt: message, rawHistoryFileId: HFID, attachedFiles: selectedFilesa.map(f => f.fileId) }),
      });

      const aiResponse = await res.json();
      const aisetChatMessagesRes = aiResponse.aiRes.output || "No response";
      setHFID(aiResponse.historyFileId || null);

      setChatMessages((prev) => [
        ...prev,
        // { role: "user", content: message },
        { role: "assistant", content: aisetChatMessagesRes },
      ]);
      setIsLoading(false);
      // setMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      // Replace loader with error message
      setChatMessages((prev) => [
        ...prev,
        // { role: "user", content: message },
        { role: "network", content: "Error: Failed to send message" },
      ]);
      setIsLoading(false);
    }
  };

  // 🔹 Start a New Chat History
  const handleNewChat = async () => {
    // const token = await getToken();
    // const res = await fetch(NEXT_PUBLIC_CLERK_BACKEND_URL + "/ai/history", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     Authorization: `Bearer ${token}`,
    //   },
    // });

    // const data = await res.json();
    setChatMessages([]);
    setHFID(null);
  };

  // 🔹 Load History List
  const handleLoadHistoryList = async () => {
    if (showHistory === true) {
      setShowHistory(false);
      return;
    }
    const token = await getToken();
    const res = await fetch(NEXT_PUBLIC_CLERK_BACKEND_URL + "/ai/history", {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include", // important for HttpOnly cookies
    });
    const list = await res.json();
    setChatHistoryList(list.history.historyFiles);
    setShowHistory(true);
  };

  // 🔹 Load Specific Chat
  const handleLoadChat = async (fileId) => {
    const token = await getToken();
    setHFID(fileId);
    const r = await fetch(NEXT_PUBLIC_CLERK_BACKEND_URL + `/ai/history/${fileId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include", // important for HttpOnly cookies
    });

    const d = await r.json();
    // const messages_ = d.historyFile.messages.map((msg) => ({
    //   role: msg.type === "ai" ? "assistant" : "user",
    //   content: msg.text,
    // }));
    const messages_ = d.historyFile.messages.map((msg) => {
      if (msg.type === "ai") {
        return { role: "assistant", content: msg.text, changeMade: msg.changeMade, sheetData: msg.sheet };
      };
      if (msg.type === "human") {
        return { role: "user", content: msg.text, changeMade: msg.changeMade, sheetData: msg.sheet };
      };
      if (msg.type === "tool") {
        return { role: "tool", content: msg.content, toolName: msg.name, payload: msg.payload };
      };
    });

    console.log(messages_)

    setChatMessages(messages_);
    setShowHistory(false);
    return messages_;
  };

  // 🔹 Handle Approve Modal
  const handleApprove = () => {
    socket.emit("approval");
    if (approveAction) approveAction();
    setShowApproveModal(false);
  };

  const handleCancel = () => {
    socket.emit("cancel");
    setShowApproveModal(false);
  };

  const handleDeleteMessage = async (indexToDelete) => {
    if (!HFID) return;

    const isConfirmed = window.confirm("Are you sure you want to delete this message and all subsequent messages?");
    if (!isConfirmed) {
      return;
    }

    const token = await getToken();
    try {
      // Create an array of indexes to delete, from indexToDelete to the end
      const indexesToDelete = Array.from({ length: chatMessages.length - indexToDelete }, (_, i) => indexToDelete + i);

      await fetch(`${NEXT_PUBLIC_CLERK_BACKEND_URL}/ai/history/${HFID}/messages`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ indexes: indexesToDelete }),
        credentials: "include", // important for HttpOnly cookies
      });

      // Optimistically update UI by filtering out deleted messages
      setChatMessages((prev) => prev.filter((_, index) => index < indexToDelete));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleRestoreMessage = async (indexToRevert) => {
    if (!HFID) return;

    const token = await getToken();
    try {
      // 1️⃣ Revert the target message
      await fetch(`${NEXT_PUBLIC_CLERK_BACKEND_URL}/ai/history/${HFID}/revert/${indexToRevert}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include", // important for HttpOnly cookies
      });

      // 2️⃣ Delete all messages after the reverted one
      const indexesToDelete = Array.from({ length: chatMessages.length - (indexToRevert + 1) }, (_, i) => indexToRevert + 1 + i);

      if (indexesToDelete.length > 0) {
        await fetch(`${NEXT_PUBLIC_CLERK_BACKEND_URL}/ai/history/${HFID}/messages`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ indexes: indexesToDelete }),
          credentials: "include", // important for HttpOnly cookies
        });
      }

      // 3️⃣ Optimistically update UI
      setChatMessages((prev) => prev.slice(0, indexToRevert + 1));

      // 4️⃣ Load sheet data if the restored message has it
      const updatedMessages = await handleLoadChat(HFID);
      const restoredMessage = updatedMessages[indexToRevert];
      if (restoredMessage && restoredMessage.sheetData) {
        window.loadDataObject(restoredMessage.sheetData);
      }

    } catch (error) {
      console.error("Error restoring message:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border-l p-2 relative">
      <AuthProvider>
        <SignedIn>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-base text-slate-300">Chats</h2>

            <div className="flex items-center space-x-2">
              {/* ➕ New Chat */}
              <button
                className="p-1 rounded-full bg-gray-300 hover:bg-gray-200"
                onClick={handleNewChat}
                title="New Chat"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </button>

              {/* ⏳ History Dropdown (ShadCN UI) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-1 rounded-full bg-gray-300 hover:bg-gray-200"
                    title="History"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto">
                  <DropdownMenuLabel>History</DropdownMenuLabel>

                  {chatHistoryList.map(({ _id: fileId, name }) => (
                    <DropdownMenuItem
                      key={fileId}
                      className="flex justify-between items-center"
                    >
                      <span
                        onClick={() => handleLoadChat(fileId)}
                        className="truncate cursor-pointer flex-1"
                        title={name}
                      >
                        {name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteHistoryFile(fileId);
                        }}
                        className="p-1 rounded-full hover:bg-gray-200"
                        title="Delete Chat History"
                      >
                        <FaTrash className="w-3 h-3 text-gray-500" />
                      </button>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Chat Messages Section */}
          <Card className="flex flex-col flex-grow bg-slate-950 overflow-y-auto spreadsheet-scrollbar" style={{ border: "none" }}>
            <ScrollArea ref={chatContainerRef} className="flex-grow px-4 py-4">
              {chatMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <div className="text-center space-y-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 mx-auto opacity-60"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 
                 8a9.863 9.863 0 01-4.255-.949L3 
                 20l1.395-3.72C3.512 15.042 3 
                 13.574 3 12c0-4.418 4.03-8 9-8s9 
                 3.582 9 8z"
                      />
                    </svg>
                    <p className="text-sm">Start a conversation with AI</p>
                  </div>
                </div>
              ) : (
                chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`mb-4 flex flex-col transition-all duration-200 ${msg.role === "user"
                      ? "items-end"
                      : msg.role === "tool" || msg.role === "network"
                        ? "items-center"
                        : "items-start"
                      }`}
                    onMouseEnter={() => setHoveredMessageIndex(index)}
                    onMouseLeave={() => setHoveredMessageIndex(null)}
                  >
                    {/* Message Bubble */}
                    <Card
                      className={`relative max-w-[80%] px-4 py-3 text-sm rounded-2xl transition-all duration-300 ${msg.role === "network"
                        ? "bg-transparent border-none text-slate-500 italic shadow-none"
                        : msg.role === "user"
                          ? "bg-gradient-to-br from-slate-800 to-slate-900 text-slate-100"
                          : msg.role === "tool"
                            ? "bg-gradient-to-br from-yellow-200 to-yellow-100 text-yellow-900"
                            : "bg-gradient-to-br from-slate-100 to-white text-slate-900"
                        }`}
                    >
                      {msg.role === "tool" ? (
                        <div className="space-y-2">
                          <Badge variant="secondary" className="bg-yellow-200 text-yellow-900">
                            Tool Execution
                          </Badge>
                          <pre className="whitespace-pre-wrap font-mono text-xs text-slate-800">
                            {msg.content}
                          </pre>

                          {/* insertRowsToSheet */}
                          {msg.toolName === "insertRowsToSheet" && msg.payload && (
                            <div className="mt-2 border border-yellow-200 bg-yellow-50 rounded-lg text-xs p-2 space-y-1">
                              <p>
                                <strong>Start Cell:</strong>{" "}
                                {msg.payload.startCell || "End of rows."}
                              </p>
                              <div className="overflow-x-auto rounded-md border border-yellow-100">
                                <table className="table-auto w-full border-collapse text-xs">
                                  <tbody>
                                    {msg.payload.rows?.map((row, rIdx) => (
                                      <tr key={rIdx}>
                                        {row.map((cell, cIdx) => (
                                          <td
                                            key={cIdx}
                                            className="border border-yellow-100 px-2 py-1 text-center"
                                          >
                                            {cell}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* editCells */}
                          {msg.toolName === "editCells" && msg.payload && (
                            <div className="mt-2 border border-blue-200 bg-blue-50 rounded-lg text-xs p-2 space-y-1">
                              <p>
                                <strong>Sheet:</strong>{" "}
                                {msg.payload.sheetName || "Unknown Sheet"}
                              </p>
                              <p>
                                <strong>Range:</strong>{" "}
                                {msg.payload.range || "Not specified"}
                              </p>
                              <div className="overflow-x-auto rounded-md border border-blue-100">
                                <table className="table-auto w-full border-collapse text-xs">
                                  <tbody>
                                    {msg.payload.newValues?.map((row, rIdx) => (
                                      <tr key={rIdx}>
                                        {row.map((cell, cIdx) => (
                                          <td
                                            key={cIdx}
                                            className="border border-blue-100 px-2 py-1 text-center"
                                          >
                                            {cell}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </div>
                      )}
                    </Card>

                    {/* Hover Action Buttons */}
                    {hoveredMessageIndex === index &&
                      HFID &&
                      msg.role !== "tool" &&
                      msg.role !== "network" && (
                        <div className="mt-2 flex space-x-2 opacity-90">
                          {msg.changeMade && (
                            <Button
                              onClick={() => handleRestoreMessage(index)}
                              size="xs"
                              variant="secondary"
                              className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-700/40"
                            >
                              <FaEdit className="w-3 h-3 mr-1" /> Revert
                            </Button>
                          )}
                          <Button
                            onClick={() => handleDeleteMessage(index)}
                            size="xs"
                            variant="secondary"
                            className="bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-700/40"
                          >
                            <FaTrash className="w-3 h-3 mr-1" /> Delete
                          </Button>
                        </div>
                      )}
                  </div>
                ))
              )}
            </ScrollArea>
            {/* <Separator className="bg-slate-800" /> */}
          </Card>

          {/* Input Section */}
          <div className="p-2 flex flex-col space-y-2 bg-slate-950 text-slate-200" style={{ height: '50px' }}>

            {/* Approve Section */}
            {showApproveModal && (
              <div className="w-full p-2 border border-slate-800 rounded-md flex justify-center gap-6 bg-slate-900/70 backdrop-blur">
                {/* Reject */}
                <button
                  onClick={handleCancel}
                  className="flex items-center justify-center w-12 h-12 rounded-full hover:bg-slate-800/70 transition"
                  title="Reject"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                    strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Approve */}
                <button
                  onClick={handleApprove}
                  className="flex items-center justify-center w-12 h-12 rounded-full hover:bg-slate-800/70 transition"
                  title="Approve"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                    strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-emerald-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </button>
              </div>
            )}

            {/* Selected Files Preview */}
            {selectedFilesa.length > 0 && (
              <div className="flex flex-wrap gap-2 border border-slate-800 p-2 rounded-md bg-slate-900 relative">
                {selectedFilesa.map((file) => (
                  <div key={file.fileId} className="relative group">
                    <div className="bg-slate-950 border border-slate-800 rounded-md p-2 shadow-sm hover:shadow-lg transition flex items-center justify-center relative">
                      <FaFileExcel className="w-5 h-5 text-emerald-400" />
                      <button
                        onClick={() =>
                          setSelectedFilesa((prev) => prev.filter((f) => f.fileId !== file.fileId))
                        }
                        className="absolute -top-1 -right-1 p-0.5 bg-slate-900 rounded-full shadow-sm hidden group-hover:block"
                        title="Remove"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                          strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 text-red-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition bg-slate-800 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap pointer-events-none z-10">
                      {file.name}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Modern Input Group */}
            <InputGroup className="bg-slate-900 border border-slate-800 rounded-xl focus-within:ring-2 focus-within:ring-emerald-500/40 transition-all">
              <InputGroupTextarea
                placeholder="Ask, Search or Chat..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (message.trim() !== "") handleSend();
                  }
                }}
                className="bg-transparent text-slate-200 placeholder:text-slate-500 resize-none focus:outline-none"
                rows={1}
              />

              <InputGroupAddon align="block-end" className="flex items-center gap-2">
                {/* Attach Files */}
                <InputGroupButton
                  variant="outline"
                  className="rounded-full"
                  size="icon-xs"
                  onClick={() => setShowFileList(!showFileList)}
                  title="Attach Files"
                >
                  <IconPlus className="text-slate-300" />
                </InputGroupButton>

                {/* File Dropdown */}
                {showFileList && (
                  <div className="absolute bottom-12 left-4 bg-slate-900 border border-slate-800 rounded-xl shadow-lg z-10 w-52 max-h-48 overflow-y-auto">
                    {files.length === 0 ? (
                      <p className="text-slate-500 text-sm p-2 text-center">No files</p>
                    ) : (
                      files.map((file) => (
                        <div
                          key={file.fileId}
                          onClick={() => handleFileSelect(file)}
                          className="px-3 py-2 hover:bg-slate-800 cursor-pointer text-sm flex justify-between items-center"
                        >
                          <span>{file.name}</span>
                          {selectedFilesa.find((f) => f.fileId === file.fileId) && (
                            <span className="text-emerald-400 font-bold">✓</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Mode Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <InputGroupButton variant="ghost" className="text-slate-300 hover:text-white">
                      Auto
                    </InputGroupButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="top"
                    align="start"
                    className="bg-slate-300 border border-slate-800 [--radius:0.95rem]"
                  >
                    <DropdownMenuItem>Auto</DropdownMenuItem>
                    <DropdownMenuItem>Basic</DropdownMenuItem>
                    <DropdownMenuItem>Premium</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <InputGroupText className="text-slate-400">52% used</InputGroupText>
                <Separator orientation="vertical" className="!h-4 bg-slate-700" />

                {/* Send Button */}
                <InputGroupButton
                  variant="default"
                  className="rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 transition"
                  size="icon-xs"
                  disabled={isLoading || message.trim() === ""}
                  onClick={handleSend}
                  title={isLoading ? "AI is thinking..." : "Send"}
                >
                  {isLoading ? (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg"
                      fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                  ) : (
                    <ArrowUpIcon className="text-white" />
                  )}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </SignedIn>

        <SignedOut>
          <div className="flex items-center justify-center h-full text-center p-4">
            <p className="text-gray-600">
              Please <SignInButton redirectTo="/spreadsheet"><div className="text-blue-600 hover:underline">Sing In</div></SignInButton> to
              use AI.
            </p>
          </div>
        </SignedOut>
      </AuthProvider>
    </div>
  );
}

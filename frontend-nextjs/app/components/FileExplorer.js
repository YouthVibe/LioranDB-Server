"use client"
import React, { useState, useEffect } from 'react';
import { FaFileExcel, FaFolder, FaFile, FaChevronRight, FaPlus, FaUpload, FaRegFolder, FaRegFile, FaTrash, FaEdit } from 'react-icons/fa';
import { IconCloud } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { UploadIcon } from "lucide-react";

export function EmptyOutline({ onUploadClick, uploadedFileCount }) {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconCloud />
        </EmptyMedia>
        <EmptyTitle>Cloud Storage Empty</EmptyTitle>
        <EmptyDescription>
          Upload files to your cloud storage to access them anywhere.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm" onClick={onUploadClick} disabled={uploadedFileCount >= 5}>
          Upload Files
        </Button>
      </EmptyContent>
    </Empty>
  )
}

import { SignedIn, SignedOut } from "../utils/AuthWrappers";
import { SignInButton, SignUpButton } from "../utils/AuthButtons";
import { AuthProvider } from "../utils/AuthContext";
import { useAuth } from "../utils/useAuth";
import toast from 'react-hot-toast';

export default function FileExplorer({ files, setFiles, NEXT_PUBLIC_CLERK_BACKEND_URL, setFilesReady }) {
  const [currentPath, setCurrentPath] = useState('/root');
  const [isDragging, setIsDragging] = useState(false);
  const { getToken } = useAuth();
  const fileInputRef = React.useRef(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ visible: false, fileId: null, fileName: "" });
  // const [files, setFiles] = useState([]); // ✅ store files here
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(-1); // -1 means hidden
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileDescription, setUploadFileDescription] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editFileId, setEditFileId] = useState(null);
  const [editFileName, setEditFileName] = useState('');
  const [editFileDescription, setEditFileDescription] = useState('');
  // --- New states for table preview ---
  const [headers, setHeaders] = useState([]); // Array of column headers, e.g. ["Name", "Age", "City"]
  const [rowsData, setRowsData] = useState([]); // Array of rows, e.g. [["Alice", 23, "NY"], ["Bob", 30, "LA"]]
  const [numberRows, setNumberRows] = useState(0); // Total number of rows
  const [numberCols, setNumberCols] = useState(0); // Total number of columns
  const [customAlert, setCustomAlert] = useState({ message: "", visible: false });
  const [uploadedFileCount, setUploadedFileCount] = useState(0);

  const confirmDeleteFile = (fileId, fileName) => {
    setDeleteConfirm({ visible: true, fileId, fileName });
  };
  const handleDeleteClick = async (fileId) => {
    try {
      const token = await getToken();
      const res = await fetch(NEXT_PUBLIC_CLERK_BACKEND_URL + `/file/${fileId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include", // important for HttpOnly cookies
      });

      if (res.ok) {
        // alert("File deleted successfully!");
        toast.success('File deleted successfully!', {
          // optional custom animation
          icon: '✅',
          style: {
            borderRadius: '8px',
            background: '#1f2937',
            color: '#fff',
          },
        });
        setFiles((prevFiles) => prevFiles.filter((file) => file.fileId !== fileId));
        setUploadedFileCount((prevCount) => prevCount - 1);
      } else {
        const data = await res.json();
        toast.error('Delete failed: ' + (data.error || 'Unknown error'), {
          // optional custom animation
          icon: '❌',
          style: {
            borderRadius: '8px',
            background: '#1f2937',
            color: '#fff',
          },
        })
        // alert("Delete failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error deleting file:", err);
      toast.error('Delete failed:' + (err.message || 'Unknown error'), {
        // optional custom animation
        icon: '❌',
        style: {
          borderRadius: '8px',
          background: '#1f2937',
          color: '#fff',
        },
      })
      // alert("Something went wrong while deleting the file!");
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ visible: false, fileId: null, fileName: "" });
  };

  const showCustomAlert = (message) => {
    setCustomAlert({ message, visible: true });
    setTimeout(() => setCustomAlert({ message: "", visible: false }), 3000);
  };

  // ✅ Fetch files when component mounts
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const token = await getToken();
        const res = await fetch(NEXT_PUBLIC_CLERK_BACKEND_URL + `/index`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include", // important for HttpOnly cookies
        });
        const data = await res.json();
        if (res.ok) {
          console.log("Files fetched successfully", data);
          setFiles(data.files || []); // ✅ store in state
          setUploadedFileCount(data.files ? data.files.length : 0);
        } else {
          console.error("Failed to fetch files", data);
        }
        setFilesReady(true);
      } catch (err) {
        console.error("Error fetching files:", err);
        setFilesReady(true);
      }
    };

    fetchFiles();
  }, [getToken]); // re-run if auth changes

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    console.log("Selected file:", selectedFile);
    if (!selectedFile) {
      // If no file is selected (e.g., user cancels the file dialog),
      // ensure the input is reset if it was previously set.
      if (fileInputRef.current) fileInputRef.current.value = null;
      return;
    }

    // ✅ Validate extension
    const allowedExtensions = [".csv", ".xlsx", ".xls"];
    const fileName = selectedFile.name.toLowerCase();
    const isValid = allowedExtensions.some(ext => fileName.endsWith(ext));
    if (!isValid) {
      alert("Only .csv, .xlsx, and .xls files are allowed!");
      // Reset the file input if an invalid file type is selected
      if (fileInputRef.current) fileInputRef.current.value = null;
      return;
    }

    // Validate file size (5 MB limit)
    const maxSize = 5 * 1024 * 1024; // 5 MB in bytes
    if (selectedFile.size > maxSize) {
      // alert("File size must be less than 5 MB!");
      toast.error('File size must be less than 5 MB!', {
        // optional custom animation
        icon: '❌',
        style: {
          borderRadius: '8px',
          background: '#1f2937',
          color: '#fff',
        },
      })
      if (fileInputRef.current) fileInputRef.current.value = null;
      return;
    }

    setFile(selectedFile);
    setUploadFileName(selectedFile.name.slice(0, 30));
    setUploadFileDescription("Uploaded Spreadsheet");
    setShowUploadModal(true);
  };

  const handleUpload = async (uploadFile = file) => {
    if (!uploadFile)
      return toast.error("Please select a file", {
        icon: "❌",
        style: { borderRadius: "8px", background: "#1f2937", color: "#fff" },
      });

    if (uploadFileName.length > 30)
      return toast.error("File name must be <= 30 chars", {
        icon: "❌",
        style: { borderRadius: "8px", background: "#1f2937", color: "#fff" },
      });

    if (uploadFileDescription.length > 200)
      return toast.error("Description must be <= 200 chars", {
        icon: "❌",
        style: { borderRadius: "8px", background: "#1f2937", color: "#fff" },
      });

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("name", uploadFileName);
    formData.append("description", uploadFileDescription);
    formData.append("isWorkbook", "false");

    try {
      const token = await getToken();
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${NEXT_PUBLIC_CLERK_BACKEND_URL}/file/upload`, true);

      // ✅ Allow cookies to be sent cross-origin
      xhr.withCredentials = true;
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            setFiles((prev) => [...prev, data.file]);
            setShowUploadModal(false);
            setUploadFileName("");
            setUploadFileDescription("");
            setUploadProgress(-1);

            toast.success("File uploaded successfully!", {
              icon: "✅",
              style: { borderRadius: "8px", background: "#1f2937", color: "#fff" },
            });
            setUploadedFileCount((prev) => prev + 1);
          } else {
            toast.error("Upload failed: " + (data.error || "Unknown error"), {
              icon: "❌",
              style: { borderRadius: "8px", background: "#1f2937", color: "#fff" },
            });
            setUploadedFileCount((prev) => prev + 1);
          }
        } catch (err) {
          toast.error("Upload failed: Invalid server response", {
            icon: "❌",
            style: { borderRadius: "8px", background: "#1f2937", color: "#fff" },
          });
        }
      };

      xhr.onerror = () =>
        toast.error("Something went wrong during upload!", {
          icon: "❌",
          style: { borderRadius: "8px", background: "#1f2937", color: "#fff" },
        });

      xhr.send(formData);
      setUploadProgress(0);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong: " + (err.message || "Unknown error"), {
        icon: "❌",
        style: { borderRadius: "8px", background: "#1f2937", color: "#fff" },
      });
    }
  };

  // Removed navigateBack and navigateHome functions

  const maxPathLength = 40; // Adjust as needed

  // Removed renderPath function

  // alert(files[0]['name']);

  const handleCancelUpload = () => {
    setShowUploadModal(false);
    setFile(null);
    setUploadFileName('');
    setUploadFileDescription('');
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const handleSubmitUpload = (e) => {
    e.preventDefault();
    handleUpload();
  };

  const handleUpdate = async (fileId) => {
    if (editFileName.length > 30) {
      // alert("File name must be 30 characters or less");
      toast.error('File name must be 30 characters or less', {
        // optional custom animation
        icon: '❌',
        style: {
          borderRadius: '8px',
          background: '#1f2937',
          color: '#fff',
        },
      })
      return;
    }

    if (editFileDescription.length > 200) {
      // alert("Description must be 200 characters or less");
      toast.error('Description must be 200 characters or less', {
        // optional custom animation
        icon: '❌',
        style: {
          borderRadius: '8px',
          background: '#1f2937',
          color: '#fff',
        },
      })
      return;
    }

    try {
      const token = await getToken();
      const res = await fetch(NEXT_PUBLIC_CLERK_BACKEND_URL + `/file/${fileId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include", // important for HttpOnly cookies
        body: JSON.stringify({
          name: editFileName,
          description: editFileDescription,
        }),
      });

      if (res.ok) {
        // alert("File updated successfully!");
        toast.success('File updated successfully!', {
          // optional custom animation
          icon: '✅',
          style: {
            borderRadius: '8px',
            background: '#1f2937',
            color: '#fff',
          },
        })
        setFiles((prevFiles) =>
          prevFiles.map((file) =>
            file.fileId === fileId
              ? { ...file, name: editFileName, description: editFileDescription }
              : file
          )
        );
        setShowEditModal(false);
        setEditFileId(null);
        setEditFileName('');
        setEditFileDescription('');
      } else {
        const data = await res.json();
        // alert("Update failed: " + (data.error || "Unknown error"));
        toast.error('Update failed:' + (data.error || 'Unknown error'), {
          // optional custom animation
          icon: '❌',
          style: {
            borderRadius: '8px',
            background: '#1f2937',
            color: '#fff',
          },
        })
      }
    } catch (err) {
      console.error("Error updating file:", err);
      // alert("Something went wrong while updating the file!");
      toast.error('Something went wrong while updating the file!' + (err.message || 'Unknown error'), {
        // optional custom animation
        icon: '❌',
        style: {
          borderRadius: '8px',
          background: '#1f2937',
          color: '#fff',
        },
      })
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditFileId(null);
    setEditFileName('');
    setEditFileDescription('');
  };

  const handleSubmitEdit = (e) => {
    e.preventDefault();
    handleUpdate(editFileId);
  };

  return (
    <div className="h-full bg-slate-950 border-r p-2 overflow-auto">
      {/* Clerk */}
      <AuthProvider>
        <SignedIn>

          {/* File Explorer */}

          <div
            className={`relative flex flex-col border transition-all duration-200
    ${isDragging ? 'bg-slate-900 border-blue-400' : 'bg-slate-950 border-slate-800'}
    ${uploadedFileCount > 0 ? 'h-16 p-2' : 'h-32 p-4'}
    rounded-lg w-full
  `}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const files = e.dataTransfer.files;
              if (files.length) handleFileChange({ target: { files } });
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
          >
            {/* Top bar with file counter and upload button */}
            <div className="flex justify-between items-center w-full mb-2">
              <div
                className={`text-sm font-medium ${uploadedFileCount === 5
                  ? 'text-red-500'
                  : uploadedFileCount >= 3
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                  }`}
              >
                {uploadedFileCount}/5
              </div>
              <button
                onClick={() => fileInputRef.current.click()}
                className={`p-2 rounded-md transition-colors 
        ${uploadedFileCount >= 5
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-slate-950 text-white hover:bg-slate-900'}
      `}
                disabled={uploadedFileCount >= 5}
              >
                <UploadIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Drop area / placeholder */}
            {uploadedFileCount === 0 && (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                Drag & drop files here or click upload
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={uploadedFileCount >= 5}
            />
          </div>


          {/* ✅ Render Files List */}
          <ul className="space-y-1 mt-2">
            {files.length === 0 ? null : (
              files.map((file) => (
                <FileItem
                  key={file.fileId}
                  name={file.name}
                  id={file.fileId}
                  getToken={getToken}
                  setFiles={setFiles}
                  setShowEditModal={setShowEditModal}
                  setEditFileId={setEditFileId}
                  setEditFileName={setEditFileName}
                  setEditFileDescription={setEditFileDescription}
                  description={file.description}
                  confirmDeleteFile={confirmDeleteFile}
                  setHeaders={setHeaders}
                  setNumberCols={setNumberCols}
                  setNumberRows={setNumberRows}
                  setRowsData={setRowsData}
                  NEXT_PUBLIC_CLERK_BACKEND_URL={NEXT_PUBLIC_CLERK_BACKEND_URL}
                />
              ))
            )}
          </ul>
          {/* Floating MacOS-style Upload Modal */}
          {showUploadModal && (
            <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex justify-center items-center z-50">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 overflow-hidden">
                {/* Window Title Bar */}
                <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-300">
                  <div className="flex space-x-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-700">Upload File</h3>
                  <button
                    onClick={handleCancelUpload}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmitUpload} className="p-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      File Name <span className="text-xs text-gray-500">{uploadFileName.length}/30</span>
                    </label>
                    <input
                      type="text"
                      value={uploadFileName}
                      onChange={(e) => setUploadFileName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      maxLength={30}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-xs text-gray-500">{uploadFileDescription.length}/200</span>
                    </label>
                    <textarea
                      value={uploadFileDescription}
                      onChange={(e) => setUploadFileDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 min-h-[80px] max-h-[160px]"
                      rows={3}
                      maxLength={200}
                    />
                  </div>

                  {/* Progress Bar Placeholder */}
                  {uploadProgress >= 0 && (
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleCancelUpload}
                      className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Upload File
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
              <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.3)] w-full max-w-lg h-[80vh] p-6 flex flex-col border border-gray-200">

                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Edit File Details</h3>
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-500 hover:text-red-500 transition"
                  >
                    ✕
                  </button>
                </div>

                {/* Form + Table Container */}
                <div className="flex-1 overflow-auto custom-scrollbar pr-2">

                  {/* File Info Form */}
                  <form onSubmit={handleSubmitEdit} className="space-y-4">

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        File Name <span className="text-xs text-gray-500">{editFileName.length}/30</span>
                      </label>
                      <input
                        type="text"
                        value={editFileName}
                        onChange={(e) => setEditFileName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        maxLength={30}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description <span className="text-xs text-gray-500">{(editFileDescription || '').length}/200</span>
                      </label>
                      <textarea
                        value={editFileDescription}
                        onChange={(e) => setEditFileDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                        rows={3}
                        maxLength={200}
                        style={{ minHeight: '60px', maxHeight: '160px' }}
                      />
                    </div>

                    {/* Rows & Columns Info */}
                    <p className="text-gray-800 font-medium">
                      <strong>Rows:</strong> {numberRows} &nbsp; | &nbsp; <strong>Columns:</strong> {numberCols}
                    </p>

                    {/* File Preview Table */}
                    <div className="overflow-auto max-h-60 border border-gray-300 rounded-md bg-gray-50 custom-scrollbar">
                      <table className="w-full text-sm text-gray-800 border-collapse">
                        <thead className="bg-gray-900 text-white sticky top-0">
                          <tr>
                            {Array.isArray(headers) && headers.map((header, idx) => (
                              <th key={`${header}-${idx}`} className="px-3 py-2 border border-gray-300 text-left">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(rowsData) && rowsData.map((row, rIdx) => (
                            <tr key={rIdx} className="even:bg-gray-100">
                              {Object.values(row).map((cell, cIdx) => (
                                <td key={cIdx} className="px-3 py-1 border border-gray-300">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end space-x-2 mt-4">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Update File
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </SignedIn>
        {/* Custom Alert */}
        {customAlert.visible && (
          <div className="fixed bottom-5 right-5 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-up">
            {customAlert.message}
          </div>
        )}
        {deleteConfirm.visible && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-300">
                <h3 className="text-sm font-medium text-gray-700">Confirm Delete</h3>
                <button onClick={cancelDelete} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>

              {/* Modal Content */}
              <div className="p-4 text-center">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to delete <span className="font-medium">{deleteConfirm.fileName}</span>?
                </p>

                {/* Buttons */}
                <div className="flex justify-center gap-4">
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteClick(deleteConfirm.fileId);
                      cancelDelete();
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <SignedOut>
          <div className="flex items-center justify-center h-full text-center p-4">
            <p className="text-gray-600">
              Please <SignInButton redirectTo='/spreadsheet'><div className="text-blue-600 hover:underline">Sing In</div></SignInButton> to upload and manage your files.
            </p>
          </div>
        </SignedOut>
      </AuthProvider>
    </div>
  );
}

export function FileItem({
  name,
  id,
  description,
  getToken,
  setFiles,
  setShowEditModal,
  setEditFileId,
  setEditFileName,
  setEditFileDescription,
  NEXT_PUBLIC_CLERK_BACKEND_URL,
  confirmDeleteFile,
  setHeaders,
  setRowsData,
  setNumberRows,
  setNumberCols,
}) {
  const displayName = name.length > 5 ? name.slice(0, 5) + '...' : name;

  const handleDelete = async (fileId) => {
    confirmDeleteFile(fileId, name);
  };

  const handleEdit = async (fileId, currentName, currentDescription) => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${NEXT_PUBLIC_CLERK_BACKEND_URL}/file/preview/${fileId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include", // important for HttpOnly cookies
        },
      );
      const data = await response.json();
      setHeaders(data.file.headers);
      setRowsData(data.file.data);
      setNumberRows(data.file.rows);
      setNumberCols(data.file.columns);
    } catch (error) {
      console.error("Error fetching file details:", error);
    }

    setShowEditModal(true);
    setEditFileId(fileId);
    setEditFileName(currentName);
    setEditFileDescription(currentDescription);
  };

  return (
    <li className="flex items-center justify-between p-2 rounded-md transition-all">
      <div className="flex items-center">
        <FaFileExcel className="w-5 h-5 mr-2 text-slate-300" />
        <span className="font-medium text-slate-400">{displayName}</span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          className="p-1 rounded hover:bg-gray-200"
          title="Edit"
          onClick={() => handleEdit(id, name, description)}
        >
          <FaEdit className="w-4 h-4 text-gray-700" />
        </button>
        <button
          className="p-1 rounded hover:bg-gray-200"
          title="Delete"
          onClick={() => handleDelete(id)}
        >
          <FaTrash className="w-4 h-4 text-red-500" />
        </button>
      </div>
    </li>
  );
}

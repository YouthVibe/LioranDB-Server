"use client";
import { useEffect, useState } from "react";

export default function ApprovalModal({ userId, socket }) {
  const [requests, setRequests] = useState([]); // store pending approvals

  useEffect(() => {
    if (!userId) return;

    // 🔔 Listen to requests from server
    const event = `requestApproval:${userId}`;
    socket.on(event, (data) => {
      console.log("📩 Received approval request:", data);
      setRequests((prev) => [...prev, data]);
    });

    return () => {
      socket.off(event);
    };
  }, [userId]);

  // 🟢 Approve
  const handleApprove = (index) => {
    const req = requests[index];
    socket.emit(`approval:${userId}`, { approved: true, tool: req.tool, payload: req.payload });
    setRequests((prev) => prev.filter((_, i) => i !== index));
  };

  // 🔴 Deny
  const handleDeny = (index) => {
    socket.emit(`cancel:${userId}`);
    setRequests((prev) => prev.filter((_, i) => i !== index));
  };

  // 🛑 Stop agent entirely
  const handleStop = () => {
    socket.emit(`stop:${userId}`);
    setRequests([]); // clear all pending
  };

  if (requests.length === 0) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full space-y-4">
        <h2 className="text-xl font-bold text-gray-800">🧠 AI Tool Request</h2>
        {requests.map((req, index) => (
          <div key={index} className="border rounded-lg p-4 bg-gray-50">
            <p className="text-gray-700 mb-2">
              ⚙️ Tool: <strong>{req.tool}</strong>
            </p>
            <p className="text-gray-600 text-sm whitespace-pre-wrap">
              {req.message}
            </p>
            {req.payload && (
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto mt-2">
                {JSON.stringify(req.payload, null, 2)}
              </pre>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleApprove(index)}
                className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2"
              >
                ✅ Approve
              </button>
              <button
                onClick={() => handleDeny(index)}
                className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-4 py-2"
              >
                ❌ Deny
              </button>
              <button
                onClick={handleStop}
                className="bg-gray-500 hover:bg-gray-600 text-white rounded-lg px-4 py-2"
              >
                🛑 Stop Agent
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

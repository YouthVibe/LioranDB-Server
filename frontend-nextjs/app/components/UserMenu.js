"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiSettings, FiLogOut } from "react-icons/fi";
import { useAuth } from "../utils/AuthContext";

export default function UserMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();
  const { user, refreshUser } = useAuth(); // ✅ now get refreshUser

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const handleLogout = async () => {
    try {
      await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      // ✅ Instantly clear user state in frontend
      await refreshUser();

      // ✅ Then redirect to homepage
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSettings = () => {
    router.push("/settings");
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null; // Hide if not logged in

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* User Avatar Button */}
      <button
        onClick={toggleMenu}
        className="flex items-center justify-center w-10 h-10 rounded-full hover:ring-2 hover:ring-gray-500 transition-all duration-200 focus:outline-none"
      >
        <img
          src={user.picture || "/icon.png"}
          alt={user.name || "User"}
          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
          onError={(e) => {
            e.currentTarget.src = "/icon.png"; // fallback image
          }}
        />

      </button>

      {/* Dropdown Menu */}
      <div
        className={`absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden transition-all duration-300 ease-out z-50
          ${menuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 invisible"}`}
      >
        <button
          onClick={handleSettings}
          className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 transition-colors duration-150"
        >
          <FiSettings className="text-black" />
          <span className="text-black">Settings</span>
        </button>

        <hr className="border-gray-200" />

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 transition-colors duration-150"
        >
          <FiLogOut className="text-black" />
          <span className="text-black">Logout</span>
        </button>
      </div>
    </div>
  );
}

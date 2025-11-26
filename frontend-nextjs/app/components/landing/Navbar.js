"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { SignedIn, SignedOut } from "../../utils/AuthWrappers";
import UserMenu from "../UserMenu";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false); // mobile
  const [isMobile, setIsMobile] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // ref to store hide timeout id so we can cancel it when re-entering
  const hideTimeoutRef = useRef(null);

  const links = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Testimonials", href: "#testimonials" },
  ];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Called when mouse enters button or dropdown — cancel any pending hide and open
  function handleEnter() {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setDropdownOpen(true);
  }

  // Called when mouse leaves button or dropdown — start short hide timer
  function handleLeave() {
    // small delay prevents flicker while moving between button and menu
    hideTimeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
      hideTimeoutRef.current = null;
    }, 120); // 80-150ms feels natural — tweak if needed
  }

  return (
    <nav className="bg-black/95 text-white sticky top-0 z-50 shadow-md border-b border-white/10">
      <div className="container mx-auto flex justify-between items-center p-4">
        {/* Brand */}
        <Link href="/" className="text-2xl font-bold text-white hover:text-gray-300 transition duration-300">
          Hushar Spreadsheet
        </Link>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Desktop dropdown wrapper that contains both button + menu.
              We attach enter/leave to this wrapper so there's no gap. */}
          {!isMobile ? (
            <div
              className="relative"
              onMouseEnter={handleEnter}
              onMouseLeave={handleLeave}
              // also handle focus/blur for keyboard accessibility
              onFocus={handleEnter}
              onBlur={handleLeave}
            >
              <button
                className="flex items-center space-x-1 px-3 py-2 hover:text-gray-300 transition duration-300"
                aria-expanded={dropdownOpen}
                aria-haspopup="menu"
              >
                <span>Menu</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Keep dropdown immediately adjacent: top-full & mt-0 to avoid gap */}
              {dropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-0 w-48 bg-black border border-white/10 rounded-lg shadow-lg overflow-hidden animate-fadeIn z-50"
                  role="menu"
                >
                  {links.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="block px-4 py-2 hover:bg-white/10 transition"
                      role="menuitem"
                      tabIndex={0}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Mobile: hamburger */}
              <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu" className="focus:outline-none">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Fullscreen Mobile Menu */}
              <div
                className={`fixed inset-0 bg-black z-50 transform transition-transform duration-300 ease-in-out ${
                  menuOpen ? "translate-x-0" : "-translate-x-full"
                } flex flex-col items-center justify-center space-y-8`}
              >
                <button onClick={() => setMenuOpen(false)} className="absolute top-6 right-6 text-white focus:outline-none" aria-label="Close menu">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {links.map((link) => (
                  <Link key={link.name} href={link.href} onClick={() => setMenuOpen(false)} className="text-2xl text-gray-200 hover:text-white transition duration-300">
                    {link.name}
                  </Link>
                ))}

                <SignedOut>
                  <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="text-2xl text-gray-200 hover:text-white transition duration-300">
                    Login
                  </Link>
                </SignedOut>

                <Link href="/spreadsheet" onClick={() => setMenuOpen(false)} className="bg-white hover:bg-gray-200 text-black font-semibold px-6 py-3 rounded-full transition duration-300 shadow">
                  Launch App
                </Link>
              </div>
            </>
          )}
          {/* Login link (signed out, PC only) */}
          <SignedOut>
            {!isMobile && (
              <Link href="/auth/login" className="hover:text-gray-300 transition duration-300 mr-10">
                Login
              </Link>
            )}
          </SignedOut>
          {/* Launch Button */}
          <Link href="/spreadsheet" className="hidden md:inline bg-white hover:bg-gray-200 text-black font-semibold px-4 py-2 rounded-full transition duration-300 shadow">
            Launch App
          </Link>

          {/* User Menu (if signed in) */}
          <SignedIn>
            <UserMenu />
          </SignedIn>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.12s ease-out;
        }
      `}</style>
    </nav>
  );
}

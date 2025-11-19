"use client";

import Link from "next/link";
import { FaInstagram, FaGithub } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-black text-white py-10 border-t-1 border-white/10">
      <div className="container mx-auto px-4 text-center">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="mb-4 md:mb-0">
            <h3 className="text-2xl font-bold text-white">Hushar Spreadsheet</h3>
            <p className="text-gray-400">Simplify your data management.</p>
          </div>

          {/* Social Icons */}
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a
              href="https://www.instagram.com/hushar.spreadsheet/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition duration-300"
            >
              <FaInstagram size={24} />
            </a>
            <a
              href="https://github.com/YouthVibe/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition duration-300"
            >
              <FaGithub size={24} />
            </a>
          </div>
        </div>

        <p className="text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Hushar Spreadsheet. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

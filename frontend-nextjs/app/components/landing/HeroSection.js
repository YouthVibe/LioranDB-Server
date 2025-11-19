"use client";

import { useRouter } from "next/navigation";
import SpreadsheetGrid from "../spreadsheet/SpreadsheetGrid";
import SpreadsheetMenu from "../spreadsheet/SpreadsheetMenu";
import SpreadsheetToolbar from "../spreadsheet/SpreadsheetToolbar";
import { SpreadsheetProvider } from "../spreadsheet/SpreadsheetContext";
import { motion } from "framer-motion";

export default function HeroSection() {
  const router = useRouter();

  return (
    <section className="relative min-h-screen w-full flex flex-col items-center justify-center bg-black text-white px-4 py-10 overflow-y-auto">
      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center justify-center text-center space-y-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-5xl font-bold text-gray-100 leading-tight"
        >
          Convert your spreadsheet mess into chill
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-gray-400 text-sm md:text-base max-w-2xl leading-relaxed"
        >
          Hushar Spreadsheet — a lightweight, AI-powered workspace built for
          speed, focus, and clarity.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-full max-w-4xl mt-8 p-3 md:p-6 rounded-xl bg-[#0d0d0d] border border-[#1f1f1f] shadow-lg"
        // style={{ height: "500px" }} // ✅ fixed height
        >
          <SpreadsheetProvider>
            {/* Make this take 100% of parent (ResizablePanel) */}
            <div className="flex flex-col w-full h-full bg-slate-950 text-gray-200">

              {/* Toolbar fixed at top */}
              <div className="sticky top-0 z-50 bg-slate-950 border-b border-slate-800">
                <SpreadsheetToolbar />
              </div>

              {/* Only this area scrolls */}
              <div className="flex-1 overflow-auto pb-2">
                <SpreadsheetGrid rows={25} cols={10} />
              </div>
            </div>
          </SpreadsheetProvider>
        </motion.div>


        <motion.button
          onClick={() => router.push("/spreadsheet")}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="mt-6 px-5 py-3 text-sm md:text-base font-semibold rounded-lg bg-white text-black hover:bg-gray-200 transition"
        >
          Try Hushar Spreadsheet 🚀
        </motion.button>
      </div>
    </section>
  );
}

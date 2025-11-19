// app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import { ClerkProvider } from "@clerk/nextjs";
import { AuthProvider } from "./utils/AuthContext";
// app/layout.js
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from "@/components/theme-provider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Hushar Spreadsheet",
  description:
    "हुशार Spreadsheet is an AI-powered tool that helps teachers fill Excel forms in minutes, saving time and effort with smart, simple, and accurate automation.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  border: '1px solid #4ade80',
                  padding: '16px',
                  color: '#4ade80',
                },
                success: {
                  iconTheme: {
                    primary: '#4ade80',
                    secondary: '#ffffff',
                  },
                },
              }}
            />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

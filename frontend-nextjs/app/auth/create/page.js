"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SignedIn, SignedOut } from "../../utils/AuthWrappers";
import { SignUpButton } from "../../utils/AuthButtons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FcGoogle } from "react-icons/fc";
import { ArrowLeft, Home } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useEffect, useState } from "react";

export default function Page() {
  const router = useRouter();
  const [disableCard, setDisableCard] = useState(false);

  // ✅ Prevent memory leaks on unmount
  useEffect(() => {
    let redirectTimeout;
    return () => clearTimeout(redirectTimeout);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black p-4">
      {/* 🔙 Top Navigation Buttons */}
      <div className="absolute top-6 left-6 flex gap-3 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-gray-300 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/")}
          className="text-gray-300 hover:text-white hover:bg-white/10"
        >
          <Home className="h-5 w-5" />
        </Button>
      </div>

      {/* 🧾 When user is NOT signed in */}
      <SignedOut>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: disableCard ? 0.5 : 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`w-full max-w-sm ${
            disableCard ? "pointer-events-none" : "pointer-events-auto"
          }`}
        >
          <Card className="backdrop-blur-xl bg-neutral-900/60 border-white/10 text-white shadow-2xl rounded-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold tracking-tight">
                Create Your Account ✨
              </CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                Sign up to start using Hushar Spreadsheet
              </p>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
              {/* 🔑 Google Signup Button */}
              <SignUpButton redirectTo="/spreadsheet">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 bg-white text-gray-800 hover:bg-gray-100 transition"
                >
                  <FcGoogle className="text-xl" />
                  Sign up with Google
                </Button>
              </SignUpButton>

              {/* 🔁 Go to Login */}
              <Button
                variant="secondary"
                onClick={() => router.push("/auth/login")}
                className="w-full bg-transparent border border-white/20 hover:bg-white/10 transition"
                disabled={disableCard}
              >
                Already have an account?
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </SignedOut>

      {/* 🚀 When user is already signed in */}
      <SignedIn>
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md z-30"
          >
            <Spinner className="w-12 h-12 text-white mb-4 animate-spin" />
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-white text-lg font-medium"
            >
              Redirecting to the app...
            </motion.p>
          </motion.div>
        </AnimatePresence>

        <RedirectToApp />
      </SignedIn>
    </div>
  );
}

// 🧭 Safe Redirect after Sign-In
function RedirectToApp() {
  const router = useRouter();
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace("/spreadsheet");
    }, 1500);
    return () => clearTimeout(timeout);
  }, [router]);

  return null;
}

"use client";

export const metadata = {
  title: "HuShar Spreadsheet - Simplify Your Data Management",
  description:
    "HuShar Spreadsheet helps teachers automate data entry, saving hours every week. Easy to use, secure, and reliable.",
  openGraph: {
    title: "HuShar Spreadsheet",
    description:
      "Simplify your spreadsheets with HuShar. Automate data entry and manage your data effortlessly.",
    type: "website",
    url: "https://husharspreadsheet.com",
    images: "https://husharspreadsheet.com/og-image.jpg",
  },
};

import Navbar from "./components/landing/Navbar";
import HeroSection from "./components/landing/HeroSection";
import FeaturesSection from "./components/landing/FeaturesSection";
import HowItWorksSection from "./components/landing/HowItWorksSection";
import TestimonialsSection from "./components/landing/TestimonialsSection";
import CallToActionSection from "./components/landing/CallToActionSection";
import Footer from "./components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CallToActionSection />
      <Footer />
    </div>
  );
}

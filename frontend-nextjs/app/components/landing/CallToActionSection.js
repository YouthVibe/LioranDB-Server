"use client";

import { useRouter } from "next/navigation";

export default function CallToActionSection() {
  const router = useRouter();

  return (
    <section className="py-20 bg-black text-white text-center">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
          Ready to Simplify Your Work?
        </h2>
        <p className="text-lg md:text-xl mb-8 text-gray-300 max-w-2xl mx-auto">
          Join hundreds of users who are already saving hours every week with Hushar Spreadsheet.
        </p>
        <button
          onClick={() => router.push("/spreadsheet")}
          className="bg-white hover:bg-gray-200 text-black font-semibold px-8 py-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
        >
          Try Hushar Spreadsheet Now
        </button>
      </div>
    </section>
  );
}

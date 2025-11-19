"use client";

import { FaUpload, FaMagic, FaDownload } from "react-icons/fa";

const steps = [
  {
    icon: <FaUpload className="text-4xl text-blue-400" />,
    title: "Upload or Input Data",
    description:
      "Easily upload your existing spreadsheets or input data directly into our platform.",
  },
  {
    icon: <FaMagic className="text-4xl text-green-400" />,
    title: "Fills the Spreadsheet Automatically",
    description:
      "Our intelligent system analyzes your data and fills the spreadsheet with accuracy.",
  },
  {
    icon: <FaDownload className="text-4xl text-purple-400" />,
    title: "Download or Continue Editing",
    description:
      "Once completed, download your filled spreadsheet or continue editing within the app.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 bg-black text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-12 text-white">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-10">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-neutral-900 p-8 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 ease-in-out transform hover:-translate-y-2"
            >
              <div className="mb-4 flex justify-center">{step.icon}</div>
              <h3 className="text-xl md:text-2xl font-semibold mb-4 text-white">
                {step.title}
              </h3>
              <p className="text-gray-400 text-sm md:text-base">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

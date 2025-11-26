"use client";

import { FaLaptop, FaFileExcel, FaShieldAlt, FaCogs } from "react-icons/fa";

const features = [
  {
    icon: <FaCogs className="text-4xl text-blue-400" />,
    title: "Powerful Automation",
    description: "Automate data entry and complex calculations with intelligent tools.",
  },
  {
    icon: <FaLaptop className="text-4xl text-green-400" />,
    title: "Easy-to-use Interface",
    description: "Intuitive design ensures a smooth and efficient user experience.",
  },
  {
    icon: <FaFileExcel className="text-4xl text-purple-400" />,
    title: "Export & Download Excel/CSV",
    description: "Seamlessly export your data in various formats for further use.",
  },
  {
    icon: <FaShieldAlt className="text-4xl text-red-400" />,
    title: "Secure & Reliable",
    description: "Your data is protected with top-tier security and reliability.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-black text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-12 text-white">
          Key Features
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-neutral-900 p-8 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 ease-in-out transform hover:-translate-y-2"
            >
              <div className="mb-4 flex justify-center">{feature.icon}</div>
              <h3 className="text-xl md:text-2xl font-semibold mb-4 text-white">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm md:text-base">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

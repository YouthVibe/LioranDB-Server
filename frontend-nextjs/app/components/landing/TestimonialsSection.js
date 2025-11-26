"use client";

const testimonials = [
  {
    quote: "Hushar cut my Excel work from 2 hrs to 15 min—stress gone!",
    author: "Raj Waghmarae, Zilla Parishad Teacher",
  },
  {
    quote: "Filling data is now 5× faster; my clerk life just got easier.",
    author: "Ravi Raipura, Govt Bank Clerk",
  },
  {
    quote: "Real-world sheets that took hours now wrap in minutes.",
    author: "Priya Deshmukh, Data Entry Operator",
  },
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 bg-black text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-12 text-white">
          What Users Say
        </h2>
        <div className="grid md:grid-cols-3 gap-10">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-neutral-900 p-8 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 ease-in-out transform hover:-translate-y-2"
            >
              <p className="text-lg md:text-xl italic text-gray-300 mb-4">
                "{testimonial.quote}"
              </p>
              <p className="font-semibold text-gray-200">- {testimonial.author}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

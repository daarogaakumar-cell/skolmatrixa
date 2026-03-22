"use client";

import { useState, useEffect } from "react";

const QUOTES = [
  {
    text: "Education is the most powerful weapon which you can use to change the world.",
    author: "Nelson Mandela",
  },
  {
    text: "The beautiful thing about learning is that nobody can take it away from you.",
    author: "B.B. King",
  },
  {
    text: "Education is not preparation for life; education is life itself.",
    author: "John Dewey",
  },
  {
    text: "The mind is not a vessel to be filled, but a fire to be kindled.",
    author: "Plutarch",
  },
  {
    text: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    author: "Mahatma Gandhi",
  },
  {
    text: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin",
  },
  {
    text: "The roots of education are bitter, but the fruit is sweet.",
    author: "Aristotle",
  },
  {
    text: "Intelligence plus character — that is the goal of true education.",
    author: "Martin Luther King Jr.",
  },
  {
    text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.",
    author: "Benjamin Franklin",
  },
  {
    text: "The only person who is educated is the one who has learned how to learn and change.",
    author: "Carl Rogers",
  },
  {
    text: "Education breeds confidence. Confidence breeds hope. Hope breeds peace.",
    author: "Confucius",
  },
  {
    text: "A teacher affects eternity; he can never tell where his influence stops.",
    author: "Henry Adams",
  },
];

export function RotatingQuotes() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % QUOTES.length);
        setVisible(true);
      }, 600);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const quote = QUOTES[index];

  return (
    <div className="relative min-h-35">
      <div
        className="transition-all duration-500 ease-in-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(8px)",
        }}
      >
        <div className="font-serif text-4xl leading-none text-amber-400/40 select-none">
          &ldquo;
        </div>
        <blockquote className="mt-1 text-[15px] font-medium leading-relaxed text-white/90 tracking-wide">
          {quote.text}
        </blockquote>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-px flex-1 max-w-10 bg-amber-400/40" />
          <p className="text-sm font-semibold text-amber-300/90">
            {quote.author}
          </p>
        </div>
      </div>

      {/* Progress dots */}
      <div className="mt-5 flex gap-1.5">
        {QUOTES.map((_, i) => (
          <div
            key={i}
            className="h-1 rounded-full transition-all duration-500"
            style={{
              width: i === index ? 20 : 4,
              backgroundColor:
                i === index
                  ? "rgba(251, 191, 36, 0.7)"
                  : "rgba(255, 255, 255, 0.15)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

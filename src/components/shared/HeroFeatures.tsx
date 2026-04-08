"use client";

import { useEffect, useState } from "react";
import { GraduationCap, ClipboardCheck, Wallet, FileText, Bell } from "lucide-react";

const ITEMS = [
  { icon: GraduationCap, text: "Smart Student & Staff Management" },
  { icon: ClipboardCheck, text: "Automated Attendance & Analytics" },
  { icon: Wallet, text: "Fee Collection & Financial Tracking" },
  { icon: FileText, text: "Exam Scheduling & Result Management" },
  { icon: Bell, text: "Instant WhatsApp & Push Notifications" },
] as const;

/** Reveals feature bullet points one-by-one with JS-driven opacity+translate transitions */
export default function HeroFeatures() {
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (revealed >= ITEMS.length) return;
    // first item waits a bit for hero text to finish animating, then each subsequent item is faster
    const delay = revealed === 0 ? 1200 : 850;
    const t = setTimeout(() => setRevealed((v) => v + 1), delay);
    return () => clearTimeout(t);
  }, [revealed]);

  return (
    <ul className="mt-8 space-y-3.5">
      {ITEMS.map(({ icon: Icon, text }, i) => (
        <li
          key={text}
          className="flex items-center gap-3 text-white"
          style={{
            opacity: i < revealed ? 1 : 0,
            transform: i < revealed ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Icon className="h-4 w-4 text-yellow-300" />
          </div>
          <span className="text-[15px] font-medium">{text}</span>
        </li>
      ))}
    </ul>
  );
}

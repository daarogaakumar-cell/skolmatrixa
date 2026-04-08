"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Users,
  ClipboardCheck,
  Wallet,
  Award,
  Bell,
  FileText,
  Clock,
} from "lucide-react";

/* ─── Panel 1: Institution Overview ─── */
function OverviewPanel() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: GraduationCap, label: "2,847 Students",   sub: "Active enrollment",  color: "bg-blue-50 text-blue-600" },
          { icon: Users,         label: "156 Staff",         sub: "Teachers & admin",   color: "bg-orange-50 text-orange-500" },
          { icon: ClipboardCheck,label: "94.2% Attendance", sub: "Today's rate",        color: "bg-amber-50 text-amber-600" },
          { icon: Wallet,        label: "₹8.4L Collected",  sub: "This month fees",    color: "bg-blue-50 text-blue-600" },
          { icon: Award,         label: "12 Exams",          sub: "Scheduled this term",color: "bg-purple-50 text-purple-600" },
          { icon: Bell,          label: "340 Notices",       sub: "Sent this month",    color: "bg-pink-50 text-pink-500" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3 transition-all hover:bg-white hover:shadow-sm"
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
              <item.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">{item.label}</p>
              <p className="text-[10px] text-gray-400">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {[
          { label: "Fee Collection Progress",  pct: 78, color: "bg-blue-500" },
          { label: "Monthly Attendance Goal",  pct: 92, color: "bg-amber-500" },
          { label: "Homework Completion",       pct: 85, color: "bg-pink-500" },
        ].map((bar) => (
          <div key={bar.label}>
            <div className="mb-1 flex justify-between">
              <span className="text-[10px] font-medium text-gray-400">{bar.label}</span>
              <span className="text-[10px] font-bold text-gray-600">{bar.pct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${bar.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ─── Panel 2: Fee Analytics ─── */
function FeePanel() {
  return (
    <>
      <div className="mb-5 grid grid-cols-3 gap-2">
        {[
          { label: "Total Due",  value: "₹12.6L", color: "text-gray-900",   bg: "bg-gray-50 border-gray-100" },
          { label: "Collected",  value: "₹8.4L",  color: "text-blue-600",   bg: "bg-blue-50 border-blue-100" },
          { label: "Pending",    value: "₹4.2L",  color: "text-orange-500", bg: "bg-orange-50 border-orange-100" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-3 text-center ${s.bg}`}>
            <p className="text-[10px] font-medium text-gray-400">{s.label}</p>
            <p className={`mt-0.5 text-sm font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-300">Class-wise Collection</p>
      <div className="space-y-2.5">
        {[
          { cls: "Class 10", pct: 92, amount: "₹1.8L" },
          { cls: "Class 9",  pct: 78, amount: "₹1.5L" },
          { cls: "Class 8",  pct: 85, amount: "₹1.6L" },
          { cls: "Class 7",  pct: 70, amount: "₹1.2L" },
        ].map((row) => (
          <div key={row.cls} className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-[10px] font-semibold text-gray-700">{row.cls}</span>
            <div className="flex-1 h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${row.pct}%` }} />
            </div>
            <span className="w-12 text-right text-[10px] font-bold text-gray-600">{row.amount}</span>
          </div>
        ))}
      </div>

      <p className="mb-3 mt-5 text-[11px] font-bold uppercase tracking-wide text-gray-300">Recent Payments</p>
      <div className="space-y-2">
        {[
          { name: "Arjun Mehta", cls: "Class 10-A", amount: "₹4,200" },
          { name: "Priya Singh", cls: "Class 8-B",  amount: "₹3,800" },
          { name: "Rahul Verma", cls: "Class 9-A",  amount: "₹4,200" },
        ].map((p) => (
          <div key={p.name} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100">
                <span className="text-[10px] font-bold text-blue-600">{p.name[0]}</span>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-800">{p.name}</p>
                <p className="text-[9px] text-gray-400">{p.cls}</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-blue-600">{p.amount}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* ─── Panel 3: Academics & Exams ─── */
function AcademicsPanel() {
  return (
    <>
      <div className="mb-5 grid grid-cols-3 gap-2">
        {[
          { label: "Avg Score",  value: "82.4%",   color: "text-blue-600",  bg: "bg-blue-50 border-blue-100" },
          { label: "Pass Rate",  value: "96.2%",   color: "text-green-600", bg: "bg-green-50 border-green-100" },
          { label: "Upcoming",   value: "4 Exams", color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-3 text-center ${s.bg}`}>
            <p className="text-[10px] font-medium text-gray-400">{s.label}</p>
            <p className={`mt-0.5 text-sm font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-300">Class Performance</p>
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { cls: "Class 10", score: 86, grade: "A",  trend: "+2.4%" },
          { cls: "Class 9",  score: 79, grade: "B+", trend: "+1.1%" },
          { cls: "Class 8",  score: 83, grade: "A-", trend: "+3.2%" },
          { cls: "Class 7",  score: 77, grade: "B+", trend: "+0.8%" },
        ].map((c) => (
          <div key={c.cls} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-gray-500">{c.cls}</span>
              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">{c.grade}</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{c.score}%</p>
            <p className="mt-0.5 text-[9px] font-semibold text-green-600">↑ {c.trend} vs last term</p>
          </div>
        ))}
      </div>

      <p className="mb-3 mt-5 text-[11px] font-bold uppercase tracking-wide text-gray-300">Upcoming Exams</p>
      <div className="space-y-2">
        {[
          { subject: "Mathematics", cls: "Class 10", date: "Apr 15" },
          { subject: "Science",     cls: "Class 9",  date: "Apr 17" },
          { subject: "English",     cls: "Class 8",  date: "Apr 19" },
        ].map((e) => (
          <div key={e.subject + e.cls} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100">
                <FileText className="h-3 w-3 text-amber-600" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-800">{e.subject}</p>
                <p className="text-[9px] text-gray-400">{e.cls}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1">
              <Clock className="h-2.5 w-2.5 text-amber-600" />
              <span className="text-[9px] font-bold text-amber-700">{e.date}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ─── Metadata for each panel ─── */
const PANEL_META = [
  { subtitle: "SkolMatrixa Platform",     title: "Institution Overview" },
  { subtitle: "Monthly Financial Report", title: "Fee Analytics"        },
  { subtitle: "Academic Performance",     title: "Exams & Scores"       },
] as const;

/* ─── Main export ─── */
export default function AboutPanel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((p) => (p + 1) % 3), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/10">
      {/* Header */}
      <div className="bg-blue-600 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-medium text-blue-200">{PANEL_META[active].subtitle}</p>
            <p className="text-base font-semibold text-white">{PANEL_META[active].title}</p>
          </div>
          <div className="ml-auto flex items-center gap-2 rounded-full bg-white/15 px-3 py-1">
            <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
            <span className="text-xs font-medium text-white">Live</span>
          </div>
        </div>
        {/* Progress dots */}
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {PANEL_META.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? "w-6 bg-white" : "w-1.5 bg-white/35 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Panel body — key forces remount & triggers animate-fade-in */}
      <div key={active} className="animate-fade-in p-6">
        {active === 0 && <OverviewPanel />}
        {active === 1 && <FeePanel />}
        {active === 2 && <AcademicsPanel />}
      </div>
    </div>
  );
}

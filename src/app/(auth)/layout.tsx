import {
  BookOpen,
  GraduationCap,
  Award,
  Users,
  ClipboardCheck,
  Wallet,
  Bell,
  ArrowLeft,
  Shield,
  Zap,
  CheckCircle2,
  Lock,
  BarChart3,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { RotatingQuotes } from "@/components/shared/rotating-quotes";

const FEATURES = [
  {
    icon: GraduationCap,
    title: "Student Management",
    desc: "Admissions, profiles & class assignments",
    color: "text-sky-300",
    bg: "bg-sky-500/10",
    border: "border-sky-500/10",
  },
  {
    icon: ClipboardCheck,
    title: "Attendance Tracking",
    desc: "Real-time reports & parent alerts",
    color: "text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/10",
  },
  {
    icon: Award,
    title: "Exams & Report Cards",
    desc: "Marks, grades & PDF report cards",
    color: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/10",
  },
  {
    icon: Wallet,
    title: "Fee Management",
    desc: "Payments, receipts & reminders",
    color: "text-rose-300",
    bg: "bg-rose-500/10",
    border: "border-rose-500/10",
  },
  {
    icon: Calendar,
    title: "Timetable & Events",
    desc: "Schedules, holidays & calendars",
    color: "text-indigo-300",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/10",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    desc: "Data-driven insights for growth",
    color: "text-teal-300",
    bg: "bg-teal-500/10",
    border: "border-teal-500/10",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* ── Left Panel — Deep navy with warm golden accents ── */}
      <div className="relative hidden w-[52%] overflow-hidden bg-[#060e24] lg:flex lg:flex-col">
        {/* Subtle grid texture */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(251,191,36,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.03)_1px,transparent_1px)] bg-size-[56px_56px]" />

        {/* Warm ambient glow */}
        <div className="pointer-events-none absolute -left-32 top-[20%] h-125 w-125 rounded-full bg-amber-500/6 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-[15%] -right-15 h-100 w-100 rounded-full bg-indigo-600/8 blur-[100px]" />
        <div className="pointer-events-none absolute top-[60%] left-[40%] h-75 w-75 rounded-full bg-amber-600/4 blur-[90px]" />

        {/* Decorative geometric rings */}
        <div className="pointer-events-none absolute right-[8%] top-[35%] h-44 w-44 rounded-full border border-amber-400/6" />
        <div className="pointer-events-none absolute right-[4%] top-[32%] h-56 w-56 rounded-full border border-white/3" />

        {/* Floating accent dots */}
        <div className="pointer-events-none absolute right-[22%] top-[12%] h-1.5 w-1.5 rounded-full bg-amber-400/50 shadow-[0_0_8px_rgba(251,191,36,0.4)] animate-pulse" />
        <div className="pointer-events-none absolute left-[12%] top-[55%] h-1 w-1 rounded-full bg-sky-400/40 shadow-[0_0_6px_rgba(56,189,248,0.3)]" />
        <div className="pointer-events-none absolute right-[35%] bottom-[18%] h-1 w-1 rounded-full bg-amber-300/30" />

        {/* ── Header ── */}
        <div className="relative z-10 flex items-center justify-between p-8 pb-0">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30 transition-transform duration-200 group-hover:scale-105">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-none tracking-tight text-white">
                Skol<span className="bg-linear-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Matrixa</span>
              </span>
              <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-400/50">
                School ERP
              </span>
            </div>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/3 px-4 py-2 text-xs font-medium text-slate-400 backdrop-blur-sm transition-all hover:border-amber-400/20 hover:text-amber-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Home
          </Link>
        </div>

        {/* ── Main Content ── */}
        <div className="relative z-10 flex flex-1 flex-col justify-center px-8 xl:px-12 pb-8">
          {/* Rotating quote card */}
          <div className="mb-8 relative overflow-hidden rounded-2xl border border-white/6 bg-white/2 p-7 backdrop-blur-sm">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-amber-500/50 via-orange-400/30 to-transparent" />
            <RotatingQuotes />
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`group flex items-start gap-3 rounded-xl border ${f.border} bg-white/2 p-3.5 transition-all duration-200 hover:border-white/8 hover:bg-white/4`}
              >
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${f.bg}`}>
                  <f.icon className={`h-4 w-4 ${f.color}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white/80 group-hover:text-white/90 transition-colors">{f.title}</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust strip */}
          <div className="mt-7 flex items-center gap-6 border-t border-white/6 pt-6">
            {[
              { icon: Shield, label: "Enterprise Security", color: "text-sky-400" },
              { icon: Zap, label: "99.9% Uptime", color: "text-amber-400" },
              { icon: Users, label: "500+ Institutions", color: "text-emerald-400" },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-slate-500">
                <Icon className={`h-3.5 w-3.5 ${color}`} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel — Form ── */}
      <div className="flex flex-1 flex-col bg-[#fafbfd]">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4 lg:hidden">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-orange-600 shadow-md shadow-amber-500/20">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">
              Skol<span className="bg-linear-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Matrixa</span>
            </span>
          </Link>
          <Link href="/" className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-3 w-3" />
            Home
          </Link>
        </div>

        {/* Form container */}
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8 lg:px-14">
          <div className="w-full max-w-md">{children}</div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-center gap-4 border-t border-gray-100 bg-white/80 px-6 py-3.5 backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-amber-500" />
            <p className="text-xs text-gray-400">Encrypted & Secure</p>
          </div>
          <div className="h-3 w-px bg-gray-200" />
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            <p className="text-xs text-gray-400">Trusted by 500+ institutions</p>
          </div>
          <div className="h-3 w-px bg-gray-200" />
          <p className="text-xs text-gray-400">&copy; 2026 SkolMatrixa</p>
        </div>
      </div>
    </div>
  );
}

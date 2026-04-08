import { BookOpen, Shield, Zap, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#04102a]">
      {/* Radial glow from top */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_55%_at_50%_-5%,rgba(37,99,235,0.28),transparent)]" />
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.04)_1px,transparent_1px)] bg-[length:48px_48px]" />
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute -left-48 top-1/4 h-[500px] w-[500px] rounded-full bg-blue-700/20 blur-[130px]" />
      <div className="pointer-events-none absolute -right-48 bottom-1/4 h-[500px] w-[500px] rounded-full bg-blue-500/15 blur-[130px]" />
      {/* Subtle accent dots */}
      <div className="absolute left-[12%] top-[18%] h-1.5 w-1.5 rounded-full bg-blue-400/40" />
      <div className="absolute right-[10%] top-[30%] h-2 w-2 animate-pulse rounded-full bg-blue-300/30" />
      <div className="absolute left-[20%] bottom-[22%] h-1 w-1 rounded-full bg-blue-500/50" />
      <div className="absolute right-[18%] bottom-[15%] h-1.5 w-1.5 rounded-full bg-blue-400/30" />

      <div className="relative z-10 w-full max-w-lg px-4 py-10 sm:px-0">
        {/* Brand header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="group mb-4 inline-block">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-2xl shadow-blue-600/40 transition-all duration-300 group-hover:scale-105 group-hover:shadow-blue-600/60">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </Link>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">SkolMatrixa</h1>
          <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[4px] text-blue-400/55">
            School ERP Platform
          </p>
        </div>

        {/* Form card — glassmorphism */}
        <div className="overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.04] shadow-2xl shadow-black/60 backdrop-blur-2xl">
          {children}
        </div>

        {/* Trust strip */}
        <div className="mt-7 flex items-center justify-center gap-7">
          {[
            { icon: Shield, label: "Enterprise Security" },
            { icon: Zap, label: "99.9% Uptime" },
            { icon: Users, label: "500+ Institutions" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-[11px] text-white/25">
              <Icon className="h-3.5 w-3.5 text-blue-400/50" />
              {label}
            </div>
          ))}
        </div>

        <div className="mt-5 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[11px] text-white/20 transition-colors hover:text-white/45"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

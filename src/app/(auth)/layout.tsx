import {
  BookOpen,
  GraduationCap,
  Award,
  Users,
  ClipboardCheck,
  Wallet,
  Bell,
  Star,
  ArrowLeft,
  Shield,
  Zap,
  CheckCircle2,
  Lock,
} from "lucide-react";
import Link from "next/link";

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
];

const FEATURES = [
  {
    icon: GraduationCap,
    title: "Student Management",
    desc: "Admissions, profiles & class assignments",
    color: "text-emerald-300",
    bg: "bg-emerald-500/15",
  },
  {
    icon: ClipboardCheck,
    title: "Attendance Tracking",
    desc: "Real-time reports & parent alerts",
    color: "text-amber-300",
    bg: "bg-amber-500/15",
  },
  {
    icon: Award,
    title: "Exams & Report Cards",
    desc: "Marks, grades & PDF report cards",
    color: "text-[#F97066]",
    bg: "bg-[#F97066]/15",
  },
  {
    icon: Wallet,
    title: "Fee Management",
    desc: "Payments, receipts & reminders",
    color: "text-blue-300",
    bg: "bg-blue-500/15",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    desc: "Email & in-app alerts by role",
    color: "text-emerald-300",
    bg: "bg-emerald-500/15",
  },
  {
    icon: Users,
    title: "Staff Management",
    desc: "Roles, subjects & department setup",
    color: "text-amber-300",
    bg: "bg-amber-500/15",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const quoteIndex = new Date().getDate() % QUOTES.length;
  const quote = QUOTES[quoteIndex];

  return (
    <div className="flex min-h-screen">
      {/* ── Left Panel — Charcoal immersive ── */}
      <div className="relative hidden w-[52%] overflow-hidden bg-[#1C1C1E] lg:flex lg:flex-col">
        {/* Background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(5,150,105,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(5,150,105,0.05)_1px,transparent_1px)] bg-[length:48px_48px] [mask-image:radial-gradient(ellipse_80%_80%_at_40%_50%,black_40%,transparent_100%)]" />
        {/* Glow orbs */}
        <div className="absolute -left-20 top-1/4 h-[400px] w-[400px] rounded-full bg-emerald-600/15 blur-[100px]" />
        <div className="absolute bottom-1/4 right-0 h-[350px] w-[300px] rounded-full bg-[#F97066]/8 blur-[90px]" />
        <div className="absolute top-3/4 left-1/3 h-[250px] w-[250px] rounded-full bg-emerald-900/15 blur-[80px]" />
        {/* Accent dots */}
        <div className="absolute right-[20%] top-[15%] h-2 w-2 rounded-full bg-emerald-400/60 shadow-lg shadow-emerald-400/40 animate-pulse" />
        <div className="absolute left-[15%] top-[60%] h-1.5 w-1.5 rounded-full bg-[#F97066]/50 shadow-lg shadow-[#F97066]/30" />
        <div className="absolute right-[30%] bottom-[20%] h-1 w-1 rounded-full bg-amber-400/50" />
        {/* Decorative ring */}
        <div className="absolute right-[5%] top-[40%] h-40 w-40 rounded-full border border-emerald-500/8 opacity-60" />
        <div className="absolute right-[5%] top-[40%] h-60 w-60 -translate-x-10 -translate-y-10 rounded-full border border-[#F97066]/6 opacity-40" />

        {/* Logo + back link */}
        <div className="relative z-10 flex items-center justify-between p-10">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 shadow-lg shadow-emerald-600/30 transition-transform group-hover:scale-105">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold leading-none text-white tracking-tight">
                SkolMatrixa
              </span>
              <span className="text-[9px] font-medium leading-none tracking-widest text-emerald-400/70 uppercase mt-0.5">School ERP</span>
            </div>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-white/40 transition-all hover:border-white/20 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex flex-1 flex-col justify-center px-10 pb-10">
          {/* Quote card */}
          <div className="mb-8 relative overflow-hidden rounded-2xl border border-white/8 bg-white/4 p-7 backdrop-blur-sm">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-emerald-500/60 via-emerald-400/40 to-transparent" />
            <div className="mb-3 font-serif text-5xl leading-none text-emerald-500/30">&ldquo;</div>
            <blockquote className="font-display text-base font-medium leading-relaxed text-white/85">
              {quote.text}
            </blockquote>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-3 w-3 fill-emerald-400 text-emerald-400" />
                ))}
              </div>
              <p className="text-sm font-semibold text-emerald-300">— {quote.author}</p>
            </div>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group flex items-start gap-3 rounded-xl border border-white/6 bg-white/3 p-3.5 transition-all hover:border-white/12 hover:bg-white/5"
              >
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${f.bg}`}>
                  <f.icon className={`h-4 w-4 ${f.color}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white/80">{f.title}</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-white/30">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust strip */}
          <div className="mt-7 flex items-center gap-5 border-t border-white/8 pt-6">
            {[
              { icon: Shield, label: "Enterprise Security", color: "text-emerald-400" },
              { icon: Zap, label: "99.9% Uptime", color: "text-amber-400" },
              { icon: Users, label: "500+ Institutions", color: "text-[#F97066]" },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-white/35">
                <Icon className={`h-3.5 w-3.5 ${color}`} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel – Form ── */}
      <div className="flex flex-1 flex-col bg-[#F8F7F4]">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-[#1C1C1E]/5 bg-[#F8F7F4] px-5 py-4 lg:hidden">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 shadow-md shadow-emerald-600/25">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-lg font-bold text-[#1C1C1E] tracking-tight">
              SkolMatrixa
            </span>
          </Link>
          <Link href="/" className="flex items-center gap-1 text-xs font-medium text-[#8E8E93] hover:text-[#1C1C1E]">
            <ArrowLeft className="h-3 w-3" />
            Home
          </Link>
        </div>

        {/* Form container */}
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8 lg:px-14">
          <div className="w-full max-w-md">{children}</div>
        </div>

        {/* Footer note */}
        <div className="flex items-center justify-center gap-4 border-t border-[#1C1C1E]/5 bg-[#F0EDE8]/60 px-6 py-3.5">
          <div className="flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-emerald-600" />
            <p className="text-xs text-[#8E8E93]">Your data is encrypted & secure</p>
          </div>
          <div className="h-3 w-px bg-[#1C1C1E]/10" />
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <p className="text-xs text-[#8E8E93]">Trusted by 500+ institutions</p>
          </div>
          <div className="h-3 w-px bg-[#1C1C1E]/10" />
          <p className="text-xs text-[#8E8E93]">© {new Date().getFullYear()} SkolMatrixa</p>
        </div>
      </div>
    </div>
  );
}

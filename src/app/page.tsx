import Link from "next/link";
import {
  GraduationCap,
  Users,
  ClipboardCheck,
  Calendar,
  FileText,
  Bell,
  Wallet,
  Award,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Shield,
  Zap,
  Star,
  Globe,
  BarChart3,
  Clock,
  Layers,
  MousePointerClick,
  Lock,
  Trophy,
  MessageSquare,
  Brain,
  Target,
  Play,
  Building2,
  LineChart,
  TrendingUp,
  Cpu,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
} from "lucide-react";

/* ─────────────────────────────────────────────
   DATA CONSTANTS
───────────────────────────────────────────── */

const FEATURES = [
  {
    icon: GraduationCap,
    title: "Student Management",
    desc: "Complete lifecycle — admissions, profiles, class assignments, CSV bulk imports, and rich academic records all in one place.",
    gradient: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
    color: "text-blue-600",
    tag: "Core",
  },
  {
    icon: Users,
    title: "Staff & HR",
    desc: "Manage teachers and staff with defined roles, departments, subject assignments, leave tracking and employment records.",
    gradient: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50",
    color: "text-emerald-600",
    tag: "Core",
  },
  {
    icon: ClipboardCheck,
    title: "Attendance Tracking",
    desc: "Mark attendance per class or subject with real-time reports, automated parent alerts, and monthly analytics.",
    gradient: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
    color: "text-amber-600",
    tag: "Daily",
  },
  {
    icon: Calendar,
    title: "Timetable Builder",
    desc: "Visual class scheduling with teacher conflict detection, room allocation, and easy period copy tools.",
    gradient: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    color: "text-violet-600",
    tag: "Planning",
  },
  {
    icon: FileText,
    title: "Homework & Assignments",
    desc: "Create, assign and grade homework online. Track completion rates with file upload submissions.",
    gradient: "from-rose-500 to-pink-600",
    bg: "bg-rose-50",
    color: "text-rose-600",
    tag: "Academic",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    desc: "Send targeted in-app and email notifications to students, parents, and staff by role or class.",
    gradient: "from-cyan-500 to-sky-600",
    bg: "bg-cyan-50",
    color: "text-cyan-600",
    tag: "Communication",
  },
  {
    icon: Award,
    title: "Exams & Report Cards",
    desc: "Schedule exams, enter marks by subject, auto-calculate grades, and generate beautiful PDF report cards.",
    gradient: "from-fuchsia-500 to-purple-600",
    bg: "bg-fuchsia-50",
    color: "text-fuchsia-600",
    tag: "Academic",
  },
  {
    icon: Wallet,
    title: "Fee Management",
    desc: "Define structured fee plans, track all payments, generate professional receipts, and send overdue reminders.",
    gradient: "from-lime-500 to-green-600",
    bg: "bg-lime-50",
    color: "text-lime-600",
    tag: "Finance",
  },
];

const STATS = [
  { value: "10K+", label: "Students Managed", icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50" },
  { value: "500+", label: "Institutions Served", icon: Building2, color: "text-amber-600", bg: "bg-amber-50" },
  { value: "99.9%", label: "Platform Uptime", icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50" },
  { value: "24/7", label: "Expert Support", icon: MessageSquare, color: "text-violet-600", bg: "bg-violet-50" },
];

const WHY_CHOOSE = [
  { title: "Multi-tenant Architecture", desc: "Each institution gets a fully isolated, secure environment." },
  { title: "Role-based Access Control", desc: "Admin, Teacher, Student and Parent with granular permissions." },
  { title: "Bulk CSV Import", desc: "Migrate your existing data in minutes with our import wizard." },
  { title: "PDF Generation", desc: "Professional report cards, fee receipts, and attendance sheets." },
  { title: "Email Notifications", desc: "Automated alerts for fees, attendance, events, and more." },
  { title: "Analytics Dashboard", desc: "Real-time insights on attendance, revenue, and academics." },
];

const STEPS = [
  {
    step: "01",
    title: "Register Your Institution",
    desc: "Sign up as a School or Coaching Institute. Get instant access to your dedicated management dashboard.",
    icon: MousePointerClick,
    color: "from-blue-600 to-indigo-600",
    glow: "shadow-blue-500/30",
  },
  {
    step: "02",
    title: "Configure Your Setup",
    desc: "Add academic year, classes, subjects, and fee structures using our guided setup wizard. Ready in minutes.",
    icon: Layers,
    color: "from-amber-500 to-orange-500",
    glow: "shadow-amber-500/30",
  },
  {
    step: "03",
    title: "Start Managing Everything",
    desc: "Add students, staff, mark attendance, schedule exams, collect fees — manage everything from one dashboard.",
    icon: BarChart3,
    color: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-500/30",
  },
];

const COUNTER_STATS = [
  { value: "10,000+", label: "Students Managed", icon: GraduationCap },
  { value: "500+", label: "Institutions Served", icon: Building2 },
  { value: "₹50L+", label: "Fees Processed", icon: Wallet },
  { value: "5M+", label: "Notifications Sent", icon: Bell },
];

const TESTIMONIALS = [
  {
    quote: "SkolMatrixa transformed how we run our school. Attendance and fee management alone saved us 10+ hours every week. The parent notification system is absolutely brilliant.",
    author: "Dr. Priya Sharma",
    role: "Principal",
    school: "Delhi Public School",
    rating: 5,
    initials: "PS",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    quote: "As a coaching institute, we needed batch management that actually works. SkolMatrixa delivered beyond expectations — intuitive, fast, and completely reliable.",
    author: "Rajesh Kumar",
    role: "Director",
    school: "Apex Coaching Centre",
    rating: 5,
    initials: "RK",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    quote: "Report card generation and the parent portal are incredible. Parents love the transparency and our admin team saves days of manual work every term.",
    author: "Anita Desai",
    role: "Administrator",
    school: "St. Mary's Academy",
    rating: 5,
    initials: "AD",
    gradient: "from-emerald-500 to-teal-600",
  },
];

const SCHOOL_FEATURES = [
  "Class-wise student & subject management",
  "Teacher–subject assignment system",
  "Mark-based report card generation",
  "Parent communication & notifications",
  "Fee collection with PDF receipts",
  "Daily class attendance tracking",
];

const COACHING_FEATURES = [
  "Batch-based student enrollment",
  "Multiple subject package support",
  "Test scheduling & marks entry",
  "Student performance analytics",
  "Fee installment plan tracking",
  "Assignment submission portal",
];

const FAQ = [
  {
    q: "Is SkolMatrixa suitable for small institutions?",
    a: "Absolutely. SkolMatrixa scales from a 50-student coaching centre to a school with 3,000+ students. The platform adapts to your institution's size and complexity.",
  },
  {
    q: "How long does the initial setup take?",
    a: "Most institutions complete full setup in under 30 minutes using our guided wizard. Adding students and staff can be done individually or via CSV bulk import.",
  },
  {
    q: "Is my institution's data secure and private?",
    a: "Yes. Every institution's data is completely isolated in our multi-tenant architecture. We use enterprise-grade encryption, automated daily backups, and maintain 99.9% uptime.",
  },
  {
    q: "Can students and parents access the platform?",
    a: "Yes. SkolMatrixa includes a dedicated student portal to view assignments, grades, attendance, and fee status. Parents receive automated email notifications.",
  },
  {
    q: "What kind of support is available?",
    a: "We provide 24/7 email and chat support, plus a dedicated onboarding specialist for new institutions to help your team get set up and running smoothly.",
  },
  {
    q: "Can I import existing student and staff data?",
    a: "Yes. SkolMatrixa supports CSV bulk import for students and staff. You can migrate your existing data easily with our provided template files and import wizard.",
  },
];

/* ─────────────────────────────────────────────
   MAIN PAGE COMPONENT
───────────────────────────────────────────── */

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-white">

      {/* ══════════════════════════════════════════
          STICKY HEADER
      ══════════════════════════════════════════ */}
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#030d2e]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/40 transition-transform group-hover:scale-110">
              <BookOpen className="h-5 w-5 text-white" />
              <div className="absolute inset-0 rounded-xl ring-2 ring-white/10" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold leading-none tracking-tight text-white">
                Skol<span className="bg-linear-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Matrixa</span>
              </span>
              <span className="text-[9px] font-medium leading-none tracking-widest text-blue-400/70 uppercase">School ERP</span>
            </div>
          </Link>

          {/* Nav */}
          <nav className="hidden items-center gap-8 md:flex">
            {[
              { label: "Features", href: "#features" },
              { label: "How it Works", href: "#how-it-works" },
              { label: "For Schools", href: "#institutions" },
              { label: "Testimonials", href: "#testimonials" },
              { label: "FAQ", href: "#faq" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-xl px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition-all hover:brightness-110 hover:shadow-amber-500/40"
            >
              Get Started Free
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          HERO — Rich dark navy, warm accents
      ══════════════════════════════════════════ */}
      <section className="relative min-h-screen overflow-hidden bg-[#030d2e]">
        {/* Background mesh */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.06)_1px,transparent_1px)] bg-size-[60px_60px] mask-[radial-gradient(ellipse_85%_70%_at_50%_10%,black_40%,transparent_100%)]" />
        {/* Glow orbs */}
        <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[130px]" />
        <div className="absolute top-1/3 -right-20 h-[400px] w-[400px] rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute bottom-10 left-1/3 h-[350px] w-[350px] rounded-full bg-indigo-800/25 blur-[100px]" />
        {/* Decorative shapes */}
        <div className="absolute right-[12%] top-[18%] h-2.5 w-2.5 rounded-full bg-amber-400/70 shadow-lg shadow-amber-400/40 animate-pulse" />
        <div className="absolute left-[10%] top-[45%] h-2 w-2 rounded-full bg-blue-400/60 shadow-lg shadow-blue-400/40 animate-pulse" style={{ animationDelay: "0.5s" }} />
        <div className="absolute right-[25%] bottom-[30%] h-1.5 w-1.5 rounded-full bg-cyan-400/60" />
        <div className="absolute left-[20%] top-[25%] h-1 w-1 rounded-full bg-violet-400/80" />
        {/* Floating ring */}
        <div className="absolute right-[8%] top-[35%] h-32 w-32 rounded-full border border-blue-500/10 opacity-60" />
        <div className="absolute right-[8%] top-[35%] h-48 w-48 -translate-x-8 -translate-y-8 rounded-full border border-amber-500/8 opacity-40" />
        <div className="absolute left-[5%] bottom-[25%] h-24 w-24 rounded-full border border-indigo-500/10" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-36 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">
            {/* Left — Text */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="animate-slide-up mb-7 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/8 px-5 py-2.5 text-sm font-medium text-amber-300 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-400" />
                #1 School Management ERP Platform
              </div>

              {/* Headline */}
              <h1 className="animate-slide-up stagger-1 font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.75rem] xl:text-[4.25rem]">
                Manage Your
                <br />
                <span className="relative inline-block">
                  <span className="bg-linear-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                    School Brilliantly
                  </span>
                  {/* Underline decoration */}
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 400 10" fill="none" aria-hidden="true">
                    <path d="M2 8C80 2 160 1 200 4C240 7 320 2 398 6" stroke="url(#heroUnderline)" strokeWidth="2.5" strokeLinecap="round" />
                    <defs>
                      <linearGradient id="heroUnderline" x1="0" y1="0" x2="400" y2="0">
                        <stop stopColor="#f59e0b" />
                        <stop offset="1" stopColor="#f97316" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
                <br />
                <span className="text-slate-300">with Smart ERP</span>
              </h1>

              <p className="animate-slide-up stagger-2 mx-auto mt-8 max-w-xl text-lg leading-relaxed text-slate-400 lg:mx-0">
                SkolMatrixa unifies every aspect of school and coaching administration — students, staff, attendance,
                exams, fees, and communication — into one powerful, beautifully simple platform.
              </p>

              {/* CTAs */}
              <div className="animate-slide-up stagger-3 mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
                <Link
                  href="/register"
                  className="group relative flex items-center gap-2.5 overflow-hidden rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-amber-500/30 transition-all duration-300 hover:scale-[1.03] hover:shadow-amber-500/50"
                >
                  <div className="absolute inset-0 bg-linear-to-r from-amber-400 to-orange-400 opacity-0 transition-opacity group-hover:opacity-100" />
                  <GraduationCap className="relative h-5 w-5" />
                  <span className="relative">Start Free Trial</span>
                  <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <button className="group flex items-center gap-3 rounded-2xl border border-white/12 bg-white/5 px-7 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/10">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition-all group-hover:bg-white/20">
                    <Play className="h-4 w-4 fill-white text-white" />
                  </div>
                  Watch Demo
                </button>
              </div>

              {/* Trust badges */}
              <div className="animate-slide-up stagger-4 mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 lg:justify-start">
                {[
                  { icon: Shield, label: "Enterprise Security", color: "text-blue-400" },
                  { icon: Zap, label: "5-Min Setup", color: "text-amber-400" },
                  { icon: Globe, label: "Cloud-Based", color: "text-emerald-400" },
                  { icon: Lock, label: "100% Private", color: "text-violet-400" },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex items-center gap-2 text-sm text-slate-500">
                    <Icon className={`h-4 w-4 ${color}`} />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Dashboard Mockup */}
            <div className="animate-slide-up stagger-5 relative mt-16 lg:mt-0">
              {/* Glow behind card */}
              <div className="absolute inset-0 -m-8 rounded-3xl bg-blue-600/10 blur-3xl" />

              {/* Main card */}
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-2xl shadow-black/50 backdrop-blur-2xl">
                {/* Browser bar */}
                <div className="flex items-center gap-2 border-b border-white/8 bg-slate-950/80 px-5 py-3.5">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/70" />
                    <div className="h-3 w-3 rounded-full bg-amber-500/70" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500/70" />
                  </div>
                  <div className="mx-3 flex-1">
                    <div className="mx-auto h-6 w-64 rounded-lg bg-white/5 px-4 text-center text-xs leading-6 text-slate-500">
                      🔒 app.skolmatrixa.com/dashboard
                    </div>
                  </div>
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20">
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  {/* Dashboard header */}
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Academic Year 2025–26</p>
                      <p className="font-display text-sm font-bold text-white">Good morning, Principal 👋</p>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400">
                      Today: Mon, Mar 18
                    </div>
                  </div>

                  {/* Stat cards */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: "Total Students", value: "2,847", icon: "🎓", change: "+12%", color: "from-blue-500 to-indigo-600" },
                      { label: "Attendance", value: "94.2%", icon: "✅", change: "↑ 2.1%", color: "from-emerald-500 to-teal-500" },
                      { label: "Fee Collected", value: "₹8.4L", icon: "💰", change: "+18%", color: "from-amber-500 to-orange-500" },
                      { label: "Staff Active", value: "156", icon: "👩‍🏫", change: "+3 new", color: "from-violet-500 to-purple-600" },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl border border-white/6 bg-white/4 p-3.5">
                        <div className="mb-2 text-lg">{stat.icon}</div>
                        <p className="text-[10px] font-medium text-slate-500">{stat.label}</p>
                        <p className="mt-0.5 font-display text-lg font-bold text-white">{stat.value}</p>
                        <p className={`mt-1 text-[10px] font-semibold bg-linear-to-r ${stat.color} bg-clip-text text-transparent`}>
                          {stat.change} this month
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Charts row */}
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="col-span-2 rounded-xl border border-white/6 bg-white/3 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-300">Weekly Attendance</p>
                        <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[9px] font-bold text-blue-400">
                          THIS WEEK
                        </span>
                      </div>
                      <div className="flex items-end gap-1.5">
                        {[72, 85, 78, 91, 88, 94, 89].map((h, i) => (
                          <div key={i} className="flex flex-1 flex-col items-center gap-1">
                            <div
                              className="w-full rounded-t bg-linear-to-t from-blue-600 to-blue-400 opacity-80"
                              style={{ height: `${h * 0.52}px` }}
                            />
                            <span className="text-[8px] text-slate-600">
                              {["M", "T", "W", "T", "F", "S", "S"][i]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/6 bg-white/3 p-4">
                      <p className="mb-3 text-xs font-semibold text-slate-300">Quick Actions</p>
                      <div className="space-y-2">
                        {[
                          { label: "Mark Attendance", cls: "bg-blue-500/15 text-blue-300 border-blue-500/10" },
                          { label: "Collect Fees", cls: "bg-amber-500/15 text-amber-300 border-amber-500/10" },
                          { label: "Send Notice", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/10" },
                          { label: "View Reports", cls: "bg-violet-500/15 text-violet-300 border-violet-500/10" },
                        ].map((a) => (
                          <div key={a.label} className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-medium ${a.cls}`}>
                            {a.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating notification card */}
              <div className="absolute -top-5 -right-4 hidden w-52 animate-float rounded-2xl border border-white/10 bg-slate-800/95 p-4 shadow-2xl backdrop-blur-2xl sm:block">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Fees Collected ✓</p>
                    <p className="text-[10px] text-slate-400">Grade 10 — 42 students</p>
                    <p className="mt-1 text-[9px] text-slate-500">2 minutes ago</p>
                  </div>
                </div>
              </div>

              {/* Floating attendance card */}
              <div className="absolute -bottom-5 -left-4 hidden w-48 animate-float-delayed rounded-2xl border border-white/10 bg-slate-800/95 p-4 shadow-2xl backdrop-blur-2xl sm:block">
                <p className="text-[10px] font-medium text-slate-400">Today's Attendance</p>
                <p className="mt-1 font-display text-2xl font-bold text-white">94.2%</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[94%] rounded-full bg-linear-to-r from-blue-500 to-indigo-500" />
                </div>
                <p className="mt-1.5 text-[10px] font-semibold text-emerald-400">↑ 2.1% vs last week</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
            <path d="M0,40 C360,80 1080,0 1440,60 L1440,80 L0,80 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TRUST STRIP — Stats bar
      ══════════════════════════════════════════ */}
      <section className="relative bg-white py-16">
        {/* Section label */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-12 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
            Empowering institutions across India
          </p>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="group flex flex-col items-center text-center">
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${stat.bg} transition-all duration-300 group-hover:scale-110`}>
                  <stat.icon className={`h-7 w-7 ${stat.color}`} />
                </div>
                <p className={`font-display text-4xl font-bold sm:text-5xl ${stat.color}`}>
                  {stat.value}
                </p>
                <p className="mt-2 text-sm font-medium text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          ABOUT SECTION — Split layout
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-slate-50">
        {/* Decorative shapes */}
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-amber-100/60 blur-3xl" />
        <div className="absolute left-0 bottom-0 h-60 w-60 rounded-full bg-blue-100/60 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Left — Visual */}
            <div className="relative order-2 lg:order-1">
              {/* Main illustration card */}
              <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-200/60">
                {/* Header */}
                <div className="border-b border-slate-100 bg-linear-to-r from-blue-600 to-indigo-700 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-blue-200">SkolMatrixa Platform</p>
                      <p className="font-display text-base font-bold text-white">Institution Overview</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2 rounded-full bg-white/15 px-3 py-1">
                      <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-medium text-white">Live</span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {/* Module list */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: GraduationCap, label: "2,847 Students", sub: "Active enrollment", color: "bg-blue-50 text-blue-600" },
                      { icon: Users, label: "156 Staff", sub: "Teachers & admin", color: "bg-emerald-50 text-emerald-600" },
                      { icon: ClipboardCheck, label: "94.2% Attendance", sub: "Today's rate", color: "bg-amber-50 text-amber-600" },
                      { icon: Wallet, label: "₹8.4L Collected", sub: "This month fees", color: "bg-violet-50 text-violet-600" },
                      { icon: Award, label: "12 Exams", sub: "Scheduled this term", color: "bg-rose-50 text-rose-600" },
                      { icon: Bell, label: "340 Notices", sub: "Sent this month", color: "bg-cyan-50 text-cyan-600" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
                          <item.icon className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{item.label}</p>
                          <p className="text-[10px] text-slate-500">{item.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Progress bars */}
                  <div className="mt-5 space-y-3">
                    {[
                      { label: "Fee Collection Progress", pct: 78, color: "bg-blue-500" },
                      { label: "Monthly Attendance Goal", pct: 92, color: "bg-emerald-500" },
                      { label: "Homework Completion", pct: 85, color: "bg-amber-500" },
                    ].map((bar) => (
                      <div key={bar.label}>
                        <div className="mb-1 flex justify-between">
                          <span className="text-[10px] font-medium text-slate-500">{bar.label}</span>
                          <span className="text-[10px] font-bold text-slate-700">{bar.pct}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${bar.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Badge overlays */}
              <div className="absolute -right-5 top-12 hidden rounded-2xl border border-amber-200/80 bg-amber-50 p-4 shadow-xl sm:block">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <div>
                    <p className="text-xs font-bold text-amber-800">5-Star Rating</p>
                    <p className="text-[10px] text-amber-600">500+ institutions</p>
                  </div>
                </div>
              </div>
              <div className="absolute -left-5 bottom-12 hidden rounded-2xl border border-emerald-200/80 bg-emerald-50 p-4 shadow-xl sm:block">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold text-emerald-800">5-Min Setup</p>
                    <p className="text-[10px] text-emerald-600">Quick onboarding</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Text */}
            <div className="order-1 lg:order-2">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                About SkolMatrixa
              </div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                One Platform.{" "}
                <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Complete School
                </span>{" "}
                Management.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-gray-500 sm:text-lg">
                SkolMatrixa is a next-generation cloud-based school management ERP solution, designed to simplify,
                automate, and transform how educational institutions operate. From student admissions to fee collection,
                attendance tracking to exam management — our platform empowers schools and coaching institutes to
                manage everything in one place.
              </p>
              <ul className="mt-8 space-y-3.5">
                {[
                  "Unified student, staff & academic management",
                  "Automated fee collection with digital receipts",
                  "Real-time attendance & parent notifications",
                  "Powerful analytics & custom reporting",
                  "Multi-tenant with complete data isolation",
                  "Role-based access for admins, teachers & students",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-10 flex items-center gap-4">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:brightness-110"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <a href="#features" className="group flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">
                  Explore Features
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CORE FEATURES — Colorful card grid
      ══════════════════════════════════════════ */}
      <section id="features" className="relative overflow-hidden bg-white py-24 sm:py-32">
        {/* Background dots */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-size-[28px_28px]" />
        {/* Top wave */}
        <div className="absolute top-0 left-0 w-full overflow-hidden rotate-180">
          <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
            <path d="M0,24 C360,48 1080,0 1440,32 L1440,48 L0,48 Z" fill="#f8fafc" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
              <Cpu className="h-3.5 w-3.5" />
              Core Features
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Everything You Need to Run
              <span className="block bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Your Institution
              </span>
            </h2>
            <p className="mt-5 text-lg text-gray-500">
              A comprehensive suite of tools built for schools and coaching institutes — from a 50-student centre to
              a large multi-branch institution.
            </p>
          </div>

          {/* Feature cards */}
          <div className="mx-auto mt-16 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-xl animate-slide-up opacity-0"
                style={{ animationDelay: `${i * 0.07}s`, animationFillMode: "forwards" }}
              >
                {/* Background gradient */}
                <div
                  className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-linear-to-br ${f.gradient} opacity-[0.07] transition-all duration-500 group-hover:scale-150 group-hover:opacity-[0.14]`}
                />
                {/* Icon */}
                <div className={`inline-flex rounded-2xl bg-linear-to-br ${f.gradient} p-3 shadow-md`}>
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${f.bg} ${f.color}`}>
                  {f.tag}
                </span>
                <h3 className="mt-4 font-display text-base font-bold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{f.desc}</p>
                <div className={`mt-5 flex items-center gap-1 text-xs font-bold ${f.color} opacity-0 transition-all duration-300 group-hover:opacity-100`}>
                  Learn more
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          WHY CHOOSE US — Checkpoints + visual
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50/40 py-24 sm:py-32">
        {/* Decoration */}
        <div className="absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-blue-100/50 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Left — Checklist */}
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
                <Target className="h-3.5 w-3.5 text-amber-500" />
                Why Choose SkolMatrixa?
              </div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                The Smart Choice
                <span className="block bg-linear-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                  for Modern Schools
                </span>
              </h2>
              <p className="mt-5 text-base leading-relaxed text-gray-500 sm:text-lg">
                SkolMatrixa is the trusted ERP software for CBSE, ICSE, and state board schools, designed to simplify
                and automate daily operations so you can focus on what matters — education.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {WHY_CHOOSE.map((item, i) => (
                  <div
                    key={item.title}
                    className="group flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-blue-100 hover:shadow-md"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-sm shadow-blue-500/20">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{item.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:brightness-110 hover:shadow-amber-500/40"
                >
                  Start Managing Today
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Right — Visual cards */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Shield, title: "Data Security", desc: "Enterprise-grade encryption & complete isolation per institution", color: "from-blue-500 to-indigo-600", bg: "bg-blue-50" },
                  { icon: TrendingUp, title: "Deep Analytics", desc: "Actionable insights on attendance, fees, and academic performance", color: "from-amber-500 to-orange-500", bg: "bg-amber-50" },
                  { icon: Zap, title: "Lightning Fast", desc: "Blazing performance with auto-scaling infrastructure built in", color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50" },
                  { icon: Globe, title: "Access Anywhere", desc: "Cloud-based platform accessible from any device, any location", color: "from-violet-500 to-purple-600", bg: "bg-violet-50" },
                  { icon: Cpu, title: "AI-Powered Tools", desc: "Smart automation for routine tasks, saving hours every week", color: "from-cyan-500 to-sky-600", bg: "bg-cyan-50" },
                  { icon: Trophy, title: "Award-Winning", desc: "Recognized as the best school ERP by institutions across India", color: "from-rose-500 to-pink-600", bg: "bg-rose-50" },
                ].map((card, i) => (
                  <div
                    key={card.title}
                    className={`group relative overflow-hidden rounded-2xl p-5 ${card.bg} border border-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div className={`mb-3 inline-flex rounded-xl bg-linear-to-br ${card.color} p-2.5 shadow-md`}>
                      <card.icon className="h-5 w-5 text-white" />
                    </div>
                    <p className="font-display text-sm font-bold text-gray-900">{card.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          INSTITUTION TYPES — Schools vs Coaching
      ══════════════════════════════════════════ */}
      <section id="institutions" className="relative overflow-hidden bg-white py-24 sm:py-32">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-50/80 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700">
              <Target className="h-3.5 w-3.5 text-violet-500" />
              Built for Your Institution
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Tailored for Schools &{" "}
              <span className="bg-linear-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Coaching Institutes
              </span>
            </h2>
            <p className="mt-5 text-lg text-gray-500">
              Register as a School for class-based management, or as a Coaching Institute for flexible batch-based operations.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-8 lg:grid-cols-2">
            {/* School card */}
            <div className="group relative overflow-hidden rounded-3xl border-2 border-blue-100 bg-linear-to-br from-blue-50 to-white p-8 transition-all duration-300 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/8">
              <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-blue-100/60 blur-2xl" />
              <div className="relative">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <div className="mt-5">
                  <h3 className="font-display text-2xl font-bold text-gray-900">For Schools</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Complete school management with class-based operations, academic calendars, and seamless parent engagement.
                  </p>
                </div>
                <ul className="mt-6 space-y-3">
                  {SCHOOL_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100">
                        <CheckCircle2 className="h-3 w-3 text-blue-600" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register?type=SCHOOL"
                  className="group/btn mt-8 flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 hover:shadow-blue-500/30"
                >
                  Register as School
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Coaching card */}
            <div className="group relative overflow-hidden rounded-3xl border-2 border-violet-100 bg-linear-to-br from-violet-50 to-white p-8 transition-all duration-300 hover:border-violet-200 hover:shadow-2xl hover:shadow-violet-500/8">
              <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-violet-100/60 blur-2xl" />
              <div className="relative">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-violet-600 to-purple-600 shadow-lg shadow-violet-500/25">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <div className="mt-5">
                  <h3 className="font-display text-2xl font-bold text-gray-900">For Coaching Institutes</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Flexible batch-based management built for coaching centres, tutorials, and specialised institutes.
                  </p>
                </div>
                <ul className="mt-6 space-y-3">
                  {COACHING_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100">
                        <CheckCircle2 className="h-3 w-3 text-violet-600" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register?type=COACHING_INSTITUTE"
                  className="group/btn mt-8 flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-violet-500/20 transition-all hover:bg-violet-700 hover:shadow-violet-500/30"
                >
                  Register as Coaching
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS — Dark navy, 3 steps
      ══════════════════════════════════════════ */}
      <section id="how-it-works" className="relative overflow-hidden bg-[#030d2e] py-24 sm:py-32">
        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-size-[60px_60px]" />
        {/* Orbs */}
        <div className="absolute left-1/4 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-blue-900/30 blur-[120px]" />
        <div className="absolute right-1/4 bottom-0 h-[300px] w-[300px] rounded-full bg-amber-900/20 blur-[100px]" />
        {/* Top wave */}
        <div className="absolute top-0 left-0 w-full overflow-hidden rotate-180">
          <svg viewBox="0 0 1440 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
            <path d="M0,25 C360,50 1080,0 1440,35 L1440,50 L0,50 Z" fill="white" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-400">
              <Clock className="h-3.5 w-3.5" />
              Get Up & Running in Minutes
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              From Signup to Fully Operational
              <span className="block bg-linear-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                in 3 Simple Steps
              </span>
            </h2>
            <p className="mt-5 text-lg text-slate-400">
              No lengthy onboarding. No complex training. Just register, configure, and start managing.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.step} className="group relative">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="absolute left-full top-[4.5rem] hidden h-0.5 w-full -translate-y-1/2 bg-linear-to-r from-white/10 to-transparent lg:block" style={{ width: "calc(100% - 2rem)", left: "calc(100% - 1rem)" }} />
                )}
                <div className="relative rounded-2xl border border-white/8 bg-white/4 p-8 text-center transition-all duration-300 hover:border-white/15 hover:bg-white/7">
                  {/* Step number */}
                  <div className="mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/8">
                    <span className="text-xs font-bold text-slate-400">{s.step}</span>
                  </div>
                  {/* Icon */}
                  <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br ${s.color} shadow-xl ${s.glow} transition-transform duration-300 group-hover:scale-110`}>
                    <s.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-white">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2.5 rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 px-9 py-4 text-base font-bold text-white shadow-2xl shadow-amber-500/25 transition-all hover:brightness-110"
            >
              Start for Free Today
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
            <path d="M0,30 C480,60 960,0 1440,40 L1440,60 L0,60 Z" fill="#f8fafc" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS COUNTER — Vivid gradient background
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-slate-50 py-24 sm:py-28">
        <div className="absolute inset-0 bg-linear-to-br from-blue-600/5 via-transparent to-amber-500/5" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              <TrendingUp className="h-3.5 w-3.5" />
              Trusted at Scale
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Numbers that speak for themselves
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {COUNTER_STATS.map((stat, i) => (
              <div
                key={stat.label}
                className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="absolute inset-0 bg-linear-to-br from-blue-50/60 via-transparent to-amber-50/40 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 transition-all group-hover:scale-110">
                    <stat.icon className="h-7 w-7 text-blue-600" />
                  </div>
                  <p className="font-display text-4xl font-bold text-gray-900 sm:text-5xl">{stat.value}</p>
                  <p className="mt-2 text-sm font-medium text-gray-500">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIALS — Warm card layout
      ══════════════════════════════════════════ */}
      <section id="testimonials" className="relative overflow-hidden bg-white py-24 sm:py-32">
        {/* Decorative */}
        <div className="absolute left-0 top-1/4 h-[400px] w-[400px] rounded-full bg-blue-50/80 blur-3xl" />
        <div className="absolute right-0 bottom-1/4 h-[300px] w-[300px] rounded-full bg-amber-50/80 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              Client Testimonials
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Loved by{" "}
              <span className="bg-linear-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                500+ Institutions
              </span>
            </h2>
            <p className="mt-5 text-lg text-gray-500">
              See what school principals, directors, and administrators say about SkolMatrixa.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-6xl gap-8 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.author}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/8"
              >
                {/* Gradient accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-linear-to-r ${t.gradient}`} />
                {/* Stars */}
                <div className="mb-5 flex items-center gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                {/* Quote */}
                <div className="relative mb-6">
                  <svg className="absolute -top-2 -left-1 h-8 w-8 text-gray-200" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
                    <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                  </svg>
                  <p className="pl-5 text-sm leading-relaxed text-gray-600 italic">{t.quote}</p>
                </div>
                {/* Author */}
                <div className="mt-auto flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br ${t.gradient} shadow-md`}>
                    <span className="font-display text-sm font-bold text-white">{t.initials}</span>
                  </div>
                  <div>
                    <p className="font-display text-sm font-bold text-gray-900">{t.author}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                    <p className="text-xs font-semibold text-blue-600">{t.school}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FAQ — Clean accordion
      ══════════════════════════════════════════ */}
      <section id="faq" className="relative overflow-hidden bg-slate-50 py-24 sm:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(59,130,246,0.04)_1px,transparent_1px)] bg-size-[24px_24px]" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
              <MessageSquare className="h-3.5 w-3.5" />
              Frequently Asked Questions
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Got Questions?
              <span className="block bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                We Have Answers.
              </span>
            </h2>
          </div>
          <div className="mt-14 space-y-3">
            {FAQ.map((item, i) => (
              <details key={i} className="group rounded-2xl border border-gray-200 bg-white shadow-sm transition-all open:shadow-md">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 text-left">
                  <span className="font-display text-base font-semibold text-gray-900 transition-colors group-open:text-blue-600">
                    {item.q}
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 transition-all group-open:rotate-45 group-open:border-blue-200 group-open:bg-blue-50">
                    <svg className="h-4 w-4 text-gray-500 group-open:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                </summary>
                <p className="px-6 pb-6 text-sm leading-relaxed text-gray-500">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA — Bold golden gradient
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#030d2e]">
        {/* Grid BG */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[48px_48px]" />
        {/* Glowing orbs */}
        <div className="absolute left-1/4 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="absolute right-1/4 top-1/2 h-[300px] w-[300px] -translate-y-1/2 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute right-[15%] top-[20%] h-2.5 w-2.5 rounded-full bg-amber-400/60 animate-pulse" />
        <div className="absolute left-[15%] bottom-[20%] h-2 w-2 rounded-full bg-blue-400/60 animate-pulse" style={{ animationDelay: "0.8s" }} />
        {/* Top wave */}
        <div className="absolute top-0 left-0 w-full overflow-hidden rotate-180">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
            <path d="M0,30 C480,60 960,0 1440,40 L1440,60 L0,60 Z" fill="#f8fafc" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-4xl px-4 py-28 text-center sm:px-6 sm:py-36 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-5 py-2 text-sm font-semibold text-amber-300">
            <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-400" />
            Join 500+ institutions transforming education
          </div>
          <h2 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Ready to Modernize
            <span className="block bg-linear-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
              Your Institution?
            </span>
          </h2>
          <p className="mx-auto mt-7 max-w-xl text-lg text-slate-400">
            Start for free. No credit card required. Be up and running in under 30 minutes. Cancel anytime.
          </p>
          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="group flex items-center gap-2.5 rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 px-9 py-4.5 text-base font-bold text-white shadow-2xl shadow-amber-500/30 transition-all duration-300 hover:scale-[1.03] hover:shadow-amber-500/50"
            >
              <GraduationCap className="h-5 w-5" />
              Get Started Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="group flex items-center gap-2.5 rounded-2xl border-2 border-white/15 px-8 py-4.5 text-base font-semibold text-white transition-all duration-300 hover:border-white/30 hover:bg-white/8"
            >
              Sign In to Dashboard
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {[
              { icon: Shield, text: "Enterprise-grade security" },
              { icon: CheckCircle2, text: "99.9% uptime SLA" },
              { icon: Zap, text: "Free onboarding support" },
              { icon: Lock, text: "Data privacy guaranteed" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm text-slate-500">
                <Icon className="h-4 w-4 text-slate-600" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER — Rich dark navy
      ══════════════════════════════════════════ */}
      <footer className="bg-[#020919] text-slate-400">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 shadow-lg">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <span className="font-display text-xl font-bold text-white">
                  Skol<span className="bg-linear-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Matrixa</span>
                </span>
              </Link>
              <p className="mt-5 max-w-sm text-sm leading-relaxed">
                The complete management platform for schools and coaching institutes. Simplify operations, empower educators, and deliver better education outcomes.
              </p>
              <div className="mt-6 flex gap-4">
                {[
                  { label: "Facebook", path: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" },
                  { label: "Twitter", path: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" },
                  { label: "LinkedIn", path: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z" },
                  { label: "Instagram", path: "M8 2.1A5.9 5.9 0 002.1 8v8A5.9 5.9 0 008 21.9h8A5.9 5.9 0 0021.9 16V8A5.9 5.9 0 0016 2.1H8zm0 1.8h8A4.1 4.1 0 0120.1 8v8A4.1 4.1 0 0116 20.1H8A4.1 4.1 0 013.9 16V8A4.1 4.1 0 018 3.9zm4 2.6a5.5 5.5 0 100 11 5.5 5.5 0 000-11zm0 1.8a3.7 3.7 0 110 7.4 3.7 3.7 0 010-7.4zm5.9-1.4a1 1 0 100 2 1 1 0 000-2z" },
                ].map((social) => (
                  <button
                    key={social.label}
                    aria-label={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={social.path} />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="mb-5 font-display text-sm font-bold text-white">Platform</h4>
              <ul className="space-y-3">
                {[
                  { label: "Student Management", href: "#features" },
                  { label: "Fee Management", href: "#features" },
                  { label: "Attendance Tracking", href: "#features" },
                  { label: "Exam & Reports", href: "#features" },
                  { label: "Staff & HR", href: "#features" },
                  { label: "Analytics Dashboard", href: "#features" },
                ].map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm transition-colors hover:text-white">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="mb-5 font-display text-sm font-bold text-white">Contact Us</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                  <span>support@skolmatrixa.com</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <span>+91 98765 43210</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>123, Tech Park,<br />Bengaluru, Karnataka 560001</span>
                </li>
              </ul>
              {/* Status */}
              <div className="mt-6 flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-3 py-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400">All systems operational</span>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/8 pt-8 sm:flex-row">
            <p className="text-sm">
              © 2026 SkolMatrixa. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              {["Privacy Policy", "Terms of Service", "Refund Policy", "Cookie Policy"].map((link) => (
                <a key={link} href="#" className="transition-colors hover:text-white">
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

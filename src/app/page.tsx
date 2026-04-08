/* eslint-disable @next/next/no-img-element */
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
  BookMarked,
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
import AboutPanel from "@/components/shared/AboutPanel";
import HeroFeatures from "@/components/shared/HeroFeatures";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   DATA CONSTANTS
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const FEATURES = [
  {
    icon: GraduationCap,
    title: "Student Management",
    desc: "Complete lifecycle — admissions, profiles, class assignments, CSV bulk imports, and rich academic records all in one place.",
    tag: "Core",
  },
  {
    icon: Users,
    title: "Staff & HR",
    desc: "Manage teachers and staff with defined roles, departments, subject assignments, leave tracking and employment records.",
    tag: "Core",
  },
  {
    icon: ClipboardCheck,
    title: "Attendance Tracking",
    desc: "Mark attendance per class or subject with real-time reports, automated parent alerts, and monthly analytics.",
    tag: "Daily",
  },
  {
    icon: Calendar,
    title: "Timetable Builder",
    desc: "Visual class scheduling with teacher conflict detection, room allocation, and easy period copy tools.",
    tag: "Planning",
  },
  {
    icon: FileText,
    title: "Homework & Assignments",
    desc: "Create, assign and grade homework online. Track completion rates with file upload submissions.",
    tag: "Academic",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    desc: "Send targeted in-app and email notifications to students, parents, and staff by role or class.",
    tag: "Communication",
  },
  {
    icon: Award,
    title: "Exams & Report Cards",
    desc: "Schedule exams, enter marks by subject, auto-calculate grades, and generate beautiful PDF report cards.",
    tag: "Academic",
  },
  {
    icon: Wallet,
    title: "Fee Management",
    desc: "Define structured fee plans, track all payments, generate professional receipts, and send overdue reminders.",
    tag: "Finance",
  },
];

const ICON_STYLES = [
  { bg: "bg-blue-600/10", text: "text-blue-600" },
  { bg: "bg-[#F97066]/10", text: "text-[#F97066]" },
  { bg: "bg-blue-500/10", text: "text-blue-500" },
  { bg: "bg-amber-500/10", text: "text-amber-500" },
];

const TAG_COLORS: Record<string, string> = {
  Core: "bg-blue-500",
  Daily: "bg-orange-500",
  Planning: "bg-orange-400",
  Academic: "bg-pink-500",
  Communication: "bg-cyan-500",
  Finance: "bg-lime-500",
};

const CARD_STYLES = [
  { iconBg: "bg-blue-500", circle: "bg-gradient-to-br from-blue-200/70 to-violet-200/50" },
  { iconBg: "bg-teal-500", circle: "bg-gradient-to-br from-green-200/70 to-teal-200/50" },
  { iconBg: "bg-orange-500", circle: "bg-gradient-to-br from-orange-200/60 to-pink-200/50" },
  { iconBg: "bg-purple-500", circle: "bg-gradient-to-br from-orange-200/60 to-rose-200/50" },
  { iconBg: "bg-pink-500", circle: "bg-gradient-to-br from-green-200/60 to-blue-200/50" },
  { iconBg: "bg-cyan-500", circle: "bg-gradient-to-br from-green-200/60 to-teal-200/50" },
  { iconBg: "bg-amber-500", circle: "bg-gradient-to-br from-purple-200/60 to-violet-200/50" },
  { iconBg: "bg-green-500", circle: "bg-gradient-to-br from-pink-200/60 to-purple-200/50" },
];

const STATS = [
  { value: "10K+", label: "Students Managed", icon: GraduationCap },
  { value: "500+", label: "Institutions Served", icon: Building2 },
  { value: "99.9%", label: "Platform Uptime", icon: Zap },
  { value: "24/7", label: "Expert Support", icon: MessageSquare },
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
  },
  {
    step: "02",
    title: "Configure Your Setup",
    desc: "Add academic year, classes, subjects, and fee structures using our guided setup wizard. Ready in minutes.",
    icon: Layers,
  },
  {
    step: "03",
    title: "Start Managing Everything",
    desc: "Add students, staff, mark attendance, schedule exams, collect fees — manage everything from one dashboard.",
    icon: BarChart3,
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
  },
  {
    quote: "As a coaching institute, we needed batch management that actually works. SkolMatrixa delivered beyond expectations — intuitive, fast, and completely reliable.",
    author: "Rajesh Kumar",
    role: "Director",
    school: "Apex Coaching Centre",
    rating: 5,
    initials: "RK",
  },
  {
    quote: "Report card generation and the parent portal are incredible. Parents love the transparency and our admin team saves days of manual work every term.",
    author: "Anita Desai",
    role: "Administrator",
    school: "St. Mary's Academy",
    rating: 5,
    initials: "AD",
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

const LIBRARY_FEATURES = [
  "Digital book catalog & ISBN search",
  "Member cards & borrowing history",
  "Issue, return & renewal tracking",
  "Automatic overdue fine calculation",
  "Stock inventory & audit reports",
  "E-library resource management",
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   THEME 4 — IMMERSIVE VISUAL
   Palette: Charcoal #1C1C1E, Off-white #F0F7FF,
   Cream #EFF6FF, blue #059669, Coral #F97066
   Fonts: Cormorant Garamond (serif) + Manrope (sans)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#F0F7FF]">

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          HEADER — Glass over charcoal
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#071e3d]/85 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 shadow-lg shadow-blue-600/30 transition-transform group-hover:scale-110">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-white tracking-tight">
              SkolMatrixa
            </span>
          </Link>

          {/* Nav */}
          <nav className="hidden items-center gap-0.5 md:flex">
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
                className="rounded-lg px-3.5 py-2 text-[13px] font-semibold text-white/50 transition-colors hover:text-white hover:bg-white/8"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="hidden rounded-full border border-white/20 px-5 py-2 text-[13px] font-bold text-white/70 transition-all hover:border-white/40 hover:bg-white/8 sm:inline-flex"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2 text-[13px] font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          HERO — Full-bleed background image
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section
        className="relative min-h-[60vh] overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/hero%20section%20img.png')" }}
      >
        {/* Left gradient overlay for text readability over the blue bg area */}
        <div className="absolute inset-0 bg-linear-to-r from-[#0a4899]/80 via-[#0a4899]/45 to-transparent" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-12 pt-20 sm:px-6 lg:px-8">
          <div className="max-w-lg">
            {/* Eyebrow */}
            <div className="animate-slide-up mb-7 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[3px] text-white/90">
              <span className="h-0.5 w-8 bg-white/90" />
              #1 School Management ERP Platform
            </div>

            {/* Headline */}
            <h1 className="animate-slide-up stagger-1 font-display text-5xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-[4.5rem]">
              Inspire. Educate.
              <br />
              <em className="italic text-yellow-300">Transform.</em>
            </h1>

            <p className="animate-slide-up stagger-2 mt-7 max-w-md text-[17px] leading-relaxed text-white/85">
              SkolMatrixa unifies every aspect of school and coaching administration — students, staff, exams, fees, and communication — into one powerful, beautifully simple platform.
            </p>

            {/* Feature points — JS-driven sequential reveal */}
            <HeroFeatures />

            {/* CTAs */}
            <div className="animate-slide-up mt-10 flex flex-col items-start gap-4 sm:flex-row" style={{ animationDelay: '5s' }}>
              <Link
                href="/register"
                className="group inline-flex items-center gap-2.5 rounded-full bg-yellow-400 px-8 py-4 text-base font-bold text-[#1a2b4a] shadow-2xl shadow-yellow-400/30 transition-all duration-300 hover:bg-yellow-300 hover:-translate-y-0.5"
              >
                <GraduationCap className="h-5 w-5" />
                <span>Start Free Trial</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <button className="group flex items-center gap-3 rounded-full border-2 border-white/30 px-7 py-4 text-base font-semibold text-white transition-all duration-300 hover:border-white/50 hover:bg-white/10">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition-all group-hover:bg-white/25">
                  <Play className="h-4 w-4 fill-white text-white" />
                </div>
                Watch Demo
              </button>
            </div>
          </div>
        </div>

      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          TRUST STRIP — Stats bar
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="relative bg-[#071e3d] py-16 sm:py-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.04)_1px,transparent_1px)] bg-size-[40px_40px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-10 text-center text-xs font-bold uppercase tracking-[3px] text-blue-300/50">
            Empowering institutions across India
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/4 p-6 text-center backdrop-blur-sm transition-all hover:border-blue-400/30 hover:bg-white/8">
                <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-blue-600/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20 transition-all group-hover:scale-110 group-hover:bg-blue-600/30">
                    <stat.icon className="h-6 w-6 text-blue-300" />
                  </div>
                  <p className="font-display text-4xl font-bold text-white sm:text-5xl">{stat.value}</p>
                  <p className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-blue-200/50">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          IMAGE STRIP — Educational imagery
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="bg-[#071e3d] pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="pb-8 text-center text-xs font-bold uppercase tracking-[3px] text-blue-300/40">What we enable</p>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { src: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80",  label: "Student Learning",   sub: "Engage & empower every learner",   pill: "Students",  pillColor: "bg-blue-500" },
              { src: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80",  label: "Expert Teaching",   sub: "Tools crafted for educators",       pill: "Teachers",  pillColor: "bg-amber-500" },
              { src: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&q=80",  label: "Exams & Assessment", sub: "Track academic progress clearly",   pill: "Academics", pillColor: "bg-purple-500" },
              { src: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&q=80",  label: "Library & Resources", sub: "Knowledge accessible to all",       pill: "Library",   pillColor: "bg-teal-500" },
            ].map((img) => (
              <div key={img.label} className="group relative h-64 overflow-hidden rounded-2xl sm:h-72 lg:h-80">
                <img
                  src={img.src}
                  alt={img.label}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#071e3d] via-[#071e3d]/30 to-transparent" />
                <div className="absolute inset-0 rounded-2xl border-2 border-white/0 transition-all duration-300 group-hover:border-blue-400/40" />
                <div className="absolute left-4 top-4">
                  <span className={`${img.pillColor} rounded-full px-2.5 py-1 text-[10px] font-bold text-white`}>{img.pill}</span>
                </div>
                <div className="absolute bottom-5 left-5 right-5">
                  <p className="font-display text-base font-bold text-white">{img.label}</p>
                  <p className="mt-1 text-xs text-white/50">{img.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          ABOUT SECTION — Split layout with visual
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="relative overflow-hidden bg-[#EFF6FF]">
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute left-0 bottom-0 h-60 w-60 rounded-full bg-[#F97066]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="grid items-start gap-16 lg:grid-cols-2">
            {/* Left — Rotating dashboard panels */}
            <div className="relative order-2 lg:order-1">
              <AboutPanel />
              {/* Badge overlays */}
              <div className="absolute -right-5 top-12 hidden rounded-2xl border border-blue-200/80 bg-blue-50 p-4 shadow-xl sm:block">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-blue-500 text-blue-500" />
                  <div>
                    <p className="text-xs font-bold text-blue-800">5-Star Rating</p>
                    <p className="text-[10px] text-blue-600">500+ institutions</p>
                  </div>
                </div>
              </div>
              <div className="absolute -left-5 bottom-12 hidden rounded-2xl border border-amber-200/80 bg-amber-50 p-4 shadow-xl sm:block">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="text-xs font-bold text-amber-800">5-Min Setup</p>
                    <p className="text-[10px] text-amber-600">Quick onboarding</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Text */}
            <div className="order-1 lg:order-2">
              <div className="mb-5 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[3px] text-blue-600">
                <span className="h-0.5 w-6 bg-blue-600" />
                About SkolMatrixa
              </div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-[#1C1C1E] sm:text-4xl lg:text-[52px] lg:leading-[1.12]">
                One Platform.{" "}
                <em className="italic text-blue-600">Complete School</em>{" "}
                Management.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-[#8E8E93] sm:text-lg">
                SkolMatrixa is a next-generation cloud-based school management ERP solution, designed to simplify,
                automate, and transform how educational institutions operate. From student admissions to fee collection,
                attendance tracking to exam management — our platform empowers schools and coaching institutes to
                manage everything in one place.
              </p>
              <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-3">
                {[
                  "Unified student, staff & academic management",
                  "Automated fee collection with digital receipts",
                  "Real-time attendance & parent notifications",
                  "Powerful analytics & custom reporting",
                  "Multi-tenant with complete data isolation",
                  "Role-based access for admins, teachers & students",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-[13px] text-[#4A4A4C]">{point}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-10 flex items-center gap-4">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 rounded-full bg-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:-translate-y-0.5"
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

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          CORE FEATURES — Card grid with badges
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section id="features" className="relative overflow-hidden bg-[#F0F7FF] pb-24 pt-12 sm:pb-32 sm:pt-14">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-5 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[3px] text-blue-600">
              <span className="h-0.5 w-6 bg-blue-600" />
              Features
              <span className="h-0.5 w-6 bg-blue-600" />
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-[#1C1C1E] sm:text-4xl lg:text-[52px] lg:leading-[1.12]">
              Everything your institution
              <br />
              needs to <em className="italic text-blue-600">thrive</em>
            </h2>
            <p className="mt-5 text-lg text-[#8E8E93]">
              Crafted with care for the unique needs of Indian educational institutions.
            </p>
          </div>

          {/* Feature cards — 4 column grid */}
          <div className="mx-auto mt-16 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => {
              const card = CARD_STYLES[i];
              const badgeColor = TAG_COLORS[f.tag] || "bg-gray-500";
              return (
                <div
                  key={f.title}
                  className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* Decorative circle */}
                  <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full ${card.circle} opacity-70 transition-transform duration-300 group-hover:scale-125`} />

                  <div className="relative">
                    <div className="mb-4 flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${card.iconBg}`}>
                        <f.icon className="h-5 w-5 text-white" />
                      </div>
                      <span className={`rounded-full ${badgeColor} px-3 py-1 text-[11px] font-bold text-white`}>
                        {f.tag}
                      </span>
                    </div>

                    <h3 className="font-display text-lg font-bold text-[#1C1C1E] mb-2">{f.title}</h3>
                    <p className="text-sm leading-relaxed text-[#8E8E93]">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          SPLIT IMAGE — Visual feature showcase
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="relative overflow-hidden">
        <div className="grid min-h-[500px] lg:grid-cols-2">
          {/* Left — Image */}
          <div className="relative h-64 lg:h-auto">
            <img
              src="https://images.unsplash.com/photo-1588072432836-e10032774350?w=800&q=80"
              alt="Modern school building"
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-transparent to-white hidden lg:block" />
          </div>
          {/* Right — Content */}
          <div className="flex flex-col justify-center bg-white px-8 py-16 sm:px-12 lg:px-16">
            <div className="mb-5 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[3px] text-blue-600">
              <span className="h-0.5 w-6 bg-blue-600" />
              Built for Indian Schools
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-[#1C1C1E] sm:text-4xl lg:text-[40px] lg:leading-[1.15]">
              Purpose-built for
              <br />
              <em className="italic text-blue-600">your institution</em>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[#8E8E93]">
              Designed for CBSE, ICSE, and state board schools. Works seamlessly for coaching institutes and libraries too.
            </p>
            <ul className="mt-7 space-y-3.5">
              {[
                "Multi-tenant isolated architecture",
                "Role-based access control (5 roles)",
                "Smart CSV import wizard",
                "PDF generation engine",
                "Automated email notifications",
                "Real-time analytics dashboard",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-[#4A4A4C]">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          WHY CHOOSE US — Checkpoints + visual cards
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="relative overflow-hidden bg-white py-24 sm:py-32">
        <div className="absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-blue-100/40 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Left — Checklist */}
            <div>
              <div className="mb-5 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[3px] text-blue-600">
                <span className="h-0.5 w-6 bg-blue-600" />
                Why Choose SkolMatrixa?
              </div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-[#1C1C1E] sm:text-4xl lg:text-[52px] lg:leading-[1.12]">
                Tailored for
                <br />
                <em className="italic text-blue-600">your institution</em>
              </h2>
              <p className="mt-5 text-base leading-relaxed text-[#8E8E93] sm:text-lg">
                Purpose-built with CBSE, ICSE, and state board support. Works for schools, coaching institutes, and libraries.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {WHY_CHOOSE.map((item) => (
                  <div
                    key={item.title}
                    className="group flex items-start gap-3 rounded-2xl border border-[#1C1C1E]/5 bg-[#F0F7FF] p-4 transition-all hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-sm shadow-blue-600/20">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1C1C1E]">{item.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-[#8E8E93]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 rounded-full bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:-translate-y-0.5"
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
                  { icon: Shield, title: "Data Security", desc: "Enterprise-grade encryption & complete isolation per institution", bg: "bg-blue-50", iconColor: "text-blue-600" },
                  { icon: TrendingUp, title: "Deep Analytics", desc: "Actionable insights on attendance, fees, and academic performance", bg: "bg-amber-50", iconColor: "text-amber-600" },
                  { icon: Zap, title: "Lightning Fast", desc: "Blazing performance with auto-scaling infrastructure built in", bg: "bg-blue-50", iconColor: "text-blue-600" },
                  { icon: Globe, title: "Access Anywhere", desc: "Cloud-based platform accessible from any device, any location", bg: "bg-[#F97066]/8", iconColor: "text-[#F97066]" },
                  { icon: Cpu, title: "AI-Powered Tools", desc: "Smart automation for routine tasks, saving hours every week", bg: "bg-blue-50", iconColor: "text-blue-600" },
                  { icon: Trophy, title: "Award-Winning", desc: "Recognized as the best school ERP by institutions across India", bg: "bg-amber-50", iconColor: "text-amber-600" },
                ].map((card) => (
                  <div
                    key={card.title}
                    className={`group relative overflow-hidden rounded-2xl p-5 ${card.bg} border border-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md`}
                  >
                    <div className={`mb-3 inline-flex rounded-xl bg-white/80 p-2.5 shadow-sm`}>
                      <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                    </div>
                    <p className="font-display text-sm font-bold text-[#1C1C1E]">{card.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#8E8E93]">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          FULL-WIDTH IMAGE — Analytics showcase
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="relative flex h-[400px] items-center justify-center overflow-hidden sm:h-[500px]">
        <img
          src="https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1600&q=80"
          alt="Modern classroom"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#071e3d]/60" />
        <div className="relative z-10 mx-auto max-w-2xl px-4 text-center">
          <h2 className="font-display text-4xl font-bold text-white sm:text-5xl leading-[1.1]">
            Real-time analytics made <em className="italic text-blue-400">beautiful</em>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base text-white/70 leading-relaxed">
            Track attendance patterns, fee collection, academic performance, and institutional growth with stunning dashboards.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-[#1C1C1E] shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl"
          >
            Explore Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          INSTITUTION TYPES — Schools vs Coaching
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section id="institutions" className="relative overflow-hidden bg-[#F0F7FF] py-24 sm:py-32">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/30 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-5 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[3px] text-blue-600">
              <span className="h-0.5 w-6 bg-blue-600" />
              Built for Your Institution
              <span className="h-0.5 w-6 bg-blue-600" />
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-[#1C1C1E] sm:text-4xl lg:text-[52px] lg:leading-[1.12]">
              Tailored for Schools,{" "}
              <em className="italic text-blue-600">Coaching &amp; Libraries</em>
            </h2>
            <p className="mt-5 text-lg text-[#8E8E93]">
              Register as a School, Coaching Institute, or Library — each with a tailored management experience.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-6xl gap-8 lg:grid-cols-3">
            {/* School card */}
            <div className="group relative overflow-hidden rounded-3xl border-2 border-blue-200 bg-white p-8 transition-all duration-300 hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-600/5">
              <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-blue-100/40 blur-2xl" />
              <div className="relative">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/25">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <div className="mt-5">
                  <h3 className="font-display text-2xl font-bold text-[#1C1C1E]">For Schools</h3>
                  <p className="mt-2 text-sm text-[#8E8E93]">
                    Complete school management with class-based operations, academic calendars, and seamless parent engagement.
                  </p>
                </div>
                <ul className="mt-6 space-y-3">
                  {SCHOOL_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-[#4A4A4C]">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100">
                        <CheckCircle2 className="h-3 w-3 text-blue-600" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register?type=SCHOOL"
                  className="group/btn mt-8 flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700"
                >
                  Register as School
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Coaching card */}
            <div className="group relative overflow-hidden rounded-3xl border-2 border-[#F97066]/30 bg-white p-8 transition-all duration-300 hover:border-[#F97066]/50 hover:shadow-2xl hover:shadow-[#F97066]/5">
              <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#F97066]/10 blur-2xl" />
              <div className="relative">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F97066] shadow-lg shadow-[#F97066]/25">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <div className="mt-5">
                  <h3 className="font-display text-2xl font-bold text-[#1C1C1E]">For Coaching Institutes</h3>
                  <p className="mt-2 text-sm text-[#8E8E93]">
                    Flexible batch-based management built for coaching centres, tutorials, and specialised institutes.
                  </p>
                </div>
                <ul className="mt-6 space-y-3">
                  {COACHING_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-[#4A4A4C]">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F97066]/15">
                        <CheckCircle2 className="h-3 w-3 text-[#F97066]" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register?type=COACHING_INSTITUTE"
                  className="group/btn mt-8 flex items-center gap-2 rounded-full bg-[#F97066] px-6 py-3 text-sm font-bold text-white shadow-md shadow-[#F97066]/20 transition-all hover:bg-[#e8605a]"
                >
                  Register as Coaching
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Library card */}
            <div className="group relative overflow-hidden rounded-3xl border-2 border-teal-200 bg-white p-8 transition-all duration-300 hover:border-teal-300 hover:shadow-2xl hover:shadow-teal-600/5">
              <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-teal-100/40 blur-2xl" />
              <div className="relative">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 shadow-lg shadow-teal-600/25">
                  <BookMarked className="h-8 w-8 text-white" />
                </div>
                <div className="mt-5">
                  <h3 className="font-display text-2xl font-bold text-[#1C1C1E]">For Libraries</h3>
                  <p className="mt-2 text-sm text-[#8E8E93]">
                    Complete library management with digital catalog, member tracking, and automated overdue handling.
                  </p>
                </div>
                <ul className="mt-6 space-y-3">
                  {LIBRARY_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-[#4A4A4C]">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100">
                        <CheckCircle2 className="h-3 w-3 text-teal-600" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register?type=LIBRARY"
                  className="group/btn mt-8 flex items-center gap-2 rounded-full bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-teal-600/20 transition-all hover:bg-teal-700"
                >
                  Register as Library
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          HOW IT WORKS — Charcoal section, blue steps
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section id="how-it-works" className="relative overflow-hidden bg-[#071e3d] py-24 sm:py-32">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.05)_1px,transparent_1px)] bg-[length:60px_60px]" />
        <div className="absolute left-1/4 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-blue-900/20 blur-[120px]" />
        <div className="absolute right-1/4 bottom-0 h-[300px] w-[300px] rounded-full bg-[#F97066]/8 blur-[100px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-5 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[3px] text-blue-400">
              <span className="h-0.5 w-6 bg-blue-400" />
              Getting Started
              <span className="h-0.5 w-6 bg-blue-400" />
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[52px] lg:leading-[1.12]">
              Up and running in
              <br />
              <em className="italic text-blue-400">three simple steps</em>
            </h2>
            <p className="mt-5 text-lg text-white/40">
              No lengthy onboarding. No complex training. Just register, configure, and start managing.
            </p>
          </div>

          {/* Journey steps */}
          <div className="relative mx-auto mt-16 max-w-5xl">
            {/* Dashed connecting line */}
            <div className="absolute left-[25%] right-[25%] top-14 hidden h-px border-t border-dashed border-blue-400/25 lg:block" />

            <div className="grid gap-10 lg:grid-cols-3">
              {STEPS.map((s, i) => (
                <div key={s.step} className="group flex flex-col items-center text-center">
                  {/* Icon ring */}
                  <div className="relative mb-7">
                    <div className="absolute inset-0 scale-150 rounded-full bg-blue-500/10 blur-2xl opacity-0 transition-all duration-500 group-hover:opacity-100" />
                    <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-blue-400/30 bg-linear-to-br from-blue-700 to-blue-950">
                      <s.icon className="h-10 w-10 text-blue-200 transition-transform duration-300 group-hover:scale-110" />
                      {/* Step badge */}
                      <div className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-[11px] font-black text-[#071e3d] shadow-lg">
                        {i + 1}
                      </div>
                    </div>
                  </div>

                  {/* Duration tag */}
                  <div className="mb-4 flex items-center gap-1.5 rounded-full border border-blue-400/20 bg-blue-600/15 px-3 py-1 text-[11px] font-semibold text-blue-300">
                    <Clock className="h-3 w-3" />
                    {(["2 min", "10 min", "Instant"] as const)[i]}
                  </div>

                  <h3 className="font-display text-xl font-bold text-white">{s.title}</h3>
                  <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/50">{s.desc}</p>

                  {/* Bottom accent line */}
                  <div className="mt-5 h-0.5 w-8 rounded-full bg-blue-500/40 transition-all duration-300 group-hover:w-16 group-hover:bg-blue-400" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2.5 rounded-full bg-blue-600 px-9 py-4 text-base font-bold text-white shadow-2xl shadow-blue-600/25 transition-all hover:bg-blue-700 hover:-translate-y-0.5"
            >
              Start for Free Today
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          STATS COUNTER — Cream background
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="relative overflow-hidden bg-[#EFF6FF] py-24 sm:py-28">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <div className="mb-4 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[3px] text-blue-600">
              <span className="h-0.5 w-6 bg-blue-600" />
              Trusted at Scale
              <span className="h-0.5 w-6 bg-blue-600" />
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-[#1C1C1E] sm:text-4xl">
              Numbers that speak for <em className="italic text-blue-600">themselves</em>
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {COUNTER_STATS.map((stat) => (
              <div
                key={stat.label}
                className="group relative overflow-hidden rounded-3xl border border-[#1C1C1E]/5 bg-white p-8 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/10 transition-all group-hover:scale-110">
                    <stat.icon className="h-7 w-7 text-blue-600" />
                  </div>
                  <p className="font-display text-4xl font-bold text-[#1C1C1E] sm:text-5xl">{stat.value}</p>
                  <p className="mt-2 text-sm font-medium text-[#8E8E93]">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          TESTIMONIALS — Dark charcoal section
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section id="testimonials" className="relative overflow-hidden bg-[#071e3d] py-24 sm:py-32">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-5 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[3px] text-blue-400">
              <span className="h-0.5 w-6 bg-blue-400" />
              Testimonials
              <span className="h-0.5 w-6 bg-blue-400" />
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[52px] lg:leading-[1.12]">
              Trusted by educators
              <br />
              <em className="italic text-blue-400">across India</em>
            </h2>
            <p className="mt-5 text-lg text-white/40">
              See what school principals, directors, and administrators say about SkolMatrixa.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-6xl gap-8 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.author}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/8 bg-white/4 p-8 transition-all duration-300 hover:border-white/15 hover:bg-white/6"
              >
                {/* Stars */}
                <div className="mb-5 flex items-center gap-1 text-amber-400">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                {/* Quote */}
                <p className="mb-6 font-display text-base font-medium leading-relaxed text-white/80 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                {/* Author */}
                <div className="mt-auto flex items-center gap-4 border-t border-white/8 pt-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600/20">
                    <span className="font-display text-sm font-bold text-blue-400">{t.initials}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{t.author}</p>
                    <p className="text-xs text-white/40">{t.role}</p>
                    <p className="text-xs font-semibold text-blue-400">{t.school}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          FAQ — Clean accordion
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section id="faq" className="relative overflow-hidden bg-[#F0F7FF] py-24 sm:py-32">
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-5 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[3px] text-blue-600">
              <span className="h-0.5 w-6 bg-blue-600" />
              FAQ
              <span className="h-0.5 w-6 bg-blue-600" />
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-[#1C1C1E] sm:text-4xl lg:text-[52px] lg:leading-[1.12]">
              Questions? <em className="italic text-blue-600">Answered.</em>
            </h2>
          </div>
          <div className="mt-14 space-y-2.5">
            {FAQ.map((item, i) => (
              <details key={i} className="group rounded-2xl border border-[#1C1C1E]/5 bg-white shadow-sm transition-all open:shadow-md open:shadow-blue-600/5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 text-left">
                  <span className="font-display text-base font-semibold text-[#1C1C1E] transition-colors group-open:text-blue-600">
                    {item.q}
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#1C1C1E]/10 bg-[#F0F7FF] transition-all group-open:rotate-45 group-open:border-blue-200 group-open:bg-blue-50">
                    <svg className="h-4 w-4 text-[#8E8E93] group-open:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                </summary>
                <p className="px-6 pb-6 text-sm leading-relaxed text-[#8E8E93]">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          CTA — blue gradient overlay
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="relative overflow-hidden">
        {/* Background with image */}
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1600&q=80" alt="" loading="lazy" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-br from-blue-700/65 via-blue-600/60 to-[#071e3d]/70" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:48px_48px]" />

        <div className="relative mx-auto max-w-4xl px-4 py-28 text-center sm:px-6 sm:py-36 lg:px-8">
          <h2 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1]">
            Ready to transform
            <br />
            <em className="italic">your institution?</em>
          </h2>
          <p className="mx-auto mt-7 max-w-xl text-lg text-white/65">
            Join 500+ schools already using SkolMatrixa. Start free, upgrade when you&apos;re ready.
          </p>
          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="group flex items-center gap-2.5 rounded-full bg-white px-9 py-4.5 text-base font-bold text-[#1C1C1E] shadow-2xl shadow-black/15 transition-all duration-300 hover:scale-[1.03] hover:shadow-black/25"
            >
              <GraduationCap className="h-5 w-5" />
              Start Free Trial
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/contact"
              className="group flex items-center gap-2.5 rounded-full border-2 border-white/25 px-8 py-4.5 text-base font-semibold text-white transition-all duration-300 hover:border-white/50 hover:bg-white/8"
            >
              Talk to Sales
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
              <div key={text} className="flex items-center gap-2 text-sm text-white/45">
                <Icon className="h-4 w-4 text-white/55" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          FOOTER — Deep charcoal
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <footer className="bg-[#071e3d] text-white/35">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 shadow-lg">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <span className="font-display text-xl font-bold text-white tracking-tight">
                  SkolMatrixa
                </span>
              </Link>
              <p className="mt-5 max-w-sm text-sm leading-relaxed">
                India&apos;s leading cloud-based school management ERP for schools, coaching institutes, and libraries.
                Simplify operations, empower educators, and deliver better education outcomes.
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
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/35 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
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
                    <a href={link.href} className="text-sm transition-colors hover:text-blue-400">
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
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#F97066]" />
                  <span>123, Tech Park,<br />Bengaluru, Karnataka 560001</span>
                </li>
              </ul>
              <div className="mt-6 flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-3 py-2">
                <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-xs text-blue-400">All systems operational</span>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/8 pt-8 sm:flex-row">
            <p className="text-sm">
              © 2026 SkolMatrixa. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
              ].map((link) => (
                <a key={link.label} href={link.href} className="transition-colors hover:text-blue-400">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

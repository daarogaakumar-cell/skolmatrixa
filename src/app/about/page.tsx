import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  ArrowRight,
  Target,
  Heart,
  Users,
  Globe,
  Sparkles,
  Shield,
  Zap,
  GraduationCap,
  Star,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | SkolMatrixa — School Management ERP",
  description: "Learn about SkolMatrixa — India's leading school management ERP platform. Our mission, vision, values, and the team behind the platform.",
};

const VALUES = [
  {
    icon: Target,
    title: "Mission-Driven",
    desc: "We exist to simplify school management and empower educators to focus on what matters — teaching.",
    color: "text-teal-600 bg-teal-50 border-teal-100",
  },
  {
    icon: Heart,
    title: "Student-First",
    desc: "Every feature is designed with students, teachers, and parents in mind — ensuring a better educational ecosystem.",
    color: "text-rose-600 bg-rose-50 border-rose-100",
  },
  {
    icon: Shield,
    title: "Trust & Security",
    desc: "Enterprise-grade encryption, role-based access control, and complete data isolation for every institution.",
    color: "text-blue-600 bg-blue-50 border-blue-100",
  },
  {
    icon: Zap,
    title: "Innovation",
    desc: "We continuously evolve our platform with the latest technology to keep your institution ahead of the curve.",
    color: "text-emerald-600 bg-emerald-50 border-emerald-100",
  },
];

const TEAM = [
  { name: "Himanshu Gupta", role: "Founder & CEO", initials: "HG" },
  { name: "Priya Sharma", role: "Head of Product", initials: "PS" },
  { name: "Rahul Verma", role: "Lead Engineer", initials: "RV" },
  { name: "Ananya Singh", role: "Head of Customer Success", initials: "AS" },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#FAFAF8]">

      {/* ── Header ── */}
      <header className="fixed top-0 z-50 w-full glass-header border-b border-slate-200/60">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/20 transition-transform group-hover:scale-105">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 font-[family-name:var(--font-display)]">
              Skol<span className="text-gradient-teal">Matrixa</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:border-teal-200 hover:text-teal-700 hover:bg-teal-50 sm:inline-flex">
              Sign In
            </Link>
            <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-500/20 transition-all hover:brightness-105">
              Get Started Free
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#FAFAF8] pt-36 pb-24">
        <div className="absolute -top-32 left-1/3 h-[500px] w-[500px] rounded-full bg-teal-400/[0.08] blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-cyan-400/[0.06] blur-[120px]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-5 py-2 text-sm font-semibold text-teal-700">
            <Sparkles className="h-3.5 w-3.5 text-teal-500" />
            About SkolMatrixa
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 font-[family-name:var(--font-display)] sm:text-5xl lg:text-6xl">
            Transforming Education
            <span className="block text-gradient-teal">
              One School at a Time
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500">
            SkolMatrixa is India&apos;s leading cloud-based school management ERP platform, trusted by 500+ institutions
            to streamline operations and empower educators.
          </p>
        </div>
      </section>

      {/* ── Our Story ── */}
      <section className="relative bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700">
                <BookOpen className="h-3.5 w-3.5 text-teal-500" />
                Our Story
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-[family-name:var(--font-display)] sm:text-4xl">
                Born from a Simple Vision
              </h2>
              <div className="mt-6 space-y-4 text-slate-500 leading-relaxed">
                <p>
                  SkolMatrixa was born from a firsthand understanding of the administrative challenges faced by
                  schools and coaching institutes across India. From manual attendance registers to complex fee
                  management spreadsheets, we saw how valuable time was being spent on tasks that could be automated.
                </p>
                <p>
                  Our founding team set out to build a comprehensive, modern platform that would bring the power of
                  enterprise resource planning to educational institutions of all sizes — from a 50-student coaching
                  centre to a large K-12 school with multiple branches.
                </p>
                <p>
                  Today, SkolMatrixa serves hundreds of institutions, processing tens of thousands of student records,
                  fee transactions, and attendance reports daily — all with enterprise-grade security and reliability.
                </p>
              </div>
            </div>
            <div className="relative">
              <Image
                src="https://placehold.co/600x450/f0fdfa/0d9488?text=Our+Story"
                alt="SkolMatrixa Story"
                width={600}
                height={450}
                className="rounded-2xl border border-slate-200 shadow-lg"
                unoptimized
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Mission & Vision ── */}
      <section className="relative overflow-hidden bg-[#FAFAF8] py-24">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-3xl border border-teal-100 bg-white p-10 shadow-sm card-lift">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/20">
                <Target className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 font-[family-name:var(--font-display)]">Our Mission</h3>
              <p className="mt-4 text-slate-500 leading-relaxed">
                To democratize school management technology by making enterprise-grade ERP tools accessible,
                affordable, and delightfully simple for every educational institution in India and beyond.
              </p>
            </div>
            <div className="rounded-3xl border border-violet-100 bg-white p-10 shadow-sm card-lift">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
                <Globe className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 font-[family-name:var(--font-display)]">Our Vision</h3>
              <p className="mt-4 text-slate-500 leading-relaxed">
                A world where every school, coaching institute, and library operates at peak efficiency — where
                administrators spend less time on paperwork and more time nurturing the future generation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Our Values ── */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-[family-name:var(--font-display)] sm:text-4xl">Our Core Values</h2>
            <p className="mt-4 text-lg text-slate-500">The principles that guide everything we build.</p>
          </div>
          <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => {
              const colorParts = v.color.split(" ");
              return (
                <div key={v.title} className="group rounded-2xl border border-slate-200 bg-white p-7 transition-all card-lift">
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border ${colorParts[2]} ${colorParts[1]}`}>
                    <v.icon className={`h-6 w-6 ${colorParts[0]}`} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-600 to-cyan-600 py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[length:28px_28px]" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {[
              { value: "500+", label: "Institutions", icon: GraduationCap },
              { value: "50,000+", label: "Students Managed", icon: Users },
              { value: "99.9%", label: "Uptime", icon: Zap },
              { value: "4.9★", label: "Average Rating", icon: Star },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                  <s.icon className="h-6 w-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-white sm:text-4xl">{s.value}</p>
                <p className="mt-1 text-sm text-teal-100">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section className="bg-[#FAFAF8] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-[family-name:var(--font-display)] sm:text-4xl">Meet Our Team</h2>
            <p className="mt-4 text-lg text-slate-500">The passionate people building the future of school management.</p>
          </div>
          <div className="mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((t) => (
              <div key={t.name} className="group rounded-2xl border border-slate-200 bg-white p-6 text-center transition-all card-lift">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/20 text-2xl font-bold text-white">
                  {t.initials}
                </div>
                <h3 className="text-base font-bold text-slate-900">{t.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-600 to-cyan-600 py-24">
        <div className="absolute left-1/4 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-white/[0.06] blur-[120px]" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white font-[family-name:var(--font-display)] sm:text-4xl">
            Ready to Transform Your Institution?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-teal-100">
            Join 500+ schools and coaching institutes that have already modernized their operations with SkolMatrixa.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register" className="group flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-teal-700 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]">
              Get Started Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/contact" className="rounded-2xl border-2 border-white/30 px-8 py-4 text-base font-semibold text-white transition-all hover:border-white/60 hover:bg-white/10">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 bg-slate-900 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-sm text-slate-400">© 2026 SkolMatrixa. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="text-slate-400 hover:text-teal-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-slate-400 hover:text-teal-400 transition-colors">Terms of Service</Link>
            <Link href="/contact" className="text-slate-400 hover:text-teal-400 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

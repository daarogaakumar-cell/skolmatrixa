"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { registerTenant } from "@/actions/auth";
import {
  GraduationCap,
  BookOpen,
  Library,
  ChevronLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Building2,
} from "lucide-react";

type InstitutionType = "SCHOOL" | "COACHING_INSTITUTE" | "LIBRARY";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-white/40">Loading…</div>}>
      <RegisterFlow />
    </Suspense>
  );
}

function RegisterFlow() {
  const searchParams = useSearchParams();
  const defaultType = searchParams.get("type") as InstitutionType | null;
  const [type, setType] = useState<InstitutionType | null>(
    (["SCHOOL", "COACHING_INSTITUTE", "LIBRARY"] as const).includes(
      defaultType as InstitutionType
    )
      ? defaultType
      : null
  );

  if (!type) return <TypeSelector onSelect={setType} />;
  return <RegisterForm type={type} onBack={() => setType(null)} />;
}

// ─── Type Selector ──────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  SCHOOL: {
    label: "School",
    icon: GraduationCap,
    description: "K-12 schools, primary, middle, or senior secondary with standard curriculum",
    accent: "border-blue-500/40 hover:border-blue-400/60",
    iconBg: "bg-blue-600",
    iconShadow: "shadow-blue-600/30",
  },
  COACHING_INSTITUTE: {
    label: "Coaching Institute",
    icon: BookOpen,
    description: "JEE, NEET, competitive exam prep, skill development & specialised coaching",
    accent: "border-orange-500/40 hover:border-orange-400/60",
    iconBg: "bg-[#F97066]",
    iconShadow: "shadow-[#F97066]/30",
  },
  LIBRARY: {
    label: "Library",
    icon: Library,
    description: "Public, private, academic or school libraries and community reading centres",
    accent: "border-teal-500/40 hover:border-teal-400/60",
    iconBg: "bg-teal-600",
    iconShadow: "shadow-teal-600/30",
  },
} as const;

function TypeSelector({ onSelect }: { onSelect: (t: InstitutionType) => void }) {
  return (
    <div className="px-8 py-10 sm:px-10">
      <div className="mb-8 text-center">
        <h2 className="font-display text-2xl font-bold text-white">
          What type of institution?
        </h2>
        <p className="mt-1.5 text-sm text-white/40">
          Choose your institution type for a tailored setup experience
        </p>
      </div>

      <div className="space-y-3">
        {(["SCHOOL", "COACHING_INSTITUTE", "LIBRARY"] as const).map((t) => {
          const cfg = TYPE_CONFIG[t];
          const Icon = cfg.icon;
          return (
            <button
              key={t}
              type="button"
              onClick={() => onSelect(t)}
              className={`group flex w-full items-center gap-4 rounded-2xl border bg-white/[0.03] p-4 text-left transition-all duration-200 hover:bg-white/[0.06] ${cfg.accent}`}
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${cfg.iconBg} shadow-lg ${cfg.iconShadow}`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">{cfg.label}</p>
                <p className="mt-0.5 truncate text-xs text-white/35">{cfg.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-white/50" />
            </button>
          );
        })}
      </div>

      <p className="mt-8 text-center text-sm text-white/30">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-blue-400 transition-colors hover:text-blue-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}

// ─── Type-specific option lists ──────────────────────────────────────────────

const SCHOOL_LEVELS = [
  "Primary (Class 1–5)", "Middle (Class 6–8)", "Secondary (Class 9–10)",
  "Senior Secondary (Class 11–12)", "K-12 (All Classes)",
];
const BOARDS = ["CBSE", "ICSE", "State Board", "IB", "Cambridge", "Other"];
const COACHING_FOCUSES = [
  "JEE", "NEET", "Foundation", "UPSC / Govt. Exams",
  "Board Preparation", "Skill Development", "Other",
];
const TEACHING_MODES = ["Offline", "Online", "Hybrid"];
const LIBRARY_TYPES = [
  "Public Library", "Private / Community Library", "Academic / College Library",
  "School Library", "Special Library",
];
const LIBRARY_SPECS = [
  "General", "Science & Technology", "Medical & Health",
  "Law", "Business & Finance", "Arts & Humanities", "Children's Library",
];

// ─── Shared styles ───────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-white/[0.08] bg-white/[0.05] px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-blue-500/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-blue-500/20";

const selectCls =
  "w-full rounded-xl border border-white/[0.08] bg-[#04102a] px-3.5 py-2.5 text-sm text-white/80 outline-none transition-all focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20";

const labelCls = "block text-[11px] font-semibold uppercase tracking-widest text-white/40";

// ─── Registration Form ───────────────────────────────────────────────────────

function RegisterForm({ type, onBack }: { type: InstitutionType; onBack: () => void }) {
  const router = useRouter();
  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("type", type);
    try {
      const result = await registerTenant(formData);
      if (result.success) {
        router.push("/login?registered=true");
      } else {
        setError(result.error || "Registration failed");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const placeholderName =
    type === "SCHOOL" ? "e.g., Delhi Public School"
    : type === "COACHING_INSTITUTE" ? "e.g., Aakash Institute"
    : "e.g., City Central Library";

  return (
    <div className="px-8 py-8 sm:px-10">
      {/* Back + header */}
      <div className="mb-6">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center gap-1.5 text-xs text-white/30 transition-colors hover:text-white/60"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Change institution type
        </button>
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cfg.iconBg} shadow-lg ${cfg.iconShadow}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-white">Register {cfg.label}</h2>
            <p className="text-xs text-white/35">Pending admin review after submission</p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Institution Name */}
        <div className="space-y-1.5">
          <label className={labelCls}>{cfg.label} Name *</label>
          <input name="institutionName" placeholder={placeholderName} required className={inputCls} />
        </div>

        {/* Contact */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={labelCls}>Official Email *</label>
            <input name="email" type="email" placeholder="info@institution.com" required className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Phone</label>
            <input name="phone" placeholder="+91 98765 43210" className={inputCls} />
          </div>
        </div>

        {/* Location */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={labelCls}>City</label>
            <input name="city" placeholder="Mumbai" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>State</label>
            <input name="state" placeholder="Maharashtra" className={inputCls} />
          </div>
        </div>

        {/* School-specific */}
        {type === "SCHOOL" && (
          <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 p-4 space-y-3">
            <p className="block text-[11px] font-semibold uppercase tracking-widest text-blue-400/70">School Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelCls}>School Level</label>
                <select name="schoolLevel" className={selectCls}>
                  <option value="">Select…</option>
                  {SCHOOL_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Board Affiliation</label>
                <select name="boardAffiliation" className={selectCls}>
                  <option value="">Select…</option>
                  {BOARDS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Coaching-specific */}
        {type === "COACHING_INSTITUTE" && (
          <div className="rounded-xl border border-orange-500/15 bg-orange-500/5 p-4 space-y-3">
            <p className="block text-[11px] font-semibold uppercase tracking-widest text-orange-400/70">Institute Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelCls}>Focus / Target Exam</label>
                <select name="coachingFocus" className={selectCls}>
                  <option value="">Select…</option>
                  {COACHING_FOCUSES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Teaching Mode</label>
                <select name="teachingMode" className={selectCls}>
                  <option value="">Select…</option>
                  {TEACHING_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Library-specific */}
        {type === "LIBRARY" && (
          <div className="rounded-xl border border-teal-500/15 bg-teal-500/5 p-4 space-y-3">
            <p className="block text-[11px] font-semibold uppercase tracking-widest text-teal-400/70">Library Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelCls}>Library Type</label>
                <select name="libraryType" className={selectCls}>
                  <option value="">Select…</option>
                  {LIBRARY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Specialization</label>
                <select name="librarySpec" className={selectCls}>
                  <option value="">Select…</option>
                  {LIBRARY_SPECS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Admin Account */}
        <div className="space-y-3 border-t border-white/[0.06] pt-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-white/25" />
            <p className={labelCls}>Admin Account</p>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Your Name *</label>
            <input name="adminName" placeholder="Full name" required className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Your Email *</label>
            <input name="adminEmail" type="email" placeholder="you@example.com" required className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelCls}>Password *</label>
              <div className="relative">
                <input
                  name="adminPassword"
                  type={showPw ? "text" : "password"}
                  placeholder="Min 8 chars"
                  required
                  className={`${inputCls} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/55"
                >
                  {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Confirm *</label>
              <input
                name="confirmPassword"
                type={showPw ? "text" : "password"}
                placeholder="Re-enter"
                required
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`group flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-bold text-white shadow-lg transition-all disabled:opacity-50 ${cfg.iconBg} hover:opacity-90`}
        >
          {loading ? (
            <span className="flex items-center gap-2.5">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Registering…
            </span>
          ) : (
            <>
              <Icon className="h-4 w-4" />
              Register {cfg.label}
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/30">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-blue-400 transition-colors hover:text-blue-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}
"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { registerTenant } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GraduationCap,
  BookOpen,
  Library,
  ChevronLeft,
  ArrowRight,
  Loader2,
  UserPlus,
} from "lucide-react";

type InstitutionType = "SCHOOL" | "COACHING_INSTITUTE" | "LIBRARY";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
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
    gradient: "from-blue-500 to-indigo-600",
    shadow: "shadow-blue-500/25",
    bgHover: "hover:border-blue-400 hover:bg-blue-50/60",
    iconColor: "text-blue-600",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    sectionBg: "bg-blue-50/50 border-blue-100",
    sectionTitle: "text-blue-700",
  },
  COACHING_INSTITUTE: {
    label: "Coaching Institute",
    icon: BookOpen,
    description: "JEE, NEET, competitive exam prep, skill development & specialised coaching",
    gradient: "from-purple-500 to-violet-600",
    shadow: "shadow-purple-500/25",
    bgHover: "hover:border-purple-400 hover:bg-purple-50/60",
    iconColor: "text-purple-600",
    badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
    sectionBg: "bg-purple-50/50 border-purple-100",
    sectionTitle: "text-purple-700",
  },
  LIBRARY: {
    label: "Library",
    icon: Library,
    description: "Public, private, academic or school libraries and community reading centres",
    gradient: "from-emerald-500 to-teal-600",
    shadow: "shadow-emerald-500/25",
    bgHover: "hover:border-emerald-400 hover:bg-emerald-50/60",
    iconColor: "text-emerald-600",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    sectionBg: "bg-emerald-50/50 border-emerald-100",
    sectionTitle: "text-emerald-700",
  },
} as const;

function TypeSelector({ onSelect }: { onSelect: (t: InstitutionType) => void }) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          What type of institution are you?
        </h1>
        <p className="mt-1.5 text-sm text-gray-500">
          Choose your institution type for a tailored setup experience
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {(["SCHOOL", "COACHING_INSTITUTE", "LIBRARY"] as const).map((t) => {
          const cfg = TYPE_CONFIG[t];
          const Icon = cfg.icon;
          return (
            <button
              key={t}
              type="button"
              onClick={() => onSelect(t)}
              className={`group flex flex-col items-center gap-4 rounded-2xl border-2 border-gray-200 p-6 text-center transition-all duration-200 ${cfg.bgHover}`}
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br ${cfg.gradient} ${cfg.shadow} shadow-lg`}>
                <Icon className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">{cfg.label}</div>
                <div className="mt-1 text-xs leading-relaxed text-gray-500">
                  {cfg.description}
                </div>
              </div>
              <div className={`flex items-center gap-1 text-xs font-semibold ${cfg.iconColor} opacity-0 group-hover:opacity-100 transition-opacity`}>
                Get started <ArrowRight className="h-3 w-3" />
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">Already registered?</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
      <Link
        href="/login"
        className="mt-4 flex h-10 w-full items-center justify-center rounded-md border-2 border-gray-200 bg-white text-sm font-semibold text-gray-700 transition-all hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50/50"
      >
        Sign in instead
      </Link>
    </div>
  );
}

// ─── Type-specific option lists ──────────────────────────────────────────────

const SCHOOL_LEVELS = [
  "Primary (Class 1–5)",
  "Middle (Class 6–8)",
  "Secondary (Class 9–10)",
  "Senior Secondary (Class 11–12)",
  "K-12 (All Classes)",
];
const BOARDS = ["CBSE", "ICSE", "State Board", "IB", "Cambridge", "Other"];
const COACHING_FOCUSES = [
  "JEE",
  "NEET",
  "Foundation",
  "UPSC / Govt. Exams",
  "Board Preparation",
  "Skill Development",
  "Other",
];
const TEACHING_MODES = ["Offline", "Online", "Hybrid"];
const LIBRARY_TYPES = [
  "Public Library",
  "Private / Community Library",
  "Academic / College Library",
  "School Library",
  "Special Library",
];
const LIBRARY_SPECS = [
  "General",
  "Science & Technology",
  "Medical & Health",
  "Law",
  "Business & Finance",
  "Arts & Humanities",
  "Children's Library",
];

const selectClass =
  "flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 transition-colors";

// ─── Registration Form ───────────────────────────────────────────────────────

function RegisterForm({
  type,
  onBack,
}: {
  type: InstitutionType;
  onBack: () => void;
}) {
  const router = useRouter();
  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    type === "SCHOOL"
      ? "e.g., Delhi Public School"
      : type === "COACHING_INSTITUTE"
      ? "e.g., Aakash Institute"
      : "e.g., City Central Library";

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="mb-5 flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
      >
        <ChevronLeft className="h-4 w-4" /> Change type
      </button>

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br ${cfg.gradient} ${cfg.shadow} shadow-lg`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            Register {cfg.label}
          </h1>
          <p className="text-xs text-gray-500">
            Create your account — pending admin approval
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {/* ── Institution Name ── */}
        <div className="space-y-1.5">
          <Label htmlFor="institutionName" className="text-sm font-medium text-gray-700">
            {cfg.label} Name *
          </Label>
          <Input
            id="institutionName"
            name="institutionName"
            placeholder={placeholderName}
            required
            className="h-10 bg-white border-gray-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/20"
          />
        </div>

        {/* ── Contact ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Official Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="info@institution.com"
              required
              className="h-10 bg-white border-gray-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/20"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="+91 98765 43210"
              className="h-10 bg-white border-gray-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/20"
            />
          </div>
        </div>

        {/* ── Location ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-sm font-medium text-gray-700">City</Label>
            <Input
              id="city"
              name="city"
              placeholder="Mumbai"
              className="h-10 bg-white border-gray-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/20"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="state" className="text-sm font-medium text-gray-700">State</Label>
            <Input
              id="state"
              name="state"
              placeholder="Maharashtra"
              className="h-10 bg-white border-gray-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/20"
            />
          </div>
        </div>

        {/* ── School-specific ── */}
        {type === "SCHOOL" && (
          <div className={`rounded-xl border ${cfg.sectionBg} p-4 space-y-3`}>
            <p className={`text-xs font-bold uppercase tracking-widest ${cfg.sectionTitle}`}>
              School Details
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="schoolLevel" className="text-xs font-medium text-gray-600">School Level</Label>
                <select id="schoolLevel" name="schoolLevel" className={selectClass}>
                  <option value="">Select...</option>
                  {SCHOOL_LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="boardAffiliation" className="text-xs font-medium text-gray-600">Board Affiliation</Label>
                <select id="boardAffiliation" name="boardAffiliation" className={selectClass}>
                  <option value="">Select...</option>
                  {BOARDS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── Coaching-specific ── */}
        {type === "COACHING_INSTITUTE" && (
          <div className={`rounded-xl border ${cfg.sectionBg} p-4 space-y-3`}>
            <p className={`text-xs font-bold uppercase tracking-widest ${cfg.sectionTitle}`}>
              Institute Details
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="coachingFocus" className="text-xs font-medium text-gray-600">Focus / Target Exam</Label>
                <select id="coachingFocus" name="coachingFocus" className={selectClass}>
                  <option value="">Select...</option>
                  {COACHING_FOCUSES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="teachingMode" className="text-xs font-medium text-gray-600">Teaching Mode</Label>
                <select id="teachingMode" name="teachingMode" className={selectClass}>
                  <option value="">Select...</option>
                  {TEACHING_MODES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── Library-specific ── */}
        {type === "LIBRARY" && (
          <div className={`rounded-xl border ${cfg.sectionBg} p-4 space-y-3`}>
            <p className={`text-xs font-bold uppercase tracking-widest ${cfg.sectionTitle}`}>
              Library Details
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="libraryType" className="text-xs font-medium text-gray-600">Library Type</Label>
                <select id="libraryType" name="libraryType" className={selectClass}>
                  <option value="">Select...</option>
                  {LIBRARY_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="librarySpec" className="text-xs font-medium text-gray-600">Specialization</Label>
                <select id="librarySpec" name="librarySpec" className={selectClass}>
                  <option value="">Select...</option>
                  {LIBRARY_SPECS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── Admin Account ── */}
        <div className="space-y-3 border-t border-gray-200 pt-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Admin Account
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="adminName" className="text-sm font-medium text-gray-700">Your Name *</Label>
            <Input
              id="adminName"
              name="adminName"
              placeholder="Full name"
              required
              className="h-10 bg-white border-gray-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/20"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adminEmail" className="text-sm font-medium text-gray-700">Your Email *</Label>
            <Input
              id="adminEmail"
              name="adminEmail"
              type="email"
              placeholder="you@example.com"
              required
              className="h-10 bg-white border-gray-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="adminPassword" className="text-sm font-medium text-gray-700">Password *</Label>
              <Input
                id="adminPassword"
                name="adminPassword"
                type="password"
                placeholder="Min 8 characters"
                required
                className="h-10 bg-white border-gray-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/20"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Re-enter"
                required
                className="h-10 bg-white border-gray-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/20"
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full bg-linear-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg shadow-amber-500/20 hover:from-amber-600 hover:to-orange-600 hover:shadow-amber-500/30 transition-all duration-200"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registering...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Register {cfg.label}
            </>
          )}
        </Button>
      </form>

      {/* Sign in link */}
      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-amber-600 hover:text-amber-700 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}

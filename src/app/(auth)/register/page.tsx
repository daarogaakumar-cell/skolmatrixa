"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { registerTenant } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  GraduationCap,
  BookOpen,
  Library,
  ChevronLeft,
  ArrowRight,
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
    accent: "emerald",
    cardClass:
      "border-emerald-200 hover:border-emerald-400 bg-emerald-50/50 hover:bg-emerald-50",
    iconClass: "text-emerald-600",
    textClass: "text-emerald-600",
  },
  COACHING_INSTITUTE: {
    label: "Coaching Institute",
    icon: BookOpen,
    description: "JEE, NEET, competitive exam prep, skill development & specialised coaching",
    accent: "coral",
    cardClass:
      "border-[#F97066]/30 hover:border-[#F97066]/60 bg-[#F97066]/5 hover:bg-[#F97066]/10",
    iconClass: "text-[#F97066]",
    textClass: "text-[#F97066]",
  },
  LIBRARY: {
    label: "Library",
    icon: Library,
    description: "Public, private, academic or school libraries and community reading centres",
    accent: "amber",
    cardClass:
      "border-amber-200 hover:border-amber-400 bg-amber-50/50 hover:bg-amber-50",
    iconClass: "text-amber-600",
    textClass: "text-amber-600",
  },
} as const;

function TypeSelector({ onSelect }: { onSelect: (t: InstitutionType) => void }) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#1C1C1E]">What type of <em className="italic text-emerald-600">institution</em> are you?</h1>
        <p className="mt-2 text-[#8E8E93]">
          Choose your institution type to get a tailored registration &amp; setup experience
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {(["SCHOOL", "COACHING_INSTITUTE", "LIBRARY"] as const).map((t) => {
          const cfg = TYPE_CONFIG[t];
          const Icon = cfg.icon;
          return (
            <button
              key={t}
              type="button"
              onClick={() => onSelect(t)}
              className={`group flex flex-col items-center gap-4 rounded-2xl border-2 p-6 text-center transition-all duration-200 ${cfg.cardClass}`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-sm">
                <Icon className={`h-7 w-7 ${cfg.iconClass}`} />
              </div>
              <div>
                <div className="font-semibold text-foreground">{cfg.label}</div>
                <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {cfg.description}
                </div>
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${cfg.textClass}`}>
                Get started <ArrowRight className="h-3 w-3" />
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-center text-sm text-[#8E8E93]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline">
          Sign in
        </Link>
      </p>
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
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <button
          type="button"
          onClick={onBack}
          className="mb-3 flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Change type
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
            <Icon className={`h-5 w-5 ${cfg.iconClass}`} />
          </div>
          <div>
            <CardTitle>Register {cfg.label}</CardTitle>
            <CardDescription>
              Create your {cfg.label.toLowerCase()} account — pending admin approval
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* ── Institution Name ── */}
          <div className="space-y-1.5">
            <Label htmlFor="institutionName">{cfg.label} Name *</Label>
            <Input
              id="institutionName"
              name="institutionName"
              placeholder={placeholderName}
              required
            />
          </div>

          {/* ── Contact ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Official Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="info@institution.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" placeholder="+91 98765 43210" />
            </div>
          </div>

          {/* ── Location ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" placeholder="Mumbai" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" placeholder="Maharashtra" />
            </div>
          </div>

          {/* ── School-specific ── */}
          {type === "SCHOOL" && (
            <div className="rounded-lg border bg-emerald-50/40 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                School Details
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="schoolLevel">School Level</Label>
                  <select
                    id="schoolLevel"
                    name="schoolLevel"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Select...</option>
                    {SCHOOL_LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="boardAffiliation">Board Affiliation</Label>
                  <select
                    id="boardAffiliation"
                    name="boardAffiliation"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Select...</option>
                    {BOARDS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── Coaching-specific ── */}
          {type === "COACHING_INSTITUTE" && (
            <div className="rounded-lg border bg-[#F97066]/5 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#F97066]">
                Institute Details
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="coachingFocus">Focus / Target Exam</Label>
                  <select
                    id="coachingFocus"
                    name="coachingFocus"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Select...</option>
                    {COACHING_FOCUSES.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="teachingMode">Teaching Mode</Label>
                  <select
                    id="teachingMode"
                    name="teachingMode"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Select...</option>
                    {TEACHING_MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── Library-specific ── */}
          {type === "LIBRARY" && (
            <div className="rounded-lg border bg-emerald-50/40 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Library Details
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="libraryType">Library Type</Label>
                  <select
                    id="libraryType"
                    name="libraryType"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Select...</option>
                    {LIBRARY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="librarySpec">Specialization</Label>
                  <select
                    id="librarySpec"
                    name="librarySpec"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Select...</option>
                    {LIBRARY_SPECS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── Admin Account ── */}
          <div className="space-y-3 border-t pt-4">
            <p className="text-sm font-medium text-muted-foreground">Admin Account</p>
            <div className="space-y-1.5">
              <Label htmlFor="adminName">Your Name *</Label>
              <Input id="adminName" name="adminName" placeholder="Full name" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adminEmail">Your Email *</Label>
              <Input
                id="adminEmail"
                name="adminEmail"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="adminPassword">Password *</Label>
                <Input
                  id="adminPassword"
                  name="adminPassword"
                  type="password"
                  placeholder="Min 8 characters"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Re-enter"
                  required
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20" disabled={loading}>
            {loading ? "Registering..." : `Register ${cfg.label}`}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center text-sm text-[#8E8E93]">
        Already have an account?{" "}
        <Link href="/login" className="ml-1 font-medium text-emerald-600 hover:text-emerald-700 hover:underline">
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
}

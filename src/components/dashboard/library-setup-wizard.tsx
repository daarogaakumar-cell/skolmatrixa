"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { FileUpload } from "@/components/shared/file-upload";
import { completeLibrarySetup } from "@/actions/academic";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Building2,
  BookCopy,
  Users,
  Plus,
  X,
  Loader2,
  Library,
  Sparkles,
} from "lucide-react";

interface TenantData {
  id: string;
  name: string;
  type: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  website: string | null;
  logoUrl: string | null;
  settings: unknown;
  setupCompleted: boolean;
}

interface MembershipPlan {
  key: string;
  name: string;
  durationDays: number;
  fee: number;
  maxBooks: number;
}

const LIBRARY_TYPES = [
  "Public Library",
  "Private / Community Library",
  "Academic / College Library",
  "School Library",
  "Special Library",
];

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const PRESET_SECTIONS = [
  "Fiction",
  "Non-Fiction",
  "Reference",
  "Periodicals",
  "Biography & Autobiography",
  "Children's Books",
  "Science & Technology",
  "History",
  "Philosophy",
  "Social Sciences",
  "Arts & Recreation",
  "Language & Literature",
  "Law",
  "Medical & Health",
  "Business & Finance",
];

const PRESET_PLANS: Omit<MembershipPlan, "key">[] = [
  { name: "Free", durationDays: 0, fee: 0, maxBooks: 2 },
  { name: "Monthly", durationDays: 30, fee: 100, maxBooks: 3 },
  { name: "Quarterly", durationDays: 90, fee: 250, maxBooks: 5 },
  { name: "Annual", durationDays: 365, fee: 800, maxBooks: 8 },
];

const STEPS = [
  { id: 1, label: "Profile", icon: Building2 },
  { id: 2, label: "Catalog", icon: BookCopy },
  { id: 3, label: "Membership", icon: Users },
];

export function LibrarySetupWizard({ tenant }: { tenant: TenantData }) {
  const router = useRouter();
  const initialSettings = (tenant.settings as Record<string, unknown>) ?? {};
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Profile
  const [profile, setProfile] = useState({
    name: tenant.name,
    phone: tenant.phone ?? "",
    address: tenant.address ?? "",
    city: tenant.city ?? "",
    state: tenant.state ?? "",
    pincode: tenant.pincode ?? "",
    website: tenant.website ?? "",
    logoUrl: tenant.logoUrl ?? "",
    libraryType: (initialSettings.libraryType as string) ?? "",
    openTime: "",
    closeTime: "",
    finePerDay: 0,
  });

  // Closed days (multi-select)
  const [closedDays, setClosedDays] = useState<string[]>([]);

  function toggleDay(d: string) {
    setClosedDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  // Step 2: Catalog sections
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [customSection, setCustomSection] = useState("");

  function toggleSection(s: string) {
    setSelectedSections((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function addCustomSection() {
    const trimmed = customSection.trim();
    if (!trimmed || selectedSections.includes(trimmed)) return;
    setSelectedSections((prev) => [...prev, trimmed]);
    setCustomSection("");
  }

  // Step 3: Membership plans
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  function addPresetPlan(preset: Omit<MembershipPlan, "key">) {
    if (plans.some((p) => p.name === preset.name)) return;
    setPlans((prev) => [...prev, { key: crypto.randomUUID(), ...preset }]);
  }

  function addCustomPlan() {
    setPlans((prev) => [
      ...prev,
      { key: crypto.randomUUID(), name: "", durationDays: 30, fee: 0, maxBooks: 3 },
    ]);
  }

  function removePlan(key: string) {
    setPlans((prev) => prev.filter((p) => p.key !== key));
  }

  function updatePlan(key: string, field: keyof MembershipPlan, value: string | number) {
    setPlans((prev) =>
      prev.map((p) => (p.key === key ? { ...p, [field]: value } : p))
    );
  }

  // Validation
  function canProceed(): boolean {
    if (step === 1) return profile.name.trim().length > 0;
    if (step === 2) return true; // sections are optional
    return true;
  }

  // Submit
  async function handleComplete() {
    setSubmitting(true);
    try {
      const result = await completeLibrarySetup({
        profile: {
          name: profile.name,
          phone: profile.phone || undefined,
          address: profile.address || undefined,
          city: profile.city || undefined,
          state: profile.state || undefined,
          pincode: profile.pincode || undefined,
          website: profile.website || undefined,
          logoUrl: profile.logoUrl || undefined,
          libraryType: profile.libraryType || undefined,
          openTime: profile.openTime || undefined,
          closeTime: profile.closeTime || undefined,
          closedDays: closedDays.length > 0 ? closedDays.join(",") : undefined,
          finePerDay: profile.finePerDay > 0 ? profile.finePerDay : undefined,
        },
        catalogSections: selectedSections,
        membershipPlans: plans
          .filter((p) => p.name.trim())
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .map(({ key, ...rest }) => rest),
      });

      if (!result.success) {
        toast.error(result.error ?? "Setup failed");
        return;
      }

      toast.success("Library setup complete! Welcome to your dashboard.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-emerald-50/20 to-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
            <Library className="h-6 w-6 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Set up {tenant.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Configure your library in a few simple steps
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-0">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                      step > s.id
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : step === s.id
                        ? "border-emerald-600 bg-emerald-50 text-emerald-600"
                        : "border-muted-foreground/30 bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > s.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <s.icon className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={`mt-1.5 text-xs font-medium ${
                      step >= s.id ? "text-emerald-700" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`mx-3 mb-5 h-0.5 w-16 sm:w-28 ${
                      step > s.id ? "bg-emerald-600" : "bg-muted-foreground/20"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="border-0 shadow-lg">
          {/* ── STEP 1: Profile ── */}
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle>Library Profile</CardTitle>
                <CardDescription>
                  Basic information and operating details for your library
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label>Library Name *</Label>
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      placeholder="Enter library name"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label>Logo</Label>
                    <FileUpload
                      folder="logo"
                      accept="image/*"
                      maxSizeMB={2}
                      onUpload={(url) => setProfile({ ...profile, logoUrl: url })}
                      currentUrl={profile.logoUrl || null}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>

                  <div>
                    <Label>Website</Label>
                    <Input
                      value={profile.website}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label>Address</Label>
                    <Input
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      placeholder="Street address"
                    />
                  </div>

                  <div>
                    <Label>City</Label>
                    <Input
                      value={profile.city}
                      onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>State</Label>
                    <Input
                      value={profile.state}
                      onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Pincode</Label>
                    <Input
                      value={profile.pincode}
                      onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Library Type</Label>
                    <select
                      value={profile.libraryType}
                      onChange={(e) => setProfile({ ...profile, libraryType: e.target.value })}
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
                </div>

                {/* Operating Hours */}
                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <p className="text-sm font-medium">Operating Hours</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <Label className="text-xs">Opens At</Label>
                      <Input
                        type="time"
                        value={profile.openTime}
                        onChange={(e) => setProfile({ ...profile, openTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Closes At</Label>
                      <Input
                        type="time"
                        value={profile.closeTime}
                        onChange={(e) => setProfile({ ...profile, closeTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Fine / Day Overdue (₹)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={profile.finePerDay || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, finePerDay: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="e.g. 5"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Closed On</Label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {DAYS.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDay(d)}
                          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                            closedDays.includes(d)
                              ? "bg-destructive text-destructive-foreground"
                              : "bg-muted text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* ── STEP 2: Catalog Sections ── */}
          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle>Catalog Sections</CardTitle>
                <CardDescription>
                  Choose genre/subject sections for your library catalog. You can add more later.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Preset section chips */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium">Suggested Sections</span>
                    <span className="text-xs text-muted-foreground">(click to toggle)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_SECTIONS.map((s) => {
                      const active = selectedSections.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleSection(s)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                            active
                              ? "border-emerald-500 bg-emerald-100 text-emerald-700"
                              : "border-border bg-background text-muted-foreground hover:border-emerald-300 hover:bg-emerald-50"
                          }`}
                        >
                          {active && <Check className="mr-1 inline h-3 w-3" />}
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom section input */}
                <div>
                  <Label className="text-sm font-medium">Add Custom Section</Label>
                  <div className="mt-1.5 flex gap-2">
                    <Input
                      value={customSection}
                      onChange={(e) => setCustomSection(e.target.value)}
                      placeholder="e.g., Regional Languages"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSection())}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addCustomSection}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Selected sections summary */}
                {selectedSections.length > 0 && (
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Selected ({selectedSections.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSections.map((s) => (
                        <span
                          key={s}
                          className="flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-3 py-0.5 text-xs font-medium text-emerald-700"
                        >
                          {s}
                          <button
                            type="button"
                            onClick={() => toggleSection(s)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSections.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No sections selected yet — you can skip this and configure later.
                  </p>
                )}
              </CardContent>
            </>
          )}

          {/* ── STEP 3: Membership Plans ── */}
          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle>Membership Plans</CardTitle>
                <CardDescription>
                  Define how members can borrow books. You can skip this and configure later.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Quick-add presets */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium">Quick Add Preset Plans</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_PLANS.map((preset) => {
                      const added = plans.some((p) => p.name === preset.name);
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          disabled={added}
                          onClick={() => addPresetPlan(preset)}
                          className={`rounded-lg border px-3 py-2 text-left transition-all ${
                            added
                              ? "border-emerald-300 bg-emerald-50 text-emerald-600 opacity-60"
                              : "border-border bg-background hover:border-emerald-300 hover:bg-emerald-50"
                          }`}
                        >
                          <div className="text-sm font-medium">{preset.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {preset.durationDays === 0
                              ? "Lifetime"
                              : `${preset.durationDays} days`}{" "}
                            · ₹{preset.fee} · {preset.maxBooks} books
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Plans list */}
                {plans.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Your Plans</p>
                    {/* Header row */}
                    <div className="grid grid-cols-[1fr_80px_80px_80px_36px] gap-2 px-1">
                      <span className="text-xs font-medium text-muted-foreground">Plan Name</span>
                      <span className="text-xs font-medium text-muted-foreground text-center">Days</span>
                      <span className="text-xs font-medium text-muted-foreground text-center">Fee (₹)</span>
                      <span className="text-xs font-medium text-muted-foreground text-center">Max Books</span>
                      <span />
                    </div>
                    {plans.map((plan) => (
                      <div
                        key={plan.key}
                        className="grid grid-cols-[1fr_80px_80px_80px_36px] items-center gap-2 rounded-lg border bg-card p-2"
                      >
                        <Input
                          value={plan.name}
                          onChange={(e) => updatePlan(plan.key, "name", e.target.value)}
                          placeholder="Plan name"
                          className="h-8 text-sm"
                        />
                        <Input
                          type="number"
                          min={0}
                          value={plan.durationDays}
                          onChange={(e) =>
                            updatePlan(plan.key, "durationDays", parseInt(e.target.value) || 0)
                          }
                          className="h-8 text-center text-sm"
                        />
                        <Input
                          type="number"
                          min={0}
                          value={plan.fee}
                          onChange={(e) =>
                            updatePlan(plan.key, "fee", parseFloat(e.target.value) || 0)
                          }
                          className="h-8 text-center text-sm"
                        />
                        <Input
                          type="number"
                          min={1}
                          value={plan.maxBooks}
                          onChange={(e) =>
                            updatePlan(plan.key, "maxBooks", parseInt(e.target.value) || 1)
                          }
                          className="h-8 text-center text-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removePlan(plan.key)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Button type="button" variant="outline" onClick={addCustomPlan} className="w-full">
                  <Plus className="mr-2 h-4 w-4" /> Add Custom Plan
                </Button>

                {plans.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No plans added yet — members will be treated as free members by default.
                  </p>
                )}
              </CardContent>
            </>
          )}

          {/* ── Navigation ── */}
          <div className="flex items-center justify-between border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>

            {step < 3 ? (
              <Button type="button" onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleComplete} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting up...
                  </>
                ) : (
                  <>
                    Complete Setup <Check className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

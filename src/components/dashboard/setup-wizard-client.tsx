"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/shared/file-upload";
import { completeSetup } from "@/actions/academic";
import { LibrarySetupWizard } from "./library-setup-wizard";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Building2,
  Calendar,
  Layers,
  BookOpen,
  Plus,
  X,
  Loader2,
  Sparkles,
  GraduationCap,
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

interface ClassEntry {
  key: string;
  name: string;
  section: string;
  capacity: number;
}

interface BatchEntry {
  key: string;
  name: string;
  description: string;
  subject: string;
  capacity: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  days: string;
}

interface SubjectEntry {
  key: string;
  name: string;
  code: string;
  parentId: string; // class or batch ID placeholder
  parentName: string;
}

const STEPS = [
  { id: 1, label: "Profile", icon: Building2 },
  { id: 2, label: "Academic Year", icon: Calendar },
  { id: 3, label: "Structure", icon: Layers },
  { id: 4, label: "Subjects", icon: BookOpen },
];

const BOARDS = ["CBSE", "ICSE", "State Board", "IB", "Cambridge", "Other"];
const COACHING_TYPES = ["JEE", "NEET", "Foundation", "Board Preparation", "UPSC", "Other"];
const DAYS_OPTIONS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const SUGGESTED_SUBJECTS: Record<string, string[]> = {
  default: ["English", "Hindi", "Mathematics", "Science", "Social Studies", "Computer Science"],
  JEE: ["Physics", "Chemistry", "Mathematics"],
  NEET: ["Physics", "Chemistry", "Biology"],
  Foundation: ["Physics", "Chemistry", "Mathematics", "Biology"],
  UPSC: ["General Studies", "CSAT", "Optional Subject", "Essay"],
};

// Public entry point — dispatches to the right wizard based on tenant type
export function SetupWizardClient({ tenant }: { tenant: TenantData }) {
  if (tenant.type === "LIBRARY") {
    return <LibrarySetupWizard tenant={tenant} />;
  }
  return <SchoolCoachingSetupWizard tenant={tenant} />;
}

function SchoolCoachingSetupWizard({ tenant }: { tenant: TenantData }) {
  const router = useRouter();
  const isSchool = tenant.type === "SCHOOL";
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState({
    name: tenant.name,
    phone: tenant.phone || "",
    address: tenant.address || "",
    city: tenant.city || "",
    state: tenant.state || "",
    pincode: tenant.pincode || "",
    website: tenant.website || "",
    logoUrl: tenant.logoUrl || "",
    boardAffiliation: "",
    coachingType: "",
  });

  // Step 2: Academic Year
  const [academicYear, setAcademicYear] = useState({
    name: "2026-27",
    startDate: "2026-04-01",
    endDate: "2027-03-31",
  });

  // Step 3: Classes or Batches
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [batches, setBatches] = useState<BatchEntry[]>([]);

  // Step 4: Subjects
  const [subjects, setSubjects] = useState<SubjectEntry[]>([]);
  const [selectedParent, setSelectedParent] = useState("");

  // === Helper Functions ===

  function addNewClass() {
    setClasses([
      ...classes,
      { key: crypto.randomUUID(), name: "", section: "A", capacity: 40 },
    ]);
  }

  function removeClass(key: string) {
    setClasses(classes.filter((c) => c.key !== key));
  }

  function updateClass(key: string, field: keyof ClassEntry, value: string | number) {
    setClasses(classes.map((c) => (c.key === key ? { ...c, [field]: value } : c)));
  }

  function quickAddClasses(range: string) {
    const ranges: Record<string, number[]> = {
      "1-5": [1, 2, 3, 4, 5],
      "1-10": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      "1-12": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      "6-12": [6, 7, 8, 9, 10, 11, 12],
    };
    const nums = ranges[range] || [];
    const newClasses = nums.map((n) => ({
      key: crypto.randomUUID(),
      name: `Class ${n}`,
      section: "A",
      capacity: 40,
    }));
    setClasses([...classes, ...newClasses]);
  }

  function addNewBatch() {
    setBatches([
      ...batches,
      {
        key: crypto.randomUUID(),
        name: "",
        description: "",
        subject: "",
        capacity: 30,
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        days: "",
      },
    ]);
  }

  function removeBatch(key: string) {
    setBatches(batches.filter((b) => b.key !== key));
  }

  function updateBatch(key: string, field: keyof BatchEntry, value: string | number) {
    setBatches(batches.map((b) => (b.key === key ? { ...b, [field]: value } : b)));
  }

  function addSubject(parentId: string, parentName: string) {
    setSubjects([
      ...subjects,
      { key: crypto.randomUUID(), name: "", code: "", parentId, parentName },
    ]);
  }

  function removeSubject(key: string) {
    setSubjects(subjects.filter((s) => s.key !== key));
  }

  function updateSubject(key: string, field: keyof SubjectEntry, value: string) {
    setSubjects(subjects.map((s) => (s.key === key ? { ...s, [field]: value } : s)));
  }

  function addSuggestedSubjects(parentId: string, parentName: string) {
    const type = isSchool ? "default" : (profile.coachingType || "default");
    const suggestions = SUGGESTED_SUBJECTS[type] || SUGGESTED_SUBJECTS.default;
    const newSubjects = suggestions.map((name) => ({
      key: crypto.randomUUID(),
      name,
      code: name.substring(0, 3).toUpperCase(),
      parentId,
      parentName,
    }));
    setSubjects([...subjects, ...newSubjects]);
  }

  // === Validation ===
  function canProceed(): boolean {
    switch (step) {
      case 1:
        return profile.name.trim().length > 0;
      case 2:
        return academicYear.name.trim().length > 0 && !!academicYear.startDate && !!academicYear.endDate;
      case 3:
        return isSchool ? classes.length > 0 && classes.every((c) => c.name.trim()) : batches.length > 0 && batches.every((b) => b.name.trim());
      case 4:
        return true; // subjects are optional
      default:
        return false;
    }
  }

  // === Submit ===
  async function handleComplete() {
    setSubmitting(true);
    try {
      // Map subjects to reference temp keys → will be resolved server side
      // For now we pass classId/batchId as the parent key
      const result = await completeSetup({
        profile: {
          name: profile.name,
          phone: profile.phone || undefined,
          address: profile.address || undefined,
          city: profile.city || undefined,
          state: profile.state || undefined,
          pincode: profile.pincode || undefined,
          website: profile.website || undefined,
          logoUrl: profile.logoUrl || undefined,
          boardAffiliation: profile.boardAffiliation || undefined,
          coachingType: profile.coachingType || undefined,
        },
        academicYear: {
          name: academicYear.name,
          startDate: academicYear.startDate,
          endDate: academicYear.endDate,
        },
        classes: isSchool
          ? classes.map((c) => ({ name: c.name, section: c.section, capacity: c.capacity }))
          : undefined,
        batches: !isSchool
          ? batches.map((b) => ({
              name: b.name,
              description: b.description || undefined,
              subject: b.subject || undefined,
              capacity: b.capacity,
              startDate: b.startDate || undefined,
              endDate: b.endDate || undefined,
              startTime: b.startTime || undefined,
              endTime: b.endTime || undefined,
              days: b.days || undefined,
            }))
          : undefined,
        subjects: [], // Will handle separately below
      });

      if (!result.success) {
        toast.error(result.error || "Setup failed");
        setSubmitting(false);
        return;
      }

      // Now create subjects with actual IDs from result
      const createdClasses = result.data?.classes || [];
      const createdBatches = result.data?.batches || [];

      // Map temp keys to real IDs
      const parentMap = new Map<string, string>();
      if (isSchool) {
        classes.forEach((c, i) => {
          if (createdClasses[i]) {
            parentMap.set(c.key, createdClasses[i].id);
          }
        });
      } else {
        batches.forEach((b, i) => {
          if (createdBatches[i]) {
            parentMap.set(b.key, createdBatches[i].id);
          }
        });
      }

      // Create subjects with real parent IDs
      if (subjects.length > 0) {
        const { bulkCreateSubjects } = await import("@/actions/academic");
        await bulkCreateSubjects(
          subjects
            .filter((s) => s.name.trim())
            .map((s) => ({
              name: s.name,
              code: s.code || undefined,
              classId: isSchool ? parentMap.get(s.parentId) : undefined,
              batchId: !isSchool ? parentMap.get(s.parentId) : undefined,
            }))
        );
      }

      toast.success("Setup completed! Welcome to your dashboard.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // === Parents list for subject assignment ===
  const parentOptions = isSchool
    ? classes.filter((c) => c.name.trim()).map((c) => ({
        id: c.key,
        label: `${c.name}${c.section ? ` - ${c.section}` : ""}`,
      }))
    : batches.filter((b) => b.name.trim()).map((b) => ({
        id: b.key,
        label: b.name,
      }));

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-muted/20 to-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Set up {tenant.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSchool
              ? "Configure your school in a few simple steps"
              : "Configure your coaching institute in a few simple steps"}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                      step > s.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : step === s.id
                        ? "border-primary bg-primary/10 text-primary"
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
                      step >= s.id ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 w-12 sm:w-20 ${
                      step > s.id ? "bg-primary" : "bg-muted-foreground/20"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="border-0 shadow-lg">
          {/* STEP 1: Profile */}
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle>{isSchool ? "School Profile" : "Institute Profile"}</CardTitle>
                <CardDescription>Basic information about your institution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label>Institution Name *</Label>
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      placeholder="Enter institution name"
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
                    <Label>{isSchool ? "Board Affiliation" : "Coaching Type"}</Label>
                    <Select
                      value={isSchool ? profile.boardAffiliation : profile.coachingType}
                      onValueChange={(v) => {
                        if (!v) return;
                        if (isSchool) {
                          setProfile({ ...profile, boardAffiliation: v });
                        } else {
                          setProfile({ ...profile, coachingType: v });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(isSchool ? BOARDS : COACHING_TYPES).map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* STEP 2: Academic Year */}
          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle>Academic Year / Session</CardTitle>
                <CardDescription>Set up your first academic year</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Session Name *</Label>
                  <Input
                    value={academicYear.name}
                    onChange={(e) => setAcademicYear({ ...academicYear, name: e.target.value })}
                    placeholder="e.g., 2026-27"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Start Date *</Label>
                    <Input
                      type="date"
                      value={academicYear.startDate}
                      onChange={(e) => setAcademicYear({ ...academicYear, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>End Date *</Label>
                    <Input
                      type="date"
                      value={academicYear.endDate}
                      onChange={(e) => setAcademicYear({ ...academicYear, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  This will be set as the current active academic year.
                </p>
              </CardContent>
            </>
          )}

          {/* STEP 3: Classes (School) or Batches (Coaching) */}
          {step === 3 && isSchool && (
            <>
              <CardHeader>
                <CardTitle>Classes & Sections</CardTitle>
                <CardDescription>
                  Add all classes in your school. You can add sections per class.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => quickAddClasses("1-5")}
                  >
                    <Sparkles className="mr-1 h-3 w-3" /> Class 1-5
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => quickAddClasses("1-10")}
                  >
                    <Sparkles className="mr-1 h-3 w-3" /> Class 1-10
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => quickAddClasses("1-12")}
                  >
                    <Sparkles className="mr-1 h-3 w-3" /> Class 1-12
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => quickAddClasses("6-12")}
                  >
                    <Sparkles className="mr-1 h-3 w-3" /> Class 6-12
                  </Button>
                </div>

                <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                  {classes.map((cls) => (
                    <div
                      key={cls.key}
                      className="flex items-center gap-2 rounded-lg border bg-card p-3"
                    >
                      <Input
                        className="flex-1"
                        placeholder="Class name"
                        value={cls.name}
                        onChange={(e) => updateClass(cls.key, "name", e.target.value)}
                      />
                      <Input
                        className="w-20"
                        placeholder="Section"
                        value={cls.section}
                        onChange={(e) => updateClass(cls.key, "section", e.target.value)}
                      />
                      <Input
                        type="number"
                        className="w-20"
                        placeholder="Cap"
                        value={cls.capacity}
                        onChange={(e) =>
                          updateClass(cls.key, "capacity", parseInt(e.target.value) || 40)
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-destructive"
                        onClick={() => removeClass(cls.key)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" onClick={addNewClass} className="w-full">
                  <Plus className="mr-2 h-4 w-4" /> Add Class
                </Button>
              </CardContent>
            </>
          )}

          {step === 3 && !isSchool && (
            <>
              <CardHeader>
                <CardTitle>Batches</CardTitle>
                <CardDescription>
                  Create batches for your coaching institute
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
                  {batches.map((batch) => (
                    <div
                      key={batch.key}
                      className="rounded-lg border bg-card p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="grid flex-1 gap-3 sm:grid-cols-2">
                          <div>
                            <Label className="text-xs">Batch Name *</Label>
                            <Input
                              placeholder="e.g., JEE 2027 Morning"
                              value={batch.name}
                              onChange={(e) =>
                                updateBatch(batch.key, "name", e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Subject Focus</Label>
                            <Input
                              placeholder="e.g., Physics + Chemistry"
                              value={batch.subject}
                              onChange={(e) =>
                                updateBatch(batch.key, "subject", e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Capacity</Label>
                            <Input
                              type="number"
                              value={batch.capacity}
                              onChange={(e) =>
                                updateBatch(batch.key, "capacity", parseInt(e.target.value) || 30)
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Days</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {DAYS_OPTIONS.map((d) => {
                                const selected = (batch.days || "").split(",").includes(d);
                                return (
                                  <button
                                    key={d}
                                    type="button"
                                    className={`rounded-md px-2 py-1 text-[10px] font-medium transition ${
                                      selected
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground hover:bg-accent"
                                    }`}
                                    onClick={() => {
                                      const arr = (batch.days || "")
                                        .split(",")
                                        .filter(Boolean);
                                      const newDays = selected
                                        ? arr.filter((x) => x !== d)
                                        : [...arr, d];
                                      updateBatch(batch.key, "days", newDays.join(","));
                                    }}
                                  >
                                    {d}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Start Time</Label>
                            <Input
                              type="time"
                              value={batch.startTime}
                              onChange={(e) =>
                                updateBatch(batch.key, "startTime", e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs">End Time</Label>
                            <Input
                              type="time"
                              value={batch.endTime}
                              onChange={(e) =>
                                updateBatch(batch.key, "endTime", e.target.value)
                              }
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="ml-2 h-8 w-8 shrink-0 text-destructive"
                          onClick={() => removeBatch(batch.key)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" onClick={addNewBatch} className="w-full">
                  <Plus className="mr-2 h-4 w-4" /> Add Batch
                </Button>
              </CardContent>
            </>
          )}

          {/* STEP 4: Subjects */}
          {step === 4 && (
            <>
              <CardHeader>
                <CardTitle>Subjects</CardTitle>
                <CardDescription>
                  Add subjects for each {isSchool ? "class" : "batch"}. You can skip this and add them later.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {parentOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No {isSchool ? "classes" : "batches"} created yet. Go back and add some.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Select value={selectedParent} onValueChange={(v) => setSelectedParent(v || "")}>
                        <SelectTrigger className="flex-1">
                          <SelectValue
                            placeholder={`Select a ${isSchool ? "class" : "batch"}...`}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {parentOptions.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!selectedParent}
                        onClick={() => {
                          const opt = parentOptions.find((p) => p.id === selectedParent);
                          if (opt) addSuggestedSubjects(opt.id, opt.label);
                        }}
                      >
                        <Sparkles className="mr-1 h-3 w-3" /> Suggest
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!selectedParent}
                        onClick={() => {
                          const opt = parentOptions.find((p) => p.id === selectedParent);
                          if (opt) addSubject(opt.id, opt.label);
                        }}
                      >
                        <Plus className="mr-1 h-3 w-3" /> Add
                      </Button>
                    </div>

                    {/* Group subjects by parent */}
                    {parentOptions.map((parent) => {
                      const parentSubjects = subjects.filter(
                        (s) => s.parentId === parent.id
                      );
                      if (parentSubjects.length === 0) return null;
                      return (
                        <div key={parent.id} className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">
                            {parent.label}
                          </h4>
                          {parentSubjects.map((sub) => (
                            <div
                              key={sub.key}
                              className="flex items-center gap-2 rounded-lg border bg-card p-2"
                            >
                              <Input
                                className="flex-1"
                                placeholder="Subject name"
                                value={sub.name}
                                onChange={(e) =>
                                  updateSubject(sub.key, "name", e.target.value)
                                }
                              />
                              <Input
                                className="w-24"
                                placeholder="Code"
                                value={sub.code}
                                onChange={(e) =>
                                  updateSubject(sub.key, "code", e.target.value)
                                }
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 text-destructive"
                                onClick={() => removeSubject(sub.key)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      );
                    })}

                    {/* Copy subjects button */}
                    {subjects.length > 0 && parentOptions.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Copy subjects from the first parent that has subjects to all others
                          const firstParentWithSubjects = parentOptions.find(
                            (p) => subjects.some((s) => s.parentId === p.id)
                          );
                          if (!firstParentWithSubjects) return;
                          const sourceSubjects = subjects.filter(
                            (s) => s.parentId === firstParentWithSubjects.id
                          );
                          const newSubjects: SubjectEntry[] = [];
                          for (const parent of parentOptions) {
                            if (parent.id === firstParentWithSubjects.id) continue;
                            const existing = subjects.filter((s) => s.parentId === parent.id);
                            if (existing.length > 0) continue;
                            for (const src of sourceSubjects) {
                              newSubjects.push({
                                key: crypto.randomUUID(),
                                name: src.name,
                                code: src.code,
                                parentId: parent.id,
                                parentName: parent.label,
                              });
                            }
                          }
                          setSubjects([...subjects, ...newSubjects]);
                          toast.success("Subjects copied to all other " + (isSchool ? "classes" : "batches"));
                        }}
                      >
                        Copy subjects to all {isSchool ? "classes" : "batches"}
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            {step < 4 ? (
              <Button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
              >
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleComplete}
                disabled={submitting}
              >
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

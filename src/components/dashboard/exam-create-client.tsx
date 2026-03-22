"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  BookOpen,
  Award,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { createExam, getClassesForExam, getSubjectsForExam } from "@/actions/exams";

interface ExamCreateClientProps {
  tenantType: string;
}

const examTypes = [
  { value: "UNIT_TEST", label: "Unit Test" },
  { value: "MID_TERM", label: "Mid Term" },
  { value: "FINAL", label: "Final Exam" },
  { value: "MOCK_TEST", label: "Mock Test" },
  { value: "WEEKLY_TEST", label: "Weekly Test" },
  { value: "PRACTICE", label: "Practice Test" },
];

interface SubjectEntry {
  id: string;
  subjectId: string;
  subjectName: string;
  examDate: string;
  startTime: string;
  endTime: string;
  maxMarks: number;
  passingMarks: number;
}

export function ExamCreateClient({ tenantType }: ExamCreateClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isSchool = tenantType === "SCHOOL";

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState("UNIT_TEST");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [subjectEntries, setSubjectEntries] = useState<SubjectEntry[]>([]);

  // Data
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [batches, setBatches] = useState<{ id: string; name: string }[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<{ id: string; name: string; code: string | null }[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  useEffect(() => {
    getClassesForExam().then((res) => {
      if (res.success && res.data) {
        setClasses(res.data.classes);
        setBatches(res.data.batches);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedClassId) {
      Promise.resolve().then(() => setAvailableSubjects([]));
      return;
    }
    const params = isSchool ? { classId: selectedClassId } : { batchId: selectedClassId };
    let cancelled = false;
    getSubjectsForExam(params.classId, params.batchId).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        setAvailableSubjects(res.data);
      }
      setLoadingSubjects(false);
    });
    // Set loading after starting the fetch (in microtask to avoid synchronous setState)
    Promise.resolve().then(() => { if (!cancelled) setLoadingSubjects(true); });
    return () => { cancelled = true; };
  }, [selectedClassId, isSchool]);

  function handleAddAllSubjects() {
    const existing = new Set(subjectEntries.map((s) => s.subjectId));
    const newEntries = availableSubjects
      .filter((s) => !existing.has(s.id))
      .map((s) => ({
        id: crypto.randomUUID(),
        subjectId: s.id,
        subjectName: s.name,
        examDate: startDate || "",
        startTime: "",
        endTime: "",
        maxMarks: 100,
        passingMarks: 33,
      }));
    setSubjectEntries([...subjectEntries, ...newEntries]);
  }

  function handleAddSubject(subjectId: string) {
    const subject = availableSubjects.find((s) => s.id === subjectId);
    if (!subject || subjectEntries.some((s) => s.subjectId === subjectId)) return;

    setSubjectEntries([
      ...subjectEntries,
      {
        id: crypto.randomUUID(),
        subjectId: subject.id,
        subjectName: subject.name,
        examDate: startDate || "",
        startTime: "",
        endTime: "",
        maxMarks: 100,
        passingMarks: 33,
      },
    ]);
  }

  function handleRemoveSubject(id: string) {
    setSubjectEntries(subjectEntries.filter((s) => s.id !== id));
  }

  function handleSubjectChange(id: string, field: keyof SubjectEntry, value: string | number) {
    setSubjectEntries(
      subjectEntries.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }

  function handleSubmit() {
    if (!name.trim()) {
      toast.error("Exam name is required");
      return;
    }
    if (!selectedClassId) {
      toast.error(`Please select a ${isSchool ? "class" : "batch"}`);
      return;
    }
    if (subjectEntries.length === 0) {
      toast.error("Add at least one subject");
      return;
    }

    // Validate passing marks
    for (const entry of subjectEntries) {
      if (entry.passingMarks > entry.maxMarks) {
        toast.error(`Passing marks cannot exceed max marks for ${entry.subjectName}`);
        return;
      }
    }

    startTransition(async () => {
      const result = await createExam({
        name,
        type,
        ...(isSchool ? { classId: selectedClassId } : { batchId: selectedClassId }),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        subjects: subjectEntries.map((s) => ({
          subjectId: s.subjectId,
          examDate: s.examDate || undefined,
          startTime: s.startTime || undefined,
          endTime: s.endTime || undefined,
          maxMarks: s.maxMarks,
          passingMarks: s.passingMarks,
        })),
      });

      if (result.success) {
        toast.success("Exam created successfully!");
        router.push("/dashboard/exams");
      } else {
        toast.error(result.error || "Failed to create exam");
      }
    });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Exam</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Define exam details and subject schedule</p>
        </div>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Exam Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Exam Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Mid Term Examination 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Exam Type *</Label>
              <Select value={type} onValueChange={(v) => v && setType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {examTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>{isSchool ? "Class" : "Batch"} *</Label>
              <Select value={selectedClassId} onValueChange={(v) => { setSelectedClassId(v || ""); setSubjectEntries([]); }}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${isSchool ? "class" : "batch"}`} />
                </SelectTrigger>
                <SelectContent>
                  {(isSchool ? classes : batches).map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject Schedule */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Subject Schedule
              {subjectEntries.length > 0 && (
                <Badge variant="secondary" className="ml-1">{subjectEntries.length}</Badge>
              )}
            </CardTitle>
            {selectedClassId && availableSubjects.length > 0 && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddAllSubjects}
                  className="gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Add All Subjects
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!selectedClassId ? (
            <div className="text-center py-10 text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a {isSchool ? "class" : "batch"} to add subjects</p>
            </div>
          ) : loadingSubjects ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : availableSubjects.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-sm">No subjects found for this {isSchool ? "class" : "batch"}. Please add subjects first.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Add subject selector */}
              <div className="flex gap-2">
                <Select onValueChange={(v) => v && typeof v === "string" && handleAddSubject(v)}>
                  <SelectTrigger className="w-full sm:w-62.5">
                    <SelectValue placeholder="Add a subject..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects
                      .filter((s) => !subjectEntries.some((e) => e.subjectId === s.id))
                      .map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} {s.code ? `(${s.code})` : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject entries table */}
              {subjectEntries.length > 0 && (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="font-semibold">Subject</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold hidden sm:table-cell">Time</TableHead>
                        <TableHead className="font-semibold">Max Marks</TableHead>
                        <TableHead className="font-semibold">Passing</TableHead>
                        <TableHead className="w-12.5"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjectEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <span className="font-medium text-sm">{entry.subjectName}</span>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={entry.examDate}
                              onChange={(e) => handleSubjectChange(entry.id, "examDate", e.target.value)}
                              className="w-35 h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex gap-1.5 items-center">
                              <Input
                                type="time"
                                value={entry.startTime}
                                onChange={(e) => handleSubjectChange(entry.id, "startTime", e.target.value)}
                                className="w-28 h-8 text-sm"
                              />
                              <span className="text-xs text-muted-foreground">to</span>
                              <Input
                                type="time"
                                value={entry.endTime}
                                onChange={(e) => handleSubjectChange(entry.id, "endTime", e.target.value)}
                                className="w-28 h-8 text-sm"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              max={1000}
                              value={entry.maxMarks}
                              onChange={(e) => handleSubjectChange(entry.id, "maxMarks", parseInt(e.target.value) || 0)}
                              className="w-20 h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              max={entry.maxMarks}
                              value={entry.passingMarks}
                              onChange={(e) => handleSubjectChange(entry.id, "passingMarks", parseInt(e.target.value) || 0)}
                              className="w-20 h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveSubject(entry.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {subjectEntries.length > 0 && (
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/40 text-sm">
                  <span className="text-muted-foreground">
                    Total Max Marks: <strong className="text-foreground">{subjectEntries.reduce((sum, s) => sum + s.maxMarks, 0)}</strong>
                  </span>
                  <span className="text-muted-foreground">
                    Subjects: <strong className="text-foreground">{subjectEntries.length}</strong>
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isPending || !name || !selectedClassId || subjectEntries.length === 0}
          className="gap-2 min-w-35"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {isPending ? "Creating..." : "Create Exam"}
        </Button>
      </div>
    </div>
  );
}

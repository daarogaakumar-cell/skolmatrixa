"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
  BookOpen,
  Users,
  Award,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getExamDetail, getStudentsForMarks, saveMarks } from "@/actions/exams";

interface MarksEntryClientProps {
  examId: string;
  userRole: string;
  tenantType: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = Record<string, any>;

interface MarkEntry {
  studentId: string;
  marksObtained: string;
  grade: string;
  dirty: boolean;
}

function calculateGrade(marks: number, maxMarks: number): string {
  const pct = (marks / maxMarks) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
}

const gradeColors: Record<string, string> = {
  "A+": "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
  A: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
  "B+": "text-blue-600 bg-blue-50 dark:bg-blue-950/40",
  B: "text-blue-600 bg-blue-50 dark:bg-blue-950/40",
  C: "text-amber-600 bg-amber-50 dark:bg-amber-950/40",
  D: "text-orange-600 bg-orange-50 dark:bg-orange-950/40",
  F: "text-red-600 bg-red-50 dark:bg-red-950/40",
};

export function MarksEntryClient({ examId, tenantType }: MarksEntryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [exam, setExam] = useState<AnyData | null>(null);
  const [subjects, setSubjects] = useState<AnyData[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [students, setStudents] = useState<AnyData[]>([]);
  const [marks, setMarks] = useState<Record<string, MarkEntry>>({});
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedCount, setSavedCount] = useState(0);

  const isSchool = tenantType === "SCHOOL";

  async function loadExam() {
    setLoading(true);
    const result = await getExamDetail(examId);
    if (result.success && result.data) {
      setExam(result.data);
      setSubjects(result.data.subjects || []);
      // Auto-select from URL param or first subject
      const urlSubject = searchParams.get("subject");
      if (urlSubject && result.data.subjects?.some((s: AnyData) => s.id === urlSubject)) {
        setSelectedSubject(urlSubject);
      } else if (result.data.subjects?.length > 0) {
        setSelectedSubject(result.data.subjects[0].id);
      }
    } else {
      toast.error(result.error || "Failed to load exam");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  const loadStudentsForSubject = useCallback(async (subjectId: string) => {
    if (!subjectId) return;
    setLoadingStudents(true);
    const result = await getStudentsForMarks(subjectId);
    if (result.success && result.data) {
      const studentList = result.data.students || [];
      setStudents(studentList);
      const maxMarks = result.data.maxMarks || 100;

      const initialMarks: Record<string, MarkEntry> = {};
      studentList.forEach((student: AnyData) => {
        const existing = student.existingMarks;
        initialMarks[student.id] = {
          studentId: student.id,
          marksObtained: existing?.marksObtained != null ? String(existing.marksObtained) : "",
          grade: existing?.marksObtained != null
            ? calculateGrade(Number(existing.marksObtained), maxMarks)
            : "",
          dirty: false,
        };
      });
      setMarks(initialMarks);
      setSavedCount(studentList.filter((s: AnyData) => s.existingMarks != null).length);
    } else {
      toast.error(result.error || "Failed to load students");
    }
    setLoadingStudents(false);
  }, []);

  useEffect(() => {
    if (selectedSubject && subjects.length > 0) {
      loadStudentsForSubject(selectedSubject);
    }
  }, [selectedSubject, subjects, loadStudentsForSubject]);

  function handleMarksChange(studentId: string, value: string) {
    const currentSubject = subjects.find((s) => s.id === selectedSubject);
    const maxMarks = currentSubject?.maxMarks || 100;

    // Allow empty and partial decimals while typing
    if (value !== "" && !/^\d*\.?\d{0,2}$/.test(value)) return;

    const numVal = parseFloat(value);
    if (value !== "" && !isNaN(numVal) && numVal > maxMarks) return;

    setMarks((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        marksObtained: value,
        grade: value !== "" && !isNaN(numVal) ? calculateGrade(numVal, maxMarks) : "",
        dirty: true,
      },
    }));
  }

  function handleSave() {
    const currentSubject = subjects.find((s) => s.id === selectedSubject);
    if (!currentSubject) return;

    const entries = Object.entries(marks)
      .filter(([, m]) => m.marksObtained !== "")
      .map(([studentId, m]) => ({
        studentId,
        marksObtained: parseFloat(m.marksObtained),
      }));

    if (entries.length === 0) {
      toast.error("No marks entered");
      return;
    }

    // Validate
    for (const entry of entries) {
      if (isNaN(entry.marksObtained) || entry.marksObtained < 0) {
        toast.error("All marks must be valid non-negative numbers");
        return;
      }
      if (entry.marksObtained > currentSubject.maxMarks) {
        toast.error(`Marks cannot exceed maximum (${currentSubject.maxMarks})`);
        return;
      }
    }

    startTransition(async () => {
      const result = await saveMarks({
        examSubjectId: selectedSubject,
        marks: entries,
      });
      if (result.success) {
        toast.success(result.message || `Saved ${entries.length} marks`);
        // Mark all as clean
        setMarks((prev) => {
          const updated = { ...prev };
          for (const key of Object.keys(updated)) {
            updated[key] = { ...updated[key], dirty: false };
          }
          return updated;
        });
        setSavedCount(entries.length);
      } else {
        toast.error(result.error || "Failed to save marks");
      }
    });
  }

  function handleReset() {
    loadStudentsForSubject(selectedSubject);
  }

  const filteredStudents = students.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.rollNumber?.toLowerCase().includes(q) ||
      s.admissionNumber?.toLowerCase().includes(q)
    );
  });

  const currentSubject = subjects.find((s) => s.id === selectedSubject);
  const filled = Object.values(marks).filter((m) => m.marksObtained !== "").length;
  const dirtyCount = Object.values(marks).filter((m) => m.dirty).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Exam not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/exams")}>
          Back to Exams
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/exams/${examId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Enter Marks</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{exam.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={isPending || dirtyCount === 0}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isPending || dirtyCount === 0} className="gap-2">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Marks
          </Button>
        </div>
      </div>

      {/* Subject Selector + Stats */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <Card>
          <CardContent className="p-4">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Subject</label>
            <Select value={selectedSubject} onValueChange={(v) => v && setSelectedSubject(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                      {s.subjectName}
                      {s.subjectCode && <span className="text-muted-foreground">({s.subjectCode})</span>}
                      <span className="text-muted-foreground">— Max: {s.maxMarks}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="flex items-center gap-2 p-4">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-lg font-bold">{students.length}</p>
                <p className="text-xs text-muted-foreground">Students</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-2 p-4">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <div>
                <p className="text-lg font-bold">{filled}</p>
                <p className="text-xs text-muted-foreground">Entered</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-2 p-4">
              <Award className="h-4 w-4 text-violet-500" />
              <div>
                <p className="text-lg font-bold">{currentSubject?.maxMarks || 0}</p>
                <p className="text-xs text-muted-foreground">Max Marks</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Progress Bar */}
      {students.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Entry Progress</span>
            <span className="font-medium">{filled}/{students.length}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                filled >= students.length ? "bg-emerald-500" : filled > 0 ? "bg-blue-500" : "bg-gray-300"
              )}
              style={{ width: `${students.length > 0 ? (filled / students.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Marks Entry Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">
              {currentSubject ? `${currentSubject.subjectName} — Marks Entry` : "Select a Subject"}
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingStudents ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Users className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No students match your search" : "No students found for this exam"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-10 font-semibold text-center">#</TableHead>
                    <TableHead className="font-semibold">Student</TableHead>
                    {isSchool && <TableHead className="font-semibold hidden sm:table-cell">Roll No</TableHead>}
                    <TableHead className="font-semibold w-32 text-center">
                      Marks <span className="text-muted-foreground font-normal">/ {currentSubject?.maxMarks}</span>
                    </TableHead>
                    <TableHead className="font-semibold w-20 text-center">Grade</TableHead>
                    <TableHead className="font-semibold w-20 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student, idx) => {
                    const mark = marks[student.id];
                    const marksVal = mark?.marksObtained || "";
                    const grade = mark?.grade || "";
                    const numVal = parseFloat(marksVal);
                    const isPassing = !isNaN(numVal) && currentSubject && numVal >= currentSubject.passingMarks;
                    const isFailing = !isNaN(numVal) && currentSubject && numVal < currentSubject.passingMarks;

                    return (
                      <TableRow
                        key={student.id}
                        className={cn(mark?.dirty && "bg-amber-50/50 dark:bg-amber-950/10")}
                      >
                        <TableCell className="text-center text-muted-foreground text-sm">{idx + 1}</TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium text-sm">{student.name}</span>
                            {student.admissionNumber && (
                              <span className="text-xs text-muted-foreground ml-1.5">
                                {student.admissionNumber}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        {isSchool && (
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {student.rollNumber || "—"}
                          </TableCell>
                        )}
                        <TableCell className="text-center">
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={marksVal}
                            onChange={(e) => handleMarksChange(student.id, e.target.value)}
                            placeholder="—"
                            className={cn(
                              "w-20 mx-auto text-center h-8 text-sm",
                              isFailing && marksVal && "border-red-300 focus-visible:ring-red-400"
                            )}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          {grade && (
                            <Badge
                              variant="outline"
                              className={cn("text-xs font-semibold", gradeColors[grade])}
                            >
                              {grade}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {marksVal !== "" ? (
                            isPassing ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-500 mx-auto" />
                            )
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating Save Bar */}
      {dirtyCount > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 rounded-full bg-primary px-6 py-3 text-primary-foreground shadow-lg">
            <span className="text-sm font-medium">{dirtyCount} unsaved changes · {savedCount}/{students.length} entered</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleSave}
              disabled={isPending}
              className="rounded-full h-8"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

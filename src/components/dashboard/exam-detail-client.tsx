"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
  BookOpen,
  Calendar,
  Users,
  BarChart3,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getExamDetail, deleteExam, updateExam, publishResults } from "@/actions/exams";

interface ExamDetailClientProps {
  examId: string;
  userRole: string;
  tenantType: string;
}

const examTypeLabels: Record<string, string> = {
  UNIT_TEST: "Unit Test",
  MID_TERM: "Mid Term",
  FINAL: "Final Exam",
  MOCK_TEST: "Mock Test",
  WEEKLY_TEST: "Weekly Test",
  PRACTICE: "Practice Test",
};

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  UPCOMING: { label: "Upcoming", color: "text-blue-700", bg: "bg-blue-50 dark:bg-blue-950/40", dot: "bg-blue-500" },
  ONGOING: { label: "Ongoing", color: "text-amber-700", bg: "bg-amber-50 dark:bg-amber-950/40", dot: "bg-amber-500" },
  COMPLETED: { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-50 dark:bg-emerald-950/40", dot: "bg-emerald-500" },
  RESULT_PUBLISHED: { label: "Results Published", color: "text-violet-700", bg: "bg-violet-50 dark:bg-violet-950/40", dot: "bg-violet-500" },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExamDetailData = Record<string, any>;

export function ExamDetailClient({ examId, userRole }: ExamDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [exam, setExam] = useState<ExamDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  const canManage = ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"].includes(userRole);

  async function loadExam() {
    setLoading(true);
    const result = await getExamDetail(examId);
    if (result.success && result.data) {
      setExam(result.data);
    } else {
      toast.error(result.error || "Failed to load exam");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteExam(examId);
      if (result.success) {
        toast.success("Exam deleted");
        router.push("/dashboard/exams");
      } else {
        toast.error(result.error || "Failed to delete exam");
      }
    });
  }

  function handlePublish() {
    startTransition(async () => {
      const result = await publishResults(examId);
      if (result.success) {
        toast.success(result.message || "Results published!");
        setShowPublishDialog(false);
        loadExam();
      } else {
        toast.error(result.error || "Failed to publish results");
      }
    });
  }

  function handleStatusChange(status: string) {
    startTransition(async () => {
      const result = await updateExam(examId, { status });
      if (result.success) {
        toast.success(`Status updated to ${statusConfig[status]?.label || status}`);
        loadExam();
      } else {
        toast.error(result.error || "Failed to update status");
      }
    });
  }

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

  const sc = statusConfig[exam.status] || statusConfig.UPCOMING;
  const totalStudents = exam.students?.length || 0;
  const totalSubjects = exam.subjects?.length || 0;

  // Calculate marks progress
  const totalMarksEntries = exam.subjects.reduce(
    (sum: number, s: ExamDetailData) => sum + (s.marks?.length || 0),
    0
  );
  const totalExpected = totalSubjects * totalStudents;
  const marksPercentage = totalExpected > 0 ? Math.round((totalMarksEntries / totalExpected) * 100) : 0;
  const allMarksEntered = totalExpected > 0 && totalMarksEntries >= totalExpected;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/exams")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{exam.name}</h1>
              <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", sc.bg, sc.color)}>
                <div className={cn("h-2 w-2 rounded-full", sc.dot)} />
                {sc.label}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              <Badge variant="outline">{examTypeLabels[exam.type] || exam.type}</Badge>
              {(exam.className || exam.batchName) && (
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {exam.className || exam.batchName}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {exam.academicYear}
              </span>
            </div>
          </div>
        </div>

        {canManage && (
          <div className="flex flex-wrap gap-2">
            {exam.status !== "RESULT_PUBLISHED" && (
              <Button
                onClick={() => router.push(`/dashboard/exams/${examId}/marks`)}
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                Enter Marks
              </Button>
            )}
            {exam.status === "COMPLETED" && allMarksEntered && (
              <Button
                onClick={() => setShowPublishDialog(true)}
                variant="default"
                className="gap-2 bg-violet-600 hover:bg-violet-700"
              >
                <Send className="h-4 w-4" />
                Publish Results
              </Button>
            )}
            {exam.status === "RESULT_PUBLISHED" && (
              <Button
                onClick={() => router.push(`/dashboard/exams/${examId}/results`)}
                variant="outline"
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                View Results
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-2.5">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalSubjects}</p>
              <p className="text-xs text-muted-foreground">Subjects</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2.5">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStudents}</p>
              <p className="text-xs text-muted-foreground">Students</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-2.5">
              <FileSpreadsheet className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{marksPercentage}%</p>
              <p className="text-xs text-muted-foreground">Marks Entered</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 p-2.5">
              <Calendar className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {exam.startDate ? format(new Date(exam.startDate), "dd MMM") : "—"}
                {exam.endDate ? ` - ${format(new Date(exam.endDate), "dd MMM")}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Actions */}
      {canManage && exam.status !== "RESULT_PUBLISHED" && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <span className="text-sm font-medium text-muted-foreground mr-2">Change Status:</span>
            {exam.status === "UPCOMING" && (
              <Button size="sm" variant="outline" onClick={() => handleStatusChange("ONGOING")} disabled={isPending}>
                Mark as Ongoing
              </Button>
            )}
            {exam.status === "ONGOING" && (
              <Button size="sm" variant="outline" onClick={() => handleStatusChange("COMPLETED")} disabled={isPending}>
                Mark as Completed
              </Button>
            )}
            {exam.status !== "RESULT_PUBLISHED" && (
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive ml-auto"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isPending}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete Exam
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Subject Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Subject Schedule & Marks Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-semibold">Subject</TableHead>
                  <TableHead className="font-semibold hidden sm:table-cell">Date</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">Time</TableHead>
                  <TableHead className="font-semibold text-center">Max</TableHead>
                  <TableHead className="font-semibold text-center">Pass</TableHead>
                  <TableHead className="font-semibold">Marks Status</TableHead>
                  {canManage && exam.status !== "RESULT_PUBLISHED" && (
                    <TableHead className="font-semibold text-right">Action</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {exam.subjects.map((subject: ExamDetailData) => {
                  const marksCount = subject.marks?.length || 0;
                  const isComplete = marksCount >= totalStudents && totalStudents > 0;
                  return (
                    <TableRow key={subject.id}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{subject.subjectName}</span>
                          {subject.subjectCode && (
                            <span className="text-xs text-muted-foreground ml-1">({subject.subjectCode})</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {subject.examDate ? format(new Date(subject.examDate), "dd MMM yyyy") : "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {subject.startTime && subject.endTime
                          ? `${subject.startTime} - ${subject.endTime}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-center font-medium">{subject.maxMarks}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{subject.passingMarks}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isComplete ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : marksCount > 0 ? (
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-sm">
                            {marksCount}/{totalStudents}
                          </span>
                        </div>
                      </TableCell>
                      {canManage && exam.status !== "RESULT_PUBLISHED" && (
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs gap-1"
                            onClick={() => router.push(`/dashboard/exams/${examId}/marks?subject=${subject.id}`)}
                          >
                            <Pencil className="h-3 w-3" />
                            {marksCount > 0 ? "Edit" : "Enter"}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{exam.name}&quot; and all associated marks. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish Dialog */}
      <AlertDialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Results?</AlertDialogTitle>
            <AlertDialogDescription>
              This will publish the results for &quot;{exam.name}&quot; and notify all students and parents.
              Once published, marks cannot be modified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-violet-600 hover:bg-violet-700"
              onClick={handlePublish}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publish Results
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

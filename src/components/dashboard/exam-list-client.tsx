"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Plus,
  Award,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  ClipboardCheck,
  BarChart3,
  FileSpreadsheet,
  Calendar,
  BookOpen,
  Trophy,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getExamList, deleteExam, updateExam, getClassesForExam } from "@/actions/exams";

interface ExamListClientProps {
  tenantType: string;
  userRole: string;
}

const examTypeConfig: Record<string, { label: string; color: string; bg: string }> = {
  UNIT_TEST: { label: "Unit Test", color: "text-blue-700", bg: "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800" },
  MID_TERM: { label: "Mid Term", color: "text-amber-700", bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800" },
  FINAL: { label: "Final", color: "text-rose-700", bg: "bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800" },
  MOCK_TEST: { label: "Mock Test", color: "text-violet-700", bg: "bg-violet-50 border-violet-200 dark:bg-violet-950/40 dark:border-violet-800" },
  WEEKLY_TEST: { label: "Weekly Test", color: "text-teal-700", bg: "bg-teal-50 border-teal-200 dark:bg-teal-950/40 dark:border-teal-800" },
  PRACTICE: { label: "Practice", color: "text-gray-700", bg: "bg-gray-50 border-gray-200 dark:bg-gray-950/40 dark:border-gray-800" },
};

const examStatusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  UPCOMING: { label: "Upcoming", color: "text-blue-700", bg: "bg-blue-50 dark:bg-blue-950/40", dot: "bg-blue-500" },
  ONGOING: { label: "Ongoing", color: "text-amber-700", bg: "bg-amber-50 dark:bg-amber-950/40", dot: "bg-amber-500" },
  COMPLETED: { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-50 dark:bg-emerald-950/40", dot: "bg-emerald-500" },
  RESULT_PUBLISHED: { label: "Published", color: "text-violet-700", bg: "bg-violet-50 dark:bg-violet-950/40", dot: "bg-violet-500" },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExamData = Record<string, any>;

export function ExamListClient({ tenantType, userRole }: ExamListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [exams, setExams] = useState<ExamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [batches, setBatches] = useState<{ id: string; name: string }[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isSchool = tenantType === "SCHOOL";
  const canCreate = ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"].includes(userRole);

  const loadExams = useCallback(async () => {
    setLoading(true);
    const filters: Record<string, unknown> = { page, pageSize: 20 };
    if (statusFilter !== "all") filters.status = statusFilter;
    if (typeFilter !== "all") filters.type = typeFilter;
    if (classFilter !== "all") {
      if (isSchool) filters.classId = classFilter;
      else filters.batchId = classFilter;
    }

    const result = await getExamList(filters as Record<string, string | number | undefined>);
    if (result.success && result.data) {
      setExams(result.data);
      setTotalPages(result.pagination?.totalPages || 1);
    }
    setLoading(false);
  }, [page, statusFilter, typeFilter, classFilter, isSchool]);

  useEffect(() => {
    void loadExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, typeFilter, classFilter]);

  useEffect(() => {
    getClassesForExam().then((res) => {
      if (res.success && res.data) {
        setClasses(res.data.classes);
        setBatches(res.data.batches);
      }
    });
  }, []);

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteExam(id);
      if (result.success) {
        toast.success("Exam deleted successfully");
        setDeleteId(null);
        loadExams();
      } else {
        toast.error(result.error || "Failed to delete exam");
      }
    });
  }

  function handleStatusChange(id: string, status: string) {
    startTransition(async () => {
      const result = await updateExam(id, { status });
      if (result.success) {
        toast.success(`Exam status updated to ${examStatusConfig[status]?.label || status}`);
        loadExams();
      } else {
        toast.error(result.error || "Failed to update status");
      }
    });
  }

  const statusCounts = {
    all: exams.length,
    UPCOMING: exams.filter((e) => e.status === "UPCOMING").length,
    ONGOING: exams.filter((e) => e.status === "ONGOING").length,
    COMPLETED: exams.filter((e) => e.status === "COMPLETED").length,
    RESULT_PUBLISHED: exams.filter((e) => e.status === "RESULT_PUBLISHED").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exams & Marks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create exams, enter marks, and publish results
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={() => router.push("/dashboard/exams/new")}
            className="gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Create Exam
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { key: "UPCOMING", icon: Calendar, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { key: "ONGOING", icon: ClipboardCheck, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
          { key: "COMPLETED", icon: FileSpreadsheet, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          { key: "RESULT_PUBLISHED", icon: Trophy, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
        ].map((stat) => (
          <Card
            key={stat.key}
            className={cn(
              "cursor-pointer border transition-all hover:shadow-md",
              statusFilter === stat.key && "ring-2 ring-primary/50"
            )}
            onClick={() => setStatusFilter(statusFilter === stat.key ? "all" : stat.key)}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className={cn("rounded-lg p-2.5", stat.bg)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold">{statusCounts[stat.key as keyof typeof statusCounts] || 0}</p>
                <p className="text-xs text-muted-foreground">{examStatusConfig[stat.key]?.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v || "all"); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-45">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(examTypeConfig).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={classFilter} onValueChange={(v) => { setClassFilter(v || "all"); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-50">
                <SelectValue placeholder={isSchool ? "All Classes" : "All Batches"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isSchool ? "All Classes" : "All Batches"}</SelectItem>
                {(isSchool ? classes : batches).map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v || "all"); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-45">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(examStatusConfig).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Exam Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : exams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Award className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No exams found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {canCreate
                  ? "Create your first exam to start managing marks and results."
                  : "No exams have been created yet."}
              </p>
              {canCreate && (
                <Button className="mt-4 gap-2" onClick={() => router.push("/dashboard/exams/new")}>
                  <Plus className="h-4 w-4" />
                  Create Exam
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="font-semibold">Exam</TableHead>
                      <TableHead className="font-semibold hidden sm:table-cell">Type</TableHead>
                      <TableHead className="font-semibold hidden md:table-cell">{isSchool ? "Class" : "Batch"}</TableHead>
                      <TableHead className="font-semibold hidden lg:table-cell">Dates</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold hidden md:table-cell">Progress</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exams.map((exam) => {
                      const typeConf = examTypeConfig[exam.type] || examTypeConfig.PRACTICE;
                      const statusConf = examStatusConfig[exam.status] || examStatusConfig.UPCOMING;
                      return (
                        <TableRow
                          key={exam.id}
                          className="cursor-pointer hover:bg-muted/30 transition-colors"
                          onClick={() => router.push(`/dashboard/exams/${exam.id}`)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={cn("hidden sm:flex items-center justify-center h-10 w-10 rounded-lg border", typeConf.bg)}>
                                <BookOpen className={cn("h-4 w-4", typeConf.color)} />
                              </div>
                              <div>
                                <p className="font-medium">{exam.name}</p>
                                <p className="text-xs text-muted-foreground sm:hidden">
                                  {typeConf.label} · {exam.className || exam.batchName}
                                </p>
                                <p className="text-xs text-muted-foreground hidden sm:block">
                                  {exam.subjectCount} subjects · {exam.studentCount} students
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline" className={cn("text-xs border", typeConf.bg, typeConf.color)}>
                              {typeConf.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className="text-sm">{exam.className || exam.batchName || "—"}</span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="text-sm">
                              {exam.startDate ? format(new Date(exam.startDate), "dd MMM") : "—"}
                              {exam.endDate && ` - ${format(new Date(exam.endDate), "dd MMM yyyy")}`}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <div className={cn("h-2 w-2 rounded-full", statusConf.dot)} />
                              <span className={cn("text-xs font-medium", statusConf.color)}>
                                {statusConf.label}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-25">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    exam.marksProgress.percentage === 100
                                      ? "bg-emerald-500"
                                      : exam.marksProgress.percentage > 0
                                      ? "bg-amber-500"
                                      : "bg-gray-300"
                                  )}
                                  style={{ width: `${exam.marksProgress.percentage}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {exam.marksProgress.percentage}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="h-8 w-8 p-0" />}>
                                <MoreHorizontal className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => router.push(`/dashboard/exams/${exam.id}`)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {canCreate && exam.status !== "RESULT_PUBLISHED" && (
                                  <DropdownMenuItem onClick={() => router.push(`/dashboard/exams/${exam.id}/marks`)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Enter Marks
                                  </DropdownMenuItem>
                                )}
                                {exam.status === "RESULT_PUBLISHED" && (
                                  <DropdownMenuItem onClick={() => router.push(`/dashboard/exams/${exam.id}/results`)}>
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                    View Results
                                  </DropdownMenuItem>
                                )}
                                {canCreate && (
                                  <>
                                    <DropdownMenuSeparator />
                                    {exam.status === "UPCOMING" && (
                                      <DropdownMenuItem onClick={() => handleStatusChange(exam.id, "ONGOING")}>
                                        <ClipboardCheck className="mr-2 h-4 w-4" />
                                        Mark as Ongoing
                                      </DropdownMenuItem>
                                    )}
                                    {exam.status === "ONGOING" && (
                                      <DropdownMenuItem onClick={() => handleStatusChange(exam.id, "COMPLETED")}>
                                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                                        Mark as Completed
                                      </DropdownMenuItem>
                                    )}
                                    {exam.status !== "RESULT_PUBLISHED" && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-destructive focus:text-destructive"
                                          onClick={() => setDeleteId(exam.id)}
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this exam and all associated marks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

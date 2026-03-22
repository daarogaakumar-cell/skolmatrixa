"use client";

import { useState, useEffect, useTransition } from "react";
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
  FileText,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Send,
  Lock,
  Loader2,
  BookOpen,
  Clock,
  Users,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  getHomeworkList,
  publishHomework,
  closeHomework,
  deleteHomework,
} from "@/actions/homework";

interface HomeworkListClientProps {
  tenantType: string;
  userRole: string;
}

export function HomeworkListClient({ tenantType, userRole }: HomeworkListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isAdmin = ["TENANT_ADMIN", "VICE_ADMIN"].includes(userRole);

  const [homework, setHomework] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<string>(isAdmin ? "all" : "mine");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadHomework();
  }, [statusFilter, viewMode]);

  async function loadHomework(page = 1) {
    setLoading(true);
    try {
      const result = await getHomeworkList({
        status: statusFilter !== "all" ? statusFilter : undefined,
        teacherOnly: viewMode === "mine",
        page,
        pageSize: 20,
      });
      if (result.success && result.data) {
        setHomework(result.data as any[]);
        if (result.pagination) setPagination(result.pagination);
      }
    } catch {
      toast.error("Failed to load homework");
    } finally {
      setLoading(false);
    }
  }

  function handlePublish(id: string) {
    startTransition(async () => {
      const result = await publishHomework(id);
      if (result.success) {
        toast.success("Homework published successfully");
        loadHomework(pagination.page);
      } else {
        toast.error(result.error || "Failed to publish");
      }
    });
  }

  function handleClose(id: string) {
    startTransition(async () => {
      const result = await closeHomework(id);
      if (result.success) {
        toast.success("Homework closed");
        loadHomework(pagination.page);
      } else {
        toast.error(result.error || "Failed to close");
      }
    });
  }

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteHomework(deleteId);
      if (result.success) {
        toast.success("Homework deleted");
        setDeleteId(null);
        loadHomework(pagination.page);
      } else {
        toast.error(result.error || "Failed to delete");
      }
    });
  }

  const statusColors: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    PUBLISHED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    CLOSED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Homework</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage homework assignments
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/homework/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Homework
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {isAdmin && (
          <Select value={viewMode} onValueChange={(v) => v && setViewMode(v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Homework</SelectItem>
              <SelectItem value="mine">My Homework</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      {!loading && homework.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pagination.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-500/10 p-2">
                  <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {homework.filter((h) => h.status === "DRAFT").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Drafts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {homework.filter((h) => h.status === "PUBLISHED").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Published</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/30 dark:to-violet-900/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-violet-500/10 p-2">
                  <Users className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {homework.reduce((acc, h) => acc + (h.submissionCount || 0), 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Submissions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : homework.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold">No homework found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Create your first homework assignment to get started.
              </p>
              <Button
                onClick={() => router.push("/dashboard/homework/new")}
                variant="outline"
                className="mt-4 gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Homework
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      {tenantType === "SCHOOL" ? "Class" : "Batch"}
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Subject</TableHead>
                    <TableHead className="hidden lg:table-cell">Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Submissions</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {homework.map((hw) => (
                    <TableRow
                      key={hw.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/dashboard/homework/${hw.id}`)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{hw.title}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">
                            {hw.subject?.name} • Due {format(new Date(hw.dueDate), "MMM d")}
                          </p>
                          {isAdmin && hw.teacher && (
                            <p className="text-xs text-muted-foreground">
                              by {hw.teacher.name}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {hw.class
                          ? `${hw.class.name}${hw.class.section ? ` - ${hw.class.section}` : ""}`
                          : hw.batch?.name || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {hw.subject?.name || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className={cn(
                            "text-sm",
                            new Date(hw.dueDate) < new Date() && hw.status === "PUBLISHED"
                              ? "text-red-600 dark:text-red-400 font-medium"
                              : ""
                          )}>
                            {format(new Date(hw.dueDate), "MMM d, yyyy")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn("text-xs", statusColors[hw.status])}>
                          {hw.status === "DRAFT" ? "Draft" : hw.status === "PUBLISHED" ? "Published" : "Closed"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm">
                          {hw.submissionCount}/{hw.totalStudents}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            onClick={(e) => e.stopPropagation()}
                            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/homework/${hw.id}`); }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            {hw.status === "DRAFT" && (
                              <>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/homework/${hw.id}/edit`); }}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePublish(hw.id); }}>
                                  <Send className="mr-2 h-4 w-4" />
                                  Publish
                                </DropdownMenuItem>
                              </>
                            )}
                            {hw.status === "PUBLISHED" && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleClose(hw.id); }}>
                                <Lock className="mr-2 h-4 w-4" />
                                Close
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => { e.stopPropagation(); setDeleteId(hw.id); }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => loadHomework(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => loadHomework(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Homework?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this homework and all its submissions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

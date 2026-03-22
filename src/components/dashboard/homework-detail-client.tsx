"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Send,
  Lock,
  FileText,
  Download,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Star,
  Bell,
  ExternalLink,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  getHomeworkDetail,
  publishHomework,
  closeHomework,
  gradeSubmission,
  sendHomeworkReminder,
} from "@/actions/homework";

interface HomeworkDetailClientProps {
  homeworkId: string;
  userRole: string;
  tenantType: string;
}

export function HomeworkDetailClient({
  homeworkId,
  userRole,
  tenantType,
}: HomeworkDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [homework, setHomework] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gradeDialog, setGradeDialog] = useState<any>(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submissionFilter, setSubmissionFilter] = useState("all");

  useEffect(() => {
    loadDetail();
  }, [homeworkId]);

  async function loadDetail() {
    setLoading(true);
    try {
      const result = await getHomeworkDetail(homeworkId);
      if (result.success && result.data) {
        setHomework(result.data);
      } else {
        toast.error("Homework not found");
        router.push("/dashboard/homework");
      }
    } catch {
      toast.error("Failed to load homework");
    } finally {
      setLoading(false);
    }
  }

  function handlePublish() {
    startTransition(async () => {
      const result = await publishHomework(homeworkId);
      if (result.success) {
        toast.success("Homework published");
        loadDetail();
      } else {
        toast.error(result.error || "Failed to publish");
      }
    });
  }

  function handleClose() {
    startTransition(async () => {
      const result = await closeHomework(homeworkId);
      if (result.success) {
        toast.success("Homework closed");
        loadDetail();
      } else {
        toast.error(result.error || "Failed to close");
      }
    });
  }

  function handleGrade() {
    if (!gradeDialog || !grade.trim()) {
      toast.error("Please enter a grade");
      return;
    }
    startTransition(async () => {
      const result = await gradeSubmission({
        submissionId: gradeDialog.id,
        grade: grade.trim(),
        feedback: feedback.trim() || undefined,
      });
      if (result.success) {
        toast.success("Submission graded");
        setGradeDialog(null);
        setGrade("");
        setFeedback("");
        loadDetail();
      } else {
        toast.error(result.error || "Failed to grade");
      }
    });
  }

  function handleReminder() {
    startTransition(async () => {
      const result = await sendHomeworkReminder(homeworkId);
      if (result.success) {
        toast.success(`Reminder sent to ${(result.data as any)?.remindersSent || 0} students`);
      } else {
        toast.error(result.error || "Failed to send reminder");
      }
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!homework) return null;

  const submissions = homework.submissions || [];
  const submitted = submissions.filter((s: any) => ["SUBMITTED", "LATE"].includes(s.status));
  const graded = submissions.filter((s: any) => s.status === "GRADED");
  const late = submissions.filter((s: any) => s.status === "LATE");
  const isOverdue = new Date(homework.dueDate) < new Date();

  const filteredSubmissions =
    submissionFilter === "all"
      ? submissions
      : submissionFilter === "submitted"
        ? submitted
        : submissionFilter === "graded"
          ? graded
          : submissionFilter === "late"
            ? late
            : submissions;

  const statusColors: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    PUBLISHED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    CLOSED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  };

  const submissionStatusColors: Record<string, string> = {
    SUBMITTED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    GRADED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    RETURNED: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400",
    LATE: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/homework")} className="mt-1">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{homework.title}</h1>
            <Badge variant="secondary" className={cn("text-xs shrink-0", statusColors[homework.status])}>
              {homework.status}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
            <span>{homework.subject?.name}</span>
            <span>•</span>
            <span>
              {homework.class
                ? `${homework.class.name}${homework.class.section ? ` - ${homework.class.section}` : ""}`
                : homework.batch?.name}
            </span>
            <span>•</span>
            <span>By {homework.teacher?.name}</span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {homework.status === "DRAFT" && (
            <Button onClick={handlePublish} disabled={isPending} size="sm" className="gap-1.5">
              <Send className="h-3.5 w-3.5" />
              Publish
            </Button>
          )}
          {homework.status === "PUBLISHED" && (
            <>
              <Button variant="outline" onClick={handleReminder} disabled={isPending} size="sm" className="gap-1.5">
                <Bell className="h-3.5 w-3.5" />
                Remind
              </Button>
              <Button variant="outline" onClick={handleClose} disabled={isPending} size="sm" className="gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                Close
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className={cn("h-5 w-5", isOverdue ? "text-red-500" : "text-blue-500")} />
              <div>
                <p className="text-xs text-muted-foreground">Due Date</p>
                <p className={cn("text-sm font-semibold", isOverdue && homework.status === "PUBLISHED" ? "text-red-600 dark:text-red-400" : "")}>
                  {format(new Date(homework.dueDate), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-xs text-muted-foreground">Submissions</p>
                <p className="text-sm font-semibold">
                  {submissions.length}/{homework.totalStudents}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/30 dark:to-violet-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-violet-500" />
              <div>
                <p className="text-xs text-muted-foreground">Graded</p>
                <p className="text-sm font-semibold">{graded.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">Late</p>
                <p className="text-sm font-semibold">{late.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="submissions">
            Submissions ({submissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              {homework.description ? (
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{homework.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No description provided</p>
              )}
            </CardContent>
          </Card>

          {homework.fileUrls && homework.fileUrls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attachments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {homework.fileUrls.map((url: string, i: number) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-md border p-3 text-sm hover:bg-muted/50 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate flex-1">{url.split("/").pop()}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </a>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4 mt-4">
          {/* Submission Filters */}
          <div className="flex items-center gap-3">
            <Select value={submissionFilter} onValueChange={(v) => v && setSubmissionFilter(v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({submissions.length})</SelectItem>
                <SelectItem value="submitted">Submitted ({submitted.length})</SelectItem>
                <SelectItem value="graded">Graded ({graded.length})</SelectItem>
                <SelectItem value="late">Late ({late.length})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              {filteredSubmissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground mb-3" />
                  <h3 className="font-medium">No submissions yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Students haven&apos;t submitted their work yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead className="hidden md:table-cell">Submitted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">Grade</TableHead>
                        <TableHead className="hidden lg:table-cell">Files</TableHead>
                        <TableHead className="w-[100px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubmissions.map((sub: any) => (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={sub.student?.photoUrl} />
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {sub.student?.name?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{sub.student?.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {sub.student?.rollNo || sub.student?.admissionNo}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">
                            {formatDistanceToNow(new Date(sub.submittedAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={cn("text-xs", submissionStatusColors[sub.status])}>
                              {sub.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {sub.grade ? (
                              <span className="font-medium">{sub.grade}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {sub.fileUrls && sub.fileUrls.length > 0 ? (
                              <span className="text-sm">{sub.fileUrls.length} file(s)</span>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setGradeDialog(sub);
                                setGrade(sub.grade || "");
                                setFeedback(sub.feedback || "");
                              }}
                              className="gap-1"
                            >
                              <Star className="h-3 w-3" />
                              {sub.status === "GRADED" ? "Re-grade" : "Grade"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Grade Dialog */}
      <Dialog open={!!gradeDialog} onOpenChange={() => { setGradeDialog(null); setGrade(""); setFeedback(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
            <DialogDescription>
              {gradeDialog?.student?.name} — {gradeDialog?.student?.rollNo || gradeDialog?.student?.admissionNo}
            </DialogDescription>
          </DialogHeader>

          {gradeDialog && (
            <div className="space-y-4">
              {/* Submission content preview */}
              {gradeDialog.content && (
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Response:</p>
                  <p className="text-sm whitespace-pre-wrap">{gradeDialog.content}</p>
                </div>
              )}

              {gradeDialog.fileUrls && gradeDialog.fileUrls.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Attached files:</p>
                  {gradeDialog.fileUrls.map((url: string, i: number) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Download className="h-3 w-3" />
                      {url.split("/").pop()}
                    </a>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="grade">Grade *</Label>
                <Input
                  id="grade"
                  placeholder="e.g., A+, 9/10, Excellent"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Write feedback for the student..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleGrade} disabled={isPending} className="gap-1.5">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Save Grade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

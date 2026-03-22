"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  Loader2,
  Star,
  ExternalLink,
  Paperclip,
  X,
  Send,
} from "lucide-react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { getMyHomework, submitHomework, getMyHomeworkDetail } from "@/actions/homework";

export function MyHomeworkClient() {
  const [isPending, startTransition] = useTransition();
  const [homework, setHomework] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedHw, setSelectedHw] = useState<any>(null);
  const [submitDialog, setSubmitDialog] = useState<any>(null);
  const [content, setContent] = useState("");
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadHomework();
  }, [statusFilter]);

  async function loadHomework() {
    setLoading(true);
    try {
      const result = await getMyHomework({
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      if (result.success && result.data) {
        setHomework(result.data as any[]);
      }
    } catch {
      toast.error("Failed to load homework");
    } finally {
      setLoading(false);
    }
  }

  async function handleViewDetail(hw: any) {
    const result = await getMyHomeworkDetail(hw.id);
    if (result.success && result.data) {
      setSelectedHw(result.data);
    }
  }

  function openSubmit(hw: any) {
    setSubmitDialog(hw);
    setContent(hw.mySubmission?.content || "");
    setFileUrls(hw.mySubmission?.fileUrls || []);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`);
          continue;
        }
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "submissions");

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");

        const { url } = await res.json();
        setFileUrls((prev) => [...prev, url]);
      }
    } catch {
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function handleSubmit() {
    if (!content.trim() && fileUrls.length === 0) {
      toast.error("Please add a response or attach files");
      return;
    }

    startTransition(async () => {
      const result = await submitHomework({
        homeworkId: submitDialog.id,
        content: content.trim() || undefined,
        fileUrls: fileUrls.length > 0 ? fileUrls : undefined,
      });
      if (result.success) {
        toast.success("Homework submitted!");
        setSubmitDialog(null);
        setContent("");
        setFileUrls([]);
        loadHomework();
      } else {
        toast.error(result.error || "Failed to submit");
      }
    });
  }

  function getStatusInfo(hw: any) {
    if (hw.mySubmission?.status === "GRADED") return { label: "Graded", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400", icon: Star };
    if (hw.mySubmission?.status === "SUBMITTED") return { label: "Submitted", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", icon: CheckCircle2 };
    if (hw.mySubmission?.status === "LATE") return { label: "Late", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", icon: AlertCircle };
    if (isPast(new Date(hw.dueDate))) return { label: "Overdue", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", icon: AlertCircle };
    return { label: "Pending", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400", icon: Clock };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Homework</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and submit your assignments
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="PUBLISHED">Active</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Homework List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : homework.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold">No homework assigned</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Check back later for new assignments.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {homework.map((hw) => {
            const status = getStatusInfo(hw);
            const StatusIcon = status.icon;
            return (
              <Card
                key={hw.id}
                className="group cursor-pointer hover:shadow-md transition-all duration-200 border-l-4"
                style={{
                  borderLeftColor: hw.mySubmission?.status === "GRADED"
                    ? "rgb(16,185,129)"
                    : hw.mySubmission
                      ? "rgb(59,130,246)"
                      : isPast(new Date(hw.dueDate))
                        ? "rgb(239,68,68)"
                        : "rgb(245,158,11)",
                }}
                onClick={() => handleViewDetail(hw)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {hw.title}
                    </h3>
                    <Badge variant="secondary" className={cn("text-[10px] shrink-0", status.color)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{hw.subject?.name}</span>
                    <span>•</span>
                    <span>{hw.teacher?.name}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className={cn(
                        isPast(new Date(hw.dueDate)) && !hw.mySubmission
                          ? "text-red-500 font-medium"
                          : ""
                      )}>
                        Due {format(new Date(hw.dueDate), "MMM d, yyyy")}
                      </span>
                    </div>
                    {hw.mySubmission?.grade && (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        Grade: {hw.mySubmission.grade}
                      </span>
                    )}
                  </div>

                  {/* Submit button */}
                  {hw.status === "PUBLISHED" && !hw.mySubmission?.status?.includes("GRADED") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 gap-1.5"
                      onClick={(e) => { e.stopPropagation(); openSubmit(hw); }}
                    >
                      <Send className="h-3 w-3" />
                      {hw.mySubmission ? "Re-submit" : "Submit"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Homework Detail Dialog */}
      <Dialog open={!!selectedHw} onOpenChange={() => setSelectedHw(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          {selectedHw && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedHw.title}</DialogTitle>
                <DialogDescription>
                  {selectedHw.subject?.name} • Due {format(new Date(selectedHw.dueDate), "PPP")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {selectedHw.description && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Instructions</p>
                    <p className="text-sm whitespace-pre-wrap">{selectedHw.description}</p>
                  </div>
                )}

                {selectedHw.fileUrls && selectedHw.fileUrls.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Attachments</p>
                    {selectedHw.fileUrls.map((url: string, i: number) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-md border p-2 text-sm hover:bg-muted/50 mb-1"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate flex-1">{url.split("/").pop()}</span>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                )}

                {selectedHw.mySubmission && (
                  <div className="rounded-md border p-3 bg-muted/30">
                    <p className="text-xs font-medium mb-2">Your Submission</p>
                    {selectedHw.mySubmission.content && (
                      <p className="text-sm whitespace-pre-wrap mb-2">{selectedHw.mySubmission.content}</p>
                    )}
                    {selectedHw.mySubmission.grade && (
                      <div className="flex items-center gap-4 mt-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Grade</p>
                          <p className="text-lg font-bold text-emerald-600">{selectedHw.mySubmission.grade}</p>
                        </div>
                        {selectedHw.mySubmission.feedback && (
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Feedback</p>
                            <p className="text-sm">{selectedHw.mySubmission.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter>
                {selectedHw.status === "PUBLISHED" && !selectedHw.mySubmission?.status?.includes("GRADED") && (
                  <Button onClick={() => { setSelectedHw(null); openSubmit(selectedHw); }} className="gap-1.5">
                    <Send className="h-3.5 w-3.5" />
                    {selectedHw.mySubmission ? "Re-submit" : "Submit"}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Submit Dialog */}
      <Dialog open={!!submitDialog} onOpenChange={() => { setSubmitDialog(null); setContent(""); setFileUrls([]); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Homework</DialogTitle>
            <DialogDescription>{submitDialog?.title}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Your Response</Label>
              <Textarea
                placeholder="Write your answer or response..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label>Attachments</Label>
              {fileUrls.length > 0 && (
                <div className="space-y-1">
                  {fileUrls.map((url, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate flex-1">{url.split("/").pop()}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => setFileUrls((prev) => prev.filter((_, j) => j !== i))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <label
                htmlFor="submit-file-upload"
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors",
                  uploading && "pointer-events-none opacity-50"
                )}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                {uploading ? "Uploading..." : "Attach files"}
              </label>
              <input
                id="submit-file-upload"
                type="file"
                multiple
                className="hidden"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending} className="gap-1.5">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

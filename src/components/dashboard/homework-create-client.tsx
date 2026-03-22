"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  ArrowLeft,
  CalendarIcon,
  Loader2,
  Save,
  Send,
  Paperclip,
  X,
  FileIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  createHomework,
  getClassesAndBatchesForHomework,
  getSubjectsForHomework,
} from "@/actions/homework";

interface HomeworkCreateClientProps {
  tenantType: string;
}

export function HomeworkCreateClient({ tenantType }: HomeworkCreateClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isSchool = tenantType === "SCHOOL";

  const [classes, setClasses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function load() {
      const result = await getClassesAndBatchesForHomework();
      if (result.success && result.data) {
        setClasses((result.data as any).classes || []);
        setBatches((result.data as any).batches || []);
      }
    }
    load();
  }, []);

  useEffect(() => {
    async function loadSubjects() {
      const result = await getSubjectsForHomework(
        selectedClassId || undefined,
        selectedBatchId || undefined
      );
      if (result.success && result.data) {
        setSubjects(result.data as any[]);
      }
    }
    if (selectedClassId || selectedBatchId) {
      loadSubjects();
      setSelectedSubjectId("");
    }
  }, [selectedClassId, selectedBatchId]);

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
        formData.append("folder", "homework");

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");

        const { url } = await res.json();
        setFileUrls((prev) => [...prev, url]);
      }
      toast.success("Files uploaded");
    } catch {
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function handleSubmit(publish: boolean) {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!selectedSubjectId) {
      toast.error("Please select a subject");
      return;
    }
    if (!dueDate) {
      toast.error("Please select a due date");
      return;
    }

    startTransition(async () => {
      const result = await createHomework({
        title: title.trim(),
        description: description.trim() || undefined,
        subjectId: selectedSubjectId,
        classId: selectedClassId || undefined,
        batchId: selectedBatchId || undefined,
        dueDate: dueDate.toISOString(),
        fileUrls,
        publish,
      });

      if (result.success) {
        toast.success(publish ? "Homework published!" : "Homework saved as draft");
        router.push("/dashboard/homework");
      } else {
        toast.error(result.error || "Failed to create homework");
      }
    });
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Homework</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Assign homework to a class or batch
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Homework Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Chapter 5 Practice Questions"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Class/Batch & Subject */}
          <div className="grid gap-4 sm:grid-cols-2">
            {isSchool ? (
              <div className="space-y-2">
                <Label>{tenantType === "SCHOOL" ? "Class" : "Batch"} *</Label>
                <Select value={selectedClassId} onValueChange={(v) => { if (v) { setSelectedClassId(v); setSelectedBatchId(""); } }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}{c.section ? ` - ${c.section}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Batch *</Label>
                <Select value={selectedBatchId} onValueChange={(v) => { if (v) { setSelectedBatchId(v); setSelectedClassId(""); } }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Subject *</Label>
              <Select value={selectedSubjectId} onValueChange={(v) => v && setSelectedSubjectId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}{s.code ? ` (${s.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date *</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger className={cn(
                "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs",
                !dueDate && "text-muted-foreground"
              )}>
                {dueDate ? format(dueDate, "PPP") : "Select due date"}
                <CalendarIcon className="h-4 w-4 opacity-50" />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => { setDueDate(date ?? undefined); setIsCalendarOpen(false); }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Write homework instructions, questions, or details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="resize-y"
            />
          </div>

          {/* File Attachments */}
          <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="space-y-3">
              {fileUrls.length > 0 && (
                <div className="space-y-2">
                  {fileUrls.map((url, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                      <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate flex-1">{url.split("/").pop()}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => setFileUrls((prev) => prev.filter((_, j) => j !== i))}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <label
                  htmlFor="file-upload"
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary",
                    uploading && "pointer-events-none opacity-50"
                  )}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Paperclip className="h-4 w-4" />
                  )}
                  {uploading ? "Uploading..." : "Attach files (PDF, images, docs — max 10MB each)"}
                </label>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4 border-t sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => handleSubmit(false)}
              disabled={isPending}
              className="gap-2"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSubmit(true)}
              disabled={isPending}
              className="gap-2"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publish Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

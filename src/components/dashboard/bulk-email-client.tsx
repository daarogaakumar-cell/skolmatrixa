"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Send, Users, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { sendBulkEmail, getBulkEmailTargetOptions } from "@/actions/bulk-email";

const schema = z.object({
  subject: z.string().min(1, "Subject is required").max(200),
  message: z.string().min(1, "Message is required").max(5000),
  category: z.string().default("GENERAL"),
  targetType: z.string().default("ALL"),
  targetClassId: z.string().optional(),
  targetBatchId: z.string().optional(),
});

type FormData = z.input<typeof schema>;

const CATEGORIES = [
  { value: "GENERAL", label: "General Announcement", emoji: "📢" },
  { value: "EVENT", label: "Event", emoji: "📅" },
  { value: "HOLIDAY", label: "Holiday", emoji: "🏖️" },
  { value: "RESULT", label: "Results / Report Cards", emoji: "📊" },
  { value: "EXAM_SCHEDULE", label: "Exam Schedule", emoji: "📝" },
  { value: "FEE_REMINDER", label: "Fee Reminder", emoji: "💰" },
];

const TARGET_TYPES = [
  { value: "ALL", label: "Everyone", desc: "All staff, students & parents" },
  { value: "CLASS", label: "Specific Class", desc: "Students & parents of a class" },
  { value: "BATCH", label: "Specific Batch", desc: "Students & parents of a batch" },
  { value: "ROLE", label: "By Role", desc: "Select specific roles" },
];

const ROLE_OPTIONS = [
  { value: "TEACHER", label: "Teachers" },
  { value: "STUDENT", label: "Students" },
  { value: "PARENT", label: "Parents" },
  { value: "ACCOUNTANT", label: "Accountants" },
  { value: "LIBRARIAN", label: "Librarians" },
];

export function BulkEmailClient() {
  const [isPending, startTransition] = useTransition();
  const [options, setOptions] = useState<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    classes: Record<string, any>[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    batches: Record<string, any>[];
  }>({ classes: [], batches: [] });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [targetType, setTargetType] = useState("ALL");
  const [result, setResult] = useState<{
    recipientCount: number;
    sent: number;
    failed: number;
  } | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      subject: "",
      message: "",
      category: "GENERAL",
      targetType: "ALL",
    },
  });

  const watchedCategory = useWatch({ control: form.control, name: "category" });
  const watchedTargetClassId = useWatch({ control: form.control, name: "targetClassId" });
  const watchedTargetBatchId = useWatch({ control: form.control, name: "targetBatchId" });
  const watchedMessage = useWatch({ control: form.control, name: "message" });

  useEffect(() => {
    async function load() {
      const res = await getBulkEmailTargetOptions();
      if (res.success && res.data) {
        setOptions(res.data);
      }
    }
    load();
  }, []);

  function toggleRole(role: string) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  function onSubmit(data: FormData) {
    setResult(null);
    startTransition(async () => {
      const res = await sendBulkEmail({
        subject: data.subject,
        message: data.message,
        category: data.category || "GENERAL",
        targetType,
        targetClassId: targetType === "CLASS" ? data.targetClassId : undefined,
        targetBatchId: targetType === "BATCH" ? data.targetBatchId : undefined,
        targetRoles: targetType === "ROLE" ? selectedRoles : undefined,
      });

      if (res.success && res.data) {
        setResult(res.data);
        toast.success(`Email sent to ${res.data.sent} recipient(s)`);
        form.reset();
        setSelectedRoles([]);
      } else {
        toast.error(res.error || "Failed to send bulk email");
      }
    });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Mail className="h-6 w-6 text-primary" />
          Bulk Email
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Send emails to a class, batch, or your entire institution at once.
        </p>
      </div>

      {/* Success Result */}
      {result && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-200">
                  Emails sent successfully!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  {result.sent} of {result.recipientCount} emails delivered.
                  {result.failed > 0 && (
                    <span className="text-amber-600"> {result.failed} failed.</span>
                  )}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto"
                onClick={() => setResult(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Category & Target */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Audience & Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={watchedCategory}
                onValueChange={(val) => form.setValue("category", val ?? undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.emoji} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Type */}
            <div className="space-y-2">
              <Label>Send To</Label>
              <div className="grid grid-cols-2 gap-2">
                {TARGET_TYPES.map((tt) => (
                  <button
                    type="button"
                    key={tt.value}
                    onClick={() => {
                      setTargetType(tt.value);
                      form.setValue("targetType", tt.value);
                    }}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      targetType === tt.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span className="font-medium text-sm">{tt.label}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      {tt.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Class Selector */}
            {targetType === "CLASS" && (
              <div className="space-y-2">
                <Label>Class</Label>
                <Select
                  value={watchedTargetClassId || ""}
                  onValueChange={(val) => form.setValue("targetClassId", val ?? undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                        {cls.section ? ` - ${cls.section}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {options.classes.length === 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> No classes found for the current academic year.
                  </p>
                )}
              </div>
            )}

            {/* Batch Selector */}
            {targetType === "BATCH" && (
              <div className="space-y-2">
                <Label>Batch</Label>
                <Select
                  value={watchedTargetBatchId || ""}
                  onValueChange={(val) => form.setValue("targetBatchId", val ?? undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.batches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {options.batches.length === 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> No batches found for the current academic year.
                  </p>
                )}
              </div>
            )}

            {/* Role Selector */}
            {targetType === "ROLE" && (
              <div className="space-y-2">
                <Label>Roles</Label>
                <div className="flex flex-wrap gap-2">
                  {ROLE_OPTIONS.map((r) => (
                    <Badge
                      key={r.value}
                      variant={selectedRoles.includes(r.value) ? "default" : "outline"}
                      className="cursor-pointer select-none"
                      onClick={() => toggleRole(r.value)}
                    >
                      {selectedRoles.includes(r.value) && (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      )}
                      {r.label}
                    </Badge>
                  ))}
                </div>
                {selectedRoles.length === 0 && (
                  <p className="text-xs text-muted-foreground">Select at least one role.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Email Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="e.g., Annual Sports Day — 15th March"
                {...form.register("subject")}
              />
              {form.formState.errors.subject && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.subject.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Write your email content here..."
                rows={8}
                className="resize-none"
                {...form.register("message")}
              />
              {form.formState.errors.message && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.message.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground text-right">
                {(watchedMessage || "").length} / 5000
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Send */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {targetType === "ALL" && "Sending to everyone"}
              {targetType === "CLASS" && watchedTargetClassId && "Sending to selected class"}
              {targetType === "BATCH" && watchedTargetBatchId && "Sending to selected batch"}
              {targetType === "ROLE" &&
                selectedRoles.length > 0 &&
                `Sending to ${selectedRoles.length} role(s)`}
              {((targetType === "CLASS" && !watchedTargetClassId) ||
                (targetType === "BATCH" && !watchedTargetBatchId) ||
                (targetType === "ROLE" && selectedRoles.length === 0)) &&
                "Select a target to continue"}
            </span>
          </div>
          <Button
            type="submit"
            disabled={
              isPending ||
              (targetType === "ROLE" && selectedRoles.length === 0) ||
              (targetType === "CLASS" && !watchedTargetClassId) ||
              (targetType === "BATCH" && !watchedTargetBatchId)
            }
            className="min-w-35"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

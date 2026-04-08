"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Send, X } from "lucide-react";
import { createNotification, getNotificationTargetOptions } from "@/actions/notifications";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  type: z.string().default("GENERAL"),
  priority: z.string().default("NORMAL"),
  targetClassId: z.string().optional(),
  targetBatchId: z.string().optional(),
});

type FormData = z.input<typeof schema>;

const NOTIFICATION_TYPES = [
  { value: "GENERAL", label: "General" },
  { value: "ANNOUNCEMENT", label: "Announcement" },
  { value: "ATTENDANCE_ALERT", label: "Attendance Alert" },
  { value: "HOMEWORK", label: "Homework" },
  { value: "EXAM_SCHEDULE", label: "Exam Schedule" },
  { value: "FEE_REMINDER", label: "Fee Reminder" },
];

const PRIORITY_LEVELS = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const ROLE_OPTIONS = [
  { value: "TEACHER", label: "Teachers" },
  { value: "STUDENT", label: "Students" },
  { value: "PARENT", label: "Parents" },
  { value: "ACCOUNTANT", label: "Accountants" },
];

export function NotificationCreateClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [options, setOptions] = useState<{ classes: Record<string, any>[]; batches: Record<string, any>[] }>({ classes: [], batches: [] });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [sendEmailToo, setSendEmailToo] = useState(false);;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", message: "", type: "GENERAL", priority: "NORMAL" },
  });

  const watchedType = useWatch({ control: form.control, name: "type" });
  const watchedPriority = useWatch({ control: form.control, name: "priority" });
  const watchedTargetClassId = useWatch({ control: form.control, name: "targetClassId" });
  const watchedTargetBatchId = useWatch({ control: form.control, name: "targetBatchId" });

  useEffect(() => {
    async function load() {
      const result = await getNotificationTargetOptions();
      if (result.success && result.data) {
        setOptions(result.data);
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
    startTransition(async () => {
      const result = await createNotification({
        ...data,
        targetRoles: selectedRoles.length > 0 ? selectedRoles : undefined,
        sendEmail: sendEmailToo,
      });

      if (result.success) {
        toast.success("Notification sent successfully");
        router.push("/dashboard/notifications");
      } else {
        toast.error(result.error || "Failed to create notification");
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Notification</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Send a notification to your users
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notification Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title*</Label>
              <Input id="title" placeholder="Enter notification title" {...form.register("title")} />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message*</Label>
              <Textarea
                id="message"
                placeholder="Enter notification message..."
                rows={4}
                {...form.register("message")}
              />
              {form.formState.errors.message && (
                <p className="text-xs text-destructive">{form.formState.errors.message.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={watchedType} onValueChange={(val) => { if (val) form.setValue("type", val); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={watchedPriority} onValueChange={(val) => { if (val) form.setValue("priority", val); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_LEVELS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Target Audience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Target Roles</Label>
              <p className="text-xs text-muted-foreground">Leave empty to send to everyone</p>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((r) => (
                  <Badge
                    key={r.value}
                    variant={selectedRoles.includes(r.value) ? "default" : "outline"}
                    className="cursor-pointer select-none transition-colors"
                    onClick={() => toggleRole(r.value)}
                  >
                    {r.label}
                    {selectedRoles.includes(r.value) && <X className="h-3 w-3 ml-1" />}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {options.classes.length > 0 && (
                <div className="space-y-2">
                  <Label>Target Class</Label>
                  <Select
                    value={watchedTargetClassId || "all"}
                    onValueChange={(val) => form.setValue("targetClassId", val === "all" ? undefined : (val ?? undefined))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {options.classes.map((c: Record<string, string>) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}{c.section ? ` - ${c.section}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {options.batches.length > 0 && (
                <div className="space-y-2">
                  <Label>Target Batch</Label>
                  <Select
                    value={watchedTargetBatchId || "all"}
                    onValueChange={(val) => form.setValue("targetBatchId", val === "all" ? undefined : (val ?? undefined))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Batches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Batches</SelectItem>
                      {options.batches.map((b: Record<string, string>) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-toggle" className="text-sm font-medium">Also send via email</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Send email to targeted users in addition to in-app notification
                </p>
              </div>
              <Switch id="email-toggle" checked={sendEmailToo} onCheckedChange={setSendEmailToo} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Also send via WhatsApp</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  WhatsApp notifications — coming soon
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} className="gap-1.5">
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Send Notification
          </Button>
        </div>
      </form>
    </div>
  );
}

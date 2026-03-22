"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { createBatch, updateBatch, deleteBatch } from "@/actions/academic";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Clock,
  Calendar,
  BookOpen,
  Loader2,
  Layers,
} from "lucide-react";

interface BatchItem {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  capacity: number;
  startTime: string | null;
  endTime: string | null;
  days: string | null;
  faculty: { id: string; name: string } | null;
  _count: { students: number; subjects: number };
}

interface BatchesClientProps {
  initialBatches: BatchItem[];
  currentAcademicYear: string;
}

interface BatchFormData {
  name: string;
  description: string;
  subject: string;
  capacity: number;
  startTime: string;
  endTime: string;
  days: string;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function BatchesClient({ initialBatches, currentAcademicYear }: BatchesClientProps) {
  const [batches, setBatches] = useState(initialBatches);
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchItem | null>(null);

  const emptyForm: BatchFormData = {
    name: "",
    description: "",
    subject: "",
    capacity: 30,
    startTime: "",
    endTime: "",
    days: "",
  };
  const [form, setForm] = useState<BatchFormData>(emptyForm);

  function openAddDialog() {
    setEditingBatch(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(batch: BatchItem) {
    setEditingBatch(batch);
    setForm({
      name: batch.name,
      description: batch.description || "",
      subject: batch.subject || "",
      capacity: batch.capacity,
      startTime: batch.startTime || "",
      endTime: batch.endTime || "",
      days: batch.days || "",
    });
    setDialogOpen(true);
  }

  function toggleDay(day: string) {
    const currentDays = form.days ? form.days.split(",").filter(Boolean) : [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    setForm({ ...form, days: newDays.join(",") });
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error("Batch name is required");
      return;
    }

    startTransition(async () => {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        subject: form.subject.trim() || undefined,
        capacity: form.capacity,
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
        days: form.days || undefined,
      };

      if (editingBatch) {
        const result = await updateBatch(editingBatch.id, payload);
        if (result.success) {
          toast.success("Batch updated");
          setBatches(
            batches.map((b) =>
              b.id === editingBatch.id
                ? {
                    ...b,
                    ...payload,
                    description: payload.description || null,
                    subject: payload.subject || null,
                    startTime: payload.startTime || null,
                    endTime: payload.endTime || null,
                    days: payload.days || null,
                  }
                : b
            )
          );
          setDialogOpen(false);
        } else {
          toast.error(String((result as any).error || "Failed to update"));
        }
      } else {
        const result = await createBatch(payload);
        if (result.success && "data" in result) {
          toast.success("Batch created");
          const d = result.data as any;
          setBatches([
            ...batches,
            {
              id: d.id,
              name: d.name,
              description: d.description || null,
              subject: d.subject || null,
              capacity: d.capacity,
              startTime: d.startTime || null,
              endTime: d.endTime || null,
              days: d.days || null,
              faculty: null,
              _count: { students: 0, subjects: 0 },
            },
          ]);
          setDialogOpen(false);
        } else {
          toast.error(String((result as any).error || "Failed to create"));
        }
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteBatch(id);
      if (result.success) {
        toast.success("Batch deleted");
        setBatches(batches.filter((b) => b.id !== id));
      } else {
        toast.error(String((result as any).error || "Failed to delete"));
      }
    });
  }

  const selectedDays = form.days ? form.days.split(",").filter(Boolean) : [];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Batches</h1>
          <p className="text-sm text-muted-foreground">
            Academic Year: {currentAcademicYear} &middot; {batches.length} batch{batches.length !== 1 ? "es" : ""}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button onClick={openAddDialog} />}>
            <Plus className="mr-2 h-4 w-4" /> Add Batch
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingBatch ? "Edit Batch" : "Add New Batch"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Batch Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., JEE Advanced 2025"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of this batch"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Subject Focus</Label>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g., Physics"
                  />
                </div>
                <div>
                  <Label>Capacity</Label>
                  <Input
                    type="number"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 30 })}
                    min={1}
                    max={500}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Days</Label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                        selectedDays.includes(day)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background hover:bg-accent"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button onClick={handleSave} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingBatch ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {batches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 text-lg font-semibold">No batches yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by adding your first batch
            </p>
            <Button className="mt-4" onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" /> Add Batch
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch) => (
            <Card key={batch.id} className="group relative overflow-hidden transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-base">{batch.name}</CardTitle>
                    {batch.subject && (
                      <Badge variant="outline" className="mt-1">
                        {batch.subject}
                      </Badge>
                    )}
                    {batch.faculty && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Faculty: {batch.faculty.name}
                      </p>
                    )}
                  </div>
                  <div className="ml-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEditDialog(batch)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                          />
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {batch.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this batch and all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(batch.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>
                        {batch._count.students}/{batch.capacity}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>{batch._count.subjects} subjects</span>
                    </div>
                  </div>
                  {(batch.startTime || batch.days) && (
                    <div className="flex flex-wrap gap-3">
                      {batch.startTime && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {batch.startTime}
                            {batch.endTime ? ` - ${batch.endTime}` : ""}
                          </span>
                        </div>
                      )}
                      {batch.days && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{batch.days}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

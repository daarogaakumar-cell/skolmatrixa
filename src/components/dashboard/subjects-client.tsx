"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createSubject, updateSubject, deleteSubject } from "@/actions/academic";
import { Plus, Pencil, Trash2, BookOpen, Loader2 } from "lucide-react";

interface SubjectItem {
  id: string;
  name: string;
  code: string | null;
  classId: string | null;
  batchId: string | null;
  class: { id: string; name: string; section: string | null } | null;
  batch: { id: string; name: string } | null;
}

interface ParentOption {
  id: string;
  name: string;
  section?: string | null;
}

interface SubjectsClientProps {
  initialSubjects: SubjectItem[];
  tenantType: string;
  classes: ParentOption[];
  batches: ParentOption[];
}

export function SubjectsClient({
  initialSubjects,
  tenantType,
  classes,
  batches,
}: SubjectsClientProps) {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [filterParent, setFilterParent] = useState<string>("all");

  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formParentId, setFormParentId] = useState<string>("");

  const isSchool = tenantType === "SCHOOL";
  const parentLabel = isSchool ? "Class" : "Batch";
  const parents = isSchool ? classes : batches;

  function openAddDialog() {
    setEditingSubject(null);
    setFormName("");
    setFormCode("");
    setFormParentId(filterParent !== "all" ? filterParent : "");
    setDialogOpen(true);
  }

  function openEditDialog(subject: SubjectItem) {
    setEditingSubject(subject);
    setFormName(subject.name);
    setFormCode(subject.code || "");
    setFormParentId(subject.classId || subject.batchId || "");
    setDialogOpen(true);
  }

  function handleSave() {
    if (!formName.trim()) {
      toast.error("Subject name is required");
      return;
    }

    startTransition(async () => {
      if (editingSubject) {
        const result = await updateSubject(editingSubject.id, {
          name: formName.trim(),
          code: formCode.trim() || undefined,
        });
        if (result.success) {
          toast.success("Subject updated");
          setSubjects(
            subjects.map((s) =>
              s.id === editingSubject.id
                ? { ...s, name: formName.trim(), code: formCode.trim() || null }
                : s
            )
          );
          setDialogOpen(false);
        } else {
          toast.error(String((result as any).error || "Failed to update"));
        }
      } else {
        const payload: { name: string; code?: string; classId?: string; batchId?: string } = {
          name: formName.trim(),
          code: formCode.trim() || undefined,
        };
        if (isSchool && formParentId) payload.classId = formParentId;
        if (!isSchool && formParentId) payload.batchId = formParentId;

        const result = await createSubject(payload);
        if (result.success && "data" in result) {
          toast.success("Subject created");
          const parent = parents.find((p) => p.id === formParentId);
          const d = result.data as any;
          setSubjects([
            ...subjects,
            {
              id: d.id,
              name: d.name,
              code: d.code || null,
              classId: d.classId || null,
              batchId: d.batchId || null,
              class: isSchool && parent
                ? { id: parent.id, name: parent.name, section: parent.section || null }
                : null,
              batch: !isSchool && parent ? { id: parent.id, name: parent.name } : null,
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
      const result = await deleteSubject(id);
      if (result.success) {
        toast.success("Subject deleted");
        setSubjects(subjects.filter((s) => s.id !== id));
      } else {
        toast.error(String((result as any).error || "Failed to delete"));
      }
    });
  }

  const filteredSubjects =
    filterParent === "all"
      ? subjects
      : subjects.filter((s) =>
          isSchool ? s.classId === filterParent : s.batchId === filterParent
        );

  // Group subjects by parent for display
  const grouped = new Map<string, SubjectItem[]>();
  for (const s of filteredSubjects) {
    const key = isSchool
      ? s.class
        ? `${s.class.name}${s.class.section ? ` (${s.class.section})` : ""}`
        : "Unassigned"
      : s.batch
        ? s.batch.name
        : "Unassigned";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(s);
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subjects</h1>
          <p className="text-sm text-muted-foreground">
            {subjects.length} subject{subjects.length !== 1 ? "s" : ""} across {parents.length}{" "}
            {parentLabel.toLowerCase()}
            {parents.length !== 1 ? (isSchool ? "es" : "es") : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filterParent} onValueChange={(v) => setFilterParent(v || "all")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={`Filter by ${parentLabel}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {parentLabel}es</SelectItem>
              {parents.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                  {p.section ? ` (${p.section})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button onClick={openAddDialog} />}>
              <Plus className="mr-2 h-4 w-4" /> Add Subject
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSubject ? "Edit Subject" : "Add New Subject"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label>Subject Name *</Label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Mathematics"
                  />
                </div>
                <div>
                  <Label>Subject Code</Label>
                  <Input
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g., MATH-101"
                  />
                </div>
                {!editingSubject && (
                  <div>
                    <Label>{parentLabel}</Label>
                    <Select value={formParentId} onValueChange={(v) => setFormParentId(v || "")}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${parentLabel}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {parents.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                            {p.section ? ` (${p.section})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button onClick={handleSave} disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingSubject ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {subjects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 text-lg font-semibold">No subjects yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add subjects for your {parentLabel.toLowerCase()}es
            </p>
            <Button className="mt-4" onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" /> Add Subject
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {[...grouped.entries()].map(([groupName, items]) => (
            <Card key={groupName}>
              <div className="border-b px-4 py-3">
                <h3 className="text-sm font-semibold">{groupName}</h3>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((subject) => (
                      <TableRow key={subject.id}>
                        <TableCell className="font-medium">{subject.name}</TableCell>
                        <TableCell>
                          {subject.code ? (
                            <Badge variant="secondary">{subject.code}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openEditDialog(subject)}
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
                                  <AlertDialogTitle>Delete {subject.name}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This subject will be permanently removed.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(subject.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

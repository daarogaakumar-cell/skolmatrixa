"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { createClass, updateClass, deleteClass } from "@/actions/academic";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  BookOpen,
  GraduationCap,
  Loader2,
} from "lucide-react";

interface ClassItem {
  id: string;
  name: string;
  section: string | null;
  capacity: number;
  classTeacher: { id: string; name: string } | null;
  _count: { students: number; subjects: number };
}

interface ClassesClientProps {
  initialClasses: ClassItem[];
  currentAcademicYear: string;
}

export function ClassesClient({ initialClasses, currentAcademicYear }: ClassesClientProps) {
  const [classes, setClasses] = useState(initialClasses);
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formSection, setFormSection] = useState("");
  const [formCapacity, setFormCapacity] = useState(40);

  function openAddDialog() {
    setEditingClass(null);
    setFormName("");
    setFormSection("A");
    setFormCapacity(40);
    setDialogOpen(true);
  }

  function openEditDialog(cls: ClassItem) {
    setEditingClass(cls);
    setFormName(cls.name);
    setFormSection(cls.section || "");
    setFormCapacity(cls.capacity);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!formName.trim()) {
      toast.error("Class name is required");
      return;
    }

    startTransition(async () => {
      if (editingClass) {
        const result = await updateClass(editingClass.id, {
          name: formName.trim(),
          section: formSection.trim() || undefined,
          capacity: formCapacity,
        });
        if (result.success) {
          toast.success("Class updated");
          setClasses(
            classes.map((c) =>
              c.id === editingClass.id
                ? { ...c, name: formName.trim(), section: formSection.trim() || null, capacity: formCapacity }
                : c
            )
          );
          setDialogOpen(false);
        } else {
          toast.error(String((result as any).error || "Failed to update"));
        }
      } else {
        const result = await createClass({
          name: formName.trim(),
          section: formSection.trim() || undefined,
          capacity: formCapacity,
        });
        if (result.success && "data" in result) {
          toast.success("Class created");
          const d = result.data as { id: string; name: string; section: string | null; capacity: number };
          setClasses([
            ...classes,
            {
              id: d.id,
              name: d.name,
              section: d.section,
              capacity: d.capacity,
              classTeacher: null,
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
      const result = await deleteClass(id);
      if (result.success) {
        toast.success("Class deleted");
        setClasses(classes.filter((c) => c.id !== id));
      } else {
        toast.error(String((result as any).error || "Failed to delete"));
      }
    });
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Classes</h1>
          <p className="text-sm text-muted-foreground">
            Academic Year: {currentAcademicYear} &middot; {classes.length} class{classes.length !== 1 ? "es" : ""}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button onClick={openAddDialog} />}>
            <Plus className="mr-2 h-4 w-4" /> Add Class
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingClass ? "Edit Class" : "Add New Class"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Class Name *</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Class 1, Class 10"
                />
              </div>
              <div>
                <Label>Section</Label>
                <Input
                  value={formSection}
                  onChange={(e) => setFormSection(e.target.value)}
                  placeholder="e.g., A, B, C"
                />
              </div>
              <div>
                <Label>Capacity</Label>
                <Input
                  type="number"
                  value={formCapacity}
                  onChange={(e) => setFormCapacity(parseInt(e.target.value) || 40)}
                  placeholder="40"
                  min={1}
                  max={200}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button onClick={handleSave} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {editingClass ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {classes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 text-lg font-semibold">No classes yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by adding your first class
            </p>
            <Button className="mt-4" onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" /> Add Class
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Card key={cls.id} className="group relative overflow-hidden transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {cls.name}
                      {cls.section && (
                        <Badge variant="secondary" className="ml-2 font-normal">
                          {cls.section}
                        </Badge>
                      )}
                    </CardTitle>
                    {cls.classTeacher && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Teacher: {cls.classTeacher.name}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEditDialog(cls)}
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
                          <AlertDialogTitle>Delete {cls.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this class and all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(cls.id)}
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
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    <span>
                      {cls._count.students}/{cls.capacity}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>{cls._count.subjects} subjects</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

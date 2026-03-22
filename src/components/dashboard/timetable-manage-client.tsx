"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
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
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  Loader2,
  Copy,
  AlertTriangle,
  Calendar,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getTimetable,
  saveTimetable,
  getTeachersForTimetable,
  getSubjectsForTimetable,
  checkTeacherConflict,
  copyTimetable,
} from "@/actions/timetable";
import { getTeacherClassesAndBatches } from "@/actions/attendance";

interface ClassOption {
  id: string;
  name: string;
  section: string | null;
}

interface BatchOption {
  id: string;
  name: string;
}

interface TeacherOption {
  id: string;
  name: string;
}

interface SubjectOption {
  id: string;
  name: string;
  code: string | null;
}

interface TimetableEntry {
  id?: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
}

interface TimetableManageClientProps {
  tenantType: string;
}

const DAYS = [
  { value: 1, label: "Monday", shortLabel: "Mon" },
  { value: 2, label: "Tuesday", shortLabel: "Tue" },
  { value: 3, label: "Wednesday", shortLabel: "Wed" },
  { value: 4, label: "Thursday", shortLabel: "Thu" },
  { value: 5, label: "Friday", shortLabel: "Fri" },
  { value: 6, label: "Saturday", shortLabel: "Sat" },
];

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00",
];

const SUBJECT_COLORS = [
  "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-300",
  "bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300",
  "bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-950/40 dark:border-violet-700 dark:text-violet-300",
  "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-300",
  "bg-rose-100 border-rose-300 text-rose-800 dark:bg-rose-950/40 dark:border-rose-700 dark:text-rose-300",
  "bg-cyan-100 border-cyan-300 text-cyan-800 dark:bg-cyan-950/40 dark:border-cyan-700 dark:text-cyan-300",
  "bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-950/40 dark:border-orange-700 dark:text-orange-300",
  "bg-pink-100 border-pink-300 text-pink-800 dark:bg-pink-950/40 dark:border-pink-700 dark:text-pink-300",
];

export function TimetableManageClient({ tenantType }: TimetableManageClientProps) {
  const isSchool = tenantType === "SCHOOL";
  const [isPending, startTransition] = useTransition();

  // Selection state
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");

  // Dropdown options
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);

  // Timetable entries
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Dialog state
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [conflictWarning, setConflictWarning] = useState("");

  // Copy dialog
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copyFromClassId, setCopyFromClassId] = useState("");
  const [copyFromBatchId, setCopyFromBatchId] = useState("");

  // New entry form state
  const [formSubjectId, setFormSubjectId] = useState("");
  const [formTeacherId, setFormTeacherId] = useState("");
  const [formDayOfWeek, setFormDayOfWeek] = useState(1);
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("09:45");
  const [formRoom, setFormRoom] = useState("");

  // Subject color map
  const [subjectColorMap, setSubjectColorMap] = useState<Record<string, string>>({});

  // Load classes/batches and teachers
  useEffect(() => {
    async function load() {
      const [classResult, teacherResult] = await Promise.all([
        getTeacherClassesAndBatches(),
        getTeachersForTimetable(),
      ]);
      if (classResult.success && classResult.data) {
        const d = classResult.data as { classes: ClassOption[]; batches: BatchOption[] };
        setClasses(d.classes);
        setBatches(d.batches);
      }
      if (teacherResult.success && teacherResult.data) {
        setTeachers(teacherResult.data as TeacherOption[]);
      }
    }
    load();
  }, []);

  // Load subjects when class/batch changes
  useEffect(() => {
    async function loadSubjects() {
      const classId = isSchool ? selectedClassId : undefined;
      const batchId = !isSchool ? selectedBatchId : undefined;
      if (!classId && !batchId) return;

      const result = await getSubjectsForTimetable(classId, batchId);
      if (result.success && result.data) {
        setSubjects(result.data as SubjectOption[]);
      }
    }
    loadSubjects();
  }, [isSchool, selectedClassId, selectedBatchId]);

  // Load existing timetable
  const loadTimetable = useCallback(async () => {
    const classId = isSchool ? selectedClassId : undefined;
    const batchId = !isSchool ? selectedBatchId : undefined;
    if (!classId && !batchId) return;

    setIsLoading(true);
    try {
      const result = await getTimetable(classId, batchId);
      if (result.success && result.data) {
        const loadedEntries = (result.data as Array<{
          id: string;
          subjectId: string;
          subject: { id: string; name: string; code: string | null };
          teacherId: string;
          teacher: { id: string; name: string };
          dayOfWeek: number;
          startTime: string;
          endTime: string;
          room: string | null;
        }>).map((e) => ({
          id: e.id,
          subjectId: e.subjectId,
          subjectName: e.subject.name,
          teacherId: e.teacherId,
          teacherName: e.teacher.name,
          dayOfWeek: e.dayOfWeek,
          startTime: e.startTime,
          endTime: e.endTime,
          room: e.room || "",
        }));
        setEntries(loadedEntries);

        // Build color map
        const colorMap: Record<string, string> = {};
        let colorIdx = 0;
        for (const entry of loadedEntries) {
          if (!colorMap[entry.subjectId]) {
            colorMap[entry.subjectId] = SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length];
            colorIdx++;
          }
        }
        setSubjectColorMap(colorMap);
      }
      setHasUnsavedChanges(false);
    } catch {
      toast.error("Failed to load timetable");
    } finally {
      setIsLoading(false);
    }
  }, [isSchool, selectedClassId, selectedBatchId]);

  useEffect(() => {
    if ((isSchool && selectedClassId) || (!isSchool && selectedBatchId)) {
      loadTimetable();
    }
  }, [selectedClassId, selectedBatchId, loadTimetable, isSchool]);

  // Assign color to subject
  const getSubjectColor = (subjectId: string) => {
    if (!subjectColorMap[subjectId]) {
      const idx = Object.keys(subjectColorMap).length;
      const newMap = { ...subjectColorMap, [subjectId]: SUBJECT_COLORS[idx % SUBJECT_COLORS.length] };
      setSubjectColorMap(newMap);
      return newMap[subjectId];
    }
    return subjectColorMap[subjectId];
  };

  // Open add entry dialog
  const openAddDialog = (dayOfWeek?: number) => {
    setEditingEntry(null);
    setEditingIndex(null);
    setFormSubjectId("");
    setFormTeacherId("");
    setFormDayOfWeek(dayOfWeek || 1);
    setFormStartTime("09:00");
    setFormEndTime("09:45");
    setFormRoom("");
    setConflictWarning("");
    setShowEntryDialog(true);
  };

  // Open edit entry dialog
  const openEditDialog = (entry: TimetableEntry, index: number) => {
    setEditingEntry(entry);
    setEditingIndex(index);
    setFormSubjectId(entry.subjectId);
    setFormTeacherId(entry.teacherId);
    setFormDayOfWeek(entry.dayOfWeek);
    setFormStartTime(entry.startTime);
    setFormEndTime(entry.endTime);
    setFormRoom(entry.room);
    setConflictWarning("");
    setShowEntryDialog(true);
  };

  // Check conflict on teacher/day/time change
  const checkConflicts = useCallback(async () => {
    if (!formTeacherId || !formStartTime || !formEndTime) return;

    try {
      const result = await checkTeacherConflict({
        teacherId: formTeacherId,
        dayOfWeek: formDayOfWeek,
        startTime: formStartTime,
        endTime: formEndTime,
        excludeClassId: isSchool ? selectedClassId : undefined,
        excludeBatchId: !isSchool ? selectedBatchId : undefined,
      });

      if (result.success && result.data) {
        const d = result.data as { hasConflict: boolean; conflictWith?: string };
        if (d.hasConflict) {
          setConflictWarning(`Teacher is already assigned to ${d.conflictWith} at this time`);
        } else {
          setConflictWarning("");
        }
      }
    } catch {
      // Silently fail conflict check
    }
  }, [formTeacherId, formDayOfWeek, formStartTime, formEndTime, isSchool, selectedClassId, selectedBatchId]);

  useEffect(() => {
    if (showEntryDialog && formTeacherId) {
      checkConflicts();
    }
  }, [showEntryDialog, formTeacherId, formDayOfWeek, formStartTime, formEndTime, checkConflicts]);

  // Save entry from dialog
  const handleSaveEntry = () => {
    if (!formSubjectId || !formTeacherId || !formStartTime || !formEndTime) {
      toast.error("Please fill all required fields");
      return;
    }

    const subject = subjects.find((s) => s.id === formSubjectId);
    const teacher = teachers.find((t) => t.id === formTeacherId);
    if (!subject || !teacher) return;

    const newEntry: TimetableEntry = {
      subjectId: formSubjectId,
      subjectName: subject.name,
      teacherId: formTeacherId,
      teacherName: teacher.name,
      dayOfWeek: formDayOfWeek,
      startTime: formStartTime,
      endTime: formEndTime,
      room: formRoom,
    };

    if (editingIndex !== null) {
      const updated = [...entries];
      updated[editingIndex] = newEntry;
      setEntries(updated);
    } else {
      setEntries([...entries, newEntry]);
    }

    getSubjectColor(formSubjectId);
    setHasUnsavedChanges(true);
    setShowEntryDialog(false);
  };

  // Delete entry
  const handleDeleteEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  // Save full timetable
  const handleSaveTimetable = () => {
    startTransition(async () => {
      setIsSaving(true);
      try {
        const result = await saveTimetable({
          classId: isSchool ? selectedClassId : undefined,
          batchId: !isSchool ? selectedBatchId : undefined,
          entries: entries.map((e) => ({
            subjectId: e.subjectId,
            teacherId: e.teacherId,
            dayOfWeek: e.dayOfWeek,
            startTime: e.startTime,
            endTime: e.endTime,
            room: e.room || undefined,
          })),
        });

        if (result.success) {
          toast.success(result.message || "Timetable saved");
          setHasUnsavedChanges(false);
        } else {
          if (result.data) {
            // Conflict details
            const conflicts = result.data as Array<{ teacherName: string; conflictWith: string; dayOfWeek: number }>;
            const msgs = conflicts.map((c) => `${c.teacherName} conflicts with ${c.conflictWith}`);
            toast.error(`Conflicts: ${msgs.join(", ")}`);
          } else {
            toast.error(result.error || "Failed to save timetable");
          }
        }
      } catch {
        toast.error("An error occurred while saving");
      } finally {
        setIsSaving(false);
      }
    });
  };

  // Copy timetable
  const handleCopyTimetable = async () => {
    try {
      const result = await copyTimetable(
        isSchool ? copyFromClassId : undefined,
        !isSchool ? copyFromBatchId : undefined,
        isSchool ? selectedClassId : undefined,
        !isSchool ? selectedBatchId : undefined
      );

      if (result.success) {
        toast.success(result.message);
        setShowCopyDialog(false);
        loadTimetable();
      } else {
        toast.error(result.error || "Failed to copy timetable");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  // Group entries by day for grid display
  const entriesByDay: Record<number, TimetableEntry[]> = {};
  for (const day of DAYS) {
    entriesByDay[day.value] = entries
      .filter((e) => e.dayOfWeek === day.value)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  // Get today's day (1=Mon, 7=Sun)
  const jsDay = new Date().getDay();
  const todayDay = jsDay === 0 ? 7 : jsDay;

  const selectedId = isSchool ? selectedClassId : selectedBatchId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Timetable</h1>
          <p className="text-sm text-muted-foreground">
            Create and edit timetable for {isSchool ? "classes" : "batches"}
          </p>
        </div>

        {selectedId && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCopyDialog(true)}>
              <Copy className="mr-2 h-4 w-4" />
              Copy From
            </Button>
            <Button
              size="sm"
              onClick={handleSaveTimetable}
              disabled={isSaving || isPending || !hasUnsavedChanges}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Timetable
            </Button>
          </div>
        )}
      </div>

      {/* Class/Batch Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium">
                {isSchool ? "Class" : "Batch"}
              </label>
              <Select
                value={selectedId}
                onValueChange={(val) => {
                  if (val) {
                    if (isSchool) setSelectedClassId(val);
                    else setSelectedBatchId(val);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${isSchool ? "class" : "batch"}`} />
                </SelectTrigger>
                <SelectContent>
                  {isSchool
                    ? classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}{cls.section ? ` - ${cls.section}` : ""}
                        </SelectItem>
                      ))
                    : batches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>

            {selectedId && (
              <Button variant="outline" onClick={() => openAddDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Period
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timetable Grid */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : selectedId ? (
        <>
          {/* Desktop Grid View */}
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <div className="min-w-[800px]">
                    <div className="grid grid-cols-6 border-b">
                      {DAYS.map((day) => (
                        <div
                          key={day.value}
                          className={cn(
                            "border-r p-3 text-center text-sm font-semibold last:border-r-0",
                            day.value === todayDay && "bg-primary/5 text-primary"
                          )}
                        >
                          {day.label}
                          {day.value === todayDay && (
                            <Badge variant="outline" className="ml-2 text-[10px]">Today</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-6">
                      {DAYS.map((day) => (
                        <div key={day.value} className="min-h-[200px] border-r p-2 last:border-r-0 space-y-1.5">
                          {entriesByDay[day.value]?.map((entry, idx) => {
                            const globalIdx = entries.indexOf(entry);
                            return (
                              <div
                                key={idx}
                                className={cn(
                                  "group cursor-pointer rounded-lg border p-2 transition-all hover:shadow-md",
                                  getSubjectColor(entry.subjectId)
                                )}
                                onClick={() => openEditDialog(entry, globalIdx)}
                              >
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-bold">{entry.subjectName}</p>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteEntry(globalIdx);
                                    }}
                                    className="hidden rounded p-0.5 hover:bg-white/50 group-hover:block"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                                <p className="mt-0.5 text-[10px] opacity-80">{entry.teacherName}</p>
                                <div className="mt-1 flex items-center gap-1 text-[10px] opacity-70">
                                  <Clock className="h-2.5 w-2.5" />
                                  {entry.startTime} - {entry.endTime}
                                </div>
                                {entry.room && (
                                  <p className="mt-0.5 text-[10px] opacity-70">Room: {entry.room}</p>
                                )}
                              </div>
                            );
                          })}
                          <button
                            onClick={() => openAddDialog(day.value)}
                            className="flex w-full items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 p-2 text-xs text-muted-foreground/40 transition-colors hover:border-primary/30 hover:text-primary/50"
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Card View */}
          <div className="space-y-4 md:hidden">
            {DAYS.map((day) => (
              <Card key={day.value} className={cn(day.value === todayDay && "ring-2 ring-primary/30")}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    {day.label}
                    {day.value === todayDay && (
                      <Badge variant="outline" className="text-[10px]">Today</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {entriesByDay[day.value]?.length ? (
                    entriesByDay[day.value].map((entry, idx) => {
                      const globalIdx = entries.indexOf(entry);
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-center justify-between rounded-lg border p-3",
                            getSubjectColor(entry.subjectId)
                          )}
                        >
                          <div>
                            <p className="text-sm font-bold">{entry.subjectName}</p>
                            <p className="text-xs opacity-80">{entry.teacherName}</p>
                            <p className="text-xs opacity-70">
                              {entry.startTime} - {entry.endTime}
                              {entry.room ? ` · Room: ${entry.room}` : ""}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openEditDialog(entry, globalIdx)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => handleDeleteEntry(globalIdx)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-xs text-muted-foreground py-4">No periods</p>
                  )}
                  <Button
                    variant="outline"
                    className="w-full"
                    size="sm"
                    onClick={() => openAddDialog(day.value)}
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    Add Period
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Status bar */}
          {hasUnsavedChanges && (
            <div className="sticky bottom-4 flex justify-end">
              <Button
                onClick={handleSaveTimetable}
                disabled={isSaving || isPending}
                size="lg"
                className="shadow-lg"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Timetable ({entries.length} periods)
              </Button>
            </div>
          )}
        </>
      ) : null}

      {/* Add/Edit Period Dialog */}
      <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? "Edit Period" : "Add Period"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Day</label>
              <Select
                value={String(formDayOfWeek)}
                onValueChange={(val) => val && setFormDayOfWeek(Number(val))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day) => (
                    <SelectItem key={day.value} value={String(day.value)}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Subject</label>
              <Select value={formSubjectId} onValueChange={(val) => val && setFormSubjectId(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} {s.code ? `(${s.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Teacher</label>
              <Select value={formTeacherId} onValueChange={(val) => val && setFormTeacherId(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {conflictWarning && (
              <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {conflictWarning}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Start Time</label>
                <Select value={formStartTime} onValueChange={(val) => val && setFormStartTime(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">End Time</label>
                <Select value={formEndTime} onValueChange={(val) => val && setFormEndTime(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Room (Optional)</label>
              <Input
                placeholder="e.g., Room 101"
                value={formRoom}
                onChange={(e) => setFormRoom(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEntryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEntry}>
              {editingEntry ? "Update" : "Add"} Period
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Copy Timetable Dialog */}
      <AlertDialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Copy Timetable</AlertDialogTitle>
            <AlertDialogDescription>
              Copy timetable from another {isSchool ? "class" : "batch"}. This will replace the current timetable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="mb-2 block text-sm font-medium">
              Copy from {isSchool ? "class" : "batch"}
            </label>
            <Select
              value={isSchool ? copyFromClassId : copyFromBatchId}
              onValueChange={(val) => {
                if (val) {
                  if (isSchool) setCopyFromClassId(val);
                  else setCopyFromBatchId(val);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select source ${isSchool ? "class" : "batch"}`} />
              </SelectTrigger>
              <SelectContent>
                {isSchool
                  ? classes
                      .filter((c) => c.id !== selectedClassId)
                      .map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}{cls.section ? ` - ${cls.section}` : ""}
                        </SelectItem>
                      ))
                  : batches
                      .filter((b) => b.id !== selectedBatchId)
                      .map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCopyTimetable}
              disabled={!copyFromClassId && !copyFromBatchId}
            >
              Copy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

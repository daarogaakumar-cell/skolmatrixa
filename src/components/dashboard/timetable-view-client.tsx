"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Clock, BookOpen, User, Settings, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTimetable, getTeacherTimetable, getTeachersForTimetable } from "@/actions/timetable";
import { getTeacherClassesAndBatches } from "@/actions/attendance";
import Link from "next/link";

interface TimetableViewClientProps {
  tenantType: string;
  userRole: string;
}

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

interface TimetableEntry {
  id: string;
  subjectId: string;
  subject: { id: string; name: string; code: string | null };
  teacherId: string;
  teacher: { id: string; name: string };
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
}

const DAYS = [
  { value: 1, label: "Monday", shortLabel: "Mon" },
  { value: 2, label: "Tuesday", shortLabel: "Tue" },
  { value: 3, label: "Wednesday", shortLabel: "Wed" },
  { value: 4, label: "Thursday", shortLabel: "Thu" },
  { value: 5, label: "Friday", shortLabel: "Fri" },
  { value: 6, label: "Saturday", shortLabel: "Sat" },
];

const SUBJECT_COLORS = [
  "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300",
  "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300",
  "bg-violet-50 border-violet-200 text-violet-800 dark:bg-violet-950/30 dark:border-violet-800 dark:text-violet-300",
  "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300",
  "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300",
  "bg-cyan-50 border-cyan-200 text-cyan-800 dark:bg-cyan-950/30 dark:border-cyan-800 dark:text-cyan-300",
  "bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-300",
  "bg-pink-50 border-pink-200 text-pink-800 dark:bg-pink-950/30 dark:border-pink-800 dark:text-pink-300",
];

export function TimetableViewClient({ tenantType, userRole }: TimetableViewClientProps) {
  const isSchool = tenantType === "SCHOOL";
  const isAdmin = userRole === "TENANT_ADMIN" || userRole === "VICE_ADMIN";
  const isTeacher = userRole === "TEACHER";

  const [activeTab, setActiveTab] = useState(isTeacher ? "my-timetable" : "by-class");
  const [isLoading, setIsLoading] = useState(false);

  // Options
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);

  // Selection
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  // Data
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [subjectColorMap, setSubjectColorMap] = useState<Record<string, string>>({});

  // Load options
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

  // Auto-load "My Timetable" for teachers
  useEffect(() => {
    if (isTeacher && activeTab === "my-timetable") {
      loadMyTimetable();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTeacher, activeTab]);

  const buildColorMap = (data: TimetableEntry[]) => {
    const colorMap: Record<string, string> = {};
    let colorIdx = 0;
    for (const entry of data) {
      if (!colorMap[entry.subjectId]) {
        colorMap[entry.subjectId] = SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length];
        colorIdx++;
      }
    }
    setSubjectColorMap(colorMap);
  };

  const getColor = (subjectId: string) => {
    return subjectColorMap[subjectId] || SUBJECT_COLORS[0];
  };

  // Load timetable by class/batch
  const loadClassTimetable = useCallback(async () => {
    const classId = isSchool ? selectedClassId : undefined;
    const batchId = !isSchool ? selectedBatchId : undefined;
    if (!classId && !batchId) return;

    setIsLoading(true);
    try {
      const result = await getTimetable(classId, batchId);
      if (result.success && result.data) {
        const data = result.data as TimetableEntry[];
        setEntries(data);
        buildColorMap(data);
      }
    } catch {} finally {
      setIsLoading(false);
    }
  }, [isSchool, selectedClassId, selectedBatchId]);

  useEffect(() => {
    if (activeTab === "by-class" && ((isSchool && selectedClassId) || (!isSchool && selectedBatchId))) {
      loadClassTimetable();
    }
  }, [activeTab, selectedClassId, selectedBatchId, loadClassTimetable, isSchool]);

  // Load timetable by teacher
  const loadTeacherTimetable = useCallback(async () => {
    if (!selectedTeacherId) return;
    setIsLoading(true);
    try {
      const result = await getTeacherTimetable(selectedTeacherId);
      if (result.success && result.data) {
        const data = result.data as TimetableEntry[];
        setEntries(data);
        buildColorMap(data);
      }
    } catch {} finally {
      setIsLoading(false);
    }
  }, [selectedTeacherId]);

  useEffect(() => {
    if (activeTab === "by-teacher" && selectedTeacherId) {
      loadTeacherTimetable();
    }
  }, [activeTab, selectedTeacherId, loadTeacherTimetable]);

  // My timetable
  const loadMyTimetable = async () => {
    setIsLoading(true);
    try {
      const result = await getTeacherTimetable();
      if (result.success && result.data) {
        const data = result.data as TimetableEntry[];
        setEntries(data);
        buildColorMap(data);
      }
    } catch {} finally {
      setIsLoading(false);
    }
  };

  // Group entries by day
  const entriesByDay: Record<number, TimetableEntry[]> = {};
  for (const day of DAYS) {
    entriesByDay[day.value] = entries
      .filter((e) => e.dayOfWeek === day.value)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  // Today's day (1=Mon, 7=Sun)
  const jsDay = new Date().getDay();
  const todayDay = jsDay === 0 ? 7 : jsDay;

  // Determine current period
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const handlePrint = () => {
    window.print();
  };

  const renderGrid = () => {
    if (isLoading) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      );
    }

    if (entries.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No timetable found</p>
            {isAdmin && (
              <Button variant="outline" size="sm" className="mt-3" nativeButton={false} render={<Link href="/dashboard/timetable/manage" />}>
                Create Timetable
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        {/* Desktop Grid */}
        <div className="hidden md:block print:block">
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
                        <span className="hidden sm:inline">{day.label}</span>
                        <span className="sm:hidden">{day.shortLabel}</span>
                        {day.value === todayDay && (
                          <Badge variant="outline" className="ml-2 text-[10px] print:hidden">Today</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-6">
                    {DAYS.map((day) => (
                      <div key={day.value} className="min-h-[200px] border-r p-2 last:border-r-0 space-y-1.5">
                        {entriesByDay[day.value]?.map((entry, idx) => {
                          const isCurrent =
                            day.value === todayDay &&
                            currentTime >= entry.startTime &&
                            currentTime <= entry.endTime;
                          return (
                            <div
                              key={idx}
                              className={cn(
                                "rounded-lg border p-2 transition-all",
                                getColor(entry.subjectId),
                                isCurrent && "ring-2 ring-primary shadow-md"
                              )}
                            >
                              <p className="text-xs font-bold">{entry.subject.name}</p>
                              <p className="mt-0.5 text-[10px] opacity-80">{entry.teacher.name}</p>
                              <div className="mt-1 flex items-center gap-1 text-[10px] opacity-70">
                                <Clock className="h-2.5 w-2.5" />
                                {entry.startTime} - {entry.endTime}
                              </div>
                              {entry.room && (
                                <p className="mt-0.5 text-[10px] opacity-70">Room: {entry.room}</p>
                              )}
                              {isCurrent && (
                                <Badge className="mt-1 text-[9px] px-1 py-0 print:hidden" variant="default">
                                  Now
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                        {entriesByDay[day.value]?.length === 0 && (
                          <p className="py-8 text-center text-xs text-muted-foreground/40">—</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile cards */}
        <div className="space-y-4 md:hidden print:hidden">
          {DAYS.map((day) => {
            const dayEntries = entriesByDay[day.value];
            if (!dayEntries?.length) return null;
            return (
              <Card key={day.value} className={cn(day.value === todayDay && "ring-2 ring-primary/30")}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    {day.label}
                    {day.value === todayDay && <Badge variant="outline" className="text-[10px]">Today</Badge>}
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      {dayEntries.length} period{dayEntries.length !== 1 ? "s" : ""}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dayEntries.map((entry, idx) => {
                    const isCurrent =
                      day.value === todayDay &&
                      currentTime >= entry.startTime &&
                      currentTime <= entry.endTime;
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "rounded-lg border p-3",
                          getColor(entry.subjectId),
                          isCurrent && "ring-2 ring-primary shadow-md"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-bold">{entry.subject.name}</p>
                            <p className="text-xs opacity-80">{entry.teacher.name}</p>
                          </div>
                          {isCurrent && <Badge variant="default" className="text-[10px]">Now</Badge>}
                        </div>
                        <p className="mt-1 text-xs opacity-70">
                          {entry.startTime} - {entry.endTime}
                          {entry.room ? ` · Room: ${entry.room}` : ""}
                        </p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Timetable</h1>
          <p className="text-sm text-muted-foreground">
            View weekly schedule for {isSchool ? "classes" : "batches"} and teachers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          {isAdmin && (
            <Button size="sm" nativeButton={false} render={<Link href="/dashboard/timetable/manage" />}>
              <Settings className="mr-2 h-4 w-4" />
              Manage
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setEntries([]); }} className="print:hidden">
        <TabsList>
          <TabsTrigger value="by-class">By {isSchool ? "Class" : "Batch"}</TabsTrigger>
          <TabsTrigger value="by-teacher">By Teacher</TabsTrigger>
          {(isTeacher || isAdmin) && <TabsTrigger value="my-timetable">My Timetable</TabsTrigger>}
        </TabsList>

        <TabsContent value="by-class" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1">
                  <Select
                    value={isSchool ? selectedClassId : selectedBatchId}
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
              </div>
            </CardContent>
          </Card>

          {(isSchool ? selectedClassId : selectedBatchId) && renderGrid()}
        </TabsContent>

        <TabsContent value="by-teacher" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1">
                  <Select
                    value={selectedTeacherId}
                    onValueChange={(val) => val && setSelectedTeacherId(val)}
                  >
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
              </div>
            </CardContent>
          </Card>

          {selectedTeacherId && renderGrid()}
        </TabsContent>

        <TabsContent value="my-timetable" className="space-y-4 mt-4">
          {renderGrid()}
        </TabsContent>
      </Tabs>

      {/* Print view (always shows grid) */}
      <div className="hidden print:block">{renderGrid()}</div>
    </div>
  );
}

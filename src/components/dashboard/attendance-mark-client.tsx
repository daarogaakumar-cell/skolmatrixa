"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Check,
  Loader2,
  Save,
  Users,
  UserCheck,
  UserX,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  getStudentsForAttendance,
  getAttendanceByDate,
  markAttendance,
  getTeacherClassesAndBatches,
} from "@/actions/attendance";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "EXCUSED";

interface Student {
  id: string;
  name: string;
  rollNo: string | null;
  admissionNo: string;
  photoUrl: string | null;
}

interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  remarks: string;
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

interface AttendanceMarkClientProps {
  tenantType: string;
  userRole: string;
}

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; color: string; bgColor: string; icon: React.ComponentType<{ className?: string }> }
> = {
  PRESENT: {
    label: "Present",
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  ABSENT: {
    label: "Absent",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/60 border-red-200 dark:border-red-800",
    icon: UserX,
  },
  LATE: {
    label: "Late",
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 border-amber-200 dark:border-amber-800",
    icon: Clock,
  },
  HALF_DAY: {
    label: "Half Day",
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-950/60 border-orange-200 dark:border-orange-800",
    icon: AlertCircle,
  },
  EXCUSED: {
    label: "Excused",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/60 border-blue-200 dark:border-blue-800",
    icon: Check,
  },
};

export function AttendanceMarkClient({ tenantType, userRole }: AttendanceMarkClientProps) {
  const isSchool = tenantType === "SCHOOL";
  const [isPending, startTransition] = useTransition();

  // Selection state
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Student & attendance state
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load classes/batches on mount
  useEffect(() => {
    async function load() {
      const result = await getTeacherClassesAndBatches();
      if (result.success && result.data) {
        setClasses((result.data as { classes: ClassOption[]; batches: BatchOption[] }).classes);
        setBatches((result.data as { classes: ClassOption[]; batches: BatchOption[] }).batches);
      }
    }
    load();
  }, []);

  // Load students and attendance when class/batch or date changes
  const loadStudentsAndAttendance = useCallback(async () => {
    const classId = isSchool ? selectedClassId : undefined;
    const batchId = !isSchool ? selectedBatchId : undefined;

    if (!classId && !batchId) return;

    setIsLoading(true);
    try {
      const [studentsResult, attendanceResult] = await Promise.all([
        getStudentsForAttendance(classId, batchId),
        getAttendanceByDate(classId, batchId, selectedDate.toISOString()),
      ]);

      if (studentsResult.success && studentsResult.data) {
        setStudents(studentsResult.data as Student[]);
      }

      const existingRecords: Record<string, AttendanceRecord> = {};
      const attendanceData = attendanceResult.success ? (attendanceResult.data as Array<{ studentId: string; status: AttendanceStatus; remarks: string | null }>) : [];

      if (attendanceData.length > 0) {
        setIsEditMode(true);
        for (const record of attendanceData) {
          existingRecords[record.studentId] = {
            studentId: record.studentId,
            status: record.status,
            remarks: record.remarks || "",
          };
        }
      } else {
        setIsEditMode(false);
      }

      // Default all students to PRESENT if no existing records
      if (studentsResult.success && studentsResult.data) {
        for (const student of studentsResult.data as Student[]) {
          if (!existingRecords[student.id]) {
            existingRecords[student.id] = {
              studentId: student.id,
              status: "PRESENT",
              remarks: "",
            };
          }
        }
      }

      setRecords(existingRecords);
      setHasUnsavedChanges(false);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [isSchool, selectedClassId, selectedBatchId, selectedDate]);

  useEffect(() => {
    if ((isSchool && selectedClassId) || (!isSchool && selectedBatchId)) {
      loadStudentsAndAttendance();
    }
  }, [selectedClassId, selectedBatchId, selectedDate, loadStudentsAndAttendance, isSchool]);

  // Update a student's status
  const updateStatus = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        studentId,
        status,
      },
    }));
    setHasUnsavedChanges(true);
  };

  // Update a student's remarks
  const updateRemarks = (studentId: string, remarks: string) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        studentId,
        remarks,
      },
    }));
    setHasUnsavedChanges(true);
  };

  // Bulk actions
  const markAll = (status: AttendanceStatus) => {
    const newRecords: Record<string, AttendanceRecord> = {};
    for (const student of students) {
      newRecords[student.id] = {
        studentId: student.id,
        status,
        remarks: records[student.id]?.remarks || "",
      };
    }
    setRecords(newRecords);
    setHasUnsavedChanges(true);
  };

  // Save attendance
  const handleSave = () => {
    startTransition(async () => {
      setIsSaving(true);
      try {
        const attendanceRecords = Object.values(records).map((r) => ({
          studentId: r.studentId,
          status: r.status,
          remarks: r.remarks || undefined,
        }));

        const result = await markAttendance({
          classId: isSchool ? selectedClassId : undefined,
          batchId: !isSchool ? selectedBatchId : undefined,
          date: selectedDate.toISOString(),
          records: attendanceRecords,
        });

        if (result.success) {
          toast.success(result.message || "Attendance saved successfully");
          setHasUnsavedChanges(false);
          setIsEditMode(true);
        } else {
          toast.error(result.error || "Failed to save attendance");
        }
      } catch {
        toast.error("An error occurred while saving");
      } finally {
        setIsSaving(false);
      }
    });
  };

  // Stats
  const statCounts = {
    present: Object.values(records).filter((r) => r.status === "PRESENT").length,
    absent: Object.values(records).filter((r) => r.status === "ABSENT").length,
    late: Object.values(records).filter((r) => r.status === "LATE").length,
    halfDay: Object.values(records).filter((r) => r.status === "HALF_DAY").length,
    excused: Object.values(records).filter((r) => r.status === "EXCUSED").length,
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mark Attendance</h1>
          <p className="text-sm text-muted-foreground">
            Select a {isSchool ? "class" : "batch"} and date to mark attendance
          </p>
        </div>
        {isEditMode && (
          <Badge variant="outline" className="w-fit border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
            <AlertCircle className="mr-1 h-3 w-3" />
            Editing existing attendance
          </Badge>
        )}
      </div>

      {/* Selection Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {/* Class/Batch Selector */}
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium">
                {isSchool ? "Class" : "Batch"}
              </label>
              <Select
                value={isSchool ? selectedClassId : selectedBatchId}
                onValueChange={(val) => {
                  if (val) {
                    if (isSchool) setSelectedClassId(val);
                    else setSelectedBatchId(val);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={`Select ${isSchool ? "class" : "batch"}`} />
                </SelectTrigger>
                <SelectContent>
                  {isSchool
                    ? classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}{cls.section ? ` - ${cls.section}` : ""}
                        </SelectItem>
                      ))
                    : batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.name}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Picker */}
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium">Date</label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    />
                  }
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setIsCalendarOpen(false);
                      }
                    }}
                    disabled={(date) => date > today}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAll("PRESENT")}
                disabled={students.length === 0 || isLoading}
                className="text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
              >
                <UserCheck className="mr-1 h-4 w-4" />
                All Present
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAll("ABSENT")}
                disabled={students.length === 0 || isLoading}
                className="text-red-700 hover:text-red-800 dark:text-red-400"
              >
                <UserX className="mr-1 h-4 w-4" />
                All Absent
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      {students.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(Object.entries(statCounts) as [string, number][]).map(([key, count]) => {
            const statusKey = key === "halfDay" ? "HALF_DAY" : key.toUpperCase();
            const config = STATUS_CONFIG[statusKey as AttendanceStatus];
            if (!config) return null;
            return (
              <Card key={key} className="overflow-hidden">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className={cn("rounded-lg p-2", config.bgColor.split(" ")[0])}>
                    <config.icon className={cn("h-4 w-4", config.color)} />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{config.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Student Attendance Grid */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : students.length > 0 ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base">
              <Users className="mr-2 inline h-4 w-4" />
              {students.length} Students
            </CardTitle>
            {hasUnsavedChanges && (
              <Badge variant="outline" className="border-orange-300 text-orange-700 dark:text-orange-400">
                Unsaved changes
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="w-[340px]">Status</TableHead>
                    <TableHead className="hidden w-48 lg:table-cell">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, idx) => {
                    const record = records[student.id];
                    const currentStatus = record?.status || "PRESENT";
                    return (
                      <TableRow key={student.id} className="group">
                        <TableCell className="text-center text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={student.photoUrl || ""} />
                              <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                                {student.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{student.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {student.rollNo ? `Roll: ${student.rollNo}` : student.admissionNo}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((status) => {
                              const config = STATUS_CONFIG[status];
                              const isActive = currentStatus === status;
                              return (
                                <button
                                  key={status}
                                  onClick={() => updateStatus(student.id, status)}
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-all",
                                    isActive
                                      ? config.bgColor
                                      : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                                  )}
                                >
                                  {isActive && <config.icon className="h-3 w-3" />}
                                  {config.label}
                                </button>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Input
                            placeholder="Optional remarks..."
                            value={record?.remarks || ""}
                            onChange={(e) => updateRemarks(student.id, e.target.value)}
                            className="h-8 text-xs"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (selectedClassId || selectedBatchId) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-lg font-medium text-muted-foreground">No students found</p>
            <p className="text-sm text-muted-foreground">
              No active students in the selected {isSchool ? "class" : "batch"}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* Save Button */}
      {students.length > 0 && (
        <div className="sticky bottom-4 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving || isPending || !hasUnsavedChanges}
            size="lg"
            className="shadow-lg"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isEditMode ? "Update Attendance" : "Save Attendance"}
          </Button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Download,
  Loader2,
  BarChart3,
  CalendarDays,
  TableIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, getDaysInMonth } from "date-fns";
import {
  getAttendanceReport,
  getAttendanceSummary,
  getStudentAttendance,
  getTeacherClassesAndBatches,
} from "@/actions/attendance";

interface ClassOption {
  id: string;
  name: string;
  section: string | null;
}

interface BatchOption {
  id: string;
  name: string;
}

interface AttendanceReportsClientProps {
  tenantType: string;
}

const STATUS_ABBREV: Record<string, { label: string; color: string }> = {
  PRESENT: { label: "P", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  ABSENT: { label: "A", color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
  LATE: { label: "L", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  HALF_DAY: { label: "H", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300" },
  EXCUSED: { label: "E", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
};

export function AttendanceReportsClient({ tenantType }: AttendanceReportsClientProps) {
  const isSchool = tenantType === "SCHOOL";
  const [activeTab, setActiveTab] = useState("daily");

  // Options
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");

  // Month picker
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Loading
  const [isLoading, setIsLoading] = useState(false);

  // Data
  const [dailyReport, setDailyReport] = useState<{
    students: Array<{ id: string; name: string; rollNo: string | null; admissionNo: string }>;
    dates: string[];
    attendanceMap: Record<string, Record<string, string>>;
  } | null>(null);

  const [summaryData, setSummaryData] = useState<
    Array<{
      studentId: string;
      studentName: string;
      rollNo: string | null;
      present: number;
      absent: number;
      late: number;
      halfDay: number;
      excused: number;
      total: number;
      percentage: number;
    }>
  >([]);

  // Student calendar view
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [studentCalendarData, setStudentCalendarData] = useState<{
    records: Array<{ date: string; status: string; remarks: string | null }>;
    summary: { present: number; absent: number; late: number; halfDay: number; excused: number; total: number; percentage: number };
  } | null>(null);

  // Load classes/batches
  useEffect(() => {
    async function load() {
      const result = await getTeacherClassesAndBatches();
      if (result.success && result.data) {
        const d = result.data as { classes: ClassOption[]; batches: BatchOption[] };
        setClasses(d.classes);
        setBatches(d.batches);
      }
    }
    load();
  }, []);

  // Load daily report
  const loadDailyReport = useCallback(async () => {
    const classId = isSchool ? selectedClassId : undefined;
    const batchId = !isSchool ? selectedBatchId : undefined;
    if (!classId && !batchId) return;

    setIsLoading(true);
    try {
      const start = new Date(selectedYear, selectedMonth - 1, 1);
      const end = endOfMonth(start);
      const result = await getAttendanceReport({
        classId,
        batchId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });
      if (result.success && result.data) {
        setDailyReport(result.data as typeof dailyReport);
      }
    } catch {
      toast.error("Failed to load report");
    } finally {
      setIsLoading(false);
    }
  }, [isSchool, selectedClassId, selectedBatchId, selectedMonth, selectedYear]);

  // Load summary
  const loadSummary = useCallback(async () => {
    const classId = isSchool ? selectedClassId : undefined;
    const batchId = !isSchool ? selectedBatchId : undefined;
    if (!classId && !batchId) return;

    setIsLoading(true);
    try {
      const result = await getAttendanceSummary({
        classId,
        batchId,
        month: selectedMonth,
        year: selectedYear,
      });
      if (result.success && result.data) {
        setSummaryData(result.data as typeof summaryData);
      }
    } catch {
      toast.error("Failed to load summary");
    } finally {
      setIsLoading(false);
    }
  }, [isSchool, selectedClassId, selectedBatchId, selectedMonth, selectedYear]);

  // Load student calendar
  const loadStudentCalendar = useCallback(async () => {
    if (!selectedStudentId) return;

    setIsLoading(true);
    try {
      const result = await getStudentAttendance(selectedStudentId, selectedMonth, selectedYear);
      if (result.success && result.data) {
        setStudentCalendarData(result.data as typeof studentCalendarData);
      }
    } catch {
      toast.error("Failed to load student attendance");
    } finally {
      setIsLoading(false);
    }
  }, [selectedStudentId, selectedMonth, selectedYear]);

  // Reload data on tab/filter change
  useEffect(() => {
    if (activeTab === "daily") loadDailyReport();
    else if (activeTab === "summary") loadSummary();
    else if (activeTab === "calendar") loadStudentCalendar();
  }, [activeTab, loadDailyReport, loadSummary, loadStudentCalendar]);

  // Export CSV helper
  const exportCSV = () => {
    if (activeTab === "summary" && summaryData.length > 0) {
      const headers = ["Name", "Roll No", "Present", "Absent", "Late", "Half Day", "Excused", "Total", "Percentage"];
      const rows = summaryData.map((s) => [
        s.studentName,
        s.rollNo || "",
        s.present,
        s.absent,
        s.late,
        s.halfDay,
        s.excused,
        s.total,
        `${s.percentage}%`,
      ]);
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-summary-${selectedMonth}-${selectedYear}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Month navigation
  const prevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };
  const nextMonth = () => {
    const now = new Date();
    const nextM = selectedMonth === 12 ? 1 : selectedMonth + 1;
    const nextY = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
    if (new Date(nextY, nextM - 1) > now) return; // Can't go to future
    setSelectedMonth(nextM);
    setSelectedYear(nextY);
  };

  const monthName = format(new Date(selectedYear, selectedMonth - 1), "MMMM yyyy");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance Reports</h1>
          <p className="text-sm text-muted-foreground">
            View and analyze attendance data across classes and months
          </p>
        </div>
        {activeTab === "summary" && summaryData.length > 0 && (
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Filters Row */}
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

            {/* Student Selector (Only for Calendar Tab) */}
            {activeTab === "calendar" && dailyReport?.students && (
              <div className="flex-1">
                <label className="mb-2 block text-sm font-medium">Student</label>
                <Select value={selectedStudentId} onValueChange={(val) => val && setSelectedStudentId(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {dailyReport.students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} {s.rollNo ? `(${s.rollNo})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Month Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[140px] text-center text-sm font-medium">{monthName}</div>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily" className="gap-2">
            <TableIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Daily Report</span>
            <span className="sm:hidden">Daily</span>
          </TabsTrigger>
          <TabsTrigger value="summary" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Monthly Summary</span>
            <span className="sm:hidden">Summary</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Student Calendar</span>
            <span className="sm:hidden">Calendar</span>
          </TabsTrigger>
        </TabsList>

        {/* Daily Report Tab */}
        <TabsContent value="daily">
          {isLoading ? (
            <LoadingCard />
          ) : dailyReport && dailyReport.students.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="sticky left-0 z-10 bg-muted/50 min-w-[160px]">Student</TableHead>
                        {dailyReport.dates.map((date) => (
                          <TableHead key={date} className="min-w-[40px] text-center text-xs whitespace-nowrap">
                            {new Date(date).getDate()}
                          </TableHead>
                        ))}
                        <TableHead className="min-w-[60px] text-center">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyReport.students.map((student) => {
                        const studentAttendance = dailyReport.attendanceMap[student.id] || {};
                        let present = 0;
                        let total = 0;
                        for (const date of dailyReport.dates) {
                          const status = studentAttendance[date];
                          if (status) {
                            total++;
                            if (status === "PRESENT" || status === "LATE") present++;
                            if (status === "HALF_DAY") present += 0.5;
                          }
                        }
                        const pct = total > 0 ? Math.round((present / total) * 100) : 0;
                        return (
                          <TableRow key={student.id}>
                            <TableCell className="sticky left-0 z-10 bg-card font-medium">
                              <div>
                                <p className="text-sm">{student.name}</p>
                                <p className="text-xs text-muted-foreground">{student.rollNo || student.admissionNo}</p>
                              </div>
                            </TableCell>
                            {dailyReport.dates.map((date) => {
                              const status = studentAttendance[date];
                              const config = status ? STATUS_ABBREV[status] : null;
                              return (
                                <TableCell key={date} className="p-1 text-center">
                                  {config ? (
                                    <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold", config.color)}>
                                      {config.label}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground/30">-</span>
                                  )}
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  pct >= 90
                                    ? "border-emerald-200 text-emerald-700 dark:text-emerald-400"
                                    : pct >= 75
                                    ? "border-amber-200 text-amber-700 dark:text-amber-400"
                                    : "border-red-200 text-red-700 dark:text-red-400"
                                )}
                              >
                                {pct}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <EmptyCard message={`Select a ${isSchool ? "class" : "batch"} to view daily attendance`} />
          )}
        </TabsContent>

        {/* Monthly Summary Tab */}
        <TabsContent value="summary">
          {isLoading ? (
            <LoadingCard />
          ) : summaryData.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Student</TableHead>
                        <TableHead className="text-center">Roll No</TableHead>
                        <TableHead className="text-center text-emerald-700">Present</TableHead>
                        <TableHead className="text-center text-red-700">Absent</TableHead>
                        <TableHead className="text-center text-amber-700">Late</TableHead>
                        <TableHead className="hidden text-center text-orange-700 sm:table-cell">Half Day</TableHead>
                        <TableHead className="hidden text-center text-blue-700 sm:table-cell">Excused</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summaryData
                        .sort((a, b) => b.percentage - a.percentage)
                        .map((student) => (
                          <TableRow key={student.studentId}>
                            <TableCell className="font-medium">{student.studentName}</TableCell>
                            <TableCell className="text-center text-muted-foreground">
                              {student.rollNo || "—"}
                            </TableCell>
                            <TableCell className="text-center">{student.present}</TableCell>
                            <TableCell className="text-center">{student.absent}</TableCell>
                            <TableCell className="text-center">{student.late}</TableCell>
                            <TableCell className="hidden text-center sm:table-cell">{student.halfDay}</TableCell>
                            <TableCell className="hidden text-center sm:table-cell">{student.excused}</TableCell>
                            <TableCell className="text-center">{student.total}</TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  student.percentage >= 90
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                                    : student.percentage >= 75
                                    ? "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                                    : "border-red-200 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                                )}
                              >
                                {student.percentage}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <EmptyCard message={`Select a ${isSchool ? "class" : "batch"} to view monthly summary`} />
          )}
        </TabsContent>

        {/* Student Calendar Tab */}
        <TabsContent value="calendar">
          {isLoading ? (
            <LoadingCard />
          ) : studentCalendarData ? (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Calendar Grid */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">
                    Attendance Calendar — {monthName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CalendarGrid
                    month={selectedMonth}
                    year={selectedYear}
                    records={studentCalendarData.records}
                  />
                </CardContent>
              </Card>

              {/* Summary Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Monthly Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold">
                      {studentCalendarData.summary.percentage}%
                    </p>
                    <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  </div>
                  <div className="space-y-3">
                    <StatRow label="Present" value={studentCalendarData.summary.present} color="bg-emerald-500" />
                    <StatRow label="Absent" value={studentCalendarData.summary.absent} color="bg-red-500" />
                    <StatRow label="Late" value={studentCalendarData.summary.late} color="bg-amber-500" />
                    <StatRow label="Half Day" value={studentCalendarData.summary.halfDay} color="bg-orange-500" />
                    <StatRow label="Excused" value={studentCalendarData.summary.excused} color="bg-blue-500" />
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Days</span>
                      <span className="font-medium">{studentCalendarData.summary.total}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <EmptyCard message="Select a student to view their attendance calendar" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ==================== Sub Components ====================

function LoadingCard() {
  return (
    <Card>
      <CardContent className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={cn("h-3 w-3 rounded-full", color)} />
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function CalendarGrid({
  month,
  year,
  records,
}: {
  month: number;
  year: number;
  records: Array<{ date: string; status: string; remarks: string | null }>;
}) {
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0 = Sunday

  const statusColors: Record<string, string> = {
    PRESENT: "bg-emerald-500 text-white",
    ABSENT: "bg-red-500 text-white",
    LATE: "bg-amber-500 text-white",
    HALF_DAY: "bg-orange-500 text-white",
    EXCUSED: "bg-blue-500 text-white",
  };

  const recordMap: Record<string, string> = {};
  for (const r of records) {
    recordMap[r.date] = r.status;
  }

  const days = [];
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Fill empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />);
  }

  // Fill days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const status = recordMap[dateStr];
    const colorClass = status ? statusColors[status] || "bg-muted" : "bg-muted/30";
    const isToday =
      d === new Date().getDate() &&
      month === new Date().getMonth() + 1 &&
      year === new Date().getFullYear();

    days.push(
      <div
        key={d}
        className={cn(
          "flex aspect-square items-center justify-center rounded-lg text-sm font-medium transition-all",
          colorClass,
          isToday && "ring-2 ring-primary ring-offset-2"
        )}
        title={status ? `${dateStr}: ${status}` : dateStr}
      >
        {d}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1">
        {dayLabels.map((label) => (
          <div key={label} className="text-center text-xs font-medium text-muted-foreground">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">{days}</div>
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3">
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={cn("h-3 w-3 rounded", color)} />
            <span className="text-xs text-muted-foreground">
              {status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

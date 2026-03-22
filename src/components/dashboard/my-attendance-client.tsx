"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { getMyAttendance, getParentChildren } from "@/actions/portal";

interface MyAttendanceClientProps {
  userRole: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  PRESENT: { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", label: "Present" },
  ABSENT: { bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-300", label: "Absent" },
  LATE: { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300", label: "Late" },
  HALF_DAY: { bg: "bg-orange-100 dark:bg-orange-900/40", text: "text-orange-700 dark:text-orange-300", label: "Half Day" },
  EXCUSED: { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300", label: "Excused" },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MyAttendanceClient({ userRole }: MyAttendanceClientProps) {
  const isParent = userRole === "PARENT";
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<Record<string, any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [children, setChildren] = useState<Record<string, any>[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");

  async function loadData() {
    setLoading(true);
    const result = await getMyAttendance(month, year, isParent ? selectedChild : undefined);
    if (result.success && result.data) setData(result.data);
    setLoading(false);
  }

  useEffect(() => {
    if (isParent) {
      getParentChildren().then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          setChildren(res.data);
          setSelectedChild(res.data[0].id);
        } else {
          setLoading(false);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isParent || selectedChild) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year, selectedChild]);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  }

  // Build calendar grid
  const currentDate = new Date(year, month - 1, 1);
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart); // 0 = Sunday

  const recordMap: Record<string, string> = {};
  if (data?.records) {
    data.records.forEach((r: Record<string, string>) => { recordMap[r.date] = r.status; });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Attendance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track your attendance record</p>
        </div>
        {isParent && children.length > 1 && (
          <Select value={selectedChild} onValueChange={(val) => val && setSelectedChild(val)}>
            <SelectTrigger className="w-60">
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              {children.map((c: Record<string, any>) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                <SelectItem key={c.id} value={c.id}>
                  {c.name} — {c.class?.name || c.batch?.name || ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          {data?.summary && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-950/30">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Present</p>
                    <p className="text-xl font-bold">{data.summary.present}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-lg bg-red-50 p-2 dark:bg-red-950/30">
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Absent</p>
                    <p className="text-xl font-bold">{data.summary.absent}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-950/30">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Late</p>
                    <p className="text-xl font-bold">{data.summary.late}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-950/30">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Excused</p>
                    <p className="text-xl font-bold">{data.summary.excused}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <span className="text-xs font-bold text-primary">{data.summary.percentage}%</span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Percentage</p>
                    <div className="mt-1 h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", data.summary.percentage >= 75 ? "bg-emerald-500" : data.summary.percentage >= 50 ? "bg-amber-500" : "bg-red-500")}
                        style={{ width: `${data.summary.percentage}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Calendar */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">
                {format(currentDate, "MMMM yyyy")}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {d}
                  </div>
                ))}
                {/* Empty cells before month start */}
                {Array.from({ length: startDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {days.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const status = recordMap[dateStr];
                  const statusStyle = status ? STATUS_COLORS[status] : null;
                  const isSun = getDay(day) === 0;

                  return (
                    <div
                      key={dateStr}
                      className={cn(
                        "relative flex flex-col items-center justify-center rounded-lg py-2 text-sm transition-colors",
                        statusStyle ? `${statusStyle.bg}` : "",
                        isToday(day) && "ring-2 ring-primary ring-offset-1",
                        isSun && !status && "text-muted-foreground/50"
                      )}
                    >
                      <span className={cn("font-medium", statusStyle?.text)}>
                        {format(day, "d")}
                      </span>
                      {status && (
                        <span className={cn("text-[8px] mt-0.5", statusStyle?.text)}>
                          {STATUS_COLORS[status]?.label?.slice(0, 1)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
                {Object.entries(STATUS_COLORS).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className={cn("h-3 w-3 rounded", val.bg)} />
                    <span className="text-xs text-muted-foreground">{val.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

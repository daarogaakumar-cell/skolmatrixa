"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Calendar,
  FileText,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  CalendarRange,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getExamDashboardStats } from "@/actions/exams";

interface ScheduleEntry {
  id: string;
  subject: string;
  subjectCode: string | null;
  className: string;
  startTime: string;
  endTime: string;
  room: string | null;
}

interface AttendanceStats {
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  notMarked: number;
}

interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  totalClasses: number;
  totalBatches: number;
  currentAcademicYear: string;
}

interface TeacherDashboardProps {
  stats: DashboardStats;
  tenantName: string;
  tenantType: string;
  userName: string;
  attendanceStats: AttendanceStats | null | undefined;
  todaySchedule: ScheduleEntry[] | null | undefined;
}

export function TeacherDashboardClient({
  stats,
  tenantName,
  tenantType,
  userName,
  attendanceStats,
  todaySchedule,
}: TeacherDashboardProps) {
  const firstName = userName.split(" ")[0];
  const isSchool = tenantType === "SCHOOL";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [examStats, setExamStats] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    getExamDashboardStats().then((res) => {
      if (res.success) setExamStats(res.data as Record<string, any>); // eslint-disable-line @typescript-eslint/no-explicit-any
    });
  }, []);

  const quickActions = [
    { label: "Mark Attendance", icon: ClipboardCheck, href: "/dashboard/attendance" },
    { label: "View Students", icon: GraduationCap, href: "/dashboard/students" },
    { label: isSchool ? "My Classes" : "My Batches", icon: BookOpen, href: isSchool ? "/dashboard/classes" : "/dashboard/batches" },
    { label: "Homework", icon: FileText, href: "/dashboard/homework" },
    { label: "Exams", icon: Award, href: "/dashboard/exams" },
    { label: "Apply Leave", icon: CalendarRange, href: "/dashboard/leaves" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, {firstName}</h1>
        <p className="text-sm text-muted-foreground">{tenantName} &middot; Teacher Dashboard</p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">My Students</CardTitle>
            <div className="rounded-lg p-2 bg-blue-50 dark:bg-blue-950/30">
              <GraduationCap className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
          </CardContent>
        </Card>
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{isSchool ? "Classes" : "Batches"}</CardTitle>
            <div className="rounded-lg p-2 bg-violet-50 dark:bg-violet-950/30">
              <BookOpen className="h-4 w-4 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isSchool ? stats.totalClasses : stats.totalBatches}</div>
          </CardContent>
        </Card>
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s Classes</CardTitle>
            <div className="rounded-lg p-2 bg-emerald-50 dark:bg-emerald-950/30">
              <Calendar className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySchedule?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Academic Year</CardTitle>
            <div className="rounded-lg p-2 bg-amber-50 dark:bg-amber-950/30">
              <Calendar className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{stats.currentAcademicYear || "—"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href}>
                <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4">
                  <action.icon className="h-5 w-5" />
                  <span className="text-xs">{action.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Today's Attendance */}
        {attendanceStats && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Today&apos;s Attendance</CardTitle>
              <Link href="/dashboard/attendance" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Mark Now</Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs text-muted-foreground">Present</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400">{attendanceStats.present}</p>
                </div>
                <div className="rounded-lg bg-red-50 p-3 dark:bg-red-950/30">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-xs text-muted-foreground">Absent</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-red-700 dark:text-red-400">{attendanceStats.absent}</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-xs text-muted-foreground">Late</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400">{attendanceStats.late}</p>
                </div>
                <div className="rounded-lg bg-primary/5 p-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Not Marked</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-primary">{attendanceStats.notMarked}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exam Stats */}
        {examStats && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Exams Overview</CardTitle>
              <Link href="/dashboard/exams" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>View All</Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
                  <span className="text-xs text-muted-foreground">Upcoming</span>
                  <p className="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-400">{examStats.upcoming || 0}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
                  <span className="text-xs text-muted-foreground">Completed</span>
                  <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400">{examStats.completed || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Today&apos;s Schedule</CardTitle>
          <Link href="/dashboard/timetable" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Full Timetable</Link>
        </CardHeader>
        <CardContent>
          {!todaySchedule || todaySchedule.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No classes scheduled today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todaySchedule.map((entry) => {
                const now = new Date();
                const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
                const isCurrent = currentTime >= entry.startTime && currentTime <= entry.endTime;
                const isPast = currentTime > entry.endTime;
                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 transition-all",
                      isCurrent && "border-primary bg-primary/5 shadow-sm",
                      isPast && "opacity-50"
                    )}
                  >
                    <div className="flex flex-col items-center text-xs min-w-14">
                      <span className="font-medium">{entry.startTime}</span>
                      <span className="text-muted-foreground">{entry.endTime}</span>
                    </div>
                    <div className="h-8 w-0.5 rounded-full bg-primary/20" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{entry.subject}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {entry.className}{entry.room ? ` · Room ${entry.room}` : ""}
                      </p>
                    </div>
                    {isCurrent && <Badge variant="default" className="text-[10px] shrink-0">Now</Badge>}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

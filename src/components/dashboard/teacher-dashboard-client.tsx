"use client";

import { useState, useEffect } from "react";
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
import { getExamDashboardStats } from "@/actions/exams";

import { DashboardHeader } from "./ui/dashboard-header";
import { MetricCard } from "./ui/metric-card";
import { QuickActionGrid } from "./ui/quick-action-grid";
import { SectionCard, EmptyState } from "./ui/section-card";
import { ScheduleTimeline } from "./ui/schedule-timeline";
import { MiniStat, AttendanceBar, ProgressRing } from "./ui/mini-stat";
import { DashboardShell } from "./ui/dashboard-shell";

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

  const attendancePercent =
    attendanceStats && attendanceStats.totalStudents > 0
      ? Math.round((attendanceStats.present / attendanceStats.totalStudents) * 100)
      : 0;

  return (
    <DashboardShell>
      {/* ── Header ── */}
      <DashboardHeader greeting={`Welcome back, ${firstName}`} subtitle={`${tenantName} · Teacher Dashboard`} />

      {/* ── Metric Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="My Students" value={stats.totalStudents} icon={GraduationCap} href="/dashboard/students" variant="blue" />
        <MetricCard
          title={isSchool ? "Classes" : "Batches"}
          value={isSchool ? stats.totalClasses : stats.totalBatches}
          icon={BookOpen}
          href={isSchool ? "/dashboard/classes" : "/dashboard/batches"}
          variant="violet"
        />
        <MetricCard title="Today's Classes" value={todaySchedule?.length || 0} icon={Calendar} variant="emerald" />
        <MetricCard title="Academic Year" value={stats.currentAcademicYear || "—"} icon={Calendar} href="/dashboard/settings" variant="amber" />
      </div>

      {/* ── Quick Actions ── */}
      <SectionCard title="Quick Actions">
        <QuickActionGrid actions={quickActions} />
      </SectionCard>

      {/* ── Attendance & Exams Row ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Today's Attendance */}
        {attendanceStats && (
          <SectionCard title="Today's Attendance" action={{ label: "Mark Now", href: "/dashboard/attendance" }}>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex items-center justify-center sm:pr-4">
                <ProgressRing percentage={attendancePercent} size={100} strokeWidth={8} label="Present" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <MiniStat icon={CheckCircle2} label="Present" value={attendanceStats.present} variant="emerald" />
                  <MiniStat icon={XCircle} label="Absent" value={attendanceStats.absent} variant="red" />
                  <MiniStat icon={Clock} label="Late" value={attendanceStats.late} variant="amber" />
                  <MiniStat icon={Users} label="Not Marked" value={attendanceStats.notMarked} variant="primary" />
                </div>
                <AttendanceBar percentage={attendancePercent} />
              </div>
            </div>
          </SectionCard>
        )}

        {/* Exam Stats */}
        {examStats && (
          <SectionCard title="Exams Overview" action={{ label: "View All", href: "/dashboard/exams" }}>
            <div className="grid grid-cols-2 gap-2.5">
              <MiniStat icon={Calendar} label="Upcoming" value={examStats.upcoming || 0} variant="blue" />
              <MiniStat icon={CheckCircle2} label="Completed" value={examStats.completed || 0} variant="emerald" />
            </div>
          </SectionCard>
        )}
      </div>

      {/* ── Today's Schedule ── */}
      <SectionCard title="Today's Schedule" action={{ label: "Full Timetable", href: "/dashboard/timetable" }}>
        {todaySchedule && todaySchedule.length > 0 ? (
          <ScheduleTimeline entries={todaySchedule} />
        ) : (
          <EmptyState icon={<Calendar className="h-10 w-10" />} message="No classes scheduled today" />
        )}
      </SectionCard>
    </DashboardShell>
  );
}

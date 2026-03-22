"use client";

import { useEffect, useState, useCallback } from "react";
import {
  applyLeave,
  reviewLeave,
  cancelLeave,
  getLeaveApplications,
  getLeaveBalances,
  getLeaveStats,
  getLeaveCalendarData,
  configureLeaveBalances,
  getParentChildren,
} from "@/actions/leaves";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
  Settings2,
  CalendarRange,
  AlertCircle,
} from "lucide-react";

const LEAVE_TYPE_MAP: Record<string, { label: string; color: string }> = {
  SICK: { label: "Sick Leave", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
  CASUAL: { label: "Casual Leave", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  EMERGENCY: { label: "Emergency", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  MEDICAL: { label: "Medical", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  OTHER: { label: "Other", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
};

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: "Pending", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: <Clock className="h-3 w-3" /> },
  APPROVED: { label: "Approved", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: <CheckCircle2 className="h-3 w-3" /> },
  REJECTED: { label: "Rejected", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400", icon: <XCircle className="h-3 w-3" /> },
  CANCELLED: { label: "Cancelled", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400", icon: <XCircle className="h-3 w-3" /> },
};

interface LeaveApplication {
  id: string;
  applicantName: string;
  applicantRole: string;
  applicantEmail: string;
  applicantType: string;
  studentName: string | null;
  studentAdmissionNo: string | null;
  studentClass: string | null;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
  reviewerName: string | null;
  reviewRemarks: string | null;
  reviewedAt: string | null;
  createdAt: string;
  isOwn: boolean;
}

export function LeavesClient({ userRole }: { userRole: string; userId: string }) {
  const [activeTab, setActiveTab] = useState("applications");
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [stats, setStats] = useState<{ pending: number; approved: number; rejected: number; total: number; todayOnLeave: number } | null>(null);
  const [balances, setBalances] = useState<{ leaveType: string; totalAllowed: number; used: number; remaining: number }[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Apply leave dialog
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applyForm, setApplyForm] = useState({ leaveType: "SICK", startDate: "", endDate: "", reason: "", studentId: "" });
  const [applying, setApplying] = useState(false);

  // Review dialog
  const [reviewingLeave, setReviewingLeave] = useState<LeaveApplication | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [reviewing, setReviewing] = useState(false);

  // Config dialog
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [configType, setConfigType] = useState("STAFF");
  const [configBalances, setConfigBalances] = useState([
    { leaveType: "SICK", totalAllowed: 10 },
    { leaveType: "CASUAL", totalAllowed: 8 },
    { leaveType: "EMERGENCY", totalAllowed: 5 },
    { leaveType: "MEDICAL", totalAllowed: 10 },
    { leaveType: "OTHER", totalAllowed: 3 },
  ]);
  const [saving, setSaving] = useState(false);

  // Calendar
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarData, setCalendarData] = useState<{ id: string; applicantName: string; leaveType: string; startDate: string; endDate: string }[]>([]);

  // Parent children
  const [children, setChildren] = useState<{ id: string; name: string; admissionNo: string }[]>([]);

  const isAdmin = ["TENANT_ADMIN", "VICE_ADMIN"].includes(userRole);
  const isTeacher = userRole === "TEACHER";
  const canApprove = isAdmin || isTeacher;
  const isParent = userRole === "PARENT";

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [leavesRes, statsRes, balancesRes] = await Promise.all([
        getLeaveApplications({ status: statusFilter, applicantType: typeFilter, page: pagination.page }),
        getLeaveStats(),
        getLeaveBalances(),
      ]);
      if (leavesRes.success && leavesRes.data) {
        setLeaves(leavesRes.data);
        if (leavesRes.pagination) setPagination(leavesRes.pagination);
      }
      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      if (balancesRes.success && balancesRes.data) setBalances(balancesRes.data);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, pagination.page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === "calendar") {
      getLeaveCalendarData(calendarMonth, calendarYear).then((res) => {
        if (res.success && res.data) setCalendarData(res.data);
      });
    }
  }, [activeTab, calendarMonth, calendarYear]);

  useEffect(() => {
    if (isParent) {
      getParentChildren().then((res) => {
        if (res.success && res.data) setChildren(res.data);
      });
    }
  }, [isParent]);

  const handleApplyLeave = async () => {
    if (!applyForm.startDate || !applyForm.endDate || !applyForm.reason.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    setApplying(true);
    try {
      const res = await applyLeave({
        leaveType: applyForm.leaveType,
        startDate: applyForm.startDate,
        endDate: applyForm.endDate,
        reason: applyForm.reason,
        studentId: applyForm.studentId || undefined,
      });
      if (res.success) {
        toast.success(res.message);
        setShowApplyDialog(false);
        setApplyForm({ leaveType: "SICK", startDate: "", endDate: "", reason: "", studentId: "" });
        loadData();
      } else {
        toast.error(res.error);
      }
    } finally {
      setApplying(false);
    }
  };

  const handleReview = async (status: "APPROVED" | "REJECTED") => {
    if (!reviewingLeave) return;
    setReviewing(true);
    try {
      const res = await reviewLeave({ leaveId: reviewingLeave.id, status, remarks: reviewRemarks });
      if (res.success) {
        toast.success(res.message);
        setReviewingLeave(null);
        setReviewRemarks("");
        loadData();
      } else {
        toast.error(res.error);
      }
    } finally {
      setReviewing(false);
    }
  };

  const handleCancel = async (leaveId: string) => {
    const res = await cancelLeave(leaveId);
    if (res.success) {
      toast.success(res.message);
      loadData();
    } else {
      toast.error(res.error);
    }
  };

  const handleConfigSave = async () => {
    setSaving(true);
    try {
      const res = await configureLeaveBalances({ applicantType: configType, balances: configBalances });
      if (res.success) {
        toast.success(res.message);
        setShowConfigDialog(false);
      } else {
        toast.error(res.error);
      }
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  // Calendar helpers
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();
  const monthName = new Date(calendarYear, calendarMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const getCalendarLeavesForDate = (day: number) => {
    const date = new Date(calendarYear, calendarMonth, day);
    return calendarData.filter((l) => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-sm text-muted-foreground">Apply, track, and manage leave applications</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => setShowConfigDialog(true)}>
              <Settings2 className="mr-1.5 h-3.5 w-3.5" />
              Configure
            </Button>
          )}
          <Button size="sm" onClick={() => setShowApplyDialog(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Apply Leave
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30"><Clock className="h-4 w-4 text-amber-600" /></div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30"><CheckCircle2 className="h-4 w-4 text-emerald-600" /></div>
                <div>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                  <p className="text-xs text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-rose-100 p-2 dark:bg-rose-900/30"><XCircle className="h-4 w-4 text-rose-600" /></div>
                <div>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                  <p className="text-xs text-muted-foreground">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/30"><CalendarDays className="h-4 w-4 text-indigo-600" /></div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30"><AlertCircle className="h-4 w-4 text-purple-600" /></div>
                <div>
                  <p className="text-2xl font-bold">{stats.todayOnLeave}</p>
                  <p className="text-xs text-muted-foreground">On Leave Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leave Balance Cards */}
      {balances.length > 0 && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {balances.map((b) => (
            <Card key={b.leaveType} className="overflow-hidden">
              <CardContent className="p-3">
                <p className="text-xs font-medium text-muted-foreground">{LEAVE_TYPE_MAP[b.leaveType]?.label || b.leaveType}</p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-lg font-bold">{b.remaining}</span>
                  <span className="text-xs text-muted-foreground">/ {b.totalAllowed}</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${b.totalAllowed > 0 ? Math.min((b.used / b.totalAllowed) * 100, 100) : 0}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">{b.used} used</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        {/* Applications List */}
        <TabsContent value="applications" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "ALL")}>
              <SelectTrigger className="w-35">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            {isAdmin && (
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "ALL")}>
                <SelectTrigger className="w-35">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Leave cards */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (<Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>))}
            </div>
          ) : leaves.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CalendarDays className="h-12 w-12 text-muted-foreground/40" />
                <p className="mt-4 text-sm text-muted-foreground">No leave applications found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {leaves.map((leave) => (
                <Card key={leave.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{leave.applicantName}</span>
                          <Badge variant="outline" className="text-[10px]">{leave.applicantRole.replace("_", " ")}</Badge>
                          <Badge className={`${LEAVE_TYPE_MAP[leave.leaveType]?.color || ""} border-0 text-[10px]`}>
                            {LEAVE_TYPE_MAP[leave.leaveType]?.label || leave.leaveType}
                          </Badge>
                          <Badge className={`${STATUS_MAP[leave.status]?.color || ""} border-0 text-[10px] gap-1`}>
                            {STATUS_MAP[leave.status]?.icon}
                            {STATUS_MAP[leave.status]?.label || leave.status}
                          </Badge>
                        </div>
                        {leave.studentName && (
                          <p className="text-xs text-muted-foreground">
                            Student: {leave.studentName} ({leave.studentAdmissionNo}) {leave.studentClass && `— ${leave.studentClass}`}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarRange className="h-3 w-3" />
                            {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                          </span>
                          <span>{leave.days} day{leave.days !== 1 ? "s" : ""}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{leave.reason}</p>
                        {leave.reviewerName && (
                          <p className="text-xs text-muted-foreground">
                            Reviewed by {leave.reviewerName}
                            {leave.reviewRemarks && ` — "${leave.reviewRemarks}"`}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 sm:flex-col">
                        {canApprove && leave.status === "PENDING" && !leave.isOwn && (
                          <Button size="sm" variant="outline" onClick={() => { setReviewingLeave(leave); setReviewRemarks(""); }}>
                            Review
                          </Button>
                        )}
                        {leave.isOwn && ["PENDING", "APPROVED"].includes(leave.status) && (
                          <Button size="sm" variant="ghost" className="text-rose-600 hover:text-rose-700" onClick={() => handleCancel(leave.id)}>
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => {
                  if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(calendarYear - 1); }
                  else setCalendarMonth(calendarMonth - 1);
                }}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-base">{monthName}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => {
                  if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(calendarYear + 1); }
                  else setCalendarMonth(calendarMonth + 1);
                }}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-muted">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="bg-card p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
                ))}
                {[...Array(firstDayOfMonth)].map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-20 bg-card p-1 sm:min-h-25" />
                ))}
                {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1;
                  const dayLeaves = getCalendarLeavesForDate(day);
                  const isToday = day === new Date().getDate() && calendarMonth === new Date().getMonth() && calendarYear === new Date().getFullYear();
                  return (
                    <div key={day} className={`min-h-20 bg-card p-1 sm:min-h-25 ${isToday ? "ring-2 ring-indigo-500 ring-inset" : ""}`}>
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${isToday ? "bg-indigo-500 text-white font-bold" : ""}`}>
                        {day}
                      </span>
                      <div className="mt-0.5 space-y-0.5">
                        {dayLeaves.slice(0, 2).map((l) => (
                          <div key={l.id} className={`truncate rounded px-1 py-0.5 text-[10px] ${LEAVE_TYPE_MAP[l.leaveType]?.color || "bg-gray-100"}`}>
                            <span className="hidden sm:inline">{l.applicantName}</span>
                            <span className="sm:hidden">{l.applicantName.split(" ")[0]}</span>
                          </div>
                        ))}
                        {dayLeaves.length > 2 && (
                          <p className="text-[10px] text-muted-foreground">+{dayLeaves.length - 2} more</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Apply Leave Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription>Submit a new leave application</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isParent && children.length > 0 && (
              <div className="space-y-2">
                <Label>Student</Label>
                <Select value={applyForm.studentId} onValueChange={(v) => setApplyForm({ ...applyForm, studentId: v ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    {children.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} ({c.admissionNo})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Select value={applyForm.leaveType} onValueChange={(v) => setApplyForm({ ...applyForm, leaveType: v ?? "SICK" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SICK">Sick Leave</SelectItem>
                  <SelectItem value="CASUAL">Casual Leave</SelectItem>
                  <SelectItem value="EMERGENCY">Emergency</SelectItem>
                  <SelectItem value="MEDICAL">Medical</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={applyForm.startDate} onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={applyForm.endDate} onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea placeholder="Describe your reason for leave..." value={applyForm.reason} onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplyDialog(false)}>Cancel</Button>
            <Button onClick={handleApplyLeave} disabled={applying}>{applying ? "Submitting..." : "Submit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={!!reviewingLeave} onOpenChange={() => setReviewingLeave(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review Leave Application</DialogTitle>
            <DialogDescription>Approve or reject this leave request</DialogDescription>
          </DialogHeader>
          {reviewingLeave && (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 space-y-2">
                <p className="font-medium">{reviewingLeave.applicantName}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge className={`${LEAVE_TYPE_MAP[reviewingLeave.leaveType]?.color || ""} border-0 text-[10px]`}>
                    {LEAVE_TYPE_MAP[reviewingLeave.leaveType]?.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(reviewingLeave.startDate)} — {formatDate(reviewingLeave.endDate)} ({reviewingLeave.days} days)
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{reviewingLeave.reason}</p>
              </div>
              <div className="space-y-2">
                <Label>Remarks (optional)</Label>
                <Textarea placeholder="Add remarks..." value={reviewRemarks} onChange={(e) => setReviewRemarks(e.target.value)} rows={2} />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="destructive" onClick={() => handleReview("REJECTED")} disabled={reviewing}>Reject</Button>
            <Button onClick={() => handleReview("APPROVED")} disabled={reviewing} className="bg-emerald-600 hover:bg-emerald-700">Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configure Balances Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Leave Balances</DialogTitle>
            <DialogDescription>Set default leave allowances for the current academic year</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Apply To</Label>
              <Select value={configType} onValueChange={(v) => setConfigType(v ?? "STAFF")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="STUDENT">Students</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              {configBalances.map((b, i) => (
                <div key={b.leaveType} className="flex items-center gap-3">
                  <Label className="w-24 text-xs">{LEAVE_TYPE_MAP[b.leaveType]?.label || b.leaveType}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={b.totalAllowed}
                    onChange={(e) => {
                      const updated = [...configBalances];
                      updated[i] = { ...updated[i], totalAllowed: parseInt(e.target.value) || 0 };
                      setConfigBalances(updated);
                    }}
                    className="w-20"
                  />
                  <span className="text-xs text-muted-foreground">days/year</span>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>Cancel</Button>
            <Button onClick={handleConfigSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

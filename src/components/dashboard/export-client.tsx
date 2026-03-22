"use client";

import { useEffect, useState } from "react";
import {
  exportStudents,
  exportAttendance,
  exportMarks,
  exportFees,
  exportStaff,
  exportLeaves,
  getExportFilterOptions,
} from "@/actions/export";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Download,
  Users,
  GraduationCap,
  CalendarCheck,
  FileSpreadsheet,
  IndianRupee,
  CalendarDays,
  Loader2,
} from "lucide-react";

interface FilterOptions {
  classes: { id: string; name: string }[];
  batches: { id: string; name: string }[];
  exams: { id: string; name: string }[];
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ExportClient() {
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<FilterOptions>({ classes: [], batches: [], exams: [] });
  const [exporting, setExporting] = useState<string | null>(null);

  // Student filters
  const [studentClassId, setStudentClassId] = useState("ALL");
  const [studentBatchId, setStudentBatchId] = useState("ALL");
  const [studentStatus, setStudentStatus] = useState("ALL");

  // Attendance filters
  const [attClassId, setAttClassId] = useState("ALL");
  const [attStartDate, setAttStartDate] = useState("");
  const [attEndDate, setAttEndDate] = useState("");

  // Marks filter
  const [selectedExamId, setSelectedExamId] = useState("");

  // Fee filters
  const [feeStatus, setFeeStatus] = useState("ALL");
  const [feeStartDate, setFeeStartDate] = useState("");
  const [feeEndDate, setFeeEndDate] = useState("");

  // Leave filters
  const [leaveStatus, setLeaveStatus] = useState("ALL");
  const [leaveType, setLeaveType] = useState("ALL");

  useEffect(() => {
    getExportFilterOptions().then((res) => {
      if (res.success && res.data) setOptions(res.data);
      setLoading(false);
    });
  }, []);

  const handleExport = async (type: string) => {
    setExporting(type);
    try {
      let res;
      switch (type) {
        case "students":
          res = await exportStudents({ classId: studentClassId, batchId: studentBatchId, status: studentStatus });
          break;
        case "attendance":
          if (!attStartDate || !attEndDate) { toast.error("Select date range"); setExporting(null); return; }
          res = await exportAttendance({ classId: attClassId, startDate: attStartDate, endDate: attEndDate });
          break;
        case "marks":
          if (!selectedExamId) { toast.error("Select an exam"); setExporting(null); return; }
          res = await exportMarks({ examId: selectedExamId });
          break;
        case "fees":
          res = await exportFees({ status: feeStatus, startDate: feeStartDate || undefined, endDate: feeEndDate || undefined });
          break;
        case "staff":
          res = await exportStaff();
          break;
        case "leaves":
          res = await exportLeaves({ status: leaveStatus, applicantType: leaveType });
          break;
        default:
          return;
      }

      if (res?.success && res.data) {
        downloadCsv(res.data.csv, res.data.filename);
        toast.success(`Exported ${res.data.count} records`);
      } else {
        toast.error(res?.error || "Export failed");
      }
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-8 w-48" /><Skeleton className="mt-2 h-4 w-72" /></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (<Card key={i}><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>))}
        </div>
      </div>
    );
  }

  const exportCards = [
    {
      key: "students",
      title: "Students",
      description: "Export student directory with personal details",
      icon: <GraduationCap className="h-5 w-5" />,
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      filters: (
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-3">
          <Select value={studentClassId} onValueChange={(v) => setStudentClassId(v ?? "ALL")}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Classes</SelectItem>
              {options.classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={studentBatchId} onValueChange={(v) => setStudentBatchId(v ?? "ALL")}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Batch" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Batches</SelectItem>
              {options.batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={studentStatus} onValueChange={(v) => setStudentStatus(v ?? "ALL")}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="GRADUATED">Graduated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      key: "attendance",
      title: "Attendance",
      description: "Export daily attendance records by date range",
      icon: <CalendarCheck className="h-5 w-5" />,
      color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
      filters: (
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-3">
          <Select value={attClassId} onValueChange={(v) => setAttClassId(v ?? "ALL")}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Classes</SelectItem>
              {options.classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" className="h-8 text-xs" value={attStartDate} onChange={(e) => setAttStartDate(e.target.value)} placeholder="Start" />
          <Input type="date" className="h-8 text-xs" value={attEndDate} onChange={(e) => setAttEndDate(e.target.value)} placeholder="End" />
        </div>
      ),
    },
    {
      key: "marks",
      title: "Exam Marks",
      description: "Export marks and results for a specific exam",
      icon: <FileSpreadsheet className="h-5 w-5" />,
      color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      filters: (
        <Select value={selectedExamId} onValueChange={(v) => setSelectedExamId(v ?? "")}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select exam" /></SelectTrigger>
          <SelectContent>
            {options.exams.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
      ),
    },
    {
      key: "fees",
      title: "Fee Payments",
      description: "Export fee collection and payment records",
      icon: <IndianRupee className="h-5 w-5" />,
      color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
      filters: (
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-3">
          <Select value={feeStatus} onValueChange={(v) => setFeeStatus(v ?? "ALL")}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" className="h-8 text-xs" value={feeStartDate} onChange={(e) => setFeeStartDate(e.target.value)} />
          <Input type="date" className="h-8 text-xs" value={feeEndDate} onChange={(e) => setFeeEndDate(e.target.value)} />
        </div>
      ),
    },
    {
      key: "staff",
      title: "Staff",
      description: "Export staff directory with designation details",
      icon: <Users className="h-5 w-5" />,
      color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
      filters: null,
    },
    {
      key: "leaves",
      title: "Leave Applications",
      description: "Export leave records with approval status",
      icon: <CalendarDays className="h-5 w-5" />,
      color: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
      filters: (
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
          <Select value={leaveStatus} onValueChange={(v) => setLeaveStatus(v ?? "ALL")}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={leaveType} onValueChange={(v) => setLeaveType(v ?? "ALL")}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="STAFF">Staff</SelectItem>
              <SelectItem value="STUDENT">Student</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Export</h1>
        <p className="text-sm text-muted-foreground">Export data to CSV files for analysis and record-keeping</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {exportCards.map((card) => (
          <Card key={card.key} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2.5 ${card.color}`}>{card.icon}</div>
                <div>
                  <CardTitle className="text-sm">{card.title}</CardTitle>
                  <CardDescription className="text-xs">{card.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3">
              {card.filters && <div>{card.filters}</div>}
              <div className="mt-auto pt-2">
                <Button
                  className="w-full"
                  size="sm"
                  onClick={() => handleExport(card.key)}
                  disabled={exporting !== null}
                >
                  {exporting === card.key ? (
                    <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Exporting...</>
                  ) : (
                    <><Download className="mr-1.5 h-3.5 w-3.5" />Export CSV</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Loader2,
  Search,
  Trophy,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  Download,
  Award,
  BarChart3,
  Medal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getExamResults } from "@/actions/exams";

interface ExamResultsClientProps {
  examId: string;
  userRole: string;
  tenantType: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = Record<string, any>;

const gradeColors: Record<string, string> = {
  "A+": "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
  A: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
  "B+": "text-blue-600 bg-blue-50 dark:bg-blue-950/40",
  B: "text-blue-600 bg-blue-50 dark:bg-blue-950/40",
  C: "text-amber-600 bg-amber-50 dark:bg-amber-950/40",
  D: "text-orange-600 bg-orange-50 dark:bg-orange-950/40",
  F: "text-red-600 bg-red-50 dark:bg-red-950/40",
};

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#f97316", "#ef4444"];

const rankIcons = [Trophy, Medal, Award];
const rankColors = ["text-yellow-500", "text-gray-400", "text-amber-700"];

export function ExamResultsClient({ examId, userRole, tenantType }: ExamResultsClientProps) {
  const router = useRouter();
  const [data, setData] = useState<AnyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const isSchool = tenantType === "SCHOOL";
  const canManage = ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"].includes(userRole);

  async function loadResults() {
    setLoading(true);
    const result = await getExamResults(examId);
    if (result.success && result.data) {
      setData(result.data);
    } else {
      toast.error(result.error || "Failed to load results");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <BarChart3 className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Results not available</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/exams")}>
          Back to Exams
        </Button>
      </div>
    );
  }

  // Map server data to component shape
  const examInfo = { name: data.examName, type: data.examType, className: data.className };
  const results = data.students || [];
  const subjects = data.subjects || [];
  const totalStudents = results.length;
  const passCount = data.passCount || 0;
  const failCount = data.failCount || 0;
  const passPercentage = totalStudents > 0 ? Math.round((passCount / totalStudents) * 100) : 0;

  // Grade distribution for pie chart
  const gradeDist: Record<string, number> = {};
  results.forEach((r: AnyData) => {
    const g = r.overallGrade || "F";
    gradeDist[g] = (gradeDist[g] || 0) + 1;
  });
  const pieData = Object.entries(gradeDist).map(([grade, count]) => ({ name: grade, value: count }));

  // Subject average for bar chart — compute from student marks
  const subjectAvg = subjects.map((s: AnyData) => {
    let total = 0, count = 0;
    results.forEach((r: AnyData) => {
      const sub = r.subjects?.find((sm: AnyData) => sm.name === s.name);
      if (sub) { total += sub.marksObtained; count++; }
    });
    return {
      name: s.name?.length > 10 ? s.name.slice(0, 10) + "…" : s.name,
      average: count > 0 ? Math.round(total / count) : 0,
      max: s.maxMarks ?? 100,
    };
  });

  const filteredResults = results.filter((r: AnyData) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      r.rollNo?.toLowerCase().includes(q) ||
      r.admissionNo?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/exams/${examId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Exam Results</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{examInfo?.name}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-2.5">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStudents}</p>
              <p className="text-xs text-muted-foreground">Total Students</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{passCount}</p>
              <p className="text-xs text-muted-foreground">Passed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-2.5">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{failCount}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 p-2.5">
              <TrendingUp className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{passPercentage}%</p>
              <p className="text-xs text-muted-foreground">Pass Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Subject Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Subject-wise Average</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {subjectAvg.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectAvg} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="average" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grade Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top 3 */}
      {results && results.length >= 3 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {results.slice(0, 3).map((r: AnyData, idx: number) => {
                const Icon = rankIcons[idx];
                return (
                  <div
                    key={r.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-4",
                      idx === 0 && "bg-yellow-50/50 dark:bg-yellow-950/10 border-yellow-200 dark:border-yellow-900"
                    )}
                  >
                    <Icon className={cn("h-6 w-6 shrink-0", rankColors[idx])} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{r.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.totalMarks}/{r.totalMaxMarks} ({r.percentage}%)
                      </p>
                    </div>
                    <Badge className={cn("shrink-0", gradeColors[r.overallGrade])}>
                      {r.overallGrade}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Detailed Results</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-12 font-semibold text-center">Rank</TableHead>
                  <TableHead className="font-semibold">Student</TableHead>
                  {isSchool && <TableHead className="font-semibold hidden sm:table-cell">Roll No</TableHead>}
                  {subjects?.map((s: AnyData, si: number) => (
                    <TableHead key={si} className="font-semibold text-center hidden lg:table-cell">
                      <span title={s.name}>
                        {s.name?.length > 8 ? s.name.slice(0, 8) + "…" : s.name}
                      </span>
                      <div className="text-xs font-normal text-muted-foreground">/{s.maxMarks}</div>
                    </TableHead>
                  ))}
                  <TableHead className="font-semibold text-center">Total</TableHead>
                  <TableHead className="font-semibold text-center">%</TableHead>
                  <TableHead className="font-semibold text-center">Grade</TableHead>
                  <TableHead className="font-semibold text-center">Result</TableHead>
                  {canManage && (
                    <TableHead className="font-semibold text-right">Report</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((r: AnyData) => {
                  const allSubjectsPassed = r.subjects?.every((sub: AnyData) => sub.passed);
                  return (
                  <TableRow key={r.id}>
                    <TableCell className="text-center font-medium">
                      {r.rank <= 3 ? (
                        <span className={cn("font-bold", rankColors[r.rank - 1])}>{r.rank}</span>
                      ) : (
                        r.rank
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-sm">{r.name}</span>
                    </TableCell>
                    {isSchool && (
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {r.rollNo || "—"}
                      </TableCell>
                    )}
                    {subjects?.map((s: AnyData, si: number) => {
                      const subMark = r.subjects?.find((sm: AnyData) => sm.name === s.name);
                      const passed = subMark?.passed;
                      return (
                        <TableCell
                          key={si}
                          className={cn(
                            "text-center text-sm hidden lg:table-cell",
                            subMark && !passed && "text-red-600 font-medium"
                          )}
                        >
                          {subMark ? subMark.marksObtained : "—"}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-semibold">
                      {r.totalMarks}/{r.totalMaxMarks}
                    </TableCell>
                    <TableCell className="text-center font-medium">{r.percentage}%</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn("text-xs", gradeColors[r.overallGrade])}>
                        {r.overallGrade}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {allSubjectsPassed ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-xs">
                          Pass
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 text-xs">
                          Fail
                        </Badge>
                      )}
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1"
                          onClick={() =>
                            window.open(`/api/report-card/${r.id}/${examId}`, "_blank")
                          }
                        >
                          <Download className="h-3 w-3" />
                          PDF
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Award,
  Calendar,
  TrendingUp,
  CheckCircle2,
  XCircle,
  BookOpen,
  Trophy,
  Download,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getMyExams, getParentChildren } from "@/actions/portal";

interface MyExamsClientProps {
  userRole: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = Record<string, any>;

const examTypeLabels: Record<string, string> = {
  UNIT_TEST: "Unit Test",
  MID_TERM: "Mid Term",
  FINAL: "Final Exam",
  MOCK_TEST: "Mock Test",
  WEEKLY_TEST: "Weekly Test",
  PRACTICE: "Practice",
};

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  UPCOMING: { label: "Upcoming", color: "text-blue-700 bg-blue-50 dark:bg-blue-950/40", dot: "bg-blue-500" },
  ONGOING: { label: "Ongoing", color: "text-amber-700 bg-amber-50 dark:bg-amber-950/40", dot: "bg-amber-500" },
  COMPLETED: { label: "Completed", color: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40", dot: "bg-emerald-500" },
  RESULT_PUBLISHED: { label: "Results", color: "text-violet-700 bg-violet-50 dark:bg-violet-950/40", dot: "bg-violet-500" },
};

const gradeColors: Record<string, string> = {
  "A+": "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
  A: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
  "B+": "text-blue-600 bg-blue-50 dark:bg-blue-950/40",
  B: "text-blue-600 bg-blue-50 dark:bg-blue-950/40",
  C: "text-amber-600 bg-amber-50 dark:bg-amber-950/40",
  D: "text-orange-600 bg-orange-50 dark:bg-orange-950/40",
  F: "text-red-600 bg-red-50 dark:bg-red-950/40",
};

export function MyExamsClient({ userRole }: MyExamsClientProps) {
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<AnyData[]>([]);
  const [studentId, setStudentId] = useState<string>("");
  const [children, setChildren] = useState<AnyData[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [expandedExam, setExpandedExam] = useState<string | null>(null);

  const isParent = userRole === "PARENT";

  async function loadChildren() {
    const result = await getParentChildren();
    if (result.success && result.data && result.data.length > 0) {
      setChildren(result.data);
      setSelectedChild(result.data[0].id);
      loadExams(result.data[0].id);
    } else {
      setLoading(false);
    }
  }

  async function loadExams(childId?: string) {
    setLoading(true);
    const result = await getMyExams(childId);
    if (result.success && result.data) {
      setExams(result.data.exams || []);
      if (result.data.studentId) setStudentId(result.data.studentId);
    } else {
      toast.error(result.error || "Failed to load exams");
    }
    setLoading(false);
  }

  useEffect(() => {
    if (isParent) loadChildren();
    else loadExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChildChange(childId: string) {
    setSelectedChild(childId);
    setExpandedExam(null);
    loadExams(childId);
  }

  const publishedExams = exams.filter((e) => e.hasResults);
  const upcomingExams = exams.filter((e) => e.status === "UPCOMING" || e.status === "ONGOING");

  // Performance trend chart data from published exams (latest first, reversed for chart)
  const trendData = [...publishedExams]
    .reverse()
    .slice(-8)
    .map((e) => ({
      name: e.name.length > 12 ? e.name.slice(0, 12) + "…" : e.name,
      percentage: e.percentage,
    }));

  // Overall stats
  const examsTaken = publishedExams.length;
  const avgPercentage = examsTaken > 0
    ? Math.round(publishedExams.reduce((s: number, e: AnyData) => s + e.percentage, 0) / examsTaken)
    : 0;
  const bestResult = publishedExams.length > 0
    ? Math.max(...publishedExams.map((e: AnyData) => e.percentage))
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Exams</h1>
          <p className="text-sm text-muted-foreground mt-0.5">View your exam schedule and results</p>
        </div>
        {isParent && children.length > 1 && (
          <Select value={selectedChild} onValueChange={(v) => v && handleChildChange(v)}>
            <SelectTrigger className="w-60">
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              {children.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} — {c.class?.name || c.batch?.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Stats */}
      {examsTaken > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-2.5">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{exams.length}</p>
                <p className="text-xs text-muted-foreground">Total Exams</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2.5">
                <Award className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{examsTaken}</p>
                <p className="text-xs text-muted-foreground">Results Available</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 p-2.5">
                <TrendingUp className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgPercentage}%</p>
                <p className="text-xs text-muted-foreground">Average Score</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-2.5">
                <Trophy className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{bestResult}%</p>
                <p className="text-xs text-muted-foreground">Best Score</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Trend */}
      {trendData.length >= 2 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                  formatter={(value) => [`${value}%`, "Score"]}
                />
                <Bar dataKey="percentage" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Exams */}
      {upcomingExams.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              Upcoming Exams
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingExams.map((exam) => {
              const sc = statusConfig[exam.status];
              return (
                <div key={exam.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium text-sm">{exam.name}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">{examTypeLabels[exam.type] || exam.type}</Badge>
                      {exam.startDate && (
                        <span>{format(new Date(exam.startDate), "dd MMM yyyy")}</span>
                      )}
                      <span>{exam.totalSubjects} subjects</span>
                    </div>
                  </div>
                  <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", sc?.color)}>
                    <div className={cn("h-2 w-2 rounded-full", sc?.dot)} />
                    {sc?.label}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Published Results */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4 text-violet-500" />
            Exam Results
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {publishedExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Award className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No results published yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {publishedExams.map((exam) => {
                const isExpanded = expandedExam === exam.id;
                return (
                  <div key={exam.id}>
                    <button
                      onClick={() => setExpandedExam(isExpanded ? null : exam.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 p-2 min-w-14">
                          <span className="text-xl font-bold">{exam.percentage}%</span>
                          <span className="text-[10px] text-muted-foreground uppercase">Score</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{exam.name}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{examTypeLabels[exam.type] || exam.type}</Badge>
                            <span className="text-xs text-muted-foreground">{exam.academicYear}</span>
                            {exam.allPassed ? (
                              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-xs gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Pass
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 text-xs gap-1">
                                <XCircle className="h-3 w-3" /> Fail
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-sm text-muted-foreground hidden sm:block">
                          {exam.totalObtained}/{exam.totalMaxMarks}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Subject Details */}
                    {isExpanded && (
                      <div className="border-t bg-muted/20 p-4">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="font-semibold">Subject</TableHead>
                                <TableHead className="font-semibold text-center">Max</TableHead>
                                <TableHead className="font-semibold text-center">Obtained</TableHead>
                                <TableHead className="font-semibold text-center">Grade</TableHead>
                                <TableHead className="font-semibold text-center">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {exam.subjects.map((sub: AnyData, idx: number) => (
                                <TableRow key={idx}>
                                  <TableCell className="font-medium text-sm">{sub.subjectName}</TableCell>
                                  <TableCell className="text-center text-muted-foreground">{sub.maxMarks}</TableCell>
                                  <TableCell className={cn("text-center font-semibold", !sub.passed && "text-red-600")}>
                                    {sub.marksObtained}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant="outline" className={cn("text-xs", gradeColors[sub.grade])}>
                                      {sub.grade}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {sub.passed ? (
                                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                              {/* Total Row */}
                              <TableRow className="bg-muted/30 font-semibold">
                                <TableCell>Total</TableCell>
                                <TableCell className="text-center">{exam.totalMaxMarks}</TableCell>
                                <TableCell className="text-center">{exam.totalObtained}</TableCell>
                                <TableCell className="text-center">{exam.percentage}%</TableCell>
                                <TableCell />
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                        <div className="flex justify-end mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() =>
                              window.open(`/api/report-card/${studentId}/${exam.id}`, "_blank")
                            }
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download Report Card
                          </Button>
                        </div>
                      </div>
                    )}
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

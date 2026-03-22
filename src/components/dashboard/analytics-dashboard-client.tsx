"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAttendanceAnalytics,
  getExamAnalytics,
  getFeeAnalytics,
  getStudentGrowthAnalytics,
  getAnalyticsFilterOptions,
} from "@/actions/analytics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  GraduationCap,
  ClipboardCheck,
  Wallet,
  Award,
  AlertTriangle,
} from "lucide-react";
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
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from "recharts";

const PIE_COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6"];
const GRADE_COLORS: Record<string, string> = {
  "A+": "#059669", A: "#10b981", "B+": "#3b82f6", B: "#6366f1",
  C: "#f59e0b", D: "#f97316", F: "#ef4444", "N/A": "#9ca3af",
};

interface SelectOption {
  value: string;
  label: string;
}

export function AnalyticsDashboardClient({ tenantType }: { tenantType: string }) {
  const [activeTab, setActiveTab] = useState("attendance");
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState<{ classes: SelectOption[]; batches: SelectOption[] }>({ classes: [], batches: [] });
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedBatch, setSelectedBatch] = useState<string>("");

  // Analytics data
  const [attendanceData, setAttendanceData] = useState<Awaited<ReturnType<typeof getAttendanceAnalytics>>["data"] | null>(null);
  const [examData, setExamData] = useState<Awaited<ReturnType<typeof getExamAnalytics>>["data"] | null>(null);
  const [feeData, setFeeData] = useState<Awaited<ReturnType<typeof getFeeAnalytics>>["data"] | null>(null);
  const [studentData, setStudentData] = useState<Awaited<ReturnType<typeof getStudentGrowthAnalytics>>["data"] | null>(null);

  const isCoaching = tenantType === "COACHING_INSTITUTE";

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        ...(selectedClass && { classId: selectedClass }),
        ...(selectedBatch && { batchId: selectedBatch }),
      };

      const results = await Promise.all([
        getAttendanceAnalytics(filters),
        getExamAnalytics(filters),
        getFeeAnalytics(filters),
        getStudentGrowthAnalytics(),
      ]);

      if (results[0].success) setAttendanceData(results[0].data);
      if (results[1].success) setExamData(results[1].data);
      if (results[2].success) setFeeData(results[2].data);
      if (results[3].success) setStudentData(results[3].data);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedBatch]);

  useEffect(() => {
    getAnalyticsFilterOptions().then((res) => {
      if (res.success && res.data) setFilterOptions(res.data);
    });
    loadData();
  }, [loadData]);

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `â‚¹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `â‚¹${(val / 1000).toFixed(1)}K`;
    return `â‚¹${val}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">Comprehensive insights across attendance, exams, fees, and student growth</p>
        </div>
        <div className="flex gap-2">
          {!isCoaching && filterOptions.classes.length > 0 && (
            <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v === "all" ? "" : v ?? ""); setSelectedBatch(""); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {filterOptions.classes.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {isCoaching && filterOptions.batches.length > 0 && (
            <Select value={selectedBatch} onValueChange={(v) => { setSelectedBatch(v === "all" ? "" : v ?? ""); setSelectedClass(""); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {filterOptions.batches.map((b) => (
                  <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="attendance" className="gap-1.5">
            <ClipboardCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Attendance</span>
          </TabsTrigger>
          <TabsTrigger value="exams" className="gap-1.5">
            <Award className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exams</span>
          </TabsTrigger>
          <TabsTrigger value="fees" className="gap-1.5">
            <Wallet className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Fees</span>
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Students</span>
          </TabsTrigger>
        </TabsList>

        {/* ATTENDANCE TAB */}
        <TabsContent value="attendance" className="space-y-6">
          {loading ? <AnalyticsSkeleton /> : attendanceData ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Overall Rate" value={`${attendanceData.overall.overallRate}%`} icon={<BarChart3 className="h-4 w-4" />} variant={attendanceData.overall.overallRate >= 75 ? "success" : "warning"} />
                <StatCard title="Total Records" value={attendanceData.overall.totalRecords.toLocaleString()} icon={<ClipboardCheck className="h-4 w-4" />} />
                <StatCard title="Present" value={attendanceData.overall.presentCount.toLocaleString()} icon={<TrendingUp className="h-4 w-4" />} variant="success" />
                <StatCard title="Absent" value={attendanceData.overall.absentCount.toLocaleString()} icon={<TrendingDown className="h-4 w-4" />} variant="danger" />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Monthly Attendance Trend</CardTitle>
                    <CardDescription>Attendance rate over the last 6 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-75">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={attendanceData.monthlyTrend}>
                          <defs>
                            <linearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="label" className="text-xs" tick={{ fontSize: 12 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(v) => [`${Number(v)}%`, "Rate"]} contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                          <Area type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={2} fill="url(#attendGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{isCoaching ? "Batch" : "Class"} Comparison</CardTitle>
                    <CardDescription>Attendance rate by {isCoaching ? "batch" : "class"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-75">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={attendanceData.classComparison} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                          <Tooltip formatter={(v) => [`${Number(v)}%`, "Rate"]} contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                          <Bar dataKey="rate" fill="#6366f1" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">Day-of-Week Analysis</CardTitle>
                    <CardDescription>Which days have best and worst attendance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-65">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={attendanceData.dayOfWeekAnalysis}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(v) => [`${Number(v)}%`, "Rate"]} contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                          <Bar dataKey="rate" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                            {attendanceData.dayOfWeekAnalysis.map((entry, i) => (
                              <Cell key={i} fill={entry.rate >= 80 ? "#10b981" : entry.rate >= 60 ? "#f59e0b" : "#ef4444"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : <EmptyState message="No attendance data available" />}
        </TabsContent>

        {/* EXAMS TAB */}
        <TabsContent value="exams" className="space-y-6">
          {loading ? <AnalyticsSkeleton /> : examData ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Exams" value={examData.totalExams} icon={<Award className="h-4 w-4" />} />
                <StatCard
                  title="Overall Pass Rate"
                  value={examData.passFailRatio.pass + examData.passFailRatio.fail > 0
                    ? `${Math.round((examData.passFailRatio.pass / (examData.passFailRatio.pass + examData.passFailRatio.fail)) * 100)}%`
                    : "N/A"}
                  icon={<TrendingUp className="h-4 w-4" />}
                  variant="success"
                />
                <StatCard title="Passed" value={examData.passFailRatio.pass.toLocaleString()} icon={<GraduationCap className="h-4 w-4" />} variant="success" />
                <StatCard title="Failed" value={examData.passFailRatio.fail.toLocaleString()} icon={<AlertTriangle className="h-4 w-4" />} variant="danger" />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Subject-wise Average</CardTitle>
                    <CardDescription>Average percentage across all exams by subject</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-75">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={examData.subjectAverages}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="subject" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                          <Bar dataKey="avgPercentage" name="Avg %" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="passRate" name="Pass Rate %" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Grade Distribution</CardTitle>
                    <CardDescription>Overall grade breakdown across all exams</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-75">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={examData.gradeDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="count"
                            nameKey="grade"
                            label={({ name, percent }: { name?: string; percent?: number }) => `${name || ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          >
                            {examData.gradeDistribution.map((entry, i) => (
                              <Cell key={i} fill={GRADE_COLORS[entry.grade] || PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Exam Score Trend</CardTitle>
                    <CardDescription>Average percentage across exams over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-75">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={examData.examTrend}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="examName" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                          <Line type="monotone" dataKey="avgPercentage" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} name="Avg %" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{isCoaching ? "Batch" : "Class"} Comparison</CardTitle>
                    <CardDescription>Average scores and pass rates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {examData.classComparison.map((c, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="text-sm font-medium">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.totalStudents} entries</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm font-semibold">{c.avgPercentage}%</p>
                              <p className="text-xs text-muted-foreground">avg</p>
                            </div>
                            <Badge variant={c.passRate >= 80 ? "default" : c.passRate >= 50 ? "secondary" : "destructive"}>
                              {c.passRate}% pass
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {examData.classComparison.length === 0 && (
                        <p className="py-8 text-center text-sm text-muted-foreground">No exam data</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : <EmptyState message="No exam data available" />}
        </TabsContent>

        {/* FEES TAB */}
        <TabsContent value="fees" className="space-y-6">
          {loading ? <AnalyticsSkeleton /> : feeData ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Collected" value={formatCurrency(feeData.overall.totalCollected)} icon={<Wallet className="h-4 w-4" />} variant="success" />
                <StatCard title="Total Pending" value={formatCurrency(feeData.overall.totalPending)} icon={<AlertTriangle className="h-4 w-4" />} variant="warning" />
                <StatCard title="Collection Rate" value={`${feeData.overall.collectionRate}%`} icon={<TrendingUp className="h-4 w-4" />} />
                <StatCard title="Projected Revenue" value={formatCurrency(feeData.projectedRevenue)} icon={<BarChart3 className="h-4 w-4" />} description="This month" />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Collection Trend</CardTitle>
                    <CardDescription>Monthly fee collection over 6 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-75">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={feeData.collectionTrend}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v)} />
                          <Tooltip formatter={(v) => [formatCurrency(Number(v))]} contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                          <Legend />
                          <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Fee Type Breakdown</CardTitle>
                    <CardDescription>Collection by fee category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-75">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={feeData.feeTypeSplit}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="amount"
                            nameKey="name"
                            label={({ name, percent }: { name?: string; percent?: number }) => `${name || ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          >
                            {feeData.feeTypeSplit.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => [formatCurrency(Number(v))]} contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Fee Defaulters
                    </CardTitle>
                    <CardDescription>Students with outstanding fee payments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="pb-2 font-medium text-muted-foreground">Student</th>
                            <th className="pb-2 font-medium text-muted-foreground hidden sm:table-cell">{isCoaching ? "Batch" : "Class"}</th>
                            <th className="pb-2 font-medium text-muted-foreground hidden md:table-cell">Guardian</th>
                            <th className="pb-2 text-right font-medium text-muted-foreground">Due Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {feeData.defaulters.slice(0, 15).map((d, i) => (
                            <tr key={i} className="border-b last:border-0">
                              <td className="py-2.5">
                                <p className="font-medium">{d.studentName}</p>
                                <p className="text-xs text-muted-foreground">{d.admissionNo}</p>
                              </td>
                              <td className="py-2.5 hidden sm:table-cell text-muted-foreground">{d.className}</td>
                              <td className="py-2.5 hidden md:table-cell text-muted-foreground">{d.guardianName}</td>
                              <td className="py-2.5 text-right font-semibold text-rose-600">â‚¹{d.totalDue.toLocaleString()}</td>
                            </tr>
                          ))}
                          {feeData.defaulters.length === 0 && (
                            <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No defaulters</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : <EmptyState message="No fee data available" />}
        </TabsContent>

        {/* STUDENTS TAB */}
        <TabsContent value="students" className="space-y-6">
          {loading ? <AnalyticsSkeleton /> : studentData ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Active Students" value={studentData.totalActive.toLocaleString()} icon={<Users className="h-4 w-4" />} />
                <StatCard title="This Month" value={studentData.thisMonthAdmissions} icon={<GraduationCap className="h-4 w-4" />} description="New admissions" />
                <StatCard
                  title="Growth Rate"
                  value={`${studentData.growthRate > 0 ? "+" : ""}${studentData.growthRate}%`}
                  icon={studentData.growthRate >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  variant={studentData.growthRate >= 0 ? "success" : "danger"}
                  description="vs last month"
                />
                <StatCard
                  title="Gender Ratio"
                  value={studentData.genderSplit.find((g) => g.gender === "MALE")?.count || 0}
                  description={`M:${studentData.genderSplit.find((g) => g.gender === "MALE")?.count || 0} F:${studentData.genderSplit.find((g) => g.gender === "FEMALE")?.count || 0}`}
                  icon={<Users className="h-4 w-4" />}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Admission Trend</CardTitle>
                    <CardDescription>New admissions over the last 12 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-75">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={studentData.admissionTrend}>
                          <defs>
                            <linearGradient id="admGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                          <Area type="monotone" dataKey="admissions" stroke="#8b5cf6" strokeWidth={2} fill="url(#admGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Gender Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-75">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={studentData.genderSplit.filter((g) => g.count > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="count"
                            nameKey="gender"
                            label={({ name, percent }: { name?: string; percent?: number }) => `${name === "MALE" ? "Male" : name === "FEMALE" ? "Female" : "Other"} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          >
                            <Cell fill="#6366f1" />
                            <Cell fill="#ec4899" />
                            <Cell fill="#8b5cf6" />
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">Student Status Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-3">
                      {studentData.statusSplit.map((s) => (
                        <div key={s.status} className="flex items-center gap-3 rounded-lg border p-4">
                          <div className={`h-3 w-3 rounded-full ${s.status === "ACTIVE" ? "bg-emerald-500" : s.status === "INACTIVE" ? "bg-amber-500" : "bg-slate-400"}`} />
                          <div>
                            <p className="text-lg font-bold">{s.count}</p>
                            <p className="text-xs capitalize text-muted-foreground">{s.status.toLowerCase()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : <EmptyState message="No student data available" />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ==================== Helper Components ====================

function StatCard({
  title,
  value,
  icon,
  variant,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: "success" | "danger" | "warning";
  description?: string;
}) {
  const variantClasses = {
    success: "text-emerald-600",
    danger: "text-rose-600",
    warning: "text-amber-600",
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="rounded-lg bg-muted p-1.5 text-muted-foreground">{icon}</div>
        </div>
        <p className={`mt-2 text-2xl font-bold ${variant ? variantClasses[variant] : ""}`}>{value}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-75 w-full" /></CardContent></Card>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <BarChart3 className="h-12 w-12 text-muted-foreground/40" />
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

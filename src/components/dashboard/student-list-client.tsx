"use client";

import { useState, useTransition, useCallback } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  UserX,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Loader2,
  Filter,
  Download,
  Upload,
  KeyRound,
  Users2,
} from "lucide-react";
import { getStudentList, toggleStudentStatus, getStudentsForExport, createStudentCredentials, createParentCredentials } from "@/actions/students";

interface StudentData {
  id: string;
  admissionNo: string;
  name: string;
  email: string | null;
  phone: string | null;
  gender: string;
  dateOfBirth: string | null;
  status: string;
  rollNo: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
  userId: string | null;
  parentUserId: string | null;
  class: { id: string; name: string; section: string | null } | null;
  batch: { id: string; name: string } | null;
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

interface PaginationData {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface StudentListClientProps {
  initialStudents: StudentData[];
  initialPagination: PaginationData;
  tenantType: string;
  classes: ClassOption[];
  batches: BatchOption[];
  canManage: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  INACTIVE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  GRADUATED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  TRANSFERRED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  DROPPED: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
};

export function StudentListClient({
  initialStudents,
  initialPagination,
  tenantType,
  classes,
  batches,
  canManage,
}: StudentListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [students, setStudents] = useState(initialStudents);
  const [pagination, setPagination] = useState(initialPagination);

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");
  const [batchFilter, setBatchFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(initialPagination.page);

  const isSchool = tenantType === "SCHOOL";

  const fetchStudents = useCallback(
    (params?: { page?: number; searchVal?: string; classId?: string; batchId?: string; status?: string; gender?: string }) => {
      const p = params?.page ?? currentPage;
      const s = params?.searchVal ?? search;
      const c = params?.classId ?? classFilter;
      const b = params?.batchId ?? batchFilter;
      const st = params?.status ?? statusFilter;
      const g = params?.gender ?? genderFilter;

      startTransition(async () => {
        const result = await getStudentList({
          page: p,
          search: s || undefined,
          classId: c !== "ALL" ? c : undefined,
          batchId: b !== "ALL" ? b : undefined,
          status: st !== "ALL" ? st : undefined,
          gender: g !== "ALL" ? g : undefined,
        });
        if (result.success) {
          setStudents((result as any).data || []);
          setPagination((result as any).pagination);
          setCurrentPage(p);
        }
      });
    },
    [currentPage, search, classFilter, batchFilter, statusFilter, genderFilter]
  );

  function handleSearch(value: string) {
    setSearch(value);
    fetchStudents({ page: 1, searchVal: value });
  }

  function handleFilterChange(type: string, value: string) {
    const v = value || "ALL";
    if (type === "class") {
      setClassFilter(v);
      fetchStudents({ page: 1, classId: v });
    } else if (type === "batch") {
      setBatchFilter(v);
      fetchStudents({ page: 1, batchId: v });
    } else if (type === "status") {
      setStatusFilter(v);
      fetchStudents({ page: 1, status: v });
    } else if (type === "gender") {
      setGenderFilter(v);
      fetchStudents({ page: 1, gender: v });
    }
  }

  function handleToggleStatus(studentId: string, studentName: string) {
    startTransition(async () => {
      const result = await toggleStudentStatus(studentId);
      if (result.success) {
        toast.success(`${studentName} status updated`);
        fetchStudents({});
      } else {
        toast.error(result.error || "Failed to update status");
      }
    });
  }

  function handleCreateStudentCredentials(studentId: string, studentName: string) {
    startTransition(async () => {
      const result = await createStudentCredentials(studentId);
      if (result.success) {
        toast.success(result.message || `Login credentials created for ${studentName}`);
        if (result.data) {
          toast.info(`Email: ${result.data.email} | Password: ${result.data.password}`, { duration: 10000 });
        }
        fetchStudents({});
      } else {
        toast.error(result.error || "Failed to create credentials");
      }
    });
  }

  function handleCreateParentCredentials(studentId: string, studentName: string) {
    startTransition(async () => {
      const result = await createParentCredentials(studentId);
      if (result.success) {
        toast.success(result.message || `Parent credentials created for ${studentName}'s parent`);
        if (result.data) {
          toast.info(`Email: ${result.data.email} | Password: ${result.data.password}`, { duration: 10000 });
        }
        fetchStudents({});
      } else {
        toast.error(result.error || "Failed to create parent credentials");
      }
    });
  }

  async function handleExport() {
    startTransition(async () => {
      const data = await getStudentsForExport({
        classId: classFilter !== "ALL" ? classFilter : undefined,
        batchId: batchFilter !== "ALL" ? batchFilter : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      });
      if (!data || !data.length) {
        toast.info("No students to export");
        return;
      }
      const headers = [
        "Admission No",
        "Name",
        "Email",
        "Phone",
        "Gender",
        "Date of Birth",
        "Roll No",
        isSchool ? "Class" : "Batch",
        "Guardian Name",
        "Guardian Phone",
        "Status",
      ];
      const rows = data.map((s) => [
        s.admissionNo,
        s.name,
        s.email || "",
        s.phone || "",
        s.gender,
        s.dateOfBirth || "",
        s.rollNo || "",
        isSchool ? s.class || "" : s.batch || "",
        s.guardianName || "",
        s.guardianPhone || "",
        s.status,
      ]);
      const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join(
        "\n"
      );
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `students_export_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground">
            {pagination.total} total student{pagination.total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isPending}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          {canManage && (
            <>
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href="/dashboard/students/import" />}
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Import</span>
              </Button>
              <Button size="sm" nativeButton={false} render={<Link href="/dashboard/students/new" />}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Student
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, admission no, email..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="hidden h-4 w-4 text-muted-foreground sm:block" />
              {isSchool ? (
                <Select
                  value={classFilter}
                  onValueChange={(v) => handleFilterChange("class", v || "ALL")}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Classes</SelectItem>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {c.section ? ` - ${c.section}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={batchFilter}
                  onValueChange={(v) => handleFilterChange("batch", v || "ALL")}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Batches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Batches</SelectItem>
                    {batches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select
                value={statusFilter}
                onValueChange={(v) => handleFilterChange("status", v || "ALL")}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="GRADUATED">Graduated</SelectItem>
                  <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                  <SelectItem value="DROPPED">Dropped</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={genderFilter}
                onValueChange={(v) => handleFilterChange("gender", v || "ALL")}
              >
                <SelectTrigger className="w-[110px]">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Gender</SelectItem>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isPending && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4">
                <GraduationCap className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No students found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {search || classFilter !== "ALL" || batchFilter !== "ALL" || statusFilter !== "ALL"
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first student"}
              </p>
              {canManage && !search && classFilter === "ALL" && statusFilter === "ALL" && (
                <Button size="sm" nativeButton={false} className="mt-4" render={<Link href="/dashboard/students/new" />}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Student
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead className="hidden md:table-cell">Admission No</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      {isSchool ? "Class" : "Batch"}
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">Gender</TableHead>
                    <TableHead className="hidden lg:table-cell">Guardian</TableHead>
                    <TableHead>Status</TableHead>
                    {canManage && <TableHead className="w-10" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {student.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <div>
                            <Link
                              href={`/dashboard/students/${student.id}`}
                              className="text-sm font-medium hover:text-primary hover:underline"
                            >
                              {student.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {student.email || student.phone || "—"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono">
                          {student.admissionNo}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {isSchool
                          ? student.class
                            ? `${student.class.name}${student.class.section ? ` - ${student.class.section}` : ""}`
                            : "—"
                          : student.batch?.name || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {student.gender === "MALE"
                          ? "Male"
                          : student.gender === "FEMALE"
                            ? "Female"
                            : "Other"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {student.guardianName ? (
                          <div>
                            <p className="text-sm">{student.guardianName}</p>
                            {student.guardianPhone && (
                              <p className="text-xs text-muted-foreground">
                                {student.guardianPhone}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[student.status] || ""}>
                          {student.status.charAt(0) + student.status.slice(1).toLowerCase()}
                        </Badge>
                      </TableCell>
                      {canManage && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                render={<Link href={`/dashboard/students/${student.id}`} />}
                              >
                                <Eye className="mr-2 h-3.5 w-3.5" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                render={
                                  <Link href={`/dashboard/students/${student.id}/edit`} />
                                }
                              >
                                <Pencil className="mr-2 h-3.5 w-3.5" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  handleToggleStatus(student.id, student.name)
                                }
                              >
                                {student.status === "ACTIVE" ? (
                                  <>
                                    <UserX className="mr-2 h-3.5 w-3.5" /> Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="mr-2 h-3.5 w-3.5" /> Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {!student.userId && student.email && (
                                <DropdownMenuItem
                                  onClick={() => handleCreateStudentCredentials(student.id, student.name)}
                                >
                                  <KeyRound className="mr-2 h-3.5 w-3.5" />
                                  Create Student Login
                                </DropdownMenuItem>
                              )}
                              {!student.parentUserId && student.guardianEmail && (
                                <DropdownMenuItem
                                  onClick={() => handleCreateParentCredentials(student.id, student.name)}
                                >
                                  <Users2 className="mr-2 h-3.5 w-3.5" />
                                  Create Parent Login
                                </DropdownMenuItem>
                              )}
                              {(student.userId) && (
                                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                                  <KeyRound className="mr-2 h-3.5 w-3.5" />
                                  Student login active
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pagination.pageSize + 1} to{" "}
            {Math.min(currentPage * pagination.pageSize, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => fetchStudents({ page: currentPage - 1 })}
              disabled={currentPage <= 1 || isPending}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {currentPage} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => fetchStudents({ page: currentPage + 1 })}
              disabled={currentPage >= pagination.totalPages || isPending}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

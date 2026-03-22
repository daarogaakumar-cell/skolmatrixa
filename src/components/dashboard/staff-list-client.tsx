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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  UserX,
  UserCheck,
  KeyRound,
  ChevronLeft,
  ChevronRight,
  Users,
  Loader2,
  Filter,
  Download,
} from "lucide-react";
import { toggleStaffStatus, resetStaffPassword } from "@/actions/staff";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  staffProfile: {
    id: string;
    employeeId: string | null;
    designation: string | null;
    department: string | null;
    qualification: string | null;
    joiningDate: string | null;
    salary: number | null;
  } | null;
  classTeacher: Array<{ id: string; name: string; section: string | null }>;
  batchFaculty: Array<{ id: string; name: string }>;
}

interface StaffListClientProps {
  initialStaff: StaffMember[];
  initialPagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  departments: string[];
  tenantType: string;
}

const ROLE_LABELS: Record<string, string> = {
  VICE_ADMIN: "Vice Admin",
  TEACHER: "Teacher",
  ACCOUNTANT: "Accountant",
};

const ROLE_COLORS: Record<string, string> = {
  VICE_ADMIN: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  TEACHER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  ACCOUNTANT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

export function StaffListClient({
  initialStaff,
  initialPagination,
  departments,
  tenantType,
}: StaffListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [staff] = useState(initialStaff);
  const [pagination] = useState(initialPagination);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterDepartment, setFilterDepartment] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);

  const isSchool = tenantType === "SCHOOL";

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (filterRole !== "ALL") params.set("role", filterRole);
    if (filterDepartment !== "ALL") params.set("department", filterDepartment);
    if (filterStatus !== "ALL") params.set("status", filterStatus);
    router.push(`/dashboard/staff?${params.toString()}`);
  }, [searchQuery, filterRole, filterDepartment, filterStatus, router]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    applyFilters();
  }

  function handleToggleStatus(staffId: string, name: string) {
    startTransition(async () => {
      const result = await toggleStaffStatus(staffId);
      if (result.success) {
        toast.success(`${name} has been ${result.isActive ? "activated" : "deactivated"}`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update status");
      }
    });
  }

  function handleResetPassword(staffId: string, name: string) {
    startTransition(async () => {
      const result = await resetStaffPassword(staffId);
      if (result.success) {
        toast.success(result.message || `Password reset for ${name}`);
      } else {
        toast.error(result.error || "Failed to reset password");
      }
    });
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function getAssignment(member: StaffMember) {
    if (isSchool && member.classTeacher.length > 0) {
      return member.classTeacher
        .map((c) => `${c.name}${c.section ? ` (${c.section})` : ""}`)
        .join(", ");
    }
    if (!isSchool && member.batchFaculty.length > 0) {
      return member.batchFaculty.map((b) => b.name).join(", ");
    }
    return "—";
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-sm text-muted-foreground">
            {pagination.total} staff member{pagination.total !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/dashboard/staff/new" />}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Staff
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <form onSubmit={handleSearch} className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </form>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-1.5 h-3.5 w-3.5" />
                Filters
              </Button>
              <Button variant="outline" size="sm" onClick={applyFilters}>
                <Search className="mr-1.5 h-3.5 w-3.5" />
                Search
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-3 grid grid-cols-1 gap-3 border-t pt-3 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Role
                </label>
                <Select value={filterRole} onValueChange={(v) => setFilterRole(v || "ALL")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Roles</SelectItem>
                    <SelectItem value="TEACHER">Teacher</SelectItem>
                    <SelectItem value="VICE_ADMIN">Vice Admin</SelectItem>
                    <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Department
                </label>
                <Select value={filterDepartment} onValueChange={(v) => setFilterDepartment(v || "ALL")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Status
                </label>
                <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v || "ALL")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staff Table */}
      {staff.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No staff members yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Start by adding your first staff member
            </p>
            <Button nativeButton={false} className="mt-4" render={<Link href="/dashboard/staff/new" />}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add First Staff
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Role</TableHead>
                  <TableHead className="hidden md:table-cell">Department</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    {isSchool ? "Classes" : "Batches"}
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={member.avatarUrl || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/staff/${member.id}`}
                            className="font-medium hover:text-primary hover:underline truncate block"
                          >
                            {member.name}
                          </Link>
                          <p className="text-xs text-muted-foreground truncate">
                            {member.email}
                          </p>
                          {/* Mobile-only role badge */}
                          <div className="mt-1 sm:hidden">
                            <Badge variant="secondary" className={`text-[10px] ${ROLE_COLORS[member.role] || ""}`}>
                              {ROLE_LABELS[member.role] || member.role}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary" className={ROLE_COLORS[member.role] || ""}>
                        {ROLE_LABELS[member.role] || member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {member.staffProfile?.department || "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {getAssignment(member)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant={member.isActive ? "secondary" : "destructive"}
                        className={
                          member.isActive
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : ""
                        }
                      >
                        {member.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem render={<Link href={`/dashboard/staff/${member.id}`} />}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem render={<Link href={`/dashboard/staff/${member.id}/edit`} />}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleResetPassword(member.id, member.name)}
                            disabled={isPending}
                          >
                            <KeyRound className="mr-2 h-4 w-4" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(member.id, member.name)}
                            disabled={isPending}
                            className={member.isActive ? "text-destructive" : "text-green-600"}
                          >
                            {member.isActive ? (
                              <>
                                <UserX className="mr-2 h-4 w-4" /> Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" /> Activate
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.pageSize + 1}–
                {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{" "}
                {pagination.total}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={pagination.page <= 1}
                  onClick={() => {
                    const params = new URLSearchParams(window.location.search);
                    params.set("page", String(pagination.page - 1));
                    router.push(`/dashboard/staff?${params.toString()}`);
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => {
                    const params = new URLSearchParams(window.location.search);
                    params.set("page", String(pagination.page + 1));
                    router.push(`/dashboard/staff?${params.toString()}`);
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

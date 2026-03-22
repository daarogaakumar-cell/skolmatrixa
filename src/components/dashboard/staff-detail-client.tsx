"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
  ArrowLeft,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Calendar,
  DollarSign,
  Building2,
  Pencil,
  UserX,
  UserCheck,
  KeyRound,
  Loader2,
  BookOpen,
  Users,
  Plus,
  X,
} from "lucide-react";
import {
  toggleStaffStatus,
  resetStaffPassword,
  assignStaffToClass,
  removeStaffFromClass,
  assignStaffToBatch,
} from "@/actions/staff";

interface StaffDetailData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  staffProfile: {
    id: string;
    employeeId: string | null;
    designation: string | null;
    department: string | null;
    qualification: string | null;
    joiningDate: string | null;
    salary: unknown;
  } | null;
  classTeacher: Array<{
    id: string;
    name: string;
    section: string | null;
    _count: { students: number };
  }>;
  batchFaculty: Array<{
    id: string;
    name: string;
    _count: { students: number };
  }>;
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

interface StaffDetailClientProps {
  staff: StaffDetailData;
  tenantType: string;
  availableClasses: ClassOption[];
  availableBatches: BatchOption[];
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

export function StaffDetailClient({
  staff,
  tenantType,
  availableClasses,
  availableBatches,
}: StaffDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");

  const isSchool = tenantType === "SCHOOL";

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function handleToggleStatus() {
    startTransition(async () => {
      const result = await toggleStaffStatus(staff.id);
      if (result.success) {
        toast.success(`${staff.name} has been ${result.isActive ? "activated" : "deactivated"}`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update status");
      }
    });
  }

  function handleResetPassword() {
    startTransition(async () => {
      const result = await resetStaffPassword(staff.id);
      if (result.success) {
        toast.success(result.message || "Password reset successful");
      } else {
        toast.error(result.error || "Failed to reset password");
      }
    });
  }

  function handleAssignClass() {
    if (!selectedClass) return;
    startTransition(async () => {
      const result = await assignStaffToClass(staff.id, selectedClass);
      if (result.success) {
        toast.success("Assigned to class");
        setSelectedClass("");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to assign");
      }
    });
  }

  function handleRemoveClass(classId: string) {
    startTransition(async () => {
      const result = await removeStaffFromClass(classId);
      if (result.success) {
        toast.success("Removed from class");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to remove");
      }
    });
  }

  function handleAssignBatch() {
    if (!selectedBatch) return;
    startTransition(async () => {
      const result = await assignStaffToBatch(staff.id, selectedBatch);
      if (result.success) {
        toast.success("Assigned to batch");
        setSelectedBatch("");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to assign");
      }
    });
  }

  const assignedClassIds = new Set(staff.classTeacher.map((c) => c.id));
  const assignedBatchIds = new Set(staff.batchFaculty.map((b) => b.id));
  const unassignedClasses = availableClasses.filter((c) => !assignedClassIds.has(c.id));
  const unassignedBatches = availableBatches.filter((b) => !assignedBatchIds.has(b.id));

  const profileInfo = [
    { icon: Mail, label: "Email", value: staff.email },
    { icon: Phone, label: "Phone", value: staff.phone || "—" },
    {
      icon: Briefcase,
      label: "Designation",
      value: staff.staffProfile?.designation || "—",
    },
    {
      icon: Building2,
      label: "Department",
      value: staff.staffProfile?.department || "—",
    },
    {
      icon: GraduationCap,
      label: "Qualification",
      value: staff.staffProfile?.qualification || "—",
    },
    {
      icon: Calendar,
      label: "Joining Date",
      value: staff.staffProfile?.joiningDate
        ? new Date(staff.staffProfile.joiningDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "—",
    },
    {
      icon: DollarSign,
      label: "Salary",
      value: staff.staffProfile?.salary
        ? `₹${Number(staff.staffProfile.salary).toLocaleString("en-IN")}`
        : "—",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" nativeButton={false} render={<Link href="/dashboard/staff" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Staff Details</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={staff.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                  {getInitials(staff.name)}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-xl font-semibold">{staff.name}</h2>
              <p className="text-sm text-muted-foreground">{staff.email}</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge className={ROLE_COLORS[staff.role] || ""}>
                  {ROLE_LABELS[staff.role] || staff.role}
                </Badge>
                <Badge
                  variant={staff.isActive ? "secondary" : "destructive"}
                  className={
                    staff.isActive
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      : ""
                  }
                >
                  {staff.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              {staff.staffProfile?.employeeId && (
                <p className="mt-2 text-xs text-muted-foreground">
                  ID: {staff.staffProfile.employeeId}
                </p>
              )}

              <Separator className="my-4 w-full" />

              {/* Quick Actions */}
              <div className="grid w-full gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  nativeButton={false}
                  render={<Link href={`/dashboard/staff/${staff.id}/edit`} />}
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit Profile
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger
                    className="inline-flex h-7 w-full items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted"
                  >
                    <KeyRound className="h-3.5 w-3.5 mr-1.5" />
                    Reset Password
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset Password?</AlertDialogTitle>
                      <AlertDialogDescription>
                        A new password will be generated and sent to {staff.email}. The old
                        password will no longer work.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResetPassword} disabled={isPending}>
                        {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                        Reset Password
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger
                    className={`inline-flex h-7 w-full items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] border px-2.5 text-[0.8rem] font-medium ${
                      staff.isActive
                        ? "border-destructive/30 text-destructive hover:bg-destructive/10"
                        : "border-green-500/30 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                    }`}
                  >
                    {staff.isActive ? (
                      <>
                        <UserX className="h-3.5 w-3.5 mr-1.5" /> Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-3.5 w-3.5 mr-1.5" /> Activate
                      </>
                    )}
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {staff.isActive ? "Deactivate" : "Activate"} Staff Member?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {staff.isActive
                          ? `${staff.name} will no longer be able to log in or access the system.`
                          : `${staff.name} will regain access to the system.`}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleToggleStatus} disabled={isPending}>
                        {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                        {staff.isActive ? "Deactivate" : "Activate"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Profile Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {profileInfo.map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Assigned Classes / Batches */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                {isSchool ? "Assigned Classes" : "Assigned Batches"}
              </CardTitle>
              <CardDescription>
                {isSchool
                  ? "Classes where this staff member is the class teacher"
                  : "Batches where this staff member is the faculty"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current assignments */}
              {isSchool ? (
                staff.classTeacher.length > 0 ? (
                  <div className="space-y-2">
                    {staff.classTeacher.map((cls) => (
                      <div
                        key={cls.id}
                        className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-primary/10 p-2">
                            <BookOpen className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {cls.name}
                              {cls.section ? ` - ${cls.section}` : ""}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {cls._count.students} student{cls._count.students !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleRemoveClass(cls.id)}
                          disabled={isPending}
                        >
                          <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No classes assigned yet</p>
                )
              ) : staff.batchFaculty.length > 0 ? (
                <div className="space-y-2">
                  {staff.batchFaculty.map((batch) => (
                    <div
                      key={batch.id}
                      className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-primary/10 p-2">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{batch.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {batch._count.students} student{batch._count.students !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No batches assigned yet</p>
              )}

              {/* Assign new */}
              {isSchool && unassignedClasses.length > 0 && (
                <div className="flex items-center gap-2 pt-2">
                  <Select value={selectedClass} onValueChange={(v) => setSelectedClass(v || "")}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a class to assign" />
                    </SelectTrigger>
                    <SelectContent>
                      {unassignedClasses.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                          {cls.section ? ` - ${cls.section}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={handleAssignClass}
                    disabled={isPending || !selectedClass}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Assign
                  </Button>
                </div>
              )}

              {!isSchool && unassignedBatches.length > 0 && (
                <div className="flex items-center gap-2 pt-2">
                  <Select value={selectedBatch} onValueChange={(v) => setSelectedBatch(v || "")}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a batch to assign" />
                    </SelectTrigger>
                    <SelectContent>
                      {unassignedBatches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={handleAssignBatch}
                    disabled={isPending || !selectedBatch}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Assign
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Created:</span>{" "}
                  <span className="font-medium">
                    {new Date(staff.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Login:</span>{" "}
                  <span className="font-medium">
                    {staff.lastLoginAt
                      ? new Date(staff.lastLoginAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Never"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

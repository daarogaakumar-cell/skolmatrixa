"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Calendar,
  MapPin,
  Pencil,
  UserX,
  UserCheck,
  Loader2,
  GraduationCap,
  Users,
  BookOpen,
  ClipboardList,
  DollarSign,
  Clock,
  Hash,
  User,
} from "lucide-react";
import { toggleStudentStatus } from "@/actions/students";

interface StudentDetailData {
  id: string;
  admissionNo: string;
  name: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  photoUrl: string | null;
  rollNo: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
  guardianRelation: string | null;
  admissionDate: string | null;
  status: string;
  createdAt: string;
  class: {
    id: string;
    name: string;
    section: string | null;
    classTeacher: { name: string } | null;
  } | null;
  batch: { id: string; name: string } | null;
  user: {
    id: string;
    email: string;
    isActive: boolean;
    lastLoginAt: string | null;
  } | null;
  parentUser: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface StudentDetailClientProps {
  student: StudentDetailData;
  tenantType: string;
  canManage: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  INACTIVE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  GRADUATED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  TRANSFERRED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  DROPPED: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
};

export function StudentDetailClient({
  student,
  tenantType,
  canManage,
}: StudentDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isSchool = tenantType === "SCHOOL";

  function getInitials(nm: string) {
    return nm
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function handleToggleStatus() {
    startTransition(async () => {
      const result = await toggleStudentStatus(student.id);
      if (result.success) {
        toast.success("Student status updated");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update status");
      }
    });
  }

  const personalInfo = [
    {
      icon: Hash,
      label: "Admission No",
      value: student.admissionNo,
    },
    {
      icon: Mail,
      label: "Email",
      value: student.email || "—",
    },
    {
      icon: Phone,
      label: "Phone",
      value: student.phone || "—",
    },
    {
      icon: Calendar,
      label: "Date of Birth",
      value: student.dateOfBirth
        ? new Date(student.dateOfBirth).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "—",
    },
    {
      icon: User,
      label: "Gender",
      value: student.gender
        ? student.gender.charAt(0) + student.gender.slice(1).toLowerCase()
        : "—",
    },
    {
      icon: Calendar,
      label: "Admission Date",
      value: student.admissionDate
        ? new Date(student.admissionDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "—",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" nativeButton={false} render={<Link href="/dashboard/students" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Student Details</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={student.name}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
                  {getInitials(student.name)}
                </div>
              )}
              <h2 className="mt-4 text-xl font-semibold">{student.name}</h2>
              <p className="text-sm text-muted-foreground font-mono">
                {student.admissionNo}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Badge className={STATUS_COLORS[student.status] || ""}>
                  {student.status.charAt(0) + student.status.slice(1).toLowerCase()}
                </Badge>
              </div>

              {/* Class/Batch info */}
              <div className="mt-3 text-sm">
                {isSchool && student.class && (
                  <p className="text-muted-foreground">
                    {student.class.name}
                    {student.class.section ? ` - ${student.class.section}` : ""}
                    {student.rollNo ? ` | Roll: ${student.rollNo}` : ""}
                  </p>
                )}
                {!isSchool && student.batch && (
                  <p className="text-muted-foreground">
                    {student.batch.name}
                    {student.rollNo ? ` | Roll: ${student.rollNo}` : ""}
                  </p>
                )}
              </div>

              <Separator className="my-4 w-full" />

              {/* Quick Actions */}
              {canManage && (
                <div className="grid w-full gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    nativeButton={false}
                    render={<Link href={`/dashboard/students/${student.id}/edit`} />}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit Profile
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger
                      className={`inline-flex h-7 w-full items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] border px-2.5 text-[0.8rem] font-medium ${
                        student.status === "ACTIVE"
                          ? "border-destructive/30 text-destructive hover:bg-destructive/10"
                          : "border-green-500/30 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                      }`}
                    >
                      {student.status === "ACTIVE" ? (
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
                          {student.status === "ACTIVE" ? "Deactivate" : "Activate"} Student?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {student.status === "ACTIVE"
                            ? `${student.name} will be marked as inactive.`
                            : `${student.name} will be re-activated.`}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleToggleStatus} disabled={isPending}>
                          {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                          {student.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <div className="space-y-6 lg:col-span-2">
          <Tabs defaultValue="profile">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="guardian">Guardian</TabsTrigger>
              <TabsTrigger value="academic">Academic</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {personalInfo.map((item) => (
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
                  {student.address && (
                    <div className="mt-4 flex items-start gap-3">
                      <div className="rounded-lg bg-muted p-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Address</p>
                        <p className="text-sm font-medium">{student.address}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Guardian Tab */}
            <TabsContent value="guardian" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Guardian Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {student.guardianName ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-muted p-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Name</p>
                          <p className="text-sm font-medium">{student.guardianName}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-muted p-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Relation</p>
                          <p className="text-sm font-medium">
                            {student.guardianRelation || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-muted p-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="text-sm font-medium">
                            {student.guardianPhone || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-muted p-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-sm font-medium">
                            {student.guardianEmail || "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No guardian information provided
                    </p>
                  )}

                  {student.parentUser && (
                    <div className="mt-4 rounded-lg border bg-muted/30 p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Parent Account
                      </p>
                      <p className="text-sm font-medium">{student.parentUser.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {student.parentUser.email}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Academic Tab */}
            <TabsContent value="academic" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    {isSchool ? "Class Details" : "Batch Details"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isSchool && student.class ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-muted p-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Class</p>
                          <p className="text-sm font-medium">
                            {student.class.name}
                            {student.class.section ? ` - ${student.class.section}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-muted p-2">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Roll Number</p>
                          <p className="text-sm font-medium">{student.rollNo || "—"}</p>
                        </div>
                      </div>
                      {student.class.classTeacher && (
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg bg-muted p-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Class Teacher</p>
                            <p className="text-sm font-medium">
                              {student.class.classTeacher.name}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : !isSchool && student.batch ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-muted p-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Batch</p>
                          <p className="text-sm font-medium">{student.batch.name}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-muted p-2">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Roll Number</p>
                          <p className="text-sm font-medium">{student.rollNo || "—"}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No {isSchool ? "class" : "batch"} assigned yet
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Placeholder cards for upcoming features */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <ClipboardList className="h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-2 text-sm font-medium text-muted-foreground/70">
                      Attendance
                    </p>
                    <p className="text-xs text-muted-foreground/50">Coming in Week 5</p>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <GraduationCap className="h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-2 text-sm font-medium text-muted-foreground/70">
                      Marks & Results
                    </p>
                    <p className="text-xs text-muted-foreground/50">Coming in Week 5</p>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <DollarSign className="h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-2 text-sm font-medium text-muted-foreground/70">
                      Fee Payments
                    </p>
                    <p className="text-xs text-muted-foreground/50">Coming in Week 6</p>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <BookOpen className="h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-2 text-sm font-medium text-muted-foreground/70">
                      Homework
                    </p>
                    <p className="text-xs text-muted-foreground/50">Coming in Week 6</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Account Tab */}
            <TabsContent value="account" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Student Account</CardTitle>
                </CardHeader>
                <CardContent>
                  {student.user ? (
                    <div className="grid gap-3 sm:grid-cols-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Login Email:</span>{" "}
                        <span className="font-medium">{student.user.email}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>{" "}
                        <Badge
                          className={
                            student.user.isActive
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                          }
                        >
                          {student.user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Login:</span>{" "}
                        <span className="font-medium">
                          {student.user.lastLoginAt
                            ? new Date(student.user.lastLoginAt).toLocaleDateString("en-IN", {
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
                  ) : (
                    <div className="text-center py-6">
                      <User className="mx-auto h-8 w-8 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        No login account created for this student
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Record Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Created:</span>{" "}
                      <span className="font-medium">
                        {new Date(student.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

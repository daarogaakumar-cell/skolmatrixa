"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/shared/file-upload";
import { updateStaff } from "@/actions/staff";
import {
  ArrowLeft,
  Loader2,
  User,
  Briefcase,
  Shield,
} from "lucide-react";

interface StaffEditData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  staffProfile: {
    employeeId: string | null;
    designation: string | null;
    department: string | null;
    qualification: string | null;
    joiningDate: string | null;
    salary: unknown;
  } | null;
}

interface EditStaffClientProps {
  staff: StaffEditData;
}

export function EditStaffClient({ staff }: EditStaffClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(staff.name);
  const [phone, setPhone] = useState(staff.phone || "");
  const [role, setRole] = useState(staff.role);
  const [employeeId, setEmployeeId] = useState(staff.staffProfile?.employeeId || "");
  const [designation, setDesignation] = useState(staff.staffProfile?.designation || "");
  const [department, setDepartment] = useState(staff.staffProfile?.department || "");
  const [qualification, setQualification] = useState(staff.staffProfile?.qualification || "");
  const [joiningDate, setJoiningDate] = useState(
    staff.staffProfile?.joiningDate
      ? new Date(staff.staffProfile.joiningDate).toISOString().split("T")[0]
      : ""
  );
  const [salary, setSalary] = useState(
    staff.staffProfile?.salary ? String(staff.staffProfile.salary) : ""
  );
  const [avatarUrl, setAvatarUrl] = useState(staff.avatarUrl || "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    startTransition(async () => {
      const result = await updateStaff(staff.id, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        role: role as "VICE_ADMIN" | "TEACHER" | "ACCOUNTANT" | "LIBRARIAN",
        employeeId: employeeId.trim() || undefined,
        designation: designation.trim() || undefined,
        department: department.trim() || undefined,
        qualification: qualification.trim() || undefined,
        joiningDate: joiningDate || undefined,
        salary: salary ? parseFloat(salary) : undefined,
        avatarUrl: avatarUrl || undefined,
      });

      if (result.success) {
        toast.success("Staff profile updated successfully");
        router.push(`/dashboard/staff/${staff.id}`);
      } else {
        toast.error(result.error || "Failed to update staff profile");
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          nativeButton={false}
          render={<Link href={`/dashboard/staff/${staff.id}`} />}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Staff Member</h1>
          <p className="text-sm text-muted-foreground">
            Update profile for {staff.name}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Upload */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Profile Photo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload
              folder="staff-photos"
              accept="image/*"
              maxSizeMB={2}
              onUpload={(url) => setAvatarUrl(url)}
              currentUrl={avatarUrl || null}
              preview
            />
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={staff.email}
                disabled
                className="opacity-60"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g., 9876543210"
              />
            </div>
          </CardContent>
        </Card>

        {/* Role */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Role
            </CardTitle>
            <CardDescription>Change the staff member&apos;s role</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={role} onValueChange={(v) => v && setRole(v)}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TEACHER">Teacher</SelectItem>
                <SelectItem value="VICE_ADMIN">Vice Admin</SelectItem>
                <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                <SelectItem value="LIBRARIAN">Librarian</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Professional Details */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              Professional Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g., EMP-001"
              />
            </div>
            <div>
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g., Senior Teacher"
              />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g., Mathematics"
              />
            </div>
            <div>
              <Label htmlFor="qualification">Qualification</Label>
              <Input
                id="qualification"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="e.g., M.Sc., B.Ed."
              />
            </div>
            <div>
              <Label htmlFor="joiningDate">Joining Date</Label>
              <Input
                id="joiningDate"
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="salary">Salary (Monthly)</Label>
              <Input
                id="salary"
                type="number"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="e.g., 35000"
                min="0"
                step="100"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            nativeButton={false}
            render={<Link href={`/dashboard/staff/${staff.id}`} />}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/shared/file-upload";
import { createStudent, getNextAdmissionNo } from "@/actions/students";
import {
  ArrowLeft,
  Loader2,
  User,
  GraduationCap,
  Users,
  MapPin,
  KeyRound,
} from "lucide-react";

interface ClassOption {
  id: string;
  name: string;
  section: string | null;
}

interface BatchOption {
  id: string;
  name: string;
}

interface AddStudentClientProps {
  tenantType: string;
  classes: ClassOption[];
  batches: BatchOption[];
  nextAdmissionNo: string;
}

export function AddStudentClient({
  tenantType,
  classes,
  batches,
  nextAdmissionNo,
}: AddStudentClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isSchool = tenantType === "SCHOOL";

  // Personal
  const [admissionNo, setAdmissionNo] = useState(nextAdmissionNo);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<string>("");
  const [address, setAddress] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  // Academic
  const [classId, setClassId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [rollNo, setRollNo] = useState("");

  // Guardian
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [guardianRelation, setGuardianRelation] = useState("");

  // Account creation toggle
  const [createUserAccount, setCreateUserAccount] = useState(false);
  const [createParentAccount, setCreateParentAccount] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!admissionNo.trim() || !name.trim()) {
      toast.error("Admission number and name are required");
      return;
    }

    if (createUserAccount && !email.trim()) {
      toast.error("Email is required to create a student login account");
      return;
    }

    if (createParentAccount && !guardianEmail.trim()) {
      toast.error("Guardian email is required to create a parent account");
      return;
    }

    startTransition(async () => {
      const result = await createStudent({
        admissionNo: admissionNo.trim(),
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender as "MALE" | "FEMALE" | "OTHER" | undefined || undefined,
        address: address.trim() || undefined,
        photoUrl: photoUrl || undefined,
        classId: classId || undefined,
        batchId: batchId || undefined,
        rollNo: rollNo.trim() || undefined,
        guardianName: guardianName.trim() || undefined,
        guardianPhone: guardianPhone.trim() || undefined,
        guardianEmail: guardianEmail.trim() || undefined,
        guardianRelation: guardianRelation || undefined,
        createUserAccount,
        createParentAccount,
      });

      if (result.success) {
        toast.success("Student added successfully");
        router.push("/dashboard/students");
      } else {
        toast.error(result.error || "Failed to add student");
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" nativeButton={false} render={<Link href="/dashboard/students" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Student</h1>
          <p className="text-sm text-muted-foreground">
            Register a new student in the system
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Upload */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Student Photo
            </CardTitle>
            <CardDescription>Upload a passport-size photo (optional)</CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              folder="student-photos"
              accept="image/*"
              maxSizeMB={2}
              onUpload={(url) => setPhotoUrl(url)}
              currentUrl={photoUrl || null}
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
            <div>
              <Label htmlFor="admissionNo">Admission Number *</Label>
              <Input
                id="admissionNo"
                value={admissionNo}
                onChange={(e) => setAdmissionNo(e.target.value)}
                placeholder="e.g., ADM-001"
                required
              />
            </div>
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Priya Sharma"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., priya@example.com"
              />
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
            <div>
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select value={gender} onValueChange={(v) => v && setGender(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full residential address..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Academic Details */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              Academic Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {isSchool ? (
              <div>
                <Label htmlFor="class">Class</Label>
                <Select value={classId} onValueChange={(v) => v && setClassId(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {c.section ? ` - ${c.section}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label htmlFor="batch">Batch</Label>
                <Select value={batchId} onValueChange={(v) => v && setBatchId(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="rollNo">Roll Number</Label>
              <Input
                id="rollNo"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                placeholder="e.g., 01"
              />
            </div>
          </CardContent>
        </Card>

        {/* Guardian Details */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Guardian Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="guardianName">Guardian Name</Label>
              <Input
                id="guardianName"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                placeholder="e.g., Rajesh Sharma"
              />
            </div>
            <div>
              <Label htmlFor="guardianRelation">Relation</Label>
              <Select
                value={guardianRelation}
                onValueChange={(v) => v && setGuardianRelation(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select relation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Father">Father</SelectItem>
                  <SelectItem value="Mother">Mother</SelectItem>
                  <SelectItem value="Guardian">Guardian</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="guardianPhone">Guardian Phone</Label>
              <Input
                id="guardianPhone"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                placeholder="e.g., 9876543210"
              />
            </div>
            <div>
              <Label htmlFor="guardianEmail">Guardian Email</Label>
              <Input
                id="guardianEmail"
                type="email"
                value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)}
                placeholder="e.g., rajesh@example.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Creation Options */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              Login Accounts
            </CardTitle>
            <CardDescription>
              Optionally create login accounts for the student and/or guardian
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Create Student Login</p>
                <p className="text-xs text-muted-foreground">
                  Student can log in to view attendance, marks, homework etc.
                  {!email && " (Requires email)"}
                </p>
              </div>
              <Switch
                checked={createUserAccount}
                onCheckedChange={setCreateUserAccount}
                disabled={!email}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Create Parent Login</p>
                <p className="text-xs text-muted-foreground">
                  Guardian can log in to track their child&apos;s progress
                  {!guardianEmail && " (Requires guardian email)"}
                </p>
              </div>
              <Switch
                checked={createParentAccount}
                onCheckedChange={setCreateParentAccount}
                disabled={!guardianEmail}
              />
            </div>
            {(createUserAccount || createParentAccount) && (
              <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                Login credentials will be sent via email to the respective email addresses.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" nativeButton={false} render={<Link href="/dashboard/students" />}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Add Student
          </Button>
        </div>
      </form>
    </div>
  );
}

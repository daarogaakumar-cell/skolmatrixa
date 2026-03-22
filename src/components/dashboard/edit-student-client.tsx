"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/shared/file-upload";
import { updateStudent } from "@/actions/students";
import {
  ArrowLeft,
  Loader2,
  User,
  GraduationCap,
  Users,
  MapPin,
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

interface EditStudentData {
  id: string;
  admissionNo: string;
  name: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  photoUrl: string | null;
  classId: string | null;
  batchId: string | null;
  rollNo: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
  guardianRelation: string | null;
}

interface EditStudentClientProps {
  student: EditStudentData;
  tenantType: string;
  classes: ClassOption[];
  batches: BatchOption[];
}

export function EditStudentClient({
  student,
  tenantType,
  classes,
  batches,
}: EditStudentClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isSchool = tenantType === "SCHOOL";

  const [name, setName] = useState(student.name);
  const [email, setEmail] = useState(student.email || "");
  const [phone, setPhone] = useState(student.phone || "");
  const [dateOfBirth, setDateOfBirth] = useState(
    student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split("T")[0] : ""
  );
  const [gender, setGender] = useState(student.gender || "");
  const [address, setAddress] = useState(student.address || "");
  const [photoUrl, setPhotoUrl] = useState(student.photoUrl || "");
  const [classId, setClassId] = useState(student.classId || "");
  const [batchId, setBatchId] = useState(student.batchId || "");
  const [rollNo, setRollNo] = useState(student.rollNo || "");
  const [guardianName, setGuardianName] = useState(student.guardianName || "");
  const [guardianPhone, setGuardianPhone] = useState(student.guardianPhone || "");
  const [guardianEmail, setGuardianEmail] = useState(student.guardianEmail || "");
  const [guardianRelation, setGuardianRelation] = useState(student.guardianRelation || "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    startTransition(async () => {
      const result = await updateStudent(student.id, {
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
      });

      if (result.success) {
        toast.success("Student updated successfully");
        router.push(`/dashboard/students/${student.id}`);
      } else {
        toast.error(result.error || "Failed to update student");
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
          render={<Link href={`/dashboard/students/${student.id}`} />}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Student</h1>
          <p className="text-sm text-muted-foreground">
            Update details for {student.name} ({student.admissionNo})
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
              <Label htmlFor="admissionNo">Admission Number</Label>
              <Input
                id="admissionNo"
                value={student.admissionNo}
                disabled
                className="opacity-60"
              />
            </div>
            <div>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
                <Label>Class</Label>
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
                <Label>Batch</Label>
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
              />
            </div>
            <div>
              <Label>Relation</Label>
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
              />
            </div>
            <div>
              <Label htmlFor="guardianEmail">Guardian Email</Label>
              <Input
                id="guardianEmail"
                type="email"
                value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)}
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
            render={<Link href={`/dashboard/students/${student.id}`} />}
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

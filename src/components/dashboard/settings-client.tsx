"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { updateTenantProfile, getAcademicYears, createAcademicYear, setCurrentAcademicYear } from "@/actions/academic";
import { FileUpload } from "@/components/shared/file-upload";
import { Building2, Calendar, Loader2, Star, MessageCircle } from "lucide-react";

interface TenantProfile {
  id: string;
  name: string;
  slug: string;
  type: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  logoUrl: string | null;
  website: string | null;
  status: string;
  subscriptionPlan: string | null;
  maxStudents: number;
  maxStaff: number;
}

interface AcademicYear {
  id: string;
  name: string;
  startDate: string | Date;
  endDate: string | Date;
  isCurrent: boolean;
}

interface SettingsClientProps {
  tenant: TenantProfile;
  academicYears: AcademicYear[];
}

export function SettingsClient({ tenant, academicYears: initialYears }: SettingsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [academicYears, setAcademicYears] = useState(initialYears);

  // Profile form
  const [name, setName] = useState(tenant.name);
  const [phone, setPhone] = useState(tenant.phone || "");
  const [address, setAddress] = useState(tenant.address || "");
  const [city, setCity] = useState(tenant.city || "");
  const [state, setState] = useState(tenant.state || "");
  const [pincode, setPincode] = useState(tenant.pincode || "");
  const [website, setWebsite] = useState(tenant.website || "");
  const [logoUrl, setLogoUrl] = useState(tenant.logoUrl || "");

  // Academic year form
  const [yearName, setYearName] = useState("");
  const [yearStart, setYearStart] = useState("");
  const [yearEnd, setYearEnd] = useState("");


  function handleProfileSave() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    startTransition(async () => {
      const result = await updateTenantProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        pincode: pincode.trim() || undefined,
        website: website.trim() || undefined,
        logoUrl: logoUrl || undefined,
      });
      if (result.success) {
        toast.success("Profile updated");
      } else {
        toast.error("Failed to update profile");
      }
    });
  }

  function handleCreateYear() {
    if (!yearName.trim() || !yearStart || !yearEnd) {
      toast.error("All fields are required");
      return;
    }
    startTransition(async () => {
      const result = await createAcademicYear({
        name: yearName.trim(),
        startDate: yearStart,
        endDate: yearEnd,
      });
      if (result.success && "data" in result) {
        toast.success("Academic year created");
        const d = result.data as any;
        setAcademicYears([...academicYears, { id: d.id, name: d.name, startDate: d.startDate, endDate: d.endDate, isCurrent: false }]);
        setYearName("");
        setYearStart("");
        setYearEnd("");
      } else {
        toast.error(String((result as any).error || "Failed to create"));
      }
    });
  }

  function handleSetCurrent(yearId: string) {
    startTransition(async () => {
      const result = await setCurrentAcademicYear(yearId);
      if (result.success) {
        toast.success("Academic year set as current");
        setAcademicYears(
          academicYears.map((y) => ({
            ...y,
            isCurrent: y.id === yearId,
          }))
        );
      } else {
        toast.error(String((result as any).error || "Failed"));
      }
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your institution profile and academic years
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            <Building2 className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="academic">
            <Calendar className="mr-2 h-4 w-4" />
            Academic Years
          </TabsTrigger>
          <TabsTrigger value="whatsapp">
            <MessageCircle className="mr-2 h-4 w-4" />
            WhatsApp
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Institution Profile</CardTitle>
              <CardDescription>
                Update your institution&apos;s details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Logo</Label>
                <div className="mt-2">
                  <FileUpload
                    folder="logos"
                    accept="image/*"
                    maxSizeMB={2}
                    currentUrl={logoUrl}
                    onUpload={(url) => setLogoUrl(url)}
                    preview
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Institution Name *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                </div>
              </div>

              <div>
                <Label>Address</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address" />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>City</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div>
                  <Label>State</Label>
                  <Input value={state} onChange={(e) => setState(e.target.value)} />
                </div>
                <div>
                  <Label>Pincode</Label>
                  <Input value={pincode} onChange={(e) => setPincode(e.target.value)} />
                </div>
              </div>

              <div>
                <Label>Website</Label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
              </div>

              <Separator />

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Plan: <Badge variant="outline">{tenant.subscriptionPlan || "Free"}</Badge></span>
                <span>Max Students: {tenant.maxStudents}</span>
                <span>Max Staff: {tenant.maxStaff}</span>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleProfileSave} disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Years Tab */}
        <TabsContent value="academic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Academic Years</CardTitle>
              <CardDescription>Manage academic year periods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {academicYears.length > 0 ? (
                <div className="space-y-2">
                  {academicYears.map((year) => (
                    <div
                      key={year.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{year.name}</span>
                        {year.isCurrent && (
                          <Badge className="bg-emerald-500/10 text-emerald-600">
                            <Star className="mr-1 h-3 w-3" /> Current
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {new Date(year.startDate).toLocaleDateString()} â€”{" "}
                          {new Date(year.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      {!year.isCurrent && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetCurrent(year.id)}
                          disabled={isPending}
                        >
                          Set Current
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No academic years created yet.</p>
              )}

              <Separator />

              <div>
                <h4 className="mb-3 text-sm font-semibold">Add New Academic Year</h4>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={yearName}
                      onChange={(e) => setYearName(e.target.value)}
                      placeholder="e.g., 2025-26"
                    />
                  </div>
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={yearStart}
                      onChange={(e) => setYearStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={yearEnd}
                      onChange={(e) => setYearEnd(e.target.value)}
                    />
                  </div>
                </div>
                <Button className="mt-3" onClick={handleCreateYear} disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Year
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WhatsApp Tab */}
        <TabsContent value="whatsapp" className="space-y-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-green-100 p-5 text-green-600">
                <MessageCircle className="h-10 w-10" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">WhatsApp Notifications</h3>
              <div className="mb-3 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                Coming Soon
              </div>
              <p className="max-w-md text-sm text-muted-foreground">
                Send automated fee reminders, attendance alerts, exam schedules, and more directly to parents and students on WhatsApp. This feature is currently under development and will be available soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

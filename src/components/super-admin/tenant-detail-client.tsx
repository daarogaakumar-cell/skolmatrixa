"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { approveTenant, suspendTenant, activateTenant, updateTenantPlan } from "@/actions/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Building2, Users, GraduationCap, BookOpen, CheckCircle, Ban, Zap } from "lucide-react";
import { useState } from "react";

interface TenantDetail {
  id: string;
  name: string;
  slug: string;
  type: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  logoUrl: string | null;
  website: string | null;
  status: string;
  subscriptionPlan: string;
  maxStudents: number;
  maxStaff: number;
  setupCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: { students: number; users: number; classes: number; batches: number };
  users: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
  }[];
  recentLogs: {
    id: string;
    action: string;
    entityType: string | null;
    details: unknown;
    createdAt: Date;
    user: { name: string };
  }[];
}

export function TenantDetailClient({ tenant }: { tenant: TenantDetail }) {
  const router = useRouter();
  const [plan, setPlan] = useState(tenant.subscriptionPlan);

  async function handleAction(action: string) {
    let result;
    switch (action) {
      case "approve":
        result = await approveTenant(tenant.id);
        break;
      case "suspend":
        result = await suspendTenant(tenant.id);
        break;
      case "activate":
        result = await activateTenant(tenant.id);
        break;
      default:
        return;
    }
    if (result.success) {
      toast.success(result.message);
      router.refresh();
    }
  }

  async function handlePlanChange(newPlan: string) {
    setPlan(newPlan);
    const result = await updateTenantPlan(tenant.id, newPlan);
    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update plan");
      setPlan(tenant.subscriptionPlan);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/super-admin/tenants">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{tenant.name}</h1>
            <StatusBadge status={tenant.status} />
            <Badge variant="outline">
              {tenant.type === "SCHOOL" ? "School" : "Coaching Institute"}
            </Badge>
          </div>
          <p className="text-muted-foreground">{tenant.slug} • {tenant.email}</p>
        </div>
        <div className="flex gap-2">
          {tenant.status === "PENDING" && (
            <Button onClick={() => handleAction("approve")}>
              <CheckCircle className="mr-2 h-4 w-4" /> Approve
            </Button>
          )}
          {tenant.status === "ACTIVE" && (
            <Button variant="destructive" onClick={() => handleAction("suspend")}>
              <Ban className="mr-2 h-4 w-4" /> Suspend
            </Button>
          )}
          {tenant.status === "SUSPENDED" && (
            <Button onClick={() => handleAction("activate")}>
              <Zap className="mr-2 h-4 w-4" /> Activate
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={GraduationCap} label="Students" value={tenant._count.students} max={tenant.maxStudents} />
        <StatCard icon={Users} label="Users" value={tenant._count.users} max={tenant.maxStaff} />
        <StatCard icon={BookOpen} label="Classes" value={tenant._count.classes} />
        <StatCard icon={Building2} label="Batches" value={tenant._count.batches} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Institution Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Email" value={tenant.email} />
            <InfoRow label="Phone" value={tenant.phone || "—"} />
            <InfoRow label="Address" value={[tenant.address, tenant.city, tenant.state, tenant.pincode].filter(Boolean).join(", ") || "—"} />
            <InfoRow label="Website" value={tenant.website || "—"} />
            <InfoRow label="Setup Completed" value={tenant.setupCompleted ? "Yes" : "No"} />
            <InfoRow label="Created" value={new Date(tenant.createdAt).toLocaleDateString("en-US", { dateStyle: "long" })} />
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-muted-foreground">Subscription Plan</span>
              <Select value={plan} onValueChange={(v) => v && handlePlanChange(v)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">FREE</SelectItem>
                  <SelectItem value="BASIC">BASIC</SelectItem>
                  <SelectItem value="PRO">PRO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {tenant.recentLogs.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {tenant.recentLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p>
                        <span className="font-medium">{log.user.name}</span>{" "}
                        <span className="text-muted-foreground">{formatAction(log.action)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Users ({tenant.users.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenant.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{user.role.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "secondary"} className="text-xs">
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  max,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  max?: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">
            {value}
            {max !== undefined && <span className="text-sm font-normal text-muted-foreground">/{max}</span>}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
    ACTIVE: { variant: "default", label: "Active" },
    PENDING: { variant: "secondary", label: "Pending" },
    SUSPENDED: { variant: "destructive", label: "Suspended" },
  };
  const c = config[status] || { variant: "secondary" as const, label: status };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

function formatAction(action: string) {
  return action.toLowerCase().replace(/_/g, " ");
}

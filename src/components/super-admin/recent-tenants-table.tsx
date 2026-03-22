"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { approveTenant } from "@/actions/tenant";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  email: string;
  createdAt: Date;
  _count: { students: number; users: number };
}

export function RecentTenantsTable({ tenants }: { tenants: Tenant[] }) {
  const router = useRouter();

  if (!tenants.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No registrations yet</p>;
  }

  async function handleApprove(id: string) {
    const result = await approveTenant(id);
    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error("Failed to approve tenant");
    }
  }

  return (
    <div className="space-y-3">
      {tenants.map((tenant) => (
        <div key={tenant.id} className="flex items-center justify-between rounded-lg border p-3">
          <div className="min-w-0 flex-1">
            <Link href={`/super-admin/tenants/${tenant.id}`} className="font-medium hover:underline">
              {tenant.name}
            </Link>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {tenant.type === "SCHOOL" ? "School" : "Coaching"}
              </Badge>
              <StatusBadge status={tenant.status} />
              <span className="text-xs text-muted-foreground">
                {new Date(tenant.createdAt).toLocaleDateString('en-GB')}
              </span>
            </div>
          </div>
          {tenant.status === "PENDING" && (
            <Button size="sm" onClick={() => handleApprove(tenant.id)}>
              Approve
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    ACTIVE: "default",
    PENDING: "secondary",
    SUSPENDED: "destructive",
  };

  return (
    <Badge variant={variants[status] || "outline"} className="text-xs">
      {status}
    </Badge>
  );
}

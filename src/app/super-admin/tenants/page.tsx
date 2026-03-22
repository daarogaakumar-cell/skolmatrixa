import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TenantsClient } from "@/components/super-admin/tenants-client";

export default function ManageTenantsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tenant Management</h1>
        <p className="text-muted-foreground">Manage all registered schools and coaching institutes</p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <TenantsClient />
      </Suspense>
    </div>
  );
}

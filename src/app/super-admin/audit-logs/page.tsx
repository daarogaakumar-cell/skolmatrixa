import { Suspense } from "react";
import { getAuditLogs } from "@/actions/audit";
import { AuditLogsClient } from "@/components/super-admin/audit-logs-client";
import { Skeleton } from "@/components/ui/skeleton";

async function AuditLogsLoader() {
  const result = await getAuditLogs({ page: 1, pageSize: 50 });
  return <AuditLogsClient initialData={JSON.parse(JSON.stringify(result))} />;
}

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">Track all administrative actions across the platform</p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <AuditLogsLoader />
      </Suspense>
    </div>
  );
}

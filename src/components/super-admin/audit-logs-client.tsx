"use client";

import { useState, useTransition } from "react";
import { getAuditLogs } from "@/actions/audit";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: unknown;
  ipAddress: string | null;
  createdAt: string | Date;
  user: { name: string; email: string };
  tenant: { name: string; slug: string } | null;
}

interface AuditData {
  success: boolean;
  data?: AuditLog[];
  pagination?: { page: number; pageSize: number; total: number; totalPages: number };
  error?: string;
}

const ACTION_TYPES = [
  "ALL",
  "APPROVE_TENANT",
  "SUSPEND_TENANT",
  "ACTIVATE_TENANT",
  "DELETE_TENANT",
  "UPDATE_TENANT_PLAN",
  "CREATE_PLAN",
  "UPDATE_PLAN",
  "DELETE_PLAN",
  "UPDATE_GLOBAL_SETTINGS",
];

export function AuditLogsClient({ initialData }: { initialData: AuditData }) {
  const [data, setData] = useState(initialData);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isPending, startTransition] = useTransition();

  function fetchLogs(params: { page?: number; action?: string; dateFrom?: string; dateTo?: string }) {
    const p = params.page ?? page;
    const a = params.action ?? action;
    const df = params.dateFrom ?? dateFrom;
    const dt = params.dateTo ?? dateTo;

    startTransition(async () => {
      const result = await getAuditLogs({
        page: p,
        pageSize: 50,
        action: a !== "ALL" ? a : undefined,
        dateFrom: df || undefined,
        dateTo: dt || undefined,
      });
      setData(result as unknown as AuditData);
      setPage(p);
    });
  }

  function handleActionChange(value: string | null) {
    const v = value ?? "ALL";
    setAction(v);
    fetchLogs({ action: v, page: 1 });
  }

  const logs = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 p-4">
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Action Type</label>
            <Select value={action} onValueChange={handleActionChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a === "ALL" ? "All Actions" : a.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">From</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[160px]" />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">To</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[160px]" />
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchLogs({ page: 1 })}>
            <Search className="mr-1.5 h-3.5 w-3.5" /> Filter
          </Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{log.user.name}</div>
                      <div className="text-xs text-muted-foreground">{log.user.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-mono">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.entityType ? (
                        <span>
                          {log.entityType}
                          {log.entityId && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              ({log.entityId.slice(0, 8)}...)
                            </span>
                          )}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.tenant ? log.tenant.name : "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {log.details ? JSON.stringify(log.details) : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{pagination.total} total entries</p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isPending}
            onClick={() => fetchLogs({ page: page - 1 })}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {pagination.page} of {pagination.totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages || isPending}
            onClick={() => fetchLogs({ page: page + 1 })}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

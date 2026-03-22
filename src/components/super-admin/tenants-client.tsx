"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { getTenants, approveTenant, suspendTenant, activateTenant, deleteTenant } from "@/actions/tenant";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, MoreHorizontal, Eye, CheckCircle, Ban, Trash2, ChevronLeft, ChevronRight, Zap } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  type: string;
  email: string;
  status: string;
  subscriptionPlan: string;
  createdAt: string;
  _count: { students: number; users: number };
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function TenantsClient() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; tenantId: string; tenantName: string }>({
    open: false, tenantId: "", tenantName: "",
  });

  const fetchTenants = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const result = await getTenants({ page, status: statusFilter, type: typeFilter, search });
      setTenants(result.tenants as unknown as Tenant[]);
      setPagination(result.pagination);
    } catch {
      toast.error("Failed to load tenants");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, search]);

  useEffect(() => {
    fetchTenants(1);
  }, [fetchTenants]);

  async function handleAction(action: string, id: string) {
    let result;
    switch (action) {
      case "approve":
        result = await approveTenant(id);
        break;
      case "suspend":
        result = await suspendTenant(id);
        break;
      case "activate":
        result = await activateTenant(id);
        break;
      default:
        return;
    }
    if (result.success) {
      toast.success(result.message);
      fetchTenants(pagination.page);
      router.refresh();
    } else {
      toast.error("Action failed");
    }
  }

  async function handleDelete() {
    const result = await deleteTenant(deleteDialog.tenantId);
    if (result.success) {
      toast.success(result.message);
      setDeleteDialog({ open: false, tenantId: "", tenantName: "" });
      fetchTenants(pagination.page);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete");
    }
  }

  return (
    <>
      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="SCHOOL">School</SelectItem>
              <SelectItem value="COACHING_INSTITUTE">Coaching Institute</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-center">Students</TableHead>
                <TableHead className="text-center">Staff</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    No tenants found
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <Link href={`/super-admin/tenants/${tenant.id}`} className="font-medium hover:underline">
                        {tenant.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{tenant.email}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {tenant.type === "SCHOOL" ? "School" : "Coaching"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={tenant.status} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{tenant.subscriptionPlan}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{tenant._count.students}</TableCell>
                    <TableCell className="text-center">{tenant._count.users}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Link href={`/super-admin/tenants/${tenant.id}`} className="flex items-center">
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </Link>
                          </DropdownMenuItem>
                          {tenant.status === "PENDING" && (
                            <DropdownMenuItem onClick={() => handleAction("approve", tenant.id)}>
                              <CheckCircle className="mr-2 h-4 w-4" /> Approve
                            </DropdownMenuItem>
                          )}
                          {tenant.status === "SUSPENDED" && (
                            <DropdownMenuItem onClick={() => handleAction("activate", tenant.id)}>
                              <Zap className="mr-2 h-4 w-4" /> Activate
                            </DropdownMenuItem>
                          )}
                          {tenant.status === "ACTIVE" && (
                            <DropdownMenuItem onClick={() => handleAction("suspend", tenant.id)}>
                              <Ban className="mr-2 h-4 w-4" /> Suspend
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteDialog({ open: true, tenantId: tenant.id, tenantName: tenant.name })}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.pageSize + 1}–
                {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchTenants(pagination.page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchTenants(pagination.page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tenant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteDialog.tenantName}</strong>? This action cannot be undone.
              All associated data (students, staff, records) will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
    ACTIVE: { variant: "default", label: "Active" },
    PENDING: { variant: "secondary", label: "Pending" },
    SUSPENDED: { variant: "destructive", label: "Suspended" },
  };
  const c = config[status] || { variant: "secondary" as const, label: status };
  return <Badge variant={c.variant} className="text-xs">{c.label}</Badge>;
}

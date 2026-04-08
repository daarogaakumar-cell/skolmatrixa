"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  MessageCircle, ChevronLeft, ChevronRight, Loader2, Filter,
  CheckCircle2, XCircle, Clock, Eye, Send, BarChart3,
} from "lucide-react";
import { getWhatsAppLogs, getWhatsAppStats } from "@/actions/whatsapp";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  SENT: { label: "Sent", color: "bg-blue-100 text-blue-700", icon: Send },
  DELIVERED: { label: "Delivered", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  READ: { label: "Read", color: "bg-violet-100 text-violet-700", icon: Eye },
  FAILED: { label: "Failed", color: "bg-red-100 text-red-700", icon: XCircle },
};

const CATEGORY_LABELS: Record<string, string> = {
  FEE_REMINDER: "Fee Reminder",
  ATTENDANCE: "Attendance",
  EVENT: "Event",
  RESULT: "Result",
  GENERAL: "General",
  LIBRARY_DUE: "Library Due",
};

interface LogEntry {
  id: string;
  templateName: string;
  recipientPhone: string;
  recipientName: string | null;
  status: string;
  category: string | null;
  errorMessage: string | null;
  createdAt: string;
}

interface Stats {
  totalAll: number;
  totalMonth: number;
  totalToday: number;
  dailyLimit: number;
  remainingToday: number;
  monthlyBreakdown: { sent: number; delivered: number; read: number; failed: number };
  categoryBreakdown: Record<string, number>;
}

export function WhatsAppLogsClient() {
  const [isPending, startTransition] = useTransition();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, categoryFilter, startDate, endDate]);

  async function loadStats() {
    const result = await getWhatsAppStats();
    if (result.success && result.data) {
      setStats(result.data);
    }
  }

  function loadLogs() {
    setLoading(true);
    startTransition(async () => {
      const result = await getWhatsAppLogs({
        page,
        pageSize: 25,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      if (result.success && result.data) {
        setLogs(result.data);
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages);
          setTotal(result.pagination.total);
        }
      }
      setLoading(false);
    });
  }

  function resetFilters() {
    setStatusFilter("");
    setCategoryFilter("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }

  const deliveryRate = stats
    ? stats.totalMonth > 0
      ? Math.round(((stats.monthlyBreakdown.delivered + stats.monthlyBreakdown.read) / stats.totalMonth) * 100)
      : 0
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">WhatsApp Logs</h1>
        <p className="text-sm text-muted-foreground">
          Track all WhatsApp messages sent from your institution
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Today</p>
              <p className="text-2xl font-bold">{stats.totalToday}</p>
              <p className="text-xs text-muted-foreground mt-1">{stats.remainingToday} remaining</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold">{stats.totalMonth}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Delivery Rate</p>
              <p className="text-2xl font-bold">{deliveryRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Failed (Month)</p>
              <p className="text-2xl font-bold text-red-600">{stats.monthlyBreakdown.failed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">All Time</p>
              <p className="text-2xl font-bold">{stats.totalAll}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monthly Status Breakdown */}
      {stats && stats.totalMonth > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Monthly Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6">
              {Object.entries(stats.monthlyBreakdown).map(([key, value]) => {
                const cfg = STATUS_CONFIG[key.toUpperCase()];
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className={`rounded-full p-1.5 ${cfg?.color || "bg-gray-100"}`}>
                      {cfg?.icon && <cfg.icon className="h-3.5 w-3.5" />}
                    </div>
                    <div>
                      <span className="text-sm font-medium">{value}</span>
                      <span className="ml-1 text-xs text-muted-foreground">{cfg?.label || key}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {Object.keys(stats.categoryBreakdown).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(stats.categoryBreakdown).map(([cat, count]) => (
                  <Badge key={cat} variant="outline" className="text-xs">
                    {CATEGORY_LABELS[cat] || cat}: {count}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v ?? ""); setPage(1); }}>
              <SelectTrigger className="w-37.5">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter || "all"} onValueChange={(v) => { setCategoryFilter(v === "all" ? "" : v ?? ""); setPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-40"
              placeholder="From"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-40"
              placeholder="To"
            />

            {(statusFilter || categoryFilter || startDate || endDate) && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-4 w-4" /> Message Log
            </CardTitle>
            <span className="text-sm text-muted-foreground">{total} messages</span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No WhatsApp messages found</p>
              <p className="text-xs text-muted-foreground mt-1">Messages will appear here once sent</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const statusCfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.PENDING;
                      const StatusIcon = statusCfg.icon;
                      return (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{log.recipientName || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">{log.recipientPhone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{log.templateName.replace(/_/g, " ")}</span>
                          </TableCell>
                          <TableCell>
                            {log.category && (
                              <Badge variant="outline" className="text-xs">
                                {CATEGORY_LABELS[log.category] || log.category}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <div className={`rounded-full p-1 ${statusCfg.color}`}>
                                <StatusIcon className="h-3 w-3" />
                              </div>
                              <span className="text-xs">{statusCfg.label}</span>
                            </div>
                            {log.errorMessage && (
                              <p className="text-xs text-red-500 mt-0.5 max-w-50 truncate" title={log.errorMessage}>
                                {log.errorMessage}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1 || isPending}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages || isPending}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

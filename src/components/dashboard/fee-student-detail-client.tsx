"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Download,
  IndianRupee,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStudentFees, waiveFee } from "@/actions/fees";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";

type PaymentItem = {
  id: string;
  feeName: string;
  frequency: string;
  amountDue: number;
  amountPaid: number;
  discount: number;
  lateFee: number;
  balance: number;
  status: string;
  month: number | null;
  year: number | null;
  paymentDate: string | null;
  paymentMethod: string | null;
  receiptNo: string | null;
  notes: string | null;
  collectedBy: string | null;
  createdAt: string;
};

type FeeSummary = {
  totalDue: number;
  totalPaid: number;
  totalDiscount: number;
  totalLateFee: number;
  totalBalance: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
};

type StudentInfo = {
  name: string;
  admissionNo: string;
  className?: string | null;
  batchName?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  PAID: { label: "Paid", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle2 },
  PARTIAL: { label: "Partial", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  PENDING: { label: "Pending", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Clock },
  OVERDUE: { label: "Overdue", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: AlertTriangle },
  WAIVED: { label: "Waived", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400", icon: XCircle },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

interface FeeStudentDetailClientProps {
  studentId: string;
  studentBasic: StudentInfo;
}

export function FeeStudentDetailClient({
  studentId,
  studentBasic,
}: FeeStudentDetailClientProps) {
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  // Waive
  const [showWaiveDialog, setShowWaiveDialog] = useState(false);
  const [waivingId, setWaivingId] = useState<string | null>(null);
  const [waiveReason, setWaiveReason] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchFees = async () => {
      setLoading(true);
      const result = await getStudentFees(studentId);
      if (!cancelled && result.success && result.data) {
        const data = result.data as { payments: PaymentItem[]; summary: FeeSummary };
        setPayments(data.payments);
        setSummary(data.summary);
      }
      if (!cancelled) setLoading(false);
    };
    fetchFees();
    return () => { cancelled = true; };
  }, [studentId, refreshKey]);

  function handleWaive() {
    if (!waivingId || !waiveReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    startTransition(async () => {
      const result = await waiveFee(waivingId, waiveReason);
      if (result.success) {
        toast.success("Fee waived");
        setShowWaiveDialog(false);
        setWaivingId(null);
        setWaiveReason("");
        setRefreshKey((k) => k + 1);
      } else {
        toast.error(result.error || "Failed to waive");
      }
    });
  }

  const filteredPayments =
    filter === "ALL"
      ? payments
      : payments.filter((p) => p.status === filter);

  const collectionRate =
    summary && summary.totalDue > 0
      ? Math.round((summary.totalPaid / summary.totalDue) * 100)
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="shrink-0" nativeButton={false} render={<Link href="/dashboard/fees/collect" />}>
            <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">
            {studentBasic.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {studentBasic.admissionNo} •{" "}
            {studentBasic.className || studentBasic.batchName}
            {studentBasic.guardianName && ` • Guardian: ${studentBasic.guardianName}`}
          </p>
        </div>
        <Button size="sm" nativeButton={false} render={<Link href={`/dashboard/fees/collect?student=${studentId}`} />}>
            <CreditCard className="mr-1.5 h-4 w-4" />
            Collect Fee
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-linear-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-background">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <IndianRupee className="h-4 w-4" />
                <span className="text-xs font-medium">Total Due</span>
              </div>
              <p className="text-xl font-bold">{formatCurrency(summary.totalDue)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-linear-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-background">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-medium">Paid</span>
              </div>
              <p className="text-xl font-bold text-emerald-600">
                {formatCurrency(summary.totalPaid)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-linear-to-br from-red-50 to-white dark:from-red-950/30 dark:to-background">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs font-medium">Balance</span>
              </div>
              <p className={cn("text-xl font-bold", summary.totalBalance > 0 ? "text-red-600" : "text-emerald-600")}>
                {formatCurrency(summary.totalBalance)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-linear-to-br from-purple-50 to-white dark:from-purple-950/30 dark:to-background">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">Collection Rate</span>
              </div>
              <p className="text-xl font-bold text-purple-600">{collectionRate}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { value: "ALL", label: "All" },
          { value: "PENDING", label: "Pending" },
          { value: "OVERDUE", label: "Overdue" },
          { value: "PARTIAL", label: "Partial" },
          { value: "PAID", label: "Paid" },
          { value: "WAIVED", label: "Waived" },
        ].map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
            {f.value !== "ALL" && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                {f.value === "ALL"
                  ? payments.length
                  : payments.filter((p) => p.status === f.value).length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Fee Records ({filteredPayments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <IndianRupee className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No fee records found
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-xs uppercase text-muted-foreground">
                    <th className="text-left py-2 px-2">Fee Type</th>
                    <th className="text-left py-2 px-2 hidden sm:table-cell">Period</th>
                    <th className="text-right py-2 px-2">Due</th>
                    <th className="text-right py-2 px-2 hidden md:table-cell">Paid</th>
                    <th className="text-right py-2 px-2 hidden md:table-cell">Late Fee</th>
                    <th className="text-right py-2 px-2 hidden md:table-cell">Discount</th>
                    <th className="text-right py-2 px-2">Balance</th>
                    <th className="text-center py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2 hidden lg:table-cell">Receipt</th>
                    <th className="text-left py-2 px-2 hidden lg:table-cell">Date</th>
                    <th className="text-right py-2 px-2 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => {
                    const sc = STATUS_CONFIG[p.status];
                    return (
                      <tr
                        key={p.id}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-2.5 px-2 text-sm font-medium">
                          {p.feeName}
                        </td>
                        <td className="py-2.5 px-2 text-sm text-muted-foreground hidden sm:table-cell">
                          {p.month && p.year
                            ? new Date(p.year, p.month - 1).toLocaleDateString("en-US", {
                                month: "short",
                                year: "numeric",
                              })
                            : "One-time"}
                        </td>
                        <td className="py-2.5 px-2 text-right text-sm">
                          {formatCurrency(p.amountDue)}
                        </td>
                        <td className="py-2.5 px-2 text-right text-sm text-emerald-600 hidden md:table-cell">
                          {formatCurrency(p.amountPaid)}
                        </td>
                        <td className="py-2.5 px-2 text-right text-sm hidden md:table-cell">
                          {p.lateFee > 0 ? (
                            <span className="text-red-600">+{formatCurrency(p.lateFee)}</span>
                          ) : "—"}
                        </td>
                        <td className="py-2.5 px-2 text-right text-sm hidden md:table-cell">
                          {p.discount > 0 ? formatCurrency(p.discount) : "—"}
                        </td>
                        <td className="py-2.5 px-2 text-right text-sm font-semibold">
                          {formatCurrency(p.balance)}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {sc && (
                            <Badge
                              variant="secondary"
                              className={cn("text-xs", sc.color)}
                            >
                              {sc.label}
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-sm hidden lg:table-cell">
                          {p.receiptNo ? (
                            <Link
                              href={`/api/receipts/${p.id}`}
                              target="_blank"
                              className="text-primary hover:underline font-mono text-xs"
                            >
                              {p.receiptNo}
                            </Link>
                          ) : "—"}
                        </td>
                        <td className="py-2.5 px-2 text-sm text-muted-foreground hidden lg:table-cell">
                          {p.paymentDate
                            ? format(new Date(p.paymentDate), "dd MMM yy")
                            : "—"}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {p.receiptNo && (
                              <Button
                                nativeButton={false}
                                render={<Link href={`/api/receipts/${p.id}`} target="_blank" />}
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                              >
                                  <Download className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {["PENDING", "PARTIAL", "OVERDUE"].includes(p.status) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => {
                                  setWaivingId(p.id);
                                  setShowWaiveDialog(true);
                                }}
                              >
                                Waive
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Waive Dialog */}
      <Dialog open={showWaiveDialog} onOpenChange={setShowWaiveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Waive Fee</DialogTitle>
            <DialogDescription>
              This fee will be marked as waived.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label>Reason *</Label>
            <Input
              placeholder="e.g., Financial hardship, scholarship..."
              value={waiveReason}
              onChange={(e) => setWaiveReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowWaiveDialog(false);
                setWaivingId(null);
                setWaiveReason("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleWaive} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Waive Fee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

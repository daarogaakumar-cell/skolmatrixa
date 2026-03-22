"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Download,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getMyFees } from "@/actions/fees";
import Link from "next/link";
import { format } from "date-fns";

type FeeRecord = {
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
};

type FeeSummary = {
  totalDue: number;
  totalPaid: number;
  totalBalance: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
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

export function MyFeesClient() {
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [tab, setTab] = useState<"pending" | "paid" | "all">("pending");

  useEffect(() => {
    const fetchFees = async () => {
      setLoading(true);
      const result = await getMyFees();
      if (result.success && result.data) {
        const data = result.data as { payments: FeeRecord[]; summary: FeeSummary };
        setFees(data.payments);
        setSummary(data.summary);
      }
      setLoading(false);
    };
    fetchFees();
  }, []);

  const pendingFees = fees.filter((f) =>
    ["PENDING", "PARTIAL", "OVERDUE"].includes(f.status)
  );
  const paidFees = fees.filter((f) => f.status === "PAID" || f.status === "WAIVED");

  const displayFees =
    tab === "pending" ? pendingFees : tab === "paid" ? paidFees : fees;

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Fees</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          View your fee details and payment history
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-linear-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-background">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <IndianRupee className="h-4 w-4" />
                <span className="text-xs font-medium">Total Fees</span>
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
                <span className="text-xs font-medium">Pending</span>
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
                <span className="text-xs font-medium">Paid %</span>
              </div>
              <p className="text-xl font-bold text-purple-600">{collectionRate}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overdue Alert */}
      {summary && summary.overdueCount > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
          <CardContent className="py-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">
              You have{" "}
              <span className="font-semibold">{summary.overdueCount} overdue</span>{" "}
              fee(s). Please contact the administration for payment.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {([
          { value: "pending", label: "Pending", count: pendingFees.length },
          { value: "paid", label: "Paid", count: paidFees.length },
          { value: "all", label: "All", count: fees.length },
        ] as const).map((t) => (
          <Button
            key={t.value}
            variant={tab === t.value ? "default" : "outline"}
            size="sm"
            onClick={() => setTab(t.value)}
          >
            {t.label}
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
              {t.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Fee List */}
      {displayFees.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
            <p className="text-sm font-medium">
              {tab === "pending"
                ? "No pending fees! You're all caught up."
                : "No records found."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {displayFees.map((fee) => {
            const sc = STATUS_CONFIG[fee.status];
            const StatusIcon = sc?.icon || Clock;
            return (
              <Card
                key={fee.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                        fee.status === "PAID" && "bg-emerald-100 dark:bg-emerald-900/40",
                        fee.status === "OVERDUE" && "bg-red-100 dark:bg-red-900/40",
                        fee.status === "PENDING" && "bg-blue-100 dark:bg-blue-900/40",
                        fee.status === "PARTIAL" && "bg-amber-100 dark:bg-amber-900/40",
                        fee.status === "WAIVED" && "bg-gray-100 dark:bg-gray-900/40"
                      )}
                    >
                      <StatusIcon
                        className={cn(
                          "h-5 w-5",
                          fee.status === "PAID" && "text-emerald-600",
                          fee.status === "OVERDUE" && "text-red-600",
                          fee.status === "PENDING" && "text-blue-600",
                          fee.status === "PARTIAL" && "text-amber-600",
                          fee.status === "WAIVED" && "text-gray-600"
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{fee.feeName}</h3>
                        {sc && (
                          <Badge
                            variant="secondary"
                            className={cn("text-xs", sc.color)}
                          >
                            {sc.label}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {fee.month && fee.year
                          ? new Date(fee.year, fee.month - 1).toLocaleDateString("en-US", {
                              month: "long",
                              year: "numeric",
                            })
                          : "One-time fee"}{" "}
                        • {fee.frequency}
                      </p>
                      {fee.paymentDate && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Paid on {format(new Date(fee.paymentDate), "dd MMM yyyy")}
                          {fee.paymentMethod && ` via ${fee.paymentMethod.replace("_", " ")}`}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold">{formatCurrency(fee.amountDue)}</p>
                      {fee.balance > 0 && (
                        <p className="text-xs text-red-600 mt-0.5">
                          Due: {formatCurrency(fee.balance)}
                        </p>
                      )}
                      {fee.discount > 0 && (
                        <p className="text-xs text-emerald-600">
                          Discount: {formatCurrency(fee.discount)}
                        </p>
                      )}
                      {fee.receiptNo && (
                        <Button
                          nativeButton={false}
                          render={<Link href={`/api/receipts/${fee.id}`} target="_blank" />}
                          variant="ghost"
                          size="sm"
                          className="h-7 mt-1 text-xs"
                        >
                            <Download className="mr-1 h-3 w-3" />
                            Receipt
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

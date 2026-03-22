"use client";

import { useState, useTransition, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  ArrowLeft,
  Loader2,
  User,
  Receipt,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CreditCard,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  searchStudentsForFees,
  getStudentFees,
  recordPayment,
  waiveFee,
} from "@/actions/fees";
import Link from "next/link";
import { format } from "date-fns";

type StudentBasic = {
  id: string;
  name: string;
  admissionNo: string;
  photoUrl: string | null;
  className: string | null;
  batchName: string | null;
};

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

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  PAID: { label: "Paid", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle2 },
  PARTIAL: { label: "Partial", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  PENDING: { label: "Pending", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Clock },
  OVERDUE: { label: "Overdue", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: AlertTriangle },
  WAIVED: { label: "Waived", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400", icon: XCircle },
};

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "ONLINE", label: "Online" },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function FeeCollectClient() {
  const [isPending, startTransition] = useTransition();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StudentBasic[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Selected student
  const [selectedStudent, setSelectedStudent] = useState<StudentBasic | null>(null);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [studentData, setStudentData] = useState<Record<string, any> | null>(null);
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [loadingFees, setLoadingFees] = useState(false);

  // Payment form
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amountPaying: "",
    discount: "0",
    discountReason: "",
    paymentMethod: "CASH",
    paymentDate: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  });

  // Waive dialog
  const [showWaiveDialog, setShowWaiveDialog] = useState(false);
  const [waivingId, setWaivingId] = useState<string | null>(null);
  const [waiveReason, setWaiveReason] = useState("");

  // Receipt dialog
  const [receiptInfo, setReceiptInfo] = useState<{
    receiptNo: string;
    studentName: string;
    totalPaid: number;
  } | null>(null);

  // Debounced search
  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (query.length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }
      setSearchLoading(true);
      setShowResults(true);
      const result = await searchStudentsForFees(query);
      if (result.success && result.data) {
        setSearchResults(result.data as StudentBasic[]);
      }
      setSearchLoading(false);
    },
    []
  );

  async function selectStudent(student: StudentBasic) {
    setSelectedStudent(student);
    setSearchQuery(student.name);
    setShowResults(false);
    setLoadingFees(true);
    setSelectedPaymentIds([]);

    const result = await getStudentFees(student.id);
    if (result.success && result.data) {
      const data = result.data as { payments: PaymentItem[]; summary: FeeSummary; student: Record<string, unknown> };
      setPayments(data.payments);
      setSummary(data.summary);
      setStudentData(data.student as Record<string, any>); // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    setLoadingFees(false);
  }

  function togglePaymentSelection(id: string) {
    setSelectedPaymentIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function openPaymentDialog() {
    const selectedItems = payments.filter(
      (p) => selectedPaymentIds.includes(p.id) && ["PENDING", "PARTIAL", "OVERDUE"].includes(p.status)
    );
    const totalBalance = selectedItems.reduce((sum, p) => sum + p.balance, 0);
    setPaymentForm({
      ...paymentForm,
      amountPaying: String(Math.max(totalBalance, 0)),
      discount: "0",
      discountReason: "",
      notes: "",
    });
    setShowPaymentDialog(true);
  }

  function handleRecordPayment() {
    if (!selectedStudent) return;
    const amount = Number(paymentForm.amountPaying);
    if (amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    startTransition(async () => {
      const result = await recordPayment({
        studentId: selectedStudent.id,
        feePaymentIds: selectedPaymentIds,
        amountPaying: amount,
        discount: Number(paymentForm.discount) || 0,
        discountReason: paymentForm.discountReason || undefined,
        paymentMethod: paymentForm.paymentMethod,
        paymentDate: paymentForm.paymentDate,
        notes: paymentForm.notes || undefined,
      });
      if (result.success && result.data) {
        const data = result.data as { receiptNo: string; studentName: string; totalPaid: number };
        toast.success(`Payment recorded! Receipt: ${data.receiptNo}`);
        setShowPaymentDialog(false);
        setReceiptInfo(data);
        setSelectedPaymentIds([]);
        // Reload student fees
        selectStudent(selectedStudent);
      } else {
        toast.error(result.error || "Failed to record payment");
      }
    });
  }

  function handleWaive() {
    if (!waivingId || !waiveReason.trim()) {
      toast.error("Please provide a reason for waiving");
      return;
    }
    startTransition(async () => {
      const result = await waiveFee(waivingId, waiveReason);
      if (result.success) {
        toast.success("Fee waived successfully");
        setShowWaiveDialog(false);
        setWaivingId(null);
        setWaiveReason("");
        if (selectedStudent) selectStudent(selectedStudent);
      } else {
        toast.error(result.error || "Failed to waive fee");
      }
    });
  }

  const pendingPayments = payments.filter((p) =>
    ["PENDING", "PARTIAL", "OVERDUE"].includes(p.status)
  );
  const paidPayments = payments.filter(
    (p) => p.status === "PAID" || p.status === "WAIVED"
  );
  const selectablePayments = pendingPayments.filter(
    (p) => selectedPaymentIds.includes(p.id)
  );
  const totalSelected = selectablePayments.reduce(
    (sum, p) => sum + p.balance,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="shrink-0" nativeButton={false} render={<Link href="/dashboard/fees" />}>
            <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Collect Fee</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Search for a student and record their fee payment
          </p>
        </div>
      </div>

      {/* Student Search */}
      <Card>
        <CardContent className="pt-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search student by name or admission number..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() =>
                searchResults.length > 0 && setShowResults(true)
              }
            />
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-50 max-h-64 overflow-auto">
                {searchLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((student) => (
                    <button
                      key={student.id}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                      onClick={() => selectStudent(student)}
                    >
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {student.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {student.admissionNo} •{" "}
                          {student.className || student.batchName}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No students found
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Student Info & Fees */}
      {selectedStudent && (
        <>
          {/* Student Info Ribbon */}
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg">{selectedStudent.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedStudent.admissionNo} •{" "}
                  {selectedStudent.className || selectedStudent.batchName}
                  {studentData?.guardianName && ` • Guardian: ${studentData.guardianName}`}
                </p>
              </div>
              {summary && (
                <div className="hidden sm:flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Total Due</p>
                    <p className="font-bold">{formatCurrency(summary.totalDue)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Paid</p>
                    <p className="font-bold text-emerald-600">
                      {formatCurrency(summary.totalPaid)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className={cn("font-bold", summary.totalBalance > 0 ? "text-red-600" : "text-emerald-600")}>
                      {formatCurrency(summary.totalBalance)}
                    </p>
                  </div>
                </div>
              )}
              <Button variant="outline" size="sm" className="shrink-0" nativeButton={false} render={<Link href={`/dashboard/fees/${selectedStudent.id}`} />}>
                  Full Details
              </Button>
            </CardContent>
          </Card>

          {loadingFees ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Pending Fees */}
              {pendingPayments.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold">
                        Pending Fees ({pendingPayments.length})
                      </CardTitle>
                      {selectedPaymentIds.length > 0 && (
                        <Button size="sm" onClick={openPaymentDialog}>
                          <CreditCard className="mr-1.5 h-4 w-4" />
                          Pay Selected ({formatCurrency(totalSelected)})
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b text-xs uppercase text-muted-foreground">
                            <th className="text-left py-2 pr-2 w-8"></th>
                            <th className="text-left py-2 px-2">Fee Type</th>
                            <th className="text-left py-2 px-2 hidden sm:table-cell">Period</th>
                            <th className="text-right py-2 px-2">Amount</th>
                            <th className="text-right py-2 px-2 hidden md:table-cell">Paid</th>
                            <th className="text-right py-2 px-2 hidden md:table-cell">Late Fee</th>
                            <th className="text-right py-2 px-2">Balance</th>
                            <th className="text-center py-2 px-2">Status</th>
                            <th className="text-right py-2 pl-2 w-16"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingPayments.map((payment) => {
                            const statusConf = STATUS_CONFIG[payment.status];
                            return (
                              <tr
                                key={payment.id}
                                className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                              >
                                <td className="py-2.5 pr-2">
                                  <Checkbox
                                    checked={selectedPaymentIds.includes(payment.id)}
                                    onCheckedChange={() => togglePaymentSelection(payment.id)}
                                  />
                                </td>
                                <td className="py-2.5 px-2">
                                  <span className="font-medium text-sm">
                                    {payment.feeName}
                                  </span>
                                </td>
                                <td className="py-2.5 px-2 text-sm text-muted-foreground hidden sm:table-cell">
                                  {payment.month && payment.year
                                    ? new Date(
                                        payment.year,
                                        payment.month - 1
                                      ).toLocaleDateString("en-US", {
                                        month: "short",
                                        year: "numeric",
                                      })
                                    : "One-time"}
                                </td>
                                <td className="py-2.5 px-2 text-right text-sm">
                                  {formatCurrency(payment.amountDue)}
                                </td>
                                <td className="py-2.5 px-2 text-right text-sm hidden md:table-cell">
                                  {formatCurrency(payment.amountPaid)}
                                </td>
                                <td className="py-2.5 px-2 text-right text-sm hidden md:table-cell">
                                  {payment.lateFee > 0 ? (
                                    <span className="text-red-600">
                                      +{formatCurrency(payment.lateFee)}
                                    </span>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                                <td className="py-2.5 px-2 text-right text-sm font-semibold">
                                  {formatCurrency(payment.balance)}
                                </td>
                                <td className="py-2.5 px-2 text-center">
                                  {statusConf && (
                                    <Badge
                                      variant="secondary"
                                      className={cn("text-xs", statusConf.color)}
                                    >
                                      {statusConf.label}
                                    </Badge>
                                  )}
                                </td>
                                <td className="py-2.5 pl-2 text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                      setWaivingId(payment.id);
                                      setShowWaiveDialog(true);
                                    }}
                                  >
                                    Waive
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Paid Fees */}
              {paidPayments.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">
                      Payment History ({paidPayments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b text-xs uppercase text-muted-foreground">
                            <th className="text-left py-2 px-2">Fee Type</th>
                            <th className="text-left py-2 px-2 hidden sm:table-cell">Period</th>
                            <th className="text-right py-2 px-2">Amount</th>
                            <th className="text-right py-2 px-2 hidden md:table-cell">Discount</th>
                            <th className="text-left py-2 px-2 hidden md:table-cell">Method</th>
                            <th className="text-left py-2 px-2 hidden lg:table-cell">Receipt</th>
                            <th className="text-left py-2 px-2 hidden lg:table-cell">Date</th>
                            <th className="text-center py-2 px-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paidPayments.map((payment) => {
                            const statusConf = STATUS_CONFIG[payment.status];
                            return (
                              <tr
                                key={payment.id}
                                className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                              >
                                <td className="py-2.5 px-2 text-sm font-medium">
                                  {payment.feeName}
                                </td>
                                <td className="py-2.5 px-2 text-sm text-muted-foreground hidden sm:table-cell">
                                  {payment.month && payment.year
                                    ? new Date(
                                        payment.year,
                                        payment.month - 1
                                      ).toLocaleDateString("en-US", {
                                        month: "short",
                                        year: "numeric",
                                      })
                                    : "One-time"}
                                </td>
                                <td className="py-2.5 px-2 text-right text-sm text-emerald-600 font-medium">
                                  {formatCurrency(payment.amountPaid)}
                                </td>
                                <td className="py-2.5 px-2 text-right text-sm text-muted-foreground hidden md:table-cell">
                                  {payment.discount > 0
                                    ? formatCurrency(payment.discount)
                                    : "—"}
                                </td>
                                <td className="py-2.5 px-2 text-sm hidden md:table-cell">
                                  {payment.paymentMethod?.replace("_", " ") || "—"}
                                </td>
                                <td className="py-2.5 px-2 text-sm hidden lg:table-cell">
                                  {payment.receiptNo ? (
                                    <Link
                                      href={`/api/receipts/${payment.id}`}
                                      target="_blank"
                                      className="text-primary hover:underline text-xs"
                                    >
                                      {payment.receiptNo}
                                    </Link>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                                <td className="py-2.5 px-2 text-sm text-muted-foreground hidden lg:table-cell">
                                  {payment.paymentDate
                                    ? format(new Date(payment.paymentDate), "dd MMM yyyy")
                                    : "—"}
                                </td>
                                <td className="py-2.5 px-2 text-center">
                                  {statusConf && (
                                    <Badge
                                      variant="secondary"
                                      className={cn("text-xs", statusConf.color)}
                                    >
                                      {statusConf.label}
                                    </Badge>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No Fees State */}
              {payments.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <IndianRupee className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No fee records found for this student. Generate fees from the Fee Structure page first.
                    </p>
                    <Button variant="outline" size="sm" className="mt-3" nativeButton={false} render={<Link href="/dashboard/fees/structure" />}>
                      Go to Fee Structure
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}

      {/* Record Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Recording payment for {selectedStudent?.name} — {selectedPaymentIds.length} fee(s) selected
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Total Balance</span>
              <span className="text-lg font-bold">{formatCurrency(totalSelected)}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amountPaying">Amount Paying (₹) *</Label>
                <Input
                  id="amountPaying"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={paymentForm.amountPaying}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, amountPaying: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="discount">Discount (₹)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentForm.discount}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, discount: e.target.value })
                  }
                />
              </div>
            </div>
            {Number(paymentForm.discount) > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="discountReason">Discount Reason</Label>
                <Input
                  id="discountReason"
                  placeholder="e.g., Scholarship, Sibling Discount..."
                  value={paymentForm.discountReason}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, discountReason: e.target.value })
                  }
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select
                  value={paymentForm.paymentMethod}
                  onValueChange={(v) =>
                    v && setPaymentForm({ ...paymentForm, paymentMethod: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="paymentDate">Payment Date *</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, paymentDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="Any additional notes..."
                value={paymentForm.notes}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, notes: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Waive Fee Dialog */}
      <Dialog open={showWaiveDialog} onOpenChange={setShowWaiveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Waive Fee</DialogTitle>
            <DialogDescription>
              This fee will be marked as waived and no payment will be required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="waiveReason">Reason *</Label>
            <Input
              id="waiveReason"
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

      {/* Receipt Success Dialog */}
      <Dialog
        open={!!receiptInfo}
        onOpenChange={() => setReceiptInfo(null)}
      >
        <DialogContent className="sm:max-w-md text-center">
          <div className="flex flex-col items-center py-4">
            <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Payment Recorded!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Receipt: <span className="font-mono font-medium">{receiptInfo?.receiptNo}</span>
            </p>
            <p className="text-2xl font-bold text-emerald-600 mb-6">
              {receiptInfo && formatCurrency(receiptInfo.totalPaid)}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setReceiptInfo(null)}>
                Close
              </Button>
              <Button nativeButton={false} render={
                <Link
                  href={`/api/receipts/${selectedPaymentIds[0] || ""}`}
                  target="_blank"
                />
              }>
                <Receipt className="mr-1.5 h-4 w-4" />
                Download Receipt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

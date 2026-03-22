"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  Power,
  PowerOff,
  ArrowLeft,
  Loader2,
  Zap,
  IndianRupee,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  getFeeStructures,
  generateFeesForStudents,
} from "@/actions/fees";
import Link from "next/link";

interface ClassOption {
  id: string;
  name: string;
  section: string | null;
}

interface BatchOption {
  id: string;
  name: string;
}

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}

interface FeeStructureData {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  className: string | null;
  classId: string | null;
  batchName: string | null;
  batchId: string | null;
  academicYear: string;
  academicYearId: string;
  dueDay: number;
  lateFee: number;
  isActive: boolean;
  paymentCount: number;
  createdAt: string;
}

interface FeeStructureClientProps {
  tenantType: string;
  classes: ClassOption[];
  batches: BatchOption[];
  academicYears: AcademicYear[];
}

const FREQUENCIES = [
  { value: "ONE_TIME", label: "One-Time" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "HALF_YEARLY", label: "Half-Yearly" },
  { value: "YEARLY", label: "Yearly" },
];

const FREQUENCY_COLORS: Record<string, string> = {
  ONE_TIME: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  MONTHLY: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  QUARTERLY: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  HALF_YEARLY: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  YEARLY: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function FeeStructureClient({
  tenantType,
  classes,
  batches,
  academicYears,
}: FeeStructureClientProps) {
  const [isPending, startTransition] = useTransition();
  const [structures, setStructures] = useState<FeeStructureData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Form state
  const [form, setForm] = useState({
    name: "",
    amount: "",
    frequency: "MONTHLY",
    classId: "",
    batchId: "",
    dueDay: "1",
    lateFee: "0",
    academicYearId: "",
  });

  // Generate form state
  const [generateMonth, setGenerateMonth] = useState(
    String(new Date().getMonth() + 1)
  );
  const [generateYear, setGenerateYear] = useState(
    String(new Date().getFullYear())
  );

  const isSchool = tenantType === "SCHOOL";
  const currentYear = academicYears.find((y) => y.isCurrent);

  useEffect(() => {
    const fetchStructures = async () => {
      setLoading(true);
      const result = await getFeeStructures();
      if (result.success && result.data) {
        setStructures(result.data as FeeStructureData[]);
      }
      setLoading(false);
    };
    fetchStructures();
  }, [refreshKey]);

  function loadStructures() {
    setRefreshKey((k) => k + 1);
  }

  function resetForm() {
    setForm({
      name: "",
      amount: "",
      frequency: "MONTHLY",
      classId: "",
      batchId: "",
      dueDay: "1",
      lateFee: "0",
      academicYearId: currentYear?.id || "",
    });
    setEditingId(null);
  }

  function handleEdit(structure: FeeStructureData) {
    setForm({
      name: structure.name,
      amount: String(structure.amount),
      frequency: structure.frequency,
      classId: structure.classId || "",
      batchId: structure.batchId || "",
      dueDay: String(structure.dueDay),
      lateFee: String(structure.lateFee),
      academicYearId: structure.academicYearId,
    });
    setEditingId(structure.id);
    setShowDialog(true);
  }

  function handleDuplicate(structure: FeeStructureData) {
    setForm({
      name: `${structure.name} (Copy)`,
      amount: String(structure.amount),
      frequency: structure.frequency,
      classId: structure.classId || "",
      batchId: structure.batchId || "",
      dueDay: String(structure.dueDay),
      lateFee: String(structure.lateFee),
      academicYearId: structure.academicYearId,
    });
    setEditingId(null);
    setShowDialog(true);
  }

  function handleSubmit() {
    if (!form.name || !form.amount || Number(form.amount) <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    startTransition(async () => {
      const payload = {
        name: form.name,
        amount: Number(form.amount),
        frequency: form.frequency,
        classId: form.classId || undefined,
        batchId: form.batchId || undefined,
        dueDay: Number(form.dueDay),
        lateFee: Number(form.lateFee),
        academicYearId: form.academicYearId || undefined,
      };

      const result = editingId
        ? await updateFeeStructure(editingId, payload)
        : await createFeeStructure(payload);

      if (result.success) {
        toast.success(
          editingId ? "Fee structure updated" : "Fee structure created"
        );
        setShowDialog(false);
        resetForm();
        loadStructures();
      } else {
        toast.error(result.error || "Operation failed");
      }
    });
  }

  function handleDelete() {
    if (!deletingId) return;
    startTransition(async () => {
      const result = await deleteFeeStructure(deletingId);
      if (result.success) {
        toast.success("Fee structure deleted");
        setShowDeleteDialog(false);
        setDeletingId(null);
        loadStructures();
      } else {
        toast.error(result.error || "Failed to delete");
      }
    });
  }

  function handleToggleActive(id: string, isActive: boolean) {
    startTransition(async () => {
      const result = await updateFeeStructure(id, { isActive: !isActive });
      if (result.success) {
        toast.success(isActive ? "Fee structure deactivated" : "Fee structure activated");
        loadStructures();
      } else {
        toast.error(result.error || "Failed to update");
      }
    });
  }

  function handleGenerate() {
    if (!generatingId) return;
    startTransition(async () => {
      const result = await generateFeesForStudents({
        feeStructureId: generatingId,
        month: Number(generateMonth),
        year: Number(generateYear),
      });
      if (result.success) {
        toast.success(result.message || "Fees generated successfully");
        setShowGenerateDialog(false);
        setGeneratingId(null);
      } else {
        toast.error(result.error || "Failed to generate fees");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="shrink-0" nativeButton={false} render={<Link href="/dashboard/fees" />}>
              <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Fee Structure</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Define fee types, amounts, and schedules
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => {
            resetForm();
            setShowDialog(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add Fee Type
        </Button>
      </div>

      {/* Fee Structure Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : structures.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <IndianRupee className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No fee structures yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              Create your first fee structure to start tracking payments from students.
            </p>
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setShowDialog(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Create Fee Structure
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {structures.map((structure) => (
            <Card
              key={structure.id}
              className={cn(
                "relative group transition-all hover:shadow-md",
                !structure.isActive && "opacity-60"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold truncate">
                      {structure.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          FREQUENCY_COLORS[structure.frequency]
                        )}
                      >
                        {structure.frequency.replace("_", " ")}
                      </Badge>
                      {!structure.isActive && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      />}>
                        <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(structure)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(structure)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setGeneratingId(structure.id);
                          setShowGenerateDialog(true);
                        }}
                      >
                        <Zap className="mr-2 h-4 w-4" />
                        Generate Fees
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleToggleActive(structure.id, structure.isActive)
                        }
                      >
                        {structure.isActive ? (
                          <>
                            <PowerOff className="mr-2 h-4 w-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Power className="mr-2 h-4 w-4" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setDeletingId(structure.id);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="text-3xl font-bold tracking-tight">
                  {formatCurrency(structure.amount)}
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Applies to</span>
                    <span className="font-medium">
                      {structure.className || structure.batchName || "All"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due Day</span>
                    <span className="font-medium">{structure.dueDay}th of month</span>
                  </div>
                  {structure.lateFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Late Fee</span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {formatCurrency(structure.lateFee)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Academic Year</span>
                    <span className="font-medium">{structure.academicYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Generated</span>
                    <span className="font-medium">{structure.paymentCount} payments</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Fee Structure" : "Create Fee Structure"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the fee structure details"
                : "Define a new fee type for your institution"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Fee Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Tuition Fee, Lab Fee, Sports Fee"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="frequency">Frequency *</Label>
                <Select
                  value={form.frequency}
                  onValueChange={(v) => v && setForm({ ...form, frequency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Applicable To</Label>
              {isSchool ? (
                <Select
                  value={form.classId || "all"}
                  onValueChange={(v) =>
                    setForm({ ...form, classId: v === "all" ? "" : (v ?? ""), batchId: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {c.section ? ` - ${c.section}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={form.batchId || "all"}
                  onValueChange={(v) =>
                    setForm({ ...form, batchId: v === "all" ? "" : (v ?? ""), classId: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All batches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Batches</SelectItem>
                    {batches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dueDay">Due Day of Month</Label>
                <Input
                  id="dueDay"
                  type="number"
                  min="1"
                  max="28"
                  value={form.dueDay}
                  onChange={(e) => setForm({ ...form, dueDay: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lateFee">Late Fee (₹)</Label>
                <Input
                  id="lateFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.lateFee}
                  onChange={(e) => setForm({ ...form, lateFee: e.target.value })}
                />
              </div>
            </div>
            {academicYears.length > 1 && (
              <div className="grid gap-2">
                <Label>Academic Year</Label>
                <Select
                  value={form.academicYearId || currentYear?.id || ""}
                  onValueChange={(v) =>
                    v && setForm({ ...form, academicYearId: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((y) => (
                      <SelectItem key={y.id} value={y.id}>
                        {y.name} {y.isCurrent ? "(Current)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Fee Structure</DialogTitle>
            <DialogDescription>
              Are you sure? This will also remove any pending (unpaid) fee records.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeletingId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Fees Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Fees for Students</DialogTitle>
            <DialogDescription>
              This will create pending fee records for all eligible students who
              don&apos;t already have one for this period.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="grid gap-2">
              <Label>Month</Label>
              <Select value={generateMonth} onValueChange={(v) => v && setGenerateMonth(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {new Date(2000, i).toLocaleDateString("en-US", {
                        month: "long",
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Year</Label>
              <Select value={generateYear} onValueChange={(v) => v && setGenerateYear(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2025, 2026, 2027].map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowGenerateDialog(false);
                setGeneratingId(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Fees
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

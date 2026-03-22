"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  IndianRupee,
  Loader2,
  Settings2,
  Receipt,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getLibraryPricing,
  upsertLibraryPricing,
  getPendingFees,
  collectLibraryFee,
  generateBulkFees,
  sendFeeReminders,
  getMemberFees,
  getMembers,
} from "@/actions/library";

/* eslint-disable @typescript-eslint/no-explicit-any */

type Tab = "pending" | "pricing" | "history";

export function LibraryFeesClient() {
  const [tab, setTab] = useState<Tab>("pending");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Pending fees
  const [pendingFees, setPendingFees] = useState<any[]>([]);

  // Pricing
  const [pricing, setPricing] = useState<any[]>([]);
  const [pricingForm, setPricingForm] = useState({ slotType: "FULL_DAY", name: "", amount: "", duration: "MONTHLY", description: "" });

  // Bulk generate form
  const [bulkSlotType, setBulkSlotType] = useState("FULL_DAY");

  // Fee history search
  const [historyMemberId, setHistoryMemberId] = useState("");
  const [memberSearchQ, setMemberSearchQ] = useState("");
  const [memberResults, setMemberResults] = useState<any[]>([]);
  const [feeHistory, setFeeHistory] = useState<any[]>([]);
  const [selectedMemberName, setSelectedMemberName] = useState("");

  async function loadPendingFees() {
    setLoading(true);
    const res = await getPendingFees();
    if (res.success) setPendingFees((res.data as any[]) || []);
    setLoading(false);
  }

  async function loadPricing() {
    setLoading(true);
    const res = await getLibraryPricing();
    if (res.success) setPricing((res.data as any[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    if (tab === "pending") loadPendingFees();
    else if (tab === "pricing") loadPricing();
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCollectFee(feeId: string, method: string) {
    setSubmitting(true);
    const fee = pendingFees.find((f: any) => f.id === feeId);
    const due = fee ? Number(fee.amount) - Number(fee.amountPaid || 0) - Number(fee.discount || 0) : 0;
    const res = await collectLibraryFee({
      feeId,
      amountPaying: due,
      paymentMethod: method as any,
    });
    if (res.success) {
      setSuccess("Fee collected successfully!");
      loadPendingFees();
    } else {
      setError(res.error || "Failed to collect");
    }
    setSubmitting(false);
    setTimeout(() => { setSuccess(""); setError(""); }, 3000);
  }

  async function handleSavePricing(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await upsertLibraryPricing({
      slotType: pricingForm.slotType as any,
      name: pricingForm.name || `${pricingForm.slotType === "FULL_DAY" ? "Full Day" : "Half Day"} Plan`,
      amount: Number(pricingForm.amount),
      duration: pricingForm.duration || undefined,
      description: pricingForm.description || undefined,
    });
    if (res.success) {
      setSuccess("Pricing saved!");
      loadPricing();
      setPricingForm({ slotType: "FULL_DAY", name: "", amount: "", duration: "MONTHLY", description: "" });
    } else {
      setError(res.error || "Failed");
    }
    setSubmitting(false);
    setTimeout(() => { setSuccess(""); setError(""); }, 3000);
  }

  async function handleGenerateBulk() {
    if (!confirm("Generate monthly fees for all active members with this slot type?")) return;
    setSubmitting(true);
    const now = new Date();
    const res = await generateBulkFees({
      slotType: bulkSlotType as any,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });
    if (res.success) {
      const data = res.data as any;
      setSuccess(`Generated: ${data?.generated || 0}, Skipped: ${data?.skipped || 0}`);
      loadPendingFees();
    } else {
      setError(res.error || "Failed");
    }
    setSubmitting(false);
    setTimeout(() => { setSuccess(""); setError(""); }, 3000);
  }

  async function handleSendReminders() {
    setSubmitting(true);
    const res = await sendFeeReminders();
    if (res.success) {
      setSuccess(`Reminders sent to ${(res as any).sentCount || 0} members`);
    } else {
      setError(res.error || "Failed");
    }
    setSubmitting(false);
    setTimeout(() => { setSuccess(""); setError(""); }, 3000);
  }

  async function searchMembersForHistory(query: string) {
    setMemberSearchQ(query);
    if (query.length < 2) { setMemberResults([]); return; }
    const res = await getMembers({ search: query, pageSize: 10 });
    if (res.success) setMemberResults((res.data as any[]) || []);
  }

  async function loadFeeHistory(memberId: string) {
    setLoading(true);
    const res = await getMemberFees(memberId);
    if (res.success) {
      const data = res.data as any;
      setFeeHistory(data?.fees || []);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fee Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage pricing, collect fees, and send reminders</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleSendReminders} disabled={submitting}>
            <Mail className="mr-1.5 h-4 w-4" /> Send Reminders
          </Button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{success}</div>}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {([["pending", "Pending Fees"], ["pricing", "Pricing Setup"], ["history", "Fee History"]] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
              tab === key ? "border-amber-500 text-amber-700" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Pending Fees Tab */}
      {tab === "pending" && (
        <div className="space-y-4">
          {/* Generate Bulk Fees */}
          <Card className="border-dashed">
            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium">Generate Monthly Fees</p>
                <p className="text-xs text-muted-foreground">Create fee entries for all active members of a slot type</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {["FULL_DAY", "HALF_DAY"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setBulkSlotType(s)}
                      className={cn("px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                        bulkSlotType === s ? "border-amber-400 bg-amber-50 text-amber-700" : "hover:bg-muted"
                      )}
                    >
                      {s === "FULL_DAY" ? "Full Day" : "Half Day"}
                    </button>
                  ))}
                </div>
                <Button size="sm" onClick={handleGenerateBulk} disabled={submitting}>
                  <Receipt className="mr-1.5 h-4 w-4" /> Generate
                </Button>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : pendingFees.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
              <p className="mt-3 text-sm text-muted-foreground">No pending fees! All caught up.</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Member</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Due Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Collect</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingFees.map((fee: any) => {
                    const overdue = new Date(fee.dueDate) < new Date();
                    return (
                      <tr key={fee.id} className={cn("border-t hover:bg-muted/30", overdue && "bg-red-50/50")}>
                        <td className="px-4 py-3">
                          <p className="font-medium">{fee.member?.name}</p>
                          <p className="text-xs text-muted-foreground">{fee.member?.memberId}</p>
                        </td>
                        <td className="px-4 py-3 text-xs">{fee.description}</td>
                        <td className="px-4 py-3 font-semibold">₹{Number(fee.amount)}</td>
                        <td className="px-4 py-3 text-xs">
                          <span className={cn(overdue && "text-red-600 font-medium")}>
                            {new Date(fee.dueDate).toLocaleDateString("en-IN")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-full",
                            overdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                          )}>
                            {fee.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleCollectFee(fee.id, "CASH")} disabled={submitting} className="rounded bg-emerald-100 px-2 py-1 text-[10px] font-medium text-emerald-700 hover:bg-emerald-200">Cash</button>
                            <button onClick={() => handleCollectFee(fee.id, "UPI")} disabled={submitting} className="rounded bg-blue-100 px-2 py-1 text-[10px] font-medium text-blue-700 hover:bg-blue-200">UPI</button>
                            <button onClick={() => handleCollectFee(fee.id, "ONLINE")} disabled={submitting} className="rounded bg-violet-100 px-2 py-1 text-[10px] font-medium text-violet-700 hover:bg-violet-200">Online</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pricing Tab */}
      {tab === "pricing" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Current Pricing</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : pricing.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No pricing configured yet</p>
              ) : (
                <div className="space-y-3">
                  {pricing.map((p: any) => (
                    <div key={p.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full",
                          p.slotType === "FULL_DAY" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {p.slotType === "FULL_DAY" ? "Full Day" : "Half Day"}
                        </span>
                        <button onClick={() => setPricingForm({
                          slotType: p.slotType,
                          name: p.name,
                          amount: String(Number(p.amount)),
                          duration: p.duration || "MONTHLY",
                          description: p.description || "",
                        })} className="text-xs text-amber-600 hover:underline">Edit</button>
                      </div>
                      <div className="text-xs space-y-1">
                        <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{p.name}</span></div>
                        <div><span className="text-muted-foreground">Amount:</span> <span className="font-semibold">₹{Number(p.amount)}</span></div>
                        <div><span className="text-muted-foreground">Duration:</span> <span className="font-medium">{p.duration}</span></div>
                        {p.description && <div><span className="text-muted-foreground">Note:</span> {p.description}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-amber-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Settings2 className="h-4 w-4" /> Set Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePricing} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Slot Type *</Label>
                  <div className="flex gap-2">
                    {["FULL_DAY", "HALF_DAY"].map((s) => (
                      <button key={s} type="button" onClick={() => setPricingForm({ ...pricingForm, slotType: s })}
                        className={cn("flex-1 rounded-lg border py-2 text-xs font-medium transition-colors",
                          pricingForm.slotType === s ? "border-amber-400 bg-amber-50 text-amber-700" : "hover:bg-muted"
                        )}>
                        {s === "FULL_DAY" ? "Full Day" : "Half Day"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Plan Name *</Label>
                    <Input required value={pricingForm.name} onChange={(e) => setPricingForm({ ...pricingForm, name: e.target.value })} className="h-9" placeholder="e.g., Full Day Plan" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Amount (₹) *</Label>
                    <Input type="number" required value={pricingForm.amount} onChange={(e) => setPricingForm({ ...pricingForm, amount: e.target.value })} className="h-9" placeholder="e.g., 2000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Duration</Label>
                    <Input value={pricingForm.duration} onChange={(e) => setPricingForm({ ...pricingForm, duration: e.target.value })} className="h-9" placeholder="MONTHLY" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Description</Label>
                    <Input value={pricingForm.description} onChange={(e) => setPricingForm({ ...pricingForm, description: e.target.value })} className="h-9" placeholder="Optional notes" />
                  </div>
                </div>
                <Button type="submit" size="sm" disabled={submitting || !pricingForm.amount || !pricingForm.name} className="w-full">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <IndianRupee className="h-4 w-4 mr-1.5" />}
                  Save Pricing
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fee History Tab */}
      {tab === "history" && (
        <div className="space-y-4">
          <div className="max-w-md space-y-1.5">
            <Label className="text-xs">Search Member</Label>
            <Input value={memberSearchQ} onChange={(e) => searchMembersForHistory(e.target.value)} placeholder="Name, email, or member ID..." className="h-9" />
            {selectedMemberName && <p className="text-xs text-emerald-600 font-medium">Showing fees for: {selectedMemberName}</p>}
            {memberResults.length > 0 && (
              <div className="border rounded-lg max-h-32 overflow-y-auto">
                {memberResults.map((m: any) => (
                  <button key={m.id} type="button"
                    onClick={() => {
                      setHistoryMemberId(m.id);
                      setSelectedMemberName(`${m.name} (${m.memberId})`);
                      setMemberSearchQ(m.name);
                      setMemberResults([]);
                      loadFeeHistory(m.id);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50"
                  >
                    {m.name} <span className="text-muted-foreground">({m.memberId})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {historyMemberId && (
            loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : feeHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No fee records found for this member</p>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Due Date</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Paid Date</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Method</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Receipt</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeHistory.map((fee: any) => (
                      <tr key={fee.id} className="border-t hover:bg-muted/30">
                        <td className="px-4 py-3 text-xs">{fee.description}</td>
                        <td className="px-4 py-3 font-semibold">₹{Number(fee.amount)}</td>
                        <td className="px-4 py-3 text-xs">{new Date(fee.dueDate).toLocaleDateString("en-IN")}</td>
                        <td className="px-4 py-3 text-xs">{fee.paidDate ? new Date(fee.paidDate).toLocaleDateString("en-IN") : "—"}</td>
                        <td className="px-4 py-3 text-xs">{fee.paymentMethod || "—"}</td>
                        <td className="px-4 py-3 text-xs font-mono">{fee.receiptNumber || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-full",
                            fee.status === "PAID" ? "bg-emerald-50 text-emerald-700" :
                            fee.status === "OVERDUE" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                          )}>
                            {fee.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

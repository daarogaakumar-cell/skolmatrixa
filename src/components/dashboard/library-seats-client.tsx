"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Armchair,
  Plus,
  Wifi,
  WifiOff,
  Zap,
  ZapOff,
  Loader2,
  Trash2,
  Edit2,
  X,
  UserPlus,
  UserMinus,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getSeats,
  createSeat,
  createBulkSeats,
  updateSeat,
  deleteSeat,
  allocateSeat,
  deallocateSeat,
  getMembers,
} from "@/actions/library";
import type { SlotType } from "@/generated/prisma/client";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function LibrarySeatManagementClient() {
  const [loading, setLoading] = useState(true);
  const [seats, setSeats] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [showAllocateForm, setShowAllocateForm] = useState<string | null>(null);
  const [editingSeat, setEditingSeat] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Add form state
  const [newSeat, setNewSeat] = useState({ seatNumber: "", zone: "", floor: "", hasWifi: true, hasPower: true });
  const [bulkData, setBulkData] = useState({ prefix: "S-", startNumber: 1, count: 10, zone: "", floor: "" });

  // Allocate form state
  const [members, setMembers] = useState<any[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [allocateData, setAllocateData] = useState({ memberId: "", slotType: "FULL_DAY" as SlotType, startDate: "", endDate: "" });

  async function loadSeats() {
    setLoading(true);
    const res = await getSeats(statusFilter ? { status: statusFilter } : undefined);
    if (res.success) setSeats((res.data as any[]) || []);
    setLoading(false);
  }

  useEffect(() => { loadSeats(); }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAddSeat(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await createSeat(newSeat);
    if (res.success) {
      setShowAddForm(false);
      setNewSeat({ seatNumber: "", zone: "", floor: "", hasWifi: true, hasPower: true });
      loadSeats();
    } else {
      setError(res.error || "Failed");
    }
    setSubmitting(false);
  }

  async function handleBulkAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await createBulkSeats(bulkData);
    if (res.success) {
      setShowBulkForm(false);
      loadSeats();
    } else {
      setError(res.error || "Failed");
    }
    setSubmitting(false);
  }

  async function handleDeleteSeat(id: string) {
    if (!confirm("Are you sure?")) return;
    const res = await deleteSeat(id);
    if (res.success) loadSeats();
    else alert(res.error || "Failed to delete");
  }

  async function handleAllocate(e: React.FormEvent) {
    e.preventDefault();
    if (!showAllocateForm || !allocateData.memberId) return;
    setSubmitting(true);
    setError("");
    const res = await allocateSeat({ seatId: showAllocateForm, ...allocateData });
    if (res.success) {
      setShowAllocateForm(null);
      setAllocateData({ memberId: "", slotType: "FULL_DAY", startDate: "", endDate: "" });
      loadSeats();
    } else {
      setError(res.error || "Failed");
    }
    setSubmitting(false);
  }

  async function handleDeallocate(allocationId: string) {
    if (!confirm("Deallocate this seat?")) return;
    const res = await deallocateSeat(allocationId);
    if (res.success) loadSeats();
    else alert(res.error || "Failed");
  }

  async function searchMembers(search: string) {
    setMemberSearch(search);
    if (search.length < 2) { setMembers([]); return; }
    const res = await getMembers({ search, pageSize: 10 });
    if (res.success) setMembers((res.data as any[]) || []);
  }

  const filteredSeats = seats.filter((s: any) =>
    !filter || s.seatNumber.toLowerCase().includes(filter.toLowerCase()) || s.zone?.toLowerCase().includes(filter.toLowerCase())
  );

  const statusCounts = {
    all: seats.length,
    available: seats.filter((s: any) => s.status === "AVAILABLE").length,
    occupied: seats.filter((s: any) => s.status === "OCCUPIED").length,
    maintenance: seats.filter((s: any) => s.status === "MAINTENANCE").length,
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Seat Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage library seats and allocations</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setShowBulkForm(true); setShowAddForm(false); }}>
            <Plus className="mr-1.5 h-4 w-4" /> Bulk Add
          </Button>
          <Button size="sm" onClick={() => { setShowAddForm(true); setShowBulkForm(false); }}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Seat
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search seats..." value={filter} onChange={(e) => setFilter(e.target.value)} className="pl-9 h-9" />
        </div>
        <div className="flex gap-1.5">
          {(["", "AVAILABLE", "OCCUPIED", "MAINTENANCE"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
                statusFilter === status
                  ? "bg-amber-100 text-amber-800"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {status || "All"} ({status === "" ? statusCounts.all : status === "AVAILABLE" ? statusCounts.available : status === "OCCUPIED" ? statusCounts.occupied : statusCounts.maintenance})
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Add Single Seat Form */}
      {showAddForm && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Add New Seat</CardTitle>
              <button onClick={() => setShowAddForm(false)}><X className="h-4 w-4" /></button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddSeat} className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Seat Number *</Label>
                <Input required value={newSeat.seatNumber} onChange={(e) => setNewSeat({ ...newSeat, seatNumber: e.target.value })} placeholder="A-01" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Zone</Label>
                <Input value={newSeat.zone} onChange={(e) => setNewSeat({ ...newSeat, zone: e.target.value })} placeholder="Quiet Zone" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Floor</Label>
                <Input value={newSeat.floor} onChange={(e) => setNewSeat({ ...newSeat, floor: e.target.value })} placeholder="Ground" className="h-9" />
              </div>
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={newSeat.hasWifi} onChange={(e) => setNewSeat({ ...newSeat, hasWifi: e.target.checked })} /> WiFi</label>
                <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={newSeat.hasPower} onChange={(e) => setNewSeat({ ...newSeat, hasPower: e.target.checked })} /> Power</label>
              </div>
              <div className="flex items-end">
                <Button type="submit" size="sm" disabled={submitting} className="w-full">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Seat"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Bulk Add Form */}
      {showBulkForm && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Bulk Add Seats</CardTitle>
              <button onClick={() => setShowBulkForm(false)}><X className="h-4 w-4" /></button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBulkAdd} className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Prefix *</Label>
                <Input required value={bulkData.prefix} onChange={(e) => setBulkData({ ...bulkData, prefix: e.target.value })} placeholder="S-" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Start Number *</Label>
                <Input type="number" min={1} required value={bulkData.startNumber} onChange={(e) => setBulkData({ ...bulkData, startNumber: parseInt(e.target.value) || 1 })} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Count *</Label>
                <Input type="number" min={1} max={100} required value={bulkData.count} onChange={(e) => setBulkData({ ...bulkData, count: parseInt(e.target.value) || 1 })} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Zone</Label>
                <Input value={bulkData.zone} onChange={(e) => setBulkData({ ...bulkData, zone: e.target.value })} className="h-9" />
              </div>
              <div className="flex items-end">
                <Button type="submit" size="sm" disabled={submitting} className="w-full">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Add ${bulkData.count} Seats`}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Allocate Seat Form */}
      {showAllocateForm && (
        <Card className="border-amber-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Allocate Seat</CardTitle>
              <button onClick={() => setShowAllocateForm(null)}><X className="h-4 w-4" /></button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAllocate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Search Member *</Label>
                  <Input value={memberSearch} onChange={(e) => searchMembers(e.target.value)} placeholder="Name, email, or member ID..." className="h-9" />
                  {members.length > 0 && (
                    <div className="border rounded-lg max-h-32 overflow-y-auto">
                      {members.map((m: any) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => { setAllocateData({ ...allocateData, memberId: m.id }); setMemberSearch(m.name); setMembers([]); }}
                          className={cn("w-full text-left px-3 py-2 text-sm hover:bg-muted/50", allocateData.memberId === m.id && "bg-amber-50")}
                        >
                          {m.name} <span className="text-muted-foreground">({m.memberId})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Slot Type *</Label>
                  <select
                    value={allocateData.slotType}
                    onChange={(e) => setAllocateData({ ...allocateData, slotType: e.target.value as SlotType })}
                    className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="FULL_DAY">Full Day</option>
                    <option value="HALF_DAY_MORNING">Half Day (Morning)</option>
                    <option value="HALF_DAY_EVENING">Half Day (Evening)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Start Date *</Label>
                  <Input type="date" required value={allocateData.startDate} onChange={(e) => setAllocateData({ ...allocateData, startDate: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">End Date *</Label>
                  <Input type="date" required value={allocateData.endDate} onChange={(e) => setAllocateData({ ...allocateData, endDate: e.target.value })} className="h-9" />
                </div>
                <div className="flex items-end">
                  <Button type="submit" size="sm" disabled={submitting || !allocateData.memberId} className="w-full">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Allocate"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Seats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filteredSeats.map((seat: any) => {
          const alloc = seat.currentAllocation;
          return (
            <Card
              key={seat.id}
              className={cn(
                "relative overflow-hidden transition-all",
                seat.status === "AVAILABLE" && "border-emerald-200 hover:border-emerald-400",
                seat.status === "OCCUPIED" && "border-amber-200 bg-amber-50/40",
                seat.status === "MAINTENANCE" && "border-red-200 bg-red-50/40",
                seat.status === "RESERVED" && "border-blue-200 bg-blue-50/40"
              )}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Armchair className={cn(
                      "h-4 w-4",
                      seat.status === "AVAILABLE" ? "text-emerald-600" :
                      seat.status === "OCCUPIED" ? "text-amber-600" : "text-red-500"
                    )} />
                    <span className="font-semibold text-sm">{seat.seatNumber}</span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                    seat.status === "AVAILABLE" ? "bg-emerald-100 text-emerald-700" :
                    seat.status === "OCCUPIED" ? "bg-amber-100 text-amber-700" :
                    seat.status === "MAINTENANCE" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                  )}>
                    {seat.status}
                  </span>
                </div>

                <div className="flex gap-1.5 mb-2">
                  {seat.hasWifi ? <Wifi className="h-3 w-3 text-blue-500" /> : <WifiOff className="h-3 w-3 text-muted-foreground" />}
                  {seat.hasPower ? <Zap className="h-3 w-3 text-amber-500" /> : <ZapOff className="h-3 w-3 text-muted-foreground" />}
                  {seat.zone && <span className="text-[10px] text-muted-foreground truncate">{seat.zone}</span>}
                </div>

                {alloc && (
                  <div className="text-[10px] bg-amber-50 rounded p-1.5 mb-2">
                    <p className="font-medium truncate">{alloc.member?.name}</p>
                    <p className="text-muted-foreground">{alloc.slotType.replace(/_/g, " ")}</p>
                  </div>
                )}

                <div className="flex gap-1">
                  {seat.status === "AVAILABLE" && (
                    <button
                      onClick={() => setShowAllocateForm(seat.id)}
                      className="flex-1 flex items-center justify-center gap-1 rounded bg-amber-100 px-2 py-1 text-[10px] font-medium text-amber-700 hover:bg-amber-200"
                    >
                      <UserPlus className="h-3 w-3" /> Assign
                    </button>
                  )}
                  {alloc && (
                    <button
                      onClick={() => handleDeallocate(alloc.id)}
                      className="flex-1 flex items-center justify-center gap-1 rounded bg-red-100 px-2 py-1 text-[10px] font-medium text-red-700 hover:bg-red-200"
                    >
                      <UserMinus className="h-3 w-3" /> Free
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteSeat(seat.id)}
                    className="flex items-center justify-center rounded bg-muted px-2 py-1 text-[10px] text-muted-foreground hover:bg-red-100 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredSeats.length === 0 && (
        <div className="text-center py-16">
          <Armchair className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No seats found. Add your first seat to get started.</p>
        </div>
      )}
    </div>
  );
}

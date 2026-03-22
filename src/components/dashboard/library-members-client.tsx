"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  Plus,
  Search,
  Loader2,
  Eye,
  Mail,
  Phone,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getMembers, createMember, updateMember, deleteMember, issueIdCard } from "@/actions/library";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function LibraryMembersClient() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [newMember, setNewMember] = useState({
    name: "", email: "", phone: "", address: "", dateOfBirth: "", gender: "" as any, emergencyContact: "", notes: "",
  });

  async function loadMembers(page = 1) {
    setLoading(true);
    const res = await getMembers({ page, pageSize: 20, search: search || undefined, status: statusFilter || undefined });
    if (res.success) {
      setMembers((res.data as any[]) || []);
      if (res.pagination) setPagination(res.pagination as any);
    }
    setLoading(false);
  }

  useEffect(() => { loadMembers(); }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadMembers(1);
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const payload: any = { name: newMember.name, email: newMember.email, phone: newMember.phone };
    if (newMember.address) payload.address = newMember.address;
    if (newMember.dateOfBirth) payload.dateOfBirth = newMember.dateOfBirth;
    if (newMember.gender) payload.gender = newMember.gender;
    if (newMember.emergencyContact) payload.emergencyContact = newMember.emergencyContact;
    if (newMember.notes) payload.notes = newMember.notes;

    const res = await createMember(payload);
    if (res.success) {
      setShowAddForm(false);
      setNewMember({ name: "", email: "", phone: "", address: "", dateOfBirth: "", gender: "", emergencyContact: "", notes: "" });
      loadMembers();
    } else {
      setError(res.error || "Failed");
    }
    setSubmitting(false);
  }

  async function handleIssueIdCard(memberId: string) {
    const res = await issueIdCard(memberId);
    if (res.success) {
      loadMembers(pagination.page);
    } else {
      alert(res.error || "Failed to issue ID card");
    }
  }

  async function handleSuspend(id: string) {
    if (!confirm("Suspend this member?")) return;
    const res = await deleteMember(id);
    if (res.success) loadMembers(pagination.page);
    else alert(res.error || "Failed");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage library members and their profiles</p>
        </div>
        <Button size="sm" onClick={() => setShowAddForm(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Member
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, member ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </form>
        <div className="flex gap-1.5">
          {["", "ACTIVE", "EXPIRED", "SUSPENDED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
                statusFilter === s ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {/* Add Member Form */}
      {showAddForm && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">New Member</CardTitle>
              <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Full Name *</Label>
                  <Input required value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email *</Label>
                  <Input type="email" required value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone *</Label>
                  <Input required value={newMember.phone} onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })} className="h-9" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Date of Birth</Label>
                  <Input type="date" value={newMember.dateOfBirth} onChange={(e) => setNewMember({ ...newMember, dateOfBirth: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Gender</Label>
                  <select
                    value={newMember.gender}
                    onChange={(e) => setNewMember({ ...newMember, gender: e.target.value })}
                    className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="">Select</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Emergency Contact</Label>
                  <Input value={newMember.emergencyContact} onChange={(e) => setNewMember({ ...newMember, emergencyContact: e.target.value })} className="h-9" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Address</Label>
                  <Input value={newMember.address} onChange={(e) => setNewMember({ ...newMember, address: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Notes</Label>
                  <Input value={newMember.notes} onChange={(e) => setNewMember({ ...newMember, notes: e.target.value })} className="h-9" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
                  Add Member
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Members Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : members.length === 0 ? (
        <div className="text-center py-16">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No members found</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Member</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contact</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Seat</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID Card</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m: any) => (
                  <tr key={m.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.memberId}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs flex items-center gap-1"><Mail className="h-3 w-3" /> {m.email}</span>
                        <span className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" /> {m.phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {m.seatAllocations?.length > 0 ? (
                        <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                          {m.seatAllocations[0].seat.seatNumber}
                          {m.seatAllocations[0].seat.zone && ` (${m.seatAllocations[0].seat.zone})`}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {m.idCardIssued ? (
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                          <CreditCard className="h-3 w-3" /> {m.idCardNumber}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleIssueIdCard(m.id)}
                          className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full hover:bg-amber-100"
                        >
                          Issue ID
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        m.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" :
                        m.status === "EXPIRED" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                      )}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" nativeButton={false} render={<Link href={`/dashboard/library/members/${m.id}`} />} className="h-7 px-2">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {m.status === "ACTIVE" && (
                          <button
                            onClick={() => handleSuspend(m.id)}
                            className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 rounded"
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <span className="text-xs text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.pageSize + 1}–{Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}
              </span>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" disabled={pagination.page <= 1} onClick={() => loadMembers(pagination.page - 1)} className="h-7 px-2">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="outline" disabled={pagination.page >= pagination.totalPages} onClick={() => loadMembers(pagination.page + 1)} className="h-7 px-2">
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

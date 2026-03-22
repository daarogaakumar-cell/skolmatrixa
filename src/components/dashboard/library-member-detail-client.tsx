"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  Armchair,
  BookOpen,
  IndianRupee,
  CreditCard,
  Mail,
  Phone,
  Calendar,
  MapPin,
  User,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getMemberById, getMemberFees, getBookIssues } from "@/actions/library";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface LibraryMemberDetailClientProps {
  memberId: string;
}

export function LibraryMemberDetailClient({ memberId }: LibraryMemberDetailClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);
  const [fees, setFees] = useState<any[]>([]);
  const [bookIssues, setBookIssues] = useState<any[]>([]);
  const [tab, setTab] = useState<"overview" | "fees" | "books">("overview");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [memberRes, feesRes, booksRes] = await Promise.all([
        getMemberById(memberId),
        getMemberFees(memberId),
        getBookIssues({ memberId, pageSize: 50 }),
      ]);
      if (memberRes.success) setMember(memberRes.data);
      if (feesRes.success) setFees((feesRes.data as any)?.fees || []);
      if (booksRes.success) setBookIssues((booksRes.data as any)?.issues || (booksRes.data as any[]) || []);
      setLoading(false);
    }
    load();
  }, [memberId]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!member) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <p className="mt-3 text-sm text-muted-foreground">Member not found</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Go Back
        </Button>
      </div>
    );
  }

  const totalPaid = fees.filter((f: any) => f.status === "PAID").reduce((s: number, f: any) => s + Number(f.amount), 0);
  const totalPending = fees.filter((f: any) => f.status !== "PAID").reduce((s: number, f: any) => s + Number(f.amount), 0);
  const activeBooks = bookIssues.filter((bi: any) => bi.status === "ISSUED").length;

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{member.name}</h1>
          <p className="text-sm text-muted-foreground">{member.memberId} · {member.slotType === "FULL_DAY" ? "Full Day" : "Half Day"}</p>
        </div>
        <span className={cn(
          "ml-auto text-xs font-medium px-2.5 py-1 rounded-full",
          member.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" :
          member.status === "SUSPENDED" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
        )}>
          {member.status}
        </span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center"><Armchair className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Seat</p>
                <p className="text-sm font-semibold">{member.seatAllocation?.seat?.seatNumber || "Not assigned"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center"><BookOpen className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Active Books</p>
                <p className="text-sm font-semibold">{activeBooks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center"><IndianRupee className="h-5 w-5 text-emerald-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Paid</p>
                <p className="text-sm font-semibold">₹{totalPaid}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-sm font-semibold">₹{totalPending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {([["overview", "Overview"], ["fees", "Fee History"], ["books", "Book Issues"]] as ["overview" | "fees" | "books", string][]).map(([key, label]) => (
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

      {/* Overview Tab */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Personal Information</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3.5">
                {[
                  { icon: User, label: "Name", value: member.name },
                  { icon: Mail, label: "Email", value: member.email },
                  { icon: Phone, label: "Phone", value: member.phone || "—" },
                  { icon: Calendar, label: "Date of Birth", value: member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString("en-IN") : "—" },
                  { icon: User, label: "Gender", value: member.gender || "—" },
                  { icon: MapPin, label: "Address", value: member.address || "—" },
                  { icon: Phone, label: "Emergency Contact", value: member.emergencyContact || "—" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-medium">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Membership Details</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3.5">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Member ID</p>
                    <p className="text-sm font-medium font-mono">{member.memberId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Join Date</p>
                    <p className="text-sm font-medium">{member.joinDate ? new Date(member.joinDate).toLocaleDateString("en-IN") : "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Armchair className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Allocated Seat</p>
                    <p className="text-sm font-medium">{member.seatAllocation?.seat?.seatNumber || "Not assigned"} {member.seatAllocation?.seat?.zone ? `(${member.seatAllocation.seat.zone})` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">ID Card</p>
                    <p className="text-sm font-medium">{member.idCardIssued ? `Issued on ${new Date(member.idCardIssuedDate).toLocaleDateString("en-IN")}` : "Not issued"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fee History Tab */}
      {tab === "fees" && (
        fees.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-sm">No fee records found</p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Period</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Due Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Paid Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Receipt</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((fee: any) => (
                  <tr key={fee.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3 text-xs">{fee.month}/{fee.year}</td>
                    <td className="px-4 py-3 font-semibold">₹{Number(fee.amount)}</td>
                    <td className="px-4 py-3 text-xs">{new Date(fee.dueDate).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3 text-xs">{fee.paidDate ? new Date(fee.paidDate).toLocaleDateString("en-IN") : "—"}</td>
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

      {/* Books Tab */}
      {tab === "books" && (
        bookIssues.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-sm">No book issues found</p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Book</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Issue Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Due Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Return Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fine</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookIssues.map((bi: any) => (
                  <tr key={bi.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium">{bi.book?.title}</p>
                      <p className="text-xs text-muted-foreground">{bi.book?.author}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">{new Date(bi.issueDate).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3 text-xs">{new Date(bi.dueDate).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3 text-xs">{bi.returnDate ? new Date(bi.returnDate).toLocaleDateString("en-IN") : "—"}</td>
                    <td className="px-4 py-3 text-xs">{Number(bi.fine) > 0 ? `₹${Number(bi.fine)}` : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        bi.status === "ISSUED" ? "bg-blue-50 text-blue-700" :
                        bi.status === "RETURNED" ? "bg-emerald-50 text-emerald-700" :
                        bi.status === "OVERDUE" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                      )}>
                        {bi.status}
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
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Loader2,
  Search,
  Printer,
  Download,
  User,
  QrCode,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getMembers, issueIdCard, getIdCardData } from "@/actions/library";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function LibraryIdCardClient() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [cardData, setCardData] = useState<any>(null);
  const [issuing, setIssuing] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  async function loadMembers() {
    setLoading(true);
    const res = await getMembers({ search: search || undefined, pageSize: 50 });
    if (res.success) setMembers((res.data as any[]) || []);
    setLoading(false);
  }

  useEffect(() => { loadMembers(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSearch(q: string) {
    setSearch(q);
    const res = await getMembers({ search: q || undefined, pageSize: 50 });
    if (res.success) setMembers((res.data as any[]) || []);
  }

  async function handleSelectMember(member: any) {
    setSelectedMember(member);
    const res = await getIdCardData(member.id);
    if (res.success) setCardData(res.data);
    else setCardData(null);
  }

  async function handleIssueCard(memberId: string) {
    setIssuing(true);
    const res = await issueIdCard(memberId);
    if (res.success) {
      // Reload member data
      await handleSelectMember(selectedMember);
      loadMembers();
    } else {
      alert(res.error || "Failed to issue ID card");
    }
    setIssuing(false);
  }

  function handlePrint() {
    if (!printRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>Library ID Card</title>
      <style>
        @page { size: 85.6mm 53.98mm; margin: 0; }
        body { margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, sans-serif; }
        .card { width: 85.6mm; height: 53.98mm; padding: 8mm; box-sizing: border-box; background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #1a1a1a; position: relative; overflow: hidden; }
        .card::before { content: ''; position: absolute; top: -20mm; right: -20mm; width: 50mm; height: 50mm; border-radius: 50%; background: rgba(255,255,255,0.15); }
        .header { font-size: 11pt; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 3mm; }
        .name { font-size: 10pt; font-weight: 700; margin-bottom: 1.5mm; }
        .detail { font-size: 7pt; color: #4a4a4a; margin-bottom: 1mm; }
        .id { font-size: 8pt; font-weight: 700; background: rgba(255,255,255,0.4); padding: 1mm 2mm; border-radius: 2mm; display: inline-block; margin-top: 1mm; }
        .slot { font-size: 7pt; font-weight: 600; background: #1a1a1a; color: #fbbf24; padding: 0.8mm 2mm; border-radius: 1.5mm; display: inline-block; margin-left: 2mm; }
        .footer { position: absolute; bottom: 3mm; left: 8mm; right: 8mm; font-size: 6pt; color: #666; display: flex; justify-content: space-between; }
      </style></head><body>
      ${printRef.current.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ID Card Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Issue and print member identity cards</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search members..."
              className="h-9 pl-9"
            />
          </div>
          <div className="rounded-lg border max-h-[calc(100vh-280px)] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">No members found</p>
            ) : (
              members.map((m: any) => (
                <button
                  key={m.id}
                  onClick={() => handleSelectMember(m)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors",
                    selectedMember?.id === m.id && "bg-amber-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                      {m.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.memberId}</p>
                    </div>
                    {m.idCardIssued ? (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">ID Issued</span>
                    ) : (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">No ID</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ID Card Preview */}
        <div className="lg:col-span-2">
          {!selectedMember ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CreditCard className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">Select a member to preview their ID card</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Card Preview */}
              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">ID Card Preview</CardTitle>
                    <div className="flex gap-2">
                      {!selectedMember.idCardIssued && (
                        <Button size="sm" onClick={() => handleIssueCard(selectedMember.id)} disabled={issuing}>
                          {issuing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CreditCard className="h-4 w-4 mr-1.5" />}
                          Issue ID Card
                        </Button>
                      )}
                      {selectedMember.idCardIssued && (
                        <Button size="sm" variant="outline" onClick={handlePrint}>
                          <Printer className="h-4 w-4 mr-1.5" /> Print
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center py-4">
                    <div ref={printRef}>
                      <div className="card" style={{
                        width: "340px",
                        height: "214px",
                        padding: "20px",
                        background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                        borderRadius: "12px",
                        position: "relative",
                        overflow: "hidden",
                        color: "#1a1a1a",
                        fontFamily: "'Segoe UI', system-ui, sans-serif",
                        boxShadow: "0 10px 25px rgba(245, 158, 11, 0.3)",
                      }}>
                        {/* Decorative circle */}
                        <div style={{
                          position: "absolute",
                          top: "-40px",
                          right: "-40px",
                          width: "120px",
                          height: "120px",
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.15)",
                        }} />
                        <div style={{
                          position: "absolute",
                          bottom: "-30px",
                          left: "-30px",
                          width: "80px",
                          height: "80px",
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.1)",
                        }} />

                        {/* Header */}
                        <div style={{ fontSize: "13px", fontWeight: 800, letterSpacing: "0.5px", marginBottom: "10px", position: "relative" }}>
                          {cardData?.tenantName || "Library"}
                        </div>

                        {/* Member Info */}
                        <div style={{ position: "relative" }}>
                          <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "4px" }}>
                            {selectedMember.name}
                          </div>
                          <div style={{ fontSize: "10px", color: "#4a4a4a", marginBottom: "2px" }}>
                            {selectedMember.email}
                          </div>
                          {selectedMember.phone && (
                            <div style={{ fontSize: "10px", color: "#4a4a4a", marginBottom: "2px" }}>
                              {selectedMember.phone}
                            </div>
                          )}
                          <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              background: "rgba(255,255,255,0.4)",
                              padding: "2px 8px",
                              borderRadius: "4px",
                            }}>
                              {selectedMember.memberId}
                            </span>
                            <span style={{
                              fontSize: "9px",
                              fontWeight: 600,
                              background: "#1a1a1a",
                              color: "#fbbf24",
                              padding: "2px 6px",
                              borderRadius: "3px",
                            }}>
                              {selectedMember.slotType === "FULL_DAY" ? "Full Day" : "Half Day"}
                            </span>
                          </div>
                        </div>

                        {/* Footer */}
                        <div style={{
                          position: "absolute",
                          bottom: "8px",
                          left: "20px",
                          right: "20px",
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "8px",
                          color: "#666",
                        }}>
                          <span>Joined: {selectedMember.joinDate ? new Date(selectedMember.joinDate).toLocaleDateString("en-IN") : "—"}</span>
                          <span>Valid until renewed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Member Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Member Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    <div><span className="text-muted-foreground text-xs">Name</span><p className="font-medium">{selectedMember.name}</p></div>
                    <div><span className="text-muted-foreground text-xs">Member ID</span><p className="font-medium font-mono">{selectedMember.memberId}</p></div>
                    <div><span className="text-muted-foreground text-xs">Email</span><p className="font-medium">{selectedMember.email}</p></div>
                    <div><span className="text-muted-foreground text-xs">Phone</span><p className="font-medium">{selectedMember.phone || "—"}</p></div>
                    <div><span className="text-muted-foreground text-xs">Slot Type</span><p className="font-medium">{selectedMember.slotType === "FULL_DAY" ? "Full Day" : "Half Day"}</p></div>
                    <div><span className="text-muted-foreground text-xs">Status</span><p className="font-medium">{selectedMember.status}</p></div>
                    <div><span className="text-muted-foreground text-xs">Join Date</span><p className="font-medium">{selectedMember.joinDate ? new Date(selectedMember.joinDate).toLocaleDateString("en-IN") : "—"}</p></div>
                    <div><span className="text-muted-foreground text-xs">ID Card Issued</span><p className="font-medium">{selectedMember.idCardIssued ? "Yes" : "No"}</p></div>
                    {selectedMember.idCardIssuedDate && (
                      <div><span className="text-muted-foreground text-xs">Issue Date</span><p className="font-medium">{new Date(selectedMember.idCardIssuedDate).toLocaleDateString("en-IN")}</p></div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BookCheck,
  BookOpen,
  Search,
  Loader2,
  Plus,
  RotateCcw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getBookIssues,
  issueBook,
  returnBook,
  markBookLost,
  getBooks,
  getMembers,
} from "@/actions/library";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function LibraryBookIssuesClient() {
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState("");
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Issue form
  const [bookSearch, setBookSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [bookResults, setBookResults] = useState<any[]>([]);
  const [memberResults, setMemberResults] = useState<any[]>([]);
  const [issueData, setIssueData] = useState({ bookId: "", memberId: "", dueDate: "", notes: "" });
  const [selectedBook, setSelectedBook] = useState<string>("");
  const [selectedMember, setSelectedMember] = useState<string>("");

  // Return form
  const [returningId, setReturningId] = useState<string | null>(null);
  const [returnFine, setReturnFine] = useState("");
  const [returnNotes, setReturnNotes] = useState("");

  async function loadIssues(page = 1) {
    setLoading(true);
    const res = await getBookIssues({ page, pageSize: 20, status: statusFilter || undefined });
    if (res.success) {
      setIssues((res.data as any[]) || []);
      if (res.pagination) setPagination(res.pagination as any);
    }
    setLoading(false);
  }

  useEffect(() => { loadIssues(); }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function searchBooks(query: string) {
    setBookSearch(query);
    if (query.length < 2) { setBookResults([]); return; }
    const res = await getBooks({ search: query, pageSize: 10 });
    if (res.success) setBookResults((res.data as any[]) || []);
  }

  async function searchMembers(query: string) {
    setMemberSearch(query);
    if (query.length < 2) { setMemberResults([]); return; }
    const res = await getMembers({ search: query, pageSize: 10 });
    if (res.success) setMemberResults((res.data as any[]) || []);
  }

  async function handleIssue(e: React.FormEvent) {
    e.preventDefault();
    if (!issueData.bookId || !issueData.memberId || !issueData.dueDate) return;
    setSubmitting(true);
    setError("");
    const res = await issueBook(issueData);
    if (res.success) {
      setShowIssueForm(false);
      setIssueData({ bookId: "", memberId: "", dueDate: "", notes: "" });
      setSelectedBook("");
      setSelectedMember("");
      setBookSearch("");
      setMemberSearch("");
      loadIssues(pagination.page);
    } else {
      setError(res.error || "Failed");
    }
    setSubmitting(false);
  }

  async function handleReturn(issueId: string) {
    setSubmitting(true);
    const res = await returnBook(issueId, { fine: returnFine ? Number(returnFine) : undefined, notes: returnNotes || undefined });
    if (res.success) {
      setReturningId(null);
      setReturnFine("");
      setReturnNotes("");
      loadIssues(pagination.page);
    } else {
      alert(res.error || "Failed to return");
    }
    setSubmitting(false);
  }

  async function handleMarkLost(issueId: string) {
    if (!confirm("Mark this book as lost? A fine of ₹500 will be applied.")) return;
    const res = await markBookLost(issueId);
    if (res.success) loadIssues(pagination.page);
    else alert(res.error || "Failed");
  }

  // Default due date = 14 days from now
  const defaultDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Book Issues</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Issue and return books, track overdue items</p>
        </div>
        <Button size="sm" onClick={() => { setShowIssueForm(true); if (!issueData.dueDate) setIssueData({ ...issueData, dueDate: defaultDueDate }); }}>
          <Plus className="mr-1.5 h-4 w-4" /> Issue Book
        </Button>
      </div>

      {/* Status Filters */}
      <div className="flex gap-1.5 flex-wrap">
        {["", "ISSUED", "RETURNED", "OVERDUE", "LOST"].map((s) => (
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

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {/* Issue Book Form */}
      {showIssueForm && (
        <Card className="border-amber-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Issue a Book</CardTitle>
              <button onClick={() => setShowIssueForm(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleIssue} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Book Search */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Search Book *</Label>
                  <Input value={bookSearch} onChange={(e) => searchBooks(e.target.value)} placeholder="Title, author, or ISBN..." className="h-9" />
                  {selectedBook && <p className="text-xs text-emerald-600 font-medium">✓ {selectedBook}</p>}
                  {bookResults.length > 0 && (
                    <div className="border rounded-lg max-h-32 overflow-y-auto">
                      {bookResults.map((b: any) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setIssueData({ ...issueData, bookId: b.id });
                            setSelectedBook(`${b.title} by ${b.author}`);
                            setBookSearch(b.title);
                            setBookResults([]);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 text-sm hover:bg-muted/50",
                            b.availableCopies <= 0 && "opacity-50",
                          )}
                          disabled={b.availableCopies <= 0}
                        >
                          <span className="font-medium">{b.title}</span>
                          <span className="text-muted-foreground"> — {b.author}</span>
                          <span className={cn("ml-2 text-[10px]", b.availableCopies > 0 ? "text-emerald-600" : "text-red-600")}>
                            ({b.availableCopies} avail.)
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Member Search */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Search Member *</Label>
                  <Input value={memberSearch} onChange={(e) => searchMembers(e.target.value)} placeholder="Name, email, or member ID..." className="h-9" />
                  {selectedMember && <p className="text-xs text-emerald-600 font-medium">✓ {selectedMember}</p>}
                  {memberResults.length > 0 && (
                    <div className="border rounded-lg max-h-32 overflow-y-auto">
                      {memberResults.map((m: any) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setIssueData({ ...issueData, memberId: m.id });
                            setSelectedMember(`${m.name} (${m.memberId})`);
                            setMemberSearch(m.name);
                            setMemberResults([]);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50"
                        >
                          {m.name} <span className="text-muted-foreground">({m.memberId})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Due Date *</Label>
                  <Input type="date" required value={issueData.dueDate} onChange={(e) => setIssueData({ ...issueData, dueDate: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Notes</Label>
                  <Input value={issueData.notes} onChange={(e) => setIssueData({ ...issueData, notes: e.target.value })} className="h-9" />
                </div>
                <div className="flex items-end">
                  <Button type="submit" size="sm" disabled={submitting || !issueData.bookId || !issueData.memberId} className="w-full">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <BookCheck className="h-4 w-4 mr-1.5" />}
                    Issue Book
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Issues Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : issues.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No book issues found</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Book</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Member</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Issue Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Due Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Return Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fine</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue: any) => {
                  const isOverdue = issue.status === "ISSUED" && new Date(issue.dueDate) < new Date();
                  return (
                    <tr key={issue.id} className={cn("border-t hover:bg-muted/30", isOverdue && "bg-red-50/50")}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{issue.book.title}</p>
                        <p className="text-xs text-muted-foreground">{issue.book.author}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{issue.member.name}</p>
                        <p className="text-xs text-muted-foreground">{issue.member.memberId}</p>
                      </td>
                      <td className="px-4 py-3 text-xs">{new Date(issue.issueDate).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className={cn(isOverdue && "text-red-600 font-medium")}>
                          {new Date(issue.dueDate).toLocaleDateString("en-IN")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {issue.returnDate ? new Date(issue.returnDate).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {Number(issue.fine) > 0 ? (
                          <span className="text-red-600 font-medium">₹{Number(issue.fine)}</span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          issue.status === "ISSUED" ? (isOverdue ? "bg-red-100 text-red-700" : "bg-blue-50 text-blue-700") :
                          issue.status === "RETURNED" ? "bg-emerald-50 text-emerald-700" :
                          issue.status === "OVERDUE" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                        )}>
                          {isOverdue && issue.status === "ISSUED" ? "OVERDUE" : issue.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(issue.status === "ISSUED" || issue.status === "OVERDUE") && (
                          <div className="flex items-center justify-end gap-1">
                            {returningId === issue.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  placeholder="Fine ₹"
                                  value={returnFine}
                                  onChange={(e) => setReturnFine(e.target.value)}
                                  className="h-7 w-20 text-xs"
                                />
                                <Button size="sm" onClick={() => handleReturn(issue.id)} disabled={submitting} className="h-7 px-2 text-xs">
                                  {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
                                </Button>
                                <button onClick={() => setReturningId(null)} className="text-xs text-muted-foreground">✕</button>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => setReturningId(issue.id)}
                                  className="flex items-center gap-1 rounded bg-emerald-100 px-2 py-1 text-[10px] font-medium text-emerald-700 hover:bg-emerald-200"
                                >
                                  <RotateCcw className="h-3 w-3" /> Return
                                </button>
                                <button
                                  onClick={() => handleMarkLost(issue.id)}
                                  className="flex items-center gap-1 rounded bg-red-100 px-2 py-1 text-[10px] font-medium text-red-700 hover:bg-red-200"
                                >
                                  <AlertTriangle className="h-3 w-3" /> Lost
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <span className="text-xs text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" disabled={pagination.page <= 1} onClick={() => loadIssues(pagination.page - 1)} className="h-7 px-2">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="outline" disabled={pagination.page >= pagination.totalPages} onClick={() => loadIssues(pagination.page + 1)} className="h-7 px-2">
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

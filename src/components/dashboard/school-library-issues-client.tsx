"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Search,
  Loader2,
  Plus,
  RotateCcw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  X,
  BookCheck,
  Clock,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getSchoolBookIssues,
  issueSchoolBook,
  returnSchoolBook,
  markSchoolBookLost,
  getStudentsForIssue,
  getClassesForLibrary,
} from "@/actions/school-library";
import { getBooks } from "@/actions/library";

/* eslint-disable @typescript-eslint/no-explicit-any */

const statusColors: Record<string, string> = {
  ISSUED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  RETURNED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  LOST: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

export function SchoolLibraryIssuesClient() {
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Issue form state
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassForSearch, setSelectedClassForSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [bookSearch, setBookSearch] = useState("");
  const [bookResults, setBookResults] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [searchingBooks, setSearchingBooks] = useState(false);

  const loadIssues = useCallback(async (page = 1) => {
    setLoading(true);
    const res = await getSchoolBookIssues({
      page,
      pageSize: 20,
      status: statusFilter || undefined,
      classId: classFilter || undefined,
      search: searchQuery || undefined,
    });
    if (res.success) {
      setIssues((res.data as any[]) || []);
      if (res.pagination) setPagination(res.pagination as any);
    }
    setLoading(false);
  }, [statusFilter, classFilter, searchQuery]);

  useEffect(() => {
    let cancelled = false;
    getSchoolBookIssues({
      page: 1,
      pageSize: 20,
      status: statusFilter || undefined,
      classId: classFilter || undefined,
      search: searchQuery || undefined,
    }).then((res) => {
      if (cancelled) return;
      if (res.success) {
        setIssues((res.data as any[]) || []);
        if (res.pagination) setPagination(res.pagination as any);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [statusFilter, classFilter, searchQuery]);

  useEffect(() => {
    getClassesForLibrary().then((res) => {
      if (res.success) setClasses(res.data || []);
    });
  }, []);

  function getDefaultDueDate() {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  }

  async function searchStudents(query: string, classId?: string) {
    setSearchingStudents(true);
    const res = await getStudentsForIssue({
      search: query || undefined,
      classId: classId || undefined,
      pageSize: 15,
    });
    if (res.success) setStudentResults(res.data || []);
    setSearchingStudents(false);
  }

  async function searchBooks(query: string) {
    setBookSearch(query);
    if (query.length < 2) { setBookResults([]); return; }
    setSearchingBooks(true);
    const res = await getBooks({ search: query, pageSize: 10 });
    if (res.success) setBookResults((res.data as any[]) || []);
    setSearchingBooks(false);
  }

  function handleStudentSearchChange(value: string) {
    setStudentSearch(value);
    if (value.length >= 2 || selectedClassForSearch) {
      searchStudents(value, selectedClassForSearch);
    } else {
      setStudentResults([]);
    }
  }

  function handleClassSearchChange(classId: string) {
    setSelectedClassForSearch(classId);
    searchStudents(studentSearch, classId);
  }

  async function handleIssue(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBook || !selectedStudent || !dueDate) return;
    setSubmitting(true);
    setError("");

    const res = await issueSchoolBook({
      bookId: selectedBook.id,
      studentId: selectedStudent.id,
      dueDate,
      notes: notes || undefined,
    });

    if (res.success) {
      resetForm();
      loadIssues(pagination.page);
    } else {
      setError(res.error || "Failed to issue book");
    }
    setSubmitting(false);
  }

  async function handleReturn(issueId: string) {
    if (!confirm("Confirm return? Fine will be calculated if overdue.")) return;
    const res = await returnSchoolBook(issueId);
    if (res.success) {
      alert(res.message);
      loadIssues(pagination.page);
    } else {
      alert(res.error || "Failed");
    }
  }

  async function handleLost(issueId: string) {
    if (!confirm("Mark this book as lost? A ₹500 fine will be applied.")) return;
    const res = await markSchoolBookLost(issueId);
    if (res.success) {
      alert(res.message);
      loadIssues(pagination.page);
    } else {
      alert(res.error || "Failed");
    }
  }

  function resetForm() {
    setShowIssueForm(false);
    setSelectedStudent(null);
    setSelectedBook(null);
    setStudentSearch("");
    setBookSearch("");
    setStudentResults([]);
    setBookResults([]);
    setNotes("");
    setDueDate("");
    setError("");
    setSelectedClassForSearch("");
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadIssues(1);
  }

  function formatDate(d: string | Date) {
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  function isOverdue(dueDate: string | Date) {
    return new Date(dueDate) < new Date();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Book Issue & Return</h2>
          <p className="text-muted-foreground">Issue books to students and manage returns</p>
        </div>
        <Button onClick={() => { setShowIssueForm(true); if (!dueDate) setDueDate(getDefaultDueDate()); }} disabled={showIssueForm}>
          <Plus className="h-4 w-4 mr-1" /> Issue Book
        </Button>
      </div>

      {/* Issue Book Form */}
      {showIssueForm && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg">Issue Book to Student</CardTitle>
            <Button variant="ghost" size="icon-sm" onClick={resetForm}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}
            <form onSubmit={handleIssue} className="space-y-5">
              {/* Step 1: Find Student */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" /> 1. Select Student
                </Label>
                {selectedStudent ? (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
                    <div>
                      <p className="font-medium">{selectedStudent.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedStudent.admissionNo} • {selectedStudent.className}
                        {selectedStudent.activeIssues > 0 && (
                          <span className="ml-2 text-amber-600">({selectedStudent.activeIssues}/3 books issued)</span>
                        )}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { setSelectedStudent(null); setStudentResults([]); setStudentSearch(""); }}
                    >Change</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <select
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        value={selectedClassForSearch}
                        onChange={(e) => handleClassSearchChange(e.target.value)}
                      >
                        <option value="">All Classes</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name, admission no, or roll no..."
                          className="pl-9"
                          value={studentSearch}
                          onChange={(e) => handleStudentSearchChange(e.target.value)}
                        />
                      </div>
                    </div>
                    {searchingStudents && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Searching...
                      </div>
                    )}
                    {studentResults.length > 0 && (
                      <div className="max-h-48 overflow-y-auto rounded-lg border divide-y">
                        {studentResults.map((student) => (
                          <button
                            key={student.id}
                            type="button"
                            className="flex w-full items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
                            onClick={() => {
                              setSelectedStudent(student);
                              setStudentResults([]);
                              setStudentSearch("");
                            }}
                          >
                            <div>
                              <p className="font-medium text-sm">{student.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {student.admissionNo} • {student.className}
                                {student.rollNo && ` • Roll: ${student.rollNo}`}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {student.activeIssues}/3 books
                            </Badge>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Find Book */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> 2. Select Book
                </Label>
                {selectedBook ? (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
                    <div>
                      <p className="font-medium">{selectedBook.title}</p>
                      <p className="text-sm text-muted-foreground">
                        by {selectedBook.author}
                        {selectedBook.isbn && ` • ISBN: ${selectedBook.isbn}`}
                        <span className="ml-2">({selectedBook.availableCopies} available)</span>
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { setSelectedBook(null); setBookResults([]); setBookSearch(""); }}
                    >Change</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by book title, author, or ISBN..."
                        className="pl-9"
                        value={bookSearch}
                        onChange={(e) => searchBooks(e.target.value)}
                      />
                    </div>
                    {searchingBooks && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Searching...
                      </div>
                    )}
                    {bookResults.length > 0 && (
                      <div className="max-h-48 overflow-y-auto rounded-lg border divide-y">
                        {bookResults.map((book: any) => (
                          <button
                            key={book.id}
                            type="button"
                            disabled={book.availableCopies <= 0}
                            className={cn(
                              "flex w-full items-center justify-between p-3 text-left transition-colors",
                              book.availableCopies > 0 ? "hover:bg-muted/50" : "opacity-50 cursor-not-allowed"
                            )}
                            onClick={() => {
                              if (book.availableCopies > 0) {
                                setSelectedBook(book);
                                setBookResults([]);
                                setBookSearch("");
                              }
                            }}
                          >
                            <div>
                              <p className="font-medium text-sm">{book.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {book.author}
                                {book.category && ` • ${book.category}`}
                              </p>
                            </div>
                            <Badge
                              variant={book.availableCopies > 0 ? "secondary" : "destructive"}
                              className="text-xs"
                            >
                              {book.availableCopies}/{book.totalCopies}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 3: Due Date & Notes */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" /> 3. Due Date
                  </Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input
                    placeholder="Any remarks..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={!selectedStudent || !selectedBook || !dueDate || submitting}
                className="w-full"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BookCheck className="h-4 w-4 mr-2" />}
                Issue Book
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search book title, student name..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="flex gap-1.5 flex-wrap">
              {["", "ISSUED", "RETURNED", "OVERDUE", "LOST"].map((s) => (
                <Button
                  key={s}
                  type="button"
                  variant={statusFilter === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(s)}
                >
                  {s || "All"}
                </Button>
              ))}
            </div>
            <Button type="submit" size="sm" variant="secondary">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Issues List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Book Issues {pagination.total > 0 && <span className="text-muted-foreground font-normal">({pagination.total})</span>}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : issues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No book issues found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className={cn(
                    "rounded-lg border p-4 transition-colors",
                    issue.status === "ISSUED" && isOverdue(issue.dueDate) && "border-red-200 bg-red-50/30 dark:border-red-900 dark:bg-red-950/10"
                  )}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm truncate">{issue.bookTitle}</p>
                        <Badge className={cn("text-[10px] shrink-0", statusColors[issue.status])}>
                          {issue.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        by {issue.bookAuthor}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          {issue.studentName} ({issue.studentAdmNo})
                        </span>
                        <span>{issue.className}</span>
                        <span>Issued: {formatDate(issue.issueDate)}</span>
                        <span className={cn(
                          issue.status === "ISSUED" && isOverdue(issue.dueDate) && "text-red-600 font-medium"
                        )}>
                          Due: {formatDate(issue.dueDate)}
                        </span>
                        {issue.returnDate && <span>Returned: {formatDate(issue.returnDate)}</span>}
                        {issue.fine > 0 && (
                          <span className="text-red-600 font-medium">Fine: ₹{issue.fine}</span>
                        )}
                      </div>
                    </div>
                    {issue.status === "ISSUED" && (
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => handleReturn(issue.id)}>
                          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Return
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleLost(issue.id)}>
                          <Ban className="h-3.5 w-3.5 mr-1" /> Lost
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => loadIssues(pagination.page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadIssues(pagination.page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

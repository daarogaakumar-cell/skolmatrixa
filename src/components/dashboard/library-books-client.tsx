"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BookOpen,
  Plus,
  Search,
  Loader2,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  BookCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getBooks, createBook, updateBook, deleteBook, getBookCategories } from "@/actions/library";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function LibraryBooksClient() {
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const emptyBook = { title: "", author: "", isbn: "", publisher: "", category: "", edition: "", totalCopies: 1, shelfLocation: "", description: "" };
  const [formData, setFormData] = useState(emptyBook);

  async function loadBooks(page = 1) {
    setLoading(true);
    const [booksRes, catRes] = await Promise.all([
      getBooks({ page, pageSize: 20, search: search || undefined, category: categoryFilter || undefined }),
      getBookCategories(),
    ]);
    if (booksRes.success) {
      setBooks((booksRes.data as any[]) || []);
      if (booksRes.pagination) setPagination(booksRes.pagination as any);
    }
    if (catRes.success) setCategories((catRes.data as string[]) || []);
    setLoading(false);
  }

  useEffect(() => { loadBooks(); }, [categoryFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadBooks(1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const payload: any = {};
    if (formData.title) payload.title = formData.title;
    if (formData.author) payload.author = formData.author;
    if (formData.isbn) payload.isbn = formData.isbn;
    if (formData.publisher) payload.publisher = formData.publisher;
    if (formData.category) payload.category = formData.category;
    if (formData.edition) payload.edition = formData.edition;
    if (formData.totalCopies) payload.totalCopies = Number(formData.totalCopies);
    if (formData.shelfLocation) payload.shelfLocation = formData.shelfLocation;
    if (formData.description) payload.description = formData.description;

    const res = editingBook
      ? await updateBook(editingBook.id, payload)
      : await createBook(payload);

    if (res.success) {
      setShowAddForm(false);
      setEditingBook(null);
      setFormData(emptyBook);
      loadBooks(pagination.page);
    } else {
      setError(res.error || "Failed");
    }
    setSubmitting(false);
  }

  function startEdit(book: any) {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn || "",
      publisher: book.publisher || "",
      category: book.category || "",
      edition: book.edition || "",
      totalCopies: book.totalCopies,
      shelfLocation: book.shelfLocation || "",
      description: book.description || "",
    });
    setShowAddForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this book from the library?")) return;
    const res = await deleteBook(id);
    if (res.success) loadBooks(pagination.page);
    else alert(res.error || "Failed to delete");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Book Catalog</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your library book collection</p>
        </div>
        <Button size="sm" onClick={() => { setShowAddForm(true); setEditingBook(null); setFormData(emptyBook); }}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Book
        </Button>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search books by title, author, ISBN..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </form>
        {categories.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setCategoryFilter("")}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-full transition-colors", !categoryFilter ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground hover:bg-muted/80")}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn("px-3 py-1.5 text-xs font-medium rounded-full transition-colors", categoryFilter === cat ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground hover:bg-muted/80")}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {/* Add/Edit Book Form */}
      {showAddForm && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">{editingBook ? "Edit Book" : "Add New Book"}</CardTitle>
              <button onClick={() => { setShowAddForm(false); setEditingBook(null); }} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Title *</Label>
                  <Input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Author *</Label>
                  <Input required value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">ISBN</Label>
                  <Input value={formData.isbn} onChange={(e) => setFormData({ ...formData, isbn: e.target.value })} className="h-9" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Publisher</Label>
                  <Input value={formData.publisher} onChange={(e) => setFormData({ ...formData, publisher: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Category</Label>
                  <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g., Science, Fiction" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Edition</Label>
                  <Input value={formData.edition} onChange={(e) => setFormData({ ...formData, edition: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Total Copies</Label>
                  <Input type="number" min={1} value={formData.totalCopies} onChange={(e) => setFormData({ ...formData, totalCopies: parseInt(e.target.value) || 1 })} className="h-9" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Shelf Location</Label>
                  <Input value={formData.shelfLocation} onChange={(e) => setFormData({ ...formData, shelfLocation: e.target.value })} placeholder="e.g., Rack A, Shelf 3" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Description</Label>
                  <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="h-9" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => { setShowAddForm(false); setEditingBook(null); }}>Cancel</Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                  {editingBook ? "Update Book" : "Add Book"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Book List */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : books.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No books found. Add your first book to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {books.map((book: any) => (
            <Card key={book.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{book.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                    {book.isbn && <p className="text-[10px] text-muted-foreground">ISBN: {book.isbn}</p>}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {book.category && (
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{book.category}</span>
                  )}
                  {book.shelfLocation && (
                    <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{book.shelfLocation}</span>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs">
                    <span className={cn(
                      "font-medium",
                      book.availableCopies > 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {book.availableCopies}
                    </span>
                    <span className="text-muted-foreground"> / {book.totalCopies} available</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(book)} className="text-muted-foreground hover:text-foreground p-1"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(book.id)} className="text-muted-foreground hover:text-red-600 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} books)
          </span>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={pagination.page <= 1} onClick={() => loadBooks(pagination.page - 1)} className="h-7 px-2">
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" disabled={pagination.page >= pagination.totalPages} onClick={() => loadBooks(pagination.page + 1)} className="h-7 px-2">
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

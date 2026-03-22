"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "./audit";
import { revalidatePath } from "next/cache";

// ==================== AUTH HELPER ====================

async function requireSchoolLibraryAccess() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"].includes(session.user.role)) {
    throw new Error("Insufficient permissions");
  }
  const tenantId = session.user.tenantId;
  if (!tenantId) throw new Error("No tenant");
  return { session, tenantId, userId: session.user.id };
}

// ==================== SCHOOL LIBRARY DASHBOARD STATS ====================

export async function getSchoolLibraryStats() {
  try {
    const { tenantId } = await requireSchoolLibraryAccess();

    const [totalBooks, availableBooks, totalIssued, overdueCount, recentIssues] = await Promise.all([
      prisma.libraryBook.count({ where: { tenantId, isActive: true } }),
      prisma.libraryBook.aggregate({
        where: { tenantId, isActive: true },
        _sum: { availableCopies: true },
      }),
      prisma.schoolBookIssue.count({ where: { tenantId, status: "ISSUED" } }),
      prisma.schoolBookIssue.count({
        where: { tenantId, status: "ISSUED", dueDate: { lt: new Date() } },
      }),
      prisma.schoolBookIssue.findMany({
        where: { tenantId },
        include: {
          book: { select: { title: true, author: true } },
          student: {
            select: {
              name: true,
              admissionNo: true,
              class: { select: { name: true, section: true } },
            },
          },
          issuer: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    return {
      success: true,
      data: {
        totalBooks,
        availableBooks: availableBooks._sum.availableCopies || 0,
        totalIssued,
        overdueCount,
        recentIssues: recentIssues.map((issue) => ({
          id: issue.id,
          bookTitle: issue.book.title,
          bookAuthor: issue.book.author,
          studentName: issue.student.name,
          studentAdmNo: issue.student.admissionNo,
          className: issue.student.class
            ? `${issue.student.class.name}${issue.student.class.section ? ` - ${issue.student.class.section}` : ""}`
            : "N/A",
          issueDate: issue.issueDate,
          dueDate: issue.dueDate,
          returnDate: issue.returnDate,
          status: issue.status,
          issuedBy: issue.issuer.name,
          fine: Number(issue.fine),
        })),
      },
    };
  } catch (error) {
    console.error("School library stats error:", error);
    return { success: false, error: "Failed to fetch stats" };
  }
}

// ==================== SEARCH STUDENTS BY CLASS ====================

export async function getStudentsForIssue({
  classId,
  search,
  pageSize = 20,
}: {
  classId?: string;
  search?: string;
  pageSize?: number;
} = {}) {
  try {
    const { tenantId } = await requireSchoolLibraryAccess();

    const where: Record<string, unknown> = { tenantId, status: "ACTIVE" };

    if (classId) {
      where.classId = classId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { admissionNo: { contains: search, mode: "insensitive" } },
        { rollNo: { contains: search, mode: "insensitive" } },
      ];
    }

    const students = await prisma.student.findMany({
      where,
      select: {
        id: true,
        name: true,
        admissionNo: true,
        rollNo: true,
        photoUrl: true,
        class: { select: { id: true, name: true, section: true } },
        _count: {
          select: {
            schoolBookIssues: {
              where: { status: "ISSUED" },
            },
          },
        },
      },
      orderBy: [{ name: "asc" }],
      take: pageSize,
    });

    return {
      success: true,
      data: students.map((s) => ({
        id: s.id,
        name: s.name,
        admissionNo: s.admissionNo,
        rollNo: s.rollNo,
        photoUrl: s.photoUrl,
        className: s.class
          ? `${s.class.name}${s.class.section ? ` - ${s.class.section}` : ""}`
          : "N/A",
        classId: s.class?.id || null,
        activeIssues: s._count.schoolBookIssues,
      })),
    };
  } catch (error) {
    console.error("Search students error:", error);
    return { success: false, error: "Failed to search students" };
  }
}

// ==================== GET CLASSES LIST ====================

export async function getClassesForLibrary() {
  try {
    const { tenantId } = await requireSchoolLibraryAccess();

    const classes = await prisma.class.findMany({
      where: { tenantId },
      select: { id: true, name: true, section: true },
      orderBy: [{ name: "asc" }, { section: "asc" }],
    });

    return {
      success: true,
      data: classes.map((c) => ({
        id: c.id,
        name: `${c.name}${c.section ? ` - ${c.section}` : ""}`,
      })),
    };
  } catch (error) {
    console.error("Get classes error:", error);
    return { success: false, error: "Failed to get classes" };
  }
}

// ==================== ISSUE BOOK TO STUDENT ====================

export async function issueSchoolBook(data: {
  bookId: string;
  studentId: string;
  dueDate: string;
  notes?: string;
}) {
  try {
    const { tenantId, userId } = await requireSchoolLibraryAccess();

    // Validate book
    const book = await prisma.libraryBook.findFirst({
      where: { id: data.bookId, tenantId, isActive: true },
    });
    if (!book) return { success: false, error: "Book not found" };
    if (book.availableCopies <= 0) return { success: false, error: "No copies available" };

    // Validate student
    const student = await prisma.student.findFirst({
      where: { id: data.studentId, tenantId, status: "ACTIVE" },
    });
    if (!student) return { success: false, error: "Student not found" };

    // Check max books limit (3 per student)
    const activeIssues = await prisma.schoolBookIssue.count({
      where: { tenantId, studentId: data.studentId, status: "ISSUED" },
    });
    if (activeIssues >= 3) {
      return { success: false, error: "Student already has 3 books issued. Return a book first." };
    }

    // Check if same book already issued to student
    const existingIssue = await prisma.schoolBookIssue.findFirst({
      where: { tenantId, studentId: data.studentId, bookId: data.bookId, status: "ISSUED" },
    });
    if (existingIssue) {
      return { success: false, error: "This book is already issued to this student" };
    }

    await prisma.$transaction([
      prisma.schoolBookIssue.create({
        data: {
          tenantId,
          bookId: data.bookId,
          studentId: data.studentId,
          dueDate: new Date(data.dueDate),
          notes: data.notes || null,
          issuedBy: userId,
        },
      }),
      prisma.libraryBook.update({
        where: { id: data.bookId },
        data: { availableCopies: { decrement: 1 } },
      }),
    ]);

    await logAudit({
      tenantId,
      userId,
      action: "SCHOOL_BOOK_ISSUED",
      entityType: "SchoolBookIssue",
      entityId: data.bookId,
      details: { bookTitle: book.title, studentName: student.name, studentAdmNo: student.admissionNo },
    });

    revalidatePath("/dashboard/library");
    return { success: true, message: `"${book.title}" issued to ${student.name}` };
  } catch (error) {
    console.error("Issue school book error:", error);
    return { success: false, error: "Failed to issue book" };
  }
}

// ==================== RETURN BOOK ====================

export async function returnSchoolBook(issueId: string) {
  try {
    const { tenantId, userId } = await requireSchoolLibraryAccess();

    const issue = await prisma.schoolBookIssue.findFirst({
      where: { id: issueId, tenantId, status: "ISSUED" },
      include: {
        book: { select: { title: true } },
        student: { select: { name: true, admissionNo: true } },
      },
    });
    if (!issue) return { success: false, error: "Issue record not found" };

    // Calculate fine: ₹2/day if overdue
    const now = new Date();
    let fine = 0;
    if (now > issue.dueDate) {
      const overdueDays = Math.ceil((now.getTime() - issue.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      fine = overdueDays * 2;
    }

    await prisma.$transaction([
      prisma.schoolBookIssue.update({
        where: { id: issueId },
        data: { status: "RETURNED", returnDate: now, fine },
      }),
      prisma.libraryBook.update({
        where: { id: issue.bookId },
        data: { availableCopies: { increment: 1 } },
      }),
    ]);

    await logAudit({
      tenantId,
      userId,
      action: "SCHOOL_BOOK_RETURNED",
      entityType: "SchoolBookIssue",
      entityId: issueId,
      details: {
        bookTitle: issue.book.title,
        studentName: issue.student.name,
        fine,
      },
    });

    revalidatePath("/dashboard/library");
    return {
      success: true,
      message: `Book returned by ${issue.student.name}${fine > 0 ? `. Fine: ₹${fine}` : ""}`,
      fine,
    };
  } catch (error) {
    console.error("Return school book error:", error);
    return { success: false, error: "Failed to return book" };
  }
}

// ==================== MARK BOOK LOST ====================

export async function markSchoolBookLost(issueId: string) {
  try {
    const { tenantId, userId } = await requireSchoolLibraryAccess();

    const issue = await prisma.schoolBookIssue.findFirst({
      where: { id: issueId, tenantId, status: "ISSUED" },
      include: {
        book: { select: { title: true } },
        student: { select: { name: true } },
      },
    });
    if (!issue) return { success: false, error: "Issue record not found" };

    const lostFine = 500;

    await prisma.$transaction([
      prisma.schoolBookIssue.update({
        where: { id: issueId },
        data: { status: "LOST", fine: lostFine },
      }),
      prisma.libraryBook.update({
        where: { id: issue.bookId },
        data: { totalCopies: { decrement: 1 } },
      }),
    ]);

    await logAudit({
      tenantId,
      userId,
      action: "SCHOOL_BOOK_LOST",
      entityType: "SchoolBookIssue",
      entityId: issueId,
      details: { bookTitle: issue.book.title, studentName: issue.student.name, fine: lostFine },
    });

    revalidatePath("/dashboard/library");
    return { success: true, message: `Book marked as lost. Fine: ₹${lostFine}` };
  } catch (error) {
    console.error("Mark school book lost error:", error);
    return { success: false, error: "Failed to mark as lost" };
  }
}

// ==================== GET SCHOOL BOOK ISSUES ====================

export async function getSchoolBookIssues({
  page = 1,
  pageSize = 20,
  status,
  classId,
  search,
}: {
  page?: number;
  pageSize?: number;
  status?: string;
  classId?: string;
  search?: string;
} = {}) {
  try {
    const { tenantId } = await requireSchoolLibraryAccess();

    const where: Record<string, unknown> = { tenantId };

    if (status) {
      where.status = status;
    }
    if (classId) {
      where.student = { classId };
    }
    if (search) {
      where.OR = [
        { book: { title: { contains: search, mode: "insensitive" } } },
        { student: { name: { contains: search, mode: "insensitive" } } },
        { student: { admissionNo: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [issues, total] = await Promise.all([
      prisma.schoolBookIssue.findMany({
        where,
        include: {
          book: { select: { title: true, author: true, isbn: true } },
          student: {
            select: {
              name: true,
              admissionNo: true,
              rollNo: true,
              class: { select: { name: true, section: true } },
            },
          },
          issuer: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.schoolBookIssue.count({ where }),
    ]);

    return {
      success: true,
      data: issues.map((issue) => ({
        id: issue.id,
        bookTitle: issue.book.title,
        bookAuthor: issue.book.author,
        bookIsbn: issue.book.isbn,
        studentName: issue.student.name,
        studentAdmNo: issue.student.admissionNo,
        studentRollNo: issue.student.rollNo,
        className: issue.student.class
          ? `${issue.student.class.name}${issue.student.class.section ? ` - ${issue.student.class.section}` : ""}`
          : "N/A",
        issueDate: issue.issueDate,
        dueDate: issue.dueDate,
        returnDate: issue.returnDate,
        status: issue.status,
        fine: Number(issue.fine),
        finePaid: issue.finePaid,
        issuedBy: issue.issuer.name,
        notes: issue.notes,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    console.error("Get school book issues error:", error);
    return { success: false, error: "Failed to fetch issues" };
  }
}

// ==================== GET STUDENT BOOK HISTORY ====================

export async function getStudentBookHistory(studentId: string) {
  try {
    const { tenantId } = await requireSchoolLibraryAccess();

    const issues = await prisma.schoolBookIssue.findMany({
      where: { tenantId, studentId },
      include: {
        book: { select: { title: true, author: true } },
        issuer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: issues.map((issue) => ({
        id: issue.id,
        bookTitle: issue.book.title,
        bookAuthor: issue.book.author,
        issueDate: issue.issueDate,
        dueDate: issue.dueDate,
        returnDate: issue.returnDate,
        status: issue.status,
        fine: Number(issue.fine),
        finePaid: issue.finePaid,
      })),
    };
  } catch (error) {
    console.error("Get student book history error:", error);
    return { success: false, error: "Failed to fetch history" };
  }
}

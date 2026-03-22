"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "./audit";
import { sendEmail } from "@/lib/email";
import type { PaymentMethod, SlotType, Gender } from "@/generated/prisma/client";

// ==================== AUTH HELPERS ====================

async function requireLibraryAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"].includes(session.user.role)) {
    throw new Error("Insufficient permissions");
  }
  const tenantId = session.user.tenantId;
  if (!tenantId) throw new Error("No tenant");
  return { session, tenantId, userId: session.user.id };
}

async function requireTenantUser() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const tenantId = session.user.tenantId;
  if (!tenantId) throw new Error("No tenant");
  return { session, tenantId, userId: session.user.id };
}

// ==================== DASHBOARD STATS ====================

export async function getLibraryDashboardStats() {
  try {
    const { tenantId } = await requireTenantUser();

    const [
      totalSeats,
      availableSeats,
      occupiedSeats,
      totalMembers,
      activeMembers,
      expiredMembers,
      totalBooks,
      issuedBooks,
      overdueBooks,
      pendingFees,
      collectedFees,
      recentMembers,
      recentIssues,
      monthlyRevenue,
    ] = await Promise.all([
      prisma.librarySeat.count({ where: { tenantId, isActive: true } }),
      prisma.librarySeat.count({ where: { tenantId, isActive: true, status: "AVAILABLE" } }),
      prisma.librarySeat.count({ where: { tenantId, isActive: true, status: "OCCUPIED" } }),
      prisma.libraryMember.count({ where: { tenantId } }),
      prisma.libraryMember.count({ where: { tenantId, status: "ACTIVE" } }),
      prisma.libraryMember.count({ where: { tenantId, status: "EXPIRED" } }),
      prisma.libraryBook.count({ where: { tenantId, isActive: true } }),
      prisma.libraryBookIssue.count({ where: { tenantId, status: "ISSUED" } }),
      prisma.libraryBookIssue.count({ where: { tenantId, status: "OVERDUE" } }),
      prisma.libraryFee.aggregate({
        where: { tenantId, status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
        _sum: { amount: true },
      }),
      prisma.libraryFee.aggregate({
        where: { tenantId, status: "PAID" },
        _sum: { amountPaid: true },
      }),
      prisma.libraryMember.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, memberId: true, email: true, status: true, joiningDate: true },
      }),
      prisma.libraryBookIssue.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          book: { select: { title: true } },
          member: { select: { name: true, memberId: true } },
        },
      }),
      // Monthly revenue for last 6 months
      prisma.$queryRaw`
        SELECT 
          EXTRACT(MONTH FROM "paidDate") as month,
          EXTRACT(YEAR FROM "paidDate") as year,
          SUM("amountPaid") as total
        FROM "LibraryFee"
        WHERE "tenantId" = ${tenantId} 
          AND "status" = 'PAID' 
          AND "paidDate" >= NOW() - INTERVAL '6 months'
        GROUP BY EXTRACT(MONTH FROM "paidDate"), EXTRACT(YEAR FROM "paidDate")
        ORDER BY year, month
      `,
    ]);

    // Slot distribution
    const slotDistribution = await prisma.librarySeatAllocation.groupBy({
      by: ["slotType"],
      where: { tenantId, isActive: true },
      _count: true,
    });

    return {
      success: true,
      data: {
        seats: { total: totalSeats, available: availableSeats, occupied: occupiedSeats, maintenance: totalSeats - availableSeats - occupiedSeats },
        members: { total: totalMembers, active: activeMembers, expired: expiredMembers, suspended: totalMembers - activeMembers - expiredMembers },
        books: { total: totalBooks, issued: issuedBooks, overdue: overdueBooks },
        fees: {
          pending: Number(pendingFees._sum.amount || 0),
          collected: Number(collectedFees._sum.amountPaid || 0),
        },
        recentMembers,
        recentIssues: recentIssues.map((i) => ({
          id: i.id,
          bookTitle: i.book.title,
          memberName: i.member.name,
          memberId: i.member.memberId,
          issueDate: i.issueDate,
          dueDate: i.dueDate,
          returnDate: i.returnDate,
          status: i.status,
        })),
        monthlyRevenue,
        slotDistribution: slotDistribution.map((s) => ({
          slotType: s.slotType,
          count: s._count,
        })),
      },
    };
  } catch (error) {
    console.error("Library dashboard stats error:", error);
    return { success: false, error: "Failed to load dashboard stats" };
  }
}

// ==================== SEAT MANAGEMENT ====================

export async function getSeats(filters?: { status?: string; zone?: string; floor?: string }) {
  try {
    const { tenantId } = await requireTenantUser();

    const where: Record<string, unknown> = { tenantId, isActive: true };
    if (filters?.status) where.status = filters.status;
    if (filters?.zone) where.zone = filters.zone;
    if (filters?.floor) where.floor = filters.floor;

    const seats = await prisma.librarySeat.findMany({
      where,
      include: {
        allocations: {
          where: { isActive: true },
          include: { member: { select: { id: true, name: true, memberId: true } } },
        },
      },
      orderBy: { seatNumber: "asc" },
    });

    return {
      success: true,
      data: seats.map((s) => ({
        ...s,
        currentAllocation: s.allocations[0] || null,
      })),
    };
  } catch (error) {
    console.error("Get seats error:", error);
    return { success: false, error: "Failed to load seats" };
  }
}

export async function createSeat(data: {
  seatNumber: string;
  zone?: string;
  floor?: string;
  hasWifi?: boolean;
  hasPower?: boolean;
}) {
  try {
    const { tenantId, userId } = await requireLibraryAdmin();

    const existing = await prisma.librarySeat.findUnique({
      where: { tenantId_seatNumber: { tenantId, seatNumber: data.seatNumber } },
    });
    if (existing) return { success: false, error: "Seat number already exists" };

    const seat = await prisma.librarySeat.create({
      data: { tenantId, ...data },
    });

    await logAudit({ tenantId, userId, action: "CREATE_SEAT", entityType: "LibrarySeat", entityId: seat.id, details: { seatNumber: data.seatNumber } });

    return { success: true, data: seat };
  } catch (error) {
    console.error("Create seat error:", error);
    return { success: false, error: "Failed to create seat" };
  }
}

export async function createBulkSeats(data: {
  prefix: string;
  startNumber: number;
  count: number;
  zone?: string;
  floor?: string;
  hasWifi?: boolean;
  hasPower?: boolean;
}) {
  try {
    const { tenantId, userId } = await requireLibraryAdmin();

    const seats = [];
    for (let i = 0; i < data.count; i++) {
      const seatNumber = `${data.prefix}${data.startNumber + i}`;
      seats.push({
        tenantId,
        seatNumber,
        zone: data.zone,
        floor: data.floor,
        hasWifi: data.hasWifi ?? true,
        hasPower: data.hasPower ?? true,
      });
    }

    const result = await prisma.librarySeat.createMany({
      data: seats,
      skipDuplicates: true,
    });

    await logAudit({ tenantId, userId, action: "CREATE_BULK_SEATS", entityType: "LibrarySeat", details: { count: result.count } });

    return { success: true, data: { created: result.count } };
  } catch (error) {
    console.error("Bulk create seats error:", error);
    return { success: false, error: "Failed to create seats" };
  }
}

export async function updateSeat(id: string, data: {
  seatNumber?: string;
  zone?: string;
  floor?: string;
  hasWifi?: boolean;
  hasPower?: boolean;
  status?: string;
  isActive?: boolean;
}) {
  try {
    const { tenantId, userId } = await requireLibraryAdmin();

    const seat = await prisma.librarySeat.update({
      where: { id, tenantId },
      data: data as Record<string, unknown>,
    });

    await logAudit({ tenantId, userId, action: "UPDATE_SEAT", entityType: "LibrarySeat", entityId: id });

    return { success: true, data: seat };
  } catch (error) {
    console.error("Update seat error:", error);
    return { success: false, error: "Failed to update seat" };
  }
}

export async function deleteSeat(id: string) {
  try {
    const { tenantId, userId } = await requireLibraryAdmin();

    const activeAllocations = await prisma.librarySeatAllocation.count({
      where: { tenantId, seatId: id, isActive: true },
    });
    if (activeAllocations > 0) {
      return { success: false, error: "Cannot delete seat with active allocations. Please relocate members first." };
    }

    await prisma.librarySeat.update({
      where: { id, tenantId },
      data: { isActive: false, status: "MAINTENANCE" },
    });

    await logAudit({ tenantId, userId, action: "DELETE_SEAT", entityType: "LibrarySeat", entityId: id });

    return { success: true };
  } catch (error) {
    console.error("Delete seat error:", error);
    return { success: false, error: "Failed to delete seat" };
  }
}

export async function allocateSeat(data: {
  seatId: string;
  memberId: string;
  slotType: SlotType;
  startDate: string;
  endDate: string;
}) {
  try {
    const { tenantId, userId } = await requireLibraryAdmin();

    // Check seat availability
    const seat = await prisma.librarySeat.findFirst({
      where: { id: data.seatId, tenantId, isActive: true },
    });
    if (!seat) return { success: false, error: "Seat not found" };

    // Check member exists
    const member = await prisma.libraryMember.findFirst({
      where: { id: data.memberId, tenantId, status: "ACTIVE" },
    });
    if (!member) return { success: false, error: "Member not found or not active" };

    // Check for existing active allocation on this seat with overlapping dates
    const existingAllocation = await prisma.librarySeatAllocation.findFirst({
      where: {
        tenantId,
        seatId: data.seatId,
        isActive: true,
        startDate: { lte: new Date(data.endDate) },
        endDate: { gte: new Date(data.startDate) },
      },
    });
    if (existingAllocation) return { success: false, error: "Seat already allocated for this period" };

    const allocation = await prisma.$transaction(async (tx) => {
      const alloc = await tx.librarySeatAllocation.create({
        data: {
          tenantId,
          seatId: data.seatId,
          memberId: data.memberId,
          slotType: data.slotType,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
        },
      });

      await tx.librarySeat.update({
        where: { id: data.seatId },
        data: { status: "OCCUPIED" },
      });

      return alloc;
    });

    await logAudit({ tenantId, userId, action: "ALLOCATE_SEAT", entityType: "LibrarySeatAllocation", entityId: allocation.id, details: { seatId: data.seatId, memberId: data.memberId } });

    return { success: true, data: allocation };
  } catch (error) {
    console.error("Allocate seat error:", error);
    return { success: false, error: "Failed to allocate seat" };
  }
}

export async function deallocateSeat(allocationId: string) {
  try {
    const { tenantId, userId } = await requireLibraryAdmin();

    const allocation = await prisma.librarySeatAllocation.findFirst({
      where: { id: allocationId, tenantId, isActive: true },
    });
    if (!allocation) return { success: false, error: "Allocation not found" };

    await prisma.$transaction(async (tx) => {
      await tx.librarySeatAllocation.update({
        where: { id: allocationId },
        data: { isActive: false },
      });

      // Check if seat has any other active allocations
      const otherAllocations = await tx.librarySeatAllocation.count({
        where: { seatId: allocation.seatId, isActive: true, id: { not: allocationId } },
      });

      if (otherAllocations === 0) {
        await tx.librarySeat.update({
          where: { id: allocation.seatId },
          data: { status: "AVAILABLE" },
        });
      }
    });

    await logAudit({ tenantId, userId, action: "DEALLOCATE_SEAT", entityType: "LibrarySeatAllocation", entityId: allocationId });

    return { success: true };
  } catch (error) {
    console.error("Deallocate seat error:", error);
    return { success: false, error: "Failed to deallocate seat" };
  }
}

// ==================== MEMBER MANAGEMENT ====================

export async function getMembers(filters?: {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const { tenantId } = await requireTenantUser();
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;

    const where: Record<string, unknown> = { tenantId };
    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { memberId: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search } },
      ];
    }

    const [members, total] = await Promise.all([
      prisma.libraryMember.findMany({
        where,
        include: {
          seatAllocations: {
            where: { isActive: true },
            include: { seat: { select: { seatNumber: true, zone: true } } },
          },
          _count: { select: { bookIssues: true, feeRecords: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.libraryMember.count({ where }),
    ]);

    return {
      success: true,
      data: members,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  } catch (error) {
    console.error("Get members error:", error);
    return { success: false, error: "Failed to load members" };
  }
}

export async function getMemberById(id: string) {
  try {
    const { tenantId } = await requireTenantUser();

    const member = await prisma.libraryMember.findFirst({
      where: { id, tenantId },
      include: {
        seatAllocations: {
          include: { seat: true },
          orderBy: { createdAt: "desc" },
        },
        bookIssues: {
          include: { book: { select: { title: true, author: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        feeRecords: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!member) return { success: false, error: "Member not found" };

    // Calculate fee summary
    const feeSummary = await prisma.libraryFee.aggregate({
      where: { tenantId, memberId: id },
      _sum: { amount: true, amountPaid: true, discount: true },
    });

    return {
      success: true,
      data: {
        ...member,
        feeSummary: {
          totalDue: Number(feeSummary._sum.amount || 0),
          totalPaid: Number(feeSummary._sum.amountPaid || 0),
          totalDiscount: Number(feeSummary._sum.discount || 0),
          balance: Number(feeSummary._sum.amount || 0) - Number(feeSummary._sum.amountPaid || 0) - Number(feeSummary._sum.discount || 0),
        },
      },
    };
  } catch (error) {
    console.error("Get member error:", error);
    return { success: false, error: "Failed to load member" };
  }
}

export async function createMember(data: {
  name: string;
  email: string;
  phone: string;
  address?: string;
  dateOfBirth?: string;
  gender?: Gender;
  emergencyContact?: string;
  notes?: string;
}) {
  try {
    const { tenantId, userId } = await requireLibraryAdmin();

    // Generate unique member ID
    const memberCount = await prisma.libraryMember.count({ where: { tenantId } });
    const memberId = `LIB-${String(memberCount + 1).padStart(4, "0")}`;

    const member = await prisma.libraryMember.create({
      data: {
        tenantId,
        memberId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        gender: data.gender,
        emergencyContact: data.emergencyContact,
        notes: data.notes,
      },
    });

    await logAudit({ tenantId, userId, action: "CREATE_MEMBER", entityType: "LibraryMember", entityId: member.id, details: { memberId, name: data.name } });

    return { success: true, data: member };
  } catch (error: unknown) {
    console.error("Create member error:", error);
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { success: false, error: "A member with this email already exists" };
    }
    return { success: false, error: "Failed to create member" };
  }
}

export async function updateMember(id: string, data: {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: Gender;
  emergencyContact?: string;
  status?: string;
  expiryDate?: string;
  notes?: string;
}) {
  try {
    const { tenantId, userId } = await requireLibraryAdmin();

    const updateData: Record<string, unknown> = { ...data };
    if (data.dateOfBirth) updateData.dateOfBirth = new Date(data.dateOfBirth);
    if (data.expiryDate) updateData.expiryDate = new Date(data.expiryDate);

    const member = await prisma.libraryMember.update({
      where: { id, tenantId },
      data: updateData,
    });

    await logAudit({ tenantId, userId, action: "UPDATE_MEMBER", entityType: "LibraryMember", entityId: id });

    return { success: true, data: member };
  } catch (error) {
    console.error("Update member error:", error);
    return { success: false, error: "Failed to update member" };
  }
}

export async function deleteMember(id: string) {
  try {
    const { tenantId, userId } = await requireLibraryAdmin();

    // Check for active book issues
    const activeIssues = await prisma.libraryBookIssue.count({
      where: { tenantId, memberId: id, status: { in: ["ISSUED", "OVERDUE"] } },
    });
    if (activeIssues > 0) {
      return { success: false, error: "Cannot delete member with unreturned books" };
    }

    // Check for pending fees
    const pendingFees = await prisma.libraryFee.count({
      where: { tenantId, memberId: id, status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
    });
    if (pendingFees > 0) {
      return { success: false, error: "Cannot delete member with pending fees" };
    }

    await prisma.libraryMember.update({
      where: { id, tenantId },
      data: { status: "SUSPENDED" },
    });

    await logAudit({ tenantId, userId, action: "DELETE_MEMBER", entityType: "LibraryMember", entityId: id });

    return { success: true };
  } catch (error) {
    console.error("Delete member error:", error);
    return { success: false, error: "Failed to delete member" };
  }
}

// ==================== BOOK MANAGEMENT ====================

export async function getBooks(filters?: {
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const { tenantId } = await requireTenantUser();
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;

    const where: Record<string, unknown> = { tenantId, isActive: true };
    if (filters?.category) where.category = filters.category;
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { author: { contains: filters.search, mode: "insensitive" } },
        { isbn: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [books, total] = await Promise.all([
      prisma.libraryBook.findMany({
        where,
        include: {
          _count: { select: { issues: true } },
        },
        orderBy: { title: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.libraryBook.count({ where }),
    ]);

    return {
      success: true,
      data: books,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  } catch (error) {
    console.error("Get books error:", error);
    return { success: false, error: "Failed to load books" };
  }
}

export async function createBook(data: {
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  category?: string;
  edition?: string;
  totalCopies?: number;
  shelfLocation?: string;
  description?: string;
}) {
  try {
    const { tenantId, userId } = await requireLibraryAdmin();

    const book = await prisma.libraryBook.create({
      data: {
        tenantId,
        ...data,
        availableCopies: data.totalCopies || 1,
      },
    });

    await logAudit({ tenantId, userId, action: "CREATE_BOOK", entityType: "LibraryBook", entityId: book.id, details: { title: data.title } });

    return { success: true, data: book };
  } catch (error) {
    console.error("Create book error:", error);
    return { success: false, error: "Failed to create book" };
  }
}

export async function updateBook(id: string, data: {
  title?: string;
  author?: string;
  isbn?: string;
  publisher?: string;
  category?: string;
  edition?: string;
  totalCopies?: number;
  shelfLocation?: string;
  description?: string;
}) {
  try {
    const { tenantId, userId } = await requireLibraryAdmin();

    // If totalCopies changed, adjust availableCopies
    if (data.totalCopies !== undefined) {
      const book = await prisma.libraryBook.findFirst({ where: { id, tenantId } });
      if (!book) return { success: false, error: "Book not found" };

      const issuedCopies = book.totalCopies - book.availableCopies;
      if (data.totalCopies < issuedCopies) {
        return { success: false, error: `Cannot reduce copies below ${issuedCopies} (currently issued)` };
      }
      (data as Record<string, unknown>).availableCopies = data.totalCopies - issuedCopies;
    }

    const book = await prisma.libraryBook.update({
      where: { id, tenantId },
      data,
    });

    await logAudit({ tenantId, userId, action: "UPDATE_BOOK", entityType: "LibraryBook", entityId: id });

    return { success: true, data: book };
  } catch (error) {
    console.error("Update book error:", error);
    return { success: false, error: "Failed to update book" };
  }
}

export async function deleteBook(id: string) {
  try {
    const { tenantId, userId } = await requireLibraryAdmin();

    const activeIssues = await prisma.libraryBookIssue.count({
      where: { tenantId, bookId: id, status: { in: ["ISSUED", "OVERDUE"] } },
    });
    if (activeIssues > 0) {
      return { success: false, error: "Cannot delete book with active issues" };
    }

    await prisma.libraryBook.update({
      where: { id, tenantId },
      data: { isActive: false },
    });

    await logAudit({ tenantId, userId, action: "DELETE_BOOK", entityType: "LibraryBook", entityId: id });

    return { success: true };
  } catch (error) {
    console.error("Delete book error:", error);
    return { success: false, error: "Failed to delete book" };
  }
}

export async function getBookCategories() {
  try {
    const { tenantId } = await requireTenantUser();

    const categories = await prisma.libraryBook.findMany({
      where: { tenantId, isActive: true, category: { not: null } },
      distinct: ["category"],
      select: { category: true },
    });

    return { success: true, data: categories.map((c) => c.category).filter(Boolean) };
  } catch (error) {
    console.error("Get categories error:", error);
    return { success: false, error: "Failed to load categories" };
  }
}

// ==================== BOOK ISSUE / RETURN ====================

export async function issueBook(data: {
  bookId: string;
  memberId: string;
  dueDate: string;
  notes?: string;
}) {
  try {
    const { tenantId, userId } = await requireLibraryAdmin();

    const [book, member] = await Promise.all([
      prisma.libraryBook.findFirst({ where: { id: data.bookId, tenantId, isActive: true } }),
      prisma.libraryMember.findFirst({ where: { id: data.memberId, tenantId, status: "ACTIVE" } }),
    ]);

    if (!book) return { success: false, error: "Book not found" };
    if (!member) return { success: false, error: "Member not found or not active" };
    if (book.availableCopies <= 0) return { success: false, error: "No copies available" };

    // Check max books per member (limit to 3)
    const activeIssues = await prisma.libraryBookIssue.count({
      where: { tenantId, memberId: data.memberId, status: "ISSUED" },
    });
    if (activeIssues >= 3) {
      return { success: false, error: "Member already has 3 books issued. Return one first." };
    }

    const issue = await prisma.$transaction(async (tx) => {
      const bookIssue = await tx.libraryBookIssue.create({
        data: {
          tenantId,
          bookId: data.bookId,
          memberId: data.memberId,
          dueDate: new Date(data.dueDate),
          issuedBy: userId,
          notes: data.notes,
        },
      });

      await tx.libraryBook.update({
        where: { id: data.bookId },
        data: { availableCopies: { decrement: 1 } },
      });

      return bookIssue;
    });

    await logAudit({ tenantId, userId, action: "ISSUE_BOOK", entityType: "LibraryBookIssue", entityId: issue.id, details: { bookId: data.bookId, memberId: data.memberId } });

    return { success: true, data: issue };
  } catch (error) {
    console.error("Issue book error:", error);
    return { success: false, error: "Failed to issue book" };
  }
}

export async function returnBook(issueId: string, data?: { fine?: number; notes?: string }) {
  try {
    const { tenantId, userId } = await requireLibraryAdmin();

    const issue = await prisma.libraryBookIssue.findFirst({
      where: { id: issueId, tenantId, status: { in: ["ISSUED", "OVERDUE"] } },
    });
    if (!issue) return { success: false, error: "Book issue not found or already returned" };

    // Calculate fine if overdue
    const now = new Date();
    let fine = data?.fine || 0;
    if (now > issue.dueDate && fine === 0) {
      const daysOverdue = Math.ceil((now.getTime() - issue.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      fine = daysOverdue * 5; // ₹5 per day fine
    }

    await prisma.$transaction(async (tx) => {
      await tx.libraryBookIssue.update({
        where: { id: issueId },
        data: {
          returnDate: now,
          fine,
          status: "RETURNED",
          notes: data?.notes,
        },
      });

      await tx.libraryBook.update({
        where: { id: issue.bookId },
        data: { availableCopies: { increment: 1 } },
      });
    });

    await logAudit({ tenantId, userId, action: "RETURN_BOOK", entityType: "LibraryBookIssue", entityId: issueId, details: { fine } });

    return { success: true, data: { fine } };
  } catch (error) {
    console.error("Return book error:", error);
    return { success: false, error: "Failed to return book" };
  }
}

export async function markBookLost(issueId: string) {
  try {
    const { tenantId, userId } = await requireLibraryAdmin();

    const issue = await prisma.libraryBookIssue.findFirst({
      where: { id: issueId, tenantId, status: { in: ["ISSUED", "OVERDUE"] } },
      include: { book: true },
    });
    if (!issue) return { success: false, error: "Book issue not found" };

    await prisma.libraryBookIssue.update({
      where: { id: issueId },
      data: { status: "LOST", fine: 500 }, // ₹500 fine for lost book
    });

    // Don't increment available copies for lost books, but reduce total
    await prisma.libraryBook.update({
      where: { id: issue.bookId },
      data: { totalCopies: { decrement: 1 } },
    });

    await logAudit({ tenantId, userId, action: "MARK_BOOK_LOST", entityType: "LibraryBookIssue", entityId: issueId });

    return { success: true };
  } catch (error) {
    console.error("Mark book lost error:", error);
    return { success: false, error: "Failed to mark book as lost" };
  }
}

export async function getBookIssues(filters?: {
  status?: string;
  memberId?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const { tenantId } = await requireTenantUser();
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;

    const where: Record<string, unknown> = { tenantId };
    if (filters?.status) where.status = filters.status;
    if (filters?.memberId) where.memberId = filters.memberId;

    const [issues, total] = await Promise.all([
      prisma.libraryBookIssue.findMany({
        where,
        include: {
          book: { select: { title: true, author: true, isbn: true } },
          member: { select: { name: true, memberId: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.libraryBookIssue.count({ where }),
    ]);

    return {
      success: true,
      data: issues,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  } catch (error) {
    console.error("Get book issues error:", error);
    return { success: false, error: "Failed to load book issues" };
  }
}

// ==================== FEE MANAGEMENT ====================

export async function getLibraryPricing() {
  try {
    const { tenantId } = await requireTenantUser();

    const pricing = await prisma.libraryPricing.findMany({
      where: { tenantId, isActive: true },
      orderBy: { slotType: "asc" },
    });

    return { success: true, data: pricing };
  } catch (error) {
    console.error("Get pricing error:", error);
    return { success: false, error: "Failed to load pricing" };
  }
}

export async function upsertLibraryPricing(data: {
  slotType: SlotType;
  name: string;
  amount: number;
  duration?: string;
  description?: string;
}) {
  try {
    const { tenantId, userId } = await requireLibraryAdmin();

    const pricing = await prisma.libraryPricing.upsert({
      where: { tenantId_slotType: { tenantId, slotType: data.slotType } },
      update: { name: data.name, amount: data.amount, duration: data.duration, description: data.description },
      create: { tenantId, slotType: data.slotType, name: data.name, amount: data.amount, duration: data.duration, description: data.description },
    });

    await logAudit({ tenantId, userId, action: "UPDATE_PRICING", entityType: "LibraryPricing", entityId: pricing.id });

    return { success: true, data: pricing };
  } catch (error) {
    console.error("Update pricing error:", error);
    return { success: false, error: "Failed to update pricing" };
  }
}

export async function generateMemberFee(data: {
  memberId: string;
  slotType: SlotType;
  month: number;
  year: number;
}) {
  try {
    const { tenantId, userId } = await requireLibraryAdmin();

    const member = await prisma.libraryMember.findFirst({
      where: { id: data.memberId, tenantId },
    });
    if (!member) return { success: false, error: "Member not found" };

    const pricing = await prisma.libraryPricing.findUnique({
      where: { tenantId_slotType: { tenantId, slotType: data.slotType } },
    });
    if (!pricing) return { success: false, error: "Pricing not configured for this slot type" };

    // Check for duplicate
    const existing = await prisma.libraryFee.findFirst({
      where: { tenantId, memberId: data.memberId, slotType: data.slotType, month: data.month, year: data.year },
    });
    if (existing) return { success: false, error: "Fee already generated for this month" };

    const dueDate = new Date(data.year, data.month - 1, 10); // Due on 10th of the month

    const fee = await prisma.libraryFee.create({
      data: {
        tenantId,
        memberId: data.memberId,
        description: `${pricing.name} - ${new Date(data.year, data.month - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`,
        slotType: data.slotType,
        amount: Number(pricing.amount),
        dueDate,
        month: data.month,
        year: data.year,
      },
    });

    await logAudit({ tenantId, userId, action: "GENERATE_FEE", entityType: "LibraryFee", entityId: fee.id, details: { memberId: data.memberId, amount: Number(pricing.amount) } });

    return { success: true, data: fee };
  } catch (error) {
    console.error("Generate fee error:", error);
    return { success: false, error: "Failed to generate fee" };
  }
}

export async function generateBulkFees(data: {
  slotType: SlotType;
  month: number;
  year: number;
}) {
  try {
    const { tenantId, userId } = await requireLibraryAdmin();

    const pricing = await prisma.libraryPricing.findUnique({
      where: { tenantId_slotType: { tenantId, slotType: data.slotType } },
    });
    if (!pricing) return { success: false, error: "Pricing not configured for this slot type" };

    // Get all active members with this slot type allocation
    const activeAllocations = await prisma.librarySeatAllocation.findMany({
      where: { tenantId, slotType: data.slotType, isActive: true },
      select: { memberId: true },
    });

    const memberIds = [...new Set(activeAllocations.map((a) => a.memberId))];
    if (memberIds.length === 0) return { success: false, error: "No active members with this slot type" };

    // Check which already have fees for this month
    const existingFees = await prisma.libraryFee.findMany({
      where: { tenantId, slotType: data.slotType, month: data.month, year: data.year, memberId: { in: memberIds } },
      select: { memberId: true },
    });
    const existingMemberIds = new Set(existingFees.map((f) => f.memberId));

    const newMembers = memberIds.filter((id) => !existingMemberIds.has(id));
    if (newMembers.length === 0) return { success: true, data: { generated: 0, skipped: memberIds.length } };

    const dueDate = new Date(data.year, data.month - 1, 10);
    const description = `${pricing.name} - ${new Date(data.year, data.month - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`;

    await prisma.libraryFee.createMany({
      data: newMembers.map((memberId) => ({
        tenantId,
        memberId,
        description,
        slotType: data.slotType,
        amount: Number(pricing.amount),
        dueDate,
        month: data.month,
        year: data.year,
      })),
    });

    await logAudit({ tenantId, userId, action: "GENERATE_BULK_FEES", entityType: "LibraryFee", details: { count: newMembers.length, slotType: data.slotType } });

    return { success: true, data: { generated: newMembers.length, skipped: existingMemberIds.size } };
  } catch (error) {
    console.error("Generate bulk fees error:", error);
    return { success: false, error: "Failed to generate fees" };
  }
}

export async function collectLibraryFee(data: {
  feeId: string;
  amountPaying: number;
  discount?: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}) {
  try {
    const { tenantId, userId } = await requireLibraryAdmin();

    const fee = await prisma.libraryFee.findFirst({
      where: { id: data.feeId, tenantId },
      include: { member: { select: { name: true, memberId: true } } },
    });
    if (!fee) return { success: false, error: "Fee record not found" };

    const totalDue = Number(fee.amount) - Number(fee.amountPaid) - Number(fee.discount);
    const discount = data.discount || 0;
    const effectiveDue = totalDue - discount;

    if (data.amountPaying > effectiveDue) {
      return { success: false, error: "Amount exceeds balance due" };
    }

    // Generate receipt number
    const feeCount = await prisma.libraryFee.count({ where: { tenantId, receiptNo: { not: null } } });
    const receiptNo = `LRCPT-${String(feeCount + 1).padStart(5, "0")}`;

    const newAmountPaid = Number(fee.amountPaid) + data.amountPaying;
    const newDiscount = Number(fee.discount) + discount;
    const remaining = Number(fee.amount) - newAmountPaid - newDiscount;

    const status = remaining <= 0 ? "PAID" : "PARTIAL";

    await prisma.libraryFee.update({
      where: { id: data.feeId },
      data: {
        amountPaid: newAmountPaid,
        discount: newDiscount,
        paidDate: new Date(),
        paymentMethod: data.paymentMethod,
        receiptNo,
        status,
        notes: data.notes,
        collectedBy: userId,
      },
    });

    await logAudit({ tenantId, userId, action: "COLLECT_FEE", entityType: "LibraryFee", entityId: data.feeId, details: { amount: data.amountPaying, receiptNo } });

    return { success: true, data: { receiptNo, status } };
  } catch (error) {
    console.error("Collect fee error:", error);
    return { success: false, error: "Failed to collect fee" };
  }
}

export async function getMemberFees(memberId: string) {
  try {
    const { tenantId } = await requireTenantUser();

    const fees = await prisma.libraryFee.findMany({
      where: { tenantId, memberId },
      orderBy: { createdAt: "desc" },
    });

    const summary = await prisma.libraryFee.aggregate({
      where: { tenantId, memberId },
      _sum: { amount: true, amountPaid: true, discount: true },
    });

    return {
      success: true,
      data: {
        fees,
        summary: {
          total: Number(summary._sum.amount || 0),
          paid: Number(summary._sum.amountPaid || 0),
          discount: Number(summary._sum.discount || 0),
          balance: Number(summary._sum.amount || 0) - Number(summary._sum.amountPaid || 0) - Number(summary._sum.discount || 0),
        },
      },
    };
  } catch (error) {
    console.error("Get member fees error:", error);
    return { success: false, error: "Failed to load fees" };
  }
}

export async function getPendingFees(filters?: { page?: number; pageSize?: number }) {
  try {
    const { tenantId } = await requireLibraryAdmin();
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;

    const [fees, total] = await Promise.all([
      prisma.libraryFee.findMany({
        where: { tenantId, status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
        include: { member: { select: { name: true, memberId: true, email: true, phone: true } } },
        orderBy: { dueDate: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.libraryFee.count({ where: { tenantId, status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } } }),
    ]);

    return {
      success: true,
      data: fees,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  } catch (error) {
    console.error("Get pending fees error:", error);
    return { success: false, error: "Failed to load pending fees" };
  }
}

// ==================== EMAIL NOTIFICATIONS ====================

export async function sendFeeReminders() {
  try {
    const { tenantId, userId } = await requireLibraryAdmin();

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } });

    const pendingFees = await prisma.libraryFee.findMany({
      where: {
        tenantId,
        status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
        dueDate: { lte: new Date() },
      },
      include: { member: { select: { name: true, email: true } } },
    });

    let sent = 0;
    for (const fee of pendingFees) {
      const balance = Number(fee.amount) - Number(fee.amountPaid) - Number(fee.discount);
      if (balance <= 0) continue;

      await sendEmail({
        to: fee.member.email,
        subject: `Fee Payment Reminder - ${tenant?.name || "Library"}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e293b;">Fee Payment Reminder</h2>
            <p>Dear <strong>${fee.member.name}</strong>,</p>
            <p>This is a reminder that your library fee payment of <strong>₹${balance.toLocaleString("en-IN")}</strong> is overdue.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr style="background: #f8fafc;">
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Description</td>
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${fee.description}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Amount Due</td>
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">₹${balance.toLocaleString("en-IN")}</td>
              </tr>
              <tr style="background: #f8fafc;">
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Due Date</td>
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${fee.dueDate.toLocaleDateString("en-IN")}</td>
              </tr>
            </table>
            <p>Please clear the dues at the earliest to avoid any disruption in services.</p>
            <p style="color: #64748b; font-size: 14px;">Thank you,<br/>${tenant?.name || "Library"}</p>
          </div>
        `,
      });
      sent++;
    }

    await logAudit({ tenantId, userId, action: "SEND_FEE_REMINDERS", details: { sent } });

    return { success: true, data: { sent } };
  } catch (error) {
    console.error("Send fee reminders error:", error);
    return { success: false, error: "Failed to send reminders" };
  }
}

export async function sendBookReturnReminders() {
  try {
    const { tenantId, userId } = await requireLibraryAdmin();

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } });

    const overdueBooks = await prisma.libraryBookIssue.findMany({
      where: {
        tenantId,
        status: "ISSUED",
        dueDate: { lt: new Date() },
      },
      include: {
        book: { select: { title: true } },
        member: { select: { name: true, email: true } },
      },
    });

    // Mark them as overdue
    if (overdueBooks.length > 0) {
      await prisma.libraryBookIssue.updateMany({
        where: {
          id: { in: overdueBooks.map((b) => b.id) },
        },
        data: { status: "OVERDUE" },
      });
    }

    let sent = 0;
    for (const issue of overdueBooks) {
      const daysOverdue = Math.ceil((new Date().getTime() - issue.dueDate.getTime()) / (1000 * 60 * 60 * 24));

      await sendEmail({
        to: issue.member.email,
        subject: `Book Return Overdue - ${tenant?.name || "Library"}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Book Return Overdue</h2>
            <p>Dear <strong>${issue.member.name}</strong>,</p>
            <p>The following book is <strong>${daysOverdue} day(s) overdue</strong> for return:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr style="background: #fef2f2;">
                <td style="padding: 8px 12px; border: 1px solid #fecaca; font-weight: 600;">Book</td>
                <td style="padding: 8px 12px; border: 1px solid #fecaca;">${issue.book.title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #fecaca; font-weight: 600;">Due Date</td>
                <td style="padding: 8px 12px; border: 1px solid #fecaca;">${issue.dueDate.toLocaleDateString("en-IN")}</td>
              </tr>
              <tr style="background: #fef2f2;">
                <td style="padding: 8px 12px; border: 1px solid #fecaca; font-weight: 600;">Fine Accrued</td>
                <td style="padding: 8px 12px; border: 1px solid #fecaca;">₹${(daysOverdue * 5).toLocaleString("en-IN")} (₹5/day)</td>
              </tr>
            </table>
            <p>Please return the book immediately to avoid further fines.</p>
            <p style="color: #64748b; font-size: 14px;">Thank you,<br/>${tenant?.name || "Library"}</p>
          </div>
        `,
      });
      sent++;
    }

    await logAudit({ tenantId, userId, action: "SEND_BOOK_REMINDERS", details: { sent, overdueCount: overdueBooks.length } });

    return { success: true, data: { sent, overdueMarked: overdueBooks.length } };
  } catch (error) {
    console.error("Send book return reminders error:", error);
    return { success: false, error: "Failed to send reminders" };
  }
}

// ==================== ID CARD ====================

export async function issueIdCard(memberId: string) {
  try {
    const { tenantId, userId } = await requireLibraryAdmin();

    const member = await prisma.libraryMember.findFirst({
      where: { id: memberId, tenantId },
    });
    if (!member) return { success: false, error: "Member not found" };

    const idCardNumber = `ID-${member.memberId}`;

    await prisma.libraryMember.update({
      where: { id: memberId },
      data: { idCardIssued: true, idCardNumber },
    });

    await logAudit({ tenantId, userId, action: "ISSUE_ID_CARD", entityType: "LibraryMember", entityId: memberId, details: { idCardNumber } });

    return { success: true, data: { idCardNumber } };
  } catch (error) {
    console.error("Issue ID card error:", error);
    return { success: false, error: "Failed to issue ID card" };
  }
}

export async function getIdCardData(memberId: string) {
  try {
    const { tenantId } = await requireTenantUser();

    const member = await prisma.libraryMember.findFirst({
      where: { id: memberId, tenantId },
      select: {
        id: true,
        memberId: true,
        name: true,
        email: true,
        phone: true,
        photoUrl: true,
        idCardNumber: true,
        joiningDate: true,
        expiryDate: true,
        status: true,
        seatAllocations: {
          where: { isActive: true },
          include: { seat: { select: { seatNumber: true, zone: true } } },
          take: 1,
        },
      },
    });
    if (!member) return { success: false, error: "Member not found" };

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, logoUrl: true, address: true, phone: true, email: true },
    });

    return {
      success: true,
      data: {
        member,
        tenant,
      },
    };
  } catch (error) {
    console.error("Get ID card data error:", error);
    return { success: false, error: "Failed to load ID card data" };
  }
}

import { UserRole, TenantType, TenantStatus, Gender, StudentStatus, AttendanceStatus, ExamType, ExamStatus, HomeworkStatus, SubmissionStatus, FeeFrequency, PaymentMethod, PaymentStatus, NotificationType, NotificationPriority, LeaveType, LeaveStatus, LeaveApplicantType, EventType, SeatStatus, SlotType, LibraryMemberStatus, BookIssueStatus } from "@/generated/prisma/client";

// Re-export enums for convenience
export { UserRole, TenantType, TenantStatus, Gender, StudentStatus, AttendanceStatus, ExamType, ExamStatus, HomeworkStatus, SubmissionStatus, FeeFrequency, PaymentMethod, PaymentStatus, NotificationType, NotificationPriority, LeaveType, LeaveStatus, LeaveApplicantType, EventType, SeatStatus, SlotType, LibraryMemberStatus, BookIssueStatus };

// Extended session user type
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string | null;
  tenantSlug: string | null;
  tenantType: TenantType | null;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard stat card
export interface StatCard {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: string;
}

// Tenant setup data
export interface TenantSetupData {
  name: string;
  type: TenantType;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

// Select/Option type for dropdowns
export interface SelectOption {
  label: string;
  value: string;
}

// Breadcrumb
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Table column definition
export interface ColumnDef<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  className?: string;
}

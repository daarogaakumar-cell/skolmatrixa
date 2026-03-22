import { UserRole } from "@/generated/prisma/client";

export type Permission =
  | "manage_tenant"
  | "manage_users"
  | "manage_classes"
  | "manage_batches"
  | "manage_students"
  | "manage_staff"
  | "manage_subjects"
  | "view_attendance"
  | "mark_attendance"
  | "manage_timetable"
  | "manage_exams"
  | "enter_marks"
  | "view_marks"
  | "manage_homework"
  | "submit_homework"
  | "manage_fees"
  | "view_fees"
  | "collect_fees"
  | "manage_notifications"
  | "view_dashboard"
  | "view_reports"
  | "manage_settings"
  | "view_analytics"
  | "manage_leaves"
  | "apply_leave"
  | "approve_leave"
  | "export_data"
  | "manage_events"
  | "view_events"
  | "manage_library"
  | "manage_seats"
  | "manage_members"
  | "manage_books"
  | "manage_id_cards";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    "manage_tenant",
    "manage_users",
    "manage_classes",
    "manage_batches",
    "manage_students",
    "manage_staff",
    "manage_subjects",
    "view_attendance",
    "mark_attendance",
    "manage_timetable",
    "manage_exams",
    "enter_marks",
    "view_marks",
    "manage_homework",
    "manage_fees",
    "view_fees",
    "collect_fees",
    "manage_notifications",
    "view_dashboard",
    "view_reports",
    "manage_settings",
    "view_analytics",
    "manage_leaves",
    "approve_leave",
    "export_data",
    "manage_events",
    "view_events",
    "manage_library",
    "manage_seats",
    "manage_members",
    "manage_books",
    "manage_id_cards",
  ],
  TENANT_ADMIN: [
    "manage_users",
    "manage_classes",
    "manage_batches",
    "manage_students",
    "manage_staff",
    "manage_subjects",
    "view_attendance",
    "mark_attendance",
    "manage_timetable",
    "manage_exams",
    "enter_marks",
    "view_marks",
    "manage_homework",
    "manage_fees",
    "view_fees",
    "collect_fees",
    "manage_notifications",
    "view_dashboard",
    "view_reports",
    "manage_settings",
    "view_analytics",
    "manage_leaves",
    "approve_leave",
    "export_data",
    "manage_events",
    "view_events",
    "manage_library",
    "manage_seats",
    "manage_members",
    "manage_books",
    "manage_id_cards",
  ],
  VICE_ADMIN: [
    "manage_classes",
    "manage_batches",
    "manage_students",
    "manage_subjects",
    "view_attendance",
    "mark_attendance",
    "manage_timetable",
    "manage_exams",
    "enter_marks",
    "view_marks",
    "manage_homework",
    "view_fees",
    "manage_notifications",
    "view_dashboard",
    "view_reports",
    "view_analytics",
    "manage_leaves",
    "approve_leave",
    "export_data",
    "manage_events",
    "view_events",
  ],
  TEACHER: [
    "view_attendance",
    "mark_attendance",
    "manage_exams",
    "enter_marks",
    "view_marks",
    "manage_homework",
    "view_dashboard",
    "apply_leave",
    "approve_leave",
    "view_events",
  ],
  STUDENT: [
    "view_attendance",
    "view_marks",
    "submit_homework",
    "view_fees",
    "view_dashboard",
    "apply_leave",
    "view_events",
  ],
  PARENT: [
    "view_attendance",
    "view_marks",
    "view_fees",
    "view_dashboard",
    "apply_leave",
    "view_events",
  ],
  ACCOUNTANT: [
    "manage_fees",
    "view_fees",
    "collect_fees",
    "view_dashboard",
    "view_reports",
    "export_data",
    "view_events",
  ],
  LIBRARIAN: [
    "manage_library",
    "manage_seats",
    "manage_members",
    "manage_books",
    "manage_fees",
    "view_fees",
    "collect_fees",
    "manage_id_cards",
    "manage_notifications",
    "view_dashboard",
    "view_reports",
    "view_analytics",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function requirePermission(role: UserRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Insufficient permissions. Required: ${permission}`);
  }
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

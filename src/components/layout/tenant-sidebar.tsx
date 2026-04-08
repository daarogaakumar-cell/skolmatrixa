"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserCog,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Calendar,
  FileText,
  Award,
  Wallet,
  Bell,
  Settings,
  Layers,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  CalendarDays,
  Download,
  CalendarRange,
  Armchair,
  Users,
  BookCheck,
  CreditCard,
  IndianRupee,
  Library,
  Mail,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

interface NavSection {
  title: string;
  roles?: string[];
  items: NavItem[];
}

/* ─── School Navigation ─── */
const schoolSections: NavSection[] = [
  {
    title: "",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "People",
    roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"],
    items: [
      { href: "/dashboard/students", label: "Students", icon: GraduationCap, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
      { href: "/dashboard/staff", label: "Staff", icon: UserCog, roles: ["TENANT_ADMIN", "VICE_ADMIN"] },
    ],
  },
  {
    title: "Academics",
    roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"],
    items: [
      { href: "/dashboard/classes", label: "Classes", icon: Layers, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
      { href: "/dashboard/subjects", label: "Subjects", icon: BookOpen, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
      { href: "/dashboard/timetable", label: "Timetable", icon: Calendar, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
      { href: "/dashboard/homework", label: "Homework", icon: FileText, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
      { href: "/dashboard/exams", label: "Exams", icon: Award, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
    ],
  },
  {
    title: "Tracking",
    roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"],
    items: [
      { href: "/dashboard/attendance", label: "Attendance", icon: ClipboardCheck, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
      { href: "/dashboard/leaves", label: "Leaves", icon: CalendarRange, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
    ],
  },
  {
    title: "Finance",
    roles: ["TENANT_ADMIN", "VICE_ADMIN", "ACCOUNTANT"],
    items: [
      { href: "/dashboard/fees", label: "Fees", icon: Wallet, roles: ["TENANT_ADMIN", "VICE_ADMIN", "ACCOUNTANT"] },
    ],
  },
  {
    title: "Communication",
    roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER", "ACCOUNTANT", "LIBRARIAN"],
    items: [
      { href: "/dashboard/events", label: "Events", icon: CalendarDays, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER", "ACCOUNTANT", "LIBRARIAN"] },
      { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
      { href: "/dashboard/bulk-email", label: "Bulk Email", icon: Mail, roles: ["TENANT_ADMIN", "VICE_ADMIN"] },
    ],
  },
  {
    title: "Library",
    roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"],
    items: [
      { href: "/dashboard/library", label: "Library", icon: Library, roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"] },
      { href: "/dashboard/library/books", label: "Books", icon: BookOpen, roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"] },
      { href: "/dashboard/library/book-issues", label: "Issue / Return", icon: BookCheck, roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"] },
    ],
  },
  {
    title: "Reports",
    roles: ["TENANT_ADMIN", "VICE_ADMIN", "ACCOUNTANT"],
    items: [
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, roles: ["TENANT_ADMIN", "VICE_ADMIN"] },
      { href: "/dashboard/export", label: "Data Export", icon: Download, roles: ["TENANT_ADMIN", "VICE_ADMIN", "ACCOUNTANT"] },
      { href: "/dashboard/reports", label: "Reports", icon: FileText, roles: ["TENANT_ADMIN", "VICE_ADMIN"] },
    ],
  },
  {
    title: "My Portal",
    roles: ["STUDENT", "PARENT"],
    items: [
      { href: "/dashboard/my-attendance", label: "My Attendance", icon: ClipboardCheck, roles: ["STUDENT", "PARENT"] },
      { href: "/dashboard/my-timetable", label: "My Timetable", icon: Calendar, roles: ["STUDENT", "PARENT"] },
      { href: "/dashboard/exams", label: "My Exams", icon: Award, roles: ["STUDENT", "PARENT"] },
      { href: "/dashboard/my-fees", label: "My Fees", icon: Wallet, roles: ["STUDENT", "PARENT"] },
      { href: "/dashboard/homework", label: "Homework", icon: FileText, roles: ["STUDENT", "PARENT"] },
    ],
  },
  {
    title: "",
    roles: ["TENANT_ADMIN"],
    items: [
      { href: "/dashboard/settings", label: "Settings", icon: Settings, roles: ["TENANT_ADMIN"] },
    ],
  },
];

/* ─── Coaching Navigation ─── */
const coachingSections: NavSection[] = [
  {
    title: "",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "People",
    roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"],
    items: [
      { href: "/dashboard/students", label: "Students", icon: GraduationCap, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
      { href: "/dashboard/staff", label: "Staff", icon: UserCog, roles: ["TENANT_ADMIN", "VICE_ADMIN"] },
    ],
  },
  {
    title: "Academics",
    roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"],
    items: [
      { href: "/dashboard/batches", label: "Batches", icon: Layers, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
      { href: "/dashboard/subjects", label: "Subjects", icon: BookOpen, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
      { href: "/dashboard/timetable", label: "Timetable", icon: Calendar, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
      { href: "/dashboard/homework", label: "Homework", icon: FileText, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
      { href: "/dashboard/exams", label: "Exams", icon: Award, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
    ],
  },
  {
    title: "Tracking",
    roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"],
    items: [
      { href: "/dashboard/attendance", label: "Attendance", icon: ClipboardCheck, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
      { href: "/dashboard/leaves", label: "Leaves", icon: CalendarRange, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
    ],
  },
  {
    title: "Finance",
    roles: ["TENANT_ADMIN", "VICE_ADMIN", "ACCOUNTANT"],
    items: [
      { href: "/dashboard/fees", label: "Fees", icon: Wallet, roles: ["TENANT_ADMIN", "VICE_ADMIN", "ACCOUNTANT"] },
    ],
  },
  {
    title: "Communication",
    roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER", "ACCOUNTANT", "LIBRARIAN"],
    items: [
      { href: "/dashboard/events", label: "Events", icon: CalendarDays, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER", "ACCOUNTANT", "LIBRARIAN"] },
      { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
      { href: "/dashboard/bulk-email", label: "Bulk Email", icon: Mail, roles: ["TENANT_ADMIN", "VICE_ADMIN"] },
      { href: "/dashboard/whatsapp-logs", label: "WhatsApp Logs", icon: MessageCircle, roles: ["TENANT_ADMIN", "VICE_ADMIN"] },
    ],
  },
  {
    title: "Library",
    roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"],
    items: [
      { href: "/dashboard/library", label: "Library", icon: Library, roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"] },
      { href: "/dashboard/library/books", label: "Books", icon: BookOpen, roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"] },
      { href: "/dashboard/library/book-issues", label: "Issue / Return", icon: BookCheck, roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"] },
    ],
  },
  {
    title: "Reports",
    roles: ["TENANT_ADMIN", "VICE_ADMIN", "ACCOUNTANT"],
    items: [
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, roles: ["TENANT_ADMIN", "VICE_ADMIN"] },
      { href: "/dashboard/export", label: "Data Export", icon: Download, roles: ["TENANT_ADMIN", "VICE_ADMIN", "ACCOUNTANT"] },
      { href: "/dashboard/reports", label: "Reports", icon: FileText, roles: ["TENANT_ADMIN", "VICE_ADMIN"] },
    ],
  },
  {
    title: "My Portal",
    roles: ["STUDENT", "PARENT"],
    items: [
      { href: "/dashboard/my-attendance", label: "My Attendance", icon: ClipboardCheck, roles: ["STUDENT", "PARENT"] },
      { href: "/dashboard/my-timetable", label: "My Timetable", icon: Calendar, roles: ["STUDENT", "PARENT"] },
      { href: "/dashboard/exams", label: "My Exams", icon: Award, roles: ["STUDENT", "PARENT"] },
      { href: "/dashboard/my-fees", label: "My Fees", icon: Wallet, roles: ["STUDENT", "PARENT"] },
      { href: "/dashboard/homework", label: "Homework", icon: FileText, roles: ["STUDENT", "PARENT"] },
    ],
  },
  {
    title: "",
    roles: ["TENANT_ADMIN"],
    items: [
      { href: "/dashboard/settings", label: "Settings", icon: Settings, roles: ["TENANT_ADMIN"] },
    ],
  },
];

/* ─── Library Navigation ─── */
const librarySections: NavSection[] = [
  {
    title: "",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Library",
    roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"],
    items: [
      { href: "/dashboard/library", label: "Overview", icon: BarChart3, roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"] },
      { href: "/dashboard/library/seats", label: "Seats", icon: Armchair, roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"] },
      { href: "/dashboard/library/members", label: "Members", icon: Users, roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"] },
      { href: "/dashboard/library/books", label: "Books", icon: BookOpen, roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"] },
      { href: "/dashboard/library/book-issues", label: "Book Issues", icon: BookCheck, roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"] },
      { href: "/dashboard/library/fees", label: "Fees", icon: IndianRupee, roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"] },
      { href: "/dashboard/library/id-cards", label: "ID Cards", icon: CreditCard, roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"] },
    ],
  },
  {
    title: "Management",
    roles: ["TENANT_ADMIN", "VICE_ADMIN"],
    items: [
      { href: "/dashboard/staff", label: "Staff", icon: UserCog, roles: ["TENANT_ADMIN", "VICE_ADMIN"] },
    ],
  },
  {
    title: "",
    items: [
      { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
      { href: "/dashboard/whatsapp-logs", label: "WhatsApp Logs", icon: MessageCircle, roles: ["TENANT_ADMIN", "VICE_ADMIN"] },
      { href: "/dashboard/settings", label: "Settings", icon: Settings, roles: ["TENANT_ADMIN"] },
    ],
  },
];

interface TenantSidebarProps {
  tenantType: string | null;
  tenantName: string;
  tenantLogo?: string | null;
  userRole: string;
}

export function TenantSidebar({ tenantType, tenantName, tenantLogo, userRole }: TenantSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const sections = tenantType === "LIBRARY" ? librarySections : tenantType === "COACHING_INSTITUTE" ? coachingSections : schoolSections;

  // Filter sections and items based on user role
  const filteredSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.roles || item.roles.includes(userRole)),
    }))
    .filter((section) => {
      if (section.roles && !section.roles.includes(userRole)) return false;
      return section.items.length > 0;
    });

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden flex-col bg-sidebar transition-all duration-300 md:flex",
        collapsed ? "w-17" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn("flex h-16 items-center border-b border-sidebar-border px-4", collapsed ? "justify-center" : "gap-3")}>
        {tenantLogo ? (
          <img src={tenantLogo} alt={tenantName} className="h-8 w-8 rounded-lg object-cover ring-1 ring-white/10" />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white shadow-lg shadow-indigo-500/20">
            {tenantName.charAt(0).toUpperCase()}
          </div>
        )}
        {!collapsed && (
          <span className="truncate text-sm font-semibold text-sidebar-foreground">{tenantName}</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {filteredSections.map((section, sIdx) => (
          <div key={section.title || `section-${sIdx}`} className={cn(sIdx > 0 && "mt-3")}>
            {/* Section label */}
            {section.title && !collapsed && (
              <p className="mb-1 px-3 pt-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                {section.title}
              </p>
            )}
            {section.title && collapsed && (
              <div className="mx-auto my-1.5 w-5 border-t border-sidebar-border" />
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                      collapsed && "justify-center px-2",
                      isActive
                        ? "bg-sidebar-primary/15 text-sidebar-primary shadow-sm"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-sidebar-primary")} />
                    {!collapsed && item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="ml-2">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

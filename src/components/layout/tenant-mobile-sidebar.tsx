"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
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
  LogOut,
  Armchair,
  Users,
  BookCheck,
  CreditCard,
  IndianRupee,
  BarChart3,
  CalendarDays,
  Download,
  CalendarRange,
  Library,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SheetClose } from "@/components/ui/sheet";
import { logoutAction } from "@/actions/auth";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const schoolNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/students", label: "Students", icon: GraduationCap, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
  { href: "/dashboard/staff", label: "Staff", icon: UserCog, roles: ["TENANT_ADMIN", "VICE_ADMIN"] },
  { href: "/dashboard/classes", label: "Classes", icon: Layers, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
  { href: "/dashboard/subjects", label: "Subjects", icon: BookOpen, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
  { href: "/dashboard/attendance", label: "Attendance", icon: ClipboardCheck, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
  { href: "/dashboard/timetable", label: "Timetable", icon: Calendar, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
  { href: "/dashboard/homework", label: "Homework", icon: FileText, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
  { href: "/dashboard/exams", label: "Exams", icon: Award, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
  { href: "/dashboard/fees", label: "Fees", icon: Wallet, roles: ["TENANT_ADMIN", "VICE_ADMIN", "ACCOUNTANT"] },
  { href: "/dashboard/leaves", label: "Leaves", icon: CalendarRange, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
  { href: "/dashboard/events", label: "Events", icon: CalendarDays, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER", "ACCOUNTANT", "LIBRARIAN"] },
  { href: "/dashboard/library", label: "Library", icon: Library, roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"] },
  { href: "/dashboard/library/books", label: "Books", icon: BookOpen, roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"] },
  { href: "/dashboard/library/book-issues", label: "Issue / Return", icon: BookCheck, roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"] },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, roles: ["TENANT_ADMIN", "VICE_ADMIN"] },
  { href: "/dashboard/export", label: "Data Export", icon: Download, roles: ["TENANT_ADMIN", "VICE_ADMIN", "ACCOUNTANT"] },
  { href: "/dashboard/reports", label: "Reports", icon: FileText, roles: ["TENANT_ADMIN", "VICE_ADMIN"] },
  { href: "/dashboard/my-attendance", label: "My Attendance", icon: ClipboardCheck, roles: ["STUDENT", "PARENT"] },
  { href: "/dashboard/my-timetable", label: "My Timetable", icon: Calendar, roles: ["STUDENT", "PARENT"] },
  { href: "/dashboard/exams", label: "My Exams", icon: Award, roles: ["STUDENT", "PARENT"] },
  { href: "/dashboard/my-fees", label: "My Fees", icon: Wallet, roles: ["STUDENT", "PARENT"] },
  { href: "/dashboard/homework", label: "Homework", icon: FileText, roles: ["STUDENT", "PARENT"] },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, roles: ["TENANT_ADMIN"] },
];

const coachingNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/students", label: "Students", icon: GraduationCap, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
  { href: "/dashboard/staff", label: "Staff", icon: UserCog, roles: ["TENANT_ADMIN", "VICE_ADMIN"] },
  { href: "/dashboard/batches", label: "Batches", icon: Layers, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
  { href: "/dashboard/subjects", label: "Subjects", icon: BookOpen, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
  { href: "/dashboard/attendance", label: "Attendance", icon: ClipboardCheck, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
  { href: "/dashboard/timetable", label: "Timetable", icon: Calendar, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
  { href: "/dashboard/homework", label: "Homework", icon: FileText, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
  { href: "/dashboard/exams", label: "Exams", icon: Award, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
  { href: "/dashboard/fees", label: "Fees", icon: Wallet, roles: ["TENANT_ADMIN", "VICE_ADMIN", "ACCOUNTANT"] },
  { href: "/dashboard/leaves", label: "Leaves", icon: CalendarRange, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"] },
  { href: "/dashboard/events", label: "Events", icon: CalendarDays, roles: ["TENANT_ADMIN", "VICE_ADMIN", "TEACHER", "ACCOUNTANT", "LIBRARIAN"] },
  { href: "/dashboard/library", label: "Library", icon: Library, roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"] },
  { href: "/dashboard/library/books", label: "Books", icon: BookOpen, roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"] },
  { href: "/dashboard/library/book-issues", label: "Issue / Return", icon: BookCheck, roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"] },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, roles: ["TENANT_ADMIN", "VICE_ADMIN"] },
  { href: "/dashboard/export", label: "Data Export", icon: Download, roles: ["TENANT_ADMIN", "VICE_ADMIN", "ACCOUNTANT"] },
  { href: "/dashboard/reports", label: "Reports", icon: FileText, roles: ["TENANT_ADMIN", "VICE_ADMIN"] },
  { href: "/dashboard/my-attendance", label: "My Attendance", icon: ClipboardCheck, roles: ["STUDENT", "PARENT"] },
  { href: "/dashboard/my-timetable", label: "My Timetable", icon: Calendar, roles: ["STUDENT", "PARENT"] },
  { href: "/dashboard/exams", label: "My Exams", icon: Award, roles: ["STUDENT", "PARENT"] },
  { href: "/dashboard/my-fees", label: "My Fees", icon: Wallet, roles: ["STUDENT", "PARENT"] },
  { href: "/dashboard/homework", label: "Homework", icon: FileText, roles: ["STUDENT", "PARENT"] },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, roles: ["TENANT_ADMIN"] },
];

const libraryNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/library", label: "Overview", icon: BarChart3, roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"] },
  { href: "/dashboard/library/seats", label: "Seats", icon: Armchair, roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"] },
  { href: "/dashboard/library/members", label: "Members", icon: Users, roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"] },
  { href: "/dashboard/library/books", label: "Books", icon: BookOpen, roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"] },
  { href: "/dashboard/library/book-issues", label: "Book Issues", icon: BookCheck, roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"] },
  { href: "/dashboard/library/fees", label: "Fees", icon: IndianRupee, roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"] },
  { href: "/dashboard/library/id-cards", label: "ID Cards", icon: CreditCard, roles: ["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"] },
  { href: "/dashboard/staff", label: "Staff", icon: UserCog, roles: ["TENANT_ADMIN", "VICE_ADMIN"] },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, roles: ["TENANT_ADMIN"] },
];

interface TenantMobileSidebarProps {
  tenantType: string | null;
  tenantName: string;
  userRole: string;
}

export function TenantMobileSidebar({ tenantType, tenantName, userRole }: TenantMobileSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const navItems = tenantType === "LIBRARY" ? libraryNav : tenantType === "COACHING_INSTITUTE" ? coachingNav : schoolNav;
  const filteredNav = navItems.filter((item) => !item.roles || item.roles.includes(userRole));

  async function handleLogout() {
    await logoutAction();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white shadow-lg shadow-indigo-500/20">
          {tenantName.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-semibold text-sidebar-foreground">{tenantName}</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-0.5">
          {filteredNav.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <SheetClose
                key={item.href + item.label}
                render={
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-primary/15 text-sidebar-primary"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  />
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </SheetClose>
            );
          })}
        </div>
      </nav>
      {/* Logout button at bottom of mobile sidebar */}
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

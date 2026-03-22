"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, CreditCard, Settings, ScrollText, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/super-admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/super-admin/tenants", label: "Tenants", icon: Building2 },
  { href: "/super-admin/plans", label: "Subscription Plans", icon: CreditCard },
  { href: "/super-admin/settings", label: "Settings", icon: Settings },
  { href: "/super-admin/audit-logs", label: "Audit Logs", icon: ScrollText },
];

export function SuperAdminMobileSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Shield className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">SkolMatrixa</span>
      </div>
      <nav className="space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/super-admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogOut, Menu, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { TenantMobileSidebar } from "./tenant-mobile-sidebar";
import { NotificationBell } from "./notification-bell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TenantHeaderProps {
  userName: string;
  userRole: string;
  tenantName: string;
  tenantType: string | null;
}

export function TenantHeader({ userName, userRole, tenantName, tenantType }: TenantHeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await logoutAction();
    router.push("/login");
    router.refresh();
  }

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleBadge: Record<string, string> = {
    TENANT_ADMIN: "Admin",
    VICE_ADMIN: "Vice Admin",
    TEACHER: "Teacher",
    STUDENT: "Student",
    PARENT: "Parent",
    ACCOUNTANT: "Accountant",
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/50 bg-white/80 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "md:hidden")}>
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <TenantMobileSidebar
              tenantType={tenantType}
              tenantName={tenantName}
              userRole={userRole}
            />
          </SheetContent>
        </Sheet>
        <div className="hidden sm:block">
          <h2 className="text-sm font-semibold text-foreground">{tenantName}</h2>
          <p className="text-xs text-muted-foreground">
            {tenantType === "COACHING_INSTITUTE" ? "Coaching Institute" : "School"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-accent" />}>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-linear-to-br from-indigo-500 to-violet-500 text-xs font-semibold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-semibold text-foreground">{userName}</p>
                <p className="text-[10px] text-muted-foreground">{roleBadge[userRole] || userRole}</p>
              </div>
              <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5">
            {/* User profile header — plain div avoids Menu.GroupLabel context requirement */}
            <div className="rounded-lg px-3 py-2.5">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-linear-to-br from-indigo-500 to-violet-500 text-xs font-semibold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-semibold">{userName}</p>
                  <p className="text-xs text-muted-foreground">{roleBadge[userRole] || userRole}</p>
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer rounded-lg px-3 py-2.5 text-red-600 focus:bg-red-50 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Standalone logout button visible on mobile for easy access */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-red-50 hover:text-red-600 sm:hidden"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

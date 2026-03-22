"use client";

import { useRouter } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogOut, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SuperAdminMobileSidebar } from "./super-admin-mobile-sidebar";

export function SuperAdminHeader({ userName }: { userName: string }) {
  const router = useRouter();

  async function handleLogout() {
    await logoutAction();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "md:hidden")}>
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SuperAdminMobileSidebar />
          </SheetContent>
        </Sheet>
        <h2 className="text-lg font-semibold">Super Admin</h2>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">{userName}</span>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Sign Out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

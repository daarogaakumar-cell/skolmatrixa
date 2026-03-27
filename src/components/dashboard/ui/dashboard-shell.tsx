"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface DashboardShellProps {
  loading?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function DashboardShell({ loading, children, className }: DashboardShellProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-muted" />
          <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  return <div className={cn("space-y-6", className)}>{children}</div>;
}

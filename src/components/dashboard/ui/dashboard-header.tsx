"use client";

import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  greeting: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function DashboardHeader({ greeting, subtitle, children }: DashboardHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-card via-card to-accent/30 px-6 py-6 sm:py-8">
      {/* Decorative BG elements */}
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/[0.03]" />
      <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-emerald-500/[0.03]" />
      <div className="absolute right-[15%] top-[20%] h-2 w-2 rounded-full bg-primary/20" />
      <div className="absolute left-[40%] bottom-4 h-1.5 w-1.5 rounded-full bg-emerald-500/20" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{greeting}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}

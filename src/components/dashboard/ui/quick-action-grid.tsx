"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface QuickAction {
  label: string;
  icon: LucideIcon;
  href: string;
  description?: string;
}

interface QuickActionGridProps {
  actions: QuickAction[];
  columns?: 3 | 4 | 6;
}

export function QuickActionGrid({ actions, columns = 6 }: QuickActionGridProps) {
  const gridCols = {
    3: "grid-cols-1 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
    6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  };

  return (
    <div className={cn("grid gap-3", gridCols[columns])}>
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className="group relative flex flex-col items-center gap-2.5 rounded-xl border border-border/50 bg-card p-4 text-center transition-all duration-300 hover:border-primary/20 hover:bg-accent/50 hover:shadow-md hover:-translate-y-0.5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 transition-colors group-hover:bg-primary/10">
            <action.icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
          </div>
          <span className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground">
            {action.label}
          </span>
        </Link>
      ))}
    </div>
  );
}

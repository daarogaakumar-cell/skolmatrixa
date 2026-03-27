"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

interface SectionCardProps {
  title: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function SectionCard({ title, action, children, className, noPadding }: SectionCardProps) {
  return (
    <div className={cn("rounded-xl border border-border/60 bg-card overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-border/40 px-5 py-3.5">
        <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
        {action && (
          <Link
            href={action.href}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-7 text-xs text-muted-foreground hover:text-foreground"
            )}
          >
            {action.label}
          </Link>
        )}
      </div>
      <div className={cn(!noPadding && "p-5")}>{children}</div>
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  message: string;
}

export function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-2 text-muted-foreground/30">{icon}</div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

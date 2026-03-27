"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  href?: string;
  variant?: "blue" | "emerald" | "violet" | "amber" | "rose" | "cyan" | "indigo";
  className?: string;
}

const VARIANTS = {
  blue: {
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    accentLine: "from-blue-500 to-blue-400",
    glowColor: "group-hover:shadow-blue-500/5",
    trendBg: "bg-blue-50 dark:bg-blue-950/30",
  },
  emerald: {
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    accentLine: "from-emerald-500 to-emerald-400",
    glowColor: "group-hover:shadow-emerald-500/5",
    trendBg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  violet: {
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600 dark:text-violet-400",
    accentLine: "from-violet-500 to-violet-400",
    glowColor: "group-hover:shadow-violet-500/5",
    trendBg: "bg-violet-50 dark:bg-violet-950/30",
  },
  amber: {
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    accentLine: "from-amber-500 to-amber-400",
    glowColor: "group-hover:shadow-amber-500/5",
    trendBg: "bg-amber-50 dark:bg-amber-950/30",
  },
  rose: {
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-600 dark:text-rose-400",
    accentLine: "from-rose-500 to-rose-400",
    glowColor: "group-hover:shadow-rose-500/5",
    trendBg: "bg-rose-50 dark:bg-rose-950/30",
  },
  cyan: {
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    accentLine: "from-cyan-500 to-cyan-400",
    glowColor: "group-hover:shadow-cyan-500/5",
    trendBg: "bg-cyan-50 dark:bg-cyan-950/30",
  },
  indigo: {
    iconBg: "bg-indigo-500/10",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    accentLine: "from-indigo-500 to-indigo-400",
    glowColor: "group-hover:shadow-indigo-500/5",
    trendBg: "bg-indigo-50 dark:bg-indigo-950/30",
  },
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  href,
  variant = "blue",
  className,
}: MetricCardProps) {
  const v = VARIANTS[variant];

  const content = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/60 bg-card p-5 transition-all duration-300",
        "hover:shadow-lg hover:-translate-y-0.5",
        v.glowColor,
        className
      )}
    >
      {/* Top accent gradient line */}
      <div className={cn("absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r opacity-80", v.accentLine)} />

      {/* Decorative background circle */}
      <div className={cn("absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-[0.03]", v.iconBg)} />

      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[13px] font-medium text-muted-foreground">{title}</p>
          <p className="text-[28px] font-bold leading-none tracking-tight">{value}</p>
          {(subtitle || trend) && (
            <div className="flex items-center gap-2 pt-0.5">
              {trend && (
                <span
                  className={cn(
                    "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                    trend.isPositive
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                      : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                  )}
                >
                  {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                </span>
              )}
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          )}
        </div>
        <div className={cn("rounded-xl p-2.5", v.iconBg)}>
          <Icon className={cn("h-5 w-5", v.iconColor)} />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

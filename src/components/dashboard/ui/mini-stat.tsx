"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MiniStatProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  variant?: "emerald" | "red" | "amber" | "blue" | "violet" | "gray" | "primary";
}

const MINI_VARIANTS = {
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    valueColor: "text-emerald-700 dark:text-emerald-400",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-950/30",
    iconColor: "text-red-600 dark:text-red-400",
    valueColor: "text-red-700 dark:text-red-400",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    valueColor: "text-amber-700 dark:text-amber-400",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    valueColor: "text-blue-700 dark:text-blue-400",
  },
  violet: {
    bg: "bg-violet-50 dark:bg-violet-950/30",
    iconColor: "text-violet-600 dark:text-violet-400",
    valueColor: "text-violet-700 dark:text-violet-400",
  },
  gray: {
    bg: "bg-gray-50 dark:bg-gray-800/30",
    iconColor: "text-gray-500 dark:text-gray-400",
    valueColor: "text-gray-700 dark:text-gray-400",
  },
  primary: {
    bg: "bg-primary/5",
    iconColor: "text-primary",
    valueColor: "text-primary",
  },
};

export function MiniStat({ icon: Icon, label, value, variant = "blue" }: MiniStatProps) {
  const v = MINI_VARIANTS[variant];
  return (
    <div className={cn("rounded-xl p-3.5 transition-colors", v.bg)}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={cn("h-4 w-4", v.iconColor)} />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className={cn("text-xl font-bold tabular-nums", v.valueColor)}>{value}</p>
    </div>
  );
}

interface AttendanceBarProps {
  percentage: number;
  className?: string;
}

export function AttendanceBar({ percentage, className }: AttendanceBarProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium">Attendance Rate</span>
        <span className="font-semibold tabular-nums">{percentage}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted/80 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            percentage >= 85
              ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
              : percentage >= 60
              ? "bg-gradient-to-r from-amber-500 to-amber-400"
              : "bg-gradient-to-r from-red-500 to-red-400"
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export function ProgressRing({
  percentage,
  size = 80,
  strokeWidth = 6,
  label,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color =
    percentage >= 85 ? "text-emerald-500" : percentage >= 60 ? "text-amber-500" : "text-red-500";

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="-rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/50"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn("transition-all duration-1000 ease-out", color)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold tabular-nums">{percentage}%</span>
        </div>
      </div>
      {label && <span className="text-[11px] font-medium text-muted-foreground">{label}</span>}
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface ScheduleEntry {
  id: string;
  subject: string;
  subjectCode?: string | null;
  className: string;
  startTime: string;
  endTime: string;
  room?: string | null;
  teacher?: string;
}

interface ScheduleTimelineProps {
  entries: ScheduleEntry[];
  showTeacher?: boolean;
}

const PERIOD_COLORS = [
  "from-blue-500 to-blue-400",
  "from-violet-500 to-violet-400",
  "from-emerald-500 to-emerald-400",
  "from-amber-500 to-amber-400",
  "from-rose-500 to-rose-400",
  "from-cyan-500 to-cyan-400",
  "from-indigo-500 to-indigo-400",
  "from-pink-500 to-pink-400",
];

export function ScheduleTimeline({ entries, showTeacher }: ScheduleTimelineProps) {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <div className="relative space-y-1">
      {/* Timeline spine */}
      <div className="absolute left-[52px] top-2 bottom-2 w-px bg-border/60" />

      {entries.map((entry, idx) => {
        const isCurrent = currentTime >= entry.startTime && currentTime <= entry.endTime;
        const isPast = currentTime > entry.endTime;
        const colorClass = PERIOD_COLORS[idx % PERIOD_COLORS.length];

        return (
          <div
            key={entry.id}
            className={cn(
              "group relative flex items-center gap-4 rounded-lg px-3 py-2.5 transition-all duration-200",
              isCurrent && "bg-primary/[0.04] ring-1 ring-primary/15",
              isPast && "opacity-45",
              !isPast && !isCurrent && "hover:bg-muted/40"
            )}
          >
            {/* Time column */}
            <div className="flex w-[68px] shrink-0 flex-col items-center text-center">
              <span className={cn("text-xs font-semibold tabular-nums", isCurrent ? "text-primary" : "text-foreground/70")}>
                {entry.startTime}
              </span>
              <span className="text-[10px] text-muted-foreground tabular-nums">{entry.endTime}</span>
            </div>

            {/* Timeline dot */}
            <div className="relative z-10 flex shrink-0 items-center justify-center">
              <div
                className={cn(
                  "h-2.5 w-2.5 rounded-full bg-gradient-to-br",
                  isCurrent ? "from-primary to-primary/80 ring-4 ring-primary/10" : colorClass
                )}
              />
            </div>

            {/* Content */}
            <div className="flex flex-1 items-center justify-between gap-3 min-w-0">
              <div className="min-w-0">
                <p className={cn("text-sm font-medium truncate", isCurrent && "text-primary")}>
                  {entry.subject}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {entry.className}
                  {entry.room ? ` · ${entry.room}` : ""}
                  {showTeacher && entry.teacher ? ` · ${entry.teacher}` : ""}
                </p>
              </div>
              {isCurrent && (
                <Badge variant="default" className="shrink-0 text-[10px] font-semibold animate-pulse">
                  LIVE
                </Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

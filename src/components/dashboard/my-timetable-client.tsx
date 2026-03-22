"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMyTimetable, getParentChildren } from "@/actions/portal";

interface MyTimetableClientProps {
  userRole: string;
}

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DAY_COLORS = [
  "",
  "border-l-blue-500",
  "border-l-emerald-500",
  "border-l-violet-500",
  "border-l-amber-500",
  "border-l-rose-500",
  "border-l-cyan-500",
  "border-l-pink-500",
];

export function MyTimetableClient({ userRole }: MyTimetableClientProps) {
  const isParent = userRole === "PARENT";
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [entries, setEntries] = useState<Record<string, any>[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [children, setChildren] = useState<Record<string, any>[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");

  const todayDow = new Date().getDay() === 0 ? 7 : new Date().getDay();

  async function loadData(childId?: string) {
    setLoading(true);
    const result = await getMyTimetable(isParent ? (childId || selectedChild) : undefined);
    if (result.success && result.data) {
      setEntries(result.data as Record<string, any>[]); // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    setLoading(false);
  }

  useEffect(() => {
    if (isParent) {
      getParentChildren().then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          setChildren(res.data as Record<string, any>[]); // eslint-disable-line @typescript-eslint/no-explicit-any
          setSelectedChild(res.data[0].id);
        } else {
          setLoading(false);
        }
      });
    } else {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedChild && isParent) {
      loadData(selectedChild);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChild]);

  // Group entries by day
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupedByDay: Record<number, Record<string, any>[]> = {};
  for (const entry of entries) {
    if (!groupedByDay[entry.dayOfWeek]) groupedByDay[entry.dayOfWeek] = [];
    groupedByDay[entry.dayOfWeek].push(entry);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Timetable</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your weekly class schedule</p>
        </div>
        {isParent && children.length > 1 && (
          <Select value={selectedChild} onValueChange={(val) => val && setSelectedChild(val)}>
            <SelectTrigger className="w-60">
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              {children.map((c: Record<string, any>) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                <SelectItem key={c.id} value={c.id}>
                  {c.name} — {c.class?.name || c.batch?.name || ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <Calendar className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold">No timetable found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your class timetable hasn&apos;t been set up yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6, 7].map((dow) => {
            const dayEntries = groupedByDay[dow];
            if (!dayEntries || dayEntries.length === 0) return null;

            const isCurrentDay = dow === todayDow;

            return (
              <Card
                key={dow}
                className={cn(
                  "transition-all",
                  isCurrentDay && "ring-2 ring-primary ring-offset-2"
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{DAY_NAMES[dow]}</CardTitle>
                    {isCurrentDay && (
                      <Badge variant="default" className="text-[10px]">Today</Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {dayEntries.length} class{dayEntries.length > 1 ? "es" : ""}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {dayEntries.map((entry: Record<string, string>) => {
                      const now = new Date();
                      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
                      const isCurrent = isCurrentDay && currentTime >= entry.startTime && currentTime <= entry.endTime;

                      return (
                        <div
                          key={entry.id}
                          className={cn(
                            "flex items-center gap-3 rounded-lg border border-l-4 p-3 transition-all",
                            DAY_COLORS[dow],
                            isCurrent && "bg-primary/5 shadow-sm"
                          )}
                        >
                          <div className="flex flex-col items-center text-xs">
                            <span className="font-semibold">{entry.startTime}</span>
                            <span className="text-muted-foreground">{entry.endTime}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{entry.subject}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {entry.teacher}
                              {entry.room ? ` · Room ${entry.room}` : ""}
                            </p>
                          </div>
                          {isCurrent && <Badge variant="default" className="text-[10px] shrink-0">Now</Badge>}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

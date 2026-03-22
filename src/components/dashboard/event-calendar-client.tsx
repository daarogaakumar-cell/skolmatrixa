"use client";

import { useEffect, useState, useCallback } from "react";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getEvents,
  getUpcomingEvents,
  getEventFilterOptions,
} from "@/actions/events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  CalendarDays,
  Pencil,
  Trash2,
  Clock,
  Tag,
} from "lucide-react";

const EVENT_TYPE_MAP: Record<string, { label: string; color: string; bgColor: string }> = {
  HOLIDAY: { label: "Holiday", color: "text-rose-700 dark:text-rose-400", bgColor: "bg-rose-100 dark:bg-rose-900/30" },
  EXAM: { label: "Exam", color: "text-blue-700 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  PTM: { label: "PTM", color: "text-amber-700 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  SPORTS: { label: "Sports", color: "text-emerald-700 dark:text-emerald-400", bgColor: "bg-emerald-100 dark:bg-emerald-900/30" },
  CULTURAL: { label: "Cultural", color: "text-purple-700 dark:text-purple-400", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  MEETING: { label: "Meeting", color: "text-indigo-700 dark:text-indigo-400", bgColor: "bg-indigo-100 dark:bg-indigo-900/30" },
  OTHER: { label: "Other", color: "text-gray-700 dark:text-gray-400", bgColor: "bg-gray-100 dark:bg-gray-800" },
};

const EVENT_COLORS = [
  { value: "#ef4444", label: "Red" },
  { value: "#f97316", label: "Orange" },
  { value: "#eab308", label: "Yellow" },
  { value: "#22c55e", label: "Green" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
];

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  location: string | null;
  targetRoles: string[];
  className: string | null;
  batchName: string | null;
  createdByName: string | null;
  color: string | null;
}

const emptyForm = {
  title: "",
  description: "",
  eventType: "OTHER",
  startDate: "",
  endDate: "",
  isAllDay: true,
  location: "",
  targetRoles: [] as string[],
  classId: "",
  batchId: "",
  color: "",
};

export function EventCalendarClient({ userRole }: { userRole: string }) {
  const [activeTab, setActiveTab] = useState("calendar");
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [upcoming, setUpcoming] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Create/Edit dialog
  const [showDialog, setShowDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [filterOptions, setFilterOptions] = useState<{ classes: { id: string; name: string }[]; batches: { id: string; name: string }[] }>({ classes: [], batches: [] });

  // Detail dialog
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const isAdmin = ["TENANT_ADMIN", "VICE_ADMIN"].includes(userRole);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, upcomingRes] = await Promise.all([
        getEvents({ month: calendarMonth, year: calendarYear, eventType: typeFilter }),
        getUpcomingEvents(10),
      ]);
      if (eventsRes.success && eventsRes.data) setEvents(eventsRes.data);
      if (upcomingRes.success && upcomingRes.data) setUpcoming(upcomingRes.data as CalendarEvent[]);
    } finally {
      setLoading(false);
    }
  }, [calendarMonth, calendarYear, typeFilter]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (isAdmin) {
      getEventFilterOptions().then((res) => {
        if (res.success && res.data) setFilterOptions(res.data);
      });
    }
  }, [isAdmin]);

  const openCreateDialog = () => {
    setEditingEvent(null);
    setForm({ ...emptyForm });
    setShowDialog(true);
  };

  const openEditDialog = (event: CalendarEvent) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      description: event.description || "",
      eventType: event.eventType,
      startDate: event.startDate.slice(0, 10),
      endDate: event.endDate.slice(0, 10),
      isAllDay: event.isAllDay,
      location: event.location || "",
      targetRoles: event.targetRoles || [],
      classId: "",
      batchId: "",
      color: event.color || "",
    });
    setShowDialog(true);
    setSelectedEvent(null);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.startDate || !form.endDate) {
      toast.error("Title, start date, and end date are required");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        eventType: form.eventType,
        startDate: form.startDate,
        endDate: form.endDate,
        isAllDay: form.isAllDay,
        location: form.location || undefined,
        targetRoles: form.targetRoles.length > 0 ? form.targetRoles : undefined,
        classId: form.classId || undefined,
        batchId: form.batchId || undefined,
        color: form.color || undefined,
      };

      const res = editingEvent
        ? await updateEvent(editingEvent.id, payload)
        : await createEvent(payload);

      if (res.success) {
        toast.success(res.message);
        setShowDialog(false);
        loadEvents();
      } else {
        toast.error(res.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    const res = await deleteEvent(eventId);
    if (res.success) {
      toast.success(res.message);
      setSelectedEvent(null);
      loadEvents();
    } else {
      toast.error(res.error);
    }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  // Calendar rendering
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();
  const monthName = new Date(calendarYear, calendarMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const getEventsForDate = (day: number) => {
    const date = new Date(calendarYear, calendarMonth, day);
    return events.filter((e) => {
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Event Calendar</h1>
          <p className="text-sm text-muted-foreground">View and manage institution events, holidays, and activities</p>
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "ALL")}>
            <SelectTrigger className="w-32.5">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {Object.entries(EVENT_TYPE_MAP).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAdmin && (
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Event
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        </TabsList>

        {/* Calendar View */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => {
                  if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(calendarYear - 1); }
                  else setCalendarMonth(calendarMonth - 1);
                }}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-base">{monthName}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => {
                  if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(calendarYear + 1); }
                  else setCalendarMonth(calendarMonth + 1);
                }}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-125 w-full" />
              ) : (
                <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-muted">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="bg-card p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
                  ))}
                  {[...Array(firstDayOfMonth)].map((_, i) => (
                    <div key={`empty-${i}`} className="min-h-20 bg-card p-1 sm:min-h-25" />
                  ))}
                  {[...Array(daysInMonth)].map((_, i) => {
                    const day = i + 1;
                    const dayEvents = getEventsForDate(day);
                    const isToday = day === new Date().getDate() && calendarMonth === new Date().getMonth() && calendarYear === new Date().getFullYear();
                    return (
                      <div key={day} className={`min-h-20 bg-card p-1 sm:min-h-25 ${isToday ? "ring-2 ring-indigo-500 ring-inset" : ""}`}>
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${isToday ? "bg-indigo-500 text-white font-bold" : ""}`}>
                          {day}
                        </span>
                        <div className="mt-0.5 space-y-0.5">
                          {dayEvents.slice(0, 3).map((e) => {
                            const typeInfo = EVENT_TYPE_MAP[e.eventType] || EVENT_TYPE_MAP.OTHER;
                            return (
                              <button
                                key={e.id}
                                onClick={() => setSelectedEvent(e)}
                                className={`w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium transition-opacity hover:opacity-80 ${typeInfo.bgColor} ${typeInfo.color}`}
                                style={e.color ? { backgroundColor: e.color + "20", color: e.color } : undefined}
                              >
                                {e.title}
                              </button>
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <p className="text-[10px] text-muted-foreground pl-1">+{dayEvents.length - 3} more</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event type legend */}
          <div className="flex flex-wrap gap-3">
            {Object.entries(EVENT_TYPE_MAP).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={`h-2.5 w-2.5 rounded-full ${val.bgColor}`} />
                <span className="text-xs text-muted-foreground">{val.label}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Upcoming Events */}
        <TabsContent value="upcoming" className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (<Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>))}
            </div>
          ) : upcoming.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CalendarDays className="h-12 w-12 text-muted-foreground/40" />
                <p className="mt-4 text-sm text-muted-foreground">No upcoming events</p>
              </CardContent>
            </Card>
          ) : (
            upcoming.map((event) => {
              const typeInfo = EVENT_TYPE_MAP[event.eventType] || EVENT_TYPE_MAP.OTHER;
              return (
                <Card key={event.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => setSelectedEvent(event)}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center justify-center rounded-lg bg-muted px-3 py-2 min-w-15">
                        <span className="text-lg font-bold">{new Date(event.startDate).getDate()}</span>
                        <span className="text-[10px] uppercase text-muted-foreground">
                          {new Date(event.startDate).toLocaleDateString("en-US", { month: "short" })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{event.title}</h3>
                          <Badge className={`${typeInfo.bgColor} ${typeInfo.color} border-0 text-[10px] shrink-0`}>
                            {typeInfo.label}
                          </Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {formatDate(event.startDate)}
                            {event.startDate.slice(0, 10) !== event.endDate.slice(0, 10) && ` — ${formatDate(event.endDate)}`}
                          </span>
                          {!event.isAllDay && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(event.startDate)}
                            </span>
                          )}
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </span>
                          )}
                        </div>
                        {event.description && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{event.description}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent?.title}
              {selectedEvent && (
                <Badge className={`${EVENT_TYPE_MAP[selectedEvent.eventType]?.bgColor || ""} ${EVENT_TYPE_MAP[selectedEvent.eventType]?.color || ""} border-0 text-[10px]`}>
                  {EVENT_TYPE_MAP[selectedEvent.eventType]?.label || selectedEvent.eventType}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>Event details</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                {formatDate(selectedEvent.startDate)}
                {selectedEvent.startDate.slice(0, 10) !== selectedEvent.endDate.slice(0, 10) && ` — ${formatDate(selectedEvent.endDate)}`}
              </div>
              {!selectedEvent.isAllDay && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {formatTime(selectedEvent.startDate)} — {formatTime(selectedEvent.endDate)}
                </div>
              )}
              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {selectedEvent.location}
                </div>
              )}
              {selectedEvent.className && (
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  Class: {selectedEvent.className}
                  {selectedEvent.batchName && ` | Batch: ${selectedEvent.batchName}`}
                </div>
              )}
              {selectedEvent.description && (
                <p className="text-sm text-muted-foreground rounded-lg bg-muted p-3">{selectedEvent.description}</p>
              )}
              {selectedEvent.createdByName && (
                <p className="text-xs text-muted-foreground">Created by {selectedEvent.createdByName}</p>
              )}
              {isAdmin && (
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(selectedEvent)}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(selectedEvent.id)}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Event Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Edit Event" : "Create Event"}</DialogTitle>
            <DialogDescription>{editingEvent ? "Update event details" : "Add a new event to the calendar"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input placeholder="Event title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select value={form.eventType} onValueChange={(v) => setForm({ ...form, eventType: v ?? "OTHER" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_TYPE_MAP).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isAllDay"
                checked={form.isAllDay}
                onChange={(e) => setForm({ ...form, isAllDay: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isAllDay" className="text-sm font-normal">All day event</Label>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input placeholder="e.g., Main Auditorium" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Event description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Class (optional)</Label>
                <Select value={form.classId} onValueChange={(v) => setForm({ ...form, classId: v ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Classes</SelectItem>
                    {filterOptions.classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Batch (optional)</Label>
                <Select value={form.batchId} onValueChange={(v) => setForm({ ...form, batchId: v ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Batches</SelectItem>
                    {filterOptions.batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {EVENT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className={`h-7 w-7 rounded-full transition-all ${form.color === c.value ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105"}`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => setForm({ ...form, color: form.color === c.value ? "" : c.value })}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving..." : editingEvent ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

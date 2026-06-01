"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Plus, X, MapPin,
  CalendarDays, Clock, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { fetchCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "@/lib/supabase";
import type { GuildCalendarEvent, NewGuildCalendarEvent } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const EVENT_COLORS = [
  { label: "Blue",   hex: "#6B8AFD" },
  { label: "Green",  hex: "#4ade80" },
  { label: "Yellow", hex: "#facc15" },
  { label: "Red",    hex: "#f87171" },
  { label: "Purple", hex: "#c084fc" },
  { label: "Pink",   hex: "#f472b6" },
];

const HOUR_HEIGHT = 64; // px per hour in week view
const START_HOUR = 8;
const END_HOUR = 22;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function todayStr(): string {
  return toDateStr(new Date());
}

function formatMonthYear(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

function formatTime(t: string | null): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function getMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const cells: Date[] = [];
  for (let i = 0; i < first.getDay(); i++) {
    cells.push(new Date(year, month, 1 - (first.getDay() - i)));
  }
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d));
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) cells.push(new Date(year, month + 1, d));
  return cells;
}

function getWeekDays(anchor: Date): Date[] {
  const dow = anchor.getDay();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() - dow + i);
    return d;
  });
}

function eventTop(startTime: string | null): number {
  if (!startTime) return 0;
  const [h, m] = startTime.split(":").map(Number);
  return Math.max(0, (h - START_HOUR) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT);
}

function eventHeight(start: string | null, end: string | null): number {
  if (!start || !end) return HOUR_HEIGHT;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = Math.max((eh * 60 + em) - (sh * 60 + sm), 30);
  return (mins / 60) * HOUR_HEIGHT;
}

// ─── Default form state ───────────────────────────────────────────────────────

const defaultForm = {
  title: "",
  event_date: todayStr(),
  start_time: "",
  end_time: "",
  location: "",
  description: "",
  color: "#6B8AFD",
};

type FormState = typeof defaultForm;

// ─── Component ────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const [events, setEvents] = useState<GuildCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"month" | "week">("month");
  const [anchor, setAnchor] = useState(() => new Date());

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GuildCalendarEvent | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteState, setDeleteState] = useState<"idle" | "confirm">("idle");
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drag
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchCalendarEvents();
      setEvents(data);
    } catch {
      toast.error("Failed to load events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Derived state ────────────────────────────────────────────────────────────

  const eventsByDate = useMemo(() => {
    const map = new Map<string, GuildCalendarEvent[]>();
    for (const ev of events) {
      const list = map.get(ev.event_date) ?? [];
      list.push(ev);
      map.set(ev.event_date, list);
    }
    return map;
  }, [events]);

  const monthGrid = useMemo(() => {
    return view === "month" ? getMonthGrid(anchor.getFullYear(), anchor.getMonth()) : [];
  }, [anchor, view]);

  const weekDays = useMemo(() => {
    return view === "week" ? getWeekDays(anchor) : [];
  }, [anchor, view]);

  const currentMonth = anchor.getMonth();
  const today = todayStr();

  // ── Navigation ───────────────────────────────────────────────────────────────

  const navigate = (dir: -1 | 1) => {
    setAnchor(prev => {
      const d = new Date(prev);
      if (view === "month") d.setMonth(d.getMonth() + dir);
      else d.setDate(d.getDate() + dir * 7);
      return d;
    });
  };

  const goToday = () => setAnchor(new Date());

  // ── Modal helpers ─────────────────────────────────────────────────────────────

  const openCreate = (date: string, time?: string) => {
    setEditing(null);
    setDeleteState("idle");
    setForm({ ...defaultForm, event_date: date, start_time: time ?? "" });
    setModalOpen(true);
  };

  const openEdit = (ev: GuildCalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(ev);
    setDeleteState("idle");
    setForm({
      title: ev.title,
      event_date: ev.event_date,
      start_time: ev.start_time ?? "",
      end_time: ev.end_time ?? "",
      location: ev.location ?? "",
      description: ev.description ?? "",
      color: ev.color,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    setDeleteState("idle");
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.event_date) { toast.error("Date is required"); return; }
    setSaving(true);
    try {
      const payload: NewGuildCalendarEvent = {
        title: form.title.trim(),
        event_date: form.event_date,
        start_time: form.start_time || undefined,
        end_time: form.end_time || undefined,
        location: form.location || undefined,
        description: form.description || undefined,
        color: form.color,
      };
      if (editing) {
        await updateCalendarEvent(editing.id, payload);
        toast.success("Event updated");
      } else {
        await createCalendarEvent(payload);
        toast.success("Event created");
      }
      closeModal();
      await load();
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = () => {
    if (deleteState === "idle") {
      setDeleteState("confirm");
      deleteTimerRef.current = setTimeout(() => setDeleteState("idle"), 3000);
    } else {
      handleDeleteConfirm();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await deleteCalendarEvent(editing.id);
      toast.success("Event deleted");
      closeModal();
      await load();
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  // ── Drag and drop (month view) ────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData("eventId", String(id));
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(dateStr);
  };

  const handleDrop = async (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData("eventId"));
    setDraggingId(null);
    setDropTarget(null);
    if (!id) return;
    const ev = events.find(ev => ev.id === id);
    if (!ev || ev.event_date === dateStr) return;
    try {
      await updateCalendarEvent(id, { event_date: dateStr });
      await load();
    } catch {
      toast.error("Failed to move event");
    }
  };

  // ── Header ────────────────────────────────────────────────────────────────────

  const headerLabel = view === "month"
    ? formatMonthYear(anchor)
    : (() => {
        const days = getWeekDays(anchor);
        const first = days[0], last = days[6];
        if (first.getMonth() === last.getMonth()) {
          return `${MONTH_NAMES[first.getMonth()]} ${first.getFullYear()}`;
        }
        return `${MONTH_NAMES[first.getMonth()]} – ${MONTH_NAMES[last.getMonth()]} ${last.getFullYear()}`;
      })();

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full page-fade-in">
      {/* Calendar header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={goToday}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => navigate(1)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <h1 className="text-2xl font-semibold text-foreground flex-1">{headerLabel}</h1>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {(["month", "week"] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize",
                  view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {v}
              </button>
            ))}
          </div>

          <Button
            className="h-9 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-4"
            onClick={() => openCreate(today)}
          >
            <Plus size={15} />
            New Event
          </Button>
        </div>
      </div>

      {/* Calendar body */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 size={32} className="animate-spin opacity-40" />
            <span className="text-sm">Loading events…</span>
          </div>
        </div>
      ) : view === "month" ? (
        <MonthView
          grid={monthGrid}
          currentMonth={currentMonth}
          today={today}
          eventsByDate={eventsByDate}
          draggingId={draggingId}
          dropTarget={dropTarget}
          onDayClick={openCreate}
          onEventClick={openEdit}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      ) : (
        <WeekView
          days={weekDays}
          today={today}
          eventsByDate={eventsByDate}
          onSlotClick={openCreate}
          onEventClick={openEdit}
        />
      )}

      {/* Create / Edit modal */}
      <Dialog open={modalOpen} onOpenChange={open => !open && closeModal()}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editing ? "Edit Event" : "New Event"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Title */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Title *</Label>
              <Input
                autoFocus
                placeholder="Event title"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              />
            </div>

            {/* Date */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Date *</Label>
              <Input
                type="date"
                value={form.event_date}
                onChange={e => setForm(p => ({ ...p, event_date: e.target.value }))}
                className="[color-scheme:dark]"
              />
            </div>

            {/* Time row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  <Clock size={11} className="inline mr-1" />Start time
                </Label>
                <Input
                  type="time"
                  value={form.start_time}
                  onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))}
                  className="[color-scheme:dark]"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  <Clock size={11} className="inline mr-1" />End time
                </Label>
                <Input
                  type="time"
                  value={form.end_time}
                  onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))}
                  className="[color-scheme:dark]"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                <MapPin size={11} className="inline mr-1" />Location
              </Label>
              <Input
                placeholder="e.g. Discord, Google Meet, Room 4B"
                value={form.location}
                onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Description</Label>
              <textarea
                rows={3}
                placeholder="Optional details…"
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className={cn(
                  "w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none",
                  "placeholder:text-muted-foreground focus-visible:outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:border-ring",
                  "dark:bg-input/20"
                )}
              />
            </div>

            {/* Color picker */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Color</Label>
              <div className="flex gap-2">
                {EVENT_COLORS.map(({ hex, label }) => (
                  <button
                    key={hex}
                    title={label}
                    onClick={() => setForm(p => ({ ...p, color: hex }))}
                    className={cn(
                      "w-7 h-7 rounded-full transition-all",
                      form.color === hex
                        ? "ring-2 ring-white ring-offset-2 ring-offset-card scale-110"
                        : "opacity-70 hover:opacity-100 hover:scale-105"
                    )}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 border-0 bg-transparent p-0 pt-2 flex-row">
            {editing && (
              <Button
                variant="ghost"
                className={cn(
                  "h-9 text-sm mr-auto transition-colors",
                  deleteState === "confirm"
                    ? "text-destructive hover:text-destructive hover:bg-destructive/10"
                    : "text-muted-foreground hover:text-destructive"
                )}
                onClick={handleDeleteClick}
                disabled={saving}
              >
                {deleteState === "confirm" ? "Confirm delete?" : "Delete"}
              </Button>
            )}
            <Button variant="outline" className="h-9" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button
              className="h-9 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : editing ? "Save" : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Month View ───────────────────────────────────────────────────────────────

interface MonthViewProps {
  grid: Date[];
  currentMonth: number;
  today: string;
  eventsByDate: Map<string, GuildCalendarEvent[]>;
  draggingId: number | null;
  dropTarget: string | null;
  onDayClick: (date: string) => void;
  onEventClick: (ev: GuildCalendarEvent, e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent, id: number) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, date: string) => void;
  onDrop: (e: React.DragEvent, date: string) => void;
}

function MonthView({
  grid, currentMonth, today, eventsByDate, draggingId, dropTarget,
  onDayClick, onEventClick, onDragStart, onDragEnd, onDragOver, onDrop,
}: MonthViewProps) {
  const hasEvents = Array.from(eventsByDate.values()).some(list => list.length > 0);

  return (
    <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-border/40 overflow-hidden bg-card">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border/40">
        {DAY_NAMES.map(day => (
          <div key={day} className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 flex-1 min-h-0">
        {grid.map((date, idx) => {
          const dateStr = toDateStr(date);
          const isCurrentMonth = date.getMonth() === currentMonth;
          const isToday = dateStr === today;
          const isDropTarget = dropTarget === dateStr;
          const dayEvents = eventsByDate.get(dateStr) ?? [];
          const visible = dayEvents.slice(0, 3);
          const overflow = dayEvents.length - 3;

          return (
            <div
              key={idx}
              onClick={() => onDayClick(dateStr)}
              onDragOver={e => onDragOver(e, dateStr)}
              onDragLeave={() => {}}
              onDrop={e => onDrop(e, dateStr)}
              className={cn(
                "min-h-[120px] p-2 border-b border-r border-border/40 cursor-pointer transition-colors",
                "last:border-r-0 [&:nth-child(7n)]:border-r-0",
                isToday && "bg-primary/5",
                isDropTarget && "bg-primary/10 ring-1 ring-inset ring-primary/40",
                !isCurrentMonth && "opacity-40",
                isCurrentMonth && !isToday && "hover:bg-muted/30",
              )}
            >
              {/* Date number */}
              <div className="flex justify-start mb-1.5">
                <span className={cn(
                  "text-sm font-medium leading-none w-7 h-7 flex items-center justify-center rounded-full",
                  isToday
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground"
                )}>
                  {date.getDate()}
                </span>
              </div>

              {/* Events */}
              <div className="space-y-0.5">
                {visible.map(ev => (
                  <div
                    key={ev.id}
                    draggable
                    onDragStart={e => { e.stopPropagation(); onDragStart(e, ev.id); }}
                    onDragEnd={onDragEnd}
                    onClick={e => onEventClick(ev, e)}
                    className={cn(
                      "w-full rounded-md px-2 py-1 text-xs font-medium text-white cursor-grab select-none",
                      "transition-opacity duration-150 hover:brightness-110",
                      draggingId === ev.id && "opacity-30"
                    )}
                    style={{ backgroundColor: ev.color }}
                  >
                    <p className="truncate leading-tight">{ev.title}</p>
                    {ev.start_time && (
                      <p className="text-white/70 text-[10px] leading-tight truncate mt-0.5">
                        {formatTime(ev.start_time)}
                      </p>
                    )}
                  </div>
                ))}
                {overflow > 0 && (
                  <button
                    onClick={e => { e.stopPropagation(); onDayClick(dateStr); }}
                    className="text-[10px] text-muted-foreground hover:text-foreground px-2 transition-colors"
                  >
                    +{overflow} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state overlay */}
      {!hasEvents && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            style={{ position: "absolute" }}
          >
          </motion.div>
        </AnimatePresence>
      )}

      {/* Empty state — shown outside grid when truly empty */}
      {!hasEvents && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3 border-t border-border/40">
          <CalendarDays size={44} className="text-muted-foreground/20" />
          <div className="text-center">
            <p className="text-sm font-medium">No events this month</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Click any day to add one</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────

interface WeekViewProps {
  days: Date[];
  today: string;
  eventsByDate: Map<string, GuildCalendarEvent[]>;
  onSlotClick: (date: string, time: string) => void;
  onEventClick: (ev: GuildCalendarEvent, e: React.MouseEvent) => void;
}

function WeekView({ days, today, eventsByDate, onSlotClick, onEventClick }: WeekViewProps) {
  const totalHeight = HOURS.length * HOUR_HEIGHT;
  const hasAnyEvent = days.some(d => (eventsByDate.get(toDateStr(d)) ?? []).length > 0);

  return (
    <div className="flex-1 rounded-xl border border-border/40 overflow-hidden bg-card flex flex-col min-h-0">
      {/* Day headers */}
      <div className="grid border-b border-border/40" style={{ gridTemplateColumns: `64px repeat(7, 1fr)` }}>
        <div className="py-2" />
        {days.map((d, i) => {
          const dateStr = toDateStr(d);
          const isToday = dateStr === today;
          return (
            <div key={i} className={cn(
              "py-2 px-2 text-center border-l border-border/40",
              isToday && "bg-primary/5"
            )}>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()]}
              </p>
              <p className={cn(
                "text-sm font-semibold mt-0.5 leading-none w-8 h-8 flex items-center justify-center rounded-full mx-auto",
                isToday ? "bg-primary text-primary-foreground" : "text-foreground"
              )}>
                {d.getDate()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative grid" style={{ gridTemplateColumns: `64px repeat(7, 1fr)`, minHeight: `${totalHeight}px` }}>
          {/* Hour lines + time labels */}
          <div className="relative">
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute w-full flex items-start justify-end pr-2"
                style={{ top: (h - START_HOUR) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
              >
                <span className="text-[10px] text-muted-foreground/60 -translate-y-1.5">
                  {h % 12 || 12}{h < 12 ? "am" : "pm"}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((d, di) => {
            const dateStr = toDateStr(d);
            const isToday = dateStr === today;
            const dayEvents = eventsByDate.get(dateStr) ?? [];

            return (
              <div
                key={di}
                className={cn(
                  "relative border-l border-border/40",
                  isToday && "bg-primary/[0.03]"
                )}
                style={{ height: totalHeight }}
              >
                {/* Hour slot backgrounds */}
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="absolute w-full border-t border-border/30 cursor-pointer hover:bg-muted/20 transition-colors"
                    style={{ top: (h - START_HOUR) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                    onClick={() => onSlotClick(dateStr, `${String(h).padStart(2, "0")}:00`)}
                  />
                ))}

                {/* Events */}
                {dayEvents.map(ev => {
                  const top = eventTop(ev.start_time);
                  const height = eventHeight(ev.start_time, ev.end_time);
                  return (
                    <motion.div
                      key={ev.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute left-[5%] w-[90%] rounded-md px-2 py-1.5 cursor-pointer text-white overflow-hidden z-10 hover:brightness-110 transition-[filter]"
                      style={{ top, height: Math.max(height, 32), backgroundColor: ev.color }}
                      onClick={e => onEventClick(ev, e)}
                    >
                      <p className="text-xs font-semibold leading-tight truncate">{ev.title}</p>
                      {ev.start_time && (
                        <p className="text-[10px] text-white/70 leading-tight mt-0.5">
                          {formatTime(ev.start_time)}{ev.end_time ? ` – ${formatTime(ev.end_time)}` : ""}
                        </p>
                      )}
                      {ev.location && (
                        <p className="text-[10px] text-white/60 leading-tight mt-0.5 flex items-center gap-0.5">
                          <MapPin size={8} />{ev.location}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty state */}
      {!hasAnyEvent && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3 border-t border-border/40">
          <CalendarDays size={40} className="text-muted-foreground/20" />
          <div className="text-center">
            <p className="text-sm font-medium">No events this week</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Click any time slot to add one</p>
          </div>
        </div>
      )}
    </div>
  );
}

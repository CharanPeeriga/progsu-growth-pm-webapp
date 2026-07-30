"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, X } from "lucide-react";
import { toast } from "sonner";
import {
  fetchCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/supabase";
import type { GuildCalendarEvent, NewGuildCalendarEvent } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AgendaRail } from "@/components/events/agenda-rail";
import { getMonthGrid, toDateStr } from "@/components/calendar/month-grid";
import { cn } from "@/lib/utils";

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

const PICKER_HOURS = Array.from({ length: 18 }, (_, i) => String(i + 6).padStart(2, "0"));
const PICKER_MINUTES = ["00", "15", "30", "45"];

function todayStr(): string {
  return toDateStr(new Date());
}

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

function TimePicker({
  label,
  value,
  onChange,
  onClear,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
}) {
  const parts = value ? value.split(":") : ["", ""];
  const hour = parts[0] ?? "";
  const minute = parts[1] ?? "";

  const set = (h: string, m: string) => {
    if (h && m) onChange(`${h}:${m}`);
    else if (h && !m) onChange(`${h}:00`);
  };

  return (
    <div>
      <Label className="t-label text-[#A7B0C0] mb-1.5 flex items-center gap-1 block">
        <Clock className="size-3" />
        {label}
      </Label>
      <div className="flex items-center gap-1">
        <Select value={hour} onValueChange={(h) => h && set(h, minute || "00")}>
          <SelectTrigger className="w-[76px]">
            <SelectValue>{() => hour || "HH"}</SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-48">
            {PICKER_HOURS.map((h) => (
              <SelectItem key={h} value={h}>{h}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-[#6E7686] text-sm font-medium">:</span>
        <Select value={minute} onValueChange={(m) => m && set(hour || "08", m)}>
          <SelectTrigger className="w-[76px]">
            <SelectValue>{() => minute || "MM"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PICKER_MINUTES.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="p-1.5 text-[#6E7686] hover:text-[#E8EBF2] transition-colors"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

interface EventMonthGridProps {
  monthDate: Date;
  eventsByDate: Map<string, GuildCalendarEvent[]>;
  selectedDate: string | null;
  draggingId: number | null;
  dropTarget: string | null;
  onDayClick: (dateStr: string) => void;
  onEventClick: (ev: GuildCalendarEvent) => void;
  onDragStart: (e: React.DragEvent, id: number) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, dateStr: string) => void;
  onDrop: (e: React.DragEvent, dateStr: string) => void;
}

function EventMonthGrid({
  monthDate,
  eventsByDate,
  selectedDate,
  draggingId,
  dropTarget,
  onDayClick,
  onEventClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: EventMonthGridProps) {
  const grid = getMonthGrid(monthDate.getFullYear(), monthDate.getMonth());
  const currentMonth = monthDate.getMonth();
  const today = todayStr();

  return (
    <div className="surface-card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-[rgba(255,255,255,0.09)]">
        {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => (
          <div key={d} className="px-3 py-2.5 t-overline text-[#6E7686]">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {grid.map((date, idx) => {
          const dateStr = toDateStr(date);
          const isCurrentMonth = date.getMonth() === currentMonth;
          const isToday = dateStr === today;
          const isSelected = selectedDate === dateStr;
          const isDropTarget = dropTarget === dateStr;
          const dayEvents = (eventsByDate.get(dateStr) ?? []).slice(0, 4);
          const isLastCol = idx % 7 === 6;
          const isLastRow = idx >= 35;

          return (
            <div
              key={idx}
              onClick={() => onDayClick(dateStr)}
              onDragOver={(e) => onDragOver(e, dateStr)}
              onDrop={(e) => onDrop(e, dateStr)}
              className={cn(
                "group relative flex min-h-[100px] flex-col gap-1.5 border-b border-r border-[rgba(255,255,255,0.05)] p-2 cursor-pointer",
                "transition-colors duration-[160ms] ease-standard hover:bg-[rgba(255,255,255,0.025)]",
                isLastCol && "cal-cell-last-col",
                isLastRow && "cal-cell-last-row",
                !isCurrentMonth && "bg-[rgba(255,255,255,0.012)]",
                isSelected && "bg-[rgba(107,138,253,0.07)] shadow-[inset_0_0_0_1px_rgba(107,138,253,0.45)]",
                isDropTarget && "bg-[rgba(107,138,253,0.10)]"
              )}
            >
              <span
                className={cn(
                  "font-mono text-[12px] tabular-nums",
                  isCurrentMonth ? "text-[#6E7686]" : "text-[#3A4150]",
                  isToday && "text-[#8099FE] font-semibold"
                )}
              >
                {date.getDate()}
              </span>
              <div className="flex flex-col gap-1">
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      onDragStart(e, ev.id);
                    }}
                    onDragEnd={onDragEnd}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(ev);
                    }}
                    className="h-[6px] w-full cursor-pointer rounded-full transition-transform hover:scale-y-150"
                    style={{
                      backgroundColor: ev.color,
                      opacity: draggingId === ev.id ? 0.3 : 1,
                    }}
                    title={ev.title}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<GuildCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchor, setAnchor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GuildCalendarEvent | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteState, setDeleteState] = useState<"idle" | "confirm">("idle");
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setEvents(await fetchCalendarEvents());
    } catch {
      toast.error("Failed to load events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, GuildCalendarEvent[]>();
    for (const ev of events) {
      const list = map.get(ev.event_date) ?? [];
      list.push(ev);
      map.set(ev.event_date, list);
    }
    for (const list of Array.from(map.values())) {
      list.sort((a, b) => (a.start_time ?? "").localeCompare(b.start_time ?? ""));
    }
    return map;
  }, [events]);

  const today = todayStr();

  const sortedDates = useMemo(
    () => Array.from(eventsByDate.keys()).sort((a, b) => a.localeCompare(b)),
    [eventsByDate]
  );

  const upcomingCount = useMemo(
    () => events.filter((ev) => ev.event_date >= today).length,
    [events, today]
  );

  const nextEventId = useMemo(() => {
    const upcoming = events
      .filter((ev) => ev.event_date >= today)
      .sort((a, b) =>
        a.event_date === b.event_date
          ? (a.start_time ?? "").localeCompare(b.start_time ?? "")
          : a.event_date.localeCompare(b.event_date)
      );
    return upcoming[0]?.id ?? null;
  }, [events, today]);

  const navigate = (dir: -1 | 1) =>
    setAnchor((prev) => new Date(prev.getFullYear(), prev.getMonth() + dir, 1));
  const goToday = () => setAnchor(new Date());

  const openCreate = useCallback((date: string) => {
    setEditing(null);
    setDeleteState("idle");
    setForm({ ...defaultForm, event_date: date });
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((ev: GuildCalendarEvent) => {
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
  }, []);

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

  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData("eventId", String(id));
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(id);
  };
  const handleDragEnd = () => { setDraggingId(null); setDropTarget(null); };
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
    const ev = events.find((e2) => e2.id === id);
    if (!ev || ev.event_date === dateStr) return;
    try {
      await updateCalendarEvent(id, { event_date: dateStr });
      await load();
    } catch {
      toast.error("Failed to move event");
    }
  };

  const handleDayClick = useCallback(
    (dateStr: string) => {
      setSelectedDate(dateStr);
      const dayHasEvents = (eventsByDate.get(dateStr) ?? []).length > 0;
      if (dayHasEvents) {
        const el = document.getElementById(`agenda-day-${dateStr}`);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        openCreate(dateStr);
      }
    },
    [eventsByDate, openCreate]
  );

  return (
    <div className="pb-16 space-y-5">
      <PageHeader
        title="Events"
        subtitle="Workshops, socials, and meetings on the club calendar."
        count={upcomingCount}
        actions={
          <>
            <div className="flex items-center gap-1 rounded-control border border-[rgba(255,255,255,0.09)] bg-[#12151C] p-0.5">
              <Button variant="ghost" size="iconSm" onClick={() => navigate(-1)}>
                <ChevronLeft className="size-[15px]" />
              </Button>
              <span className="min-w-[124px] px-1 text-center font-display text-[13.5px] font-semibold tracking-[-0.01em] text-[#E8EBF2]">
                {MONTH_NAMES[anchor.getMonth()]} {anchor.getFullYear()}
              </span>
              <Button variant="ghost" size="iconSm" onClick={() => navigate(1)}>
                <ChevronRight className="size-[15px]" />
              </Button>
            </div>
            <Button variant="secondary" size="default" onClick={goToday}>
              Today
            </Button>
            <Button onClick={() => openCreate(today)}>
              <Plus className="size-[15px]" />
              New event
            </Button>
          </>
        }
      />

      {!loading && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
          <EventMonthGrid
            monthDate={anchor}
            eventsByDate={eventsByDate}
            selectedDate={selectedDate}
            draggingId={draggingId}
            dropTarget={dropTarget}
            onDayClick={handleDayClick}
            onEventClick={openEdit}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
          <AgendaRail
            dates={sortedDates}
            eventsByDate={eventsByDate}
            todayStr={today}
            nextEventId={nextEventId}
            onEventClick={openEdit}
            onCreate={() => openCreate(today)}
          />
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit event" : "New event"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div>
              <Label className="t-label text-[#A7B0C0] mb-1.5 block">Title</Label>
              <Input
                autoFocus
                placeholder="Event title"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>

            <div>
              <Label className="t-label text-[#A7B0C0] mb-1.5 block">Date</Label>
              <Input
                type="date"
                value={form.event_date}
                onChange={(e) => setForm((p) => ({ ...p, event_date: e.target.value }))}
                className="[color-scheme:dark]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <TimePicker
                label="Start time"
                value={form.start_time}
                onChange={(v) => setForm((p) => ({ ...p, start_time: v }))}
                onClear={() => setForm((p) => ({ ...p, start_time: "" }))}
              />
              <TimePicker
                label="End time"
                value={form.end_time}
                onChange={(v) => setForm((p) => ({ ...p, end_time: v }))}
                onClear={() => setForm((p) => ({ ...p, end_time: "" }))}
              />
            </div>

            <div>
              <Label className="t-label text-[#A7B0C0] mb-1.5 flex items-center gap-1 block">
                <MapPin className="size-3" />
                Location
              </Label>
              <Input
                placeholder="e.g. Discord, Google Meet, Room 4B"
                value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              />
            </div>

            <div>
              <Label className="t-label text-[#A7B0C0] mb-1.5 block">Description</Label>
              <Textarea
                rows={3}
                placeholder="Optional details…"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>

            <div>
              <Label className="t-label text-[#A7B0C0] mb-2 block">Color</Label>
              <div className="flex gap-2">
                {EVENT_COLORS.map(({ hex, label }) => (
                  <button
                    key={hex}
                    type="button"
                    title={label}
                    onClick={() => setForm((p) => ({ ...p, color: hex }))}
                    className={cn(
                      "size-7 rounded-full transition-all",
                      form.color === hex
                        ? "ring-2 ring-white ring-offset-2 ring-offset-[#12151C] scale-110"
                        : "opacity-70 hover:opacity-100 hover:scale-105"
                    )}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="!justify-between">
            {editing ? (
              <Button
                variant="ghost"
                className={deleteState === "confirm" ? "text-[#FCA5A5] hover:bg-[rgba(239,68,68,0.14)]" : "text-[#6E7686]"}
                onClick={handleDeleteClick}
                disabled={saving}
              >
                {deleteState === "confirm" ? "Confirm delete?" : "Delete"}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={closeModal} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} loading={saving}>
                {editing ? "Save" : "Create event"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

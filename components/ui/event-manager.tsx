"use client";

import * as React from "react";
import { useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string; // ISO datetime e.g. "2025-01-15T09:00:00"
  endTime: string;
  color?: string;
  category?: string;
  tags?: string[];
}

interface EventManagerProps {
  events?: CalendarEvent[];
  categories?: string[];
  defaultView?: "month" | "week";
  onEventCreate?: (date: string) => void;
  onEventUpdate?: (id: string, updates: { startTime: string; endTime: string }) => void;
  onEventDelete?: (id: string) => void;
}

const COLOR_CHIP: Record<string, string> = {
  blue: "bg-blue-950/70 text-blue-300 border-blue-800/50 hover:bg-blue-900/60",
  orange: "bg-orange-950/70 text-orange-300 border-orange-800/50 hover:bg-orange-900/60",
  purple: "bg-purple-950/70 text-purple-300 border-purple-800/50 hover:bg-purple-900/60",
  green: "bg-green-950/70 text-green-300 border-green-800/50 hover:bg-green-900/60",
  red: "bg-red-950/70 text-red-300 border-red-800/50 hover:bg-red-900/60",
};

const DOT_COLORS: Record<string, string> = {
  blue: "bg-blue-400",
  orange: "bg-orange-400",
  purple: "bg-purple-400",
  green: "bg-green-400",
  red: "bg-red-400",
};

function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getEventDate(event: CalendarEvent): string {
  return event.startTime.split("T")[0];
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getMonthGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const start = new Date(year, month, 1 - startOffset);
  return Array.from({ length: 42 }, (_, i) =>
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
  );
}

export function EventManager({
  events = [],
  categories = [],
  defaultView = "month",
  onEventCreate,
  onEventUpdate,
  onEventDelete,
}: EventManagerProps) {
  const today = new Date();
  const todayStr = toDateString(today);

  const [view, setView] = useState<"month" | "week">(defaultView);
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay());
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  });
  const [filterCat, setFilterCat] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingDate, setEditingDate] = useState("");
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const visibleEvents = useMemo(
    () => (filterCat === "all" ? events : events.filter((e) => e.category === filterCat)),
    [events, filterCat]
  );

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of visibleEvents) {
      const d = getEventDate(e);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(e);
    }
    return map;
  }, [visibleEvents]);

  const monthGrid = useMemo(
    () => getMonthGrid(currentMonth.getFullYear(), currentMonth.getMonth()),
    [currentMonth]
  );

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i)
      ),
    [weekStart]
  );

  const goToToday = () => {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay());
    setWeekStart(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setEditingDate(getEventDate(event));
  };

  const handleDayClick = (date: Date) => {
    if (onEventCreate) onEventCreate(toDateString(date));
  };

  const handleDrop = useCallback(
    (e: React.DragEvent, date: Date) => {
      e.preventDefault();
      setDragOverDate(null);
      const eventId = e.dataTransfer.getData("eventId");
      if (eventId && onEventUpdate) {
        const newDate = toDateString(date);
        onEventUpdate(eventId, {
          startTime: `${newDate}T09:00:00`,
          endTime: `${newDate}T10:00:00`,
        });
      }
    },
    [onEventUpdate]
  );

  const handleUpdateDate = () => {
    if (!selectedEvent || !onEventUpdate || !editingDate) return;
    onEventUpdate(selectedEvent.id, {
      startTime: `${editingDate}T09:00:00`,
      endTime: `${editingDate}T10:00:00`,
    });
    setSelectedEvent(null);
  };

  const handleDelete = () => {
    if (!selectedEvent || !onEventDelete) return;
    onEventDelete(selectedEvent.id);
    setSelectedEvent(null);
  };

  const chipClass = (color?: string) =>
    COLOR_CHIP[color ?? "blue"] ?? COLOR_CHIP.blue;

  const renderDayCell = (date: Date, isCurrentPeriod: boolean) => {
    const dateStr = toDateString(date);
    const dayEvents = byDate.get(dateStr) ?? [];
    const isToday = dateStr === todayStr;
    const isDragOver = dragOverDate === dateStr;

    return (
      <div
        key={dateStr}
        onClick={() => handleDayClick(date)}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverDate(dateStr);
        }}
        onDragLeave={() => setDragOverDate(null)}
        onDrop={(e) => handleDrop(e, date)}
        className={cn(
          "bg-card min-h-[90px] p-2 transition-colors",
          !isCurrentPeriod && "opacity-40",
          isDragOver && "bg-primary/10",
          onEventCreate ? "cursor-pointer hover:bg-muted/30" : "cursor-default"
        )}
      >
        <div
          className={cn(
            "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1",
            isToday
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground"
          )}
        >
          {date.getDate()}
        </div>
        <div className="space-y-0.5">
          {dayEvents.slice(0, 3).map((ev) => (
            <button
              key={ev.id}
              draggable
              onDragStart={(e) => {
                e.stopPropagation();
                e.dataTransfer.setData("eventId", ev.id);
              }}
              onClick={(e) => handleEventClick(e, ev)}
              className={cn(
                "w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate border font-medium cursor-grab active:cursor-grabbing transition-opacity",
                chipClass(ev.color)
              )}
            >
              {ev.title}
            </button>
          ))}
          {dayEvents.length > 3 && (
            <p className="text-[10px] text-muted-foreground pl-1">
              +{dayEvents.length - 3} more
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              view === "month"
                ? setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
                : setWeekStart((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7))
            }
            className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-foreground min-w-[200px] text-center">
            {view === "month"
              ? formatMonthYear(currentMonth)
              : `${weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
          </span>
          <button
            onClick={() =>
              view === "month"
                ? setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
                : setWeekStart((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7))
            }
            className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={goToToday}
            className="ml-1 px-3 py-1.5 rounded-md text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          {categories.length > 0 && (
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="h-8 text-xs bg-muted border border-border rounded-md px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
          <div className="flex items-center gap-1 bg-muted rounded-full p-1">
            {(["month", "week"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  view === v
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar body */}
      <div className="p-4">
        <div className="grid grid-cols-7 mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {d}
            </div>
          ))}
        </div>

        {view === "month" ? (
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {monthGrid.map((date) =>
              renderDayCell(date, date.getMonth() === currentMonth.getMonth())
            )}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {weekDays.map((date) => {
              const dateStr = toDateString(date);
              const dayEvents = byDate.get(dateStr) ?? [];
              const isToday = dateStr === todayStr;
              const isDragOver = dragOverDate === dateStr;

              return (
                <div
                  key={dateStr}
                  onClick={() => handleDayClick(date)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverDate(dateStr);
                  }}
                  onDragLeave={() => setDragOverDate(null)}
                  onDrop={(e) => handleDrop(e, date)}
                  className={cn(
                    "bg-card min-h-[200px] p-3 transition-colors",
                    isDragOver && "bg-primary/10",
                    onEventCreate ? "cursor-pointer hover:bg-muted/30" : "cursor-default"
                  )}
                >
                  <div className="text-center mb-3">
                    <p className="text-xs text-muted-foreground">
                      {date.toLocaleDateString("en-US", { weekday: "short" })}
                    </p>
                    <div
                      className={cn(
                        "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mx-auto mt-1",
                        isToday
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground"
                      )}
                    >
                      {date.getDate()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {dayEvents.map((ev) => (
                      <button
                        key={ev.id}
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          e.dataTransfer.setData("eventId", ev.id);
                        }}
                        onClick={(e) => handleEventClick(e, ev)}
                        className={cn(
                          "w-full text-left text-xs px-2 py-1.5 rounded-md truncate border font-medium cursor-grab active:cursor-grabbing transition-opacity hover:opacity-80",
                          chipClass(ev.color)
                        )}
                      >
                        {ev.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Event detail modal */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setSelectedEvent(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div
                className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {selectedEvent.color && (
                      <div
                        className={cn(
                          "w-2.5 h-2.5 rounded-full shrink-0",
                          DOT_COLORS[selectedEvent.color] ?? "bg-blue-400"
                        )}
                      />
                    )}
                    <h3 className="text-base font-semibold text-foreground leading-tight">
                      {selectedEvent.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {selectedEvent.category && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Category:{" "}
                    <span className="text-foreground">{selectedEvent.category}</span>
                  </p>
                )}

                {selectedEvent.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedEvent.description}
                  </p>
                )}

                {onEventUpdate && (
                  <div className="mt-4 space-y-2">
                    <label className="text-xs font-medium text-muted-foreground block">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={editingDate}
                      onChange={(e) => setEditingDate(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-input px-3 text-sm text-foreground [color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <button
                      onClick={handleUpdateDate}
                      className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Update Date
                    </button>
                  </div>
                )}

                {onEventDelete && (
                  <button
                    onClick={handleDelete}
                    className="w-full mt-2 h-9 rounded-md border border-destructive/50 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={13} />
                    Delete Task
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

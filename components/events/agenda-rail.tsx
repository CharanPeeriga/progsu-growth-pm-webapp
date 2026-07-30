"use client"

import { Sparkles } from "lucide-react"

import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { EventCard } from "@/components/events/event-card"
import type { GuildCalendarEvent } from "@/lib/types"

interface AgendaRailProps {
  dates: string[]
  eventsByDate: Map<string, GuildCalendarEvent[]>
  todayStr: string
  nextEventId: number | null
  onEventClick: (event: GuildCalendarEvent) => void
  onCreate: () => void
}

export function AgendaRail({
  dates,
  eventsByDate,
  todayStr,
  nextEventId,
  onEventClick,
  onCreate,
}: AgendaRailProps) {
  if (dates.length === 0) {
    return (
      <div className="surface-card">
        <EmptyState
          icon={Sparkles}
          title="Nothing scheduled"
          description="Add an event so members know when to show up."
          action={<Button onClick={onCreate}>New event</Button>}
        />
      </div>
    )
  }

  return (
    <div className="max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
      <div className="flex flex-col gap-4">
        {dates.map((dateStr) => {
          const dayEvents = eventsByDate.get(dateStr) ?? [];
          const date = new Date(dateStr + "T00:00:00");
          const label = date
            .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
            .toUpperCase()
            .replace(",", " ·");
          return (
            <div key={dateStr} id={`agenda-day-${dateStr}`}>
              <div className="sticky top-0 z-10 -mx-1 mb-3 px-1 py-2 surface-glass !border-0 rounded-none">
                <span className="font-mono text-[11px] uppercase tracking-[0.09em] text-[#6E7686]">
                  {label}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {dayEvents.map((ev) => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    isPast={dateStr < todayStr}
                    isUpNext={ev.id === nextEventId}
                    onClick={() => onEventClick(ev)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}

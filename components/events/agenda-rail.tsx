"use client"

import { Sparkles } from "lucide-react"

import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { EventCard } from "@/components/events/event-card"
import { Stagger, StaggerItem } from "@/components/layout/stagger"
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
              <div className="sticky top-0 z-10 -mx-1 mb-3 px-1 py-2 bg-[#0D0F14] rounded-none">
                <span className="font-mono text-[11px] uppercase tracking-[0.09em] text-[#6E7686]">
                  {label}
                </span>
              </div>
              <Stagger className="flex flex-col gap-3">
                {dayEvents.map((ev) => (
                  <StaggerItem key={ev.id}>
                    <EventCard
                      event={ev}
                      isPast={dateStr < todayStr}
                      isUpNext={ev.id === nextEventId}
                      onClick={() => onEventClick(ev)}
                    />
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          );
        })}
      </div>
    </div>
  )
}

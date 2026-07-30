"use client"

import { Clock, MapPin } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { EVENT_CATEGORY } from "@/lib/design"
import type { GuildCalendarEvent } from "@/lib/types"

function formatTime(t: string | null): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

interface EventCardProps {
  event: GuildCalendarEvent
  isPast?: boolean
  isUpNext?: boolean
  onClick?: () => void
}

export function EventCard({ event, isPast, isUpNext, onClick }: EventCardProps) {
  const c = EVENT_CATEGORY.workshop;
  const date = new Date(event.event_date + "T00:00:00");
  const monthAbbr = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const dayNum = date.getDate();
  const timeRange = event.start_time
    ? event.end_time
      ? `${formatTime(event.start_time)} – ${formatTime(event.end_time)}`
      : formatTime(event.start_time)
    : "All day";

  return (
    <article
      onClick={onClick}
      className={[
        "surface-card surface-card-interactive relative cursor-pointer overflow-hidden p-4 pl-[62px]",
        isUpNext ? "surface-featured" : "",
        isPast ? "opacity-55" : "",
      ].join(" ")}
    >
      <div
        className="absolute left-0 top-0 flex h-full w-[54px] flex-col items-center justify-center gap-0.5 border-r"
        style={{ backgroundColor: c.fill, borderColor: c.border }}
      >
        <span className="t-caption uppercase tracking-[0.08em]" style={{ color: c.text }}>
          {monthAbbr}
        </span>
        <span className="font-mono text-[20px] font-medium leading-none" style={{ color: c.text }}>
          {dayNum}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {isUpNext && <span className="t-overline text-[#8099FE]">UP NEXT</span>}
        <div className="flex items-start justify-between gap-3">
          <h3 className="t-h3 text-[#E8EBF2]">{event.title}</h3>
          <div className="flex shrink-0 items-center gap-1.5">
            {isPast && <Badge variant="neutral">Past</Badge>}
            <Badge
              variant="neutral"
              style={{ backgroundColor: c.fill, borderColor: c.border, color: c.text }}
            >
              {c.label}
            </Badge>
          </div>
        </div>

        {event.description && (
          <p className="t-body-sm line-clamp-2 text-[#A7B0C0]">{event.description}</p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="flex items-center gap-1.5 t-caption text-[#6E7686]">
            <Clock className="size-3.5" />
            {timeRange}
          </span>
          {event.location && (
            <span className="flex items-center gap-1.5 t-caption text-[#6E7686]">
              <MapPin className="size-3.5" />
              {event.location}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

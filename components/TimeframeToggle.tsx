"use client"

import { cn } from "@/lib/utils"

export type Timeframe = "week" | "all"

interface TimeframeToggleProps {
  value: Timeframe
  onChange: (next: Timeframe) => void
}

const OPTIONS: { value: Timeframe; label: string }[] = [
  { value: "week", label: "This Week" },
  { value: "all", label: "All Time" },
]

export function TimeframeToggle({ value, onChange }: TimeframeToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Timeframe"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm"
    >
      {OPTIONS.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "px-4 py-1.5 text-xs font-medium rounded-full transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

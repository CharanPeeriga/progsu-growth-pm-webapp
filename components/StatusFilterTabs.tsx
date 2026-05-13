"use client"

import { cn } from "@/lib/utils"
import type { TaskStatus } from "@/lib/types"

export type StatusFilter = "all" | TaskStatus

interface StatusFilterTabsProps {
  value: StatusFilter
  onChange: (next: StatusFilter) => void
  counts?: Partial<Record<StatusFilter, number>>
}

const TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
]

export function StatusFilterTabs({
  value,
  onChange,
  counts,
}: StatusFilterTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter tasks by status"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm"
    >
      {TABS.map((tab) => {
        const active = tab.value === value
        const count = counts?.[tab.value]
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              "px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1.5",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            <span>{tab.label}</span>
            {typeof count === "number" && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-px text-[10px] font-semibold",
                  active
                    ? "bg-white/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

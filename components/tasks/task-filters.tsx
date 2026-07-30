"use client"

import { X } from "lucide-react"

import { SearchInput } from "@/components/ui/search-input"
import Combobox from "@/components/ui/combobox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TEAM_STYLE, STATUS_STYLE, STATUS_ORDER, type Team, type Status } from "@/lib/design"
import type { TeamMember } from "@/lib/types"

export type SortOption = "newest" | "due_soonest" | "assignee"

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest",
  due_soonest: "Due soonest",
  assignee: "Assignee",
};

const SORT_OPTIONS: SortOption[] = ["newest", "due_soonest", "assignee"];

interface TaskFiltersProps {
  search: string
  onSearchChange: (v: string) => void
  teamFilter: "all" | Team
  onTeamFilterChange: (v: "all" | Team) => void
  statusFilter: "all" | Status
  onStatusFilterChange: (v: "all" | Status) => void
  assigneeFilter: string
  onAssigneeFilterChange: (v: string) => void
  teamMembers: TeamMember[]
  sort: SortOption
  onSortChange: (v: SortOption) => void
}

export function TaskFilters({
  search,
  onSearchChange,
  teamFilter,
  onTeamFilterChange,
  statusFilter,
  onStatusFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  teamMembers,
  sort,
  onSortChange,
}: TaskFiltersProps) {
  const teamOptions = [
    { value: "all", label: "All teams" },
    ...(Object.keys(TEAM_STYLE) as Team[]).map((t) => ({
      value: t,
      label: TEAM_STYLE[t].label,
      color: TEAM_STYLE[t].base,
    })),
  ]

  const assigneeOptions = teamMembers.map((m) => ({
    value: m.user_id,
    label: m.display_name || m.user_id,
    hint: TEAM_STYLE[m.team].label,
  }))

  const assigneeName =
    teamMembers.find((m) => m.user_id === assigneeFilter)?.display_name ?? assigneeFilter

  const activeChips: { key: string; label: string; onClear: () => void }[] = []
  if (teamFilter !== "all") {
    activeChips.push({
      key: "team",
      label: TEAM_STYLE[teamFilter].label,
      onClear: () => onTeamFilterChange("all"),
    })
  }
  if (statusFilter !== "all") {
    activeChips.push({
      key: "status",
      label: STATUS_STYLE[statusFilter].label,
      onClear: () => onStatusFilterChange("all"),
    })
  }
  if (assigneeFilter) {
    activeChips.push({
      key: "assignee",
      label: assigneeName,
      onClear: () => onAssigneeFilterChange(""),
    })
  }
  if (search.trim()) {
    activeChips.push({
      key: "search",
      label: `"${search.trim()}"`,
      onClear: () => onSearchChange(""),
    })
  }

  const clearAll = () => {
    onTeamFilterChange("all")
    onStatusFilterChange("all")
    onAssigneeFilterChange("")
    onSearchChange("")
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-card border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-2.5">
      <SearchInput
        placeholder="Search tasks, assignees, or teams"
        className="w-[280px]"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <Combobox
        items={teamOptions}
        value={teamFilter}
        onSelect={(v) => onTeamFilterChange(v as "all" | Team)}
        placeholder="All teams"
        className="w-[168px]"
      />

      <Select
        value={statusFilter}
        onValueChange={(v) => onStatusFilterChange(v as "all" | Status)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue>
            {(v: "all" | Status) => (v === "all" ? "All statuses" : STATUS_STYLE[v].label)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {STATUS_ORDER.map((s) => (
            <SelectItem
              key={s}
              value={s}
              className="select-dot"
              style={{ "--dot-color": STATUS_STYLE[s].base } as React.CSSProperties}
            >
              {STATUS_STYLE[s].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Combobox
        items={assigneeOptions}
        value={assigneeFilter || undefined}
        onSelect={(v) => onAssigneeFilterChange(v)}
        onClear={() => onAssigneeFilterChange("")}
        placeholder="All assignees"
        className="w-[196px]"
      />

      <div className="flex-1" />

      {activeChips.map((chip) => (
        <Badge key={chip.key} variant="neutral" className="gap-1">
          {chip.label}
          <button
            type="button"
            onClick={chip.onClear}
            className="ml-0.5 text-[#6E7686] hover:text-[#E8EBF2]"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}

      {activeChips.length > 0 && (
        <Button variant="ghost" size="sm" onClick={clearAll}>
          Clear all
        </Button>
      )}

      <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue>{(v: SortOption) => SORT_LABELS[v]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((s) => (
            <SelectItem key={s} value={s}>
              {SORT_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

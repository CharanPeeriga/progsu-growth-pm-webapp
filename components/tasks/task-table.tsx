"use client"

import { motion } from "framer-motion"
import {
  ListChecks,
  Pencil,
  UserPlus,
  Check,
  Undo2,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { TeamBadge } from "@/components/ui/team-badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import Combobox from "@/components/ui/combobox"
import { Stagger, StaggerItem } from "@/components/layout/stagger"
import { cn } from "@/lib/utils"
import { TEAM_STYLE, STATUS_STYLE, STATUS_ORDER, type Team, type Status } from "@/lib/design"
import type { DBTask, TeamMember, TaskCollaborator } from "@/lib/types"

function formatDue(dateStr: string): { label: string; overdue: boolean; today: boolean } {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = new Date(dateStr + "T00:00:00")
  const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  const label = due.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  return { label, overdue: diffDays < 0, today: diffDays === 0 }
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function Avatar({
  name,
  ringColor,
  overlap = false,
}: {
  name: string
  ringColor: string
  overlap?: boolean
}) {
  return (
    <span
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-full bg-[#171B23] font-mono text-[10px] text-[#A7B0C0]",
        overlap && "-ml-1.5 ring-2 ring-[#0D0F14]"
      )}
      style={!overlap ? { boxShadow: `0 0 0 1px ${ringColor}59` } : undefined}
      title={name}
    >
      {initials(name)}
    </span>
  )
}

interface TaskTableProps {
  tasks: DBTask[]
  loading: boolean
  hasAnyTasks: boolean
  hasActiveFilters: boolean
  memberMap: Map<string, string>
  memberTeamMap: Map<string, Team>
  collabByTask: Map<number, TaskCollaborator[]>
  teamMembers: TeamMember[]

  selectedIds: Set<number>
  onToggleSelect: (id: number) => void
  onToggleSelectAll: () => void

  onEdit: (task: DBTask) => void
  onReassign: (task: DBTask, userId: string) => void
  onDeleteRequest: (task: DBTask) => void
  onApprove: (task: DBTask) => void
  onReject: (task: DBTask) => void

  onClearFilters: () => void
  onCreateTask: () => void

  page: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void

  onBulkDelete: () => void
  onBulkSetStatus: (status: Status) => void
  onBulkReassign: (userId: string) => void
  onClearSelection: () => void
}

export function TaskTable({
  tasks,
  loading,
  hasAnyTasks,
  hasActiveFilters,
  memberMap,
  memberTeamMap,
  collabByTask,
  teamMembers,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onReassign,
  onDeleteRequest,
  onApprove,
  onReject,
  onClearFilters,
  onCreateTask,
  page,
  pageSize,
  totalCount,
  onPageChange,
  onBulkDelete,
  onBulkSetStatus,
  onBulkReassign,
  onClearSelection,
}: TaskTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const allSelected = tasks.length > 0 && tasks.every((t) => selectedIds.has(t.id))
  const memberOptions = teamMembers.map((m) => ({
    value: m.user_id,
    label: m.display_name || m.user_id,
    hint: TEAM_STYLE[m.team].label,
  }))

  return (
    <TooltipProvider>
      <div className="surface-card">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-[124px] z-10">
              <tr className="h-10 bg-[#12151C] border-0 border-b border-b-[rgba(255,255,255,0.09)] rounded-none">
                <th className="w-[38px] px-4">
                  <input
                    type="checkbox"
                    className="accent-[#6B8AFD]"
                    checked={allSelected}
                    onChange={onToggleSelectAll}
                    aria-label="Select all tasks"
                  />
                </th>
                <th className="t-overline min-w-[280px] px-4 text-[#6E7686]">TASK</th>
                <th className="t-overline w-[132px] px-4 text-[#6E7686]">TEAM</th>
                <th className="t-overline w-[190px] px-4 text-[#6E7686]">ASSIGNEE</th>
                <th className="t-overline w-[136px] px-4 text-[#6E7686]">STATUS</th>
                <th className="t-overline w-[116px] px-4 text-[#6E7686]">DUE</th>
                <th className="w-[132px] px-4 text-right" />
              </tr>
            </thead>

            {loading ? (
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="h-[52px] border-b border-[rgba(255,255,255,0.05)]">
                    <td className="px-4"><Skeleton className="h-4 w-4" /></td>
                    <td className="px-4"><Skeleton className="h-4 w-[220px]" /></td>
                    <td className="px-4"><Skeleton className="h-5 w-[90px] rounded-full" /></td>
                    <td className="px-4"><Skeleton className="h-4 w-[140px]" /></td>
                    <td className="px-4"><Skeleton className="h-5 w-[90px] rounded-full" /></td>
                    <td className="px-4"><Skeleton className="h-4 w-[70px]" /></td>
                    <td className="px-4" />
                  </tr>
                ))}
              </tbody>
            ) : tasks.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={7}>
                    {hasAnyTasks ? (
                      <EmptyState
                        icon={ListChecks}
                        title="No tasks match these filters"
                        description="Clear a filter or create a new task."
                        action={
                          hasActiveFilters ? (
                            <Button variant="ghost" onClick={onClearFilters}>
                              Clear all filters
                            </Button>
                          ) : undefined
                        }
                      />
                    ) : (
                      <EmptyState
                        icon={ListChecks}
                        title="No tasks yet"
                        description="Create the first task and assign it to a team member."
                        action={<Button onClick={onCreateTask}>New task</Button>}
                      />
                    )}
                  </td>
                </tr>
              </tbody>
            ) : (
              <Stagger as="tbody">
                {tasks.map((task, index) => {
                  const assigneeName = memberMap.get(task.assignee_id) ?? task.assignee_id
                  const assigneeTeam = memberTeamMap.get(task.assignee_id) ?? task.team
                  const collabs = (collabByTask.get(task.id) ?? []).filter(
                    (c) => c.user_id !== task.assignee_id
                  )
                  const due = task.due_date ? formatDue(task.due_date) : null
                  const showDueWarning = due && due.overdue && task.status !== "done"
                  const showDueToday = due && due.today && task.status !== "done"
                  const selected = selectedIds.has(task.id)
                  const extraCollabs = Math.max(0, collabs.length - 2)
                  const rowClassName = "group relative h-[52px] border-b border-[rgba(255,255,255,0.05)] transition-colors duration-[160ms] ease-standard hover:bg-[rgba(255,255,255,0.035)] data-[state=selected]:bg-[rgba(107,138,253,0.07)]"
                  const RowWrapper = index <= 11 ? StaggerItem : "tr"
                  const rowExtraProps = index <= 11 ? { as: "tr" as const, fade: true } : {}

                  return (
                    <RowWrapper
                      key={task.id}
                      {...rowExtraProps}
                      data-state={selected ? "selected" : undefined}
                      className={rowClassName}
                    >
                      <td className="relative px-4">
                        <span
                          className="row-rail"
                          style={{ background: STATUS_STYLE[task.status].base }}
                        />
                        <input
                          type="checkbox"
                          className="accent-[#6B8AFD]"
                          checked={selected}
                          onChange={() => onToggleSelect(task.id)}
                          aria-label={`Select task ${task.task_name}`}
                        />
                      </td>
                      <td className="min-w-[280px] px-4 align-middle">
                        <p className="truncate text-[13.5px] font-medium text-[#E8EBF2]">
                          {task.task_name}
                        </p>
                        {task.rejection_reason && (
                          <p className="t-caption truncate text-[#6E7686]">
                            Sent back: {task.rejection_reason}
                          </p>
                        )}
                      </td>
                      <td className="w-[132px] px-4 align-middle">
                        <TeamBadge team={task.team} />
                      </td>
                      <td className="w-[190px] px-4 align-middle">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            <Avatar
                              name={assigneeName}
                              ringColor={TEAM_STYLE[assigneeTeam].base}
                            />
                            {collabs.slice(0, 2).map((c) => (
                              <Avatar
                                key={c.user_id}
                                name={memberMap.get(c.user_id) ?? c.user_id}
                                ringColor={TEAM_STYLE[assigneeTeam].base}
                                overlap
                              />
                            ))}
                          </div>
                          <span className="truncate text-[13px] text-[#A7B0C0]">
                            {assigneeName}
                          </span>
                          {extraCollabs > 0 && (
                            <span className="font-mono text-[11px] text-[#6E7686]">
                              +{extraCollabs}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="w-[136px] px-4 align-middle">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="w-[116px] px-4 align-middle">
                        {due ? (
                          <span
                            className={cn(
                              "t-mono inline-flex items-center gap-1",
                              showDueWarning
                                ? "text-[#FCA5A5]"
                                : showDueToday
                                ? "text-[var(--status-review-text)]"
                                : "text-[#A7B0C0]"
                            )}
                          >
                            {showDueToday ? "Today" : due.label}
                            {showDueWarning && <AlertTriangle className="size-3" />}
                          </span>
                        ) : (
                          <span className="t-mono text-[#6E7686]">—</span>
                        )}
                      </td>
                      <td className="w-[132px] px-4 text-right align-middle">
                        <div className="flex items-center justify-end gap-1 opacity-40 transition-opacity duration-[160ms] group-hover:opacity-100 focus-within:opacity-100">
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button variant="ghost" size="iconSm" aria-label="Edit task" onClick={() => onEdit(task)} />
                              }
                            >
                              <Pencil />
                            </TooltipTrigger>
                            <TooltipContent>Edit task</TooltipContent>
                          </Tooltip>

                          <Popover>
                            <PopoverTrigger render={<Button variant="ghost" size="iconSm" aria-label="Assign" />}>
                              <UserPlus />
                            </PopoverTrigger>
                            <PopoverContent className="w-[220px]">
                              <Combobox
                                items={memberOptions}
                                onSelect={(v) => onReassign(task, v)}
                                placeholder="Reassign to…"
                              />
                            </PopoverContent>
                          </Popover>

                          {task.status === "review" && (
                            <>
                              <Tooltip>
                                <TooltipTrigger
                                  render={
                                    <Button
                                      variant="ghost"
                                      size="iconSm"
                                      aria-label="Approve"
                                      className="text-[var(--status-done-text)] hover:bg-[var(--status-done-fill)]"
                                      onClick={() => onApprove(task)}
                                    />
                                  }
                                >
                                  <Check />
                                </TooltipTrigger>
                                <TooltipContent>Approve</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger
                                  render={
                                    <Button
                                      variant="ghost"
                                      size="iconSm"
                                      aria-label="Send back"
                                      className="text-[var(--status-review-text)] hover:bg-[var(--status-review-fill)]"
                                      onClick={() => onReject(task)}
                                    />
                                  }
                                >
                                  <Undo2 />
                                </TooltipTrigger>
                                <TooltipContent>Send back</TooltipContent>
                              </Tooltip>
                            </>
                          )}

                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="iconSm"
                                  aria-label="Delete"
                                  className="text-[#FCA5A5] hover:bg-[rgba(239,68,68,0.14)]"
                                  onClick={() => onDeleteRequest(task)}
                                />
                              }
                            >
                              <Trash2 />
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                    </RowWrapper>
                  )
                })}
              </Stagger>
            )}
          </table>

        {!loading && tasks.length > 0 && (
          <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.06)] px-4 py-3">
            <p className="t-caption text-[#6E7686]">
              Showing {tasks.length} of {totalCount} task{totalCount !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                <ChevronLeft className="size-[15px]" />
              </Button>
              <span className="t-mono text-[12px] text-[#A7B0C0]">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                <ChevronRight className="size-[15px]" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-card bg-[#171B23] border border-[rgba(255,255,255,0.09)] px-4 py-2.5 shadow-popover"
        >
          <span className="t-body-sm text-[#E8EBF2]">{selectedIds.size} selected</span>
          <span className="h-4 w-px bg-[rgba(255,255,255,0.09)]" />

          <Popover>
            <PopoverTrigger render={<Button variant="ghost" size="sm">Reassign</Button>} />
            <PopoverContent className="w-[220px]">
              <Combobox
                items={memberOptions}
                onSelect={(v) => onBulkReassign(v)}
                placeholder="Reassign to…"
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger render={<Button variant="ghost" size="sm">Set status</Button>} />
            <PopoverContent className="w-[160px]">
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onBulkSetStatus(s)}
                  className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-chip px-2.5 text-left text-[13px] text-[#A7B0C0] outline-none hover:bg-[rgba(255,255,255,0.05)] hover:text-[#E8EBF2]"
                >
                  <span
                    className="size-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: STATUS_STYLE[s].base }}
                  />
                  {STATUS_STYLE[s].label}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="sm"
            className="text-[#FCA5A5] hover:bg-[rgba(239,68,68,0.14)]"
            onClick={onBulkDelete}
          >
            Delete
          </Button>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="iconSm" aria-label="Clear selection" onClick={onClearSelection} />
              }
            >
              <X />
            </TooltipTrigger>
            <TooltipContent>Clear selection</TooltipContent>
          </Tooltip>
        </motion.div>
      )}
    </TooltipProvider>
  )
}

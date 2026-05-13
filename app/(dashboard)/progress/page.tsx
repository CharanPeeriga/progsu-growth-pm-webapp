"use client"

import * as React from "react"
import { motion } from "framer-motion"

import { StatCard } from "@/components/StatCard"
import { TimeframeToggle, type Timeframe } from "@/components/TimeframeToggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { createBrowserSupabase, getGuildId } from "@/lib/supabase"
import { fetchAllTasks } from "@/lib/queries"
import type { DBTask } from "@/lib/types"
import {
  cn,
  dueBadgeClass,
  formatDueDate,
  getDueState,
  shortenId,
  startOfDay,
} from "@/lib/utils"

interface PersonRow {
  assignee_id: string
  completed: number
  pending: number
  overdue: number
  total: number
  oldestOverdue: DBTask | null
}

interface OverviewCounts {
  total: number
  completed: number
  pending: number
  overdue: number
}

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 14 },
  },
} as const

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
} as const

function isOverdue(task: DBTask, today: Date): boolean {
  if (!task.due_date) return false
  if (task.status === "done") return false
  const [year, month, day] = task.due_date.split("-").map(Number)
  if (!year || !month || !day) return false
  const due = startOfDay(new Date(year, month - 1, day))
  return due.getTime() < today.getTime()
}

function computeOverview(tasks: DBTask[], today: Date): OverviewCounts {
  let completed = 0
  let pending = 0
  let overdue = 0
  for (const t of tasks) {
    if (t.status === "done") completed += 1
    if (t.status === "todo" || t.status === "in_progress") pending += 1
    if (isOverdue(t, today)) overdue += 1
  }
  return { total: tasks.length, completed, pending, overdue }
}

function buildPersonRows(tasks: DBTask[], today: Date): PersonRow[] {
  const byPerson = new Map<string, PersonRow>()
  for (const t of tasks) {
    const existing =
      byPerson.get(t.assignee_id) ?? {
        assignee_id: t.assignee_id,
        completed: 0,
        pending: 0,
        overdue: 0,
        total: 0,
        oldestOverdue: null as DBTask | null,
      }
    existing.total += 1
    if (t.status === "done") existing.completed += 1
    if (t.status === "todo" || t.status === "in_progress") existing.pending += 1
    if (isOverdue(t, today)) {
      existing.overdue += 1
      if (
        !existing.oldestOverdue ||
        (t.due_date &&
          existing.oldestOverdue.due_date &&
          t.due_date < existing.oldestOverdue.due_date)
      ) {
        existing.oldestOverdue = t
      }
    }
    byPerson.set(t.assignee_id, existing)
  }
  const rows = Array.from(byPerson.values())
  rows.sort((a, b) => {
    if (b.overdue !== a.overdue) return b.overdue - a.overdue
    if (b.pending !== a.pending) return b.pending - a.pending
    return b.total - a.total
  })
  return rows
}

function buildUpcoming(tasks: DBTask[]): DBTask[] {
  return tasks
    .filter((t) => t.status !== "done" && t.due_date)
    .sort((a, b) => {
      const av = a.due_date ?? ""
      const bv = b.due_date ?? ""
      if (av < bv) return -1
      if (av > bv) return 1
      return 0
    })
    .slice(0, 5)
}

function OverviewSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-card p-5 shadow-sm"
        >
          <div className="h-3 w-20 rounded bg-muted animate-pulse" />
          <div className="mt-4 h-9 w-16 rounded bg-muted animate-pulse" />
          <div className="mt-2 h-3 w-24 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  )
}

function CompletionSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="h-5 w-40 rounded bg-muted animate-pulse" />
      <div className="mt-4 flex items-end gap-4">
        <div className="h-12 w-24 rounded bg-muted animate-pulse" />
        <div className="h-4 w-40 rounded bg-muted animate-pulse" />
      </div>
      <div className="mt-6 h-2 w-full rounded-full bg-muted animate-pulse" />
    </div>
  )
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="h-5 w-32 rounded bg-muted animate-pulse mb-4" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            <div className="ml-auto h-4 w-12 rounded bg-muted animate-pulse" />
            <div className="h-4 w-12 rounded bg-muted animate-pulse" />
            <div className="h-4 w-12 rounded bg-muted animate-pulse" />
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

function UpcomingSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="h-5 w-44 rounded bg-muted animate-pulse" />
      <div className="mt-1 h-3 w-56 rounded bg-muted animate-pulse" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-3">
            <div className="h-4 w-48 rounded bg-muted animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="h-3 w-16 rounded bg-muted animate-pulse" />
              <div className="h-5 w-24 rounded-full bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ProgressPage() {
  const [tasks, setTasks] = React.useState<DBTask[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [timeframe, setTimeframe] = React.useState<Timeframe>("week")

  const refetch = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createBrowserSupabase()
      const data = await fetchAllTasks(supabase, getGuildId())
      setTasks(data)
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void refetch()
  }, [refetch])

  const today = React.useMemo(() => startOfDay(new Date()), [])

  const filteredTasks = React.useMemo(() => {
    if (timeframe === "all") return tasks
    const cutoff = new Date(today)
    cutoff.setDate(cutoff.getDate() - 7)
    const cutoffMs = cutoff.getTime()
    return tasks.filter((t) => {
      const created = new Date(t.created_at).getTime()
      return Number.isFinite(created) && created >= cutoffMs
    })
  }, [tasks, timeframe, today])

  const overview = React.useMemo(
    () => computeOverview(filteredTasks, today),
    [filteredTasks, today]
  )

  const personRows = React.useMemo(
    () => buildPersonRows(filteredTasks, today),
    [filteredTasks, today]
  )

  const upcoming = React.useMemo(() => buildUpcoming(tasks), [tasks])

  const completionPercent =
    overview.total === 0
      ? 0
      : Math.round((overview.completed / overview.total) * 100)

  const completionHint =
    overview.total === 0
      ? "No tasks in timeframe"
      : `${overview.completed} of ${overview.total} tasks done`

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-6 px-6 md:-mx-10 md:px-10 py-4 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Progress</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Throughput, completion, and what is coming due
            </p>
          </div>
          <TimeframeToggle value={timeframe} onChange={setTimeframe} />
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
          <p className="text-sm">{"❌"} Failed to load progress.</p>
          <p className="mt-1 text-xs text-muted-foreground break-all">
            {error}
          </p>
          <div className="mt-4">
            <Button variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </div>
      ) : loading ? (
        <>
          <OverviewSkeleton />
          <CompletionSkeleton />
          <TableSkeleton />
          <UpcomingSkeleton />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Assigned"
              value={overview.total}
              hint={
                timeframe === "week" ? "Created in last 7 days" : "All recorded"
              }
            />
            <StatCard
              label="Completed"
              value={overview.completed}
              hint={
                overview.total === 0
                  ? "No tasks yet"
                  : `${completionPercent}% completion rate`
              }
            />
            <StatCard
              label="Pending"
              value={overview.pending}
              hint="Todo and in progress"
            />
            <StatCard
              label="Overdue"
              value={overview.overdue}
              hint={
                overview.overdue === 0
                  ? "Nothing overdue"
                  : "Past due, not done"
              }
              accent={overview.overdue > 0}
            />
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Completion Rate</h2>
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <p className="text-5xl font-bold num text-foreground leading-none">
                {completionPercent}%
              </p>
              <p className="text-muted-foreground text-sm pb-1">
                {completionHint}
              </p>
            </div>
            <div className="mt-6 h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">By person</h2>
            {personRows.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No activity in this timeframe.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-border">
                      <th
                        scope="col"
                        className="p-4 font-medium text-muted-foreground"
                      >
                        Discord ID
                      </th>
                      <th
                        scope="col"
                        className="p-4 font-medium text-muted-foreground text-right"
                      >
                        Completed
                      </th>
                      <th
                        scope="col"
                        className="p-4 font-medium text-muted-foreground text-right"
                      >
                        Pending
                      </th>
                      <th
                        scope="col"
                        className="p-4 font-medium text-muted-foreground text-right"
                      >
                        Overdue
                      </th>
                      <th
                        scope="col"
                        className="p-4 font-medium text-muted-foreground"
                      >
                        Oldest Overdue Task
                      </th>
                    </tr>
                  </thead>
                  <motion.tbody
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {personRows.map((row) => {
                      const oldest = row.oldestOverdue
                      return (
                        <motion.tr
                          key={row.assignee_id}
                          variants={rowVariants}
                          className="border-b border-border last:border-none hover:bg-muted/50"
                        >
                          <td
                            className="p-4 font-medium num"
                            title={row.assignee_id}
                          >
                            {shortenId(row.assignee_id)}
                          </td>
                          <td className="p-4 text-right num">
                            {row.completed}
                          </td>
                          <td className="p-4 text-right num">{row.pending}</td>
                          <td
                            className={cn(
                              "p-4 text-right num",
                              row.overdue > 0
                                ? "text-red-400"
                                : "text-muted-foreground"
                            )}
                          >
                            {row.overdue}
                          </td>
                          <td className="p-4">
                            {oldest ? (
                              <div className="flex flex-col">
                                <span className="font-medium text-foreground">
                                  {oldest.task_name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDueDate(oldest.due_date)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                None
                              </span>
                            )}
                          </td>
                        </motion.tr>
                      )
                    })}
                  </motion.tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Upcoming deadlines</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Next 5 due, excluding completed
            </p>
            <div className="mt-4">
              {upcoming.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-6">
                  No upcoming deadlines.
                </p>
              ) : (
                <ul>
                  {upcoming.map((task) => {
                    const state = getDueState(task.due_date)
                    return (
                      <li
                        key={task.id}
                        className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-none"
                      >
                        <p className="font-medium text-foreground">
                          {task.task_name}
                        </p>
                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className="text-muted-foreground text-xs num"
                            title={task.assignee_id}
                          >
                            {shortenId(task.assignee_id)}
                          </span>
                          <Badge className={dueBadgeClass(state)}>
                            {formatDueDate(task.due_date)}
                          </Badge>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

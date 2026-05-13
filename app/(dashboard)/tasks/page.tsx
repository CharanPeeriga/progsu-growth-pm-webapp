"use client"

import * as React from "react"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ClipboardList, Pencil, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusFilterTabs, type StatusFilter } from "@/components/StatusFilterTabs"
import { AssignTaskSheet } from "@/components/AssignTaskSheet"
import { EditTaskSheet } from "@/components/EditTaskSheet"
import { DeleteTaskDialog } from "@/components/DeleteTaskDialog"

import { createBrowserSupabase, getGuildId } from "@/lib/supabase"
import { fetchAllTasks } from "@/lib/queries"
import type { DBTask, TaskStatus } from "@/lib/types"
import {
  cn,
  dueTextClass,
  formatDueDate,
  getDueState,
  shortenId,
} from "@/lib/utils"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 14 },
  },
}

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "Pending",
  in_progress: "In Progress",
  done: "Completed",
}

function StatusPill({ status }: { status: TaskStatus }) {
  const base = "px-2.5 py-0.5 text-xs font-semibold rounded-full"
  const styles: Record<TaskStatus, string> = {
    done: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400",
    in_progress:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400",
    todo: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  }
  return <span className={cn(base, styles[status])}>{STATUS_LABEL[status]}</span>
}

function SkeletonRow({ index }: { index: number }) {
  return (
    <tr
      className={cn(
        "border-b border-border last:border-none",
        index % 2 === 0 ? "" : "bg-muted/10"
      )}
    >
      <td className="p-4">
        <div className="h-3 w-6 rounded bg-muted animate-pulse" />
      </td>
      <td className="p-4">
        <div className="h-3 w-48 rounded bg-muted animate-pulse" />
      </td>
      <td className="p-4">
        <div className="h-3 w-20 rounded bg-muted animate-pulse" />
      </td>
      <td className="p-4">
        <div className="h-5 w-20 rounded-full bg-muted animate-pulse" />
      </td>
      <td className="p-4 text-right">
        <div className="ml-auto h-3 w-24 rounded bg-muted animate-pulse" />
      </td>
      <td className="p-4 text-right">
        <div className="ml-auto h-7 w-16 rounded bg-muted animate-pulse" />
      </td>
    </tr>
  )
}

interface TasksPageInnerProps {
  initialSearch: string
}

function TasksPageInner({ initialSearch }: TasksPageInnerProps) {
  const [tasks, setTasks] = React.useState<DBTask[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [search, setSearch] = React.useState(initialSearch)
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all")

  const [assignOpen, setAssignOpen] = React.useState(false)
  const [editTask, setEditTask] = React.useState<DBTask | null>(null)
  const [deleteTask, setDeleteTask] = React.useState<DBTask | null>(null)

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

  const counts = React.useMemo(() => {
    const c: Record<StatusFilter, number> = {
      all: tasks.length,
      todo: 0,
      in_progress: 0,
      done: 0,
    }
    for (const t of tasks) {
      c[t.status] += 1
    }
    return c
  }, [tasks])

  const filteredTasks = React.useMemo(() => {
    const needle = search.trim().toLowerCase()
    return tasks.filter((t) => {
      const statusOk =
        statusFilter === "all" ? true : t.status === statusFilter
      if (!statusOk) return false
      if (!needle) return true
      const name = t.task_name.toLowerCase()
      const assignee = t.assignee_id.toLowerCase()
      return name.includes(needle) || assignee.includes(needle)
    })
  }, [tasks, search, statusFilter])

  const totalCount = tasks.length
  const completedCount = counts.done
  const completionRate =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-6 px-6 md:-mx-10 md:px-10 py-4 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="num font-medium text-foreground">
                {totalCount}
              </span>{" "}
              tasks,{" "}
              <span className="num font-medium text-foreground">
                {completionRate}%
              </span>{" "}
              complete
            </p>
          </div>
          <Button
            onClick={() => setAssignOpen(true)}
            size="default"
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
            Assign Task
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 py-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks or assignee ID"
          className="max-w-md"
        />
        <StatusFilterTabs
          value={statusFilter}
          onChange={setStatusFilter}
          counts={counts}
        />
      </div>

      {error ? (
        <div className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
          <p className="text-sm">{"❌"} Failed to load tasks.</p>
          <p className="mt-1 text-xs text-muted-foreground break-all">
            {error}
          </p>
          <div className="mt-4">
            <Button variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <div className="w-full rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <motion.thead
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <tr className="border-b border-border">
                  <th
                    scope="col"
                    className="p-4 font-medium text-muted-foreground w-12"
                  >
                    No
                  </th>
                  <th
                    scope="col"
                    className="p-4 font-medium text-muted-foreground"
                  >
                    Task
                  </th>
                  <th
                    scope="col"
                    className="p-4 font-medium text-muted-foreground"
                  >
                    Assignee
                  </th>
                  <th
                    scope="col"
                    className="p-4 font-medium text-muted-foreground"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="p-4 font-medium text-muted-foreground text-right"
                  >
                    Due Date
                  </th>
                  <th
                    scope="col"
                    className="p-4 font-medium text-muted-foreground text-right"
                  >
                    Actions
                  </th>
                </tr>
              </motion.thead>
              {loading ? (
                <tbody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonRow key={i} index={i} />
                  ))}
                </tbody>
              ) : filteredTasks.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={6} className="p-12">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <ClipboardList
                          size={40}
                          className="text-muted-foreground"
                        />
                        <p className="text-muted-foreground">
                          No tasks found.
                        </p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              ) : (
                <motion.tbody
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <AnimatePresence>
                    {filteredTasks.map((task, index) => {
                      const dueState = getDueState(task.due_date)
                      return (
                        <motion.tr
                          key={task.id}
                          variants={itemVariants}
                          className="border-b border-border last:border-none hover:bg-muted/40"
                        >
                          <td className="p-4 text-muted-foreground num">
                            {index + 1}
                          </td>
                          <td className="p-4 font-medium">
                            {task.task_name}
                          </td>
                          <td
                            className="p-4 text-muted-foreground num"
                            title={task.assignee_id}
                          >
                            {shortenId(task.assignee_id)}
                          </td>
                          <td className="p-4">
                            <StatusPill status={task.status} />
                          </td>
                          <td
                            className={cn(
                              "p-4 text-right num",
                              dueTextClass(dueState)
                            )}
                          >
                            {formatDueDate(task.due_date)}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Edit task"
                                className="hover:bg-muted/60"
                                onClick={() => setEditTask(task)}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit task</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Delete task"
                                className="hover:bg-muted/60"
                                onClick={() => setDeleteTask(task)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete task</span>
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </motion.tbody>
              )}
            </table>
          </div>
        </div>
      )}

      <AssignTaskSheet
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onAssigned={() => void refetch()}
      />
      <EditTaskSheet
        task={editTask}
        open={editTask !== null}
        onOpenChange={(open) => {
          if (!open) setEditTask(null)
        }}
        onUpdated={() => void refetch()}
      />
      <DeleteTaskDialog
        task={deleteTask}
        open={deleteTask !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTask(null)
        }}
        onDeleted={() => void refetch()}
      />
    </div>
  )
}

function TasksPageWithParams() {
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get("assignee") ?? ""
  return <TasksPageInner initialSearch={initialSearch} />
}

export default function TasksPage() {
  return (
    <Suspense fallback={<TasksPageInner initialSearch="" />}>
      <TasksPageWithParams />
    </Suspense>
  )
}

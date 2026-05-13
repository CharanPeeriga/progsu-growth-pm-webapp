import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { DBTask, Task, TaskStatus, UITaskStatus } from "@/lib/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const STATUS_TO_UI: Record<TaskStatus, UITaskStatus> = {
  todo: "Pending",
  in_progress: "In Progress",
  done: "Completed",
}

const UI_TO_STATUS: Record<UITaskStatus, TaskStatus> = {
  Pending: "todo",
  "In Progress": "in_progress",
  Completed: "done",
}

export function dbStatusToUi(status: TaskStatus): UITaskStatus {
  return STATUS_TO_UI[status]
}

export function uiStatusToDb(status: UITaskStatus): TaskStatus {
  return UI_TO_STATUS[status]
}

export function formatDueDate(due: string | null): string {
  if (!due) return "No due date"
  const [year, month, day] = due.split("-").map(Number)
  if (!year || !month || !day) return due
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function dbTaskToTask(db: DBTask): Task {
  return {
    id: db.id,
    task: db.task_name,
    category: db.assignee_id,
    status: dbStatusToUi(db.status),
    dueDate: formatDueDate(db.due_date),
  }
}

export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export type DueState = "overdue" | "soon" | "normal" | "none"

export function getDueState(due: string | null): DueState {
  if (!due) return "none"
  const [year, month, day] = due.split("-").map(Number)
  if (!year || !month || !day) return "none"
  const dueDate = startOfDay(new Date(year, month - 1, day))
  const today = startOfDay(new Date())
  const diffMs = dueDate.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return "overdue"
  if (diffDays <= 2) return "soon"
  return "normal"
}

export function dueTextClass(state: DueState): string {
  switch (state) {
    case "overdue":
      return "text-red-400"
    case "soon":
      return "text-yellow-400"
    default:
      return "text-muted-foreground"
  }
}

export function dueBadgeClass(state: DueState): string {
  switch (state) {
    case "overdue":
      return "bg-red-500/15 text-red-400 ring-1 ring-inset ring-red-500/30"
    case "soon":
      return "bg-yellow-500/15 text-yellow-400 ring-1 ring-inset ring-yellow-500/30"
    default:
      return "bg-muted text-muted-foreground ring-1 ring-inset ring-border"
  }
}

export function shortenId(id: string): string {
  if (id.length <= 8) return id
  return `${id.slice(0, 4)}…${id.slice(-4)}`
}

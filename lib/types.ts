export type TaskStatus = "todo" | "in_progress" | "done"

export type UITaskStatus = "Completed" | "In Progress" | "Pending"

export interface DBTask {
  id: number
  guild_id: string
  assignee_id: string
  assigner_id: string
  task_name: string
  due_date: string | null
  status: TaskStatus
  created_at: string
  reminded_2day: boolean
  reminded_day_of: boolean
}

export interface NewTask {
  assignee_id: string
  task_name: string
  due_date: string | null
  status: TaskStatus
}

export interface Task {
  id: number | string
  task: string
  category: string
  status: UITaskStatus
  dueDate: string
}

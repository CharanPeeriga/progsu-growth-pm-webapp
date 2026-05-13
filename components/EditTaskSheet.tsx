"use client"

import * as React from "react"
import { createBrowserSupabase } from "@/lib/supabase"
import { updateTask } from "@/lib/queries"
import type { DBTask, TaskStatus } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/sonner"

interface EditTaskSheetProps {
  task: DBTask | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: () => void
}

export function EditTaskSheet({
  task,
  open,
  onOpenChange,
  onUpdated,
}: EditTaskSheetProps) {
  const [taskName, setTaskName] = React.useState("")
  const [dueDate, setDueDate] = React.useState<string>("")
  const [status, setStatus] = React.useState<TaskStatus>("todo")
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (open && task) {
      setTaskName(task.task_name)
      setDueDate(task.due_date ?? "")
      setStatus(task.status)
      setSubmitting(false)
    }
  }, [open, task])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!task) return
    const trimmedName = taskName.trim()
    if (!trimmedName) {
      toast("❌ Task name is required.")
      return
    }
    setSubmitting(true)
    try {
      const supabase = createBrowserSupabase()
      await updateTask(supabase, task.id, {
        task_name: trimmedName,
        due_date: dueDate ? dueDate : null,
        status,
      })
      toast("✅ Task updated")
      onOpenChange(false)
      onUpdated()
    } catch {
      toast("❌ Failed to update task")
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle>Edit task {task ? `#${task.id}` : ""}</SheetTitle>
          <SheetDescription>
            Update fields below. Assignee cannot be changed; delete and
            recreate to reassign.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-5 px-6 py-6 overflow-y-auto"
        >
          <div className="space-y-1.5">
            <Label htmlFor="edit-task-name">Task name</Label>
            <Input
              id="edit-task-name"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-due-date">Due date</Label>
            <Input
              id="edit-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setDueDate("")}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Remove Due Date
            </button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-status">Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as TaskStatus)}
            >
              <SelectTrigger id="edit-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">Todo</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {task && (
            <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Assignee:</span>{" "}
              {task.assignee_id}
            </div>
          )}

          <div className="mt-auto pt-4">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

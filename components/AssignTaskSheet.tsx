"use client"

import * as React from "react"
import { createBrowserSupabase, getGuildId } from "@/lib/supabase"
import { insertTask } from "@/lib/queries"
import type { TaskStatus } from "@/lib/types"
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

interface AssignTaskSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssigned: () => void
  defaultAssigneeId?: string
}

export function AssignTaskSheet({
  open,
  onOpenChange,
  onAssigned,
  defaultAssigneeId,
}: AssignTaskSheetProps) {
  const [assigneeId, setAssigneeId] = React.useState(defaultAssigneeId ?? "")
  const [taskName, setTaskName] = React.useState("")
  const [dueDate, setDueDate] = React.useState("")
  const [status, setStatus] = React.useState<TaskStatus>("todo")
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setAssigneeId(defaultAssigneeId ?? "")
      setTaskName("")
      setDueDate("")
      setStatus("todo")
      setSubmitting(false)
    }
  }, [open, defaultAssigneeId])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmedAssignee = assigneeId.trim()
    const trimmedName = taskName.trim()
    if (!trimmedAssignee || !trimmedName) {
      toast("❌ Assignee ID and task name are required.")
      return
    }
    setSubmitting(true)
    try {
      const supabase = createBrowserSupabase()
      await insertTask(supabase, {
        guild_id: getGuildId(),
        assignee_id: trimmedAssignee,
        task_name: trimmedName,
        due_date: dueDate ? dueDate : null,
        status,
      })
      toast("✅ Task assigned")
      onOpenChange(false)
      onAssigned()
    } catch {
      toast("❌ Failed to assign task")
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle>Assign new task</SheetTitle>
          <SheetDescription>
            Create a task and assign it to a Discord member.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-5 px-6 py-6 overflow-y-auto"
        >
          <div className="space-y-1.5">
            <Label htmlFor="assignee">Assignee Discord ID</Label>
            <Input
              id="assignee"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              placeholder="Right-click member, Copy ID"
              inputMode="numeric"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-name">Task name</Label>
            <Input
              id="task-name"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Ship the onboarding flow"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="due-date">Due date</Label>
            <Input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank for no due date.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as TaskStatus)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">Todo</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-auto pt-4">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? "Assigning..." : "Assign Task"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

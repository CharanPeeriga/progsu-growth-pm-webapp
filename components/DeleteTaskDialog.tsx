"use client"

import * as React from "react"
import { createBrowserSupabase } from "@/lib/supabase"
import { deleteTask } from "@/lib/queries"
import type { DBTask } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/sonner"

interface DeleteTaskDialogProps {
  task: DBTask | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export function DeleteTaskDialog({
  task,
  open,
  onOpenChange,
  onDeleted,
}: DeleteTaskDialogProps) {
  const [submitting, setSubmitting] = React.useState(false)

  async function handleConfirm() {
    if (!task) return
    setSubmitting(true)
    try {
      const supabase = createBrowserSupabase()
      await deleteTask(supabase, task.id)
      toast("🗑️ Task deleted")
      onOpenChange(false)
      onDeleted()
    } catch {
      toast("❌ Failed to delete task")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete task {task ? `#${task.id}` : ""}?</DialogTitle>
          <DialogDescription>
            This permanently removes the task from the database. The action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {task && (
          <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
            <p className="font-medium text-foreground">{task.task_name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Assigned to {task.assignee_id}
            </p>
          </div>
        )}
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? "Deleting..." : "Delete task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

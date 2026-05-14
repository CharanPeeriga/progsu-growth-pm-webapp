"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { fetchAllTasks, insertTask, updateTask, deleteTask, fetchTeamMembers } from "@/lib/supabase";
import type { DBTask, NewTask, TaskStatus, TeamMember } from "@/lib/types";
import { TaskList, type Task } from "@/components/ui/task-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const GUILD_ID = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID ?? "";

type FilterStatus = "all" | TaskStatus;

const filterLabels: Record<FilterStatus, string> = {
  all: "All",
  todo: "Todo",
  in_progress: "In Progress",
  review: "In Review",
  done: "Done",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "No due date";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function dbTaskToTask(t: DBTask, memberMap: Map<string, string>): Task {
  const statusMap: Record<TaskStatus, Task["status"]> = {
    todo: "Pending",
    in_progress: "In Progress",
    review: "In Review",
    done: "Done",
  };
  return {
    id: t.id,
    task: t.task_name,
    assignee: memberMap.get(t.assignee_id) ?? t.assignee_id,
    assigner: t.assigner_id,
    status: statusMap[t.status],
    dueDate: formatDate(t.due_date),
    rejectionReason: t.rejection_reason,
  };
}

function getDueDateClass(t: DBTask): string {
  if (!t.due_date || t.status === "done") return "text-muted-foreground text-sm";
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(t.due_date + "T00:00:00");
  const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "text-red-400 font-medium text-sm";
  if (diffDays <= 2) return "text-yellow-400 font-medium text-sm";
  return "text-muted-foreground text-sm";
}

function isOverdue(t: DBTask): boolean {
  if (!t.due_date || t.status === "done") return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return new Date(t.due_date + "T00:00:00") < now;
}

const defaultNewTask: NewTask = {
  assignee_id: "",
  task_name: "",
  due_date: null,
  status: "todo",
};

function TasksPageContent() {
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<DBTask[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [filter, setFilter] = useState<FilterStatus>("all");

  const [assignSheetOpen, setAssignSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const [newTask, setNewTask] = useState<NewTask>(defaultNewTask);
  const [editingTask, setEditingTask] = useState<DBTask | null>(null);
  const [deletingTask, setDeletingTask] = useState<DBTask | null>(null);
  const [rejectingTask, setRejectingTask] = useState<Task | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [tasksData, membersData] = await Promise.all([
        fetchAllTasks(GUILD_ID),
        fetchTeamMembers(GUILD_ID),
      ]);
      setTasks(tasksData);
      setTeamMembers(membersData);
    } catch (err) {
      console.error("Failed to load tasks/members:", err);
      toast.error("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = tasks;
    if (filter !== "all") list = list.filter((t) => t.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.task_name.toLowerCase().includes(q) ||
          t.assignee_id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tasks, filter, search]);

  const memberMap = useMemo(
    () => new Map(teamMembers.map((m) => [m.user_id, m.display_name ?? m.user_id])),
    [teamMembers]
  );

  const memberIdSet = useMemo(
    () => new Set(teamMembers.map((m) => m.user_id)),
    [teamMembers]
  );

  const displayTasks = useMemo(
    () => filtered.map((t) => dbTaskToTask(t, memberMap)),
    [filtered, memberMap]
  );

  // Review banner count — always from full task list
  const reviewCount = useMemo(
    () => tasks.filter((t) => t.status === "review").length,
    [tasks]
  );

  // Analytics from filtered view
  const filteredDone = useMemo(
    () => filtered.filter((t) => t.status === "done").length,
    [filtered]
  );
  const filteredRate =
    filtered.length > 0 ? Math.round((filteredDone / filtered.length) * 100) : 0;
  const filteredReview = useMemo(
    () => filtered.filter((t) => t.status === "review").length,
    [filtered]
  );
  const filteredOverdue = useMemo(() => filtered.filter(isOverdue).length, [filtered]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await insertTask({ ...newTask, guild_id: GUILD_ID });
      toast.success("✅ Task assigned");
      setAssignSheetOpen(false);
      setNewTask(defaultNewTask);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("Assign task failed:", JSON.stringify(err, null, 2));
      toast.error(`❌ Failed to assign task: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    setSubmitting(true);
    try {
      await updateTask(editingTask.id, {
        assignee_id: editingTask.assignee_id,
        task_name: editingTask.task_name,
        due_date: editingTask.due_date,
        status: editingTask.status,
      });
      toast.success("✅ Task updated");
      setEditSheetOpen(false);
      setEditingTask(null);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("Edit task failed:", JSON.stringify(err, null, 2));
      toast.error(`❌ Failed to update task: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTask) return;
    setSubmitting(true);
    try {
      await deleteTask(deletingTask.id);
      toast.success("🗑️ Task deleted");
      setDeleteDialogOpen(false);
      setDeletingTask(null);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("Delete task failed:", JSON.stringify(err, null, 2));
      toast.error(`❌ Failed to delete task: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingTask) return;
    setSubmitting(true);
    try {
      await updateTask(rejectingTask.id, {
        status: "in_progress",
        rejection_reason: rejectionReason || null,
      });
      toast.success("↩️ Task sent back");
      setRejectDialogOpen(false);
      setRejectingTask(null);
      setRejectionReason("");
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`❌ Failed to send back: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const onEditTask = useCallback(
    (task: Task) => {
      const dbTask = tasks.find((t) => t.id === task.id);
      if (dbTask) {
        setEditingTask({ ...dbTask });
        setEditSheetOpen(true);
      }
    },
    [tasks]
  );

  const onDeleteTask = useCallback(
    (task: Task) => {
      const dbTask = tasks.find((t) => t.id === task.id);
      if (dbTask) {
        setDeletingTask(dbTask);
        setDeleteDialogOpen(true);
      }
    },
    [tasks]
  );

  const onApproveTask = useCallback(
    async (task: Task) => {
      try {
        await updateTask(task.id, { status: "done", rejection_reason: null });
        toast.success("✅ Task approved");
        await load();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to approve: ${msg}`);
      }
    },
    [load]
  );

  const onRejectTask = useCallback((task: Task) => {
    setRejectingTask(task);
    setRejectionReason("");
    setRejectDialogOpen(true);
  }, []);

  const renderAssignee = useCallback(
    (task: Task) => {
      const dbTask = tasks.find((t) => t.id === task.id);
      const isResolved = dbTask ? memberIdSet.has(dbTask.assignee_id) : false;
      return (
        <span
          className={cn(
            "block max-w-[140px] truncate text-xs",
            isResolved
              ? "text-foreground"
              : "text-muted-foreground font-mono"
          )}
        >
          {task.assignee}
        </span>
      );
    },
    [tasks, memberIdSet]
  );

  const renderDueDate = useCallback(
    (task: Task) => {
      const dbTask = tasks.find((t) => t.id === task.id);
      return (
        <span
          className={
            dbTask ? getDueDateClass(dbTask) : "text-muted-foreground text-sm"
          }
        >
          {task.dueDate}
        </span>
      );
    },
    [tasks]
  );

  return (
    <div className="space-y-6 page-fade-in">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Tasks</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""} total
        </p>
      </div>

      {/* Review banner */}
      {reviewCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-5 py-3 rounded-xl bg-indigo-950/60 border border-indigo-700/50"
        >
          <span className="text-sm text-indigo-300 font-medium">
            ⏳ {reviewCount} task{reviewCount !== 1 ? "s" : ""} awaiting your review
          </span>
          <Button
            size="sm"
            className="h-7 px-3 text-xs bg-indigo-700 hover:bg-indigo-600 text-white border-0"
            onClick={() => setFilter("review")}
          >
            View
          </Button>
        </motion.div>
      )}

      {/* Analytics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Tasks", value: filtered.length },
          { label: "Completion Rate", value: `${filteredRate}%` },
          { label: "In Review", value: filteredReview },
          {
            label: "Overdue",
            value: filteredOverdue,
            danger: filteredOverdue > 0,
          },
        ].map(({ label, value, danger }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-xl p-4 shadow-sm"
          >
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p
              className={cn(
                "text-2xl font-bold mt-1",
                danger ? "text-red-400" : "text-foreground"
              )}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative max-w-xs w-full">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            className="pl-9"
            placeholder="Search tasks or assignee…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 flex-wrap">
          {(Object.keys(filterLabels) as FilterStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>

        <Button
          className="ml-auto h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-medium gap-2 px-4"
          onClick={() => setAssignSheetOpen(true)}
        >
          <Plus size={15} />
          Assign Task
        </Button>
      </div>

      {/* Task table */}
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-24 text-muted-foreground text-sm"
        >
          Loading tasks…
        </motion.div>
      ) : (
        <TaskList
          tasks={displayTasks}
          onEdit={onEditTask}
          onDelete={onDeleteTask}
          onApprove={onApproveTask}
          onReject={onRejectTask}
          renderDueDate={renderDueDate}
          renderAssignee={renderAssignee}
          emptyTitle="No tasks found."
          emptySubtitle="Assign a task to get started"
        />
      )}

      {/* Assign Task Sheet */}
      <Sheet open={assignSheetOpen} onOpenChange={setAssignSheetOpen}>
        <SheetContent className="bg-card border-border p-0 gap-0 overflow-y-auto">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle className="text-xl font-semibold">Assign Task</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleAssign} className="px-6 py-6 space-y-6">
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Assignee</Label>
              {teamMembers.length > 0 ? (
                <Select
                  value={newTask.assignee_id}
                  onValueChange={(v) => setNewTask((p) => ({ ...p, assignee_id: v ?? "" }))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.display_name || m.user_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Right-click member → Copy ID"
                  value={newTask.assignee_id}
                  onChange={(e) =>
                    setNewTask((p) => ({ ...p, assignee_id: e.target.value }))
                  }
                  required
                />
              )}
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Task Name</Label>
              <Input
                placeholder="Describe the task…"
                value={newTask.task_name}
                onChange={(e) =>
                  setNewTask((p) => ({ ...p, task_name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Due Date</Label>
              <Input
                type="date"
                value={newTask.due_date ?? ""}
                onChange={(e) =>
                  setNewTask((p) => ({ ...p, due_date: e.target.value || null }))
                }
                className="[color-scheme:dark]"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Status</Label>
              <Select
                value={newTask.status}
                onValueChange={(v) =>
                  setNewTask((p) => ({ ...p, status: v as TaskStatus }))
                }
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Todo</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">In Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-medium mt-8"
              disabled={submitting}
            >
              {submitting ? "Assigning…" : "Assign Task"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Edit Task Sheet */}
      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent className="bg-card border-border p-0 gap-0 overflow-y-auto">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle className="text-xl font-semibold">Edit Task</SheetTitle>
          </SheetHeader>
          {editingTask && (
            <form onSubmit={handleEdit} className="px-6 py-6 space-y-6">
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Assignee</Label>
                {teamMembers.length > 0 ? (
                  <Select
                    value={editingTask.assignee_id}
                    onValueChange={(v) =>
                      setEditingTask((p) => p && { ...p, assignee_id: v ?? p.assignee_id })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* If current assignee isn't in team list, show them as an option */}
                      {!memberIdSet.has(editingTask.assignee_id) && (
                        <SelectItem
                          value={editingTask.assignee_id}
                          className="text-muted-foreground"
                        >
                          {editingTask.assignee_id} (not on team)
                        </SelectItem>
                      )}
                      {teamMembers.map((m) => (
                        <SelectItem key={m.user_id} value={m.user_id}>
                          {m.display_name || m.user_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={editingTask.assignee_id}
                    onChange={(e) =>
                      setEditingTask((p) => p && { ...p, assignee_id: e.target.value })
                    }
                    required
                  />
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Task Name</Label>
                <Input
                  value={editingTask.task_name}
                  onChange={(e) =>
                    setEditingTask((p) => p && { ...p, task_name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Due Date</Label>
                <Input
                  type="date"
                  value={editingTask.due_date ?? ""}
                  onChange={(e) =>
                    setEditingTask(
                      (p) => p && { ...p, due_date: e.target.value || null }
                    )
                  }
                  className="[color-scheme:dark]"
                />
                {editingTask.due_date && (
                  <button
                    type="button"
                    className="mt-2 text-xs text-destructive hover:underline"
                    onClick={() =>
                      setEditingTask((p) => p && { ...p, due_date: null })
                    }
                  >
                    Remove Due Date
                  </button>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Status</Label>
                <Select
                  value={editingTask.status}
                  onValueChange={(v) =>
                    setEditingTask(
                      (p) => p && { ...p, status: v as TaskStatus }
                    )
                  }
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">Todo</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">In Review</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-medium mt-8"
                disabled={submitting}
              >
                {submitting ? "Saving…" : "Save Changes"}
              </Button>
            </form>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Delete task #{deletingTask?.id}?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-1">
            &ldquo;{deletingTask?.task_name}&rdquo; will be permanently removed.
          </p>
          <DialogFooter className="gap-2 sm:gap-2 -mx-0 -mb-0 border-0 bg-transparent p-0 pt-2">
            <Button
              variant="outline"
              className="h-9"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="h-9 bg-destructive/90 text-white hover:bg-destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Send back task #{rejectingTask?.id}?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-1 mb-4">
            &ldquo;{rejectingTask?.task}&rdquo; will be moved back to In Progress.
          </p>
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">
              Rejection Reason
            </Label>
            <Input
              placeholder="What needs to be fixed?"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2 -mx-0 -mb-0 border-0 bg-transparent p-0 pt-2">
            <Button
              variant="outline"
              className="h-9"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="h-9 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleReject}
              disabled={submitting}
            >
              {submitting ? "Sending…" : "↩️ Send Back"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense>
      <TasksPageContent />
    </Suspense>
  );
}

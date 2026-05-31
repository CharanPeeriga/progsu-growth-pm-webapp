"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import {
  fetchAllTasks,
  insertTask,
  updateTask,
  deleteTask,
  fetchTeamMembers,
  fetchAllCollaborators,
} from "@/lib/supabase";
import type { DBTask, NewTask, TaskStatus, TeamMember, TeamName, TaskCollaborator } from "@/lib/types";
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
import AnimatedDropdown from "@/components/ui/animated-dropdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { TeamBadge, teamTabClass } from "@/components/ui/team-badge";

const GUILD_ID = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID ?? "";

type FilterStatus = "all" | TaskStatus;

const filterLabels: Record<FilterStatus, string> = {
  all: "All",
  todo: "Todo",
  in_progress: "In Progress",
  review: "In Review",
  done: "Done",
};

const TEAM_FILTERS = [
  { value: "all" as const, label: "All Teams" },
  { value: "growth" as const, label: "Growth" },
  { value: "tech" as const, label: "Tech" },
  { value: "operations" as const, label: "Operations" },
  { value: "progirls" as const, label: "Progirls" },
];

const TEAM_OPTIONS = [
  { value: "growth", label: "Growth" },
  { value: "tech", label: "Tech" },
  { value: "operations", label: "Operations" },
  { value: "progirls", label: "Progirls" },
];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "No due date";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

type NewTaskWithTeam = NewTask & { team: TeamName; collaborator_ids: string[] };

const defaultNewTask: NewTaskWithTeam = {
  assignee_id: "",
  task_name: "",
  due_date: null,
  status: "todo",
  team: "growth",
  collaborator_ids: [],
};

function TasksPageContent() {
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<DBTask[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [collaborators, setCollaborators] = useState<TaskCollaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [teamFilter, setTeamFilter] = useState<"all" | TeamName>("all");

  const [assignSheetOpen, setAssignSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const [newTask, setNewTask] = useState<NewTaskWithTeam>(defaultNewTask);
  const [editingTask, setEditingTask] = useState<DBTask | null>(null);
  const [deletingTask, setDeletingTask] = useState<DBTask | null>(null);
  const [rejectingTask, setRejectingTask] = useState<Task | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Collaborator picker state for Assign panel
  const [collabPickerValue, setCollabPickerValue] = useState("");

  const load = useCallback(async () => {
    try {
      const [tasksData, membersData, collabData] = await Promise.all([
        fetchAllTasks(),
        fetchTeamMembers(GUILD_ID),
        fetchAllCollaborators(),
      ]);
      setTasks(tasksData);
      setTeamMembers(membersData);
      setCollaborators(collabData);
    } catch (err) {
      console.error("Failed to load tasks/members:", err);
      toast.error("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoadingMembers(false));
  }, [load]);

  // Map task_id → collaborator list
  const collabByTask = useMemo(() => {
    const map = new Map<number, TaskCollaborator[]>();
    for (const c of collaborators) {
      const list = map.get(c.task_id) ?? [];
      list.push(c);
      map.set(c.task_id, list);
    }
    return map;
  }, [collaborators]);

  const filtered = useMemo(() => {
    let list = tasks;
    if (teamFilter !== "all") list = list.filter((t) => t.team === teamFilter);
    if (filter !== "all") list = list.filter((t) => t.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) => t.task_name.toLowerCase().includes(q) || t.assignee_id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tasks, teamFilter, filter, search]);

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

  const reviewByTeam = useMemo(() => {
    return tasks
      .filter((t) => t.status === "review")
      .reduce((acc, t) => {
        acc[t.team] = (acc[t.team] ?? 0) + 1;
        return acc;
      }, {} as Partial<Record<TeamName, number>>);
  }, [tasks]);

  const reviewCount = useMemo(
    () => Object.values(reviewByTeam).reduce((s, n) => s + (n ?? 0), 0),
    [reviewByTeam]
  );

  const filteredDone = useMemo(() => filtered.filter((t) => t.status === "done").length, [filtered]);
  const filteredRate = filtered.length > 0 ? Math.round((filteredDone / filtered.length) * 100) : 0;
  const filteredReview = useMemo(() => filtered.filter((t) => t.status === "review").length, [filtered]);
  const filteredOverdue = useMemo(() => filtered.filter(isOverdue).length, [filtered]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.assignee_id) { toast.error("Please select an assignee"); return; }
    if (!newTask.task_name.trim()) { toast.error("Please enter a task name"); return; }
    setSubmitting(true);
    try {
      const { task: inserted, notification } = await insertTask({ ...newTask, guild_id: GUILD_ID });
      toast.success("✅ Task assigned");

      // Notification warnings
      if (notification && typeof notification === "object") {
        const n = notification as Record<string, unknown>;
        const assigneeName = memberMap.get(inserted.assignee_id) ?? inserted.assignee_id;
        if (n.method === "dm") {
          toast.warning(
            `⚠️ No reminder channel set for ${assigneeName}. They were notified via DM but may not receive it if DMs are disabled. Use /setchannel in Discord to set a channel for them.`,
            { duration: 8000 }
          );
        } else if (n.notified === false) {
          toast.error(
            `❌ Could not notify ${assigneeName}. No reminder channel is set and their DMs are disabled. Use /setchannel in Discord to ensure they receive future assignments.`,
            { duration: 10000 }
          );
        }
      }

      setAssignSheetOpen(false);
      setNewTask(defaultNewTask);
      setCollabPickerValue("");
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
        team: editingTask.team,
      });
      toast.success("✅ Task updated");
      setEditSheetOpen(false);
      setEditingTask(null);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
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
      toast.error(`❌ Failed to delete task: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingTask) return;
    setSubmitting(true);
    try {
      await updateTask(rejectingTask.id, { status: "in_progress", rejection_reason: rejectionReason || null });
      toast.success("↩️ Task sent back");
      setRejectDialogOpen(false);
      setRejectingTask(null);
      setRejectionReason("");
      await load();
    } catch (err) {
      toast.error(`❌ Failed to send back: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const onEditTask = useCallback(
    (task: Task) => {
      const dbTask = tasks.find((t) => t.id === task.id);
      if (dbTask) { setEditingTask({ ...dbTask }); setEditSheetOpen(true); }
    },
    [tasks]
  );

  const onDeleteTask = useCallback(
    (task: Task) => {
      const dbTask = tasks.find((t) => t.id === task.id);
      if (dbTask) { setDeletingTask(dbTask); setDeleteDialogOpen(true); }
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
        toast.error(`Failed to approve: ${err instanceof Error ? err.message : "Unknown error"}`);
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
        <span className={cn("block max-w-[140px] truncate text-xs", isResolved ? "text-foreground" : "text-muted-foreground font-mono")}>
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
        <span className={dbTask ? getDueDateClass(dbTask) : "text-muted-foreground text-sm"}>
          {task.dueDate}
        </span>
      );
    },
    [tasks]
  );

  const renderTeam = useCallback(
    (task: Task) => {
      const dbTask = tasks.find((t) => t.id === task.id);
      return dbTask?.team ? <TeamBadge team={dbTask.team} /> : <span className="text-muted-foreground">—</span>;
    },
    [tasks]
  );

  const renderCollaborators = useCallback(
    (task: Task) => {
      const collabs = collabByTask.get(task.id);
      if (!collabs || collabs.length === 0) return <span className="text-muted-foreground text-xs">—</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {collabs.map((c) => (
            <span
              key={c.user_id}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border",
                c.submitted
                  ? "bg-green-950/60 text-green-400 border-green-900/40"
                  : "bg-muted text-muted-foreground border-border"
              )}
            >
              {memberMap.get(c.user_id) ?? c.user_id}
              {c.submitted ? " ✅" : " ⏳"}
            </span>
          ))}
        </div>
      );
    },
    [collabByTask, memberMap]
  );

  // Collaborator options = members not already selected and not the assignee
  const availableCollabOptions = useMemo(() => {
    const selected = new Set(newTask.collaborator_ids);
    return teamMembers
      .filter((m) => !selected.has(m.user_id) && m.user_id !== newTask.assignee_id)
      .map((m) => ({ label: m.display_name || m.user_id, value: m.user_id }));
  }, [teamMembers, newTask.collaborator_ids, newTask.assignee_id]);

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
            ⚠️ Tasks awaiting review:{" "}
            {(["growth", "tech", "operations", "progirls"] as TeamName[])
              .filter((team) => (reviewByTeam[team] ?? 0) > 0)
              .map((team) => `${team.charAt(0).toUpperCase() + team.slice(1)}: ${reviewByTeam[team]}`)
              .join(" · ")}
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
          { label: "Overdue", value: filteredOverdue, danger: filteredOverdue > 0 },
        ].map(({ label, value, danger }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className={cn("text-2xl font-bold mt-1", danger ? "text-red-400" : "text-foreground")}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Team filter tabs */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
        {TEAM_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTeamFilter(value)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              teamFilter === value && value === "all"
                ? "bg-primary text-primary-foreground"
                : teamFilter === value
                ? teamTabClass(value as TeamName, true)
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative max-w-xs w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
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
          renderTeam={renderTeam}
          renderCollaborators={renderCollaborators}
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
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Team</Label>
              <AnimatedDropdown
                items={TEAM_OPTIONS}
                value={newTask.team}
                onSelect={(v) => setNewTask((p) => ({ ...p, team: v as TeamName }))}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Assignee</Label>
              <AnimatedDropdown
                items={teamMembers.map((m) => ({ label: m.display_name || m.user_id, value: m.user_id }))}
                value={newTask.assignee_id || undefined}
                onSelect={(v) => setNewTask((p) => ({ ...p, assignee_id: v }))}
                placeholder={loadingMembers ? "Loading members…" : "Select team member"}
                loading={loadingMembers && teamMembers.length === 0}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Collaborators</Label>
              <AnimatedDropdown
                items={availableCollabOptions}
                value={collabPickerValue || undefined}
                onSelect={(v) => {
                  setNewTask((p) => ({ ...p, collaborator_ids: [...p.collaborator_ids, v] }));
                  setCollabPickerValue("");
                }}
                placeholder="Add collaborator…"
              />
              {newTask.collaborator_ids.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {newTask.collaborator_ids.map((uid) => (
                    <span
                      key={uid}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-muted border border-border text-foreground"
                    >
                      {memberMap.get(uid) ?? uid}
                      <button
                        type="button"
                        onClick={() => setNewTask((p) => ({ ...p, collaborator_ids: p.collaborator_ids.filter((id) => id !== uid) }))}
                        className="ml-0.5 text-muted-foreground hover:text-foreground"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Task Name</Label>
              <Input
                placeholder="Describe the task…"
                value={newTask.task_name}
                onChange={(e) => setNewTask((p) => ({ ...p, task_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Due Date</Label>
              <Input
                type="date"
                value={newTask.due_date ?? ""}
                onChange={(e) => setNewTask((p) => ({ ...p, due_date: e.target.value || null }))}
                className="[color-scheme:dark]"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Status</Label>
              <Select
                value={newTask.status}
                onValueChange={(v) => setNewTask((p) => ({ ...p, status: v as TaskStatus }))}
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
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Team</Label>
                <AnimatedDropdown
                  items={TEAM_OPTIONS}
                  value={editingTask.team}
                  onSelect={(v) => setEditingTask((p) => p && { ...p, team: v as TeamName })}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Assignee</Label>
                <AnimatedDropdown
                  items={[
                    ...(!memberIdSet.has(editingTask.assignee_id)
                      ? [{ label: `${editingTask.assignee_id} (not on team)`, value: editingTask.assignee_id }]
                      : []),
                    ...teamMembers.map((m) => ({ label: m.display_name || m.user_id, value: m.user_id })),
                  ]}
                  value={editingTask.assignee_id}
                  onSelect={(v) => setEditingTask((p) => p && { ...p, assignee_id: v })}
                  placeholder="Select team member"
                  loading={loadingMembers && teamMembers.length === 0}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Task Name</Label>
                <Input
                  value={editingTask.task_name}
                  onChange={(e) => setEditingTask((p) => p && { ...p, task_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Due Date</Label>
                <Input
                  type="date"
                  value={editingTask.due_date ?? ""}
                  onChange={(e) => setEditingTask((p) => p && { ...p, due_date: e.target.value || null })}
                  className="[color-scheme:dark]"
                />
                {editingTask.due_date && (
                  <button
                    type="button"
                    className="mt-2 text-xs text-destructive hover:underline"
                    onClick={() => setEditingTask((p) => p && { ...p, due_date: null })}
                  >
                    Remove Due Date
                  </button>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Status</Label>
                <Select
                  value={editingTask.status}
                  onValueChange={(v) => setEditingTask((p) => p && { ...p, status: v as TaskStatus })}
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
            <DialogTitle className="text-base font-semibold">Delete task #{deletingTask?.id}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-1">
            &ldquo;{deletingTask?.task_name}&rdquo; will be permanently removed.
          </p>
          <DialogFooter className="gap-2 sm:gap-2 -mx-0 -mb-0 border-0 bg-transparent p-0 pt-2">
            <Button variant="outline" className="h-9" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button className="h-9 bg-destructive/90 text-white hover:bg-destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Send back task #{rejectingTask?.id}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-1 mb-4">
            &ldquo;{rejectingTask?.task}&rdquo; will be moved back to In Progress.
          </p>
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">Rejection Reason</Label>
            <Input
              placeholder="What needs to be fixed?"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2 -mx-0 -mb-0 border-0 bg-transparent p-0 pt-2">
            <Button variant="outline" className="h-9" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
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

"use client";

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Download } from "lucide-react";
import { toast } from "sonner";
import {
  fetchAllTasks,
  insertTask,
  updateTask,
  deleteTask,
  fetchTeamMembers,
  fetchAllCollaborators,
} from "@/lib/supabase";
import type { DBTask, TaskStatus, TeamMember, TeamName, TaskCollaborator } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { ThroughputRail } from "@/components/ui/throughput-rail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TaskAnalyticsBar } from "@/components/tasks/task-analytics-bar";
import { ReviewBanner } from "@/components/tasks/review-banner";
import { TaskFilters, type SortOption } from "@/components/tasks/task-filters";
import { TaskTable } from "@/components/tasks/task-table";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { TEAM_STYLE } from "@/lib/design";

const GUILD_ID = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID ?? "";
const PAGE_SIZE = 25;

function isOverdue(t: DBTask): boolean {
  if (!t.due_date || t.status === "done") return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return new Date(t.due_date + "T00:00:00") < now;
}

function TasksPageContent() {
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<DBTask[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [collaborators, setCollaborators] = useState<TaskCollaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [teamFilter, setTeamFilter] = useState<"all" | TeamName>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [dialogTeam, setDialogTeam] = useState<TeamName | "">("");
  const [dialogStatus, setDialogStatus] = useState<TaskStatus>("todo");
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogDueDate, setDialogDueDate] = useState<string | null>(null);
  const [dialogAssigneeIds, setDialogAssigneeIds] = useState<string[]>([]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTasks, setDeletingTasks] = useState<DBTask[]>([]);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingTask, setRejectingTask] = useState<DBTask | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const lastTeamRef = useRef<TeamName | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    setPage(1);
  }, [teamFilter, statusFilter, assigneeFilter, search, sort]);

  const memberMap = useMemo(
    () => new Map(teamMembers.map((m) => [m.user_id, m.display_name ?? m.user_id])),
    [teamMembers]
  );
  const memberTeamMap = useMemo(
    () => new Map(teamMembers.map((m) => [m.user_id, m.team])),
    [teamMembers]
  );

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
    if (statusFilter !== "all") list = list.filter((t) => t.status === statusFilter);
    if (assigneeFilter) {
      list = list.filter(
        (t) =>
          t.assignee_id === assigneeFilter ||
          (collabByTask.get(t.id) ?? []).some((c) => c.user_id === assigneeFilter)
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => {
        const assigneeName = memberMap.get(t.assignee_id) ?? t.assignee_id;
        const teamLabel = TEAM_STYLE[t.team].label;
        return (
          t.task_name.toLowerCase().includes(q) ||
          assigneeName.toLowerCase().includes(q) ||
          teamLabel.toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [tasks, teamFilter, statusFilter, assigneeFilter, search, collabByTask, memberMap]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sort === "newest") {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sort === "due_soonest") {
      list.sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
    } else if (sort === "assignee") {
      list.sort((a, b) =>
        (memberMap.get(a.assignee_id) ?? a.assignee_id).localeCompare(
          memberMap.get(b.assignee_id) ?? b.assignee_id
        )
      );
    }
    return list;
  }, [filtered, sort, memberMap]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => sorted.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE),
    [sorted, clampedPage]
  );

  const statusCounts = useMemo(() => {
    const counts: Record<TaskStatus, number> = { todo: 0, in_progress: 0, review: 0, done: 0 };
    for (const t of tasks) counts[t.status]++;
    return counts;
  }, [tasks]);

  const teamCounts = useMemo(() => {
    const counts: Partial<Record<TeamName, number>> = {};
    for (const t of tasks) counts[t.team] = (counts[t.team] ?? 0) + 1;
    return counts;
  }, [tasks]);

  const overdueCount = useMemo(() => tasks.filter(isOverdue).length, [tasks]);
  const pendingReviewCount = statusCounts.review;
  const hasActiveFilters =
    teamFilter !== "all" || statusFilter !== "all" || assigneeFilter !== "" || search.trim() !== "";

  const openCreateDialog = useCallback(() => {
    setDialogMode("create");
    setEditingTaskId(null);
    setDialogTeam(lastTeamRef.current ?? "");
    setDialogStatus("todo");
    setDialogTitle("");
    setDialogDueDate(null);
    setDialogAssigneeIds([]);
    setTaskDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((task: DBTask) => {
    setDialogMode("edit");
    setEditingTaskId(task.id);
    setDialogTeam(task.team);
    setDialogStatus(task.status);
    setDialogTitle(task.task_name);
    setDialogDueDate(task.due_date);
    setDialogAssigneeIds([task.assignee_id]);
    setTaskDialogOpen(true);
  }, []);

  const handleDialogTeamChange = useCallback(
    (team: TeamName) => {
      setDialogTeam(team);
      if (dialogMode === "create") {
        lastTeamRef.current = team;
        setDialogAssigneeIds([]);
      }
    },
    [dialogMode]
  );

  const handleDialogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dialogTeam) {
      toast.error("Please select a team");
      return;
    }

    if (dialogMode === "create") {
      if (dialogAssigneeIds.length === 0) {
        toast.error("Please select an assignee");
        return;
      }
      if (!dialogTitle.trim()) {
        toast.error("Please enter a task name");
        return;
      }
      setSubmitting(true);
      try {
        const [assignee_id, ...collaborator_ids] = dialogAssigneeIds;
        const { task: inserted, notification } = await insertTask({
          assignee_id,
          task_name: dialogTitle,
          due_date: dialogDueDate,
          status: dialogStatus,
          team: dialogTeam,
          collaborator_ids,
          guild_id: GUILD_ID,
        });
        toast.success("✅ Task assigned");

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

        setTaskDialogOpen(false);
        await load();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error("Assign task failed:", JSON.stringify(err, null, 2));
        toast.error(`❌ Failed to assign task: ${msg}`);
      } finally {
        setSubmitting(false);
      }
    } else {
      if (!editingTaskId) return;
      setSubmitting(true);
      try {
        await updateTask(editingTaskId, {
          assignee_id: dialogAssigneeIds[0],
          task_name: dialogTitle,
          due_date: dialogDueDate,
          status: dialogStatus,
          team: dialogTeam,
        });
        toast.success("✅ Task updated");
        setTaskDialogOpen(false);
        setEditingTaskId(null);
        await load();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        toast.error(`❌ Failed to update task: ${msg}`);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const requestDelete = useCallback((task: DBTask) => {
    setDeletingTasks([task]);
    setDeleteDialogOpen(true);
  }, []);

  const handleBulkDelete = useCallback(() => {
    const toDelete = tasks.filter((t) => selectedIds.has(t.id));
    setDeletingTasks(toDelete);
    setDeleteDialogOpen(true);
  }, [tasks, selectedIds]);

  const handleConfirmDelete = async () => {
    if (deletingTasks.length === 0) return;
    setSubmitting(true);
    try {
      await Promise.all(deletingTasks.map((t) => deleteTask(t.id)));
      toast.success(deletingTasks.length === 1 ? "🗑️ Task deleted" : `🗑️ ${deletingTasks.length} tasks deleted`);
      setDeleteDialogOpen(false);
      setDeletingTasks([]);
      setSelectedIds(new Set());
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`❌ Failed to delete task: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const onRejectTask = useCallback((task: DBTask) => {
    setRejectingTask(task);
    setRejectionReason("");
    setRejectDialogOpen(true);
  }, []);

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

  const onApproveTask = useCallback(
    async (task: DBTask) => {
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

  const handleReassign = useCallback(
    async (task: DBTask, userId: string) => {
      try {
        await updateTask(task.id, { assignee_id: userId });
        toast.success("✅ Task reassigned");
        await load();
      } catch (err) {
        toast.error(`Failed to reassign: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    },
    [load]
  );

  const handleBulkReassign = useCallback(
    async (userId: string) => {
      const ids = Array.from(selectedIds);
      try {
        await Promise.all(ids.map((id) => updateTask(id, { assignee_id: userId })));
        toast.success(`✅ Reassigned ${ids.length} task${ids.length !== 1 ? "s" : ""}`);
        setSelectedIds(new Set());
        await load();
      } catch {
        toast.error("Failed to reassign some tasks.");
      }
    },
    [selectedIds, load]
  );

  const handleBulkSetStatus = useCallback(
    async (status: TaskStatus) => {
      const ids = Array.from(selectedIds);
      try {
        await Promise.all(ids.map((id) => updateTask(id, { status })));
        toast.success(`✅ Updated ${ids.length} task${ids.length !== 1 ? "s" : ""}`);
        setSelectedIds(new Set());
        await load();
      } catch {
        toast.error("Failed to update some tasks.");
      }
    },
    [selectedIds, load]
  );

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const pageIds = paginated.map((t) => t.id);
      const allSelected = pageIds.length > 0 && pageIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }, [paginated]);

  const handleOpenReview = useCallback(() => {
    setStatusFilter("review");
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleExport = useCallback(() => {
    const header = ["id", "task", "team", "assignee", "status", "due_date"];
    const rows = sorted.map((t) => [
      t.id,
      t.task_name,
      TEAM_STYLE[t.team].label,
      memberMap.get(t.assignee_id) ?? t.assignee_id,
      t.status,
      t.due_date ?? "",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tasks.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [sorted, memberMap]);

  const editingCollaboratorNames = editingTaskId
    ? (collabByTask.get(editingTaskId) ?? [])
        .filter((c) => c.user_id !== dialogAssigneeIds[0])
        .map((c) => memberMap.get(c.user_id) ?? c.user_id)
    : [];

  return (
    <div className="pb-16 space-y-5">
      <PageHeader
        title="Tasks"
        subtitle="Everything in flight across Growth, Tech, Operations, and Progirls."
        count={sorted.length}
        actions={
          <>
            <Button variant="secondary" size="default" onClick={handleExport}>
              <Download className="size-[15px]" />
              Export
            </Button>
            <Button size="default" onClick={openCreateDialog}>
              <Plus className="size-[15px]" />
              New task
            </Button>
          </>
        }
        rail={<ThroughputRail counts={statusCounts} height={4} />}
      />

      <TaskAnalyticsBar counts={statusCounts} teamCounts={teamCounts} overdue={overdueCount} />

      <ReviewBanner count={pendingReviewCount} onOpen={handleOpenReview} />

      <TaskFilters
        search={search}
        onSearchChange={setSearch}
        teamFilter={teamFilter}
        onTeamFilterChange={setTeamFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        assigneeFilter={assigneeFilter}
        onAssigneeFilterChange={setAssigneeFilter}
        teamMembers={teamMembers}
        sort={sort}
        onSortChange={setSort}
      />

      <div ref={tableRef}>
        <TaskTable
          tasks={paginated}
          loading={loading}
          hasAnyTasks={tasks.length > 0}
          hasActiveFilters={hasActiveFilters}
          memberMap={memberMap}
          memberTeamMap={memberTeamMap}
          collabByTask={collabByTask}
          teamMembers={teamMembers}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onEdit={openEditDialog}
          onReassign={handleReassign}
          onDeleteRequest={requestDelete}
          onApprove={onApproveTask}
          onReject={onRejectTask}
          onClearFilters={() => {
            setTeamFilter("all");
            setStatusFilter("all");
            setAssigneeFilter("");
            setSearch("");
          }}
          onCreateTask={openCreateDialog}
          page={clampedPage}
          pageSize={PAGE_SIZE}
          totalCount={sorted.length}
          onPageChange={setPage}
          onBulkDelete={handleBulkDelete}
          onBulkSetStatus={handleBulkSetStatus}
          onBulkReassign={handleBulkReassign}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      </div>

      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        mode={dialogMode}
        submitting={submitting}
        onSubmit={handleDialogSubmit}
        teamMembers={teamMembers}
        memberMap={memberMap}
        loadingMembers={loadingMembers}
        team={dialogTeam}
        onTeamChange={handleDialogTeamChange}
        status={dialogStatus}
        onStatusChange={setDialogStatus}
        title={dialogTitle}
        onTitleChange={setDialogTitle}
        dueDate={dialogDueDate}
        onDueDateChange={setDialogDueDate}
        assigneeIds={dialogAssigneeIds}
        onAssigneeIdsChange={setDialogAssigneeIds}
        readOnlyCollaboratorNames={editingCollaboratorNames}
      />

      {/* Delete confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this task?</DialogTitle>
          </DialogHeader>
          <p className="t-body-sm text-[#6E7686]">
            This removes the task for everyone assigned to it. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} loading={submitting}>
              Delete task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject / send back */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send back &ldquo;{rejectingTask?.task_name}&rdquo;?</DialogTitle>
          </DialogHeader>
          <p className="t-body-sm text-[#6E7686]">This moves the task back to In progress.</p>
          <div>
            <Label className="t-label text-[#A7B0C0] mb-1.5 block">Reason</Label>
            <Input
              placeholder="What needs to be fixed?"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReject} loading={submitting}>
              Send back
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

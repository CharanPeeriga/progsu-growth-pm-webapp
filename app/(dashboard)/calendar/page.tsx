"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { fetchAllTasks, fetchTeamMembers, insertTask, updateTask } from "@/lib/supabase";
import type { DBTask, TaskStatus, TeamMember, TeamName } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { ThroughputRail } from "@/components/ui/throughput-rail";
import { Button } from "@/components/ui/button";
import Combobox from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MonthGrid, toDateStr } from "@/components/calendar/month-grid";
import { DaySheet } from "@/components/calendar/day-sheet";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { TEAM_STYLE, STATUS_STYLE, STATUS_ORDER, type Status } from "@/lib/design";

const GUILD_ID = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID ?? "";
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const emptyStatusCounts = (): Record<Status, number> => ({
  todo: 0,
  in_progress: 0,
  review: 0,
  done: 0,
});

export default function CalendarPage() {
  const [tasks, setTasks] = useState<DBTask[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [anchor, setAnchor] = useState(() => new Date());
  const [teamFilter, setTeamFilter] = useState<"all" | TeamName>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");

  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const [daySheetOpen, setDaySheetOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [dialogTeam, setDialogTeam] = useState<TeamName | "">("");
  const [dialogStatus, setDialogStatus] = useState<TaskStatus>("todo");
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogDueDate, setDialogDueDate] = useState<string | null>(null);
  const [dialogAssigneeIds, setDialogAssigneeIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchAllTasks();
      setTasks(data);
    } catch {
      toast.error("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    fetchTeamMembers(GUILD_ID)
      .then(setTeamMembers)
      .finally(() => setLoadingMembers(false));
  }, [load]);

  const memberMap = useMemo(
    () => new Map(teamMembers.map((m) => [m.user_id, m.display_name ?? m.user_id])),
    [teamMembers]
  );

  const filtered = useMemo(() => {
    let list = tasks;
    if (teamFilter !== "all") list = list.filter((t) => t.team === teamFilter);
    if (statusFilter !== "all") list = list.filter((t) => t.status === statusFilter);
    return list;
  }, [tasks, teamFilter, statusFilter]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, DBTask[]>();
    for (const t of filtered) {
      if (!t.due_date) continue;
      const list = map.get(t.due_date) ?? [];
      list.push(t);
      map.set(t.due_date, list);
    }
    return map;
  }, [filtered]);

  const monthStatusCounts = useMemo(() => {
    const counts = emptyStatusCounts();
    const y = anchor.getFullYear();
    const m = anchor.getMonth();
    for (const t of filtered) {
      if (!t.due_date) continue;
      const d = new Date(t.due_date + "T00:00:00");
      if (d.getFullYear() === y && d.getMonth() === m) counts[t.status]++;
    }
    return counts;
  }, [filtered, anchor]);

  const teamOptions = [
    { value: "all", label: "All teams" },
    ...(Object.keys(TEAM_STYLE) as TeamName[]).map((t) => ({
      value: t,
      label: TEAM_STYLE[t].label,
      color: TEAM_STYLE[t].base,
    })),
  ];

  const navigate = (dir: -1 | 1) =>
    setAnchor((prev) => new Date(prev.getFullYear(), prev.getMonth() + dir, 1));
  const goToday = () => setAnchor(new Date());

  const openDaySheet = useCallback((date: Date) => {
    setSelectedDate(date);
    setDaySheetOpen(true);
  }, []);

  const openCreateDialog = useCallback((date: Date) => {
    setDialogMode("create");
    setEditingTaskId(null);
    setDialogTeam("");
    setDialogStatus("todo");
    setDialogTitle("");
    setDialogDueDate(toDateStr(date));
    setDialogAssigneeIds([]);
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((task: DBTask) => {
    setDialogMode("edit");
    setEditingTaskId(task.id);
    setDialogTeam(task.team);
    setDialogStatus(task.status);
    setDialogTitle(task.task_name);
    setDialogDueDate(task.due_date);
    setDialogAssigneeIds([task.assignee_id]);
    setDialogOpen(true);
  }, []);

  const handleDialogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialogTeam) {
      toast.error("Please select a team");
      return;
    }
    setSubmitting(true);
    try {
      if (dialogMode === "create") {
        if (dialogAssigneeIds.length === 0) {
          toast.error("Please select an assignee");
          setSubmitting(false);
          return;
        }
        if (!dialogTitle.trim()) {
          toast.error("Please enter a task name");
          setSubmitting(false);
          return;
        }
        const [assignee_id, ...collaborator_ids] = dialogAssigneeIds;
        await insertTask({
          assignee_id,
          task_name: dialogTitle,
          due_date: dialogDueDate,
          status: dialogStatus,
          team: dialogTeam,
          collaborator_ids,
          guild_id: GUILD_ID,
        });
        toast.success("✅ Task created");
      } else if (editingTaskId) {
        await updateTask(editingTaskId, {
          assignee_id: dialogAssigneeIds[0],
          task_name: dialogTitle,
          due_date: dialogDueDate,
          status: dialogStatus,
          team: dialogTeam,
        });
        toast.success("✅ Task updated");
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      toast.error(`❌ Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, task: DBTask) => {
    e.dataTransfer.setData("taskId", String(task.id));
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(task.id);
  };
  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTarget(null);
  };
  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(dateStr);
  };
  const handleDrop = async (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData("taskId"));
    setDraggingId(null);
    setDropTarget(null);
    if (!id) return;
    const dateStr = toDateStr(date);
    const task = tasks.find((t) => t.id === id);
    if (!task || task.due_date === dateStr) return;
    try {
      await updateTask(id, { due_date: dateStr });
      toast.success("📅 Due date updated");
      await load();
    } catch (err) {
      toast.error(`Failed to update: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  return (
    <div className="pb-16 space-y-5">
      <PageHeader
        title="Calendar"
        subtitle="Task deadlines across all four teams."
        actions={
          <>
            <div className="flex items-center gap-1 rounded-control border border-[rgba(255,255,255,0.09)] bg-[#12151C] p-0.5">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="iconSm"
                      aria-label="Previous month"
                      onClick={() => navigate(-1)}
                    />
                  }
                >
                  <ChevronLeft className="size-[15px]" />
                </TooltipTrigger>
                <TooltipContent>Previous month</TooltipContent>
              </Tooltip>
              <span className="min-w-[124px] px-1 text-center font-display text-[13.5px] font-semibold tracking-[-0.01em] text-[#E8EBF2]">
                {MONTH_NAMES[anchor.getMonth()]} {anchor.getFullYear()}
              </span>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="iconSm"
                      aria-label="Next month"
                      onClick={() => navigate(1)}
                    />
                  }
                >
                  <ChevronRight className="size-[15px]" />
                </TooltipTrigger>
                <TooltipContent>Next month</TooltipContent>
              </Tooltip>
            </div>
            <Button variant="secondary" size="default" onClick={goToday}>
              Today
            </Button>
          </>
        }
        rail={<ThroughputRail counts={monthStatusCounts} height={4} />}
      />

      <div className="flex flex-wrap items-center gap-2 rounded-card border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-2.5">
        <Combobox
          items={teamOptions}
          value={teamFilter}
          onSelect={(v) => setTeamFilter(v as "all" | TeamName)}
          placeholder="All teams"
          className="w-[168px]"
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | Status)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue>
              {(v: "all" | Status) => (v === "all" ? "All statuses" : STATUS_STYLE[v].label)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_ORDER.map((s) => (
              <SelectItem
                key={s}
                value={s}
                className="select-dot"
                style={{ "--dot-color": STATUS_STYLE[s].base } as React.CSSProperties}
              >
                {STATUS_STYLE[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!loading && (
        <MonthGrid
          monthDate={anchor}
          tasksByDate={tasksByDate}
          draggingId={draggingId}
          dropTarget={dropTarget}
          onDayClick={openDaySheet}
          onAddDay={openCreateDialog}
          onEditTask={openEditDialog}
          onMoreClick={openDaySheet}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      )}

      <DaySheet
        open={daySheetOpen}
        onOpenChange={setDaySheetOpen}
        date={selectedDate}
        tasks={selectedDate ? tasksByDate.get(toDateStr(selectedDate)) ?? [] : []}
        onEditTask={openEditDialog}
        onAddTask={() => selectedDate && openCreateDialog(selectedDate)}
      />

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        submitting={submitting}
        onSubmit={handleDialogSubmit}
        teamMembers={teamMembers}
        memberMap={memberMap}
        loadingMembers={loadingMembers}
        team={dialogTeam}
        onTeamChange={setDialogTeam}
        status={dialogStatus}
        onStatusChange={setDialogStatus}
        title={dialogTitle}
        onTitleChange={setDialogTitle}
        dueDate={dialogDueDate}
        onDueDateChange={setDialogDueDate}
        assigneeIds={dialogAssigneeIds}
        onAssigneeIdsChange={setDialogAssigneeIds}
      />
    </div>
  );
}

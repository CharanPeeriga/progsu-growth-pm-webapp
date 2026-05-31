"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { fetchAllTasks, updateTask, deleteTask } from "@/lib/supabase";
import type { DBTask, TeamName } from "@/lib/types";
import { EventManager, type CalendarEvent } from "@/components/ui/event-manager";
import { cn } from "@/lib/utils";
import { teamTabClass } from "@/components/ui/team-badge";

const STATUS_COLORS: Record<string, string> = {
  todo: "blue",
  in_progress: "orange",
  review: "purple",
  done: "green",
};

const STATUS_LABELS: Record<string, string> = {
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

function taskToEvent(task: DBTask): CalendarEvent | null {
  if (!task.due_date) return null;
  return {
    id: task.id.toString(),
    title: task.task_name,
    description: task.rejection_reason ? `↩️ Sent back: ${task.rejection_reason}` : undefined,
    startTime: `${task.due_date}T09:00:00`,
    endTime: `${task.due_date}T10:00:00`,
    color: STATUS_COLORS[task.status] ?? "blue",
    category: STATUS_LABELS[task.status] ?? task.status,
    tags: [],
  };
}

export default function CalendarPage() {
  const [tasks, setTasks] = useState<DBTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamFilter, setTeamFilter] = useState<"all" | TeamName>("all");

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

  useEffect(() => { load(); }, [load]);

  const events = useMemo(() => {
    const visible = teamFilter === "all" ? tasks : tasks.filter((t) => t.team === teamFilter);
    return visible.flatMap((t) => { const ev = taskToEvent(t); return ev ? [ev] : []; });
  }, [tasks, teamFilter]);

  const handleEventUpdate = useCallback(
    async (id: string, updates: { startTime: string; endTime: string }) => {
      try {
        const newDate = updates.startTime.split("T")[0];
        await updateTask(parseInt(id, 10), { due_date: newDate });
        toast.success("📅 Due date updated");
        await load();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to update: ${msg}`);
      }
    },
    [load]
  );

  const handleEventDelete = useCallback(
    async (id: string) => {
      try {
        await deleteTask(parseInt(id, 10));
        toast.success("🗑️ Task deleted");
        await load();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to delete: ${msg}`);
      }
    },
    [load]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">Task deadlines across the team</p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
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
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
          Loading calendar…
        </div>
      ) : (
        <EventManager
          events={events}
          categories={["Todo", "In Progress", "In Review", "Done"]}
          defaultView="month"
          onEventCreate={() => toast.info("Create tasks from the Tasks page.")}
          onEventUpdate={handleEventUpdate}
          onEventDelete={handleEventDelete}
        />
      )}
    </div>
  );
}

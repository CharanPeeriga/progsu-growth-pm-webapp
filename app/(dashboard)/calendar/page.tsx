"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { fetchAllTasks, updateTask, deleteTask } from "@/lib/supabase";
import type { DBTask } from "@/lib/types";
import { EventManager, type CalendarEvent } from "@/components/ui/event-manager";

const GUILD_ID = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID ?? "";

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

function taskToEvent(task: DBTask): CalendarEvent | null {
  if (!task.due_date) return null;
  return {
    id: task.id.toString(),
    title: task.task_name,
    description: task.rejection_reason
      ? `↩️ Sent back: ${task.rejection_reason}`
      : undefined,
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

  const load = useCallback(async () => {
    try {
      const data = await fetchAllTasks(GUILD_ID);
      setTasks(data);
    } catch {
      toast.error("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const events = useMemo(
    () => tasks.flatMap((t) => { const ev = taskToEvent(t); return ev ? [ev] : []; }),
    [tasks]
  );

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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Calendar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Task deadlines across the team
        </p>
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

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { fetchAllTasks } from "@/lib/supabase";
import type { DBTask } from "@/lib/types";
import { cn } from "@/lib/utils";

const GUILD_ID = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID ?? "";

function isOverdue(t: DBTask): boolean {
  if (!t.due_date || t.status === "done") return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return new Date(t.due_date + "T00:00:00") < now;
}

function dueDateBadgeClass(t: DBTask): string {
  if (!t.due_date) return "text-muted-foreground";
  if (t.status === "done") return "text-muted-foreground";
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(t.due_date + "T00:00:00");
  const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return "bg-red-900/40 text-red-400 border border-red-800";
  if (diff <= 2) return "bg-yellow-900/40 text-yellow-400 border border-yellow-800";
  return "bg-muted text-muted-foreground border border-border";
}

function formatDate(s: string | null): string {
  if (!s) return "No due date";
  const d = new Date(s + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ProgressPage() {
  const [tasks, setTasks] = useState<DBTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"week" | "all">("all");

  useEffect(() => {
    fetchAllTasks(GUILD_ID)
      .then(setTasks)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (timeframe === "all") return tasks;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return tasks.filter((t) => new Date(t.created_at) >= cutoff);
  }, [tasks, timeframe]);

  const total = filtered.length;
  const completed = filtered.filter((t) => t.status === "done").length;
  const pending = filtered.filter((t) => t.status !== "done" && !isOverdue(t)).length;
  const overdue = filtered.filter(isOverdue).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const perPerson = useMemo(() => {
    const map = new Map<
      string,
      { completed: number; pending: number; overdue: number; oldestOverdue: DBTask | null }
    >();
    for (const t of filtered) {
      const prev = map.get(t.assignee_id) ?? {
        completed: 0, pending: 0, overdue: 0, oldestOverdue: null,
      };
      if (t.status === "done") {
        prev.completed++;
      } else if (isOverdue(t)) {
        prev.overdue++;
        if (
          !prev.oldestOverdue ||
          (t.due_date && prev.oldestOverdue.due_date && t.due_date < prev.oldestOverdue.due_date)
        ) {
          prev.oldestOverdue = t;
        }
      } else {
        prev.pending++;
      }
      map.set(t.assignee_id, prev);
    }
    return Array.from(map.entries())
      .map(([id, s]) => ({ id, ...s }))
      .sort((a, b) => b.completed - a.completed);
  }, [filtered]);

  const upcoming = useMemo(() => {
    return tasks
      .filter((t) => t.status !== "done" && t.due_date)
      .sort((a, b) => (a.due_date! > b.due_date! ? 1 : -1))
      .slice(0, 5);
  }, [tasks]);

  const stats = [
    { label: "Total Assigned", value: total },
    { label: "Completed", value: completed },
    { label: "Pending", value: pending },
    { label: "Overdue", value: overdue, highlight: overdue > 0 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Progress</h1>
          <p className="text-muted-foreground text-sm mt-1">Track completion across the team</p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {(["week", "all"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                timeframe === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "week" ? "This Week" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, highlight }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 14 }}
            className="bg-card border border-border rounded-lg p-5 shadow-sm"
          >
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{label}</p>
            <p className={cn("text-3xl font-bold mt-1", highlight && "text-red-500")}>{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Completion rate */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-lg p-6 shadow-sm"
        >
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-semibold">Completion Rate</h2>
            <span className="text-3xl font-bold text-primary">{completionRate}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {completed} of {total} task{total !== 1 ? "s" : ""} completed
          </p>
        </motion.div>
      )}

      {/* Per-person table */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="font-semibold">Per Person</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 font-medium text-muted-foreground">Discord ID</th>
                <th className="p-4 font-medium text-muted-foreground text-right">Completed</th>
                <th className="p-4 font-medium text-muted-foreground text-right">Pending</th>
                <th className="p-4 font-medium text-muted-foreground text-right">Overdue</th>
                <th className="p-4 font-medium text-muted-foreground">Oldest Overdue Task</th>
              </tr>
            </thead>
            <tbody>
              {perPerson.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">No data.</td>
                </tr>
              ) : (
                perPerson.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-none hover:bg-muted/50">
                    <td className="p-4 font-mono text-xs">{p.id}</td>
                    <td className="p-4 text-right text-green-500 font-medium">{p.completed}</td>
                    <td className="p-4 text-right text-muted-foreground">{p.pending}</td>
                    <td className="p-4 text-right">
                      <span className={p.overdue > 0 ? "text-red-500 font-medium" : "text-muted-foreground"}>
                        {p.overdue}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground text-xs">
                      {p.oldestOverdue ? (
                        <span>
                          {p.oldestOverdue.task_name}{" "}
                          <span className="text-red-400">({formatDate(p.oldestOverdue.due_date)})</span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming deadlines */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="font-semibold">Upcoming Deadlines</h2>
        </div>
        <div className="divide-y divide-border">
          {upcoming.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground text-sm">No upcoming deadlines.</p>
          ) : (
            upcoming.map((t) => (
              <div key={t.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{t.task_name}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{t.assignee_id}</p>
                </div>
                <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", dueDateBadgeClass(t))}>
                  {formatDate(t.due_date)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

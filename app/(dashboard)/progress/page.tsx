"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { fetchAllTasks, fetchTeamMembers } from "@/lib/supabase";
import type { DBTask, TeamMember, TeamName } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BarChart2, CalendarDays } from "lucide-react";
import { TeamBadge, teamTabClass } from "@/components/ui/team-badge";

function isOverdue(t: DBTask): boolean {
  if (!t.due_date || t.status === "done") return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return new Date(t.due_date + "T00:00:00") < now;
}

function dueDateBadgeClass(t: DBTask): string {
  if (!t.due_date || t.status === "done")
    return "bg-muted text-muted-foreground border border-border";
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(t.due_date + "T00:00:00");
  const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return "bg-red-950/60 text-red-400 border border-red-900/40";
  if (diff <= 2) return "bg-yellow-950/60 text-yellow-400 border border-yellow-900/40";
  return "bg-muted text-muted-foreground border border-border";
}

function formatDate(s: string | null): string {
  if (!s) return "No due date";
  const d = new Date(s + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const TEAM_FILTERS = [
  { value: "all" as const, label: "All Teams" },
  { value: "growth" as const, label: "Growth" },
  { value: "tech" as const, label: "Tech" },
  { value: "operations" as const, label: "Operations" },
];

const GUILD_ID = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID ?? "";

export default function ProgressPage() {
  const [tasks, setTasks] = useState<DBTask[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"week" | "all">("all");
  const [teamFilter, setTeamFilter] = useState<"all" | TeamName>("all");

  useEffect(() => {
    Promise.all([fetchAllTasks(), fetchTeamMembers(GUILD_ID)])
      .then(([t, m]) => { setTasks(t); setMembers(m); })
      .finally(() => setLoading(false));
  }, []);

  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.user_id, m])),
    [members]
  );

  const filtered = useMemo(() => {
    let list = tasks;
    if (teamFilter !== "all") list = list.filter((t) => t.team === teamFilter);
    if (timeframe === "week") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      list = list.filter((t) => new Date(t.created_at) >= cutoff);
    }
    return list;
  }, [tasks, timeframe, teamFilter]);

  const total = filtered.length;
  const completed = filtered.filter((t) => t.status === "done").length;
  const pending = filtered.filter((t) => t.status !== "done" && !isOverdue(t)).length;
  const overdue = filtered.filter(isOverdue).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const perPerson = useMemo(() => {
    const map = new Map<string, { completed: number; pending: number; overdue: number; oldestOverdue: DBTask | null }>();
    for (const t of filtered) {
      const prev = map.get(t.assignee_id) ?? { completed: 0, pending: 0, overdue: 0, oldestOverdue: null };
      if (t.status === "done") prev.completed++;
      else if (isOverdue(t)) {
        prev.overdue++;
        if (!prev.oldestOverdue || (t.due_date && prev.oldestOverdue.due_date && t.due_date < prev.oldestOverdue.due_date)) {
          prev.oldestOverdue = t;
        }
      } else prev.pending++;
      map.set(t.assignee_id, prev);
    }
    return Array.from(map.entries())
      .map(([id, s]) => ({ id, ...s }))
      .sort((a, b) => b.completed - a.completed);
  }, [filtered]);

  const upcoming = useMemo(() => {
    let list = tasks.filter((t) => t.status !== "done" && t.due_date);
    if (teamFilter !== "all") list = list.filter((t) => t.team === teamFilter);
    return list.sort((a, b) => (a.due_date! > b.due_date! ? 1 : -1)).slice(0, 5);
  }, [tasks, teamFilter]);

  const stats = [
    { label: "Total Assigned", value: total },
    { label: "Completed", value: completed },
    { label: "Pending", value: pending },
    { label: "Overdue", value: overdue, danger: overdue > 0 },
  ];

  return (
    <div className="space-y-6 page-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Progress</h1>
          <p className="text-sm text-muted-foreground mt-1">Track completion across the team</p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {(["week", "all"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                timeframe === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "week" ? "This Week" : "All Time"}
            </button>
          ))}
        </div>
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

      {/* Overview stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, danger }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring" as const, stiffness: 100, damping: 15 }}
            className="bg-card border border-border rounded-xl p-6 shadow-sm"
          >
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <p className={cn("text-3xl font-bold mt-1", danger ? "text-red-400" : "text-foreground")}>
              {value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Completion rate bar */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground">Completion Rate</h2>
            <span className="text-3xl font-bold text-primary">{completionRate}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2.5">
            {completed} of {total} task{total !== 1 ? "s" : ""} completed
          </p>
        </motion.div>
      )}

      {/* Per-person table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Per Person</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[640px]">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Member</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Team</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Completed</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Pending</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Overdue</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Oldest Overdue</th>
              </tr>
            </thead>
            <tbody>
              {perPerson.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <BarChart2 size={40} className="text-muted-foreground/30" />
                      <p className="text-sm font-medium text-muted-foreground">No data yet</p>
                      <p className="text-xs text-muted-foreground/70">Assign tasks to see per-person stats</p>
                    </div>
                  </td>
                </tr>
              ) : (
                perPerson.map((p) => {
                  const member = memberMap.get(p.id);
                  return (
                    <tr key={p.id} className="border-b border-border last:border-none hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4">
                        <p className="text-xs font-medium text-foreground">{member?.display_name || p.id}</p>
                        {member?.display_name && (
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">{p.id}</p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {member?.team ? <TeamBadge team={member.team} /> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-4 text-right text-green-400 font-medium">{p.completed}</td>
                      <td className="px-4 py-4 text-right text-muted-foreground">{p.pending}</td>
                      <td className="px-4 py-4 text-right">
                        <span className={p.overdue > 0 ? "text-red-400 font-medium" : "text-muted-foreground"}>
                          {p.overdue}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-muted-foreground max-w-[200px] truncate">
                        {p.oldestOverdue ? (
                          <>{p.oldestOverdue.task_name}{" "}<span className="text-red-400">({formatDate(p.oldestOverdue.due_date)})</span></>
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming deadlines */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Upcoming Deadlines</h2>
        </div>
        <div className="divide-y divide-border">
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16">
              <CalendarDays size={40} className="text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">No upcoming deadlines</p>
              <p className="text-xs text-muted-foreground/70">Assign due dates to tasks to see them here</p>
            </div>
          ) : (
            upcoming.map((t) => (
              <div key={t.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{t.task_name}</p>
                    {t.team && <TeamBadge team={t.team} />}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {memberMap.get(t.assignee_id)?.display_name || t.assignee_id}
                  </p>
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

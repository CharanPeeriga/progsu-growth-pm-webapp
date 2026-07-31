"use client";

import { useState, useEffect, useMemo } from "react";
import { Target, CheckCircle2, AlertTriangle, CalendarDays } from "lucide-react";
import { fetchAllTasks, fetchTeamMembers } from "@/lib/supabase";
import type { DBTask, TeamMember, TeamName } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { ThroughputRail } from "@/components/ui/throughput-rail";
import { StatCard } from "@/components/ui/stat-card";
import { TeamBadge } from "@/components/ui/team-badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TeamBreakdown, type TeamBreakdownRow } from "@/components/progress/team-breakdown";
import { CompletionDonut } from "@/components/progress/completion-donut";
import { PersonTable, type PersonRow, type PersonSort } from "@/components/progress/person-table";
import { STATUS_STYLE, type Status } from "@/lib/design";

const GUILD_ID = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID ?? "";
const TEAM_ORDER: TeamName[] = ["growth", "tech", "operations", "progirls"];

type Range = "week" | "month" | "all";
const RANGE_LABELS: Record<Range, string> = {
  week: "This week",
  month: "This month",
  all: "All time",
};

function isOverdue(t: DBTask): boolean {
  if (!t.due_date || t.status === "done") return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return new Date(t.due_date + "T00:00:00") < now;
}

function formatDate(s: string | null): string {
  if (!s) return "No due date";
  const d = new Date(s + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const emptyStatusCounts = (): Record<Status, number> => ({
  todo: 0,
  in_progress: 0,
  review: 0,
  done: 0,
});

export default function ProgressPage() {
  const [tasks, setTasks] = useState<DBTask[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("all");
  const [personSort, setPersonSort] = useState<PersonSort>("rate");

  useEffect(() => {
    Promise.all([fetchAllTasks(), fetchTeamMembers(GUILD_ID)])
      .then(([t, m]) => {
        setTasks(t);
        setMembers(m);
      })
      .finally(() => setLoading(false));
  }, []);

  const memberMap = useMemo(() => new Map(members.map((m) => [m.user_id, m])), [members]);

  const filtered = useMemo(() => {
    if (range === "all") return tasks;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (range === "week" ? 7 : 30));
    return tasks.filter((t) => new Date(t.created_at) >= cutoff);
  }, [tasks, range]);

  const statusCounts = useMemo(() => {
    const counts = emptyStatusCounts();
    for (const t of filtered) counts[t.status]++;
    return counts;
  }, [filtered]);

  const total = filtered.length;
  const done = statusCounts.done;
  const overdueCount = useMemo(() => filtered.filter(isOverdue).length, [filtered]);
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  const teamRows: TeamBreakdownRow[] = useMemo(() => {
    return TEAM_ORDER.map((team) => {
      const teamTasks = filtered.filter((t) => t.team === team);
      const counts = emptyStatusCounts();
      for (const t of teamTasks) counts[t.status]++;
      const teamTotal = teamTasks.length;
      const rate = teamTotal > 0 ? Math.round((counts.done / teamTotal) * 100) : 0;
      return { team, total: teamTotal, completionRate: rate, statusCounts: counts };
    });
  }, [filtered]);

  const personRows: PersonRow[] = useMemo(() => {
    const byUser = new Map<
      string,
      { assigned: number; done: number; overdue: number; statusCounts: Record<Status, number>; team: TeamName }
    >();
    for (const m of members) {
      byUser.set(m.user_id, { assigned: 0, done: 0, overdue: 0, statusCounts: emptyStatusCounts(), team: m.team });
    }
    for (const t of filtered) {
      const entry =
        byUser.get(t.assignee_id) ??
        { assigned: 0, done: 0, overdue: 0, statusCounts: emptyStatusCounts(), team: t.team };
      entry.assigned++;
      entry.statusCounts[t.status]++;
      if (t.status === "done") entry.done++;
      if (isOverdue(t)) entry.overdue++;
      byUser.set(t.assignee_id, entry);
    }
    const rows = Array.from(byUser.entries()).map(([user_id, s]) => ({
      user_id,
      name: memberMap.get(user_id)?.display_name || user_id,
      team: s.team,
      assigned: s.assigned,
      done: s.done,
      overdue: s.overdue,
      rate: s.assigned > 0 ? Math.round((s.done / s.assigned) * 100) : 0,
      statusCounts: s.statusCounts,
    }));

    rows.sort((a, b) => {
      if (a.assigned === 0 && b.assigned === 0) return 0;
      if (a.assigned === 0) return 1;
      if (b.assigned === 0) return -1;
      switch (personSort) {
        case "rate":
          return b.rate - a.rate;
        case "assigned":
          return b.assigned - a.assigned;
        case "done":
          return b.done - a.done;
        case "overdue":
          return b.overdue - a.overdue;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
    return rows;
  }, [members, filtered, memberMap, personSort]);

  const upcoming = useMemo(() => {
    return tasks
      .filter((t) => t.status !== "done" && t.due_date)
      .sort((a, b) => (a.due_date! > b.due_date! ? 1 : -1))
      .slice(0, 5);
  }, [tasks]);

  return (
    <div className="pb-16 space-y-5">
      <PageHeader
        title="Progress"
        subtitle="How work is moving, by team and by person."
        actions={
          <Select value={range} onValueChange={(v) => setRange(v as Range)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue>{(v: Range) => RANGE_LABELS[v]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(["week", "month", "all"] as Range[]).map((r) => (
                <SelectItem key={r} value={r}>
                  {RANGE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        rail={<ThroughputRail counts={statusCounts} height={4} />}
      />

      {!loading && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="COMPLETION RATE"
              value={`${completionRate}%`}
              icon={Target}
              tint={STATUS_STYLE.done.base}
              railPercent={completionRate}
            />
            <StatCard
              label="TASKS COMPLETED"
              value={done}
              icon={CheckCircle2}
              tint="#6B8AFD"
              railPercent={total > 0 ? (done / total) * 100 : 0}
            />
            <StatCard
              label="OVERDUE"
              value={overdueCount}
              icon={AlertTriangle}
              tint="#EF4444"
              railPercent={total > 0 ? (overdueCount / total) * 100 : 0}
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
            <TeamBreakdown teams={teamRows} total={total} />
            <CompletionDonut rate={completionRate} done={done} total={total} />
          </div>

          <PersonTable rows={personRows} sort={personSort} onSortChange={setPersonSort} />

          <div className="surface-card overflow-hidden">
            <div className="px-5 py-4">
              <h2 className="t-h2 text-[#E8EBF2]">Upcoming deadlines</h2>
            </div>
            {upcoming.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No upcoming deadlines"
                description="Assign due dates to tasks to see them here."
              />
            ) : (
              <div>
                {upcoming.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between border-t border-[rgba(255,255,255,0.05)] px-5 py-4 transition-colors hover:bg-[rgba(255,255,255,0.03)]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[13.5px] font-medium text-[#E8EBF2]">{t.task_name}</p>
                        <TeamBadge team={t.team} />
                      </div>
                      <p className="t-mono text-[#6E7686] mt-0.5">
                        {memberMap.get(t.assignee_id)?.display_name || t.assignee_id}
                      </p>
                    </div>
                    <span
                      className="t-mono"
                      style={{ color: isOverdue(t) ? "#FCA5A5" : "#A7B0C0" }}
                    >
                      {formatDate(t.due_date)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

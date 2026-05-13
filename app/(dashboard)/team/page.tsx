"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Users } from "lucide-react"
import { StatCard } from "@/components/StatCard"
import { Button } from "@/components/ui/button"
import { cn, shortenId, startOfDay } from "@/lib/utils"
import { createBrowserSupabase, getGuildId } from "@/lib/supabase"
import { fetchAllTasks } from "@/lib/queries"
import type { DBTask } from "@/lib/types"

interface MemberStats {
  assigneeId: string
  total: number
  completed: number
  pending: number
  overdue: number
}

function groupByAssignee(tasks: DBTask[]): MemberStats[] {
  const today = startOfDay(new Date()).getTime()
  const map = new Map<string, MemberStats>()

  for (const task of tasks) {
    const id = task.assignee_id
    const entry = map.get(id) ?? {
      assigneeId: id,
      total: 0,
      completed: 0,
      pending: 0,
      overdue: 0,
    }
    entry.total += 1
    if (task.status === "done") {
      entry.completed += 1
    } else {
      entry.pending += 1
      if (task.due_date) {
        const [y, m, d] = task.due_date.split("-").map(Number)
        if (y && m && d) {
          const dueMs = startOfDay(new Date(y, m - 1, d)).getTime()
          if (dueMs < today) {
            entry.overdue += 1
          }
        }
      }
    }
    map.set(id, entry)
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total)
}

function MiniBar({
  completed,
  pending,
  overdue,
}: {
  completed: number
  pending: number
  overdue: number
}) {
  const total = completed + pending + overdue
  if (total === 0) {
    return (
      <div className="h-1.5 w-full rounded-full bg-muted/40" aria-hidden />
    )
  }
  const cw = (completed / total) * 100
  const pw = (pending / total) * 100
  const ow = (overdue / total) * 100
  return (
    <div
      className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted/40"
      role="img"
      aria-label={`Completed ${completed}, Pending ${pending}, Overdue ${overdue}`}
    >
      {cw > 0 && (
        <div className="h-full bg-emerald-500/70" style={{ width: `${cw}%` }} />
      )}
      {pw > 0 && (
        <div className="h-full bg-primary/70" style={{ width: `${pw}%` }} />
      )}
      {ow > 0 && (
        <div className="h-full bg-red-500/70" style={{ width: `${ow}%` }} />
      )}
    </div>
  )
}

function StatLine({
  emoji,
  label,
  value,
}: {
  emoji: string
  label: string
  value: number
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        <span aria-hidden>{emoji}</span> {label}
      </span>
      <span
        className={cn(
          "font-semibold num",
          value === 0 ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  )
}

function MemberCard({ member }: { member: MemberStats }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm hover:bg-card hover:ring-1 hover:ring-primary/20 transition">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="font-medium text-foreground"
            title={member.assigneeId}
          >
            {shortenId(member.assigneeId)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <span className="num">{member.total}</span> tasks
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <StatLine emoji="✅" label="Completed:" value={member.completed} />
        <StatLine emoji="🔵" label="Pending:" value={member.pending} />
        <StatLine emoji="⚠️" label="Overdue:" value={member.overdue} />
      </div>

      <div className="mt-4">
        <MiniBar
          completed={member.completed}
          pending={member.pending}
          overdue={member.overdue}
        />
      </div>

      <div className="mt-5">
        <Button asChild variant="outline-primary" size="sm" className="w-full">
          <Link href={`/tasks?assignee=${encodeURIComponent(member.assigneeId)}`}>
            View Tasks
          </Link>
        </Button>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-muted" />
          <div className="h-3 w-16 rounded bg-muted/70" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-4 w-full rounded bg-muted/70" />
        <div className="h-4 w-full rounded bg-muted/70" />
        <div className="h-4 w-full rounded bg-muted/70" />
      </div>
      <div className="mt-4 h-1.5 w-full rounded-full bg-muted/40" />
      <div className="mt-5 h-8 w-full rounded-md bg-muted/60" />
    </div>
  )
}

export default function TeamPage() {
  const [tasks, setTasks] = useState<DBTask[] | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState<number>(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const run = async () => {
      try {
        const supabase = createBrowserSupabase()
        const data = await fetchAllTasks(supabase, getGuildId())
        if (!cancelled) {
          setTasks(data)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Unknown error loading tasks."
          setError(message)
          setLoading(false)
        }
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const members = useMemo<MemberStats[]>(
    () => (tasks ? groupByAssignee(tasks) : []),
    [tasks]
  )

  const totalMembers = members.length
  const totalTasks = tasks?.length ?? 0
  const doneCount = useMemo(
    () => (tasks ? tasks.filter((t) => t.status === "done").length : 0),
    [tasks]
  )
  const completionRate =
    totalTasks === 0 ? 0 : Math.round((doneCount / totalTasks) * 100)

  const handleRetry = () => {
    setReloadKey((k) => k + 1)
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-6 px-6 md:-mx-10 md:px-10 py-4 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <h1 className="text-3xl font-bold tracking-tight">Team</h1>
        <p className="text-muted-foreground">
          Workload distributed by assignee
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Members" value={totalMembers} />
        <StatCard label="Total Tasks" value={totalTasks} />
        <StatCard
          label="Completion Rate"
          value={`${completionRate}%`}
          hint={`${doneCount} of ${totalTasks} done`}
        />
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-5 text-sm text-foreground">
          <p className="mb-3">
            <span aria-hidden>❌</span> Failed to load team.
          </p>
          <Button variant="outline-primary" size="sm" onClick={handleRetry}>
            Retry
          </Button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : totalTasks === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card p-12 text-center">
          <Users size={40} className="text-muted-foreground" />
          <p className="text-muted-foreground">
            No teammates have been assigned tasks yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <MemberCard key={member.assigneeId} member={member} />
          ))}
        </div>
      )}
    </div>
  )
}

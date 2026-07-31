"use client"

import { ListChecks, Loader, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react"

import { StatCard } from "@/components/ui/stat-card"
import { Stagger, StaggerItem } from "@/components/layout/stagger"
import { STATUS_STYLE, type Status, type Team } from "@/lib/design"

interface TaskAnalyticsBarProps {
  counts: Record<Status, number>
  teamCounts?: Partial<Record<Team, number>>
  overdue?: number
}

export function TaskAnalyticsBar({ counts, overdue }: TaskAnalyticsBarProps) {
  const total = counts.todo + counts.in_progress + counts.review + counts.done
  const showOverdue = overdue !== undefined && overdue > 0

  return (
    <Stagger
      className={
        showOverdue
          ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
          : "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      }
    >
      <StaggerItem>
        <StatCard
          label="TOTAL TASKS"
          value={total}
          icon={ListChecks}
          tint="#6B8AFD"
          railPercent={100}
        />
      </StaggerItem>
      <StaggerItem>
        <StatCard
          label="IN PROGRESS"
          value={counts.in_progress}
          icon={Loader}
          tint={STATUS_STYLE.in_progress.base}
          railPercent={total > 0 ? (counts.in_progress / total) * 100 : 0}
        />
      </StaggerItem>
      <StaggerItem>
        <StatCard
          label="AWAITING REVIEW"
          value={counts.review}
          icon={ShieldCheck}
          tint={STATUS_STYLE.review.base}
          railPercent={total > 0 ? (counts.review / total) * 100 : 0}
        />
      </StaggerItem>
      <StaggerItem>
        <StatCard
          label="COMPLETED"
          value={counts.done}
          icon={CheckCircle2}
          tint={STATUS_STYLE.done.base}
          railPercent={total > 0 ? (counts.done / total) * 100 : 0}
        />
      </StaggerItem>
      {showOverdue && (
        <StaggerItem>
          <StatCard
            label="OVERDUE"
            value={overdue}
            icon={AlertTriangle}
            tint="#EF4444"
            railPercent={total > 0 ? (overdue! / total) * 100 : 0}
          />
        </StaggerItem>
      )}
    </Stagger>
  )
}

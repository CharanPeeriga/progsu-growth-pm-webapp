"use client"

import { motion } from "framer-motion"
import { ListChecks, Loader, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react"

import { StatCard } from "@/components/ui/stat-card"
import type { Status, Team } from "@/lib/design"

interface TaskAnalyticsBarProps {
  counts: Record<Status, number>
  teamCounts?: Partial<Record<Team, number>>
  overdue?: number
}

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.045 } },
}

const item = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22 } },
}

export function TaskAnalyticsBar({ counts, overdue }: TaskAnalyticsBarProps) {
  const total = counts.todo + counts.in_progress + counts.review + counts.done
  const showOverdue = overdue !== undefined && overdue > 0

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className={
        showOverdue
          ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
          : "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      }
    >
      <motion.div variants={item}>
        <StatCard
          label="TOTAL TASKS"
          value={total}
          icon={ListChecks}
          tint="#6B8AFD"
          railPercent={100}
        />
      </motion.div>
      <motion.div variants={item}>
        <StatCard
          label="IN PROGRESS"
          value={counts.in_progress}
          icon={Loader}
          tint="#6B8AFD"
          railPercent={total > 0 ? (counts.in_progress / total) * 100 : 0}
        />
      </motion.div>
      <motion.div variants={item}>
        <StatCard
          label="AWAITING REVIEW"
          value={counts.review}
          icon={ShieldCheck}
          tint="#FACC15"
          railPercent={total > 0 ? (counts.review / total) * 100 : 0}
        />
      </motion.div>
      <motion.div variants={item}>
        <StatCard
          label="COMPLETED"
          value={counts.done}
          icon={CheckCircle2}
          tint="#22C55E"
          railPercent={total > 0 ? (counts.done / total) * 100 : 0}
        />
      </motion.div>
      {showOverdue && (
        <motion.div variants={item}>
          <StatCard
            label="OVERDUE"
            value={overdue}
            icon={AlertTriangle}
            tint="#EF4444"
            railPercent={total > 0 ? (overdue! / total) * 100 : 0}
          />
        </motion.div>
      )}
    </motion.div>
  )
}

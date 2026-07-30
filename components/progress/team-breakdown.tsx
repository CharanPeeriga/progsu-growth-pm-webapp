"use client"

import { motion } from "framer-motion"

import { ThroughputRail } from "@/components/ui/throughput-rail"
import { TEAM_STYLE, STATUS_ORDER, STATUS_STYLE, type Status, type Team } from "@/lib/design"

export interface TeamBreakdownRow {
  team: Team
  total: number
  completionRate: number
  statusCounts: Record<Status, number>
}

interface TeamBreakdownProps {
  teams: TeamBreakdownRow[]
  total: number
}

export function TeamBreakdown({ teams, total }: TeamBreakdownProps) {
  return (
    <div className="surface-card p-5">
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="t-h2 text-[#E8EBF2]">By team</h2>
        <span className="t-caption text-[#6E7686]">{total} tasks total</span>
      </div>

      <div className="flex flex-col gap-5">
        {teams.map((row, i) => (
          <div key={row.team} className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="h-3 w-[3px] rounded-full"
                  style={{ background: TEAM_STYLE[row.team].base }}
                />
                <span className="text-[13.5px] font-medium text-[#E8EBF2]">
                  {TEAM_STYLE[row.team].label}
                </span>
                <span className="font-mono text-[11px] text-[#6E7686]">{row.total}</span>
              </div>
              <span className="font-mono text-[13px] tabular-nums text-[#A7B0C0]">
                {row.completionRate}%
              </span>
            </div>
            {row.total === 0 ? (
              <div className="h-[6px] w-full rounded-full bg-[rgba(255,255,255,0.05)]" />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
              >
                <ThroughputRail counts={row.statusCounts} height={6} />
              </motion.div>
            )}
          </div>
        ))}
      </div>

      <div className="divider-grad my-5" />
      <div className="flex flex-wrap items-center gap-4">
        {STATUS_ORDER.map((s) => (
          <span key={s} className="flex items-center gap-1.5 t-caption text-[#6E7686]">
            <span className="size-1.5 rounded-full" style={{ background: STATUS_STYLE[s].base }} />
            {STATUS_STYLE[s].label}
          </span>
        ))}
      </div>
    </div>
  )
}

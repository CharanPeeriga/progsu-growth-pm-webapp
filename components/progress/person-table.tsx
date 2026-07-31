"use client"

import { Users } from "lucide-react"

import { Avatar } from "@/components/team/member-card"
import { TeamBadge } from "@/components/ui/team-badge"
import { ThroughputRail } from "@/components/ui/throughput-rail"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TEAM_STYLE, STATUS_STYLE, type Status, type Team } from "@/lib/design"

export type PersonSort = "rate" | "assigned" | "done" | "overdue" | "name"

const SORT_LABELS: Record<PersonSort, string> = {
  rate: "Rate",
  assigned: "Assigned",
  done: "Done",
  overdue: "Overdue",
  name: "Name",
}

const SORT_OPTIONS: PersonSort[] = ["rate", "assigned", "done", "overdue", "name"]

export interface PersonRow {
  user_id: string
  name: string
  team: Team
  assigned: number
  done: number
  overdue: number
  rate: number
  statusCounts: Record<Status, number>
}

interface PersonTableProps {
  rows: PersonRow[]
  sort: PersonSort
  onSortChange: (v: PersonSort) => void
}

export function PersonTable({ rows, sort, onSortChange }: PersonTableProps) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="flex items-baseline justify-between px-5 py-4">
        <h2 className="t-h2 text-[#E8EBF2]">By person</h2>
        <Select value={sort} onValueChange={(v) => onSortChange(v as PersonSort)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue>{(v: PersonSort) => SORT_LABELS[v]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {SORT_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No activity in this range"
          description="Pick a wider range or assign some tasks."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="h-10 bg-[#12151C] border-0 border-b border-b-[rgba(255,255,255,0.09)] rounded-none">
                <th className="t-overline min-w-[220px] px-4 text-[#6E7686]">MEMBER</th>
                <th className="t-overline w-[132px] px-4 text-[#6E7686]">TEAM</th>
                <th className="t-overline w-[96px] px-4 text-[#6E7686]">ASSIGNED</th>
                <th className="t-overline w-[96px] px-4 text-[#6E7686]">DONE</th>
                <th className="t-overline w-[96px] px-4 text-[#6E7686]">OVERDUE</th>
                <th className="t-overline min-w-[180px] px-4 text-[#6E7686]">THROUGHPUT</th>
                <th className="t-overline w-[80px] px-4 text-right text-[#6E7686]">RATE</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const t = TEAM_STYLE[p.team]
                return (
                  <tr
                    key={p.user_id}
                    className="h-[56px] border-b border-[rgba(255,255,255,0.05)] transition-colors duration-[160ms] ease-standard last:border-none hover:bg-[rgba(255,255,255,0.035)]"
                  >
                    <td className="min-w-[220px] px-4 align-middle">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={p.name}
                          size={26}
                          style={{ boxShadow: `0 0 0 1px ${t.border}` }}
                        />
                        <span className="truncate text-[13.5px] text-[#E8EBF2]">{p.name}</span>
                      </div>
                    </td>
                    <td className="w-[132px] px-4 align-middle">
                      <TeamBadge team={p.team} />
                    </td>
                    <td className="w-[96px] px-4 align-middle">
                      <span className="t-mono text-[#A7B0C0]">{p.assigned}</span>
                    </td>
                    <td className="w-[96px] px-4 align-middle">
                      <span className="t-mono" style={{ color: STATUS_STYLE.done.text }}>{p.done}</span>
                    </td>
                    <td className="w-[96px] px-4 align-middle">
                      <span className={`t-mono ${p.overdue > 0 ? "text-[#FCA5A5]" : "text-[#4E5665]"}`}>
                        {p.overdue}
                      </span>
                    </td>
                    <td className="min-w-[180px] px-4 align-middle">
                      <ThroughputRail counts={p.statusCounts} height={5} />
                    </td>
                    <td className="w-[80px] px-4 text-right align-middle">
                      <span className="font-mono text-[13px] tabular-nums text-[#E8EBF2]">
                        {p.rate}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

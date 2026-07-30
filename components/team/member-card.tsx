"use client"

import { MoreVertical } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TeamBadge } from "@/components/ui/team-badge"
import { ThroughputRail } from "@/components/ui/throughput-rail"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { TEAM_STYLE, type Status } from "@/lib/design"
import type { TeamMember } from "@/lib/types"

export function memberInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function Avatar({
  name,
  size = 44,
  style,
}: {
  name: string
  size?: number
  style?: React.CSSProperties
}) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-[#171B23] font-mono text-[#A7B0C0]"
      style={{ width: size, height: size, fontSize: size * 0.34, ...style }}
    >
      {memberInitials(name)}
    </span>
  )
}

interface MemberCardProps {
  member: TeamMember
  isVp: boolean
  statusCounts: Record<Status, number>
  onViewTasks: () => void
  onToggleVp: () => void
  onRemove: () => void
}

export function MemberCard({
  member,
  isVp,
  statusCounts,
  onViewTasks,
  onToggleVp,
  onRemove,
}: MemberCardProps) {
  const t = TEAM_STYLE[member.team]
  const name = member.display_name || member.user_id
  const open = statusCounts.todo + statusCounts.in_progress
  const review = statusCounts.review
  const done = statusCounts.done

  return (
    <div className="surface-card surface-card-interactive group relative overflow-hidden p-5">
      <span className="rail-card" style={{ background: t.base, opacity: 0.8 }} />

      <div className="flex items-start gap-3.5">
        <Avatar
          name={name}
          size={44}
          style={{ boxShadow: `0 0 0 1px ${t.border}, 0 0 18px -8px ${t.base}` }}
        />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="t-h3 truncate text-[#E8EBF2]">{name}</p>
          <p className="t-caption truncate text-[#6E7686]">Member</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="iconSm"
                className="ml-auto opacity-0 transition-opacity duration-[160ms] group-hover:opacity-100 focus-visible:opacity-100"
              />
            }
          >
            <MoreVertical className="size-[15px]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="rounded-[12px] border border-[rgba(255,255,255,0.09)] bg-[#171B23] p-1 shadow-popover"
            align="end"
          >
            <DropdownMenuItem
              className="h-8 gap-2 rounded-chip px-2.5 text-[13px] text-[#A7B0C0]"
              onClick={onViewTasks}
            >
              View tasks
            </DropdownMenuItem>
            <DropdownMenuItem
              className="h-8 gap-2 rounded-chip px-2.5 text-[13px] text-[#A7B0C0]"
              onClick={onToggleVp}
            >
              {isVp ? "Remove VP" : "Promote to VP"}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[rgba(255,255,255,0.06)]" />
            <DropdownMenuItem
              className="h-8 gap-2 rounded-chip px-2.5 text-[13px] text-[#FCA5A5]"
              onClick={onRemove}
            >
              Remove from roster
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <TeamBadge team={member.team} />
        {isVp && <Badge variant="accent">VP</Badge>}
      </div>

      <div className="divider-grad my-4" />

      <ThroughputRail counts={statusCounts} height={3} />
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { label: "OPEN", value: open },
          { label: "IN REVIEW", value: review },
          { label: "DONE", value: done },
        ].map((s) => (
          <div key={s.label} className="flex flex-col gap-1">
            <span className="t-caption text-[#6E7686]">{s.label}</span>
            <span className="font-mono text-[15px] font-medium tabular-nums text-[#E8EBF2]">
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

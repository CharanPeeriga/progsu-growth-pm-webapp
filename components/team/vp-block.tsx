"use client"

import { useState } from "react"
import { Settings2, Crown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { TeamBadge } from "@/components/ui/team-badge"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar } from "@/components/team/member-card"
import { TEAM_STYLE } from "@/lib/design"
import type { TeamMember, TeamName, VPRole } from "@/lib/types"

export interface VpEntry {
  id: number
  user_id: string
  team: TeamName
  name: string
  openTasks: number
}

interface VpBlockProps {
  vps: VpEntry[]
  members: TeamMember[]
  vpRoles: VPRole[]
  onToggleVp: (userId: string, team: TeamName) => void
}

export function VpBlock({ vps, members, vpRoles, onToggleVp }: VpBlockProps) {
  const [manageOpen, setManageOpen] = useState(false)
  const vpKeySet = new Set(vpRoles.map((v) => `${v.user_id}:${v.team}`))

  return (
    <>
      <section className="surface-card surface-featured halo-accent overflow-hidden p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="t-overline text-[#8099FE]">Leadership</span>
            <h2 className="t-h2 text-[#E8EBF2]">Vice presidents</h2>
          </div>
          <Button variant="accentGhost" size="sm" onClick={() => setManageOpen(true)}>
            <Settings2 className="size-[15px]" />
            Manage VPs
          </Button>
        </div>

        {vps.length === 0 ? (
          <EmptyState
            icon={Crown}
            title="No VPs assigned"
            description="Promote a member to VP to give them review permissions."
            action={
              <Button variant="secondary" onClick={() => setManageOpen(true)}>
                Manage VPs
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {vps.map((vp) => {
              const t = TEAM_STYLE[vp.team]
              return (
                <div
                  key={vp.id}
                  className="flex items-center gap-4 rounded-card border border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.03)] p-4"
                >
                  <Avatar name={vp.name} size={48} style={{ boxShadow: `0 0 0 1px ${t.border}` }} />
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <p className="t-h3 truncate text-[#E8EBF2]">{vp.name}</p>
                    <div className="flex items-center gap-2">
                      <TeamBadge team={vp.team} />
                      <span className="t-caption text-[#6E7686]">VP</span>
                    </div>
                  </div>
                  <div className="ml-auto flex flex-col items-end gap-1">
                    <span className="t-stat-sm text-[#E8EBF2]">{vp.openTasks}</span>
                    <span className="t-caption text-[#6E7686]">open</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage VPs</DialogTitle>
          </DialogHeader>
          <div className="flex max-h-[360px] flex-col gap-1 overflow-y-auto">
            {members.length === 0 && (
              <p className="t-body-sm text-[#A7B0C0] py-6 text-center">No team members yet.</p>
            )}
            {members.map((m) => {
              const name = m.display_name || m.user_id
              const checked = vpKeySet.has(`${m.user_id}:${m.team}`)
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-control px-2 py-2 hover:bg-[rgba(255,255,255,0.03)]"
                >
                  <Avatar name={name} size={32} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-[13px] font-medium text-[#E8EBF2]">{name}</p>
                    <TeamBadge team={m.team} className="mt-1 w-fit" />
                  </div>
                  <Switch
                    key={`${m.id}-${checked}`}
                    checked={checked}
                    onCheckedChange={() => onToggleVp(m.user_id, m.team)}
                  />
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

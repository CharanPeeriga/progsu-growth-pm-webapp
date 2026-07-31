"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import Combobox from "@/components/ui/combobox"
import { TEAM_STYLE } from "@/lib/design"
import type { TeamName } from "@/lib/types"

interface MemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  submitting: boolean
  onSubmit: (e: React.FormEvent) => void

  discordId: string
  onDiscordIdChange: (v: string) => void
  name: string
  onNameChange: (v: string) => void
  team: TeamName
  onTeamChange: (team: TeamName) => void
  makeVp: boolean
  onMakeVpChange: (v: boolean) => void
}

export function MemberDialog({
  open,
  onOpenChange,
  submitting,
  onSubmit,
  discordId,
  onDiscordIdChange,
  name,
  onNameChange,
  team,
  onTeamChange,
  makeVp,
  onMakeVpChange,
}: MemberDialogProps) {
  const teamOptions = (Object.keys(TEAM_STYLE) as TeamName[]).map((t) => ({
    value: t,
    label: TEAM_STYLE[t].label,
    color: TEAM_STYLE[t].base,
  }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add member</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <Label className="t-label text-[#A7B0C0] mb-1.5 block">Name</Label>
            <Input
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
            />
          </div>

          <div>
            <Label className="t-label text-[#A7B0C0] mb-1.5 block">Discord ID</Label>
            <Input
              placeholder="e.g. 123456789012345678"
              value={discordId}
              onChange={(e) => onDiscordIdChange(e.target.value)}
              className="font-mono"
              required
            />
          </div>

          <div>
            <Label className="t-label text-[#A7B0C0] mb-1.5 block">Team</Label>
            <Combobox
              items={teamOptions}
              value={team}
              onSelect={(v) => onTeamChange(v as TeamName)}
            />
          </div>

          <div className="flex items-center justify-between rounded-control border border-[rgba(255,255,255,0.09)] bg-[#12151C] px-3 py-2.5">
            <div className="flex flex-col gap-0.5">
              <span className="t-body-sm font-medium text-[#E8EBF2]">Vice president</span>
              <span className="t-caption text-[#A7B0C0]">Gives review permissions for their team.</span>
            </div>
            <Switch checked={makeVp} onCheckedChange={onMakeVpChange} />
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Add member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface RemoveMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  submitting: boolean
  onConfirm: () => void
}

export function RemoveMemberDialog({
  open,
  onOpenChange,
  name,
  submitting,
  onConfirm,
}: RemoveMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove {name} from the roster?</DialogTitle>
        </DialogHeader>
        <p className="t-body-sm text-[#A7B0C0]">
          Their completed tasks stay in the record. Open tasks become unassigned.
        </p>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} loading={submitting}>
            Remove member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

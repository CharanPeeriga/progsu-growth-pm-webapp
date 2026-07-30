"use client"

import { X } from "lucide-react"

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
import { Badge } from "@/components/ui/badge"
import Combobox from "@/components/ui/combobox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TEAM_STYLE, STATUS_ORDER, STATUS_STYLE } from "@/lib/design"
import type { TeamMember, TeamName, TaskStatus } from "@/lib/types"

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  submitting: boolean
  onSubmit: (e: React.FormEvent) => void

  teamMembers: TeamMember[]
  memberMap: Map<string, string>
  loadingMembers: boolean

  team: TeamName | ""
  onTeamChange: (team: TeamName) => void
  status: TaskStatus
  onStatusChange: (status: TaskStatus) => void
  title: string
  onTitleChange: (v: string) => void
  dueDate: string | null
  onDueDateChange: (v: string | null) => void

  assigneeIds: string[]
  onAssigneeIdsChange: (ids: string[]) => void
  readOnlyCollaboratorNames?: string[]
}

export function TaskDialog({
  open,
  onOpenChange,
  mode,
  submitting,
  onSubmit,
  teamMembers,
  memberMap,
  loadingMembers,
  team,
  onTeamChange,
  status,
  onStatusChange,
  title,
  onTitleChange,
  dueDate,
  onDueDateChange,
  assigneeIds,
  onAssigneeIdsChange,
  readOnlyCollaboratorNames,
}: TaskDialogProps) {
  const teamOptions = (Object.keys(TEAM_STYLE) as TeamName[]).map((t) => ({
    value: t,
    label: TEAM_STYLE[t].label,
    color: TEAM_STYLE[t].base,
  }))

  const membersInTeam = team ? teamMembers.filter((m) => m.team === team) : teamMembers
  const assigneeOptions = membersInTeam
    .filter((m) => !assigneeIds.includes(m.user_id))
    .map((m) => ({ value: m.user_id, label: m.display_name || m.user_id }))

  const addAssignee = (userId: string) => {
    if (mode === "edit") {
      onAssigneeIdsChange([userId])
      return
    }
    onAssigneeIdsChange([...assigneeIds, userId])
  }

  const removeAssignee = (userId: string) => {
    if (mode === "edit") return
    onAssigneeIdsChange(assigneeIds.filter((id) => id !== userId))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New task" : "Edit task"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <Label className="t-label text-[#A7B0C0] mb-1.5 block">Title</Label>
            <Input
              placeholder="Describe the task…"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="t-label text-[#A7B0C0] mb-1.5 block">Team</Label>
              <Combobox
                items={teamOptions}
                value={team || undefined}
                onSelect={(v) => onTeamChange(v as TeamName)}
                placeholder="Select team…"
              />
            </div>
            <div>
              <Label className="t-label text-[#A7B0C0] mb-1.5 block">Status</Label>
              <Select value={status} onValueChange={(v) => onStatusChange(v as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue>{(v: TaskStatus) => STATUS_STYLE[v].label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ORDER.map((s) => (
                    <SelectItem
                      key={s}
                      value={s}
                      className="select-dot"
                      style={{ "--dot-color": STATUS_STYLE[s].base } as React.CSSProperties}
                    >
                      {STATUS_STYLE[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="t-label text-[#A7B0C0] mb-1.5 block">
              {mode === "create" ? "Assignees" : "Assignee"}
            </Label>
            {assigneeIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {assigneeIds.map((uid) => (
                  <Badge key={uid} variant="neutral" className="gap-1">
                    {memberMap.get(uid) ?? uid}
                    {mode === "create" && (
                      <button
                        type="button"
                        onClick={() => removeAssignee(uid)}
                        className="ml-0.5 text-[#6E7686] hover:text-[#E8EBF2]"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </Badge>
                ))}
                {mode === "edit" &&
                  readOnlyCollaboratorNames?.map((name) => (
                    <Badge key={name} variant="neutral">
                      {name}
                    </Badge>
                  ))}
              </div>
            )}
            <Combobox
              items={assigneeOptions}
              onSelect={addAssignee}
              placeholder={loadingMembers ? "Loading members…" : "Search or select member…"}
              loading={loadingMembers && teamMembers.length === 0}
            />
            {mode === "create" && (
              <p className="t-caption text-[#6E7686] mt-1.5">
                Everyone added here receives the task and must each submit before it enters review.
              </p>
            )}
          </div>

          <div>
            <Label className="t-label text-[#A7B0C0] mb-1.5 block">Due date</Label>
            <Input
              type="date"
              value={dueDate ?? ""}
              onChange={(e) => onDueDateChange(e.target.value || null)}
              className="[color-scheme:dark]"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {mode === "create" ? "Create task" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

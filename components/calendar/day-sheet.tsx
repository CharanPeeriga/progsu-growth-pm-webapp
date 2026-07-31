"use client"

import { Pencil } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { TeamBadge } from "@/components/ui/team-badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { STATUS_STYLE } from "@/lib/design"
import type { DBTask } from "@/lib/types"

interface DaySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: Date | null
  tasks: DBTask[]
  onEditTask: (task: DBTask) => void
  onAddTask: () => void
}

export function DaySheet({ open, onOpenChange, date, tasks, onEditTask, onAddTask }: DaySheetProps) {
  const dateLabel = date
    ? date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : ""

  return (
    <TooltipProvider>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{dateLabel}</SheetTitle>
          <p className="t-body-sm text-[#6E7686]">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} due
          </p>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-6">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="relative flex items-center gap-3 rounded-control border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-3"
            >
              <span
                className="row-rail"
                style={{ background: STATUS_STYLE[task.status].base, position: "static", height: "auto", alignSelf: "stretch", opacity: 1 }}
              />
              <p className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-[#E8EBF2]">
                {task.task_name}
              </p>
              <TeamBadge team={task.team} />
              <StatusBadge status={task.status} />
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="iconSm"
                      aria-label="Edit task"
                      onClick={() => onEditTask(task)}
                    />
                  }
                >
                  <Pencil />
                </TooltipTrigger>
                <TooltipContent>Edit task</TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>

        <SheetFooter>
          <Button className="w-full" onClick={onAddTask}>
            Add task on this day
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
    </TooltipProvider>
  )
}

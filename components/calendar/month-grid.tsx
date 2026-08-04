"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TaskChip } from "@/components/calendar/task-chip"
import type { DBTask } from "@/lib/types"

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  // Monday-first grid
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

interface MonthGridProps {
  monthDate: Date
  tasksByDate: Map<string, DBTask[]>
  draggingId: number | null
  dropTarget: string | null
  onDayClick: (date: Date) => void
  onAddDay: (date: Date) => void
  onEditTask: (task: DBTask) => void
  onMoreClick: (date: Date) => void
  onDragStart: (e: React.DragEvent, task: DBTask) => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent, dateStr: string) => void
  onDrop: (e: React.DragEvent, date: Date) => void
}

export function MonthGrid({
  monthDate,
  tasksByDate,
  draggingId,
  dropTarget,
  onDayClick,
  onAddDay,
  onEditTask,
  onMoreClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: MonthGridProps) {
  const grid = getMonthGrid(monthDate.getFullYear(), monthDate.getMonth());
  const currentMonth = monthDate.getMonth();
  const today = toDateStr(new Date());

  return (
    <div className="surface-card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-[rgba(255,255,255,0.09)]">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-3 py-2.5 t-overline text-[#6E7686]">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {grid.map((date, idx) => {
          const dateStr = toDateStr(date);
          const isCurrentMonth = date.getMonth() === currentMonth;
          const isToday = dateStr === today;
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const isDropTarget = dropTarget === dateStr;
          const dayTasks = tasksByDate.get(dateStr) ?? [];
          const visible = dayTasks.slice(0, 3);
          const overflow = dayTasks.length - 3;
          const isLastCol = idx % 7 === 6;
          const isLastRow = idx >= 35;

          return (
            <div
              key={idx}
              onClick={() => onDayClick(date)}
              onDragOver={(e) => onDragOver(e, dateStr)}
              onDrop={(e) => onDrop(e, date)}
              className={[
                "group relative flex min-h-[124px] flex-col gap-1.5 border-b border-r border-[rgba(255,255,255,0.05)] p-2",
                "transition-colors duration-[160ms] ease-standard hover:bg-[rgba(255,255,255,0.025)]",
                isLastCol ? "cal-cell-last-col" : "",
                isLastRow ? "cal-cell-last-row" : "",
                !isCurrentMonth ? "bg-[rgba(255,255,255,0.012)]" : "",
                isCurrentMonth && isWeekend ? "bg-[rgba(255,255,255,0.008)]" : "",
                isToday ? "bg-[rgba(107,138,253,0.055)] shadow-[inset_0_0_0_1px_rgba(107,138,253,0.32)]" : "",
                isDropTarget ? "bg-[rgba(107,138,253,0.10)]" : "",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                {isToday ? (
                  <span
                    className="grid size-[22px] place-items-center rounded-full text-[11px] font-semibold text-[#060911]"
                    style={{ backgroundImage: "var(--grad-btn)" }}
                  >
                    {date.getDate()}
                  </span>
                ) : (
                  <span
                    className={
                      "font-mono text-[12px] tabular-nums " +
                      (isCurrentMonth ? "text-[#6E7686]" : "text-[#3A4150]")
                    }
                  >
                    {date.getDate()}
                  </span>
                )}
                {/* native title — this grid renders 42 cells, and 42 Base UI
                    tooltip roots were being mounted on every month change */}
                <Button
                  variant="ghost"
                  size="iconSm"
                  aria-label="Add task"
                  title="Add task"
                  className="opacity-0 transition-opacity duration-[160ms] group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddDay(date);
                  }}
                >
                  <Plus className="size-[14px]" />
                </Button>
              </div>

              <div className="flex flex-col gap-1">
                {visible.map((task) => (
                  <TaskChip
                    key={task.id}
                    title={task.task_name}
                    status={task.status}
                    dimmed={!isCurrentMonth || draggingId === task.id}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      onDragStart(e, task);
                    }}
                    onDragEnd={onDragEnd}
                    onClick={() => onEditTask(task)}
                  />
                ))}
                {overflow > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoreClick(date);
                    }}
                    className="mt-auto text-left t-caption text-[#6E7686] transition-colors hover:text-[#A7B0C0]"
                  >
                    +{overflow} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

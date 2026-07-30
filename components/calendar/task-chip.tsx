"use client"

import { STATUS_STYLE, type Status } from "@/lib/design"

interface TaskChipProps {
  title: string
  status: Status
  onClick: () => void
  draggable?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: () => void
  dimmed?: boolean
}

export function TaskChip({
  title,
  status,
  onClick,
  draggable,
  onDragStart,
  onDragEnd,
  dimmed,
}: TaskChipProps) {
  const s = STATUS_STYLE[status]
  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="relative flex h-[22px] w-full items-center gap-1.5 overflow-hidden rounded-[6px] pl-2 pr-1.5 text-left transition-[background,transform] duration-[160ms] ease-standard hover:brightness-125 active:scale-[0.98]"
      style={{
        backgroundColor: s.fill,
        boxShadow: `inset 0 0 0 1px ${s.border}`,
        opacity: dimmed ? 0.45 : 1,
      }}
    >
      <span className="absolute left-0 top-0 h-full w-[2px]" style={{ background: s.base }} />
      <span className="truncate text-[11.5px] font-medium" style={{ color: s.text }}>
        {title}
      </span>
    </button>
  )
}

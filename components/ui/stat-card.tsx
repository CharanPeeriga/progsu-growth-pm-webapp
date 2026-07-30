import type { LucideIcon } from "lucide-react"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

interface StatCardProps {
  label: string
  value: number | string
  delta?: { value: number; direction: "up" | "down" }
  icon: LucideIcon
  tint?: string
  railPercent?: number
}

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tint = "#6B8AFD",
  railPercent,
}: StatCardProps) {
  const width = railPercent === undefined ? "100%" : `${Math.max(railPercent, 8)}%`

  return (
    <div className="surface-card surface-card-interactive relative overflow-hidden p-5">
      <span
        className="rail-card"
        style={{ background: tint, opacity: 0.7, width }}
      />
      <div className="flex items-start justify-between">
        <span className="t-overline text-[#6E7686]">{label}</span>
        <span
          className="grid size-8 place-items-center rounded-chip border"
          style={{ backgroundColor: `${tint}1F`, borderColor: `${tint}47`, color: tint }}
        >
          <Icon className="size-[15px]" />
        </span>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="t-stat text-[#E8EBF2]">{value}</span>
        {delta && (
          <span
            className="inline-flex items-center gap-0.5 t-caption font-semibold"
            style={{ color: delta.direction === "up" ? "#86EFAC" : "#FCA5A5" }}
          >
            {delta.direction === "up" ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {Math.abs(delta.value)}%
          </span>
        )}
      </div>
    </div>
  )
}

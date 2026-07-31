import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <span className="grid size-11 place-items-center rounded-[12px] border border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.04)] text-[#6E7686]">
        <Icon className="size-5" />
      </span>
      <h3 className="t-h3 text-[#E8EBF2]">{title}</h3>
      <p className="t-body-sm text-[#A7B0C0] max-w-[320px]">{description}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

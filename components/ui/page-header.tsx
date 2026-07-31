import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  subtitle?: string
  count?: number
  actions?: ReactNode
  rail?: ReactNode
}

export function PageHeader({ title, subtitle, count, actions, rail }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-20 -mx-8 mb-6 px-8 pt-7 pb-0 surface-glass !border-x-0 !border-t-0 rounded-none">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="t-h1 t-grad">{title}</h1>
            {count !== undefined && (
              <span className="rounded-full border border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.04)] px-2 py-0.5 font-mono text-[11px] text-[#A7B0C0]">
                {count}
              </span>
            )}
          </div>
          {subtitle && <p className="t-body-sm text-[#A7B0C0]">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      </div>
      {rail}
    </header>
  )
}

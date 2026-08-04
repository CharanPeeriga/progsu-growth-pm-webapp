import { STATUS_STYLE, STATUS_ORDER, type Status } from "@/lib/design"

interface ThroughputRailProps {
  counts: Record<Status, number>
  height?: number
  showLegend?: boolean
}

/**
 * Server component now: no animation, no client JS. Each segment used to be a
 * framer-motion span animating its width (a layout-triggering property, so
 * every frame re-laid-out the row) plus a 12px glow shadow. A member card grid
 * renders one of these per card.
 */
export function ThroughputRail({ counts, height = 4, showLegend = false }: ThroughputRailProps) {
  const total = STATUS_ORDER.reduce((a, s) => a + (counts[s] ?? 0), 0) || 1

  return (
    <div>
      <div className="rail" style={{ height }}>
        {STATUS_ORDER.map((s) => {
          const pct = ((counts[s] ?? 0) / total) * 100
          if (pct === 0) return null
          return (
            <span
              key={s}
              className="rail-seg"
              style={{ width: `${pct}%`, background: STATUS_STYLE[s].base, opacity: 0.85 }}
            />
          )
        })}
      </div>
      {showLegend && (
        <div className="flex gap-4 mt-2.5">
          {STATUS_ORDER.map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: STATUS_STYLE[s].base }}
              />
              <span className="t-caption text-[#6E7686]">
                {STATUS_STYLE[s].label}{" "}
                <span className="font-mono text-[#A7B0C0]">{counts[s] ?? 0}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

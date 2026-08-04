import { STATUS_STYLE } from "@/lib/design"

interface CompletionDonutProps {
  rate: number
  done: number
  total: number
}

export function CompletionDonut({ rate, done, total }: CompletionDonutProps) {
  const size = 168
  const stroke = 12
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r

  return (
    <div className="surface-card halo-accent flex flex-col items-center justify-center gap-4 p-6">
      <span className="t-overline text-[#6E7686]">Completion rate</span>

      <div className="relative" style={{ width: size, height: size }}>
        {/* Static ring: no gradient def, no drop-shadow filter (SVG filters are
            re-rasterized on every repaint) and no 0.9s dash animation. */}
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={rate >= 100 ? STATUS_STYLE.done.base : "#6B8AFD"}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - (c * rate) / 100}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="font-mono text-[34px] font-medium leading-none tabular-nums text-[#E8EBF2]">
            {rate}
            <span className="text-[20px] text-[#6E7686]">%</span>
          </span>
          <span className="t-caption text-[#6E7686]">
            {done} of {total}
          </span>
        </div>
      </div>

      <p className="t-caption max-w-[220px] text-center text-[#A7B0C0]">
        Share of tasks marked done in the selected range.
      </p>
    </div>
  )
}

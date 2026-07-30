"use client"

import { motion } from "framer-motion"

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
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6B8AFD" />
              <stop offset="55%" stopColor="#8099FE" />
              <stop offset="100%" stopColor="#22C55E" />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c - (c * rate) / 100 }}
            transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1], delay: 0.15 }}
            style={{ filter: "drop-shadow(0 0 10px rgba(107,138,253,0.45))" }}
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

      <p className="t-caption max-w-[220px] text-center text-[#6E7686]">
        Share of tasks marked done in the selected range.
      </p>
    </div>
  )
}

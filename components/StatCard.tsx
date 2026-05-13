"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  hint?: string
  icon?: React.ReactNode
  className?: string
  accent?: boolean
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  className,
  accent = false,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 14 }}
      className={cn(
        "rounded-lg border border-border bg-card p-5 shadow-sm",
        accent && "ring-1 ring-primary/30 bg-primary/[0.04]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <p
        className={cn(
          "mt-3 text-4xl font-bold num text-foreground",
          accent && "text-primary"
        )}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
    </motion.div>
  )
}

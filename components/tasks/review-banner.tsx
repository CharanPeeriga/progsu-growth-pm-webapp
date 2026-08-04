"use client"

import { ShieldCheck, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { STATUS_STYLE } from "@/lib/design"

interface ReviewBannerProps {
  count: number
  onOpen: () => void
}

export function ReviewBanner({ count, onOpen }: ReviewBannerProps) {
  const s = STATUS_STYLE.review

  if (count === 0) return null

  return (
    <div
      className="surface-card relative overflow-hidden p-5"
      style={{ backgroundColor: s.fill, borderColor: s.border }}
    >
      <span className="absolute left-0 top-0 h-full w-[3px]" style={{ background: s.base }} />
      <div className="flex flex-wrap items-center justify-between gap-4 pl-2">
        <div className="flex items-start gap-3">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-chip border"
            style={{ borderColor: s.border, backgroundColor: s.fill, color: s.base }}
          >
            <ShieldCheck className="size-[17px]" />
          </span>
          <div className="flex flex-col gap-0.5">
            <p className="t-h3 text-[#E8EBF2]">
              {count} {count === 1 ? "task is" : "tasks are"} waiting on your review
            </p>
            <p className="t-body-sm text-[#A7B0C0]">
              Approve or send back with a note so the assignee knows what to fix.
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          style={{ borderColor: s.border, backgroundColor: s.fill, color: s.text }}
          onClick={onOpen}
        >
          Review now
          <ArrowRight className="size-[15px]" />
        </Button>
      </div>
    </div>
  )
}

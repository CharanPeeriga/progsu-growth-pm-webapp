"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ShieldCheck, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { STATUS_STYLE } from "@/lib/design"
import { T, EASE } from "@/lib/motion"

interface ReviewBannerProps {
  count: number
  onOpen: () => void
}

export function ReviewBanner({ count, onOpen }: ReviewBannerProps) {
  const s = STATUS_STYLE.review

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: T.enter, ease: EASE }}
          className="surface-card relative overflow-hidden p-5"
          style={{
            backgroundImage: `linear-gradient(160deg, ${s.fill} 0%, rgba(250,204,21,0.03) 45%, rgba(255,255,255,0.01) 100%)`,
            borderColor: s.border,
            boxShadow: `var(--shadow-card), 0 0 32px -8px ${s.border}`,
          }}
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
        </motion.div>
      )}
    </AnimatePresence>
  )
}

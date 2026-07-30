"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ShieldCheck, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"

interface ReviewBannerProps {
  count: number
  onOpen: () => void
}

export function ReviewBanner({ count, onOpen }: ReviewBannerProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
          className="surface-card relative overflow-hidden p-5"
          style={{
            backgroundImage:
              "linear-gradient(160deg, rgba(250,204,21,0.12) 0%, rgba(250,204,21,0.03) 45%, rgba(255,255,255,0.01) 100%)",
            borderColor: "rgba(250,204,21,0.28)",
            boxShadow: "var(--shadow-card), 0 0 32px -8px rgba(250,204,21,0.22)",
          }}
        >
          <span className="absolute left-0 top-0 h-full w-[3px] bg-[#FACC15]" />
          <div className="flex flex-wrap items-center justify-between gap-4 pl-2">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-chip border border-[rgba(250,204,21,0.32)] bg-[rgba(250,204,21,0.12)] text-[#FACC15]">
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
              className="border-[rgba(250,204,21,0.28)] bg-[rgba(250,204,21,0.10)] text-[#FDE68A] hover:bg-[rgba(250,204,21,0.16)]"
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

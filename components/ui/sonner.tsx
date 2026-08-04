"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

// The app is dark-only (<html class="dark">) and never mounted a ThemeProvider,
// so next-themes' useTheme() always fell back to "system" anyway — dropping it
// removes the whole package from the client bundle.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="bottom-right"
      gap={8}
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-[#22C55E]" />
        ),
        info: (
          <InfoIcon className="size-4 text-[#6B8AFD]" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 text-[#FACC15]" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-[#EF4444]" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "#0D0F14",
          "--normal-text": "#E8EBF2",
          "--normal-border": "var(--border-default)",
          "--border-radius": "var(--radius-card)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "cn-toast !w-[360px] !items-start !gap-3 !overflow-hidden !rounded-card !p-4 surface-glass !shadow-popover relative",
          title: "t-body-sm !font-medium !text-[#E8EBF2]",
          description: "t-caption !text-[#A7B0C0] !mt-0.5",
          icon: "!size-4",
          success: "before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:bg-[#22C55E]",
          error: "before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:bg-[#EF4444]",
          warning: "before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:bg-[#FACC15]",
          info: "before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:bg-[#6B8AFD]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

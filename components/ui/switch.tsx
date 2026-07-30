"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({ className, checked, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      checked={checked}
      className={cn(
        "inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-[160ms] ease-standard disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:shadow-[0_0_0_1px_var(--border-focus),0_0_0_4px_rgba(107,138,253,0.18)]",
        className
      )}
      style={{ backgroundColor: checked ? "#6B8AFD" : "rgba(255,255,255,0.10)" }}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="size-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.5)] transition-transform duration-[160ms] ease-standard"
        style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }

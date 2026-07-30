import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(function Input({ className, type, ...props }, ref) {
  return (
    <InputPrimitive
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full rounded-control bg-[#12151C] border border-[rgba(255,255,255,0.09)] px-3 text-[13.5px] text-[#E8EBF2] placeholder:text-[#4E5665] transition-[border-color,box-shadow,background] duration-[160ms] ease-standard hover:border-[rgba(255,255,255,0.14)] focus:outline-none focus:border-[rgba(107,138,253,0.55)] focus:shadow-[0_0_0_3px_rgba(107,138,253,0.18)] disabled:opacity-45 disabled:cursor-not-allowed aria-invalid:border-[rgba(239,68,68,0.45)]",
        className
      )}
      {...props}
    />
  )
})

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        "w-full min-h-[88px] rounded-control bg-[#12151C] border border-[rgba(255,255,255,0.09)] px-3 py-2.5 text-[13.5px] leading-[1.55] text-[#E8EBF2] placeholder:text-[#4E5665] resize-y transition-[border-color,box-shadow,background] duration-[160ms] ease-standard hover:border-[rgba(255,255,255,0.14)] focus:outline-none focus:border-[rgba(107,138,253,0.55)] focus:shadow-[0_0_0_3px_rgba(107,138,253,0.18)] disabled:opacity-45 disabled:cursor-not-allowed aria-invalid:border-[rgba(239,68,68,0.45)]",
        className
      )}
      {...props}
    />
  )
})

export { Input, Textarea }

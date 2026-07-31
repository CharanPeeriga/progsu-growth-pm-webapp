import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control font-body font-medium select-none transition-[transform,background,border-color,box-shadow,color] duration-[160ms] ease-standard active:scale-[0.97] active:duration-[120ms] disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-[15px]",
  {
    variants: {
      variant: {
        default: "btn-primary text-[#060911]",
        secondary:
          "bg-[#12151C] text-[#E8EBF2] border border-[rgba(255,255,255,0.09)] hover:bg-[#1A1F29] hover:border-[rgba(255,255,255,0.14)]",
        ghost:
          "bg-transparent text-[#A7B0C0] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#E8EBF2]",
        outline:
          "bg-transparent text-[#E8EBF2] border border-[rgba(255,255,255,0.14)] hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.22)]",
        accentGhost:
          "bg-[rgba(107,138,253,0.10)] text-[#C7D1FE] border border-[rgba(107,138,253,0.24)] hover:bg-[rgba(107,138,253,0.16)] hover:border-[rgba(107,138,253,0.38)]",
        destructive:
          "bg-[rgba(239,68,68,0.12)] text-[#FCA5A5] border border-[rgba(239,68,68,0.28)] hover:bg-[#EF4444] hover:text-white hover:border-[#EF4444]",
        link: "bg-transparent text-[#A3B4FE] underline-offset-4 hover:underline hover:text-[#C7D1FE] p-0 h-auto",
      },
      size: {
        sm: "h-8 px-3 text-[12.5px] rounded-chip",
        default: "h-9 px-3.5 text-[13.5px]",
        lg: "h-11 px-5 text-[14.5px]",
        icon: "h-9 w-9 p-0",
        iconSm: "h-[30px] w-[30px] p-0 rounded-chip",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonPrimitive.Props &
    VariantProps<typeof buttonVariants> & {
      loading?: boolean
    }
>(function Button(
  { className, variant = "default", size = "default", loading = false, disabled, children, ...props },
  ref
) {
  return (
    <ButtonPrimitive
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" />}
      {children}
    </ButtonPrimitive>
  )
})

export { Button, buttonVariants }

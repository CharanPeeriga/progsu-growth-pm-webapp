import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-[22px] w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border t-caption font-semibold px-2.5 whitespace-nowrap transition-all [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        neutral: "bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.09)] text-[#A7B0C0]",
        accent: "bg-[rgba(107,138,253,0.10)] border-[rgba(107,138,253,0.24)] text-[#C7D1FE]",
        success: "bg-[rgba(34,197,94,0.12)] border-[rgba(34,197,94,0.28)] text-[#86EFAC]",
        warning: "bg-[rgba(250,204,21,0.12)] border-[rgba(250,204,21,0.28)] text-[#FDE68A]",
        danger: "bg-[rgba(239,68,68,0.12)] border-[rgba(239,68,68,0.28)] text-[#FCA5A5]",
        info: "bg-[rgba(56,189,248,0.12)] border-[rgba(56,189,248,0.28)] text-[#7DD3FC]",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

function Badge({
  className,
  variant = "neutral",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }

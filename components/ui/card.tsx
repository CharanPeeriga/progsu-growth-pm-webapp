import * as React from "react"

import { cn } from "@/lib/utils"

function Card({
  className,
  variant = "default",
  interactive = false,
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "default" | "featured" | "glass"
  interactive?: boolean
}) {
  return (
    <div
      data-slot="card"
      className={cn(
        "p-0",
        variant === "default" && "surface-card",
        variant === "featured" && "surface-card surface-featured",
        variant === "glass" && "surface-glass rounded-card",
        interactive && "surface-card-interactive",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1 px-5 pt-5 pb-3", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("t-h3 text-[#E8EBF2]", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("t-body-sm text-[#6E7686]", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-5 pb-5", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center gap-2 px-5 pb-5 pt-0", className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }

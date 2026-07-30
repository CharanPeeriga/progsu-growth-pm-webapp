import * as React from "react"

import { cn } from "@/lib/utils"

const TableSectionContext = React.createContext<"header" | "body">("body")

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn("w-full border-collapse text-left", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <TableSectionContext.Provider value="header">
      <thead
        data-slot="table-header"
        className={cn("sticky top-0 z-10", className)}
        {...props}
      />
    </TableSectionContext.Provider>
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <TableSectionContext.Provider value="body">
      <tbody data-slot="table-body" className={cn(className)} {...props} />
    </TableSectionContext.Provider>
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("border-t border-[rgba(255,255,255,0.09)]", className)}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  const section = React.useContext(TableSectionContext)
  return (
    <tr
      data-slot="table-row"
      className={cn(
        section === "header"
          ? "h-10 surface-glass !border-0 !border-b !border-b-[rgba(255,255,255,0.09)] rounded-none"
          : "group relative h-[52px] border-b border-[rgba(255,255,255,0.05)] transition-colors duration-[160ms] ease-standard hover:bg-[rgba(255,255,255,0.035)] data-[state=selected]:bg-[rgba(107,138,253,0.07)]",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "t-overline text-[#6E7686] h-10 px-4 whitespace-nowrap align-middle text-left font-semibold",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn("px-4 align-middle text-[13.5px] text-[#A7B0C0]", className)}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("t-body-sm text-[#6E7686] mt-4", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}

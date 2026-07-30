"use client"

import * as React from "react"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

function SearchInput({
  className,
  showShortcut = true,
  ...props
}: React.ComponentProps<"input"> & { showShortcut?: boolean }) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-[15px] -translate-y-1/2 text-[#6E7686]" />
      <Input
        ref={inputRef}
        className={cn("pl-9", showShortcut && "pr-14", className)}
        {...props}
      />
      {showShortcut && (
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-[6px] border border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.04)] px-1.5 py-0.5 font-mono text-[10px] text-[#6E7686]">
          ⌘K
        </kbd>
      )}
    </div>
  )
}

export { SearchInput }

"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BarChart2, CheckSquare, LogOut, Users } from "lucide-react"
import { createBrowserSupabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/team", label: "Team", icon: Users },
  { href: "/progress", label: "Progress", icon: BarChart2 },
]

interface NavbarProps {
  email: string | null
}

export function Navbar({ email }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = React.useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    try {
      const supabase = createBrowserSupabase()
      await supabase.auth.signOut()
      router.push("/login")
      router.refresh()
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card md:flex">
      <div className="px-6 pt-7 pb-6">
        <Link
          href="/tasks"
          className="text-lg font-bold tracking-tight text-primary"
        >
          growth-pm-bot
        </Link>
        <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
          Admin Dashboard
        </p>
      </div>

      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  {active && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-primary"
                    />
                  )}
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-border px-4 py-4">
        <p
          className="truncate text-xs text-muted-foreground"
          title={email ?? undefined}
        >
          {email ?? "Signed in"}
        </p>
        <Button
          onClick={handleSignOut}
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          disabled={signingOut}
        >
          <LogOut className="h-4 w-4" />
          {signingOut ? "Signing out..." : "Logout"}
        </Button>
      </div>
    </aside>
  )
}

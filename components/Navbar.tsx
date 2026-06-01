"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CheckSquare, Users, BarChart2, LogOut, CalendarDays, CalendarCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/events", label: "Events", icon: CalendarCheck },
  { href: "/team", label: "Team", icon: Users },
  { href: "/progress", label: "Progress", icon: BarChart2 },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="sidebar-gradient w-56 h-screen sticky top-0 border-r border-border flex flex-col shrink-0 overflow-hidden">
      <div className="px-5 py-6 border-b border-border">
        <span className="text-base font-semibold text-primary tracking-tight">
          growth-pm-bot
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 border-l-2",
                isActive
                  ? "border-primary text-primary bg-primary/10"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-border px-4 pt-4 pb-5">
        {email && (
          <p className="text-xs text-muted-foreground truncate mb-3 px-1">
            {email}
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground text-xs"
          onClick={handleLogout}
        >
          <LogOut size={14} />
          Sign out
        </Button>
      </div>
    </aside>
  );
}

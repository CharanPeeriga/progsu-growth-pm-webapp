"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ListChecks,
  CalendarDays,
  Users,
  Sparkles,
  TrendingUp,
  PanelLeftClose,
  PanelLeftOpen,
  MoreVertical,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const navGroups = [
  {
    label: "WORK",
    items: [
      { href: "/tasks", label: "Tasks", icon: ListChecks },
      { href: "/calendar", label: "Calendar", icon: CalendarDays },
    ],
  },
  {
    label: "CLUB",
    items: [
      { href: "/team", label: "Team", icon: Users },
      { href: "/events", label: "Events", icon: Sparkles },
      { href: "/progress", label: "Progress", icon: TrendingUp },
    ],
  },
];

const COLLAPSE_KEY = "pm.sidebar.collapsed";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "true");
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem(COLLAPSE_KEY, String(collapsed));
  }, [collapsed, mounted]);

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

  const initials = email ? email.slice(0, 2).toUpperCase() : "?";

  return (
    <TooltipProvider>
      <motion.aside
        animate={{ width: collapsed ? 68 : 248 }}
        transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
        className="sticky top-0 z-40 flex h-screen shrink-0 flex-col overflow-hidden bg-[rgba(10,12,17,0.85)] backdrop-blur-[16px] border-r border-[rgba(255,255,255,0.06)]"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[rgba(255,255,255,0.02)] to-transparent" />

        {/* Brand */}
        <div className="relative flex h-16 shrink-0 items-center gap-2.5 px-4">
          <span
            className="grid size-[30px] shrink-0 place-items-center rounded-chip font-display text-[15px] font-semibold text-[#060911]"
            style={{ backgroundImage: "var(--grad-btn)", boxShadow: "var(--shadow-btn)" }}
          >
            p
          </span>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-display text-[15px] font-semibold tracking-[-0.02em] text-[#E8EBF2]">
                progsu
              </span>
              <span className="t-overline text-[9.5px] text-[#6E7686]">TASK MANAGER</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="relative flex-1 overflow-y-auto overflow-x-hidden">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <div className="t-overline px-3 pt-5 pb-2 text-[10px] text-[#6E7686]">
                  {group.label}
                </div>
              )}
              {group.items.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(href + "/");
                const link = (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "relative mx-2 flex h-9 items-center gap-2.5 rounded-control px-3 text-[13.5px] font-medium transition-colors duration-[160ms] ease-standard",
                      isActive
                        ? "bg-[rgba(107,138,253,0.10)] text-[#C7D1FE] shadow-[inset_0_0_0_1px_rgba(107,138,253,0.22)] [&_svg]:text-[#8099FE]"
                        : "text-[#A7B0C0] [&_svg]:text-[#6E7686] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#E8EBF2] hover:[&_svg]:text-[#A7B0C0]",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    {isActive && (
                      <span className="absolute -left-2 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-[#6B8AFD] shadow-[0_0_8px_0_rgba(107,138,253,0.7)]" />
                    )}
                    <Icon className="size-4 shrink-0" />
                    {!collapsed && label}
                  </Link>
                );

                if (!collapsed) return link;

                return (
                  <Tooltip key={href}>
                    <TooltipTrigger render={link} />
                    <TooltipContent>{label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="relative shrink-0 px-2 pb-2">
          <Button
            variant="ghost"
            size="iconSm"
            className="w-full"
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
        </div>

        {/* User block */}
        <div className="relative mt-auto shrink-0">
          <div className="divider-grad mx-3" />
          <div className="flex items-center gap-2.5 p-3">
            <span className="grid size-[30px] shrink-0 place-items-center rounded-full bg-[rgba(107,138,253,0.12)] font-mono text-[11px] text-[#C7D1FE] ring-1 ring-[rgba(107,138,253,0.35)]">
              {initials}
            </span>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[#E8EBF2]">
                    {email ?? "…"}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="iconSm">
                        <MoreVertical />
                      </Button>
                    }
                  />
                  <DropdownMenuContent
                    className="rounded-[12px] border border-[rgba(255,255,255,0.09)] bg-[#171B23] p-1 shadow-popover"
                    side="top"
                    align="end"
                  >
                    <DropdownMenuItem
                      className="h-8 gap-2 rounded-chip px-2.5 text-[13px] text-[#FCA5A5]"
                      onClick={handleLogout}
                    >
                      <LogOut className="size-[14px]" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}

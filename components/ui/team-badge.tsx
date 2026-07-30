import { cn } from "@/lib/utils";
import type { TeamName } from "@/lib/types";
import { TEAM_STYLE } from "@/lib/design";

const TEAM_LABELS: Record<TeamName, string> = Object.fromEntries(
  (Object.keys(TEAM_STYLE) as TeamName[]).map((team) => [team, TEAM_STYLE[team].label])
) as Record<TeamName, string>;

export function TeamBadge({ team, className }: { team: TeamName; className?: string }) {
  const t = TEAM_STYLE[team];
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 rounded-full border px-2.5 t-caption font-semibold tracking-[0.02em]",
        className
      )}
      style={{ backgroundColor: t.fill, borderColor: t.border, color: t.text }}
    >
      <span className="h-3 w-[3px] rounded-full" style={{ backgroundColor: t.base }} />
      {t.label}
    </span>
  );
}

// Static (Tailwind-scannable) equivalents of the TEAM_STYLE tokens, for call sites
// that need plain class strings (e.g. tab active-state) rather than inline styles.
const TEAM_STYLES: Record<TeamName, string> = {
  growth: "bg-cyan-400/10 text-cyan-300 border-cyan-400/25",
  tech: "bg-violet-400/10 text-violet-300 border-violet-400/25",
  operations: "bg-orange-400/10 text-orange-300 border-orange-400/25",
  progirls: "bg-pink-400/10 text-pink-300 border-pink-400/25",
};

const TEAM_TAB_ACTIVE: Record<TeamName, string> = {
  growth: "bg-cyan-400/10 text-cyan-300",
  tech: "bg-violet-400/10 text-violet-300",
  operations: "bg-orange-400/10 text-orange-300",
  progirls: "bg-pink-400/10 text-pink-300",
};

export function teamTabClass(team: TeamName, active: boolean): string {
  if (!active) return "text-[#6E7686] hover:text-[#E8EBF2]";
  return TEAM_TAB_ACTIVE[team];
}

export { TEAM_LABELS, TEAM_STYLES };

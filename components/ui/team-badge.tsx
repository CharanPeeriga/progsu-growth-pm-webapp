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
// These reference the same CSS custom properties as TEAM_STYLE, not duplicated hex.
const TEAM_STYLES: Record<TeamName, string> = {
  growth: "bg-[var(--team-growth-fill)] text-[var(--team-growth-text)] border-[var(--team-growth-border)]",
  tech: "bg-[var(--team-tech-fill)] text-[var(--team-tech-text)] border-[var(--team-tech-border)]",
  operations: "bg-[var(--team-operations-fill)] text-[var(--team-operations-text)] border-[var(--team-operations-border)]",
  progirls: "bg-[var(--team-progirls-fill)] text-[var(--team-progirls-text)] border-[var(--team-progirls-border)]",
};

const TEAM_TAB_ACTIVE: Record<TeamName, string> = {
  growth: "bg-[var(--team-growth-fill)] text-[var(--team-growth-text)]",
  tech: "bg-[var(--team-tech-fill)] text-[var(--team-tech-text)]",
  operations: "bg-[var(--team-operations-fill)] text-[var(--team-operations-text)]",
  progirls: "bg-[var(--team-progirls-fill)] text-[var(--team-progirls-text)]",
};

export function teamTabClass(team: TeamName, active: boolean): string {
  if (!active) return "text-[#6E7686] hover:text-[#E8EBF2]";
  return TEAM_TAB_ACTIVE[team];
}

export { TEAM_LABELS, TEAM_STYLES };

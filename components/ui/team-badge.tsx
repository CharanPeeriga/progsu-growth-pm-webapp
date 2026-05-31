import { cn } from "@/lib/utils";
import type { TeamName } from "@/lib/types";

const TEAM_STYLES: Record<TeamName, string> = {
  growth: "bg-green-950/60 text-green-400 border-green-900/40",
  tech: "bg-blue-950/60 text-blue-400 border-blue-900/40",
  operations: "bg-orange-950/60 text-orange-400 border-orange-900/40",
};

const TEAM_LABELS: Record<TeamName, string> = {
  growth: "Growth",
  tech: "Tech",
  operations: "Operations",
};

export function TeamBadge({ team, className }: { team: TeamName; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border",
        TEAM_STYLES[team],
        className
      )}
    >
      {TEAM_LABELS[team]}
    </span>
  );
}

export function teamTabClass(team: TeamName, active: boolean): string {
  if (!active) return "text-muted-foreground hover:text-foreground";
  const map: Record<TeamName, string> = {
    growth: "bg-green-900/40 text-green-400",
    tech: "bg-blue-900/40 text-blue-400",
    operations: "bg-orange-900/40 text-orange-400",
  };
  return map[team];
}

export { TEAM_LABELS, TEAM_STYLES };

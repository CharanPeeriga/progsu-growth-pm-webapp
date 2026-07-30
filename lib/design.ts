export type Team = "growth" | "tech" | "operations" | "progirls";
export type Status = "todo" | "in_progress" | "review" | "done";

export const TEAM_STYLE: Record<Team, { label: string; base: string; text: string; fill: string; border: string }> = {
  growth:     { label: "Growth",     base: "#22D3EE", text: "#67E8F9", fill: "rgba(34,211,238,0.12)",  border: "rgba(34,211,238,0.28)" },
  tech:       { label: "Tech",       base: "#A78BFA", text: "#C4B5FD", fill: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.28)" },
  operations: { label: "Operations", base: "#FB923C", text: "#FDBA74", fill: "rgba(251,146,60,0.12)",  border: "rgba(251,146,60,0.28)" },
  progirls:   { label: "Progirls",   base: "#F472B6", text: "#F9A8D4", fill: "rgba(244,114,182,0.12)", border: "rgba(244,114,182,0.28)" },
};

export const STATUS_STYLE: Record<Status, { label: string; base: string; text: string; fill: string; border: string }> = {
  todo:        { label: "To do",       base: "#94A3B8", text: "#CBD5E1", fill: "rgba(148,163,184,0.10)", border: "rgba(148,163,184,0.22)" },
  in_progress: { label: "In progress", base: "#6B8AFD", text: "#C7D1FE", fill: "rgba(107,138,253,0.12)", border: "rgba(107,138,253,0.30)" },
  review:      { label: "In review",   base: "#FACC15", text: "#FDE68A", fill: "rgba(250,204,21,0.12)",  border: "rgba(250,204,21,0.28)" },
  done:        { label: "Done",        base: "#22C55E", text: "#86EFAC", fill: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.28)" },
};

export const STATUS_ORDER: Status[] = ["todo", "in_progress", "review", "done"];

export type EventCategory = "workshop" | "social" | "meeting" | "external";

export const EVENT_CATEGORY: Record<EventCategory, { label: string; base: string; text: string; fill: string; border: string }> = {
  workshop: { label: "Workshop",  base: "#6B8AFD", text: "#C7D1FE", fill: "rgba(107,138,253,0.12)", border: "rgba(107,138,253,0.28)" },
  social:   { label: "Social",    base: "#F472B6", text: "#F9A8D4", fill: "rgba(244,114,182,0.12)", border: "rgba(244,114,182,0.28)" },
  meeting:  { label: "Meeting",   base: "#A78BFA", text: "#C4B5FD", fill: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.28)" },
  external: { label: "External",  base: "#22D3EE", text: "#67E8F9", fill: "rgba(34,211,238,0.12)",  border: "rgba(34,211,238,0.28)" },
};

export const MOTION = {
  ease: [0.2, 0.8, 0.2, 1] as const,
  enter: { duration: 0.22 },
  stagger: 0.045,
  spring: { type: "spring" as const, stiffness: 260, damping: 24 },
};

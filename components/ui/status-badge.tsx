import { STATUS_STYLE, type Status } from "@/lib/design";

export function StatusBadge({ status }: { status: Status }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className="inline-flex h-[22px] items-center gap-1.5 rounded-full border px-2.5 t-caption font-semibold tracking-[0.02em]"
      style={{ backgroundColor: s.fill, borderColor: s.border, color: s.text }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: s.base }} />
      {s.label}
    </span>
  );
}

# Meridian design system

**Tokens** — CSS custom properties in `app/globals.css` (`--ink-*`, `--accent-*`, `--team-*`, `--status-*`, semantic `--success/--warning/--danger/--info`, `--grad-*`, `--shadow-*`, `--radius-*`). JS lookups for dynamic color in `lib/design.ts`: `TEAM_STYLE`, `STATUS_STYLE`, `EVENT_CATEGORY` — never hardcode a team/status hex, read these (or the matching CSS var).

**Type roles** — three fonts, one job each: `font-display` (Space Grotesk, `t-display-lg`/`t-display`/`t-h1..t-h3`) for headings; `font-body` (Inter, `t-body*`/`t-label`/`t-caption`/`t-overline`) for everything else; `font-mono` (JetBrains Mono, `t-mono`/`t-stat*`, always `tabular-nums`) for any number meant to be compared.

**Throughput rail** — the app's signature element (`components/ui/throughput-rail.tsx`), one shared component at three scales: page header (`height=4`), team breakdown (`height=6`), table row (`height=3`–`5`). Always reads `STATUS_STYLE`/`STATUS_ORDER`.

**Surfaces** — `.surface-card` (default), `.surface-featured` (accent gradient + glow), `.surface-glass` (blur, reserved for page headers, sidebar, dialogs/sheets, toasts only), `.surface-card-interactive` (hover lift modifier, stack with any of the above).

**Motion** — everything imports from `lib/motion.ts`: `EASE`, `T` (`press`/`hover`/`enter`/`modal`), `spring`, and variant sets `pageVariants`, `staggerParent`/`staggerChild`/`fadeChild` (via `<Stagger>`/`<StaggerItem>`), `sheetVariants`, `modalVariants`, `toastVariants`. Only exceptions: throughput rail (0.5s) and completion donut (0.9s).

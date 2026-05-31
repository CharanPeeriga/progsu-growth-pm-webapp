# progsu Task Management System — Web App

A Next.js 14 admin dashboard for the progsu Discord bot PM system. Manages tasks, team members, VP roles, and collaborators. Shares a Supabase database with the Discord bot (`progsu-growth-pm-bot`) — changes here reflect immediately in bot queries and vice versa.

---

## Features

### Dashboard Pages

**Tasks** (`/tasks`)
- Full task table with ID, task name, assignee, assigner, status, team badge, collaborators, due date
- Team filter tabs: All Teams / Growth / Tech / Operations
- Status filter tabs: All / Todo / In Progress / In Review / Done
- Free-text search across task name and assignee
- Analytics bar: total tasks, completion rate, in-review count, overdue count (all scoped to active filters)
- Review banner with quick "View" shortcut when tasks are pending review
- Due date colour coding: red = overdue, yellow = due within 2 days
- Collaborator pills per task: green ✅ = submitted, grey ⏳ = pending
- Assign Task panel (slide-in sheet):
  - Team dropdown (required)
  - Assignee dropdown populated from team members
  - Collaborators multi-select with removable tags
  - Task name, due date, status
  - Post-assign Discord notification warnings (DM fallback / notify failed)
- Edit Task panel: same fields, pre-filled from existing task
- Delete confirmation dialog
- Send-back dialog (sets task to In Progress with optional rejection reason)
- Approve button on In Review tasks (sets to Done)

**Team** (`/team`)
- Team filter tabs: All / Growth / Tech / Operations
- Member cards with stats (completed, pending, in review, overdue) and team badge
- Add Member form: Discord user ID, display name, team dropdown
- "View Tasks" shortcut per member (links to Tasks page pre-filtered by user ID)
- Unregistered assignees section: lists Discord IDs with tasks but no member record, with one-click "Add to Team"
- VP Roles section:
  - Current VP per team (Growth / Tech / Operations) with Remove button
  - Set VP form: member dropdown + team dropdown
  - Remove VP confirmation dialog

**Progress** (`/progress`)
- Team filter tabs + All Time / This Week timeframe toggle
- Overview stat cards: total assigned, completed, pending, overdue
- Animated completion rate progress bar
- Per-person table: member name, team badge, completed, pending, overdue, oldest overdue task
- Upcoming deadlines list (next 5 tasks with due dates, with team badge)

**Calendar** (`/calendar`)
- Monthly/weekly calendar view of task due dates
- Team filter tabs: All Teams / Growth / Tech / Operations
- Event colour matches team (green = Growth, blue = Tech, orange = Operations)
- Drag-to-reschedule updates due date via API
- Delete task from calendar view

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (shared with Discord bot)
- **Auth**: Supabase Auth via `@supabase/ssr` (cookie-based, SSR-compatible)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Toasts**: Sonner

---

## Database Schema

Shared tables (also used by the Discord bot):

| Table | Description |
|---|---|
| `tasks` | All tasks: `id, guild_id, assignee_id, assigner_id, task_name, due_date, status, team, created_at, reminded, reminded_2day, reminded_day_of, rejection_reason` |
| `team_members` | Registered members: `id, guild_id, user_id, display_name, team, added_at` |
| `reminder_channels` | Per-user Discord channels set via `/setchannel` |
| `task_collaborators` | `id, task_id, user_id, submitted, submitted_at` |
| `vp_roles` | `id, guild_id, user_id, team, added_by, added_at` |
| `team_channels` | `id, guild_id, team, channel_id` |

> Do not add webapp-only columns to `tasks` or `team_members`.

---

## API Routes

| Method | Route | Description |
|---|---|---|
| GET | `/api/tasks` | List tasks (optional `?team=` filter) |
| POST | `/api/tasks` | Create task + insert collaborators + notify bot |
| PATCH | `/api/tasks/[id]` | Update task + fire approved/rejected/edited event |
| DELETE | `/api/tasks/[id]` | Delete task + fire deleted event |
| GET | `/api/team-members` | List team members |
| POST | `/api/team-members` | Add member + notify bot |
| DELETE | `/api/team-members/[userId]` | Remove member |
| GET | `/api/collaborators` | List collaborators (by `?task_id=` or all for guild) |
| POST | `/api/collaborators` | Add collaborator to task |
| DELETE | `/api/collaborators` | Remove collaborator from task |
| GET | `/api/vp-roles` | List VP roles for guild |
| POST | `/api/vp-roles` | Set VP role (upserts on guild_id + user_id) |
| DELETE | `/api/vp-roles` | Remove VP role by user_id |

All routes use the `SUPABASE_SERVICE_ROLE_KEY` (server-only) to bypass RLS.

---

## Bot Notify Integration

After every mutating operation, the webapp fires an event to the Discord bot's `/notify` endpoint:

| Event | Trigger |
|---|---|
| `task_assigned` | New task created |
| `task_approved` | Task status → done |
| `task_rejected` | Task status → in_progress with rejection reason |
| `task_edited` | Task name or due date changed |
| `task_deleted` | Task deleted |
| `member_added` | New team member added |

If `BOT_NOTIFY_URL` is not set, the operation still succeeds — a warning is logged and the notify call is skipped.

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_DISCORD_GUILD_ID=
NEXT_PUBLIC_APP_URL=http://localhost:3000
TEST_ADMIN_EMAIL=
TEST_ADMIN_PASSWORD=
SUPABASE_SERVICE_ROLE_KEY=
BOT_NOTIFY_SECRET=same_value_as_bot
BOT_NOTIFY_URL=https://your-railway-app.railway.app/notify
```

`SUPABASE_SERVICE_ROLE_KEY`, `BOT_NOTIFY_SECRET`, and `BOT_NOTIFY_URL` are server-only (no `NEXT_PUBLIC_` prefix) and are never sent to the browser.

---

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with the credentials set in `TEST_ADMIN_EMAIL` / `TEST_ADMIN_PASSWORD`.

---

## Deployment

Branch `growth-charan` is the active development branch. All data operations go through server-side API routes, so the service role key is always used regardless of deployment environment.

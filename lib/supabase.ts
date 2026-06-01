// SHARED DATABASE — Both this webapp and the Discord bot
// (progsu-growth-pm-bot) read from and write to this same
// Supabase instance. Any task created, updated, or deleted
// here will immediately reflect in Discord bot queries and
// vice versa. The only webapp-specific tables are:
// - team_members (managed here and by /addmember, /removemember)
// - reminder_channels (managed by /setchannel in the bot)
// Do not add any webapp-only columns to the tasks table.

import { createBrowserClient } from '@supabase/ssr';
import type { DBTask, NewTask, TeamMember, TeamName, VPRole, TaskCollaborator, GuildCalendarEvent, NewGuildCalendarEvent } from './types';

// All data operations go through server-side API routes so the
// service-role key is always used, regardless of whether the caller
// is a browser component or a Node.js test. The service-role key is
// not a NEXT_PUBLIC_ var and is therefore undefined in the browser.

function apiBase(): string {
  return typeof (global as Record<string, unknown>).window === 'undefined'
    ? (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')
    : '';
}

async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const json = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(json.error ?? `HTTP ${res.status}`);
  }
  return res;
}

/**
 * Browser auth client — uses createBrowserClient from @supabase/ssr so
 * auth cookies are written in the format the middleware can read.
 * Call this inside components/hooks; do not cache at module level.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function resetClient() {
  // no-op kept for backwards compatibility with any test imports
}

export async function fetchAllTasks(team?: TeamName): Promise<DBTask[]> {
  const url = team
    ? `${apiBase()}/api/tasks?team=${encodeURIComponent(team)}`
    : `${apiBase()}/api/tasks`;
  const res = await apiFetch(url);
  return res.json();
}

export async function insertTask(
  task: NewTask & { guild_id: string; team: TeamName; collaborator_ids?: string[] }
): Promise<{ task: DBTask; notification: unknown }> {
  const due_date = task.due_date === '' ? null : task.due_date;
  const res = await apiFetch(`${apiBase()}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assignee_id: task.assignee_id,
      task_name: task.task_name,
      due_date,
      status: task.status,
      team: task.team,
      collaborator_ids: task.collaborator_ids ?? [],
    }),
  });
  return res.json();
}

export async function updateTask(
  id: number,
  updates: Partial<DBTask>
): Promise<DBTask> {
  const res = await apiFetch(`${apiBase()}/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function deleteTask(id: number): Promise<void> {
  await apiFetch(`${apiBase()}/api/tasks/${id}`, { method: 'DELETE' });
}

export async function fetchTeamMembers(_guildId: string): Promise<TeamMember[]> {
  const res = await apiFetch(`${apiBase()}/api/team-members`);
  return res.json();
}

export async function addTeamMember(
  _guildId: string,
  userId: string,
  displayName: string,
  team?: TeamName
): Promise<TeamMember> {
  const res = await apiFetch(`${apiBase()}/api/team-members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, display_name: displayName || null, team: team ?? 'growth' }),
  });
  return res.json();
}

export async function removeTeamMember(
  _guildId: string,
  userId: string
): Promise<void> {
  await apiFetch(
    `${apiBase()}/api/team-members/${encodeURIComponent(userId)}`,
    { method: 'DELETE' }
  );
}

export async function fetchCollaborators(taskId: number): Promise<TaskCollaborator[]> {
  const res = await apiFetch(`${apiBase()}/api/collaborators?task_id=${taskId}`);
  return res.json();
}

export async function fetchAllCollaborators(): Promise<TaskCollaborator[]> {
  const res = await apiFetch(`${apiBase()}/api/collaborators`);
  return res.json();
}

export async function addCollaborator(taskId: number, userId: string): Promise<TaskCollaborator> {
  const res = await apiFetch(`${apiBase()}/api/collaborators`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_id: taskId, user_id: userId }),
  });
  return res.json();
}

export async function removeCollaborator(taskId: number, userId: string): Promise<void> {
  await apiFetch(`${apiBase()}/api/collaborators`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_id: taskId, user_id: userId }),
  });
}

export async function fetchVPRoles(): Promise<VPRole[]> {
  const res = await apiFetch(`${apiBase()}/api/vp-roles`);
  return res.json();
}

export async function addVPRole(userId: string, team: TeamName): Promise<VPRole> {
  const res = await apiFetch(`${apiBase()}/api/vp-roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, team }),
  });
  return res.json();
}

export async function removeVPRole(userId: string, team: TeamName): Promise<void> {
  await apiFetch(`${apiBase()}/api/vp-roles`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, team }),
  });
}

export async function fetchCalendarEvents(): Promise<GuildCalendarEvent[]> {
  const res = await apiFetch(`${apiBase()}/api/events`);
  return res.json();
}

export async function createCalendarEvent(event: NewGuildCalendarEvent): Promise<GuildCalendarEvent> {
  const res = await apiFetch(`${apiBase()}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  return res.json();
}

export async function updateCalendarEvent(id: number, updates: Partial<GuildCalendarEvent>): Promise<GuildCalendarEvent> {
  const res = await apiFetch(`${apiBase()}/api/events/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function deleteCalendarEvent(id: number): Promise<void> {
  await apiFetch(`${apiBase()}/api/events/${id}`, { method: 'DELETE' });
}

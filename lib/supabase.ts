// SHARED DATABASE — Both this webapp and the Discord bot
// (progsu-growth-pm-bot) read from and write to this same
// Supabase instance. Any task created, updated, or deleted
// here will immediately reflect in Discord bot queries and
// vice versa. The only webapp-specific tables are:
// - team_members (managed here and by /addmember, /removemember)
// - reminder_channels (managed by /setchannel in the bot)
// Do not add any webapp-only columns to the tasks table.

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { DBTask, NewTask, TeamMember } from './types';

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
 * Anon-key singleton — used for auth operations only.
 */
let _authClient: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (!_authClient) {
    _authClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _authClient;
}

export function resetClient() {
  _authClient = null;
}

export async function fetchAllTasks(_guildId: string): Promise<DBTask[]> {
  const res = await apiFetch(`${apiBase()}/api/tasks`);
  return res.json();
}

export async function insertTask(
  task: NewTask & { guild_id: string }
): Promise<DBTask> {
  const due_date = task.due_date === '' ? null : task.due_date;
  const res = await apiFetch(`${apiBase()}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assignee_id: task.assignee_id,
      task_name: task.task_name,
      due_date,
      status: task.status,
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
  displayName: string
): Promise<TeamMember> {
  const res = await apiFetch(`${apiBase()}/api/team-members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, display_name: displayName || null }),
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

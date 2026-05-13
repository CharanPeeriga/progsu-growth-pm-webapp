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

/**
 * Service-role client — bypasses RLS entirely.
 * Falls back to the anon key if the service role key is not available
 * (e.g. in the browser where NEXT_PUBLIC_* env vars are the only ones exposed).
 */
function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

/**
 * Anon-key singleton — used for auth operations only.
 * Data operations use the service client so RLS can never interfere.
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

function supabaseError(err: unknown): Error {
  if (err instanceof Error) return err;
  const e = err as { message?: string };
  return new Error(e?.message ?? JSON.stringify(err));
}

export async function fetchAllTasks(guildId: string): Promise<DBTask[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('guild_id', guildId)
    .order('created_at', { ascending: false });
  if (error) throw supabaseError(error);
  return data as DBTask[] || [];
}

/**
 * Inserts a task via the server-side API route so the service-role key
 * is used server-side. In Node.js (tests) there is no window, so an
 * absolute URL is required.
 */
export async function insertTask(
  task: NewTask & { guild_id: string }
): Promise<DBTask> {
  const due_date = task.due_date === '' ? null : task.due_date;

  const base =
    typeof (global as Record<string, unknown>).window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')
      : '';

  const res = await fetch(`${base}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assignee_id: task.assignee_id,
      task_name: task.task_name,
      due_date,
      status: task.status,
    }),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(json.error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<DBTask>;
}

export async function updateTask(
  id: number,
  updates: Partial<DBTask>
): Promise<DBTask> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw supabaseError(error);
  if (!data) throw new Error(`Task ${id} not found`);
  return data as DBTask;
}

export async function deleteTask(id: number): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw supabaseError(error);
}

export async function fetchTeamMembers(guildId: string): Promise<TeamMember[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('guild_id', guildId)
    .order('added_at', { ascending: false });
  if (error) throw supabaseError(error);
  return data as TeamMember[] || [];
}

export async function addTeamMember(
  guildId: string,
  userId: string,
  displayName: string
): Promise<TeamMember> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;
  const { data, error } = await supabase
    .from('team_members')
    .insert({
      guild_id: guildId,
      user_id: userId,
      display_name: displayName || null,
    })
    .select()
    .single();
  if (error) throw supabaseError(error);
  return data as TeamMember;
}

export async function removeTeamMember(
  guildId: string,
  userId: string
): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('guild_id', guildId)
    .eq('user_id', userId);
  if (error) throw supabaseError(error);
}

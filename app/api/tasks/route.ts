import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function makeClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(request: Request) {
  const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
  if (!guildId || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const team = searchParams.get('team');

  const supabase = makeClient();
  let query = supabase
    .from('tasks')
    .select('*')
    .eq('guild_id', guildId)
    .order('created_at', { ascending: false });

  if (team) query = query.eq('team', team);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { assignee_id, task_name, due_date, status, team, collaborator_ids } = body as {
    assignee_id?: string;
    task_name?: string;
    due_date?: string | null;
    status?: string;
    team?: string;
    collaborator_ids?: string[];
  };

  if (!assignee_id || typeof assignee_id !== 'string' || !assignee_id.trim()) {
    return NextResponse.json({ error: 'assignee_id is required' }, { status: 400 });
  }
  if (!task_name || typeof task_name !== 'string' || !task_name.trim()) {
    return NextResponse.json({ error: 'task_name is required' }, { status: 400 });
  }
  if (!team) {
    return NextResponse.json({ error: 'team is required' }, { status: 400 });
  }

  const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
  if (!guildId || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const supabase = makeClient();
  const normalizedDueDate = due_date === '' || due_date === undefined ? null : due_date;

  const { data: insertedTask, error: insertError } = await supabase
    .from('tasks')
    .insert({
      guild_id: guildId,
      assignee_id: assignee_id.trim(),
      assigner_id: 'dashboard',
      task_name: task_name.trim(),
      due_date: normalizedDueDate,
      status: status ?? 'todo',
      team,
      reminded: false,
      reminded_2day: false,
      reminded_day_of: false,
      rejection_reason: null,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Supabase insert error:', insertError);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const collaboratorIds = Array.isArray(collaborator_ids) ? collaborator_ids : [];
  if (collaboratorIds.length > 0) {
    const { error: collabError } = await supabase
      .from('task_collaborators')
      .insert(collaboratorIds.map((uid) => ({ task_id: insertedTask.id, user_id: uid })));
    if (collabError) {
      console.error('Collaborator insert error:', collabError);
    }
  }

  let notifyResult: unknown = null;
  const notifyUrl = process.env.BOT_NOTIFY_URL;
  const notifySecret = process.env.BOT_NOTIFY_SECRET;
  if (notifyUrl && notifySecret) {
    try {
      const notifyRes = await fetch(notifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${notifySecret}`,
        },
        body: JSON.stringify({
          event: 'task_assigned',
          task_id: insertedTask.id,
          task_name: insertedTask.task_name,
          assignee_id: insertedTask.assignee_id,
          due_date: insertedTask.due_date,
          team: insertedTask.team,
          collaborator_ids: collaboratorIds,
        }),
      });
      notifyResult = await notifyRes.json();
    } catch (err) {
      console.error('Bot notify failed:', err);
    }
  }

  return NextResponse.json({ task: insertedTask, notification: notifyResult });
}

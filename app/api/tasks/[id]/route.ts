import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function makeClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function notifyBot(body: Record<string, unknown>): Promise<void> {
  const url = process.env.BOT_NOTIFY_URL;
  const secret = process.env.BOT_NOTIFY_SECRET;
  if (!url) {
    console.warn('BOT_NOTIFY_URL not set — skipping Discord notify');
    return;
  }
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error('Bot notify failed:', err);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  let updates: Record<string, unknown>;
  try {
    updates = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = makeClient() as any;

  // Fetch the current task to detect what changed
  const { data: oldTask, error: fetchError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!oldTask) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;

  const statusChanged = 'status' in updates && updates.status !== oldTask.status;
  const rejectionSet = 'rejection_reason' in updates && updates.rejection_reason;

  if (statusChanged && updates.status === 'done') {
    await notifyBot({
      event: 'task_approved',
      guild_id: guildId,
      task_id: id,
      task_name: data.task_name,
      assignee_id: data.assignee_id,
      team: data.team,
      approved_by: 'Dashboard',
    });
  } else if (statusChanged && updates.status === 'in_progress' && rejectionSet) {
    await notifyBot({
      event: 'task_rejected',
      guild_id: guildId,
      task_id: id,
      task_name: data.task_name,
      assignee_id: data.assignee_id,
      team: data.team,
      rejection_reason: updates.rejection_reason,
      rejected_by: 'Dashboard',
    });
  } else {
    const changes: Record<string, string> = {};
    if ('task_name' in updates && updates.task_name !== oldTask.task_name) {
      changes['Task'] = updates.task_name as string;
    }
    if ('due_date' in updates && updates.due_date !== oldTask.due_date) {
      changes['Due date'] = (updates.due_date as string | null) ?? 'Removed';
    }
    if (Object.keys(changes).length > 0) {
      await notifyBot({
        event: 'task_edited',
        guild_id: guildId,
        task_id: id,
        task_name: data.task_name,
        assignee_id: data.assignee_id,
        team: data.team,
        changes,
        edited_by: 'Dashboard',
      });
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const supabase = makeClient();

  // Fetch task before deleting so we can include it in the notify payload
  const { data: task } = await supabase
    .from('tasks')
    .select('task_name, assignee_id, team')
    .eq('id', id)
    .single();

  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (task) {
    await notifyBot({
      event: 'task_deleted',
      guild_id: process.env.NEXT_PUBLIC_DISCORD_GUILD_ID,
      task_id: id,
      task_name: task.task_name,
      assignee_id: task.assignee_id,
      team: task.team,
      deleted_by: 'Dashboard',
    });
  }

  return NextResponse.json({ success: true });
}

import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('task_id');

  const supabase = adminClient();

  if (taskId) {
    const { data, error } = await supabase
      .from('task_collaborators')
      .select('*')
      .eq('task_id', Number(taskId));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  }

  // No task_id — return all collaborators for this guild by joining with tasks
  const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
  if (!guildId) return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });

  const { data, error } = await supabase
    .from('task_collaborators')
    .select('*, tasks!inner(guild_id)')
    .eq('tasks.guild_id', guildId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Strip the joined tasks field before returning
  return NextResponse.json((data ?? []).map(({ tasks: _t, ...row }) => row));
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { task_id, user_id } = body as { task_id?: number; user_id?: string };
  if (!task_id || !user_id) {
    return NextResponse.json({ error: 'task_id and user_id are required' }, { status: 400 });
  }

  const supabase = adminClient();
  const { data, error } = await supabase
    .from('task_collaborators')
    .insert({ task_id, user_id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { task_id, user_id } = body as { task_id?: number; user_id?: string };
  if (!task_id || !user_id) {
    return NextResponse.json({ error: 'task_id and user_id are required' }, { status: 400 });
  }

  const supabase = adminClient();
  const { error } = await supabase
    .from('task_collaborators')
    .delete()
    .eq('task_id', task_id)
    .eq('user_id', user_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

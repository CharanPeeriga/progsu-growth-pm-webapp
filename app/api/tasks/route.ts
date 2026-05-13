import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { assignee_id, task_name, due_date, status } = body as {
    assignee_id?: string;
    task_name?: string;
    due_date?: string | null;
    status?: string;
  };

  if (!assignee_id || typeof assignee_id !== 'string' || !assignee_id.trim()) {
    return NextResponse.json({ error: 'assignee_id is required' }, { status: 400 });
  }
  if (!task_name || typeof task_name !== 'string' || !task_name.trim()) {
    return NextResponse.json({ error: 'task_name is required' }, { status: 400 });
  }

  const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
  if (!guildId) {
    console.error('NEXT_PUBLIC_DISCORD_GUILD_ID is not set');
    return NextResponse.json(
      { error: 'Server misconfiguration: guild ID not set' },
      { status: 500 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase env vars');
    return NextResponse.json(
      { error: 'Server misconfiguration: Supabase credentials not set' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const normalizedDueDate =
    due_date === '' || due_date === undefined ? null : due_date;

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      guild_id: guildId,
      assignee_id: assignee_id.trim(),
      assigner_id: 'dashboard',
      task_name: task_name.trim(),
      due_date: normalizedDueDate,
      status: status ?? 'todo',
      reminded: false,
      reminded_2day: false,
      reminded_day_of: false,
      rejection_reason: null,
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase insert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

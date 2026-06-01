import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function makeClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET() {
  const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
  if (!guildId) return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });

  const supabase = makeClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('guild_id', guildId)
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true, nullsFirst: false });

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

  const { title, event_date, description, start_time, end_time, color, location } = body as {
    title?: string;
    event_date?: string;
    description?: string;
    start_time?: string;
    end_time?: string;
    color?: string;
    location?: string;
  };

  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }
  if (!event_date || typeof event_date !== 'string') {
    return NextResponse.json({ error: 'event_date is required' }, { status: 400 });
  }

  const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
  if (!guildId) return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });

  const supabase = makeClient();
  const { data, error } = await supabase
    .from('events')
    .insert({
      guild_id: guildId,
      title: title.trim(),
      event_date,
      description: description || null,
      start_time: start_time || null,
      end_time: end_time || null,
      color: color || '#6B8AFD',
      location: location || null,
      created_by: 'dashboard',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

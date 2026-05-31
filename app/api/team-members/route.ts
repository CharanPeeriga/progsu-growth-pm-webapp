import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET() {
  const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('guild_id', guildId)
    .order('added_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
  let body: { user_id?: string; display_name?: string | null; team?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { user_id, display_name, team } = body;
  if (!user_id || typeof user_id !== 'string' || !user_id.trim()) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('team_members')
    .insert({ guild_id: guildId, user_id: user_id.trim(), display_name: display_name || null, team: team || 'growth' })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const notifyUrl = process.env.BOT_NOTIFY_URL;
  const notifySecret = process.env.BOT_NOTIFY_SECRET;
  if (!notifyUrl) {
    console.warn('BOT_NOTIFY_URL not set — skipping Discord notify');
  } else {
    try {
      await fetch(notifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${notifySecret}` },
        body: JSON.stringify({
          event: 'member_added',
          guild_id: guildId,
          user_id: data.user_id,
          display_name: data.display_name,
          team: data.team,
          added_by: 'Dashboard',
        }),
      });
    } catch (err) {
      console.error('Bot notify failed:', err);
    }
  }

  return NextResponse.json(data);
}

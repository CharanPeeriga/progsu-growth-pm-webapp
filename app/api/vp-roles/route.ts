import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase-admin';

export async function GET() {
  const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
  if (!guildId) return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });

  const supabase = adminClient();
  const { data, error } = await supabase
    .from('vp_roles')
    .select('*')
    .eq('guild_id', guildId);

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

  const { user_id, team } = body as { user_id?: string; team?: string };
  if (!user_id || !team) {
    return NextResponse.json({ error: 'user_id and team are required' }, { status: 400 });
  }

  const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
  if (!guildId) return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });

  const supabase = adminClient();
  // Upsert on (guild_id, user_id, team) so the same person can be VP of
  // multiple teams but cannot be added twice to the same team.
  const { data, error } = await supabase
    .from('vp_roles')
    .upsert({ guild_id: guildId, user_id, team }, { onConflict: 'guild_id,user_id,team' })
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

  const { user_id, team } = body as { user_id?: string; team?: string };
  if (!user_id || !team) {
    return NextResponse.json({ error: 'user_id and team are required' }, { status: 400 });
  }

  const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
  if (!guildId) return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });

  const supabase = adminClient();
  const { error } = await supabase
    .from('vp_roles')
    .delete()
    .eq('guild_id', guildId)
    .eq('user_id', user_id)
    .eq('team', team);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function DELETE(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('guild_id', guildId)
    .eq('user_id', params.userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

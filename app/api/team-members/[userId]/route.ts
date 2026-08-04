import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase-admin';

const supabase = adminClient();

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

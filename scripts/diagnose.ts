import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const guild = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;

// ─── CHECK 1 ────────────────────────────────────────────────────────────────
console.log('\n=== CHECK 1 — Environment Variables ===');
console.log('NEXT_PUBLIC_SUPABASE_URL    :', url   ? 'defined' : 'MISSING');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', anon  ? 'defined' : 'MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY   :', service ? 'defined' : 'MISSING');
console.log('NEXT_PUBLIC_DISCORD_GUILD_ID:', guild  ? 'defined' : 'MISSING');
if (guild) console.log('  value →', guild);

if (!url || !service) {
  console.error('\nFATAL: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — cannot run DB checks.');
  process.exit(1);
}

const supabase = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  // ─── CHECK 2 ──────────────────────────────────────────────────────────────
  console.log('\n=== CHECK 2 — Direct Database Query ===');
  const { data: rows, error: err2 } = await supabase
    .from('tasks')
    .select('id, guild_id, task_name, status')
    .limit(10);

  if (err2) {
    console.log('ERROR:', JSON.stringify(err2, null, 2));
  } else if (!rows || rows.length === 0) {
    console.log('No tasks in database at all.');
  } else {
    console.log(`Returned ${rows.length} row(s):`);
    rows.forEach((r: Record<string, unknown>) =>
      console.log(` id=${r.id}  guild_id=${r.guild_id}  status=${r.status}  task_name=${r.task_name}`)
    );
  }

  // ─── CHECK 3 ──────────────────────────────────────────────────────────────
  console.log('\n=== CHECK 3 — Guild ID Match ===');
  const { data: guilds, error: err3 } = await supabase
    .from('tasks')
    .select('guild_id');

  if (err3) {
    console.log('ERROR:', JSON.stringify(err3, null, 2));
  } else {
    const seen: Record<string, boolean> = {};
    (guilds ?? []).forEach((r: Record<string, unknown>) => { seen[r.guild_id as string] = true; });
    const unique = Object.keys(seen);
    if (unique.length === 0) {
      console.log('No guild_ids found (table is empty).');
    } else {
      console.log('Distinct guild_ids in DB:', unique);
    }
    console.log('NEXT_PUBLIC_DISCORD_GUILD_ID:', guild ?? '(not set)');

    if (!guild) {
      console.log('Result: NO MATCH — env var is not set');
    } else if (unique.length === 0) {
      console.log('Result: NO MATCH — table is empty');
    } else if (unique.includes(guild)) {
      console.log('Result: MATCH');
    } else {
      console.log('Result: NO MATCH');
      console.log('  Exact byte comparison:');
      unique.forEach((g) => {
        console.log(`    DB "${g}" (len ${g.length}) vs ENV "${guild}" (len ${guild.length})`);
        console.log('    char codes DB :', g.split('').map((c: string) => c.charCodeAt(0)).join(','));
        console.log('    char codes ENV:', guild.split('').map((c: string) => c.charCodeAt(0)).join(','));
      });
    }
  }

  // ─── CHECK 4 ──────────────────────────────────────────────────────────────
  console.log('\n=== CHECK 4 — fetchAllTasks Analysis ===');
  console.log('Client used  : createServiceClient() → uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS)');
  console.log('Query        : SELECT * FROM tasks WHERE guild_id = $guildId ORDER BY created_at DESC');
  console.log('guild_id filter: YES — filters by NEXT_PUBLIC_DISCORD_GUILD_ID (passed in from page)');
  console.log('Other filters: NONE — no status filter, no date filter, fetches all rows for the guild');

  // ─── SUMMARY ──────────────────────────────────────────────────────────────
  console.log('\n=== SUMMARY ===');

  const envOk = !!(url && anon && service && guild);
  const { data: allRows } = await supabase.from('tasks').select('id', { count: 'exact', head: false });
  const totalRows = allRows?.length ?? 0;
  const { data: guildRows } = guild
    ? await supabase.from('tasks').select('id').eq('guild_id', guild)
    : { data: [] };
  const guildCount = guildRows?.length ?? 0;

  console.log(`Total tasks in DB           : ${totalRows}`);
  console.log(`Tasks matching guild_id     : ${guildCount}`);

  if (!guild) {
    console.log('\n→ MOST LIKELY CAUSE: NEXT_PUBLIC_DISCORD_GUILD_ID is not set.');
    console.log('  fetchAllTasks receives an empty string, so .eq("guild_id", "") matches nothing.');
  } else if (totalRows === 0) {
    console.log('\n→ MOST LIKELY CAUSE: The tasks table is empty — no data to show.');
  } else if (guildCount === 0) {
    console.log('\n→ MOST LIKELY CAUSE: Guild ID mismatch.');
    console.log('  Tasks exist but their guild_id does not match NEXT_PUBLIC_DISCORD_GUILD_ID.');
  } else if (!envOk) {
    console.log('\n→ MOST LIKELY CAUSE: One or more env vars are missing (see CHECK 1).');
  } else {
    console.log('\n→ Tasks exist and guild_id matches. If page still shows blank:');
    console.log('  Possible causes: browser RLS blocking anon key, React state bug, or network error in dev.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

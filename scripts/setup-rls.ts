/**
 * One-time script to disable RLS on the tasks table.
 * Run: npx ts-node --project tsconfig.test.json scripts/setup-rls.ts
 *
 * RLS disabled — this table is only accessed by authenticated admins and
 * the Discord bot service role key which bypasses RLS anyway.
 *
 * If automatic execution fails, the script prints the SQL to run manually
 * in Supabase Dashboard → SQL Editor.
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SQL = 'ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;';

async function tryManagementAPI(projectRef: string): Promise<boolean> {
  const pat = process.env.SUPABASE_ACCESS_TOKEN;
  if (!pat) return false;
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pat}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: SQL }),
    });
    if (res.ok) {
      console.log('✅ RLS disabled via Supabase Management API');
      return true;
    }
    const body = await res.text();
    console.warn(`Management API returned ${res.status}: ${body}`);
  } catch (e) {
    console.warn('Management API unreachable:', (e as Error).message);
  }
  return false;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('❌ Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const projectRef = new URL(url).hostname.split('.')[0];
  const done = await tryManagementAPI(projectRef);

  if (!done) {
    console.log('');
    console.log('Run this SQL in Supabase Dashboard → SQL Editor:');
    console.log('');
    console.log(`  ${SQL}`);
    console.log('');
    console.log('Or via Supabase CLI (after linking your project):');
    console.log(`  supabase db execute --sql "${SQL}"`);
    console.log('');
    console.log('To enable automatic execution, add your personal access token:');
    console.log('  SUPABASE_ACCESS_TOKEN=<token from supabase.com/dashboard/account/tokens>');
  }
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});

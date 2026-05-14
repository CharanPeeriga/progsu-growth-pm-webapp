// localStorage polyfill — must run before any createBrowserClient calls.
// In Node.js there is no localStorage; this lets @supabase/ssr share auth
// sessions across multiple createBrowserClient() calls, exactly as a browser does.
if (typeof (global as Record<string, unknown>).localStorage === 'undefined') {
  const _store: Record<string, string> = {};
  (global as unknown as Record<string, unknown>).localStorage = {
    getItem:    (k: string)                => _store[k] ?? null,
    setItem:    (k: string, v: string)     => { _store[k] = v; },
    removeItem: (k: string)                => { delete _store[k]; },
    clear:      ()                         => { for (const k of Object.keys(_store)) delete _store[k]; },
    key:        (i: number)                => Object.keys(_store)[i] ?? null,
    get length()                           { return Object.keys(_store).length; },
  };
}

import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

export interface TestCase {
  name: string;
  fn: () => Promise<void>;
}

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  skipped?: boolean;
}

export interface TestSuite {
  name: string;
  tests: TestCase[];
  beforeAll?: () => Promise<void>;
  afterAll?: () => Promise<void>;
}

/** Anon-key client — mirrors what the dashboard app uses in production. */
export function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  }
  return createClient(url, key);
}

/** Service-role client — bypasses RLS. For test data setup/teardown only. */
export function getAdminSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const GUILD_ID       = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID ?? '';
export const DEV_SERVER     = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
export const TEST_EMAIL     = process.env.TEST_ADMIN_EMAIL ?? '';
export const TEST_PASSWORD  = process.env.TEST_ADMIN_PASSWORD ?? '';

/** Returns true if the Next.js dev server is reachable. */
export async function checkDevServer(): Promise<boolean> {
  try {
    const res = await fetch(DEV_SERVER, { signal: AbortSignal.timeout(3000) });
    return res.status < 500;
  } catch {
    return false;
  }
}

export async function cleanup(adminClient: SupabaseClient, ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await adminClient.from('tasks').delete().in('id', ids);
  if (error) console.warn(`  [cleanup warning] ${error.message}`);
}

export function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function addDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

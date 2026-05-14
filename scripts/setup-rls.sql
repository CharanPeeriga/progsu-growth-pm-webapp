-- Run once in Supabase Dashboard → SQL Editor.
-- RLS disabled — this table is only accessed by authenticated admins
-- and the Discord bot service role key which bypasses RLS anyway.
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

import { getAdminSupabaseClient, GUILD_ID, cleanup, assert, TestSuite } from './setup';
import type { SupabaseClient } from '@supabase/supabase-js';

let admin: SupabaseClient;
let taskIds: number[] = [];

function isOverdue(t: { due_date: string | null; status: string }): boolean {
  if (!t.due_date || t.status === 'done') return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return new Date(t.due_date + 'T00:00:00') < now;
}

export const suite: TestSuite = {
  name: 'Progress Stats',
  async beforeAll() {
    admin = getAdminSupabaseClient();

    // 3 done, 2 future-pending, 1 overdue  →  completion rate 50%, overdue 1
    const rows = [
      { guild_id: GUILD_ID, assignee_id: 'prog-user', assigner_id: 'dashboard', task_name: 'Prog done 1',    due_date: null,         status: 'done',        reminded_2day: false, reminded_day_of: false },
      { guild_id: GUILD_ID, assignee_id: 'prog-user', assigner_id: 'dashboard', task_name: 'Prog done 2',    due_date: null,         status: 'done',        reminded_2day: false, reminded_day_of: false },
      { guild_id: GUILD_ID, assignee_id: 'prog-user', assigner_id: 'dashboard', task_name: 'Prog done 3',    due_date: null,         status: 'done',        reminded_2day: false, reminded_day_of: false },
      { guild_id: GUILD_ID, assignee_id: 'prog-user', assigner_id: 'dashboard', task_name: 'Prog pending 1', due_date: '2030-03-01', status: 'todo',        reminded_2day: false, reminded_day_of: false },
      { guild_id: GUILD_ID, assignee_id: 'prog-user', assigner_id: 'dashboard', task_name: 'Prog pending 2', due_date: '2030-06-15', status: 'in_progress', reminded_2day: false, reminded_day_of: false },
      { guild_id: GUILD_ID, assignee_id: 'prog-user', assigner_id: 'dashboard', task_name: 'Prog overdue',   due_date: '2025-01-01', status: 'todo',        reminded_2day: false, reminded_day_of: false },
    ];
    const { data, error } = await admin.from('tasks').insert(rows).select();
    if (error) throw new Error(`Setup insert failed: ${error.message}`);
    taskIds = data!.map((t: { id: number }) => t.id);
  },
  async afterAll() {
    await cleanup(admin, taskIds);
  },
  tests: [
    {
      name: 'total/completed/pending/overdue counts are correct',
      async fn() {
        const { data, error } = await admin.from('tasks').select('*').in('id', taskIds);
        assert(!error, `Query failed: ${error?.message}`);
        const tasks = data!;
        const total = tasks.length;
        const completed = tasks.filter((t: { status: string }) => t.status === 'done').length;
        const overdue = tasks.filter(isOverdue).length;
        const pending = tasks.filter(
          (t: { status: string; due_date: string | null }) => t.status !== 'done' && !isOverdue(t)
        ).length;

        assert(total === 6, `Expected 6 total tasks, got ${total}`);
        assert(completed === 3, `Expected 3 completed, got ${completed}`);
        assert(pending === 2, `Expected 2 pending, got ${pending}`);
        assert(overdue === 1, `Expected 1 overdue, got ${overdue}`);
        assert(completed + pending + overdue === total, 'completed + pending + overdue must equal total');
      },
    },
    {
      name: 'completion rate is calculated correctly (50%)',
      async fn() {
        const { data } = await admin.from('tasks').select('*').in('id', taskIds);
        const tasks = data!;
        const total = tasks.length;
        const completed = tasks.filter((t: { status: string }) => t.status === 'done').length;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
        assert(rate === 50, `Expected 50% completion rate, got ${rate}%`);
      },
    },
    {
      name: '"this week" filter includes all freshly inserted tasks',
      async fn() {
        const { data } = await admin.from('tasks').select('*').in('id', taskIds);
        const tasks = data!;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        const thisWeek = tasks.filter(
          (t: { created_at: string }) => new Date(t.created_at) >= cutoff
        );
        assert(
          thisWeek.length === 6,
          `Expected all 6 tasks in "this week" filter (just inserted), got ${thisWeek.length}`
        );
      },
    },
    {
      name: 'upcoming deadlines are sorted by due_date ascending',
      async fn() {
        const { data } = await admin.from('tasks').select('*').in('id', taskIds);
        const tasks = data!;
        const upcoming = tasks
          .filter((t: { status: string; due_date: string | null }) => t.status !== 'done' && t.due_date)
          .sort((a: { due_date: string }, b: { due_date: string }) =>
            a.due_date > b.due_date ? 1 : -1
          );

        // 3 non-done tasks with due_date: 2025-01-01 (overdue), 2030-03-01, 2030-06-15
        assert(upcoming.length === 3, `Expected 3 tasks with due_dates, got ${upcoming.length}`);
        assert(
          upcoming[0].due_date === '2025-01-01',
          `Expected first '2025-01-01', got '${upcoming[0].due_date}'`
        );
        assert(
          upcoming[1].due_date === '2030-03-01',
          `Expected second '2030-03-01', got '${upcoming[1].due_date}'`
        );
        assert(
          upcoming[2].due_date === '2030-06-15',
          `Expected third '2030-06-15', got '${upcoming[2].due_date}'`
        );
      },
    },
  ],
};

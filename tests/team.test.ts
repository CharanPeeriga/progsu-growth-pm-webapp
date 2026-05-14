import { getAdminSupabaseClient, GUILD_ID, cleanup, assert, TestSuite } from './setup';
import type { SupabaseClient } from '@supabase/supabase-js';

let admin: SupabaseClient;
let taskIds: number[] = [];

const MEMBER_A = 'test-member-aaa';
const MEMBER_B = 'test-member-bbb';

function isOverdue(t: { due_date: string | null; status: string }): boolean {
  if (!t.due_date || t.status === 'done') return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return new Date(t.due_date + 'T00:00:00') < now;
}

export const suite: TestSuite = {
  name: 'Team Aggregation',
  async beforeAll() {
    admin = getAdminSupabaseClient();

    // Member A: 2 done, 1 pending (future). Member B: 1 overdue, 1 pending (future).
    const rows = [
      { guild_id: GUILD_ID, assignee_id: MEMBER_A, assigner_id: 'dashboard', task_name: 'Team-A done 1',  due_date: null,         status: 'done',        reminded_2day: false, reminded_day_of: false },
      { guild_id: GUILD_ID, assignee_id: MEMBER_A, assigner_id: 'dashboard', task_name: 'Team-A done 2',  due_date: null,         status: 'done',        reminded_2day: false, reminded_day_of: false },
      { guild_id: GUILD_ID, assignee_id: MEMBER_A, assigner_id: 'dashboard', task_name: 'Team-A pending', due_date: '2030-01-01', status: 'in_progress', reminded_2day: false, reminded_day_of: false },
      { guild_id: GUILD_ID, assignee_id: MEMBER_B, assigner_id: 'dashboard', task_name: 'Team-B overdue', due_date: '2025-01-01', status: 'todo',        reminded_2day: false, reminded_day_of: false },
      { guild_id: GUILD_ID, assignee_id: MEMBER_B, assigner_id: 'dashboard', task_name: 'Team-B future',  due_date: '2030-06-01', status: 'todo',        reminded_2day: false, reminded_day_of: false },
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
      name: 'tasks group into the correct number of unique members',
      async fn() {
        const { data, error } = await admin.from('tasks').select('*').in('id', taskIds);
        assert(!error, `Query failed: ${error?.message}`);
        const memberIds = new Set(data!.map((t: { assignee_id: string }) => t.assignee_id));
        assert(memberIds.size === 2, `Expected 2 unique members, got ${memberIds.size}`);
        assert(memberIds.has(MEMBER_A), 'Expected MEMBER_A to be present');
        assert(memberIds.has(MEMBER_B), 'Expected MEMBER_B to be present');
      },
    },
    {
      name: 'per-member completed/pending/overdue counts are correct',
      async fn() {
        const { data } = await admin.from('tasks').select('*').in('id', taskIds);
        const tasks = data!;

        const memberATasks = tasks.filter((t: { assignee_id: string }) => t.assignee_id === MEMBER_A);
        const completedA = memberATasks.filter((t: { status: string }) => t.status === 'done').length;
        const overdueA = memberATasks.filter(isOverdue).length;
        const pendingA = memberATasks.filter(
          (t: { status: string; due_date: string | null }) => t.status !== 'done' && !isOverdue(t)
        ).length;
        assert(completedA === 2, `Expected 2 completed for A, got ${completedA}`);
        assert(overdueA === 0, `Expected 0 overdue for A, got ${overdueA}`);
        assert(pendingA === 1, `Expected 1 pending for A, got ${pendingA}`);

        const memberBTasks = tasks.filter((t: { assignee_id: string }) => t.assignee_id === MEMBER_B);
        const completedB = memberBTasks.filter((t: { status: string }) => t.status === 'done').length;
        const overdueB = memberBTasks.filter(isOverdue).length;
        const pendingB = memberBTasks.filter(
          (t: { status: string; due_date: string | null }) => t.status !== 'done' && !isOverdue(t)
        ).length;
        assert(completedB === 0, `Expected 0 completed for B, got ${completedB}`);
        assert(overdueB === 1, `Expected 1 overdue for B, got ${overdueB}`);
        assert(pendingB === 1, `Expected 1 pending for B, got ${pendingB}`);
      },
    },
    {
      name: '"View Tasks" search filter returns only matching assignee tasks',
      async fn() {
        const { data, error } = await admin
          .from('tasks')
          .select('*')
          .eq('guild_id', GUILD_ID)
          .ilike('assignee_id', `%${MEMBER_A}%`);
        assert(!error, `Search filter query failed: ${error?.message}`);
        const relevant = data!.filter((t: { id: number }) => taskIds.includes(t.id));
        assert(relevant.length === 3, `Expected 3 tasks for MEMBER_A, got ${relevant.length}`);
        assert(
          relevant.every((t: { assignee_id: string }) => t.assignee_id === MEMBER_A),
          'All filtered tasks should belong to MEMBER_A'
        );
      },
    },
  ],
};

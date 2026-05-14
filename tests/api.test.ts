import {
  getAdminSupabaseClient,
  GUILD_ID,
  DEV_SERVER,
  cleanup,
  assert,
  addDays,
  checkDevServer,
  TestSuite,
} from './setup';
import type { SupabaseClient } from '@supabase/supabase-js';

let admin: SupabaseClient;
const taskIds: number[] = [];
let serverAvailable = false;

const API_URL = `${DEV_SERVER}/api/tasks`;

async function post(body: Record<string, unknown>): Promise<{ status: number; data: unknown }> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

export const suite: TestSuite = {
  name: 'API Routes',
  async beforeAll() {
    admin = getAdminSupabaseClient();
    serverAvailable = await checkDevServer();
    if (!serverAvailable) {
      console.warn(`  ⚠️  Dev server not running at ${DEV_SERVER} — all API tests will be skipped`);
    }
  },
  async afterAll() {
    await cleanup(admin, taskIds);
  },
  tests: [
    {
      name: 'POST /api/tasks with valid data returns 200 and inserted task',
      async fn() {
        if (!serverAvailable) throw new Error(`Dev server not running at ${DEV_SERVER}`);
        const due = addDays(5);
        const { status, data } = await post({
          assignee_id: 'api-test-user',
          task_name: 'API test task',
          due_date: due,
          status: 'todo',
        });
        const task = data as Record<string, unknown>;
        assert(status === 200, `Expected 200, got ${status} — body: ${JSON.stringify(data)}`);
        assert(typeof task.id === 'number', 'Expected numeric id in response');
        assert(task.task_name === 'API test task', `Wrong task_name: '${task.task_name}'`);
        assert(task.due_date === due, `Wrong due_date: '${task.due_date}'`);
        taskIds.push(task.id as number);
      },
    },
    {
      name: 'POST /api/tasks without assignee_id returns 400',
      async fn() {
        if (!serverAvailable) throw new Error(`Dev server not running at ${DEV_SERVER}`);
        const { status, data } = await post({ task_name: 'Missing assignee', status: 'todo' });
        assert(status === 400, `Expected 400, got ${status}`);
        const body = data as Record<string, unknown>;
        assert(typeof body.error === 'string', 'Expected error message in 400 response');
      },
    },
    {
      name: 'POST /api/tasks without task_name returns 400',
      async fn() {
        if (!serverAvailable) throw new Error(`Dev server not running at ${DEV_SERVER}`);
        const { status, data } = await post({ assignee_id: 'some-user', status: 'todo' });
        assert(status === 400, `Expected 400, got ${status}`);
        const body = data as Record<string, unknown>;
        assert(typeof body.error === 'string', 'Expected error message in 400 response');
      },
    },
    {
      name: 'POST /api/tasks with empty due_date returns task with null due_date',
      async fn() {
        if (!serverAvailable) throw new Error(`Dev server not running at ${DEV_SERVER}`);
        const { status, data } = await post({
          assignee_id: 'api-test-user',
          task_name: 'No due date task',
          due_date: '',
          status: 'todo',
        });
        const task = data as Record<string, unknown>;
        assert(status === 200, `Expected 200, got ${status} — body: ${JSON.stringify(data)}`);
        assert(task.due_date === null, `Expected null due_date, got '${task.due_date}'`);
        taskIds.push(task.id as number);
      },
    },
    {
      name: 'POST /api/tasks injects guild_id from server env',
      async fn() {
        if (!serverAvailable) throw new Error(`Dev server not running at ${DEV_SERVER}`);
        assert(
          !!GUILD_ID,
          '❌ NEXT_PUBLIC_DISCORD_GUILD_ID is not set in .env.local — task guild_id cannot be verified'
        );
        const { status, data } = await post({
          assignee_id: 'api-test-guild',
          task_name: 'Guild injection test',
          due_date: null,
          status: 'todo',
        });
        const task = data as Record<string, unknown>;
        assert(status === 200, `Expected 200, got ${status}`);
        assert(
          task.guild_id === GUILD_ID,
          `Expected guild_id '${GUILD_ID}', got '${task.guild_id}'`
        );
        taskIds.push(task.id as number);

        // Also verify the task is queryable by guild
        const { data: rows } = await admin
          .from('tasks')
          .select('id')
          .eq('guild_id', GUILD_ID)
          .eq('id', task.id);
        assert(
          Array.isArray(rows) && rows.length === 1,
          'Inserted task does not appear in admin query for correct guild'
        );
      },
    },
  ],
};

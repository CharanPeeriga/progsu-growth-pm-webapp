// NOTE: insertTask posts to /api/tasks, so these tests require `npm run dev` running.
// fetchAllTasks / updateTask / deleteTask use the browser Supabase client directly.
import {
  getAdminSupabaseClient,
  GUILD_ID,
  DEV_SERVER,
  TEST_EMAIL,
  TEST_PASSWORD,
  cleanup,
  assert,
  addDays,
  checkDevServer,
  TestSuite,
} from './setup';
import { fetchAllTasks, insertTask, updateTask, deleteTask, createClient, resetClient } from '../lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

let admin: SupabaseClient;
const taskIds: number[] = [];
let serverAvailable = false;

export const suite: TestSuite = {
  name: 'Task CRUD',
  async beforeAll() {
    admin = getAdminSupabaseClient();

    serverAvailable = await checkDevServer();
    if (!serverAvailable) {
      console.warn(`  ⚠️  Dev server not running at ${DEV_SERVER} — insertTask tests will be skipped`);
    }

    // Sign in via the browser client (best-effort; skipped in Node/SSR environments
    // where createBrowserClient requires cookie handlers that don't exist).
    if (TEST_EMAIL && TEST_PASSWORD) {
      try {
        const client = createClient();
        const { error } = await client.auth.signInWithPassword({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        });
        if (error) console.warn(`  ⚠️  Auth sign-in failed: ${error.message} — some tests may fail`);
      } catch {
        console.warn('  ⚠️  createBrowserClient not available in Node — skipping auth sign-in');
      }
    }
  },
  async afterAll() {
    await cleanup(admin, taskIds);
    try { await createClient().auth.signOut(); } catch { /* ignore in Node */ }
    resetClient(); // clear singleton so subsequent suites start fresh
  },
  tests: [
    // ─── Test A ─────────────────────────────────────────────────────────────
    {
      name: '(A) insertTask rejects empty assignee_id',
      async fn() {
        if (!serverAvailable) throw new Error(`Dev server not running at ${DEV_SERVER}`);
        let threw = false;
        try {
          await insertTask({ assignee_id: '', task_name: 'Valid Name', due_date: null, status: 'todo', team: 'growth', collaborator_ids: [], guild_id: GUILD_ID });
        } catch {
          threw = true;
        }
        assert(threw, 'Expected insertTask to throw when assignee_id is empty');
      },
    },
    // ─── Test B ─────────────────────────────────────────────────────────────
    {
      name: '(B) insertTask rejects empty task_name',
      async fn() {
        if (!serverAvailable) throw new Error(`Dev server not running at ${DEV_SERVER}`);
        let threw = false;
        try {
          await insertTask({ assignee_id: 'some-user', task_name: '', due_date: null, status: 'todo', team: 'growth', collaborator_ids: [], guild_id: GUILD_ID });
        } catch {
          threw = true;
        }
        assert(threw, 'Expected insertTask to throw when task_name is empty');
      },
    },
    // ─── Test C ─────────────────────────────────────────────────────────────
    {
      name: '(C) insertTask converts empty-string due_date to null',
      async fn() {
        if (!serverAvailable) throw new Error(`Dev server not running at ${DEV_SERVER}`);
        assert(!!GUILD_ID, '❌ NEXT_PUBLIC_DISCORD_GUILD_ID is not set in .env.local — tasks will never appear in the UI');
        const { task } = await insertTask({
          assignee_id: 'test-user-c',
          task_name: 'Empty date test',
          due_date: '' as unknown as null, // simulate unfilled date input
          status: 'todo',
          team: 'growth',
          collaborator_ids: [],
          guild_id: GUILD_ID,
        });
        taskIds.push(task.id);
        assert(task.due_date === null, `Expected due_date null, got '${task.due_date}'`);
      },
    },
    // ─── Test D ─────────────────────────────────────────────────────────────
    {
      name: '(D) insertTask with valid guild_id appears in fetchAllTasks',
      async fn() {
        if (!serverAvailable) throw new Error(`Dev server not running at ${DEV_SERVER}`);
        assert(
          !!GUILD_ID,
          '❌ NEXT_PUBLIC_DISCORD_GUILD_ID is not set in .env.local — tasks will never appear in the UI'
        );
        const { task } = await insertTask({
          assignee_id: 'test-user-d',
          task_name: 'Guild filter test',
          due_date: addDays(10),
          status: 'todo',
          team: 'growth',
          collaborator_ids: [],
          guild_id: GUILD_ID,
        });
        taskIds.push(task.id);
        assert(task.guild_id === GUILD_ID, `Returned task has wrong guild_id: '${task.guild_id}'`);

        const tasks = await fetchAllTasks();
        const found = tasks.some((t) => t.id === task.id);
        assert(found, `Inserted task id=${task.id} not returned by fetchAllTasks — check RLS SELECT policy`);
      },
    },
    // ─── Test E ─────────────────────────────────────────────────────────────
    {
      name: '(E) fetchAllTasks only returns tasks for the correct guild',
      async fn() {
        const wrongGuild = 'wrong_guild_000';
        const { data: wrongData, error: wrongError } = await admin
          .from('tasks')
          .insert({
            guild_id: wrongGuild,
            assignee_id: 'test-user-e',
            assigner_id: 'dashboard',
            task_name: 'Wrong-guild task',
            due_date: null,
            status: 'todo',
            reminded_2day: false,
            reminded_day_of: false,
          })
          .select()
          .single();
        assert(!wrongError, `Setup insert failed: ${wrongError?.message}`);
        const wrongId: number = wrongData.id;

        const { data: rightData, error: rightError } = await admin
          .from('tasks')
          .insert({
            guild_id: GUILD_ID,
            assignee_id: 'test-user-e',
            assigner_id: 'dashboard',
            task_name: 'Correct-guild task',
            due_date: null,
            status: 'todo',
            reminded_2day: false,
            reminded_day_of: false,
          })
          .select()
          .single();
        assert(!rightError, `Setup insert failed: ${rightError?.message}`);
        const rightId: number = rightData.id;

        taskIds.push(rightId); // cleanup via admin at end

        try {
          const tasks = await fetchAllTasks();
          const hasWrong = tasks.some((t) => t.id === wrongId);
          assert(!hasWrong, `fetchAllTasks returned a task from the wrong guild (id=${wrongId})`);
        } finally {
          // Always clean up the wrong-guild task directly
          await admin.from('tasks').delete().eq('id', wrongId);
        }
      },
    },
    // ─── Test F ─────────────────────────────────────────────────────────────
    {
      name: '(F) updateTask sets due_date to null without storing "null" string',
      async fn() {
        const { data: inserted, error: insertError } = await admin
          .from('tasks')
          .insert({
            guild_id: GUILD_ID,
            assignee_id: 'test-user-f',
            assigner_id: 'dashboard',
            task_name: 'Due date null test',
            due_date: addDays(5),
            status: 'todo',
            reminded_2day: false,
            reminded_day_of: false,
          })
          .select()
          .single();
        assert(!insertError, `Setup insert failed: ${insertError?.message}`);
        taskIds.push(inserted.id);

        const updated = await updateTask(inserted.id, { due_date: null });
        assert(
          updated.due_date === null,
          `Expected due_date null after update, got '${updated.due_date}'`
        );
      },
    },
    // ─── Test G ─────────────────────────────────────────────────────────────
    {
      name: '(G) deleteTask removes task from fetchAllTasks without throwing',
      async fn() {
        const { data: inserted, error: insertError } = await admin
          .from('tasks')
          .insert({
            guild_id: GUILD_ID,
            assignee_id: 'test-user-g',
            assigner_id: 'dashboard',
            task_name: 'Delete me',
            due_date: null,
            status: 'todo',
            reminded_2day: false,
            reminded_day_of: false,
          })
          .select()
          .single();
        assert(!insertError, `Setup insert failed: ${insertError?.message}`);
        const id: number = inserted.id;

        await deleteTask(id);

        // fetchAllTasks must not throw even if result set is now smaller
        const tasks = await fetchAllTasks();
        assert(Array.isArray(tasks), 'fetchAllTasks must return an array');
        const stillThere = tasks.some((t) => t.id === id);
        assert(!stillThere, `Deleted task id=${id} still appears in fetchAllTasks`);
      },
    },
  ],
};

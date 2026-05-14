import { getSupabaseClient, assert, TestSuite } from './setup';

const email = process.env.TEST_ADMIN_EMAIL ?? '';
const password = process.env.TEST_ADMIN_PASSWORD ?? '';

export const suite: TestSuite = {
  name: 'Authentication',
  tests: [
    {
      name: 'sign in with valid credentials returns session',
      async fn() {
        assert(!!email && !!password, 'TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD must be set in .env.local');
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        assert(!error, `Expected no error, got: ${error?.message}`);
        assert(!!data.session, 'Expected session to be set');
        assert(!!data.session?.access_token, 'Expected access_token to be present');
      },
    },
    {
      name: 'getUser returns authenticated user with correct email',
      async fn() {
        const supabase = getSupabaseClient();
        await supabase.auth.signInWithPassword({ email, password });
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        assert(!error, `Expected no error, got: ${error?.message}`);
        assert(!!user, 'Expected user to be returned');
        assert(
          user?.email === email,
          `Expected email '${email}', got '${user?.email}'`
        );
      },
    },
    {
      name: 'sign in with wrong password returns auth error',
      async fn() {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: 'definitely-wrong-password-xyz-123',
        });
        assert(!!error, 'Expected an error for wrong password');
        assert(!data.session, 'Expected no session on failed login');
      },
    },
    {
      name: 'sign out clears the session',
      async fn() {
        const supabase = getSupabaseClient();
        await supabase.auth.signInWithPassword({ email, password });
        const { error: signOutError } = await supabase.auth.signOut();
        assert(!signOutError, `Expected no sign-out error, got: ${signOutError?.message}`);
        const {
          data: { session },
        } = await supabase.auth.getSession();
        assert(!session, 'Expected session to be null after sign out');
      },
    },
  ],
};

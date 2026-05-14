import { TestSuite, TestResult } from './setup'; // loads dotenv + localStorage polyfill
import { suite as authSuite }     from './auth.test';
import { suite as tasksSuite }    from './tasks.test';
import { suite as apiSuite }      from './api.test';
import { suite as teamSuite }     from './team.test';
import { suite as progressSuite } from './progress.test';

interface SuiteResult {
  suite: string;
  results: TestResult[];
  skippedAll: boolean;
}

const DIV = '─'.repeat(50);

async function runSuite(suite: TestSuite): Promise<SuiteResult> {
  const label = `${suite.name} (${suite.tests.length} tests)`;
  console.log(`\n  ${label}`);
  console.log(`  ${DIV.slice(0, label.length + 2)}`);

  // Run beforeAll first so SETUP FAILED appears under the correct suite header
  if (suite.beforeAll) {
    try {
      await suite.beforeAll();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`  ✗ [SETUP FAILED] ${msg}`);
      const results = suite.tests.map((t) => ({
        name: t.name,
        passed: false,
        error: `beforeAll: ${msg}`,
      }));
      if (suite.afterAll) {
        await suite.afterAll().catch(() => undefined);
      }
      return { suite: suite.name, results, skippedAll: false };
    }
  }

  const results: TestResult[] = [];

  for (const test of suite.tests) {
    try {
      await test.fn();
      results.push({ name: test.name, passed: true });
      console.log(`  ✓ ${test.name}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const isSkip = msg.startsWith('Dev server not running');
      results.push({ name: test.name, passed: false, error: msg, skipped: isSkip });
      if (isSkip) {
        console.log(`  ⚠  ${test.name}`);
      } else {
        console.log(`  ✗ ${test.name}`);
        console.log(`    → ${msg}`);
      }
    }
  }

  const skippedAll = results.length > 0 && results.every((r) => r.skipped);
  if (skippedAll) {
    console.log(`  ⚠️  All tests skipped — dev server required at ${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}`);
  }

  if (suite.afterAll) {
    await suite.afterAll().catch((e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`  [teardown warning] ${msg}`);
    });
  }

  return { suite: suite.name, results, skippedAll };
}

async function main() {
  const suites: TestSuite[] = [authSuite, tasksSuite, apiSuite, teamSuite, progressSuite];

  const WIDTH = 50;
  const hr = '═'.repeat(WIDTH);

  console.log(`\n╔${hr}╗`);
  console.log(`║${'  growth-pm-webapp — Test Results'.padEnd(WIDTH)}║`);
  console.log(`╚${hr}╝`);

  let totalPassed  = 0;
  let totalFailed  = 0;
  let totalSkipped = 0;
  const allResults: SuiteResult[] = [];

  for (const suite of suites) {
    const sr = await runSuite(suite);
    allResults.push(sr);
    totalPassed  += sr.results.filter((r) =>  r.passed).length;
    totalFailed  += sr.results.filter((r) => !r.passed && !r.skipped).length;
    totalSkipped += sr.results.filter((r) =>  r.skipped).length;
  }

  console.log(`\n╔${hr}╗`);
  console.log(`║${'  Passed: ' + totalPassed + ' / ' + (totalPassed + totalFailed + totalSkipped)}`.padEnd(WIDTH + 1) + '║');
  if (totalSkipped > 0) {
    console.log(`║${'  ⚠️  ' + totalSkipped + ' skipped — run npm run dev for full coverage'}`.padEnd(WIDTH + 1) + '║');
  }
  console.log(`╚${hr}╝\n`);

  if (totalFailed > 0) {
    console.log('Failed tests:');
    for (const sr of allResults) {
      for (const r of sr.results) {
        if (!r.passed && !r.skipped) {
          console.log(`  ✗ [${sr.suite}] ${r.name}`);
          if (r.error) console.log(`    ${r.error}`);
        }
      }
    }
    console.log('');
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error('\nFatal error:', msg);
  process.exit(1);
});

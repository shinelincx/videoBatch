const assert = require('assert');
const { AccountPublishScheduler, resolvePublishConcurrency } = require('../account-publish-scheduler');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testConfiguredConcurrencyCapsActiveAccounts() {
  let active = 0;
  let maxActive = 0;
  const started = [];
  const scheduler = new AccountPublishScheduler({
    getConcurrency: () => 3,
    runTask: async (task) => {
      active++;
      maxActive = Math.max(maxActive, active);
      started.push(task.accountId);
      await delay(15);
      active--;
      return true;
    },
  });

  scheduler.enqueueTasks(Array.from({ length: 8 }, (_, i) => ({
    id: `task-${i + 1}`,
    accountId: `account-${i + 1}`,
  })));
  await scheduler.waitForIdle();

  assert.strictEqual(maxActive, 3, 'scheduler should respect configured account concurrency');
  assert.strictEqual(started.length, 8, 'scheduler should run every account task');
}

async function testConcurrencyIsCappedAtTen() {
  let active = 0;
  let maxActive = 0;
  const scheduler = new AccountPublishScheduler({
    getConcurrency: () => 20,
    runTask: async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await delay(10);
      active--;
      return true;
    },
  });

  scheduler.enqueueTasks(Array.from({ length: 15 }, (_, i) => ({
    id: `cap-${i + 1}`,
    accountId: `cap-account-${i + 1}`,
  })));
  await scheduler.waitForIdle();

  assert.strictEqual(maxActive, 10, 'configured concurrency above 10 should be capped at 10');
  assert.strictEqual(resolvePublishConcurrency(20), 10);
}

async function testSameAccountRunsSeriallyAndDuplicatesAreIgnored() {
  const events = [];
  const scheduler = new AccountPublishScheduler({
    getConcurrency: () => 10,
    runTask: async (task) => {
      events.push(`start:${task.id}`);
      await delay(5);
      events.push(`end:${task.id}`);
      return true;
    },
  });

  scheduler.enqueueTasks([
    { id: 'a-1', accountId: 'account-a' },
    { id: 'a-2', accountId: 'account-a' },
    { id: 'a-1', accountId: 'account-a' },
  ]);
  await scheduler.waitForIdle();

  assert.deepStrictEqual(events, [
    'start:a-1',
    'end:a-1',
    'start:a-2',
    'end:a-2',
  ]);
}

async function testIdleSessionCleanupWaitsForPollAndSkipsActiveAccounts() {
  const closed = [];
  let releaseTask;
  const taskGate = new Promise(resolve => { releaseTask = resolve; });
  const sessionManager = {
    getOpenAccountIds: () => ['active-account', 'finished-account'],
    closeSession: async (accountId) => {
      closed.push(String(accountId));
    },
  };
  const scheduler = new AccountPublishScheduler({
    getConcurrency: () => 10,
    sessionManager,
    runTask: async () => {
      await taskGate;
      return true;
    },
  });

  scheduler.enqueueTasks([{ id: 'active-task', accountId: 'active-account' }]);
  await delay(0);

  await scheduler.closeIdleSessionsAfterPoll(new Set());
  assert.deepStrictEqual(closed, ['finished-account'], 'poll cleanup should close only idle accounts');

  releaseTask();
  await scheduler.waitForIdle();
  await scheduler.closeIdleSessionsAfterPoll(new Set());

  assert.deepStrictEqual(closed, ['finished-account', 'active-account'], 'completed account closes on a later poll');
}

async function run() {
  await testConfiguredConcurrencyCapsActiveAccounts();
  await testConcurrencyIsCappedAtTen();
  await testSameAccountRunsSeriallyAndDuplicatesAreIgnored();
  await testIdleSessionCleanupWaitsForPollAndSkipsActiveAccounts();
  console.log('account publish scheduler tests passed');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

const DEFAULT_MAX_CONCURRENCY = 10;

function resolvePublishConcurrency(value) {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_MAX_CONCURRENCY;
  return Math.min(parsed, DEFAULT_MAX_CONCURRENCY);
}

function defaultTaskId(task) {
  const id = task?.id ?? task?.publishRecordId;
  return id == null || id === '' ? null : String(id);
}

function defaultAccountId(task) {
  return String(task?.accountId || 'default');
}

class AccountPublishScheduler {
  constructor(options = {}) {
    this.getConcurrency = options.getConcurrency || (() => DEFAULT_MAX_CONCURRENCY);
    this.runTask = options.runTask || (async () => true);
    this.onTaskError = options.onTaskError || null;
    this.onAccountComplete = options.onAccountComplete || null;
    this.sessionManager = options.sessionManager || null;
    this.getTaskId = options.getTaskId || defaultTaskId;
    this.getAccountId = options.getAccountId || defaultAccountId;

    this.queues = new Map();
    this.activeAccounts = new Set();
    this.trackedTaskIds = new Set();
    this.closedSessionIds = new Set();
    this.idleResolvers = [];
    this.noIdCounter = 0;
  }

  enqueueTasks(tasks) {
    const list = Array.isArray(tasks) ? tasks : [];
    let added = 0;

    for (const task of list) {
      const accountId = this.getAccountId(task);
      const taskId = this.getTaskId(task) || `__no_id_${Date.now()}_${++this.noIdCounter}`;
      if (this.trackedTaskIds.has(taskId)) continue;

      if (!this.queues.has(accountId)) this.queues.set(accountId, []);
      this.queues.get(accountId).push({ task, taskId });
      this.trackedTaskIds.add(taskId);
      this.closedSessionIds.delete(accountId);
      added++;
    }

    if (added > 0) this._drain();
    this._resolveIdleIfNeeded();
    return added;
  }

  getActiveAccountIds() {
    return Array.from(this.activeAccounts);
  }

  getQueuedAccountIds() {
    return Array.from(this.queues.entries())
      .filter(([, queue]) => queue.length > 0)
      .map(([accountId]) => accountId);
  }

  hasWork() {
    return this.activeAccounts.size > 0 || this.getQueuedAccountIds().length > 0;
  }

  clearQueuedTasks() {
    for (const queue of this.queues.values()) {
      for (const item of queue) this.trackedTaskIds.delete(item.taskId);
    }
    this.queues.clear();
    this._resolveIdleIfNeeded();
  }

  waitForIdle() {
    if (!this.hasWork()) return Promise.resolve();
    return new Promise(resolve => this.idleResolvers.push(resolve));
  }

  async closeIdleSessionsAfterPoll(fetchedAccountIds) {
    if (!this.sessionManager || typeof this.sessionManager.getOpenAccountIds !== 'function') return;
    const fetched = new Set(Array.from(fetchedAccountIds || []).map(String));
    const openIds = this.sessionManager.getOpenAccountIds().map(String);

    for (const accountId of openIds) {
      const queue = this.queues.get(accountId);
      if (
        fetched.has(accountId) ||
        this.activeAccounts.has(accountId) ||
        (queue && queue.length > 0) ||
        this.closedSessionIds.has(accountId)
      ) {
        continue;
      }
      await this.sessionManager.closeSession(accountId);
      this.closedSessionIds.add(accountId);
    }
  }

  _drain() {
    const limit = resolvePublishConcurrency(this.getConcurrency());
    while (this.activeAccounts.size < limit) {
      const accountId = this._nextQueuedAccountId();
      if (!accountId) break;
      void this._runAccount(accountId);
    }
  }

  _nextQueuedAccountId() {
    for (const [accountId, queue] of this.queues.entries()) {
      if (queue.length > 0 && !this.activeAccounts.has(accountId)) return accountId;
    }
    return null;
  }

  async _runAccount(accountId) {
    this.activeAccounts.add(accountId);
    try {
      while (true) {
        const queue = this.queues.get(accountId);
        if (!queue || queue.length === 0) break;
        const item = queue.shift();
        try {
          await this.runTask(item.task, accountId);
        } catch (err) {
          if (this.onTaskError) {
            await this.onTaskError(err, item.task, accountId);
          } else {
            throw err;
          }
        } finally {
          this.trackedTaskIds.delete(item.taskId);
        }
      }

      if (this.onAccountComplete) {
        await this.onAccountComplete(accountId);
      }
    } finally {
      const queue = this.queues.get(accountId);
      if (!queue || queue.length === 0) this.queues.delete(accountId);
      this.activeAccounts.delete(accountId);
      this._drain();
      this._resolveIdleIfNeeded();
    }
  }

  _resolveIdleIfNeeded() {
    if (this.hasWork()) return;
    const resolvers = this.idleResolvers.splice(0);
    for (const resolve of resolvers) resolve();
  }
}

module.exports = {
  AccountPublishScheduler,
  resolvePublishConcurrency,
  DEFAULT_MAX_CONCURRENCY,
};

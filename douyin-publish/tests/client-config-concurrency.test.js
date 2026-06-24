const assert = require('assert');
const { normalizePublishConcurrency } = require('../client-config');

assert.strictEqual(normalizePublishConcurrency(undefined), 10);
assert.strictEqual(normalizePublishConcurrency(''), 10);
assert.strictEqual(normalizePublishConcurrency('abc'), 10);
assert.strictEqual(normalizePublishConcurrency(0), 10);
assert.strictEqual(normalizePublishConcurrency(1), 1);
assert.strictEqual(normalizePublishConcurrency('3'), 3);
assert.strictEqual(normalizePublishConcurrency(10), 10);
assert.strictEqual(normalizePublishConcurrency(20), 10);
assert.strictEqual(normalizePublishConcurrency(4.8), 4);

console.log('client config concurrency tests passed');

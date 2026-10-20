import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createD1Store } from '../lib/d1-store.js';
function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../migrations/0001_intake.sql', import.meta.url), 'utf8'));
  const binding = {
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      return { bind(...args) { return {
        first: async column => statement.get(...args)?.[column] ?? null,
        all: async () => ({ results: statement.all(...args) }),
        run: async () => ({ meta: { changes: Number(statement.run(...args).changes) } }),
      }; } };
    },
  };
  let now = 100;
  return { sqlite, store: createD1Store(binding, () => now), tick: n => { now += n; } };
}
test('D1 SQL creates records once and preserves existing contents', async () => {
  const f = fixture();
  try {
    assert.equal(await f.store.read('pending/missing'), null);
    assert.equal(await f.store.claim('pending/one', { name: 'First' }), true);
    assert.equal(await f.store.claim('pending/one', { name: 'Overwrite' }), false);
    assert.deepEqual(await f.store.read('pending/one'), { name: 'First' });
    await f.store.remove('pending/one'); assert.equal(await f.store.read('pending/one'), null);
  } finally { f.sqlite.close(); }
});
test('D1 prefix scans and age cleanup preserve unrelated and unprocessed records', async () => {
  const f = fixture();
  try {
    await f.store.claim('rate/old/0', {}); await f.store.claim('pending/old', {});
    f.tick(1000); await f.store.claim('rate/new/0', {}); await f.store.claim('processed/current', {});
    const results = await f.store.list('rate/', 10);
    assert.equal(results.length, 2); assert.ok(results.every(item => item.pathname.startsWith('rate/')));
    await f.store.prune('rate/', 500);
    assert.equal(await f.store.read('rate/old/0'), null);
    assert.deepEqual(await f.store.read('rate/new/0'), {});
    assert.deepEqual(await f.store.read('pending/old'), {});
    assert.deepEqual(await f.store.read('processed/current'), {});
  } finally { f.sqlite.close(); }
});

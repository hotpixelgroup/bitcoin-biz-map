import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createIntake, ORIGIN, validateSubmission } from '../lib/intake.js';
import { issuePayload, processQueue } from '../../scripts/process-submissions.mjs';
function fixture() {
  let time = Date.parse('2026-10-20T12:00:00Z');
  const records = new Map();
  const store = {
    read: async key => records.get(key) || null,
    claim: async (key, value) => { if (records.has(key)) return false; records.set(key, value); return true; },
    consume: async (key, limit) => { const count = records.get(key) || 0; if (count >= limit) return false; records.set(key, count + 1); return true; },
    list: async (prefix, limit) => [...records.keys()].filter(key => key.startsWith(prefix)).slice(0, limit).map(pathname => ({ pathname })),
    remove: async key => { records.delete(key); },
  };
  const secret = 'unit-test-only-secret-'.repeat(3);
  const app = createIntake({ store, secret, now: () => time, log: () => {} });
  const request = (method, body, origin = ORIGIN, ip = '192.0.2.1') => new Request('https://test.workers.dev/api/submissions', { method, headers: { Origin: origin, 'Content-Type': 'application/json', 'cf-connecting-ip': ip }, ...(body ? { body: JSON.stringify(body) } : {}) });
  async function submit(extra = {}, ip) {
    const challenge = (await (await app.publicHandler(request('GET', null, ORIGIN, ip))).json()).challenge;
    time += 2000;
    return app.publicHandler(request('POST', { kind: 'suggestion', name: 'Test Cafe', address: '1 Test St, Phoenix, AZ', evidence: 'Public business confirmation', consent: true, challenge, ...extra }, ORIGIN, ip));
  }
  return { app, records, store, secret, request, submit, tick: n => { time += n; } };
}
test('anonymous submission is durably queued, deduplicated, and contains no IP address', async () => {
  const f = fixture();
  const one = await f.submit(); assert.equal(one.status, 202);
  const id = (await one.json()).receipt;
  const two = await f.submit(); assert.equal((await two.json()).receipt, id);
  assert.equal([...f.records.keys()].filter(key => key.startsWith('pending/')).length, 1);
  assert.ok(!JSON.stringify([...f.records.values()]).includes('192.0.2.1'));
});
test('cross-origin requests, missing consent, oversized text, and unsafe URLs are rejected', async () => {
  const f = fixture();
  assert.equal((await f.app.publicHandler(f.request('GET', null, 'https://evil.example'))).status, 403);
  assert.equal((await f.submit({ consent: false })).status, 400);
  assert.equal((await f.submit({ name: 'x'.repeat(121) })).status, 400);
  assert.equal((await f.submit({ website: 'javascript:alert(1)' })).status, 400);
  assert.equal((await f.submit({ website: 'https://user:password@example.com' })).status, 400);
});
test('challenge expiry, tampering, and rapid submission are rejected', async () => {
  const f = fixture();
  const { challenge } = await (await f.app.publicHandler(f.request('GET'))).json();
  const body = { kind: 'suggestion', name: 'Cafe', address: 'Phoenix', evidence: 'Recent visit', consent: true, challenge };
  assert.equal((await f.app.publicHandler(f.request('POST', body))).status, 400);
  f.tick(601000);
  assert.equal((await f.app.publicHandler(f.request('POST', body))).status, 400);
  assert.equal((await f.submit({ challenge: `${challenge}x` })).status, 400);
});
test('persistent per-client rate limits survive separate service instances', async () => {
  const f = fixture();
  for (let i = 0; i < 3; i++) assert.equal((await f.submit({ name: `Cafe ${i}` })).status, 202);
  assert.equal((await f.submit({ name: 'Fourth cafe' })).status, 429);
  assert.equal((await f.submit({ name: 'Different visitor' }, '192.0.2.2')).status, 202);
});
test('concurrent intake is capped at three submissions per client', async () => {
  const f = fixture();
  const { challenge } = await (await f.app.publicHandler(f.request('GET'))).json();
  f.tick(2000);
  const results = await Promise.all(Array.from({ length: 6 }, (_, n) => f.app.publicHandler(f.request('POST', { kind: 'suggestion', name: `Cafe ${n}`, address: 'Phoenix', evidence: 'Visit', consent: true, challenge }))));
  assert.equal(results.filter(result => result.status === 202).length, 3);
});
test('queue requires its secret, and acknowledgment moves a record to a receipt', async () => {
  const f = fixture();
  const id = (await (await f.submit()).json()).receipt;
  assert.equal((await f.app.queueHandler(new Request('https://test/api/queue'))).status, 401);
  const headers = { Authorization: `Bearer ${f.secret}`, 'Content-Type': 'application/json' };
  const batch = await (await f.app.queueHandler(new Request('https://test/api/queue', { headers }))).json();
  assert.equal(batch.submissions[0].id, id);
  const ack = await f.app.queueHandler(new Request('https://test/api/queue', { method: 'POST', headers, body: JSON.stringify({ id, issueNumber: 42 }) }));
  assert.equal(ack.status, 200);
  assert.ok(!f.records.has(`pending/${id}.json`));
  const retry = await (await f.submit()).json();
  assert.equal(retry.state, 'published'); assert.match(retry.issueUrl, /\/issues\/42$/);
});
test('storage failures never report a successful submission', async () => {
  const f = fixture(); f.store.read = async () => { throw new Error('unavailable'); };
  const response = await f.submit(); assert.equal(response.status, 503);
});
test('honeypot submissions do not reach the review queue', async () => {
  const f = fixture(); assert.equal((await f.submit({ contact: 'spam' })).status, 202);
  assert.equal(f.records.size, 0);
});
test('issue payloads disable mentions and retain a stable deduplication marker', () => {
  const record = { id: 'a'.repeat(64), receivedAt: '2026-10-20T12:00:00Z', submission: validateSubmission({ kind: 'correction', name: '@everyone Cafe', address: 'Phoenix', evidence: '<script>@user</script>', listingId: 'az-008', consent: true }) };
  const issue = issuePayload(record);
  assert.ok(!issue.title.includes('@')); assert.ok(!issue.body.includes('<script>'));
  assert.match(issue.body, /anonymous map visitor/); assert.ok(issue.body.includes(`<!-- anonymous-submission:${record.id} -->`));
  assert.ok(issue.body.includes('/bitcoin-biz-map/#az-008'));
  assert.deepEqual(issue.labels, ['merchant-correction', 'needs-review']);
});
test('processor does not duplicate an existing closed issue after an acknowledgment failure', async () => {
  const id = 'b'.repeat(64);
  const record = { id, receivedAt: '2026-10-20T12:00:00Z', submission: { kind: 'suggestion', name: 'Cafe', address: 'Phoenix', evidence: 'Visit' } };
  let creates = 0, acks = 0;
  const fetcher = async (url, options) => {
    if (String(url).endsWith('/api/queue') && !options.method) return Response.json({ submissions: [record] });
    if (String(url).includes('/issues?')) return Response.json([{ number: 11, state: 'closed', user: { login: 'github-actions[bot]' }, body: `<!-- anonymous-submission:${id} -->` }]);
    if (String(url).endsWith('/api/queue') && options.method === 'POST') { acks++; return Response.json({ acknowledged: true }); }
    creates++; throw new Error('Unexpected issue creation');
  };
  await processQueue({ queueUrl: 'https://test.workers.dev/api/queue', queueSecret: 'test', githubToken: 'test', fetcher });
  assert.equal(creates, 0); assert.equal(acks, 1);
});
test('daily queue cap applies across different client addresses', async () => {
  const f = fixture();
  for (let n = 0; n < 50; n++) assert.equal((await f.submit({ name: `Business ${n}` }, `192.0.2.${n + 1}`)).status, 202);
  assert.equal((await f.submit({ name: 'Over daily cap' }, '192.0.2.200')).status, 429);
});
test('body size and content type checks run before intake', async () => {
  const f = fixture();
  const headers = { origin: ORIGIN, 'Content-Type': 'application/json' };
  assert.equal((await f.app.publicHandler(new Request('https://test/api/submissions', { method: 'POST', headers, body: 'x'.repeat(12001) }))).status, 413);
  assert.equal((await f.app.publicHandler(new Request('https://test/api/submissions', { method: 'POST', headers: { origin: ORIGIN, 'Content-Type': 'text/plain' }, body: '{}' }))).status, 415);
});

test('anonymous corrections accept national listing IDs and validate US states', () => {
  const base = {kind:'correction',name:'Fixture business',address:'1 Example Street, Los Angeles, CA 90012',state:'CA',listingId:'us-btc12345',evidence:'A public merchant source',consent:true};
  assert.equal(validateSubmission(base).state,'CA');
  assert.equal(validateSubmission(base).listingId,'us-btc12345');
  assert.throws(()=>validateSubmission({...base,state:'XX'}),/state/);
  assert.throws(()=>validateSubmission({...base,listingId:'us-btc1?x=1'}),/listing/);
});

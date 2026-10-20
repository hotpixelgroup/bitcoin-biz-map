import { test } from 'node:test';
import assert from 'node:assert/strict';
import { START, END, fingerprint, makeProposal, reviewSection, parseProposal, applyProposal, submissionFromIssue } from '../scripts/map-review.mjs';
import { runReview, authorized } from '../scripts/review-submission.mjs';
const baseMerchant = { city: 'Phoenix', state: 'AZ', category: 'Coffee Shops & Cafés', lat: 33.5, lon: -112.1, osmId: 'node:123', website: 'https://example.com/', phone: '+1 602 555 0100', lightning: true, onchain: false, verified: '' };
const catalog = { source: 'https://example.com/source', imported: '2026-10-20', merchants: [
  { ...baseMerchant, id: 'az-001', name: 'Fixture Cafe', address: '1 Fixture St, Phoenix, AZ' },
  { ...baseMerchant, id: 'az-008', name: 'Echo Coffee', address: '2902 North 68th Street, Scottsdale, AZ 85251', city: 'Scottsdale', phone: '+1 480 422 4081' },
] };
const echo = catalog.merchants.find(row => row.id === 'az-008');
const correction = async () => makeProposal({ kind: 'correction', listingId: echo.id, evidence: 'Normalize existing phone punctuation; keep the same number.' }, catalog);
const noGeocode = async () => Response.json({ result: { addressMatches: [] } });
test('review preparation preserves multiline evidence and supports both issue formats', async () => {
  const body = '### Business name\n\nA Cafe\n\n### Street address and city\n\n1 Test St, Phoenix, AZ\n\n### How do you know they accept bitcoin?\n\nFirst line\nSecond line\n\n### Bitcoin payment methods\n\nLightning';
  const parsed = submissionFromIssue({ body, labels: [{ name: 'merchant-suggestion' }] });
  assert.equal(parsed.name, 'A Cafe'); assert.equal(parsed.evidence, 'First line\nSecond line');
  const proposal = await makeProposal(parsed, catalog, { fetcher: noGeocode });
  assert.equal(proposal.merchant.city, 'Phoenix'); assert.equal(proposal.merchant.lat, null);
  assert.equal(proposal.merchant.lightning, true); assert.equal(proposal.merchant.category, '');
  const anonymous = submissionFromIssue({ body: '### Business\n> Echo Coffee\n\n### Existing map listing\nhttps://hotpixelgroup.github.io/bitcoin-biz-map/#az-008\n\n### Correction and evidence\n> Fix the phone', labels: [{ name: 'merchant-correction' }] });
  assert.equal(anonymous.listingId, 'az-008'); assert.equal(anonymous.evidence, 'Fix the phone');
});
test('only a unique Arizona Census match supplies suggested coordinates', async () => {
  const submission = { kind: 'suggestion', name: 'Cafe', address: '1 Test St, Phoenix, AZ' };
  const match = { addressComponents: { state: 'AZ' }, coordinates: { x: -112.1, y: 33.5 } };
  let queried;
  const good = await makeProposal(submission, catalog, { fetcher: async url => { queried = url; return Response.json({ result: { addressMatches: [match] } }); } });
  assert.equal(queried.hostname, 'geocoding.geo.census.gov'); assert.equal(good.merchant.lat, 33.5); assert.match(good.merchant.coordinateSource, /Census/);
  for (const matches of [[match, match], [{ ...match, addressComponents: { state: 'CA' } }], [{ ...match, coordinates: { x: 0, y: 0 } }]]) {
    assert.equal((await makeProposal(submission, catalog, { fetcher: async () => Response.json({ result: { addressMatches: matches } }) })).merchant.lat, null);
  }
});
test('structured review JSON round-trips without injected markers or mentions', async () => {
  const proposal = await correction(); proposal.evidence = '<!-- map-update:end --> @everyone';
  const body = 'Visitor report' + reviewSection(proposal, catalog);
  assert.deepEqual(parseProposal(body), proposal);
  assert.equal(body.split(START).length, 2); assert.equal(body.split(END).length, 2); assert.ok(!body.includes('@everyone'));
  assert.throws(() => parseProposal(body + reviewSection(proposal, catalog)), /exactly one/);
});
test('approved addition, correction, and removal preserve the directory and audit history', async () => {
  const addition = await makeProposal({ kind: 'suggestion', name: 'A new cafe', address: '1 Test St, Phoenix, AZ', evidence: 'Public confirmation' }, catalog, { fetcher: noGeocode });
  Object.assign(addition.merchant, { category: 'Coffee Shops & Cafés', lat: 33.5, lon: -112.1, coordinateSource: 'Maintainer-verified public map pin' });
  const added = applyProposal(catalog, addition, 99, '2026-10-20T20:00:00Z');
  assert.equal(added.catalog.merchants.length, catalog.merchants.length + 1); assert.equal(added.id, 'us-az-1000099');
  assert.equal(added.catalog.merchants.at(-1).reviewIssue, 'https://github.com/hotpixelgroup/bitcoin-biz-map/issues/99');
  assert.equal(applyProposal(added.catalog, addition, 99).alreadyApplied, true);
  const update = await correction(); update.merchant.phone = '+1-480-422-4081';
  const changed = applyProposal(catalog, update, 100); assert.equal(changed.catalog.merchants.find(row => row.id === echo.id).phone, '+1-480-422-4081');
  assert.deepEqual(changed.catalog.merchants[0], catalog.merchants[0]); assert.equal(catalog.merchants.length, 2);
  const removal = await makeProposal({ kind: 'correction', listingId: echo.id, evidence: 'Public closure notice' }, changed.catalog); removal.action = 'remove';
  const removed = applyProposal(changed.catalog, removal, 101); assert.ok(!removed.catalog.merchants.some(row => row.id === echo.id)); assert.equal(removed.catalog.appliedReviews.length, 2);
});
test('approval rejects stale data, no-op corrections, invalid locations, duplicates, and unsafe fields', async () => {
  const update = await correction(); assert.throws(() => applyProposal(catalog, update, 100), /No listing change/);
  const changed = structuredClone(catalog); changed.merchants.at(-1).phone = 'Different';
  assert.throws(() => applyProposal(changed, update, 100), /changed since preparation/);
  for (const mutate of [p => { p.merchant.lat = null; }, p => { p.merchant.lon = 0; }, p => { p.merchant.website = 'javascript:alert(1)'; }, p => { p.merchant.website = 'https://user:pass@example.com'; }, p => { p.merchant.lightning = 'true'; }, p => { p.merchant.execute = 'bad'; }, p => { p.path = '.github/workflows/site.yml'; }]) {
    const p = structuredClone(update); p.merchant.phone = '123'; mutate(p); assert.throws(() => applyProposal(catalog, p, 100));
  }
  const duplicate = await makeProposal({ kind: 'suggestion', name: echo.name, address: echo.address, evidence: 'Visit' }, catalog, { fetcher: noGeocode }); Object.assign(duplicate.merchant, update.merchant);
  assert.throws(() => applyProposal(catalog, duplicate, 100), /already on the map/);
});
test('only human maintainers can authorize publication', () => {
  assert.ok(authorized('admin', { type: 'User' })); assert.ok(authorized('write', { type: 'User' }));
  for (const permission of ['read', 'triage', 'none']) assert.ok(!authorized(permission, { type: 'User' }));
  assert.ok(!authorized('admin', { type: 'Bot' }));
});
async function workflowFixture() {
  const proposal = await correction(); proposal.merchant.phone = '+1-480-422-4081';
  const issue = { number: 123, state: 'open', body: 'Report' + reviewSection(proposal, catalog), labels: [{ name: 'merchant-correction' }, { name: 'approved' }, { name: 'needs-review' }] };
  const event = { action: 'labeled', issue: structuredClone(issue), label: { name: 'approved' }, sender: { login: 'hotpixelgroup', type: 'User' } };
  const state = { permission: 'admin', refs: { main: 'base-sha' }, files: { 'base-sha': structuredClone(catalog) }, runs: [], comments: [], writes: [], merged: false, failDeployment: false };
  const fetcher = async (url, options = {}) => {
    const u = new URL(url); const path = u.pathname.replace('/repos/hotpixelgroup/bitcoin-biz-map', ''); const method = options.method || 'GET'; const body = options.body ? JSON.parse(options.body) : null;
    if (method !== 'GET') state.writes.push({ path, method, body });
    const result = value => Response.json(value);
    if (path === '/collaborators/hotpixelgroup/permission') return result({ permission: state.permission });
    if (path === '/issues/123' && method === 'GET') return result(issue);
    if (path === '/issues/123' && method === 'PATCH') { Object.assign(issue, body); return result(issue); }
    if (path === '/issues/123/comments' && method === 'GET') return result(state.comments);
    if (path === '/issues/123/comments') { const comment = { id: 1, body: body.body, user: { login: 'github-actions[bot]' } }; state.comments.push(comment); return result(comment); }
    if (path === '/issues/comments/1') { state.comments[0].body = body.body; return result(state.comments[0]); }
    if (path === '/issues/123/labels' || path.startsWith('/issues/123/labels/')) return result([]);
    if (path.startsWith('/git/ref/heads/')) { const ref = path.split('/heads/')[1]; return state.refs[ref] ? result({ object: { sha: state.refs[ref] } }) : new Response('{}', { status: 404 }); }
    if (path === '/git/refs') { state.refs[body.ref.replace('refs/heads/', '')] = body.sha; return result({}); }
    if (path === '/contents/dist/merchants.json') {
      if (method === 'GET') { const ref = u.searchParams.get('ref'); const data = state.files[state.refs[ref] || ref]; state.lastReadData = data; return result({ sha: 'blob-sha', encoding: state.largeCatalog ? 'none' : 'base64', content: state.largeCatalog ? '' : Buffer.from(JSON.stringify(data)).toString('base64') }); }
      state.files['data-sha'] = JSON.parse(Buffer.from(body.content, 'base64').toString()); state.refs[body.branch] = 'data-sha'; return result({ commit: { sha: 'data-sha' } });
    }
    if (path === '/git/blobs/blob-sha') { state.blobReads = (state.blobReads || 0) + 1; return result({encoding:'base64',content:Buffer.from(JSON.stringify(state.lastReadData)).toString('base64')}); }
    if (path === '/pulls' && method === 'GET') return result([]);
    if (path === '/pulls') { state.runs.push({ id: 100, event: 'pull_request', head_sha: 'data-sha', status: 'completed', conclusion: 'action_required', pull_requests: [{ number: 124, head: { repo: { name: 'bitcoin-biz-map', url: 'https://api.github.com/repos/hotpixelgroup/bitcoin-biz-map' } } }] }); return result({ number: 124, html_url: 'https://github.com/hotpixelgroup/bitcoin-biz-map/pull/124' }); }
    if (path === '/pulls/124/files') return result([{ filename: 'dist/merchants.json' }]);
    if (path === '/actions/workflows/site.yml/runs') return result({ workflow_runs: state.runs.filter(run => u.searchParams.get('event') === 'pull_request' ? run.event === 'pull_request' : run.ref === u.searchParams.get('branch')) });
    if (path === '/actions/runs/100/approve') { assert.ok(state.runs.some(run => run.ref && run.ref !== 'main' && run.conclusion === 'success')); state.runs.find(run => run.id === 100).conclusion = 'success'; return new Response(null, { status: 201 }); }
    if (path === '/actions/runs/100') return result(state.runs.find(run => run.id === 100));
    if (path === '/actions/workflows/site.yml/dispatches') {
      if (body.ref === 'main') assert.ok(state.merged, 'Pages must deploy after merging');
      state.runs.push({ id: state.runs.length + 1, ref: body.ref, head_sha: state.refs[body.ref], status: 'completed', conclusion: body.ref === 'main' && state.failDeployment ? 'failure' : 'success', html_url: 'https://github.com/hotpixelgroup/bitcoin-biz-map/actions/runs/1' }); return new Response(null, { status: 204 });
    }
    if (path === '/pulls/124/merge') {
      assert.ok(state.runs.some(run => run.head_sha === body.sha && run.ref !== 'main' && run.conclusion === 'success'), 'Required checks must precede merge');
      assert.equal(state.runs.find(run => run.id === 100).conclusion, 'success', 'PR workflow approval and validation must precede merge');
      assert.equal(body.sha, 'data-sha'); state.merged = true; state.refs.main = 'merged-sha'; state.files['merged-sha'] = state.files['data-sha']; return result({ merged: true, sha: 'merged-sha' });
    }
    throw Error(`Unexpected ${method} ${path}`);
  };
  return { state, issue, event, fetcher, options: { event, mode: 'publish', token: 'test-only', fetcher, sleep: async () => {} } };
}
test('approved workflow creates a data-only PR, validates, merges, deploys, and closes the issue', async () => {
  const f = await workflowFixture(); await runReview(f.options);
  assert.equal(f.issue.state, 'closed'); assert.ok(f.state.merged); assert.ok(f.state.writes.some(write => write.path === '/actions/runs/100/approve')); assert.match(f.state.comments[0].body, /Published to the/);
  assert.equal(f.state.writes.filter(write => write.path === '/contents/dist/merchants.json').length, 1);
  assert.ok(f.state.writes.some(write => write.path === '/issues/123/labels' && write.body.labels.includes('published')));
});
test('untrusted approvers and edited or withdrawn approvals cannot write map data', async () => {
  for (const mutate of [f => { f.state.permission = 'triage'; }, f => { f.event.sender.type = 'Bot'; }, f => { f.issue.body += 'Changed'; }, f => { f.issue.labels = f.issue.labels.filter(label => label.name !== 'approved'); }]) {
    const f = await workflowFixture(); mutate(f); await assert.rejects(runReview(f.options));
    assert.ok(!f.state.writes.some(write => write.path === '/contents/dist/merchants.json')); assert.ok(!f.state.merged);
  }
});
test('a post-merge deployment failure is recoverable without applying or merging twice', async () => {
  const f = await workflowFixture(); f.state.failDeployment = true;
  await assert.rejects(runReview(f.options), /deployment failed/); assert.ok(f.state.merged); assert.equal(f.issue.state, 'open');
  f.state.failDeployment = false; await runReview(f.options); assert.equal(f.issue.state, 'closed');
  assert.equal(f.state.writes.filter(write => write.path === '/pulls/124/merge').length, 1);
  assert.equal(f.state.writes.filter(write => write.path === '/contents/dist/merchants.json').length, 1);
});
test('national review accepts matching state coordinates and geocodes only the requested state', async () => {
  const submission = { kind:'suggestion',name:'National fixture',address:'1 Example St, Los Angeles, CA 90012',state:'CA',evidence:'A public dated merchant statement' };
  const hit = {addressComponents:{state:'CA'},coordinates:{x:-118.24,y:34.05}};
  const proposal = await makeProposal(submission,catalog,{fetcher:async()=>Response.json({result:{addressMatches:[hit]}})});
  assert.equal(proposal.merchant.state,'CA'); assert.equal(proposal.merchant.lat,34.05);
  proposal.merchant.category='Shopping & Services';
  const result = applyProposal(catalog,proposal,200);
  assert.equal(result.id,'us-ca-1000200');
  assert.equal(result.catalog.merchants.at(-1).verification.type,'maintainer-reviewed');
  proposal.merchant.state='AZ'; assert.throws(()=>applyProposal(catalog,proposal,201),/state/);
  const mismatch = await makeProposal(submission,catalog,{fetcher:async()=>Response.json({result:{addressMatches:[{...hit,addressComponents:{state:'AZ'}}]}})});
  assert.equal(mismatch.merchant.lat,null);
});
test('national correction links identify the exact listing', () => {
  const issue = {labels:[{name:'merchant-correction'}],body:'### Existing map listing\nhttps://hotpixelgroup.github.io/bitcoin-biz-map/?state=CA#us-btc12345\n\n### State\nCA'};
  assert.equal(submissionFromIssue(issue).listingId,'us-btc12345');
});

test('review reads Git blobs when the national catalog exceeds the Contents API inline limit', async () => {
  const f = await workflowFixture(); f.state.largeCatalog = true;
  await runReview(f.options);
  assert.ok(f.state.blobReads > 0); assert.ok(f.state.merged);
});

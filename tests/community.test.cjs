const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const context = { URL };
runInNewContext(readFileSync('dist/community.js', 'utf8'), context);
const { issueUrl } = context.BitcoinCommunity;
const issuePath = '/hotpixelgroup/bitcoin-biz-map/issues/new';

test('suggestions open the dedicated form without privileged URL parameters', () => {
  const url = new URL(issueUrl('suggestion'));
  assert.equal(url.origin, 'https://github.com');
  assert.equal(url.pathname, issuePath);
  assert.equal(url.searchParams.get('template'), 'suggest_business.yml');
  assert.deepEqual([...url.searchParams.keys()], ['template']);
});

test('general corrections do not invent a selected merchant', () => {
  const url = new URL(issueUrl('correction'));
  assert.equal(url.searchParams.get('template'), 'merchant_correction.yml');
  assert.equal(url.searchParams.has('merchant'), false);
});

test('every merchant report identifies the exact branch and public map listing', () => {
  const { merchants } = JSON.parse(readFileSync('dist/merchants.json', 'utf8'));
  for (const merchant of merchants) {
    const url = new URL(issueUrl('correction', merchant));
    assert.equal(url.pathname, issuePath);
    assert.equal(url.searchParams.get('title'), `[Listing correction] ${merchant.name}`);
    assert.equal(url.searchParams.get('merchant'), `${merchant.name} — ${merchant.address || merchant.city}`);
    assert.equal(url.searchParams.get('listing_url'), `https://hotpixelgroup.github.io/bitcoin-biz-map/#${merchant.id}`);
    assert.equal(url.searchParams.has('labels'), false);
    assert.equal(url.searchParams.has('assignees'), false);
    assert.equal(url.searchParams.has('lat'), false);
    assert.equal(url.searchParams.has('lon'), false);
  }
});

test('special characters remain text inside the intended GitHub form', () => {
  const merchant = { name: 'A&B #1? <Cafe> "☕"', address: '10 Main St, Mesa, AZ & suite #2', id: 'az-001' };
  const url = new URL(issueUrl('correction', merchant));
  assert.equal(url.origin, 'https://github.com');
  assert.equal(url.hash, '');
  assert.equal(url.searchParams.get('merchant'), `${merchant.name} — ${merchant.address}`);
  assert.equal(url.searchParams.get('title'), `[Listing correction] ${merchant.name}`);
});

test('prefilled correction keys exist in the GitHub issue form schema', () => {
  const form = readFileSync('.github/ISSUE_TEMPLATE/merchant_correction.yml', 'utf8');
  const ids = [...form.matchAll(/^\s+id: (.+)$/gm)].map(match => match[1]);
  for (const key of ['merchant', 'listing_url', 'correction']) assert.ok(ids.includes(key));
});

test('unknown submission types cannot generate an issue link', () => {
  assert.throws(() => issueUrl('other'), /Unknown community submission type/);
});

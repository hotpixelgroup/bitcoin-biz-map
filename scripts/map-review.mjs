import '../dist/geography.js';
import { createHash } from 'node:crypto';
export const START = '<!-- map-update:start -->';
export const END = '<!-- map-update:end -->';
export const fingerprint = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const fields = ['name', 'address', 'city', 'state', 'category', 'lat', 'lon', 'website', 'phone', 'lightning', 'onchain', 'osmId', 'coordinateSource', 'verified'];
const clean = value => typeof value === 'string' ? value.trim().replace(/[\u0000-\u001f\u007f]/g, ' ') : '';
export function section(body, heading) {
  const match = body.match(new RegExp(`^### ${heading}\\s*\\n([\\s\\S]*?)(?=^### |(?![\\s\\S]))`, 'm'));
  return (match?.[1] || '').trim().replace(/^> ?/gm, '').replace(/^_No response_$/, '');
}
export function submissionFromIssue(issue) {
  const body = issue.body || '';
  const correction = issue.labels.some(label => label.name === 'merchant-correction');
  const url = section(body, 'Existing map listing') || section(body, 'Link to the map listing');
  return {
    kind: correction ? 'correction' : 'suggestion',
    listingId: (value => BitcoinGeo.validId(value) ? value : '')(url.match(/\/bitcoin-biz-map\/(?:\?[^#\s]*)?#([a-z0-9-]+)(?:\s|$)/)?.[1]),
    name: section(body, 'Business') || section(body, 'Business name') || section(body, 'Merchant name and address'),
    state: section(body, 'State'),
    address: section(body, 'Address') || section(body, 'Street address and city'),
    website: section(body, 'Website') || section(body, 'Business website or public listing'),
    payment: section(body, 'Payment method / correction type') || section(body, 'Bitcoin payment methods'),
    evidence: section(body, 'Bitcoin acceptance evidence') || section(body, 'How do you know they accept bitcoin\\?') || section(body, 'Correction and evidence') || section(body, 'Correction and public source'),
  };
}
export async function makeProposal(submission, catalog, { fetcher = fetch } = {}) {
  const current = catalog.merchants.find(row => row.id === submission.listingId);
  const merchant = Object.fromEntries(fields.map(key => [key, current?.[key] ?? (key === 'state' && current?.id.startsWith('az-') ? 'AZ' : ['lat', 'lon'].includes(key) ? null : ['lightning', 'onchain'].includes(key) ? false : '')]));
  if (!current && submission.kind === 'suggestion') {
    Object.assign(merchant, { name: clean(submission.name), address: clean(submission.address), website: /^https?:\/\//.test(submission.website || '') ? submission.website : '', state: (BitcoinGeo.states[clean(submission.state)] ? clean(submission.state) : '') || BitcoinGeo.stateFromAddress(submission.address) || clean(submission.address).match(/\b([A-Z]{2})\s*$/)?.[1] || '', city: clean(submission.address).split(',').at(-2)?.trim() || '', lightning: /Lightning/.test(submission.payment || ''), onchain: /[Oo]n-chain/.test(submission.payment || '') });
    try {
      const url = new URL('https://geocoding.geo.census.gov/geocoder/locations/onelineaddress');
      url.search = new URLSearchParams({ address: merchant.address, benchmark: 'Public_AR_Current', format: 'json' });
      const response = await fetcher(url, { redirect: 'error', signal: AbortSignal.timeout(10000) });
      if (response.ok) {
        const matches = (await response.json()).result?.addressMatches || [];
        if (matches.length === 1 && BitcoinGeo.states[matches[0].addressComponents?.state] && (!merchant.state || matches[0].addressComponents.state === merchant.state)) {
          const { x: lon, y: lat } = matches[0].coordinates || {};
          if (validCoordinates(lat, lon, matches[0].addressComponents.state)) Object.assign(merchant, { state: matches[0].addressComponents.state, lat, lon, coordinateSource: 'US Census Geocoder / Public_AR_Current (address-range estimate; reviewed by maintainer)' });
        }
      }
    } catch { /* Missing or ambiguous coordinates must be supplied by the reviewer. */ }
  }
  return { action: submission.kind === 'correction' ? 'update' : 'add', listingId: current?.id || submission.listingId || '', expected: current ? fingerprint(current) : '', evidence: clean(submission.evidence).slice(0, 2000), merchant };
}
export function reviewSection(proposal, catalog) {
  const categories = [...new Set(catalog.merchants.map(row => row.category))].sort();
  const json = JSON.stringify(proposal, null, 2).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/@/g, '\\u0040');
  return `\n\n${START}\n### Maintainer: publish this map update\n\n1. Verify the evidence. Use the issue's **Edit** menu to review the JSON below and fill any blank city, category, coordinates, or coordinate source. Census coordinates are estimates; check the pin.\n2. For corrections, **edit the current listing below to the desired final values**. To remove a closed business, duplicate, or a place that no longer accepts bitcoin, set \`action\` to \`remove\`. If no listing was identified, set the original report’s map-listing URL, then remove this whole generated section and reapply \`needs-review\` to prepare it again.\n3. Add the **approved** label. Automation creates a data-only PR, runs the required checks, merges it, and republishes Pages. No second merge click is needed. Remove the label to cancel before merging. If validation fails, fix the JSON and remove/reapply \`approved\`.\n\nFor a correction, retain \`expected\`: it prevents overwriting a newer listing. Nothing publishes when the proposed correction makes no change.\n\n<details><summary>Existing categories</summary>\n\n${categories.join(' · ')}\n\n</details>\n\n\`\`\`json\n${json}\n\`\`\`\n${END}`;
}
export function parseProposal(body) {
  if (body.split(START).length !== 2 || body.split(END).length !== 2) throw Error('Expected exactly one prepared Map update section.');
  const inside = body.split(START)[1].split(END)[0];
  const matches = [...inside.matchAll(/^```json\s*\n([\s\S]*?)\n```\s*$/gm)];
  if (matches.length !== 1 || matches[0][1].length > 15000) throw Error('Keep exactly one JSON object in the Map update section.');
  try { return JSON.parse(matches[0][1]); } catch { throw Error('Map update JSON is invalid. Edit it and reapply approved.'); }
}
export const validCoordinates = BitcoinGeo.coordinates;
function assertKeys(value, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !allowed.includes(key))) throw Error('Map update contains unsupported fields.');
}
export function applyProposal(catalog, proposal, issueNumber, now = new Date().toISOString()) {
  assertKeys(proposal, ['action', 'listingId', 'expected', 'evidence', 'merchant']);
  if (!Number.isSafeInteger(issueNumber) || issueNumber < 1 || !['add', 'update', 'remove'].includes(proposal.action)) throw Error('Invalid update action or issue number.');
  const hash = fingerprint(proposal);
  if ((catalog.appliedReviews || []).some(item => item.issue === issueNumber && item.hash === hash)) return { catalog, hash, alreadyApplied: true };
  if (typeof proposal.evidence !== 'string' || !proposal.evidence.trim() || proposal.evidence.length > 2000) throw Error('Public evidence is required before approval.');
  const copy = structuredClone(catalog);
  const current = copy.merchants.find(row => row.id === proposal.listingId);
  if (proposal.action !== 'add' && (!current || fingerprint(current) !== proposal.expected)) throw Error('The listing is missing or changed since preparation. Regenerate the Map update section and review it again.');
  const id = proposal.action === 'add' ? `us-${(proposal.merchant?.state || '').toLowerCase()}-${1000000 + issueNumber}` : current.id;
  if (!BitcoinGeo.validId(id)) throw Error('Invalid listing ID.');
  if (proposal.action === 'remove') copy.merchants = copy.merchants.filter(row => row.id !== id);
  else {
    assertKeys(proposal.merchant, fields);
    const m = { ...proposal.merchant };
    for (const [key, max] of Object.entries({ name: 120, address: 300, city: 100, state: 2, category: 100, website: 500, phone: 80, coordinateSource: 500, osmId: 80, verified: 10 })) {
      if (m[key] === undefined && ['phone', 'website', 'coordinateSource', 'osmId', 'verified'].includes(key)) m[key] = '';
      if (typeof m[key] !== 'string' || m[key].length > max || /[\u0000-\u001f\u007f]/.test(m[key])) throw Error(`Invalid ${key}.`);
      m[key] = m[key].trim();
    }
    if (!m.name || !m.city || !m.category || (!m.address && proposal.action === 'add')) throw Error('Business name, street address, city, and category are required.');
    if (!BitcoinGeo.states[m.state] || !validCoordinates(m.lat, m.lon, m.state)) throw Error('Supply a US state code and coordinates within that state before approving.');
    if (typeof m.lightning !== 'boolean' || typeof m.onchain !== 'boolean') throw Error('Payment methods must be true or false.');
    if (m.osmId && !/^(node|way|relation):\d+$/.test(m.osmId)) throw Error('Invalid OpenStreetMap ID.');
    if (!m.osmId && !m.coordinateSource) throw Error('A public coordinate source is required.');
    if (m.website) { let url; try { url = new URL(m.website); } catch { throw Error('Invalid website URL.'); } if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw Error('Use a public HTTP(S) business website.'); }
    if (m.verified && (!/^\d{4}-\d{2}-\d{2}$/.test(m.verified) || !Number.isFinite(Date.parse(m.verified)) || new Date(m.verified).toISOString().slice(0, 10) !== m.verified)) throw Error('Verified date must be YYYY-MM-DD or empty.');
    if (proposal.action === 'add' && copy.merchants.some(row => row.id === id)) throw Error('This issue already added a business. Submit a correction instead.');
    if (copy.merchants.some(row => row.id !== id && row.name.toLowerCase() === m.name.toLowerCase() && row.address.toLowerCase() === m.address.toLowerCase())) throw Error('This business and address are already on the map.');
    if (current && fields.every(key => (current[key] ?? (key === 'state' && current.id.startsWith('az-') ? 'AZ' : '')) === m[key])) throw Error('No listing change was specified. Edit the current details before approving.');
    const merchant = { ...current, ...m, id, verification: { type: 'maintainer-reviewed', checkedAt: now.slice(0, 10), sourceUrl: `https://github.com/hotpixelgroup/bitcoin-biz-map/issues/${issueNumber}`, summary: proposal.evidence }, reviewIssue: `https://github.com/hotpixelgroup/bitcoin-biz-map/issues/${issueNumber}`, reviewedAt: now.slice(0, 10) };
    if (proposal.action === 'add') copy.merchants.push(merchant);
    else copy.merchants[copy.merchants.findIndex(row => row.id === id)] = merchant;
  }
  if (!copy.merchants.length) throw Error('The directory cannot be empty.');
  copy.appliedReviews = [...(copy.appliedReviews || []), { issue: issueNumber, hash, action: proposal.action, listingId: id, reviewedAt: now }];
  copy.updated = now;
  return { catalog: copy, hash, id, alreadyApplied: false };
}

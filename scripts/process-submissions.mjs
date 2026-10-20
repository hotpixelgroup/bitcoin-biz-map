import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { makeProposal, reviewSection } from './map-review.mjs';
import { validateSubmission, REPO, MAP } from '../backend/lib/intake.js';
const api = `https://api.github.com/repos/${REPO}`;
const quote = value => String(value || 'Not supplied').replace(/@/g, '＠').replace(/</g, '&lt;').replace(/>/g, '&gt;').split('\n').map(line => `> ${line}`).join('\n');
export function issuePayload(record) {
  if (!/^[a-f0-9]{64}$/.test(record.id || '') || !Number.isFinite(Date.parse(record.receivedAt))) throw new Error('Invalid queue record');
  const s = validateSubmission({ ...record.submission, consent: true });
  const correction = s.kind === 'correction';
  const listing = s.listingId ? `${MAP}#${s.listingId}` : 'Not supplied';
  return {
    title: `[${correction ? 'Listing correction' : 'New business'}] ${s.name.replace(/[\r\n]/g, ' ').replace(/@/g, '＠')}`,
    body: `Submitted by an **anonymous map visitor**. This is an unverified suggestion for maintainer review.\n\n### Business\n${quote(s.name)}\n\n### Address\n${quote(s.address)}\n\n### Website\n${quote(s.website)}\n\n### ${correction ? 'Correction and evidence' : 'Bitcoin acceptance evidence'}\n${quote(s.evidence)}\n\n### Payment method / correction type\n${quote(correction ? s.problem : s.payment)}\n\n### Additional notes\n${quote(s.notes)}\n\n### Existing map listing\n${listing}\n\nReceived: ${record.receivedAt}\n\n<!-- anonymous-submission:${record.id} -->`,
    labels: [correction ? 'merchant-correction' : 'merchant-suggestion', 'needs-review'],
    assignees: ['hotpixelgroup'],
  };
}
export async function processQueue({ queueUrl, queueSecret, githubToken, catalog = { merchants: [] }, fetcher = fetch }) {
  const endpoint = new URL(queueUrl);
  if (endpoint.protocol !== 'https:' || endpoint.pathname !== '/api/queue') throw new Error('Invalid private queue URL');
  const queueHeaders = { Authorization: `Bearer ${queueSecret}`, 'Content-Type': 'application/json' };
  const ghHeaders = { Authorization: `Bearer ${githubToken}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10', 'Content-Type': 'application/json' };
  async function request(url, options) {
    const response = await fetcher(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`Queue processing request failed (${response.status})`);
    return response.json();
  }
  const { submissions } = await request(endpoint, { headers: queueHeaders });
  if (!Array.isArray(submissions) || submissions.length > 20) throw new Error('Invalid queue batch');
  if (!submissions.length) return 0;
  const earliest = new Date(Math.min(...submissions.map(item => Date.parse(item.receivedAt))) - 86400000).toISOString();
  const existing = [];
  // List instead of search: GitHub search indexes can lag after an issue is
  // created. Include closed issues to survive an acknowledgment failure.
  for (let page = 1; ; page++) {
    const url = `${api}/issues?state=all&sort=created&direction=desc&per_page=100&since=${encodeURIComponent(earliest)}&page=${page}`;
    const batch = await request(url, { headers: ghHeaders });
    if (!Array.isArray(batch)) throw new Error('Invalid GitHub issues response');
    existing.push(...batch.filter(item => !item.pull_request));
    if (batch.length < 100) break;
    if (page >= 50) throw new Error('Issue history too large for safe deduplication');
  }
  for (const item of submissions) {
    const payload = issuePayload(item);
    const marker = `<!-- anonymous-submission:${item.id} -->`;
    let issue = existing.find(candidate => candidate.user?.login === 'github-actions[bot]' && candidate.body?.includes(marker));
    if (!issue) {
      // Do not retry a failed create here: a timeout may hide a successful
      // creation. The next workflow run checks the marker before retrying.
      payload.body += reviewSection(await makeProposal(item.submission, catalog, { fetcher }), catalog);
      issue = await request(`${api}/issues`, { method: 'POST', headers: ghHeaders, body: JSON.stringify(payload) });
      existing.push(issue);
    }
    if (!Number.isSafeInteger(issue.number)) throw new Error('Invalid created issue');
    await request(endpoint, { method: 'POST', headers: queueHeaders, body: JSON.stringify({ id: item.id, issueNumber: issue.number }) });
    console.log(`Processed submission ${item.id.slice(0, 12)} as issue #${issue.number}`);
  }
  return submissions.length;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { SUBMISSION_QUEUE_URL, SUBMISSION_QUEUE_SECRET, GH_TOKEN } = process.env;
  if (!SUBMISSION_QUEUE_URL || !SUBMISSION_QUEUE_SECRET || !GH_TOKEN) throw new Error('Submission processor secrets are not configured');
  await processQueue({ queueUrl: SUBMISSION_QUEUE_URL, queueSecret: SUBMISSION_QUEUE_SECRET, githubToken: GH_TOKEN, catalog: JSON.parse(readFileSync(new URL('../dist/merchants.json', import.meta.url), 'utf8')) });
}

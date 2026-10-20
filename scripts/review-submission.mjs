import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { START, END, fingerprint, makeProposal, reviewSection, submissionFromIssue, parseProposal, applyProposal } from './map-review.mjs';
const REPO = 'hotpixelgroup/bitcoin-biz-map';
const MAP = 'https://hotpixelgroup.github.io/bitcoin-biz-map/';
const statusMarker = '<!-- map-review-status -->';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
export function authorized(permission, user) {
  return user?.type === 'User' && ['admin', 'maintain', 'write'].includes(permission);
}
export async function runReview({ event, mode, token, fetcher = fetch, sleep = pause }) {
  if (process.env.GITHUB_REPOSITORY && process.env.GITHUB_REPOSITORY !== REPO) throw Error('This workflow is restricted to its configured repository.');
  const number = event.issue?.number || Number(event.inputs?.issue_number);
  if (!Number.isSafeInteger(number) || number < 1 || event.issue?.pull_request) throw Error('A valid business issue is required.');
  const root = `https://api.github.com/repos/${REPO}`;
  async function api(path, method = 'GET', body) {
    const response = await fetcher(root + path, { method, redirect: 'error', headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10', ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000) });
    if (!response.ok) { const error = Error(`GitHub request failed (${response.status}): ${method} ${path.split('?')[0]}`); error.status = response.status; throw error; }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }
  async function file(ref) {
    const result = await api(`/contents/dist/merchants.json?ref=${encodeURIComponent(ref)}`);
    // Contents responses omit content for files larger than 1 MB. The national
    // catalog uses the Git blob endpoint, which supports the complete file.
    const blob = result.content ? result : await api(`/git/blobs/${result.sha}`);
    if (blob.encoding && blob.encoding !== 'base64') throw Error('Unsupported catalog encoding');
    return { catalog: JSON.parse(Buffer.from(blob.content, 'base64').toString()), sha: result.sha };
  }
  let issue = await api(`/issues/${number}`);
  const isBusiness = value => value.labels.some(label => ['merchant-suggestion', 'merchant-correction'].includes(label.name));
  if (issue.pull_request || issue.state !== 'open' || !isBusiness(issue)) return;
  if (mode === 'prepare') {
    if ((issue.body || '').includes(START) || (issue.body || '').includes(END)) return;
    const { catalog } = await file('main');
    const proposal = await makeProposal(submissionFromIssue(issue), catalog, { fetcher });
    // Preserve the visitor's report; only append an explicit review section.
    const latest = await api(`/issues/${number}`);
    if (latest.body !== issue.body || latest.state !== 'open') throw Error('Issue changed during preparation. Reapply needs-review.');
    await api(`/issues/${number}`, 'PATCH', { body: (issue.body || '') + reviewSection(proposal, catalog) });
    return;
  }
  if (mode !== 'publish') throw Error('Invalid review mode.');
  const sender = event.sender;
  const permissions = await api(`/collaborators/${encodeURIComponent(sender?.login || '')}/permission`);
  if (!authorized(permissions.permission, sender)) throw Error('Only a human maintainer with write access can approve publication.');
  if (event.action && (event.action !== 'labeled' || event.label?.name !== 'approved')) throw Error('Publication requires the approved label event.');
  const approvedBody = event.issue ? event.issue.body : issue.body;
  async function assertApproval() {
    const current = await api(`/issues/${number}`);
    if (current.state !== 'open' || !isBusiness(current) || !current.labels.some(label => label.name === 'approved') || current.body !== approvedBody) throw Error('Approval was withdrawn or the issue changed. Review the current JSON and reapply approved.');
  }
  let statusId;
  async function status(message) {
    if (!statusId) {
      for (let page = 1; page <= 10; page++) {
        const comments = await api(`/issues/${number}/comments?per_page=100&page=${page}`);
        statusId = comments.find(comment => comment.user?.login === 'github-actions[bot]' && comment.body?.includes(statusMarker))?.id;
        if (statusId || comments.length < 100) break;
      }
    }
    const body = `${statusMarker}\n${message}`;
    if (statusId) await api(`/issues/comments/${statusId}`, 'PATCH', { body });
    else statusId = (await api(`/issues/${number}/comments`, 'POST', { body })).id;
  }
  async function validateAndDeploy(ref, sha) {
    const path = '/actions/workflows/site.yml/runs';
    const query = `?event=workflow_dispatch&branch=${encodeURIComponent(ref)}&per_page=100`;
    const previous = new Set((await api(path + query)).workflow_runs.map(run => run.id));
    await api('/actions/workflows/site.yml/dispatches', 'POST', { ref });
    for (let count = 0; count < 90; count++) {
      await sleep(5000);
      const runs = (await api(path + query)).workflow_runs;
      const run = runs.find(value => !previous.has(value.id) && (ref === 'main' || value.head_sha === sha));
      if (run?.status === 'completed') {
        if (run.conclusion !== 'success') throw Error(`Site validation or deployment failed. Inspect Actions run ${run.id}; the approval remains reviewable.`);
        return run.html_url;
      }
    }
    throw Error('Timed out waiting for site validation or deployment. Reapply approved to resume.');
  }
  async function validatePullRequest(pullNumber, head) {
    // GitHub holds workflows from GITHUB_TOKEN-created PRs for approval. The
    // dispatched branch check alone does not satisfy that PR's required suite.
    // Only approve site.yml for this exact, already-validated data-only PR.
    const runs = (await api(`/actions/workflows/site.yml/runs?event=pull_request&head_sha=${head}&per_page=100`)).workflow_runs;
    for (const run of runs) {
      if (run.head_sha !== head || !run.pull_requests?.some(pull => pull.number === pullNumber && pull.head?.repo?.name === 'bitcoin-biz-map' && pull.head?.repo?.url === `https://api.github.com/repos/${REPO}`)) continue;
      if (run.conclusion === 'action_required') await api(`/actions/runs/${run.id}/approve`, 'POST');
      for (let count = 0; count < 90; count++) {
        const current = await api(`/actions/runs/${run.id}`);
        if (current.status === 'completed' && current.conclusion !== 'action_required') {
          if (current.conclusion !== 'success') throw Error(`Required PR validation failed. Inspect Actions run ${run.id}.`);
          break;
        }
        if (count === 89) throw Error('Timed out waiting for required PR validation. Reapply approved to retry.');
        await sleep(5000);
      }
    }
  }
  try {
    await assertApproval();
    const proposal = parseProposal(approvedBody);
    await status('Approval received. Preparing a data-only pull request; the existing branch protections and site checks still apply.');
    let publishedId, pullUrl, deploymentUrl;
    for (let attempt = 0; attempt < 3; attempt++) {
      await assertApproval();
      const main = (await api('/git/ref/heads/main')).object.sha;
      const source = await file(main);
      const result = applyProposal(source.catalog, proposal, number);
      if (result.alreadyApplied) {
        publishedId = source.catalog.appliedReviews.find(item => item.issue === number && item.hash === result.hash).listingId;
        deploymentUrl = await validateAndDeploy('main', main);
        break;
      }
      const branch = `map-update-${number}-${result.hash.slice(0, 12)}-${main.slice(0, 7)}`;
      const content = JSON.stringify(result.catalog, null, 2) + '\n';
      let head;
      try { head = (await api(`/git/ref/heads/${branch}`)).object.sha; }
      catch (error) {
        if (error.status !== 404) throw error;
        await api('/git/refs', 'POST', { ref: `refs/heads/${branch}`, sha: main });
        head = main;
      }
      if (head === main) {
        const commit = await api('/contents/dist/merchants.json', 'PUT', { message: `Apply approved map submission #${number}`, branch, sha: source.sha, content: Buffer.from(content).toString('base64') });
        head = commit.commit.sha;
      } else {
        const existing = (await file(branch)).catalog;
        // The timestamp may differ on a retry. Compare the reviewed operation and
        // all merchant values, not arbitrary edits on a human-modified branch.
        const normalizeRetry = value => { const copy = structuredClone(value); delete copy.updated; for (const review of copy.appliedReviews || []) { if (review.issue === number && review.hash === result.hash) delete review.reviewedAt; } return copy; };
        if (fingerprint(normalizeRetry(existing)) !== fingerprint(normalizeRetry(result.catalog))) throw Error('The automation branch was modified. Inspect its pull request before retrying.');
      }
      let pull = (await api(`/pulls?state=open&head=${encodeURIComponent('hotpixelgroup:' + branch)}&base=main`))[0];
      if (!pull) {
        pull = await api('/pulls', 'POST', { title: `Publish approved map submission #${number}`, head: branch, base: 'main', body: `Applies the exact structured map update approved by @${sender.login} in #${number}.\n\nOnly dist/merchants.json is changed. Validation and protected-branch merge run automatically. The issue is closed after Pages deployment succeeds.\n\n<!-- approved-map-update:${number}:${result.hash} -->` });
      }
      pullUrl = pull.html_url;
      await status(`Preparing [pull request #${pull.number}](${pullUrl}). Running the required **Validate site** check before automatic merge.`);
      const changed = await api(`/pulls/${pull.number}/files?per_page=100`);
      if (changed.length !== 1 || changed[0].filename !== 'dist/merchants.json') throw Error('The pull request contains changes outside the merchant directory.');
      await validateAndDeploy(branch, head);
      await assertApproval();
      await validatePullRequest(pull.number, head);
      await assertApproval();
      const remoteHead = (await api(`/git/ref/heads/${branch}`)).object.sha;
      if (remoteHead !== head) throw Error('The pull request changed after validation. Review it before retrying.');
      if ((await api('/git/ref/heads/main')).object.sha !== main) {
        await api(`/pulls/${pull.number}`, 'PATCH', { state: 'closed' });
        continue;
      }
      const merged = await api(`/pulls/${pull.number}/merge`, 'PUT', { merge_method: 'squash', sha: head });
      if (!merged.merged) throw Error('GitHub branch protections prevented merging. Inspect the pull request.');
      publishedId = result.id;
      await status(`Merged [pull request #${pull.number}](${pullUrl}). Validating and deploying the updated public map now.`);
      deploymentUrl = await validateAndDeploy('main', merged.sha);
      break;
    }
    if (!deploymentUrl) throw Error('The main branch changed repeatedly. Reapply approved to retry against the latest data.');
    await api(`/issues/${number}/labels`, 'POST', { labels: ['published'] });
    for (const name of ['needs-review', 'approval-blocked']) {
      try { await api(`/issues/${number}/labels/${name}`, 'DELETE'); } catch (error) { if (error.status !== 404) throw error; }
    }
    await status(`Published to the [public map](${MAP}${proposal.action === 'remove' ? '' : '#' + publishedId}). ${pullUrl ? `[View the data change](${pullUrl}) · ` : ''}[Successful Pages deployment](${deploymentUrl}).\n\nThis issue is now complete. Further changes should use a new correction issue.`);
    await api(`/issues/${number}`, 'PATCH', { state: 'closed', state_reason: 'completed' });
    return { publishedId, pullUrl, deploymentUrl };
  } catch (error) {
    const message = String(error.message).replace(/[@<>]/g, '').slice(0, 600);
    await status(`**Map update paused:** ${message}\n\nNo branch protections were bypassed. Fix the structured Map update, then remove/reapply **approved**. If the PR already merged, reapplying the label resumes deployment without applying the same update twice.`);
    await api(`/issues/${number}/labels`, 'POST', { labels: ['approval-blocked'] });
    throw error;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runReview({ event: JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')), mode: process.env.REVIEW_MODE, token: process.env.GH_TOKEN });
}

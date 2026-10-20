# Anonymous community intake — deployment pending

The map stays on GitHub Pages. A small Vercel Functions project rooted at `backend/` accepts anonymous suggestions into private Vercel Blob storage. A GitHub Actions workflow polls the queue on a five-minute schedule and creates ordinary review issues with its short-lived, repository-scoped `issues: write` token. The backend never receives a personal GitHub token. Scheduled Actions may be delayed by GitHub; the UI promises receipt of the suggestion, rather than instant publication.

This branch is prepared for review. No backend or store has been provisioned, no intake secrets have been configured, and the public endpoint is intentionally blank until deployment is approved and verified. Keep the draft PR unmerged until the integration is live and the public endpoint has been set.

## Scope and controls

- JSON only, 12 KB request cap, bounded text fields, public-sharing consent, strict website protocols, and exact CORS origin `https://hotpixelgroup.github.io`.
- Signed ten-minute form challenge with a short minimum completion time and a honeypot. These are basic abuse controls, not a CAPTCHA or a guarantee against determined bots.
- Durable create-only rate slots: three accepted submissions per client per hour, capped at fifty total per UTC day. Client addresses are HMAC-hashed server-side; raw IP addresses are never stored in records or GitHub issues. Vercel may retain request metadata under its own hosting policies.
- Duplicate content on the same UTC day reuses the receipt. Queue records are private until converted into a GitHub issue. No email, login, or wallet data is requested.
- Server-generated titles, fixed labels and assignee, disabled `@` mentions, escaped HTML, and a hidden per-submission marker. Issue creation is sequential, uses the Actions bot identity for deduplication, and includes closed issues when recovering after an acknowledgment failure.
- Acknowledged pending records are deleted. Private receipt records are pruned after thirty days and rate keys after forty-eight hours during the midnight UTC processing window. Unprocessed submissions remain queued so a processing outage does not silently discard them.
- Queue reads and acknowledgments require a separate 32+ character secret. The GitHub token only exists in the scheduled workflow. The website contains a public API URL and no credentials.

## Provisioning steps after approval

1. Create a Vercel project named `bitcoin-biz-map-intake` with the Git repository `hotpixelgroup/bitcoin-biz-map`, root directory `backend`, Node.js 24, no framework/build command, `npm ci` install command, and public API access. Preserve preview/fork protections. Only the production API needs anonymous access.
2. Create a **private** Blob store attached to that project, preferably in the same region as the functions. Use project-scoped OIDC (`BLOB_STORE_ID`) where provided; otherwise use its server-side `BLOB_READ_WRITE_TOKEN`. Never expose either credential to the browser.
3. Generate a random queue secret and set `SUBMISSION_QUEUE_SECRET` as a sensitive production backend variable. Add the same value as the GitHub repository Actions secret of the same name, using secure stdin. No secret values belong in files or chat.
4. Set repository Actions secret `SUBMISSION_QUEUE_URL` to the returned production URL plus `/api/queue`. Set repository variable `ANONYMOUS_SUBMISSIONS_ENABLED=true` only after verifying the queue and workflow.
5. Set `endpoint` in `dist/community-config.js` to the actual returned public production URL plus `/api/submissions`; do not infer or invent a Vercel URL. Update asset cache versions if code changes.
6. Deploy and test CORS, rejection paths, durable queue storage, and the public submission route. Dispatch the processor to verify that a clearly identified integration-test submission creates one issue, is assigned/labeled correctly, and is acknowledged. Close that test issue after verification.
7. Merge the reviewed PR after checks pass. Confirm the GitHub Pages form works in a signed-out browser and that accepted submissions eventually appear in the review queue.

Provision these resources only after the owner approves the provider and account usage. The deployment is intentionally gated until that approval.

## Local checks

`npm test --prefix backend` uses an in-memory store and simulated HTTP; no hosting account or secrets are needed. `npm ci --prefix backend` installs the real Blob SDK for deployment or adapter checks. `npm run check` from the repository root includes the core intake/processor tests without installing backend dependencies.

For a local preview, keep the production URL empty or point a development-only configuration to a local stub. Never commit a mock endpoint as production configuration. Enable the service only after real end-to-end verification. Preview forms preserve data on errors and do not claim success unless the server returns a receipt.

## Operations

Review the **Review anonymous submissions** workflow when the queue is delayed. The concurrency group prevents simultaneous processors. A failed GitHub create is not blindly retried: the next run first looks for the bot's submission marker. The processed receipt is written before the pending record is removed. Keep `SUBMISSION_QUEUE_SECRET` out of Actions output and error messages. Rotate it on both services together if needed. Clear the repository enable variable to pause processing; queued records remain private. Disable the public endpoint as well if intake should pause.

Vercel Functions/Blob and scheduled GitHub Actions use their respective account allowances and may incur usage charges depending on plan and traffic. The daily cap limits queued submissions; it does not cap all HTTP requests or hosting costs. For higher traffic, add a managed bot challenge and platform firewall rules before raising limits.

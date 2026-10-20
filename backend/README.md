# Anonymous community intake — free services only

The map stays on **GitHub Pages**. Anonymous forms send business details to a **Cloudflare Worker on the Workers Free plan**, backed by a **D1 database on that same free account**. A standard **GitHub Actions** workflow in this public repository polls the private queue and creates review issues with a short-lived repository token. No personal GitHub token is given to the backend.

**Status:** deployed to the owner's existing account, verified as **Workers Free** in the Cloudflare dashboard on October 20, 2026. The public endpoint is `https://bitcoin-biz-map-intake.harry-4e8.workers.dev/api/submissions`; the private D1 binding and GitHub Actions secrets are configured. A live anonymous test created [review issue #7](https://github.com/hotpixelgroup/bitcoin-biz-map/issues/7), with the intended bot author, labels, assignee, and durable acknowledgment. No paid plan, paid add-on, or billing upgrade was enabled.

## Free-only policy

Use an account on **Workers Free**, not Workers Paid, and do not enable paid products, add-ons, or automatic upgrades. Cloudflare's free request/query limits stop operations when exhausted rather than charging overages. This project adds its own three-submissions-per-client-hour and fifty-submissions-per-day caps. Those caps limit intake volume; platform limits are still shared with other work on the account. The map remains usable if intake is temporarily capped.

Official references:

- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) and [free plan limits](https://developers.cloudflare.com/workers/platform/limits/).
- [D1 free plan pricing](https://developers.cloudflare.com/d1/platform/pricing/) and [behavior when free limits are exceeded](https://developers.cloudflare.com/d1/reference/faq/).
- [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions): use standard GitHub-hosted runners in this public repository; do not select larger paid runners.

Never silently upgrade a service or deploy this project to an already-paid Workers account under an assumption that its allowance makes it free. Verify the account plan first.

## Setup after account access is authorized

1. Install development tools: `npm ci --prefix backend`. Sign into the intended Cloudflare account with `cd backend && npx wrangler login --device --use-keyring --scopes account:read user:read workers_scripts:write d1:write`, completing its authorization yourself. The specific `workers_scripts:write` scope is required for deployment and subdomain activation. Do not paste account credentials or tokens into chat.
2. Run `npx wrangler whoami` and verify in the Cloudflare dashboard that this account is on **Workers Free**. Stop if it is on a paid Workers plan. No custom domain, credit card, or paid subscription is needed for the `workers.dev` endpoint.
3. Create the free database with `npx wrangler d1 create bitcoin-biz-map-intake`. Copy the returned database ID into `backend/wrangler.jsonc`; never infer an account or database ID. Apply the schema with `npx wrangler d1 migrations apply bitcoin-biz-map-intake --remote`.
4. Generate a random 32+ character queue secret. Set it with `npx wrangler secret put SUBMISSION_QUEUE_SECRET`, and set the same value as the repository Actions secret `SUBMISSION_QUEUE_SECRET` using secure stdin. Keep it out of files, shell arguments, and output. D1's private `DB` binding needs no database token.
5. Deploy with `npm run deploy --prefix backend`. Use the actual returned public URL plus `/api/submissions` in `dist/community-config.js`. Set repository Actions secret `SUBMISSION_QUEUE_URL` to that origin plus `/api/queue`.
6. Verify CORS, validation/rejection paths, durable queue storage, and the live public submission endpoint. Set repository variable `ANONYMOUS_SUBMISSIONS_ENABLED=true`. Dispatch **Review anonymous submissions** to verify that one clearly marked test submission creates one issue with the intended assignee/labels and is acknowledged. Close the test issue after verification.
7. Merge the checked PR only after the real integration works. Verify the form from the public map while signed out. Scheduled Actions may be delayed, so the UI reports a saved receipt rather than promising instant GitHub publication.

The repository and database are fixed by the server implementation; submissions cannot choose credentials, destinations, issue labels, or assignees. Provisioning requires approval for this specific free provider and access to the intended account.

## Controls and privacy

- JSON only, 12 KB request cap, bounded fields, explicit public-sharing consent, HTTP/HTTPS-only business website links, and an exact CORS origin of `https://hotpixelgroup.github.io`.
- Signed ten-minute form challenge, short minimum completion time, and honeypot. These are basic abuse controls, not a CAPTCHA or a guarantee against determined bots.
- D1 atomic capped counters serialize quotas across requests using one query per budget, keeping each submission below the Free plan's per-request query limit. Cloudflare's trusted client IP header is HMAC-hashed; raw IP addresses are never stored in records or GitHub issues. Cloudflare may process request metadata under its own hosting policies. Worker observability logs are disabled in configuration.
- Duplicate content on the same UTC day reuses its receipt. Queue entries remain private until published as a GitHub issue. No account, name, email, wallet details, or receipts are requested from visitors.
- The scheduled processor appends structured maintainer review data (including a suggested Census map pin for a unique Arizona match), uses fixed issue destinations, labels, and assignee; neutralizes mentions/HTML; and includes a stable submission marker. It recognizes only its own bot's prior issues, including closed issues, when recovering from an acknowledgment failure. Failed issue creation is not blindly retried.
- Acknowledgment deletes the pending record after creating a processed receipt. The midnight UTC processing window prunes rate records after forty-eight hours and receipts after thirty days. Unprocessed suggestions remain queued so outages do not silently discard them.
- Private queue reads and acknowledgment require the separate shared secret. `GITHUB_TOKEN` only exists inside the issue-writing Actions job, with `issues: write` and `contents: read` permissions. Browser files contain only a public URL.

## Local development and verification

`npm run check` from the repository root checks syntax and runs the intake/processor tests without requiring installed backend dependencies. The D1 adapter tests execute the actual SQL against Node's built-in SQLite engine. Run `npm ci --prefix backend && npm run check:bundle --prefix backend` to verify that Wrangler can bundle the Worker without deploying. `npm run dev --prefix backend` starts local Workers/D1 development; use local-only `.dev.vars` for secrets and never commit them.

Forms preserve entered data when the service returns an error and only report receipt after the backend confirms durable storage. Keep development/mock URLs out of the committed production configuration. Preserve the original GitHub issue templates as a maintainer/contributor alternative.

## Operations

Check **Review anonymous submissions** when the queue is delayed. The concurrency group prevents simultaneous processors. Disable repository variable `ANONYMOUS_SUBMISSIONS_ENABLED` to pause publication; records remain private in D1. Disable the Worker route as well if intake must pause. Rotate the shared secret on both sides together. Use reviewed PRs to deploy backend updates with Wrangler, and keep the account on Workers Free. No Vercel services or pay-as-you-go stores are used.

## Publishing reviewed submissions

Review the issue’s generated **Map update** section, edit the desired listing values, then add **approved**. The separate GitHub approval workflow creates and validates a data-only PR, merges it through branch protection, and dispatches Pages deployment. Only a human maintainer can approve. The Worker never gains repository write access. See [the approval guide](../CONTRIBUTING.md#approve-a-community-submission).

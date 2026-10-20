# Contributing

Use the **Suggest a Bitcoin business** or **Merchant correction** issue forms for listing changes, or open a general bug report or pull request. Submissions are public and reviewed by `hotpixelgroup` before the map is updated. For merchant corrections, include a
public source and identify the specific branch/address of the business. Do not
include customer information, wallet details, or private location history.

1. Fork the repository and create a descriptive branch (do not use `codex/`).
2. Run `npm run dev` and make your change in `dist/` or `scripts/`.
3. Run `npm run check`. Check relevant behavior in a browser, including light
   and dark themes and a narrow/mobile layout for visual changes.
4. Submit a pull request to `main` with the change and validation details.

There is no build step or dependency installation. When changing `app.js`, `community.js`, or `styles.css`, update their `?v=` cache version in `dist/index.html` so returning visitors receive matching assets. Vendored libraries retain
their licenses. Update their versions and notices together. Merchant coordinates
must come from a documented source, and database changes retain ODbL attribution.

## Maintainer workflow

`main` requires a pull request, an up-to-date passing **Validate site** check,
resolved review conversations, and a linear history. Force pushes and branch
deletion are disabled, including for administrators. Squash merging is the
supported merge method, and merged branches are automatically deleted.

The initial single-maintainer configuration requires **zero external approvals**
so the owner can merge their own PR after checks pass. CODEOWNERS still requests
owner review on outside contributions. When a second maintainer joins, set the
required approving review count to one in the branch protection settings.

GitHub Pages automatically deploys validated changes merged into `main`.
Pull requests cannot deploy. The `github-pages` environment accepts deployments
from `main` only. No separate deployment secret is needed.

To roll back, open a PR reverting the faulty commit, let checks pass, and squash
merge it. The normal workflow republishes that version. Do not force-push `main`.

## Approve a community submission

1. Open an issue labeled **needs-review**. Under **Maintainer: publish this map update**, use the issue's **Edit** menu to review the prepared JSON. Check the payment evidence, category, city, and map pin. New suggestions use the free US Census geocoder when it returns one Arizona match; fill missing coordinates and their public source yourself.
2. For a correction, edit the prepared listing to its desired final values. Nothing is inferred from a free-text complaint. Set `action` to `remove` for a closure, duplicate, or withdrawn bitcoin acceptance. Keep `listingId` and `expected` unchanged. For an unidentified listing, first fix the original report's map-listing URL, delete the generated section from its start/end comments, and remove/reapply **needs-review** to prepare the correct current record.
3. Add **approved**. That is the publication approval: the bot creates a data-only pull request, explicitly runs **Validate site**, squash-merges through the existing protections, explicitly deploys Pages, marks the issue **published**, and closes it. The status comment links to the PR and deployment. There is no extra merge step.

Only human maintainers with write, maintain, or admin access may approve. Remove **approved** to stop a pending update before merging. Editing the issue during processing also stops it. A listing fingerprint prevents stale corrections from overwriting a newer change. Missing data, duplicates, unsafe URLs, and corrections with no actual changes are blocked.

If an issue receives **approval-blocked**, read the status comment, fix the JSON, and remove/reapply **approved**. To regenerate a stale correction, delete the generated section and remove/reapply **needs-review**, then review the new values. If merge succeeded but deployment failed, retrying resumes publication without duplicating the update. You can also run **Publish approved map submissions** from Actions with the issue number and mode `prepare` or `publish`; publication still requires the approved label and a human maintainer.

The workflows use short-lived `GITHUB_TOKEN` permissions, standard free runners, and no personal token or new hosting service. GitHub's repository setting **Allow GitHub Actions to create and approve pull requests** must be enabled for PR creation; these workflows do not submit approval reviews or bypass branch rules. Because bot-created events do not run ordinary push deployment, the automation explicitly dispatches validation and Pages workflows. GitHub also requires approval of the PR workflow when the PR is created by its own token; after verifying the data-only diff, the automation approves only the site workflow for that exact PR and commit and waits for it to pass. Keep `site.yml`'s **Validate site** job name aligned with the required branch check.

Approved operations are recorded in `dist/merchants.json` under `appliedReviews`. Preserve that history: it makes retries safe. The original-source importer refuses to overwrite a directory with community reviews. Reconcile future article/BTC Map refreshes in a separate file and a reviewed PR.

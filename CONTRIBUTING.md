# Contributing

Use the **Suggest a Bitcoin business** or **Merchant correction** issue forms for listing changes, or open a general bug report or pull request. Submissions are public and reviewed by `hotpixelgroup` before the map is updated. For merchant corrections, include a
public source and identify the specific branch/address of the business. Do not
include customer information, wallet details, or private location history.

1. Fork the repository and create a descriptive branch (do not use `codex/`).
2. Run `npm run dev` and make your change in `dist/` or `scripts/`.
3. Run `npm run check`. Check relevant behavior in a browser, including light
   and dark themes and a narrow/mobile layout for visual changes.
4. Submit a pull request to `main` with the change and validation details.

There is no build step or dependency installation. Vendored libraries retain
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

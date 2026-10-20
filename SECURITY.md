# Security

Report sensitive vulnerabilities using GitHub's **Report a vulnerability** link
on this repository's Security tab. Do not disclose exploit details, credentials,
or personal data in public issues. General bugs and public merchant-data
corrections can be submitted as issues.

The current `main` branch is supported. The public map has no accounts or payments. The optional anonymous intake service stores business submissions privately in D1 before publishing them as review issues. Its shared queue secret stays in Workers secrets and GitHub Actions secrets, never in browser files. It uses browser-local
storage for saved places and requests geolocation only after a visitor asks.
Requested routes send coordinates to OSRM, while navigation opens Google Maps.
Map tiles and fonts load from their external providers.

GitHub Actions use read-only permissions by default. Only the deployment job
receives Pages write and OIDC permissions. Actions are pinned to commit SHAs
and monitored by Dependabot. Deployment never runs from pull requests.

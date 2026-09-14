# helpmehack

A focused contribution browser with two destinations: **Overlooked**, a read-only HelpMeHack editorial feed, and **Open Source**, an evidence-ranked repository directory with currently startable issues. No account, resume, or onboarding is required.

## Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## GitHub connection

The UI consumes the `OpportunityProvider` interface in `lib/provider.ts`. The GitHub implementation searches current public `good first issue` and `help wanted` records, then checks repository metadata, recent comments, timeline-linked pull requests, README content, and the repository’s contribution guide through GitHub’s community profile. All GitHub requests run server-side.

Public access works without setup but is limited by GitHub to 60 core requests per hour per originating IP. For production, configure a read-only GitHub App installation:

```bash
GITHUB_APP_ID=123456
# Optional when this App has exactly one installation
GITHUB_APP_INSTALLATION_ID=
GITHUB_APP_PRIVATE_KEY_BASE64=base64_encoded_pem
```

The configured GitHub App can authenticate reads of public repository data across organizations, so no additional personal token is required for the persistent index. `GITHUB_DISCOVERY_TOKEN` remains an optional read-only alternative for deployments that do not configure a GitHub App.

The App needs read-only repository permissions for Contents, Issues, Pull requests, and Metadata. Convert the downloaded PEM with `base64 -i your-app.private-key.pem | tr -d '\n'`. A `SHA256:...` public-key fingerprint is not the private key. If the App has exactly one installation, HelpMeHack discovers its installation ID automatically; set `GITHUB_APP_INSTALLATION_ID` only when the App has multiple installations. HelpMeHack signs a short-lived App JWT, exchanges it for a one-hour installation token, caches that token, and renews it five minutes before expiration. `GITHUB_TOKEN` remains supported as a fallback if the App credentials are missing or a token exchange fails.

All credentials are read only in server code. Current issue evidence is cached for 15 minutes with authenticated access and one hour without it; repository behavior is retained for a day, while contribution documents and issue-specific policy evidence refresh with the current-issue cycle. Manual public refreshes are throttled to once per hour. Rechecks use stored ETags for conditional requests where GitHub supplies them. Failed refreshes preserve the client’s last good snapshot and mark it stale.

## Persistent repository index

Production can serve a durable repository snapshot from Upstash Redis instead of rebuilding the feed during a visitor request. Create an Upstash Redis integration in the Vercel Marketplace and configure:

```bash
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_rest_token
OPPORTUNITY_INDEX_TARGET=500
OPPORTUNITY_INDEX_BATCH_SIZE=20
OPPORTUNITY_INDEX_CONCURRENCY=4
```

The older `KV_REST_API_URL` and `KV_REST_API_TOKEN` aliases are also supported. If Vercel connects the resource with an `UPSTASH_REDIS_REST` custom prefix, the generated `UPSTASH_REDIS_REST_KV_REST_API_URL` and `UPSTASH_REDIS_REST_KV_REST_API_TOKEN` names work as well. Redis credentials remain server-only.

For unattended indexing, set `REFRESH_SECRET` on the deployed site, then add `HELPMEHACK_URL` and the same `REFRESH_SECRET` as GitHub repository secrets. The included workflow calls the protected index worker at minute 17 of every hour and can also be run manually.

The worker refreshes the discovery universe daily, targeting 500 repositories by default. It combines the reviewed catalog with active GitHub repositories carrying `good-first-issue`, `help-wanted`, or `hacktoberfest` topics. An automatically discovered project must still have at least 100 stars, 10 forks, six months of history, recent maintenance evidence, contribution documentation, and a genuinely open contribution-labelled issue. Each hourly run enriches the 20 least-recently checked repositories, retains successful older snapshots when a request fails, and removes a repository’s old card when a successful check finds no eligible issue. At the default settings, the first 500-repository pass completes in roughly 25 hourly runs. Visitor requests read the stored snapshot immediately; opening a card still performs a current, deeper issue check.

Without Redis credentials, the application retains its live GitHub fallback and an in-process cache, but that fallback is not durable across server instances or deployments.

## Open-source tiers

Repository quality is evaluated separately from issue availability over a rolling 90-day behavior window:

- Treatment of newcomers: 30%
- Maintainer responsiveness: 25%
- Log-capped reputation and adoption: 20%
- Current maintenance: 15%
- Ease of getting started: 10%

An overall repository score is withheld unless all five factors have sufficient evidence. The three horizontal rows show repositories rather than duplicate issue cards. Selecting a repository opens an in-app guide with a short, source-linked assignment protocol, setup reminders, cautions, and a deeper live issue list. Availability remains a gate: assigned, possibly claimed, blocked, closed, and issues with a strongly linked open implementation PR do not appear in the active rows. Eligible repositories are grouped and ordered from their strongest current issue with distinct formulas:

- Beginner-friendly: 38% beginner suitability, 22% clarity, 20% onboarding, 12% newcomer evidence, 8% availability.
- Experienced contributors: 30% repository quality, 25% clarity, 20% maintenance, 15% responsiveness, 10% availability.
- Widely adopted projects: 42% log-scaled public adoption, 23% reputation, 15% newcomer evidence, 12% maintenance, 8% clarity. This tier requires an explicit major-project discovery match, current maintenance evidence, and non-beginner scope.

Major ecosystem project signal is evidence about the codebase and the public verifiability of a contribution, not a hiring or resume-outcome promise. The main directory uses at most one issue per repository so a single busy project cannot consume the carousel. Opening a repository performs the deeper issue fetch.

Discovery starts with a reviewed catalog of established projects split across beginner, experienced, and major-ecosystem search pools. A secondary discovery lane can admit an uncataloged organization project only when it is at least one year old and has at least 10,000 public stars, 500 forks, a contribution guide, current maintenance evidence, and a newcomer PR merged in the measured window; it must then pass the same availability checks as cataloged projects. With authenticated GitHub access, up to 36 distinct repository candidates are enriched per cycle. The feed checks repository metadata, documentation, current issue activity, recent merge history, and release activity. Expensive per-PR response sampling is normally deferred until a repository is opened, except for newly discovered projects where it is part of the admission gate. Opening a repository performs a deeper check of up to 12 labeled issues. Exact bot commands such as `@…bot claim` are surfaced only when found in checked source evidence. Rows may overlap when a repository has evidence for more than one tier.

## Newsletter connection

HelpMeHack does not store newsletter addresses. Set `NEWSLETTER_ENDPOINT` to a server-side webhook or email-provider endpoint that accepts `{ "email": "...", "source": "helpmehack.com" }`. Set `NEWSLETTER_API_TOKEN` when that endpoint uses bearer authentication. Until configured, the form reports that signup is unavailable and never shows a false success state.

The previous hackathon, program, discover, and saved destinations are no longer part of the active interface.

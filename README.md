# helpmehack.com

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

Public access works without setup but is limited by GitHub to 60 core requests per hour per originating IP. For a higher limit, copy `.env.example` to `.env.local` and add a fine-grained token that can read public repositories:

```bash
GITHUB_TOKEN=github_pat_...
```

The token is read only in server code. Current issue evidence is cached for 15 minutes with a token and one hour without one; repository behavior is retained for a day, while contribution documents and issue-specific policy evidence refresh with the current-issue cycle. Manual public refreshes are throttled to once per hour. Rechecks use stored ETags for conditional requests where GitHub supplies them. Failed refreshes preserve the client’s last good snapshot and mark it stale.

## Open-source tiers

Repository quality is evaluated separately from issue availability over a rolling 90-day behavior window:

- Treatment of newcomers: 30%
- Maintainer responsiveness: 25%
- Log-capped reputation and adoption: 20%
- Current maintenance: 15%
- Ease of getting started: 10%

An overall repository score is withheld unless all five factors have sufficient evidence. The three horizontal rows show repositories rather than duplicate issue cards. Selecting a repository opens an in-app guide with a short, source-linked assignment protocol, setup reminders, cautions, and a deeper live issue list. Availability remains a gate: assigned, possibly claimed, blocked, closed, and issues with a strongly linked open implementation PR do not appear in the active rows. Eligible repositories are grouped and ordered from their strongest current issue with distinct formulas:

- Beginner-friendly: 38% beginner suitability, 22% clarity, 20% onboarding, 12% newcomer evidence, 8% availability.
- Moderate scope: 30% repository quality, 25% clarity, 20% maintenance, 15% responsiveness, 10% availability.
- High project signal: 42% log-scaled public adoption, 23% reputation, 15% newcomer evidence, 12% maintenance, 8% clarity.

High project signal is evidence about the project, not a hiring or resume-outcome promise. The provider caps the candidate feed at two issues per repository.

Discovery uses separate pools for globally updated beginner issues, moderate-scope issues from an active curated repository set, and beginner/help-wanted issues from widely adopted projects. With authenticated GitHub access, up to 24 candidates are enriched per cycle. Repository metadata, documentation, and historical quality are shared across issues from the same project, and issue checks run in bounded batches. Opening a repository performs a separate, deeper check of up to 12 labeled issues. Exact bot commands such as `@…bot claim` are surfaced only when found in checked source evidence. Rows may overlap when a repository has evidence for more than one tier.

## Newsletter connection

HelpMeHack does not store newsletter addresses. Set `NEWSLETTER_ENDPOINT` to a server-side webhook or email-provider endpoint that accepts `{ "email": "...", "source": "helpmehack.com" }`. Set `NEWSLETTER_API_TOKEN` when that endpoint uses bearer authentication. Until configured, the form reports that signup is unavailable and never shows a false success state.

The previous hackathon, program, discover, and saved destinations are no longer part of the active interface.

# Contributing to HelpMeHack

Thanks for considering a contribution to HelpMeHack.

HelpMeHack helps developers find open-source repositories and issues that are actually worth starting. Contributions should improve the accuracy, usefulness, reliability, or usability of that experience.

## Before you start

For anything beyond a small typo or obvious bug fix:

1. Search existing issues and pull requests first.
2. Open an issue if the scope is not already agreed.
3. Wait for maintainer confirmation before investing substantial time in a large change.

Please do not open a large pull request for an unapproved feature or redesign.

## Development setup

### Requirements

- Node.js 22
- npm
- Git

### Run locally

```bash
git clone https://github.com/rohanmalhotracodes/helpmehack.git
cd helpmehack
npm install
npm run dev
```

Before submitting a pull request, run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

All four checks should pass.

## What makes a good contribution

Keep changes focused and easy to review.

Good pull requests usually:

- solve one clearly defined problem;
- avoid unrelated refactors;
- preserve existing behavior unless the change intentionally modifies it;
- add or update tests when behavior changes;
- use existing components and patterns before introducing new abstractions;
- keep user-facing terminology consistent;
- avoid adding dependencies unless they are genuinely necessary;
- update documentation when behavior or setup changes.

## Issues

Use the provided issue forms for bugs and feature requests.

For bugs, include:

- what happened;
- what you expected;
- steps to reproduce;
- browser/device or environment details where relevant;
- screenshots or logs when useful;
- whether the problem is reproducible consistently.

For feature requests, explain the user problem before proposing an implementation.

## Pull requests

A pull request should be small enough that a reviewer can understand its purpose from the title, description, and diff.

Please:

- use a descriptive title;
- link the relevant issue when one exists;
- describe what changed and why;
- include screenshots for visible UI changes;
- explain how you tested the change;
- call out migrations, deployment changes, environment variables, or breaking behavior;
- keep generated or agent-assisted changes under the same review standard as manually written code.

Draft pull requests are welcome for work in progress, but mark the PR ready for review only when the change is in a reviewable state.

## AI-assisted contributions

AI tools and coding agents are welcome, but the contributor is responsible for the submitted code.

Before opening a PR, review generated changes for:

- duplicated logic;
- stale naming or product terminology;
- unnecessary files or abstractions;
- hallucinated APIs or configuration;
- security or privacy regressions;
- missing tests;
- unexpected dependency changes.

Do not submit generated code that you have not reviewed.

## Commit hygiene

Prefer clear, focused commits. Avoid commit messages such as `fix stuff`, `changes`, or `update`.

Examples:

- `Fix repository availability status rendering`
- `Add regression test for Feed navigation`
- `Document DynamoDB refresh configuration`

## Review process

Maintainers may request changes for correctness, scope, maintainability, accessibility, security, or product consistency.

External issues and pull requests may automatically receive the `needs maintainer review` label. This is a routing label, not a negative judgment on the contribution.

Please avoid repeatedly pinging maintainers. If there has been no response after a reasonable period, one polite follow-up is enough.

## Security

Do not report sensitive security vulnerabilities in a public issue. Use GitHub's private vulnerability reporting or contact the maintainer privately when available.

## Code of conduct

Be respectful, specific, and constructive. Harassment, personal attacks, spam, and abusive behavior are not acceptable.

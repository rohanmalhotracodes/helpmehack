export const dynamic = "force-static";

export function GET() {
  const body = `# helpmehack

> helpmehack is an open-source discovery platform for contributors.

Canonical site: https://www.helpmehack.tech

## What helpmehack covers

- Active open-source repositories and beginner-friendly contribution opportunities
- Contribution guidance, assignment signals, recent discussion, and linked pull-request context
- Google Summer of Code organization history, technologies, years, and past projects
- Summer of Bitcoin cohort history from 2021 through 2026
- Practical guides for choosing a first issue and contributing to open source

## Important pages

- Home: https://www.helpmehack.tech
- Open-source projects: https://www.helpmehack.tech/open-source-projects
- Programs: https://www.helpmehack.tech/programs
- Contribution guide: https://www.helpmehack.tech/contribute
- Good first issue guide: https://www.helpmehack.tech/contribute/first-issue
- About: https://www.helpmehack.tech/about
- Sitemap: https://www.helpmehack.tech/sitemap.xml

## Data notes

helpmehack provides discovery signals, not guarantees. Repository and issue status can change. Contributors should verify the latest issue discussion and contribution rules on the project's official GitHub repository. Historical program participation does not guarantee future participation.

## Source

Project repository: https://github.com/rohanmalhotracodes/helpmehack
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

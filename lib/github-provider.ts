import { isHumanMaintainerEvent, scoreIssue, scoreRepository, type PullObservation } from "./ranking";
import { buildCatalogSearchGroups, isCatalogRepository, labelsForCatalogRepository, REPOSITORY_CATALOG } from "./repository-catalog";
import type { AssignmentPolicy, AssignmentPolicyKind, AvailabilityStatus, Experience, Guidance, OpenSourceOpportunity, OpportunityPayload, RepositoryGuidance, RepositoryQuality, Source } from "./types";

const API_ROOT = "https://api.github.com";
const API_VERSION = "2026-03-10";
const WINDOW_DAYS = 90;
const MAX_ISSUES_PER_REPOSITORY = 1;
const MAX_FEED_ISSUES = process.env.GITHUB_TOKEN ? 36 : 9;
const CLAIM_PATTERN = /(?:\bi(?:'m| am|’m| would be| can| will|'ll|’ll| want to| would like to)\b.{0,45}\b(?:work|take|pick|handle|implement|fix)|\bassign (?:this to )?me\b|\/assign\b|\bworking on this\b)/i;
const ASK_LABEL_PATTERN = /(?:discussion|needs approval|proposal|needs design|needs info)/i;
const BLOCKED_LABEL_PATTERN = /(?:^|\b)(?:blocked|on hold|waiting)(?:$|\b)/i;
const CLAIMED_LABEL_PATTERN = /(?:^|\b)(?:in progress|claimed|assigned)(?:$|\b)/i;
const STALE_LABEL_PATTERN = /(?:^|[\s/:_-])(?:stale|awaiting[-_\s]+more[-_\s]+evidence)(?:$|[\s/:_-])/i;
const NOT_ACTIONABLE_LABEL_PATTERN = /(?:^|[\s/:_-])(?:deprioritized|not[-_\s]+planned|wontfix|duplicate)(?:$|[\s/:_-])/i;
const CLOSED_TO_CONTRIBUTIONS_PATTERN = /(?:not|no longer|isn['’]t|is not) (?:currently )?accepting (?:external |community )?contributions|closed to (?:external |community )?contributions/i;
const PRACTICE_REPOSITORY_PATTERN = /(?:^|[-_ ])(?:first[-_ ]contributions?|contribution[-_ ]practice|git[-_ ]practice|practice[-_ ]repo|hello[-_ ]world)(?:$|[-_ ])/i;
const DIRECTORY_REPOSITORY_PATTERN = /(?:^|[-_ ])(?:awesome|career|jobs?|interview|roadmap|boilerplate|template|tutorials?)(?:$|[-_ ])/i;
const MAINTAINER_ROLES = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);
const historicalQualityCache = new Map<string, { value: RepositoryQuality; expiresAt: number }>();
const conditionalJsonCache = new Map<string, { etag: string; value: unknown }>();

type GitHubUser = { login: string; avatar_url: string; type?: string };
type GitHubLabel = string | { name?: string; color?: string };
type GitHubIssue = {
  id: number; html_url: string; repository_url: string; comments_url: string; number: number; title: string; body: string | null;
  labels: GitHubLabel[]; assignee: GitHubUser | null; user: GitHubUser; comments: number; created_at: string; updated_at: string; pull_request?: unknown;
};
type GitHubRepo = {
  full_name: string; name: string; description: string | null; html_url: string; language: string | null; owner: GitHubUser;
  archived: boolean; disabled?: boolean; fork?: boolean; topics?: string[]; stargazers_count: number; forks_count: number; pushed_at: string | null; created_at?: string;
};
type GitHubComment = { html_url: string; body: string | null; created_at: string; user: GitHubUser; author_association: string };
type TimelineIssue = { html_url?: string; title?: string; body?: string | null; state?: string; draft?: boolean; pull_request?: { merged_at?: string | null } };
type TimelineEvent = {
  event?: string; source?: { issue?: TimelineIssue }; user?: GitHubUser; actor?: GitHubUser; author_association?: string;
  created_at?: string; submitted_at?: string;
};
type ContentFile = { html_url: string; content?: string; encoding?: string };
type CommunityProfile = { files?: { contributing?: { html_url?: string; url?: string } | null } };
type GitHubPull = {
  number: number; html_url: string; title: string; state: string; draft?: boolean; created_at: string; updated_at: string;
  merged_at: string | null; closed_at: string | null; user: GitHubUser; author_association: string;
};
type GitHubRelease = { published_at: string | null };
type SearchResponse = { items: GitHubIssue[] };
type RepositorySearchResponse = { items: GitHubRepo[] };
type FetchOptions = RequestInit & { next?: { revalidate: number; tags?: string[] } };
type DiscoveryTier = NonNullable<OpenSourceOpportunity["discoveryTiers"]>[number];
type Candidate = { issue: GitHubIssue; tiers: DiscoveryTier[] };
type RepositoryContext = { repo: GitHubRepo; contributionFile: ContentFile | null; guideText: string | null; readmeText: string | null; repositoryQuality: RepositoryQuality; repositoryGuidance: RepositoryGuidance };

const languageColors: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572a5", Rust: "#dea584", Go: "#00add8", Java: "#b07219",
  Ruby: "#701516", PHP: "#4f5d95", Kotlin: "#a97bff", Swift: "#f05138", C: "#555555", "C++": "#f34b7d", "C#": "#178600", Shell: "#89e051",
};

function headers() {
  const value: Record<string, string> = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": API_VERSION, "User-Agent": "helpmehack.com" };
  if (process.env.GITHUB_TOKEN) value.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return value;
}

async function githubFetch(path: string, force: boolean, cacheable = true, etag?: string) {
  const revalidate = process.env.GITHUB_TOKEN ? 900 : 3600;
  const requestHeaders = headers();
  if (etag) requestHeaders["If-None-Match"] = etag;
  const options: FetchOptions = force || !cacheable
    ? { headers: requestHeaders, cache: "no-store" }
    : { headers: requestHeaders, cache: "force-cache", next: { revalidate, tags: ["github-opportunities"] } };
  return fetch(path.startsWith("http") ? path : `${API_ROOT}${path}`, options);
}

async function getJson<T>(path: string, force: boolean, optional = false, cacheable = true): Promise<T | null> {
  const conditional = force || !cacheable ? conditionalJsonCache.get(path) : undefined;
  const response = await githubFetch(path, force, cacheable, conditional?.etag);
  if (response.status === 304 && conditional) return conditional.value as T;
  if (optional && !response.ok) return null;
  if (!response.ok) {
    const reset = response.headers.get("x-ratelimit-reset");
    const resetText = reset ? ` Rate limit resets at ${new Date(Number(reset) * 1000).toISOString()}.` : "";
    throw new Error(`GitHub returned ${response.status}.${resetText}`);
  }
  const value = await response.json() as T;
  const etag = response.headers.get("etag");
  if (etag && (force || !cacheable)) {
    if (conditionalJsonCache.size >= 60) conditionalJsonCache.delete(conditionalJsonCache.keys().next().value as string);
    conditionalJsonCache.set(path, { etag, value });
  }
  return value;
}

const labelNames = (labels: GitHubLabel[]) => labels.map((label) => typeof label === "string" ? label : label.name ?? "").filter(Boolean);
const initials = (owner: string) => owner.slice(0, 2).toUpperCase();
const isMaintainer = (association: string) => MAINTAINER_ROLES.has(association);
const isBot = (user?: GitHubUser) => user?.type === "Bot" || user?.login.endsWith("[bot]") === true;

function cleanSummary(body: string | null, fallback: string) {
  if (!body) return fallback;
  const cleaned = body.replace(/```[\s\S]*?```/g, " ").replace(/<[^>]*>/g, " ").replace(/!?\[[^\]]*\]\([^)]*\)/g, " ").replace(/^\s*[#>*+-]+\s*/gm, "").replace(/\s+/g, " ").trim();
  return cleaned.length > 220 ? `${cleaned.slice(0, 217).trim()}…` : cleaned || fallback;
}

function inferExperience(labels: string[]): Experience {
  const joined = labels.join(" ");
  if (/advanced|expert|complex|hard/i.test(joined)) return "Advanced";
  if (/good first issue|beginner|easy|first[-\s]timers?[-\s]only/i.test(joined)) return "Beginner";
  return "Intermediate";
}

function experienceForIssue(labels: string[], tiers: DiscoveryTier[]): Experience {
  const inferred = inferExperience(labels);
  if (tiers.includes("high-impact") && inferred !== "Beginner") return "Advanced";
  return inferred;
}

function extractCommands(...texts: Array<string | null | undefined>) {
  const combined = texts.filter(Boolean).join("\n");
  const commands = combined.match(/^\s*(?:\$\s*)?(?:(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?[\w:./-]+|cargo\s+(?:test|build|check|run|fmt|clippy)(?:\s+[\w:./-]+)*|go\s+(?:test|build|run|generate|fmt|vet)(?:\s+[\w:./-]+)*|python\s+(?:-m\s+)?[\w:./-]+(?:\s+[\w:./-]+)*|pytest(?:\s+[\w:./-]+)*|make(?:\s+[\w:./-]+)?|(?:gradle|\.\/gradlew)\s+[\w:./-]+)\s*$/gmi) ?? [];
  return [...new Set(commands.map((command) => command.trim().replace(/^\$\s*/, "")))].slice(0, 2);
}

function decodeFile(file: ContentFile | null) {
  if (!file?.content || file.encoding !== "base64") return null;
  try { return Buffer.from(file.content.replace(/\n/g, ""), "base64").toString("utf8"); } catch { return null; }
}

function isPracticeRepository(repo: GitHubRepo) {
  return PRACTICE_REPOSITORY_PATTERN.test(`${repo.name} ${repo.description ?? ""} ${(repo.topics ?? []).join(" ")}`);
}

function closesIssue(body: string | null | undefined, owner: string, repo: string, issueNumber: number) {
  if (!body) return false;
  const escapedOwner = owner.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedRepo = repo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\\s+(?:(?:${escapedOwner}/${escapedRepo})?#)${issueNumber}\\b`, "i").test(body);
}

function policySignal(text: string | null | undefined): AssignmentPolicyKind | null {
  if (!text) return null;
  if (/(?:must|need(?:s)? to|required to|please)\s+(?:be\s+)?assign|request assignment|\/assign\b/i.test(text)) return "assignment-required";
  if (/discuss (?:the |your )?(?:approach|proposal)|(?:approval|maintainer confirmation) (?:is )?required|before (?:you )?(?:start|begin|work|implement)/i.test(text)) return "approval-required";
  if (/no (?:need|requirement) (?:for|to request) assignment|assignment (?:is )?not required|feel free to (?:open|submit|work|start)|pull requests? welcome/i.test(text)) return "direct";
  return null;
}

function makePolicy(issue: GitHubIssue, comments: GitHubComment[] | null, guideText: string | null, contributionFile: ContentFile | null, checkedAt: string): AssignmentPolicy {
  const issueSignals: Array<{ kind: AssignmentPolicyKind; source: Source }> = [];
  const bodySignal = policySignal(issue.body);
  if (bodySignal) issueSignals.push({ kind: bodySignal, source: { label: `Issue #${issue.number} instructions`, href: issue.html_url, kind: "issue" } });
  for (const comment of comments ?? []) {
    if (!isMaintainer(comment.author_association) || isBot(comment.user)) continue;
    const signal = policySignal(comment.body);
    if (signal) issueSignals.push({ kind: signal, source: { label: `Maintainer comment by @${comment.user.login}`, href: comment.html_url, kind: "issue" } });
  }
  const distinctIssueSignals = [...new Set(issueSignals.map((signal) => signal.kind))];
  if (distinctIssueSignals.length > 1) return { kind: "varies", label: "Policy varies by issue", detail: "Current issue instructions conflict. Check with a maintainer before starting.", checkedAt, source: issueSignals[0].source };
  const signal = issueSignals[0];
  const guideSignal = policySignal(guideText);
  const selected = signal?.kind ?? guideSignal ?? "unknown";
  const source = signal?.source ?? (guideSignal && contributionFile?.html_url ? { label: "CONTRIBUTING.md", href: contributionFile.html_url, kind: "guide" as const } : undefined);
  const labels: Record<AssignmentPolicyKind, string> = {
    "assignment-required": "Request assignment first", "approval-required": "Discuss your approach first", direct: "Open to contributions",
    varies: "Policy varies by issue", unknown: "Check with maintainer",
  };
  const details: Record<AssignmentPolicyKind, string> = {
    "assignment-required": "A current instruction indicates that assignment is required before implementation.",
    "approval-required": "A current instruction asks contributors to discuss or receive approval before implementation.",
    direct: "A current instruction permits contributors to submit work without formal assignment. Competing work must still be checked.",
    varies: "The repository’s policy varies; follow the current issue’s specific instructions.",
    unknown: "No reliable assignment policy was detected in the fetched issue instructions or top-level contribution guide.",
  };
  return { kind: selected, label: labels[selected], detail: details[selected], checkedAt, source };
}

function makeRepositoryGuidance(repo: GitHubRepo, guideText: string | null, readmeText: string | null, contributionFile: ContentFile | null, readmeFile: ContentFile | null, checkedAt: string): RepositoryGuidance {
  const docs = `${guideText ?? ""}\n${readmeText ?? ""}`;
  const signal = policySignal(docs);
  const botClaim = docs.match(/(@[a-z0-9_-]*bot)\s+(claim|assign)\b/i);
  const source: Source = contributionFile?.html_url
    ? { label: "CONTRIBUTING.md", href: contributionFile.html_url, kind: "guide" }
    : readmeFile?.html_url
      ? { label: "README", href: readmeFile.html_url, kind: "guide" }
      : { label: `${repo.full_name} repository`, href: repo.html_url, kind: "official" };
  const assignment = botClaim
    ? `Use \`${botClaim[1]} ${botClaim[2].toLowerCase()}\` in the issue thread; do not rely on a plain “I’m working on this” comment.`
    : signal === "assignment-required"
      ? "Request assignment using the repository’s documented process before starting implementation."
      : signal === "approval-required"
        ? "Discuss the approach and wait for maintainer approval before starting implementation."
        : signal === "direct"
          ? "The repository documentation allows direct contributions; recheck the issue for competing work first."
          : "No repository-wide assignment rule was detected. Follow the current issue’s instructions before starting.";
  const beforeStarting = [
    contributionFile ? "Read the linked contribution guide before changing code." : "Read the repository README and issue template before changing code.",
    /(?:install|setup|getting started|development environment|prerequisites)/i.test(docs) ? "Complete the documented development setup first." : "Confirm the development setup from repository documentation.",
    /(?:npm test|pnpm test|yarn test|pytest|cargo test|go test|gradle.*test|testing)/i.test(docs) ? "Run the documented checks for the area you change." : "Confirm the expected tests in the issue or with a maintainer.",
  ];
  const avoid = signal === "assignment-required"
    ? ["Do not begin implementation before assignment is confirmed.", "Do not expand the issue’s scope without maintainer agreement."]
    : signal === "approval-required"
      ? ["Do not submit an implementation before the proposed approach is approved.", "Do not mix unrelated cleanup into the contribution."]
      : ["Do not assume an unassigned issue is unclaimed; check recent comments and linked pull requests.", "Do not mix unrelated cleanup into the contribution."];
  return { assignment, beforeStarting, avoid, source, checkedAt };
}

function applyIssueGuidance(base: RepositoryGuidance, issue: GitHubIssue, comments: GitHubComment[] | null): RepositoryGuidance {
  const evidence = [
    { text: issue.body, source: { label: `Issue #${issue.number} instructions`, href: issue.html_url, kind: "issue" as const } },
    ...(comments ?? [])
      .filter((comment) => isMaintainer(comment.author_association) || isBot(comment.user))
      .map((comment) => ({ text: comment.body, source: { label: `Instruction from @${comment.user.login}`, href: comment.html_url, kind: "issue" as const } })),
  ];
  const botInstruction = evidence.find(({ text }) => /@[a-z0-9_-]*bot\s+(?:claim|assign)\b/i.test(text ?? ""));
  const botCommand = botInstruction?.text?.match(/(@[a-z0-9_-]*bot)\s+(claim|assign)\b/i);
  if (botInstruction && botCommand) {
    return {
      ...base,
      assignment: `Comment \`${botCommand[1]} ${botCommand[2].toLowerCase()}\` on the issue and wait for the bot or maintainers to confirm the claim before coding.`,
      source: botInstruction.source,
    };
  }
  const gatedSubmission = evidence.find(({ text }) => /(?:do not|don['’]t|please avoid)\s+(?:open|submit|create)\s+(?:a\s+)?(?:pull request|pr|solution|implementation)/i.test(text ?? ""));
  if (gatedSubmission) {
    return {
      ...base,
      avoid: ["Do not submit an implementation before satisfying the prerequisite in the linked repository instruction.", ...base.avoid].slice(0, 3),
      source: gatedSubmission.source,
    };
  }
  return base;
}

async function buildRepositoryQuality(repo: GitHubRepo, guideText: string | null, readmeText: string | null, labels: string[], force: boolean, checkedAt: string, deepQuality: boolean): Promise<RepositoryQuality> {
  const [pulls, latestRelease] = await Promise.all([
    getJson<GitHubPull[]>(`/repos/${repo.full_name}/pulls?state=all&sort=updated&direction=desc&per_page=30`, force, true),
    getJson<GitHubRelease>(`/repos/${repo.full_name}/releases/latest`, force, true),
  ]);
  const cutoff = Date.parse(checkedAt) - WINDOW_DAYS * 86_400_000;
  const recentPulls = pulls?.filter((pull) => {
    const updated = Date.parse(pull.updated_at);
    const merged = pull.merged_at ? Date.parse(pull.merged_at) : updated;
    return Math.max(updated, merged) >= cutoff;
  }) ?? null;
  const externalPulls = recentPulls?.filter((pull) => !isMaintainer(pull.author_association) && !isBot(pull.user)) ?? [];
  const newcomerPulls = externalPulls.filter((pull) => pull.author_association === "FIRST_TIMER" || pull.author_association === "FIRST_TIME_CONTRIBUTOR");
  const sampleLimit = deepQuality ? 3 : 0;
  const sample = [...newcomerPulls, ...externalPulls.filter((pull) => !newcomerPulls.includes(pull))].slice(0, sampleLimit);
  const observations = new Map<number, Pick<PullObservation, "responded" | "firstResponseHours">>();
  await Promise.all(sample.map(async (pull) => {
    const timeline = await getJson<TimelineEvent[]>(`/repos/${repo.full_name}/issues/${pull.number}/timeline?per_page=50`, force, true, false);
    if (!timeline) return;
    const firstHumanResponse = timeline
      .filter((event) => isHumanMaintainerEvent({ event: event.event, author_association: event.author_association, user: event.user }))
      .map((event) => event.created_at ?? event.submitted_at).filter((date): date is string => Boolean(date)).sort((a, b) => Date.parse(a) - Date.parse(b))[0];
    observations.set(pull.number, { responded: Boolean(firstHumanResponse), firstResponseHours: firstHumanResponse ? Math.max(0, (Date.parse(firstHumanResponse) - Date.parse(pull.created_at)) / 3_600_000) : undefined });
  }));
  const pullObservations = recentPulls?.map((pull): PullObservation => ({
    createdAt: pull.created_at, merged: Boolean(pull.merged_at), newcomer: pull.author_association === "FIRST_TIMER" || pull.author_association === "FIRST_TIME_CONTRIBUTOR",
    external: !isMaintainer(pull.author_association) && !isBot(pull.user), ...observations.get(pull.number),
  })) ?? null;
  const docs = `${guideText ?? ""}\n${readmeText ?? ""}`;
  return scoreRepository({
    checkedAt, stars: repo.stargazers_count ?? 0, forks: repo.forks_count ?? 0, pushedAt: repo.pushed_at, latestReleaseAt: latestRelease?.published_at ?? null,
    recentPulls: pullObservations, hasContributionGuide: Boolean(guideText), hasSetupInstructions: /(?:install|setup|getting started|development environment|prerequisites)/i.test(docs),
    hasTestInstructions: /(?:npm test|pnpm test|yarn test|pytest|cargo test|go test|gradle.*test|testing)/i.test(docs), hasBeginnerIssues: labels.some((label) => /good first issue|beginner|first[-\s]timers?[-\s]only/i.test(label)),
  });
}

async function getRepositoryQuality(repo: GitHubRepo, guideText: string | null, readmeText: string | null, labels: string[], checkedAt: string, force: boolean, deepQuality: boolean) {
  const cacheKey = `${repo.full_name}:${deepQuality ? "deep" : "feed"}`;
  const cached = historicalQualityCache.get(cacheKey);
  if (!force && cached && Date.now() < cached.expiresAt) return cached.value;
  const value = await buildRepositoryQuality(repo, guideText, readmeText, labels, force, checkedAt, deepQuality);
  historicalQualityCache.set(cacheKey, { value, expiresAt: Date.now() + 24 * 60 * 60_000 });
  return value;
}

async function getRepositoryContext(issue: GitHubIssue, labels: string[], force: boolean, checkedAt: string, cache: Map<string, Promise<RepositoryContext | null>>, deepQuality: boolean) {
  const path = issue.repository_url.replace(`${API_ROOT}/repos/`, "");
  const cacheKey = `${path}:${deepQuality ? "deep" : "feed"}`;
  if (!cache.has(cacheKey)) cache.set(cacheKey, (async () => {
    const [repo, topLevelContributionFile, readmeFile, communityProfile] = await Promise.all([
      getJson<GitHubRepo>(issue.repository_url, false),
      getJson<ContentFile>(`/repos/${path}/contents/CONTRIBUTING.md`, false, true),
      getJson<ContentFile>(`/repos/${path}/readme`, false, true),
      getJson<CommunityProfile>(`/repos/${path}/community/profile`, false, true),
    ]).catch(() => [null, null, null, null] as const);
    if (!repo || repo.archived || repo.disabled || isPracticeRepository(repo)) return null;
    const communityGuideUrl = communityProfile?.files?.contributing?.url;
    const contributionFile = topLevelContributionFile ?? (communityGuideUrl ? await getJson<ContentFile>(communityGuideUrl, false, true) : null);
    const guideText = decodeFile(contributionFile);
    const readmeText = decodeFile(readmeFile);
    if (CLOSED_TO_CONTRIBUTIONS_PATTERN.test(`${guideText ?? ""}\n${readmeText ?? ""}`)) return null;
    const cataloged = isCatalogRepository(path);
    const ageDays = repo.created_at ? (Date.parse(checkedAt) - Date.parse(repo.created_at)) / 86_400_000 : 0;
    if (!cataloged && (repo.owner.type !== "Organization" || repo.stargazers_count < 10_000 || repo.forks_count < 500 || ageDays < 365 || !guideText || DIRECTORY_REPOSITORY_PATTERN.test(`${repo.name} ${repo.description ?? ""}`))) return null;
    const repositoryQuality = await getRepositoryQuality(repo, guideText, readmeText, labels, checkedAt, force, deepQuality || !cataloged);
    const maintenance = repositoryQuality.factors.find((factor) => factor.key === "maintenance")?.earned;
    const newcomerMerges = repositoryQuality.factors.find((factor) => factor.key === "newcomers")?.mergedCount ?? 0;
    if (!cataloged && ((!maintenance || maintenance <= 0) || newcomerMerges < 1)) return null;
    const repositoryGuidance = makeRepositoryGuidance(repo, guideText, readmeText, contributionFile, readmeFile, checkedAt);
    return { repo, contributionFile, guideText, readmeText, repositoryQuality, repositoryGuidance };
  })());
  return cache.get(cacheKey)!;
}

async function enrichIssue(candidate: Candidate, force: boolean, checkedAt: string, repositoryCache: Map<string, Promise<RepositoryContext | null>>, deepQuality: boolean): Promise<OpenSourceOpportunity | null> {
  const { issue, tiers } = candidate;
  const path = issue.repository_url.replace(`${API_ROOT}/repos/`, "");
  const [owner, repoName] = path.split("/");
  if (!owner || !repoName || issue.pull_request) return null;
  const labels = labelNames(issue.labels);
  const repositoryLabels = tiers.includes("beginner") ? [...labels, "good first issue"] : labels;
  const [context, comments, timeline] = await Promise.all([
    getRepositoryContext(issue, repositoryLabels, force, checkedAt, repositoryCache, deepQuality),
    issue.comments > 0 ? getJson<GitHubComment[]>(`${issue.comments_url}?per_page=30&sort=created&direction=desc`, force, true, false) : Promise.resolve([]),
    getJson<TimelineEvent[]>(`/repos/${owner}/${repoName}/issues/${issue.number}/timeline?per_page=50`, force, true, false),
  ]).catch(() => [null, null, null] as const);
  if (!context) return null;
  const { repo, contributionFile, guideText, readmeText, repositoryQuality, repositoryGuidance } = context;
  const issueAwareRepositoryGuidance = applyIssueGuidance(repositoryGuidance, issue, comments);

  const policy = makePolicy(issue, comments, guideText, contributionFile, checkedAt);
  const recentClaim = comments?.find((comment) => !isMaintainer(comment.author_association) && !isBot(comment.user) && CLAIM_PATTERN.test(comment.body ?? "") && Date.parse(comment.created_at) >= Date.parse(checkedAt) - 30 * 86_400_000);
  const references = (timeline ?? []).filter((event) => event.event === "cross-referenced" && event.source?.issue?.pull_request).map((event) => event.source!.issue!);
  const openImplementations = references.filter((pr) => pr.state === "open" && closesIssue(pr.body, owner, repoName, issue.number));
  const unclearOpenReferences = references.filter((pr) => pr.state === "open" && !closesIssue(pr.body, owner, repoName, issue.number));
  const closedUnmergedImplementations = references.filter((pr) => pr.state === "closed" && !pr.pull_request?.merged_at && closesIssue(pr.body, owner, repoName, issue.number));
  const blocked = labels.some((label) => BLOCKED_LABEL_PATTERN.test(label));
  const claimedByLabel = labels.some((label) => CLAIMED_LABEL_PATTERN.test(label));
  const asksFirst = labels.some((label) => ASK_LABEL_PATTERN.test(label));
  const status: AvailabilityStatus = blocked ? "blocked" : issue.assignee || claimedByLabel ? "possibly-claimed" : openImplementations.length ? "linked-pr" : recentClaim ? "possibly-claimed"
    : closedUnmergedImplementations.length ? "ask-first" : !comments || !timeline || unclearOpenReferences.length || policy.kind === "unknown" || policy.kind === "varies" ? "unknown"
      : asksFirst || policy.kind === "assignment-required" || policy.kind === "approval-required" ? "ask-first" : "unassigned";
  const eligibleForDefault = !issue.assignee && !claimedByLabel && !blocked && !openImplementations.length;
  const maintainerReplies = (comments ?? []).filter((comment) => isMaintainer(comment.author_association) && !isBot(comment.user)).length;
  const onboardingPoints = repositoryQuality.factors.find((factor) => factor.key === "onboarding")?.earned ?? 0;
  const issueScores = scoreIssue({ body: issue.body, title: issue.title, labels, language: repo.language, onboardingPoints, hasMaintainerDirection: maintainerReplies > 0, blocked, repositoryScore: repositoryQuality.score });
  const commands = extractCommands(issue.body, guideText, readmeText);
  const sources: Source[] = [{ label: `GitHub issue #${issue.number}`, href: issue.html_url, kind: "issue" }, { label: `${repo.full_name} repository`, href: repo.html_url, kind: "official" }];
  if (contributionFile?.html_url) sources.push({ label: "CONTRIBUTING.md", href: contributionFile.html_url, kind: "guide" });
  references.slice(0, 3).forEach((pr, index) => { if (pr.html_url) sources.push({ label: pr.title || `Timeline-referenced PR ${index + 1}`, href: pr.html_url, kind: "pull-request" }); });
  const referenceUncertainty = unclearOpenReferences.length ? `${unclearOpenReferences.length} open PR reference${unclearOpenReferences.length === 1 ? " was" : "s were"} found, but closing-keyword context did not establish that the PR implements this issue.` : "";
  const statusDetail = blocked ? `A blocking label is currently applied: ${labels.filter((label) => BLOCKED_LABEL_PATTERN.test(label)).join(", ")}.` : issue.assignee ? `The issue is assigned to @${issue.assignee.login}.` : claimedByLabel ? `A visible work-state label is applied: ${labels.filter((label) => CLAIMED_LABEL_PATTERN.test(label)).join(", ")}.`
    : openImplementations.length ? `${openImplementations.length} open pull request${openImplementations.length === 1 ? " uses" : "s use"} a closing keyword for this issue.` : recentClaim ? `Possible claim language was found in a comment from @${recentClaim.user.login} within the last 30 days.`
      : closedUnmergedImplementations.length ? "A previously linked implementation PR closed without a visible merge. Confirm that the change is still wanted before restarting it." : referenceUncertainty || (status === "unknown" ? "Availability or assignment policy could not be fully verified; check the issue directly." : "No assignee, competing implementation PR, or recent claim was found in the fetched public evidence.");
  const availabilityLabel: string | undefined = status === "linked-pr" ? "Already in progress" : status === "possibly-claimed" ? "Possibly in progress" : status === "blocked" ? "Blocked" : status === "unknown" ? undefined
    : policy.kind === "assignment-required" ? "Request assignment first" : policy.kind === "approval-required" ? "Discuss approach first" : "No competing work found";
  const startSteps = status === "linked-pr" ? ["Open the linked implementation PR before doing any work.", "Only offer complementary help requested by its author or maintainers."]
    : status === "possibly-claimed" ? [recentClaim ? `Read @${recentClaim.user.login}’s recent comment.` : "Check the current assignee’s activity.", "Coordinate before opening a competing implementation."]
      : status === "blocked" ? ["Read the latest maintainer comments for the blocking condition.", "Wait until the blocker is explicitly cleared."]
        : [contributionFile ? "Read the repository’s CONTRIBUTING.md." : "Check the README and issue templates for the contribution process.", policy.detail, "Re-open the source issue immediately before starting and check for new competing work."];
  const setup = [contributionFile ? "A top-level CONTRIBUTING.md was found and is linked below." : "No top-level CONTRIBUTING.md was found; check README and .github documentation manually.", ...commands.map((command) => `Documented command found: ${command}`), commands.length ? "Confirm that the documented checks cover your changed area." : "No setup or test command was safely identified automatically; verify the repository documentation before coding."];
  const avoid: Guidance[] = [];
  if (contributionFile?.html_url) avoid.push({ kind: "Official repository rule", text: "This repository publishes a contribution guide. Follow the linked source where it is more specific than this summary.", source: { label: "CONTRIBUTING.md", href: contributionFile.html_url, kind: "guide" } });
  if (recentClaim) avoid.push({ kind: "Observed review pattern", text: `A public comment from @${recentClaim.user.login} contains possible claim language. This is an observation, not proof that the work remains active.`, source: { label: "Observed comment", href: recentClaim.html_url, kind: "issue" } });
  if (closedUnmergedImplementations.length) avoid.push({ kind: "Observed review pattern", text: "A prior implementation PR closed without a visible merge. The available evidence does not establish why it closed.", source: { label: "Closed implementation PR", href: closedUnmergedImplementations[0].html_url ?? issue.html_url, kind: "pull-request" } });
  avoid.push({ kind: "General suggestion", text: "Keep the first change within the issue’s documented scope and avoid unrelated cleanup." });
  const caution = status === "unassigned" ? "No competing work was found, but availability is never guaranteed." : status === "possibly-claimed" ? "Public evidence suggests someone may already be working on this."
    : status === "linked-pr" ? "An open implementation PR exists; this is removed from the default feed." : status === "blocked" ? "A blocking label is present; this is removed from the default feed."
      : closedUnmergedImplementations.length ? "A prior implementation closed without a visible merge; confirm that the change is still wanted." : status === "ask-first" ? `${policy.label} before implementing.` : "Some checks or policy evidence are incomplete; verify directly on GitHub.";
  const keyRequirement = status === "linked-pr" ? "Review the existing implementation before offering help."
    : status === "possibly-claimed" ? "Coordinate with the visible claimant before starting."
      : status === "blocked" ? "Wait for the documented blocker to be cleared."
        : closedUnmergedImplementations.length ? "Confirm that maintainers still want a new implementation."
          : policy.kind === "assignment-required" ? "Request assignment before writing code."
          : policy.kind === "approval-required" || policy.kind === "varies" ? "Confirm the approach with a maintainer first."
            : contributionFile ? "Read CONTRIBUTING.md." : "Verify the repository process.";

  return {
    id: `github-${issue.id}`, category: "open-source", owner, repo: repoName, avatar: repo.owner.avatar_url || initials(owner), issueNumber: issue.number,
    title: issue.title, summary: cleanSummary(issue.body, repo.description ?? "Open issue with a beginner-oriented label."), repositoryDescription: repo.description ?? undefined, keyRequirement, language: repo.language ?? "Unknown", languageColor: languageColors[repo.language ?? ""] ?? "#71717a",
    labels: labels.slice(0, 4), experience: experienceForIssue(labels, tiers), status, statusDetail, checkedAt, updatedAt: issue.updated_at,
    maintainerActivity: maintainerReplies ? `${maintainerReplies} human maintainer ${maintainerReplies === 1 ? "reply" : "replies"} in this issue` : undefined,
    activityWindow: maintainerReplies ? `${comments?.length ?? 0} fetched comments in the current issue thread` : undefined, caution, assignment: policy.detail,
    visibleClaims: recentClaim ? `Possible claim from @${recentClaim.user.login} on ${new Date(recentClaim.created_at).toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "UTC" })}.` : `No claim language found in ${comments?.length ?? 0} fetched comments from the last 30 days. Automated detection can miss informal claims.`,
    linkedPrs: openImplementations.length ? `${openImplementations.length} open implementation PR${openImplementations.length === 1 ? "" : "s"}.` : referenceUncertainty || "No competing implementation PR was established from the fetched timeline.",
    blockers: blocked ? `Blocking label: ${labels.filter((label) => BLOCKED_LABEL_PATTERN.test(label)).join(", ")}.` : "No blocking label was found.",
    startSteps, setup, avoid, sources, issueUrl: issue.html_url, repositoryUrl: repo.html_url, availabilityLabel, eligibleForDefault, assignmentPolicy: policy, repositoryQuality, repositoryGuidance: issueAwareRepositoryGuidance, discoveryTiers: tiers, ...issueScores,
  };
}

function selectCandidates(items: GitHubIssue[], tier: DiscoveryTier, limit: number, maxPerRepository = MAX_ISSUES_PER_REPOSITORY, allowedRepositories?: ReadonlySet<string>): Candidate[] {
  const counts = new Map<string, number>();
  const selected: Candidate[] = [];
  for (const issue of items) {
    const repository = issue.repository_url.replace(`${API_ROOT}/repos/`, "").toLowerCase();
    if (allowedRepositories && !allowedRepositories.has(repository)) continue;
    const labels = labelNames(issue.labels);
    if (issue.pull_request || issue.assignee || labels.some((label) => CLAIMED_LABEL_PATTERN.test(label) || BLOCKED_LABEL_PATTERN.test(label) || STALE_LABEL_PATTERN.test(label) || NOT_ACTIONABLE_LABEL_PATTERN.test(label))) continue;
    const count = counts.get(issue.repository_url) ?? 0;
    if (count >= maxPerRepository) continue;
    counts.set(issue.repository_url, count + 1);
    selected.push({ issue, tiers: [tier] });
    if (selected.length >= limit) break;
  }
  return selected;
}

async function discoverEstablishedRepositories(force: boolean, checkedAt: string): Promise<Candidate[]> {
  const pushedSince = new Date(Date.parse(checkedAt) - 90 * 86_400_000).toISOString().slice(0, 10);
  const query = `archived:false fork:false stars:>=10000 pushed:>=${pushedSince} topic:good-first-issue`;
  const result = await getJson<RepositorySearchResponse>(`/search/repositories?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=30`, force, true);
  const repositories = (result?.items ?? [])
    .filter((repo) => !isCatalogRepository(repo.full_name) && !isPracticeRepository(repo) && !DIRECTORY_REPOSITORY_PATTERN.test(`${repo.name} ${repo.description ?? ""}`))
    .slice(0, 16);
  const issueGroups: Candidate[][] = [];
  for (let index = 0; index < repositories.length; index += 4) {
    const batch = await Promise.all(repositories.slice(index, index + 4).map(async (repo) => {
      const base = `/repos/${repo.full_name}/issues?state=open&sort=updated&direction=desc&per_page=30&labels=`;
      const [beginner, moderate] = await Promise.all([
        getJson<GitHubIssue[]>(`${base}${encodeURIComponent("good first issue")}`, force, true).catch(() => null),
        getJson<GitHubIssue[]>(`${base}${encodeURIComponent("help wanted")}`, force, true).catch(() => null),
      ]);
      const recent = (issues: GitHubIssue[] | null) => (issues ?? []).filter((issue) => Date.parse(issue.updated_at) >= Date.parse(checkedAt) - 365 * 86_400_000);
      return [
        ...selectCandidates(recent(beginner), "beginner", 1, 1),
        ...selectCandidates(recent(moderate), "moderate", 1, 1),
      ].slice(0, 1);
    }));
    issueGroups.push(...batch);
  }
  return issueGroups.flat();
}

function mergeCandidatePools(pools: Candidate[][], maxPerRepository = MAX_FEED_ISSUES) {
  const merged = new Map<number, Candidate>();
  const repositoryCounts = new Map<string, number>();
  const queues = pools.map((pool) => [...pool]);
  while (merged.size < MAX_FEED_ISSUES && queues.some((queue) => queue.length)) {
    for (const queue of queues) {
      const candidate = queue.shift();
      if (!candidate) continue;
      const current = merged.get(candidate.issue.id);
      if (current) {
        current.tiers = [...new Set([...current.tiers, ...candidate.tiers])];
      } else {
        const repositoryCount = repositoryCounts.get(candidate.issue.repository_url) ?? 0;
        if (repositoryCount >= maxPerRepository) continue;
        repositoryCounts.set(candidate.issue.repository_url, repositoryCount + 1);
        merged.set(candidate.issue.id, candidate);
      }
      if (merged.size >= MAX_FEED_ISSUES) break;
    }
  }
  return [...merged.values()];
}

async function enrichCandidates(candidates: Candidate[], force: boolean, checkedAt: string, deepQuality: boolean) {
  const records: OpenSourceOpportunity[] = [];
  const repositoryCache = new Map<string, Promise<RepositoryContext | null>>();
  const concurrency = process.env.GITHUB_TOKEN ? 8 : 2;
  for (let index = 0; index < candidates.length; index += concurrency) {
    const batch = await Promise.all(candidates.slice(index, index + concurrency).map((candidate) => enrichIssue(candidate, force, checkedAt, repositoryCache, deepQuality)));
    for (const item of batch) if (item?.eligibleForDefault) records.push(item);
  }
  return records;
}

export class GitHubOpportunityProvider {
  readonly label = process.env.GITHUB_TOKEN ? "GitHub REST API · authenticated" : "GitHub REST API · public access";
  private cachedPayload?: OpportunityPayload;
  private cacheExpiresAt = 0;

  async getAll(force = false): Promise<OpportunityPayload> {
    if (!force && this.cachedPayload && Date.now() < this.cacheExpiresAt) return this.cachedPayload;
    const updatedSince = new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10);
    const authenticated = Boolean(process.env.GITHUB_TOKEN);
    const allGroups = buildCatalogSearchGroups(REPOSITORY_CATALOG);
    const catalogSearches = (authenticated
      ? allGroups
      : (["beginner", "moderate", "high-impact"] as const).flatMap((tier) => allGroups.filter((group) => group.tier === tier).slice(0, 2)))
      .map((group) => ({
        ...group,
        limit: group.repositories.length,
        query: `is:issue is:open archived:false no:assignee updated:>=${updatedSince} label:"${group.label}" ${group.repositories.map((repo) => `repo:${repo}`).join(" ")}`,
      }));
    const searches = catalogSearches;
    const responses = await Promise.all(searches.map(({ query }) => githubFetch(`/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=50`, force).catch(() => new Response(null, { status: 503 }))));
    if (responses.every((response) => !response.ok)) throw new Error(`GitHub searches failed with ${responses.map((response) => response.status).join(", ")}.`);
    const data = await Promise.all(responses.map(async (response): Promise<SearchResponse> => response.ok ? response.json() as Promise<SearchResponse> : { items: [] }));
    const checkedAt = new Date().toISOString();
    const discovered = authenticated ? await discoverEstablishedRepositories(force, checkedAt).catch(() => []) : [];
    const candidates = mergeCandidatePools([...data.map((result, index) => selectCandidates(
      result.items,
      searches[index].tier,
      searches[index].limit,
      1,
      searches[index].repositories.length ? new Set(searches[index].repositories.map((repo) => repo.toLowerCase())) : undefined,
    )), discovered], 1);
    const records = await enrichCandidates(candidates, force, checkedAt, false);
    if (!records.length) throw new Error("GitHub returned no eligible issue records after availability checks.");
    const rateResponse = responses.find((response) => response.ok) ?? responses[0];
    const remaining = Number(rateResponse.headers.get("x-ratelimit-remaining") ?? "0");
    const limit = Number(rateResponse.headers.get("x-ratelimit-limit") ?? "0");
    const resetEpoch = Number(rateResponse.headers.get("x-ratelimit-reset") ?? "0");
    const payload: OpportunityPayload = { records, checkedAt, mode: "live", providerLabel: this.label, rateLimit: resetEpoch ? { remaining, limit, resetAt: new Date(resetEpoch * 1000).toISOString() } : undefined };
    payload.refreshIntervalMs = process.env.GITHUB_TOKEN ? 15 * 60_000 : 60 * 60_000;
    this.cachedPayload = payload;
    this.cacheExpiresAt = Date.now() + (process.env.GITHUB_TOKEN ? 15 * 60_000 : 60 * 60_000);
    return payload;
  }
}

export async function getRepositoryOpportunityData(owner: string, repo: string, requestedTiers: DiscoveryTier[] = []): Promise<OpportunityPayload> {
  if (!/^[a-z0-9_.-]{1,100}$/i.test(owner) || !/^[a-z0-9_.-]{1,100}$/i.test(repo)) throw new Error("Invalid repository name.");
  const path = `/repos/${owner}/${repo}/issues?state=open&sort=updated&direction=desc&per_page=30&labels=`;
  const discoveryLabels = [...new Set(["good first issue", "help wanted", ...labelsForCatalogRepository(`${owner}/${repo}`)])];
  const issueGroups = await Promise.all(discoveryLabels.map((label) => getJson<GitHubIssue[]>(`${path}${encodeURIComponent(label)}`, false)));
  const addTiers = (items: Candidate[], tiers: DiscoveryTier[]) => items.map((candidate) => ({ ...candidate, tiers: [...new Set([...candidate.tiers, ...tiers])] }));
  const candidates = mergeCandidatePools(issueGroups.map((issues, index) => addTiers(
    selectCandidates(issues ?? [], /good first|first[-\s]timers?|beginner|easy/i.test(discoveryLabels[index]) ? "beginner" : "moderate", 7, 7),
    requestedTiers,
  ))).slice(0, 12);
  const checkedAt = new Date().toISOString();
  const records = await enrichCandidates(candidates, false, checkedAt, true);
  return {
    records,
    checkedAt,
    mode: "live",
    providerLabel: process.env.GITHUB_TOKEN ? "GitHub REST API · authenticated" : "GitHub REST API · public access",
    refreshIntervalMs: process.env.GITHUB_TOKEN ? 15 * 60_000 : 60 * 60_000,
  };
}

export { closesIssue as referencesIssueWithClosingKeyword, policySignal as detectAssignmentPolicySignal };
export const isClaimedWorkLabel = (label: string) => CLAIMED_LABEL_PATTERN.test(label);
export const isStaleWorkLabel = (label: string) => STALE_LABEL_PATTERN.test(label);

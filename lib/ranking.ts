import type { RepositoryQuality, RepositoryQualityFactor } from "./types";

export type PullObservation = {
  createdAt: string;
  merged: boolean;
  newcomer: boolean;
  external: boolean;
  responded?: boolean;
  firstResponseHours?: number;
};

export type RepositoryEvidence = {
  checkedAt: string;
  stars: number;
  forks: number;
  pushedAt: string | null;
  latestReleaseAt: string | null;
  recentPulls: PullObservation[] | null;
  hasContributionGuide: boolean;
  hasSetupInstructions: boolean;
  hasTestInstructions: boolean;
  hasBeginnerIssues: boolean;
};

const WINDOW_DAYS = 90 as const;
const maintainerRoles = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);

export function isHumanMaintainerEvent(event: { event?: string; author_association?: string; user?: { login?: string; type?: string } | null }) {
  const login = event.user?.login ?? "";
  return (event.event === "commented" || event.event === "reviewed")
    && maintainerRoles.has(event.author_association ?? "")
    && event.user?.type !== "Bot"
    && !login.endsWith("[bot]");
}

function recencyWeight(createdAt: string, checkedAt: string) {
  const ageDays = Math.max(0, (Date.parse(checkedAt) - Date.parse(createdAt)) / 86_400_000);
  return Math.max(0.35, 1 - ageDays / WINDOW_DAYS);
}

function weightedRate(items: PullObservation[], predicate: (item: PullObservation) => boolean, checkedAt: string) {
  const total = items.reduce((sum, item) => sum + recencyWeight(item.createdAt, checkedAt), 0);
  if (!total) return 0;
  return items.reduce((sum, item) => sum + (predicate(item) ? recencyWeight(item.createdAt, checkedAt) : 0), 0) / total;
}

function repositoryLabel(score: number | null, factors: RepositoryQualityFactor[]) {
  if (score === null) return "Insufficient quality evidence";
  const newcomer = factors.find((factor) => factor.key === "newcomers");
  if (score >= 78 && newcomer?.earned != null && newcomer.earned >= 20) return "Established project · Welcomes newcomers";
  if (score >= 78) return "Strong repository evidence";
  if (score >= 62) return "Promising contributor experience";
  if (score >= 45) return "Mixed contributor evidence";
  return "Limited contributor readiness";
}

export function scoreRepository(evidence: RepositoryEvidence): RepositoryQuality {
  const newcomerPulls = evidence.recentPulls?.filter((pull) => pull.newcomer) ?? null;
  const sampledNewcomers = newcomerPulls?.filter((pull) => pull.responded !== undefined) ?? null;
  const newcomerEarned = newcomerPulls && sampledNewcomers && sampledNewcomers.length >= 2
    ? Math.round(30 * (0.55 * weightedRate(sampledNewcomers, (pull) => pull.responded === true, evidence.checkedAt) + 0.45 * weightedRate(newcomerPulls, (pull) => pull.merged, evidence.checkedAt)))
    : null;
  const newcomerEvidence = newcomerPulls === null
    ? "Recent pull-request history could not be checked."
    : sampledNewcomers && sampledNewcomers.length >= 2
      ? `${sampledNewcomers.filter((pull) => pull.responded).length} of ${sampledNewcomers.length} sampled newcomer PRs received a human maintainer response; ${newcomerPulls.filter((pull) => pull.merged).length} of ${newcomerPulls.length} newcomer PRs merged in the 90-day window.`
      : `${newcomerPulls.filter((pull) => pull.merged).length} of ${newcomerPulls.length} newcomer PR${newcomerPulls.length === 1 ? "" : "s"} merged in the 90-day window; ${sampledNewcomers?.length ?? 0} had response evidence sampled, and at least 2 are required to score this factor.`;

  const externalPulls = evidence.recentPulls?.filter((pull) => pull.external && pull.responded !== undefined) ?? null;
  const responseEarned = externalPulls && externalPulls.length >= 3
    ? Math.round(25 * (0.7 * weightedRate(externalPulls, (pull) => pull.responded === true, evidence.checkedAt) + 0.3 * weightedRate(externalPulls, (pull) => pull.firstResponseHours !== undefined && pull.firstResponseHours <= 168, evidence.checkedAt)))
    : null;
  const responseTimes = externalPulls?.map((pull) => pull.firstResponseHours).filter((hours): hours is number => hours !== undefined).sort((a, b) => a - b) ?? [];
  const medianHours = responseTimes.length ? responseTimes[Math.floor(responseTimes.length / 2)] : undefined;
  const responseEvidence = externalPulls === null
    ? "External pull-request review activity could not be checked."
    : externalPulls.length >= 3
      ? `${externalPulls.filter((pull) => pull.responded).length} of ${externalPulls.length} sampled external PRs received a human reply or review${medianHours !== undefined ? `; median first observed response was ${Math.round(medianHours)}h` : ""}.`
      : `Only ${externalPulls.length} external PR${externalPulls.length === 1 ? " was" : "s were"} sampled; at least 3 are required.`;

  // Fame contributes at most 20 points. Both components are logarithmic and capped.
  const starPoints = Math.min(14, (Math.log10(evidence.stars + 1) / 5) * 14);
  const forkPoints = Math.min(6, (Math.log10(evidence.forks + 1) / 4) * 6);
  const reputationEarned = Math.round(starPoints + forkPoints);

  const pushedAge = evidence.pushedAt ? (Date.parse(evidence.checkedAt) - Date.parse(evidence.pushedAt)) / 86_400_000 : Number.POSITIVE_INFINITY;
  const pushPoints = pushedAge <= 7 ? 6 : pushedAge <= 30 ? 5 : pushedAge <= 90 ? 3 : pushedAge <= 180 ? 1 : 0;
  const mergedCount = evidence.recentPulls?.filter((pull) => pull.merged).length ?? 0;
  const mergePoints = evidence.recentPulls ? Math.min(6, Math.round(Math.log2(mergedCount + 1) * 1.5)) : 0;
  const releaseAge = evidence.latestReleaseAt ? (Date.parse(evidence.checkedAt) - Date.parse(evidence.latestReleaseAt)) / 86_400_000 : Number.POSITIVE_INFINITY;
  const releasePoints = releaseAge <= 90 ? 3 : releaseAge <= 180 ? 1 : 0;
  const maintenanceEarned = evidence.recentPulls === null ? null : Math.min(15, pushPoints + mergePoints + releasePoints);

  const onboardingEarned = (evidence.hasContributionGuide ? 3 : 0)
    + (evidence.hasSetupInstructions ? 2 : 0)
    + (evidence.hasTestInstructions ? 2 : 0)
    + (evidence.hasBeginnerIssues ? 3 : 0);

  const factors: RepositoryQualityFactor[] = [
    { key: "newcomers", label: "Treatment of newcomers", weight: 30, earned: newcomerEarned, evidence: newcomerEvidence, sampleSize: sampledNewcomers?.length, mergedCount: newcomerPulls?.filter((pull) => pull.merged).length },
    { key: "responsiveness", label: "Maintainer responsiveness", weight: 25, earned: responseEarned, evidence: responseEvidence, sampleSize: externalPulls?.length },
    { key: "reputation", label: "Reputation and adoption", weight: 20, earned: reputationEarned, evidence: `${evidence.stars.toLocaleString("en-US")} stars and ${evidence.forks.toLocaleString("en-US")} forks; both are log-scaled and capped. Independent usage was not separately verified.` },
    { key: "maintenance", label: "Current maintenance", weight: 15, earned: maintenanceEarned, evidence: evidence.recentPulls === null ? `Pull-request merge history could not be checked; last push ${Number.isFinite(pushedAge) ? `${Math.max(0, Math.round(pushedAge))}d ago` : "unknown"} and latest release ${Number.isFinite(releaseAge) ? `${Math.max(0, Math.round(releaseAge))}d ago` : "unknown"}.` : `${mergedCount} sampled PR${mergedCount === 1 ? "" : "s"} merged in 90 days; last push ${Number.isFinite(pushedAge) ? `${Math.max(0, Math.round(pushedAge))}d ago` : "unknown"}; latest release ${Number.isFinite(releaseAge) ? `${Math.max(0, Math.round(releaseAge))}d ago` : "unknown"}.` },
    { key: "onboarding", label: "Ease of getting started", weight: 10, earned: onboardingEarned, evidence: `${evidence.hasContributionGuide ? "Contribution guide found" : "No top-level contribution guide found"}; ${evidence.hasSetupInstructions ? "setup guidance detected" : "setup guidance not detected"}; ${evidence.hasTestInstructions ? "test guidance detected" : "test guidance not detected"}.` },
  ];
  const measured = factors.filter((factor) => factor.earned !== null);
  const coverage = measured.reduce((sum, factor) => sum + factor.weight, 0);
  // Do not normalize partial factors into a deceptively complete score.
  const score = coverage === 100 ? measured.reduce((sum, factor) => sum + (factor.earned ?? 0), 0) : null;
  return { score, coverage, label: repositoryLabel(score, factors), windowDays: WINDOW_DAYS, checkedAt: evidence.checkedAt, stars: evidence.stars, factors };
}


export function passesRepositoryQualityGate(quality: RepositoryQuality) {
  const maintenance = quality.factors.find((factor) => factor.key === "maintenance")?.earned;
  const onboarding = quality.factors.find((factor) => factor.key === "onboarding")?.earned;

  // Auto-discovered repositories need both current maintenance and enough
  // contributor documentation to make an issue realistically startable.
  if (maintenance == null || maintenance < 3) return false;
  if (onboarding == null || onboarding < 5) return false;

  // When behavioral evidence is complete, reject repositories whose measured
  // contributor experience is weak. Sparse evidence is not treated as failure;
  // the concrete maintenance/onboarding gates above still apply.
  if (quality.score !== null && quality.score < 45) return false;
  return true;
}

export function scoreIssue(input: { body: string | null; title: string; labels: string[]; language: string | null; onboardingPoints: number; hasMaintainerDirection: boolean; blocked: boolean; repositoryScore: number | null }) {
  const body = input.body ?? "";
  const beginnerSuitability = Math.min(100,
    (input.labels.some((label) => /good first issue|beginner|first[-\s]timers?[-\s]only/i.test(label)) ? 35 : 0)
    + Math.round((input.onboardingPoints / 10) * 20)
    + (input.language ? 15 : 0)
    + (body.length >= 80 && body.length <= 5000 ? 15 : 5)
    + (!input.blocked ? 15 : 0));
  const clarityReadiness = Math.min(100,
    (body.length >= 120 ? 25 : body.length ? 10 : 0)
    + (/acceptance criteria|expected behavior|expected result|requirements?|done when/i.test(body) ? 20 : 0)
    + (/steps to reproduce|reproduction|```|\btest(?:s|ing)?\b/i.test(body) ? 20 : 0)
    + (/contribut|readme|documentation/i.test(body) ? 15 : 0)
    + (input.hasMaintainerDirection ? 10 : 0)
    + (input.title.length >= 12 ? 10 : 0));
  const feedScore = input.repositoryScore === null ? null : Math.round(input.repositoryScore * 0.6 + beginnerSuitability * 0.25 + clarityReadiness * 0.15);
  return { beginnerSuitability, clarityReadiness, feedScore };
}

import type { OpenSourceOpportunity, RepositoryQualityFactor } from "./types";

export type OpenSourceTierId = "beginner" | "moderate" | "high-impact";

export type RankedContribution = {
  item: OpenSourceOpportunity;
  reason: string;
  rank: number;
};

export type OpenSourceTier = {
  id: OpenSourceTierId;
  title: string;
  description: string;
  items: RankedContribution[];
};

const startableStatuses = new Set(["unassigned", "ask-first", "unknown"]);

function factor(item: OpenSourceOpportunity, key: RepositoryQualityFactor["key"]) {
  const value = item.repositoryQuality?.factors.find((entry) => entry.key === key);
  return value?.earned == null ? 0 : (value.earned / value.weight) * 100;
}

function observedQuality(item: OpenSourceOpportunity) {
  if (item.repositoryQuality?.score != null) return item.repositoryQuality.score;
  return item.repositoryQuality?.factors.reduce((sum, entry) => sum + (entry.earned ?? 0), 0) ?? 0;
}

function availability(item: OpenSourceOpportunity) {
  return item.status === "unassigned" ? 100 : item.status === "ask-first" ? 72 : 38;
}

function scores(item: OpenSourceOpportunity) {
  const beginner = (item.beginnerSuitability ?? (item.experience === "Beginner" ? 65 : 35)) * 0.38
    + (item.clarityReadiness ?? 35) * 0.22
    + factor(item, "onboarding") * 0.2
    + factor(item, "newcomers") * 0.12
    + availability(item) * 0.08;
  const moderate = observedQuality(item) * 0.3
    + (item.clarityReadiness ?? 35) * 0.25
    + factor(item, "maintenance") * 0.2
    + factor(item, "responsiveness") * 0.15
    + availability(item) * 0.1;
  const stars = item.repositoryQuality?.stars ?? 0;
  const adoption = Math.min(100, Math.log10(stars + 1) / 5 * 100);
  const impact = adoption * 0.42
    + factor(item, "reputation") * 0.23
    + factor(item, "newcomers") * 0.15
    + factor(item, "maintenance") * 0.12
    + (item.clarityReadiness ?? 35) * 0.08;
  return { beginner, moderate, impact, stars };
}

function beginnerReason(item: OpenSourceOpportunity) {
  const parts = [item.labels.some((label) => /good first issue|beginner|first-timers-only/i.test(label)) ? "Beginner label" : "Approachable scope"];
  if (factor(item, "onboarding") >= 50) parts.push("setup guidance found");
  if (factor(item, "newcomers") > 0) parts.push("newcomer PR evidence");
  parts.push(item.availabilityLabel ?? "availability checked");
  return parts.join(" · ");
}

function moderateReason(item: OpenSourceOpportunity) {
  const parts = [item.experience === "Advanced" ? "Deeper project context" : "Moderate implementation scope"];
  if (factor(item, "maintenance") > 0) parts.push("recent maintenance");
  if (factor(item, "responsiveness") > 0) parts.push("maintainer review evidence");
  return parts.join(" · ");
}

function impactReason(item: OpenSourceOpportunity) {
  const stars = item.repositoryQuality?.stars ?? 0;
  const parts = [stars ? `${stars.toLocaleString("en-US")} public stars` : "Established project evidence"];
  if (factor(item, "newcomers") > 0) parts.push("newcomer merges observed");
  if (factor(item, "maintenance") > 0) parts.push("actively maintained");
  return parts.join(" · ");
}

export function rankOpenSourceTiers(records: OpenSourceOpportunity[]): OpenSourceTier[] {
  const active = records.filter((item) => startableStatuses.has(item.status));
  const buckets: Record<OpenSourceTierId, RankedContribution[]> = { beginner: [], moderate: [], "high-impact": [] };

  for (const item of active) {
    const value = scores(item);
    const hints = new Set(item.discoveryTiers ?? []);
    const beginnerLabel = item.experience === "Beginner" || item.labels.some((label) => /good first issue|beginner|first-timers-only/i.test(label));
    const highImpact = value.stars >= 10_000 && factor(item, "reputation") >= 50 && (hints.has("high-impact") || value.stars >= 50_000);
    const beginnerReady = beginnerLabel && (item.beginnerSuitability ?? 65) >= 58 && (factor(item, "onboarding") >= 30 || !item.repositoryQuality);
    const moderateReady = hints.has("moderate") || (!beginnerReady && !highImpact);
    if (beginnerReady) buckets.beginner.push({ item, rank: value.beginner, reason: beginnerReason(item) });
    if (moderateReady) buckets.moderate.push({ item, rank: value.moderate, reason: moderateReason(item) });
    if (highImpact) buckets["high-impact"].push({ item, rank: value.impact, reason: impactReason(item) });
    if (!beginnerReady && !moderateReady && !highImpact) buckets.moderate.push({ item, rank: value.moderate, reason: moderateReason(item) });
  }

  Object.values(buckets).forEach((items) => items.sort((a, b) => b.rank - a.rank || Date.parse(b.item.updatedAt) - Date.parse(a.item.updatedAt)));
  return [
    { id: "beginner", title: "Beginner-friendly", description: "Clearer scope, lower setup friction, and evidence that newcomers can get reviewed.", items: buckets.beginner },
    { id: "moderate", title: "Moderate scope", description: "Active work that benefits from more project context or implementation experience.", items: buckets.moderate },
    { id: "high-impact", title: "High project signal", description: "Widely adopted projects with strong public reputation evidence. Rows can overlap; this is not a hiring promise.", items: buckets["high-impact"] },
  ];
}

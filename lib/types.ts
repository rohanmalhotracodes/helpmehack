export type AvailabilityStatus =
  | "unassigned"
  | "ask-first"
  | "possibly-claimed"
  | "linked-pr"
  | "blocked"
  | "closed"
  | "unknown";

export type OpportunityCategory = "open-source" | "hackathon" | "program";
export type OpportunityView = "all" | OpportunityCategory | "repositories";
export type Experience = "Beginner" | "Intermediate" | "Advanced";
export type EventPlatform = "Unstop" | "Devpost" | "HackerEarth" | "HackerRank" | "Yandex";

export type Source = {
  label: string;
  href: string;
  kind: "guide" | "issue" | "discussion" | "pull-request" | "official";
};

export type Guidance = {
  kind: "Official repository rule" | "Observed review pattern" | "General suggestion";
  text: string;
  source?: Source;
};

export type AssignmentPolicyKind = "assignment-required" | "approval-required" | "direct" | "varies" | "unknown";

export type AssignmentPolicy = {
  kind: AssignmentPolicyKind;
  label: string;
  detail: string;
  checkedAt: string;
  source?: Source;
};

export type RepositoryQualityFactor = {
  key: "newcomers" | "responsiveness" | "reputation" | "maintenance" | "onboarding";
  label: string;
  weight: number;
  earned: number | null;
  evidence: string;
  sampleSize?: number;
};

export type RepositoryQuality = {
  score: number | null;
  coverage: number;
  label: string;
  windowDays: 90;
  checkedAt: string;
  stars: number;
  factors: RepositoryQualityFactor[];
};

export type RepositoryGuidance = {
  assignment: string;
  beforeStarting: string[];
  avoid: string[];
  source?: Source;
  checkedAt: string;
};

export type OpenSourceOpportunity = {
  id: string;
  category: "open-source";
  owner: string;
  repo: string;
  avatar: string;
  issueNumber: number;
  title: string;
  summary: string;
  repositoryDescription?: string;
  keyRequirement?: string;
  language: string;
  languageColor: string;
  labels: string[];
  experience: Experience;
  status: AvailabilityStatus;
  statusDetail: string;
  checkedAt: string;
  updatedAt: string;
  maintainerActivity?: string;
  activityWindow?: string;
  caution: string;
  assignment: string;
  visibleClaims: string;
  linkedPrs: string;
  blockers: string;
  startSteps: string[];
  setup: string[];
  avoid: Guidance[];
  sources: Source[];
  issueUrl?: string;
  repositoryUrl?: string;
  availabilityLabel?: string;
  eligibleForDefault?: boolean;
  assignmentPolicy?: AssignmentPolicy;
  repositoryQuality?: RepositoryQuality;
  repositoryGuidance?: RepositoryGuidance;
  beginnerSuitability?: number;
  clarityReadiness?: number;
  feedScore?: number | null;
  discoveryTiers?: Array<"beginner" | "moderate" | "high-impact">;
};

export type EventOpportunity = {
  id: string;
  category: "hackathon" | "program";
  organizer: string;
  title: string;
  summary: string;
  status: "open" | "closing-soon" | "upcoming" | "closed" | "unknown";
  deadline: string;
  deadlineAt?: string;
  eligibility: string;
  format: string;
  team: string;
  cost: string;
  checkedAt: string;
  updatedAt: string;
  experience: Experience;
  tags: string[];
  officialUrl: string;
  sourceNote: string;
  platform?: EventPlatform;
  posterUrl?: string;
  posterFit?: "cover" | "contain";
  prize?: string;
  registrationCount?: number;
  collection?: "Featured on Unstop" | "Top hackathon";
};

export type EventDiscoverySource = {
  platform: EventPlatform;
  state: "live" | "empty" | "unavailable";
  count: number;
  checkedAt: string;
  sourceUrl: string;
  message?: string;
};

export type EventDiscoveryPayload = {
  records: EventOpportunity[];
  checkedAt: string;
  refreshIntervalMs: number;
  mode: "live" | "partial" | "unavailable";
  sources: EventDiscoverySource[];
};

export type Opportunity = OpenSourceOpportunity | EventOpportunity;

export type OpportunityPayload = {
  records: Opportunity[];
  checkedAt: string;
  mode: "demo" | "live" | "hybrid";
  providerLabel: string;
  refreshIntervalMs?: number;
  warning?: string;
  eventDiscovery?: EventDiscoveryPayload;
  rateLimit?: {
    remaining: number;
    limit: number;
    resetAt: string;
  };
};

export type Filters = {
  query: string;
  category: OpportunityView;
  languages: string[];
  statuses: AvailabilityStatus[];
  experience: Experience[];
  sort: "recommended" | "recent" | "closing";
  savedOnly: boolean;
};

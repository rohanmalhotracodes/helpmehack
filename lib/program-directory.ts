export type ProgramRepository = {
  label: string;
  url: string;
};

export type ProgramProject = {
  title: string;
  shortDescription?: string;
  description?: string;
  codeUrl?: string;
  projectUrl?: string;
};

export type ProgramYear = {
  year: number;
  programUrl: string;
  projectCount: number;
  projects: ProgramProject[];
};

export type ProgramOrganization = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  technologies: string[];
  topics: string[];
  websiteUrl?: string;
  imageUrl?: string;
  imageBackgroundColor?: string;
  years: ProgramYear[];
  latestRepositories: ProgramRepository[];
};

export type ProgramOrganizationSummary = Omit<ProgramOrganization, "years"> & {
  years: Array<Pick<ProgramYear, "year" | "programUrl" | "projectCount">>;
};

export type SummerOfBitcoinYearArchive = {
  year: number;
  title: string;
  summary: string;
  officialUrl: string;
  contributors?: number;
  organizationCount?: number;
  projectCount?: number;
};

export const summerOfBitcoinYearArchives: SummerOfBitcoinYearArchive[] = [
  {
    year: 2026,
    title: "Summer of Bitcoin 2026",
    summary: "50 contributors were selected across 26 open-source Bitcoin organizations.",
    officialUrl: "https://blog.summerofbitcoin.org/summer-of-bitcoin-2026-announcing-the-next-generation-of-bitcoin-builders/",
    contributors: 50,
    organizationCount: 26,
  },
  {
    year: 2025,
    title: "Summer of Bitcoin 2025",
    summary: "68 contributors were selected across 33 open-source Bitcoin organizations.",
    officialUrl: "https://www.summerofbitcoin.org/2025-accepted-projects",
    contributors: 68,
    organizationCount: 33,
  },
  {
    year: 2024,
    title: "Summer of Bitcoin 2024",
    summary: "52 contributors were selected for the fourth Summer of Bitcoin cohort.",
    officialUrl: "https://www.summerofbitcoin.org/program-details/2024/r/rectcEvzVdwHh7gwb",
    contributors: 52,
  },
  {
    year: 2023,
    title: "Summer of Bitcoin 2023",
    summary: "45 contributors worked with 24 open-source Bitcoin and Lightning organizations.",
    officialUrl: "https://www.summerofbitcoin.org/program-details/2023/r/reckGTBbHuT6Amdhk",
    contributors: 45,
    organizationCount: 24,
  },
  {
    year: 2022,
    title: "Summer of Bitcoin 2022",
    summary: "83 contributors were selected across 29 open-source Bitcoin projects.",
    officialUrl: "https://www.summerofbitcoin.org/program-details/2022/r/recPLKAWw1UFZb7Sl",
    contributors: 83,
    projectCount: 29,
  },
  {
    year: 2021,
    title: "Summer of Bitcoin 2021",
    summary: "The pilot cohort selected 51 students and paired them with 40 mentors across 22 open-source Bitcoin and Lightning projects.",
    officialUrl: "https://blog.summerofbitcoin.org/summer-of-bitcoin-liftoff/",
    contributors: 51,
    projectCount: 22,
  },
];

type GsocRawProject = {
  title?: string;
  short_description?: string;
  description?: string;
  code_url?: string;
  project_url?: string;
};

type GsocRawYear = {
  projects_url?: string;
  num_projects?: number;
  projects?: GsocRawProject[];
};

type GsocRawOrganization = {
  name?: string;
  image_url?: string;
  image_background_color?: string;
  description?: string;
  url?: string;
  category?: string;
  topics?: string[];
  technologies?: string[];
  years?: Record<string, GsocRawYear>;
};

const GSOC_ALL_DATA_URL = "https://api.gsocorganizations.dev/organizations.json";
const GSOC_ARCHIVE_URL = "https://summerofcode.withgoogle.com/archive";

const validUrl = (value?: string) => {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function normalizeProject(project: GsocRawProject): ProgramProject {
  return {
    title: project.title?.trim() || "GSoC project",
    shortDescription: project.short_description?.trim() || undefined,
    description: project.description?.trim() || undefined,
    codeUrl: validUrl(project.code_url) ? project.code_url : undefined,
    projectUrl: validUrl(project.project_url) ? project.project_url : undefined,
  };
}

function mapGsocOrganization(organization: GsocRawOrganization): ProgramOrganization {
  const years = Object.entries(organization.years ?? {})
    .map(([year, data]) => {
      const numericYear = Number(year);
      const projects = (data.projects ?? []).map(normalizeProject);
      return {
        year: numericYear,
        programUrl: validUrl(data.projects_url)
          ? data.projects_url!
          : `https://summerofcode.withgoogle.com/archive/${numericYear}`,
        projectCount: Number.isFinite(data.num_projects) ? Number(data.num_projects) : projects.length,
        projects,
      };
    })
    .filter((item) => Number.isFinite(item.year))
    .sort((a, b) => b.year - a.year);

  const latestRepositories: ProgramRepository[] = [];
  const seen = new Set<string>();
  for (const project of years[0]?.projects ?? []) {
    if (!project.codeUrl || seen.has(project.codeUrl)) continue;
    seen.add(project.codeUrl);
    latestRepositories.push({ label: project.title, url: project.codeUrl });
    if (latestRepositories.length >= 3) break;
  }

  const name = organization.name?.trim() || "Unnamed organization";
  return {
    id: `gsoc-${slugify(name)}`,
    slug: slugify(name),
    name,
    description: organization.description?.trim() || "Google Summer of Code mentoring organization.",
    category: organization.category?.trim() || "Open source",
    technologies: (organization.technologies ?? []).filter(Boolean).slice(0, 16),
    topics: (organization.topics ?? []).filter(Boolean).slice(0, 16),
    websiteUrl: validUrl(organization.url) ? organization.url : undefined,
    imageUrl: validUrl(organization.image_url) ? organization.image_url : undefined,
    imageBackgroundColor: organization.image_background_color?.trim() || undefined,
    years,
    latestRepositories,
  };
}

export async function loadGsocOrganizations(): Promise<ProgramOrganization[]> {
  try {
    const response = await fetch(GSOC_ALL_DATA_URL, { next: { revalidate: 60 * 60 * 24 * 30 } });
    if (!response.ok) return [];
    const payload = await response.json() as GsocRawOrganization[];
    return payload.map(mapGsocOrganization).sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

export async function loadGsocOrganization(slug: string) {
  const organizations = await loadGsocOrganizations();
  return organizations.find((organization) => organization.slug === slug) ?? null;
}

export function summarizeProgramOrganization(organization: ProgramOrganization): ProgramOrganizationSummary {
  return {
    ...organization,
    years: organization.years.map(({ year, programUrl, projectCount }) => ({ year, programUrl, projectCount })),
  };
}

const summerOfBitcoinProgramUrl = "https://blog.summerofbitcoin.org/summer-of-bitcoin-2026-announcing-the-next-generation-of-bitcoin-builders/";

function githubAvatarFromRepositories(repositories: ProgramRepository[]) {
  const repository = repositories.find((item) => item.url.startsWith("https://github.com/"));
  if (!repository) return undefined;
  const parts = new URL(repository.url).pathname.split("/").filter(Boolean);
  return parts[0] ? `https://github.com/${parts[0]}.png` : undefined;
}

function sobOrganization(input: {
  id: string;
  name: string;
  description: string;
  category: string;
  technologies: string[];
  topics: string[];
  repositories: ProgramRepository[];
}): ProgramOrganization {
  return {
    ...input,
    slug: input.id.replace(/^sob-2026-/, ""),
    imageUrl: githubAvatarFromRepositories(input.repositories),
    years: [{ year: 2026, programUrl: summerOfBitcoinProgramUrl, projectCount: 0, projects: [] }],
    latestRepositories: input.repositories,
  };
}

export const summerOfBitcoin2026Organizations: ProgramOrganization[] = [
  sobOrganization({
    id: "sob-2026-asmap",
    name: "asmap",
    description: "AS-level network mapping and peer-diversity tooling used around Bitcoin Core.",
    category: "Bitcoin Core infrastructure",
    technologies: ["python", "bitcoin core", "networking"],
    topics: ["peer diversity", "network topology"],
    repositories: [{ label: "ASMap data", url: "https://github.com/bitcoin-core/asmap-data" }],
  }),
  sobOrganization({
    id: "sob-2026-bdk",
    name: "BDK",
    description: "Libraries for building modern Bitcoin wallets with descriptor-based wallet primitives.",
    category: "Wallet infrastructure",
    technologies: ["rust", "bitcoin", "wallets"],
    topics: ["wallets", "descriptors"],
    repositories: [{ label: "BDK", url: "https://github.com/bitcoindevkit/bdk" }],
  }),
  sobOrganization({
    id: "sob-2026-bitcoin-core",
    name: "Bitcoin Core",
    description: "The reference Bitcoin full-node implementation and its surrounding development ecosystem.",
    category: "Protocol infrastructure",
    technologies: ["c++", "python", "bitcoin"],
    topics: ["consensus", "p2p", "wallet"],
    repositories: [{ label: "Bitcoin Core", url: "https://github.com/bitcoin/bitcoin" }],
  }),
  sobOrganization({
    id: "sob-2026-bitcoin-design",
    name: "Bitcoin Design",
    description: "Open design resources and collaboration for non-custodial Bitcoin products.",
    category: "Design",
    technologies: ["design", "web", "documentation"],
    topics: ["ux", "wallets", "design systems"],
    repositories: [{ label: "Bitcoin Design Guide", url: "https://github.com/BitcoinDesign/Guide" }],
  }),
  sobOrganization({
    id: "sob-2026-bitcoin-fuzz",
    name: "Bitcoin-Fuzz",
    description: "Differential fuzzing infrastructure for Bitcoin protocol implementations and libraries.",
    category: "Testing and security",
    technologies: ["c++", "fuzzing", "bitcoin"],
    topics: ["security", "testing"],
    repositories: [{ label: "bitcoinfuzz", url: "https://github.com/bitcoinfuzz/bitcoinfuzz" }],
  }),
  sobOrganization({
    id: "sob-2026-braidpool",
    name: "Braidpool",
    description: "A peer-to-peer Bitcoin mining pool focused on decentralizing pool infrastructure.",
    category: "Mining",
    technologies: ["rust", "python", "bitcoin"],
    topics: ["mining", "p2p"],
    repositories: [{ label: "Braidpool", url: "https://github.com/braidpool/braidpool" }],
  }),
  sobOrganization({
    id: "sob-2026-coinswap",
    name: "Coinswap",
    description: "Privacy-oriented Bitcoin CoinSwap implementation and supporting protocol work.",
    category: "Privacy",
    technologies: ["rust", "bitcoin"],
    topics: ["coinswap", "privacy"],
    repositories: [{ label: "Teleport transactions", url: "https://github.com/bitcoin-teleport/teleport-transactions" }],
  }),
  sobOrganization({
    id: "sob-2026-contextvm",
    name: "ContextVM",
    description: "Protocol and SDK work at the intersection of Nostr and Model Context Protocol.",
    category: "Nostr and developer tooling",
    technologies: ["typescript", "nostr", "mcp"],
    topics: ["agents", "protocols"],
    repositories: [{ label: "ContextVM SDK", url: "https://github.com/ContextVM/sdk" }],
  }),
  sobOrganization({
    id: "sob-2026-cove",
    name: "Cove",
    description: "A modern Bitcoin mobile wallet with hardware-wallet and self-custody support.",
    category: "Wallets",
    technologies: ["swift", "kotlin", "rust"],
    topics: ["wallets", "hardware wallets"],
    repositories: [{ label: "Cove", url: "https://github.com/bitcoinppl/cove" }],
  }),
  sobOrganization({
    id: "sob-2026-demand",
    name: "Demand",
    description: "Open-source Stratum V2 mining-pool infrastructure and miner-facing tooling.",
    category: "Mining",
    technologies: ["typescript", "rust", "stratum v2"],
    topics: ["mining", "dashboard"],
    repositories: [{ label: "SV2 UI", url: "https://github.com/dmnd-pool/sv2-ui" }],
  }),
  sobOrganization({
    id: "sob-2026-fedimint",
    name: "Fedimint",
    description: "Federated applications and e-cash infrastructure built around Bitcoin and Lightning.",
    category: "Payments",
    technologies: ["rust", "bitcoin", "lightning"],
    topics: ["ecash", "federations"],
    repositories: [{ label: "Fedimint", url: "https://github.com/fedimint/fedimint" }],
  }),
  sobOrganization({
    id: "sob-2026-floresta",
    name: "Floresta",
    description: "A lightweight and embeddable Bitcoin client focused on validation and sovereignty.",
    category: "Protocol infrastructure",
    technologies: ["rust", "bitcoin"],
    topics: ["utreexo", "validation"],
    repositories: [{ label: "Floresta", url: "https://github.com/getfloresta/Floresta" }],
  }),
  sobOrganization({
    id: "sob-2026-flotilla",
    name: "Flotilla",
    description: "A Nostr relay-based communities and group-chat application.",
    category: "Nostr applications",
    technologies: ["typescript", "nostr", "pwa"],
    topics: ["communities", "messaging"],
    repositories: [{ label: "Current source", url: "https://gitea.coracle.social/coracle/flotilla" }],
  }),
  sobOrganization({
    id: "sob-2026-formstr",
    name: "Formstr",
    description: "Decentralized forms and related applications built on Nostr.",
    category: "Nostr applications",
    technologies: ["typescript", "react", "nostr"],
    topics: ["forms", "privacy"],
    repositories: [{ label: "Nostr Forms", url: "https://github.com/formstr-hq/nostr-forms" }],
  }),
  sobOrganization({
    id: "sob-2026-jam",
    name: "Jam",
    description: "A user-friendly web interface for JoinMarket and collaborative Bitcoin transactions.",
    category: "Privacy",
    technologies: ["typescript", "bitcoin", "web"],
    topics: ["joinmarket", "coinjoin"],
    repositories: [{ label: "Jam", url: "https://github.com/joinmarket-webui/jam" }],
  }),
  sobOrganization({
    id: "sob-2026-kern",
    name: "Kern",
    description: "Experimental air-gapped Bitcoin signing device built on ESP32-P4 hardware.",
    category: "Hardware wallets",
    technologies: ["c", "embedded", "bitcoin"],
    topics: ["signing", "hardware"],
    repositories: [{ label: "Kern", url: "https://github.com/odudex/Kern" }],
  }),
  sobOrganization({
    id: "sob-2026-krux",
    name: "Krux",
    description: "Open-source firmware for building air-gapped Bitcoin signing devices.",
    category: "Hardware wallets",
    technologies: ["python", "embedded", "bitcoin"],
    topics: ["signing", "self custody"],
    repositories: [{ label: "Krux", url: "https://github.com/selfcustody/krux" }],
  }),
  sobOrganization({
    id: "sob-2026-mostro",
    name: "Mostro",
    description: "Lightning-powered peer-to-peer Bitcoin exchange protocol built over Nostr.",
    category: "Bitcoin applications",
    technologies: ["rust", "nostr", "lightning"],
    topics: ["p2p exchange", "privacy"],
    repositories: [{ label: "Mostro", url: "https://github.com/MostroP2P/mostro" }],
  }),
  sobOrganization({
    id: "sob-2026-nostr-components",
    name: "Nostr Components",
    description: "Embeddable Nostr UI components for profiles, zaps, posts and other web experiences.",
    category: "Nostr developer tooling",
    technologies: ["typescript", "web components", "nostr"],
    topics: ["components", "zaps"],
    repositories: [{ label: "Nostr Components", url: "https://github.com/saiy2k/nostr-components" }],
  }),
  sobOrganization({
    id: "sob-2026-nostream",
    name: "Nostream",
    description: "A production-oriented Nostr relay implementation written in TypeScript.",
    category: "Nostr infrastructure",
    technologies: ["typescript", "postgresql", "redis"],
    topics: ["nostr", "relays"],
    repositories: [{ label: "Nostream", url: "https://github.com/cameri/nostream" }],
  }),
  sobOrganization({
    id: "sob-2026-seedsigner",
    name: "SeedSigner",
    description: "Open-source air-gapped signing software and hardware designs for Bitcoin self custody.",
    category: "Hardware wallets",
    technologies: ["python", "embedded", "bitcoin"],
    topics: ["signing", "multisig"],
    repositories: [{ label: "SeedSigner", url: "https://github.com/SeedSigner/seedsigner" }],
  }),
  sobOrganization({
    id: "sob-2026-shopstr",
    name: "Shopstr",
    description: "A permissionless Nostr marketplace for Bitcoin commerce.",
    category: "Bitcoin applications",
    technologies: ["typescript", "next.js", "nostr"],
    topics: ["commerce", "marketplace"],
    repositories: [{ label: "Shopstr", url: "https://github.com/shopstr-eng/shopstr" }],
  }),
  sobOrganization({
    id: "sob-2026-smite",
    name: "smite",
    description: "Coverage-guided snapshot fuzzing for Bitcoin Lightning Network implementations.",
    category: "Testing and security",
    technologies: ["rust", "fuzzing", "lightning"],
    topics: ["security", "testing"],
    repositories: [{ label: "smite", url: "https://github.com/lnfuzz/smite" }],
  }),
  sobOrganization({
    id: "sob-2026-stable-channels",
    name: "Stable Channels",
    description: "Self-custodial synthetic-dollar balances built on the Bitcoin Lightning Network.",
    category: "Lightning applications",
    technologies: ["rust", "lightning", "bitcoin"],
    topics: ["payments", "stability"],
    repositories: [{ label: "Stable Channels", url: "https://github.com/toneloc/stable-channels" }],
  }),
  sobOrganization({
    id: "sob-2026-strfry",
    name: "strfry",
    description: "A high-performance relay implementation for the Nostr protocol.",
    category: "Nostr infrastructure",
    technologies: ["c++", "lmdb", "nostr"],
    topics: ["relays", "protocol"],
    repositories: [{ label: "strfry", url: "https://github.com/hoytech/strfry" }],
  }),
  sobOrganization({
    id: "sob-2026-vls",
    name: "VLS",
    description: "Validating Lightning Signer isolates signing keys from Lightning node software.",
    category: "Lightning infrastructure",
    technologies: ["rust", "lightning", "security"],
    topics: ["signing", "key isolation"],
    repositories: [{ label: "Validating Lightning Signer", url: "https://gitlab.com/lightning-signer/validating-lightning-signer" }],
  }),
];

export const gsocArchiveUrl = GSOC_ARCHIVE_URL;

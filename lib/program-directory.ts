export type ProgramRepository = {
  label: string;
  url: string;
};

export type ProgramOrganization = {
  id: string;
  name: string;
  description: string;
  category: string;
  technologies: string[];
  topics: string[];
  websiteUrl?: string;
  programUrl: string;
  repositories: ProgramRepository[];
};

type GsocRawProject = {
  title?: string;
  code_url?: string;
  project_url?: string;
};

type GsocRawOrganization = {
  name?: string;
  description?: string;
  url?: string;
  category?: string;
  projects_url?: string;
  technologies?: string[];
  topics?: string[];
  projects?: GsocRawProject[];
};

type GsocRawPayload = {
  year?: number | string;
  archive_url?: string;
  organizations?: GsocRawOrganization[];
};

const GSOC_2026_DATA_URL = "https://raw.githubusercontent.com/nishantwrp/gsoc-organizations/master/api/data/2026.json";

const validUrl = (value?: string) => {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

function uniqueRepositories(projects: GsocRawProject[] = []) {
  const seen = new Set<string>();
  const repositories: ProgramRepository[] = [];
  for (const project of projects) {
    const url = project.code_url?.trim();
    if (!validUrl(url) || seen.has(url!)) continue;
    seen.add(url!);
    repositories.push({ label: project.title?.trim() || "Project code", url: url! });
    if (repositories.length >= 4) break;
  }
  return repositories;
}

export async function loadGsoc2026Organizations(): Promise<ProgramOrganization[]> {
  try {
    const response = await fetch(GSOC_2026_DATA_URL, { next: { revalidate: 60 * 60 * 24 * 30 } });
    if (!response.ok) return [];
    const payload = await response.json() as GsocRawPayload;
    return (payload.organizations ?? []).map((organization, index) => ({
      id: `gsoc-2026-${index}-${(organization.name ?? "organization").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name: organization.name?.trim() || "Unnamed organization",
      description: organization.description?.trim() || "GSoC 2026 mentoring organization.",
      category: organization.category?.trim() || "Open source",
      technologies: (organization.technologies ?? []).filter(Boolean).slice(0, 12),
      topics: (organization.topics ?? []).filter(Boolean).slice(0, 12),
      websiteUrl: validUrl(organization.url) ? organization.url : undefined,
      programUrl: validUrl(organization.projects_url)
        ? organization.projects_url!
        : "https://summerofcode.withgoogle.com/programs/2026/organizations",
      repositories: uniqueRepositories(organization.projects),
    })).sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

export const summerOfBitcoin2026Organizations: ProgramOrganization[] = [
  {
    id: "sob-2026-asmap",
    name: "asmap",
    description: "AS-level network mapping and peer-diversity tooling used around Bitcoin Core.",
    category: "Bitcoin Core infrastructure",
    technologies: ["python", "bitcoin core", "networking"],
    topics: ["peer diversity", "network topology"],
    programUrl: "https://blog.summerofbitcoin.org/summer-of-bitcoin-2026-announcing-the-next-generation-of-bitcoin-builders/",
    repositories: [{ label: "ASMap data", url: "https://github.com/bitcoin-core/asmap-data" }],
  },
  {
    id: "sob-2026-bdk",
    name: "BDK",
    description: "Libraries for building modern Bitcoin wallets with descriptor-based wallet primitives.",
    category: "Wallet infrastructure",
    technologies: ["rust", "bitcoin", "wallets"],
    topics: ["wallets", "descriptors"],
    programUrl: "https://blog.summerofbitcoin.org/summer-of-bitcoin-2026-announcing-the-next-generation-of-bitcoin-builders/",
    repositories: [{ label: "BDK", url: "https://github.com/bitcoindevkit/bdk" }],
  },
  {
    id: "sob-2026-bitcoin-core",
    name: "Bitcoin Core",
    description: "The reference Bitcoin full-node implementation and its surrounding development ecosystem.",
    category: "Protocol infrastructure",
    technologies: ["c++", "python", "bitcoin"],
    topics: ["consensus", "p2p", "wallet"],
    programUrl: "https://blog.summerofbitcoin.org/summer-of-bitcoin-2026-announcing-the-next-generation-of-bitcoin-builders/",
    repositories: [{ label: "Bitcoin Core", url: "https://github.com/bitcoin/bitcoin" }],
  },
  {
    id: "sob-2026-bitcoin-design",
    name: "Bitcoin Design",
    description: "Open design resources and collaboration for non-custodial Bitcoin products.",
    category: "Design",
    technologies: ["design", "web", "documentation"],
    topics: ["ux", "wallets", "design systems"],
    programUrl: "https://blog.summerofbitcoin.org/summer-of-bitcoin-2026-announcing-the-next-generation-of-bitcoin-builders/",
    repositories: [{ label: "Bitcoin Design Guide", url: "https://github.com/BitcoinDesign/Guide" }],
  },
  {
    id: "sob-2026-bitcoin-fuzz",
    name: "Bitcoin-Fuzz",
    description: "Differential fuzzing infrastructure for Bitcoin protocol implementations and libraries.",
    category: "Testing and security",
    technologies: ["c++", "fuzzing", "bitcoin"],
    topics: ["security", "testing"],
    programUrl: "https://blog.summerofbitcoin.org/summer-of-bitcoin-2026-announcing-the-next-generation-of-bitcoin-builders/",
    repositories: [{ label: "bitcoinfuzz", url: "https://github.com/bitcoinfuzz/bitcoinfuzz" }],
  },
  {
    id: "sob-2026-braidpool",
    name: "Braidpool",
    description: "A peer-to-peer Bitcoin mining pool focused on decentralizing pool infrastructure.",
    category: "Mining",
    technologies: ["rust", "python", "bitcoin"],
    topics: ["mining", "p2p"],
    programUrl: "https://blog.summerofbitcoin.org/summer-of-bitcoin-2026-announcing-the-next-generation-of-bitcoin-builders/",
    repositories: [{ label: "Braidpool", url: "https://github.com/braidpool/braidpool" }],
  },
  {
    id: "sob-2026-coinswap",
    name: "Coinswap",
    description: "Privacy-oriented Bitcoin CoinSwap implementation and supporting protocol work.",
    category: "Privacy",
    technologies: ["rust", "bitcoin"],
    topics: ["coinswap", "privacy"],
    programUrl: "https://blog.summerofbitcoin.org/summer-of-bitcoin-2026-announcing-the-next-generation-of-bitcoin-builders/",
    repositories: [{ label: "Teleport transactions", url: "https://github.com/bitcoin-teleport/teleport-transactions" }],
  },
  {
    id: "sob-2026-contextvm",
    name: "ContextVM",
    description: "Protocol and SDK work at the intersection of Nostr and Model Context Protocol.",
    category: "Nostr and developer tooling",
    technologies: ["typescript", "nostr", "mcp"],
    topics: ["agents", "protocols"],
    programUrl: "https://blog.summerofbitcoin.org/summer-of-bitcoin-2026-announcing-the-next-generation-of-bitcoin-builders/",
    repositories: [{ label: "ContextVM SDK", url: "https://github.com/ContextVM/sdk" }],
  },
  {
    id: "sob-2026-cove",
    name: "Cove",
    description: "A modern Bitcoin mobile wallet with hardware-wallet and self-custody support.",
    category: "Wallets",
    technologies: ["swift", "kotlin", "rust"],
    topics: ["wallets", "hardware wallets"],
    programUrl: "https://blog.summerofbitcoin.org/summer-of-bitcoin-2026-announcing-the-next-generation-of-bitcoin-builders/",
    repositories: [{ label: "Cove", url: "https://github.com/bitcoinppl/cove" }],
  },
  {
    id: "sob-2026-demand",
    name: "Demand",
    description: "Open-source Stratum V2 mining-pool infrastructure and miner-facing tooling.",
    category: "Mining",
    technologies: ["typescript", "rust", "stratum v2"],
    topics: ["mining", "dashboard"],
    programUrl: "https://blog.summerofbitcoin.org/summer-of-bitcoin-2026-announcing-the-next-generation-of-bitcoin-builders/",
    repositories: [{ label: "SV2 UI", url: "https://github.com/dmnd-pool/sv2-ui" }],
  },
  {
    id: "sob-2026-fedimint",
    name: "Fedimint",
    description: "Federated applications and e-cash infrastructure built around Bitcoin and Lightning.",
    category: "Payments",
    technologies: ["rust", "bitcoin", "lightning"],
    topics: ["ecash", "federations"],
    programUrl: "https://blog.summerofbitcoin.org/summer-of-bitcoin-2026-announcing-the-next-generation-of-bitcoin-builders/",
    repositories: [{ label: "Fedimint", url: "https://github.com/fedimint/fedimint" }],
  },
  {
    id: "sob-2026-floresta",
    name: "Floresta",
    description: "A lightweight and embeddable Bitcoin client focused on validation and sovereignty.",
    category: "Protocol infrastructure",
    technologies: ["rust", "bitcoin"],
    topics: ["utreexo", "validation"],
    programUrl: "https://blog.summerofbitcoin.org/summer-of-bitcoin-2026-announcing-the-next-generation-of-bitcoin-builders/",
    repositories: [{ label: "Floresta", url: "https://github.com/getfloresta/Floresta" }],
  },
  {
    id: "sob-2026-flotilla",
    name: "Flotilla",
    description: "A Nostr relay-based communities and group-chat application.",
    category: "Nostr applications",
    technologies: ["typescript", "nostr", "pwa"],
    topics: ["communities", "messaging"],
    programUrl: "https://blog.summerofbitcoin.org/summer-of-bitcoin-2026-announcing-the-next-generation-of-bitcoin-builders/",
    repositories: [{ label: "Current source", url: "https://gitea.coracle.social/coracle/flotilla" }],
  },
  {
    id: "sob-2026-formstr",
    name: "Formstr",
    description: "Decentralized forms and related applications built on Nostr.",
    category: "Nostr applications",
    technologies: ["typescript", "react", "nostr"],
    topics: ["forms", "privacy"],
    programUrl: "https://blog.summerofbitcoin.org/summer-of-bitcoin-2026-announcing-the-next-generation-of-bitcoin-builders/",
    repositories: [{ label: "Nostr Forms", url: "https://github.com/formstr-hq/nostr-forms" }],
  },
  {
    id: "sob-2026-jam",
    name: "Jam",
    description: "A user-friendly web interface for JoinMarket and collaborative Bitcoin transactions.",
    category: "Privacy",
    technologies: ["typescript", "bitcoin", "web"],
    topics: ["joinmarket", "coinjoin"],
    programUrl: "https://blog.summerofbitcoin.org/summer-of-bitcoin-2026-announcing-the-next-generation-of-bitcoin-builders/",
    repositories: [{ label: "Jam", url: "https://github.com/joinmarket-webui/jam" }],
  },
  {
    id: "sob-2026-kern",
    name: "Kern",
    description: "Experimental air-gapped Bitcoin signing device built on ESP32-P4 hardware.",
    category: "Hardware wallets",
    technologies: ["c", "embedded", "bitcoin"],
    topics: ["signing", "hardware"],
    programUrl: "https://blog.summerofbitcoin.org/summer-of-bitcoin-2026-announcing-the-next-generation-of-bitcoin-builders/",
    repositories: [{ label: "Kern", url: "https://github.com/odudex/Kern" }],
  },
  {
    id: "sob-2026-krux",
    name: "Krux",
    description: "Open-source firmware for building air-gapped Bitcoin signing devices.",
    category: "Hardware wallets",
    technologies: ["python", "embedded", "bitcoin"],
    topics: ["signing", "self custody"],
    programUrl: "https://blog.summerofbitcoin.org/summer-of-bitcoin-2026-announcing-the-next-generation-of-bitcoin-builders/",
    repositories: [{ label: "Krux", url: "https://github.com/selfcustody/krux" }],
  },
  {
    id: "sob-2026-mostro",
    name: "Mostro",
    description: "Lightning-powered peer-to-peer Bitcoin exchange protocol built over Nostr.",
    category: "Bitcoin applications",
    technologies: ["rust", "nostr", "lightning"],
    topics: ["p2p exchange", "privacy"],
    programUrl: "https://blog.summerofbitcoin.org/summer-of-bitcoin-2026-announcing-the-next-generation-of-bitcoin-builders/",
    repositories: [{ label: "Mostro", url: "https://github.com/MostroP2P/mostro" }],
  },
  {
    id: "sob-2026-nostr-components",
    name: "Nostr Components",
    description: "Embeddable Nostr UI components for profiles, zaps, posts and other web experiences.",
    category: "Nostr developer tooling",
    technologies: ["typescript", "web components", "nostr"],
    topics: ["components", "zaps"],
    programUrl: "https://blog.summerofbitcoin.org/summer-of-bitcoin-2026-announcing-the-next-generation-of-bitcoin-builders/",
    repositories: [{ label: "Nostr Components", url: "https://github.com/saiy2k/nostr-components" }],
  },
  {
    id: "sob-2026-nostream",
    name: "Nostream",
    description: "A production-oriented Nostr relay implementation written in TypeScript.",
    category: "Nostr infrastructure",
    technologies: ["typescript", "postgresql", "redis"],
    topics: ["nostr", "relays"],
    programUrl: "https://blog.summerofbitcoin.org/summer-of-bitcoin-2026-announcing-the-next-generation-of-bitcoin-builders/",
    repositories: [{ label: "Nostream", url: "https://github.com/cameri/nostream" }],
  },
  {
    id: "sob-2026-seedsigner",
    name: "SeedSigner",
    description: "Open-source air-gapped signing software and hardware designs for Bitcoin self custody.",
    category: "Hardware wallets",
    technologies: ["python", "embedded", "bitcoin"],
    topics: ["signing", "multisig"],
    programUrl: "https://blog.summerofbitcoin.org/summer-of-bitcoin-2026-announcing-the-next-generation-of-bitcoin-builders/",
    repositories: [{ label: "SeedSigner", url: "https://github.com/SeedSigner/seedsigner" }],
  },
  {
    id: "sob-2026-shopstr",
    name: "Shopstr",
    description: "A permissionless Nostr marketplace for Bitcoin commerce.",
    category: "Bitcoin applications",
    technologies: ["typescript", "next.js", "nostr"],
    topics: ["commerce", "marketplace"],
    programUrl: "https://blog.summerofbitcoin.org/summer-of-bitcoin-2026-announcing-the-next-generation-of-bitcoin-builders/",
    repositories: [{ label: "Shopstr", url: "https://github.com/shopstr-eng/shopstr" }],
  },
  {
    id: "sob-2026-smite",
    name: "smite",
    description: "Coverage-guided snapshot fuzzing for Bitcoin Lightning Network implementations.",
    category: "Testing and security",
    technologies: ["rust", "fuzzing", "lightning"],
    topics: ["security", "testing"],
    programUrl: "https://blog.summerofbitcoin.org/summer-of-bitcoin-2026-announcing-the-next-generation-of-bitcoin-builders/",
    repositories: [{ label: "smite", url: "https://github.com/lnfuzz/smite" }],
  },
  {
    id: "sob-2026-stable-channels",
    name: "Stable Channels",
    description: "Self-custodial synthetic-dollar balances built on the Bitcoin Lightning Network.",
    category: "Lightning applications",
    technologies: ["rust", "lightning", "bitcoin"],
    topics: ["payments", "stability"],
    programUrl: "https://blog.summerofbitcoin.org/summer-of-bitcoin-2026-announcing-the-next-generation-of-bitcoin-builders/",
    repositories: [{ label: "Stable Channels", url: "https://github.com/toneloc/stable-channels" }],
  },
  {
    id: "sob-2026-strfry",
    name: "strfry",
    description: "A high-performance relay implementation for the Nostr protocol.",
    category: "Nostr infrastructure",
    technologies: ["c++", "lmdb", "nostr"],
    topics: ["relays", "protocol"],
    programUrl: "https://blog.summerofbitcoin.org/summer-of-bitcoin-2026-announcing-the-next-generation-of-bitcoin-builders/",
    repositories: [{ label: "strfry", url: "https://github.com/hoytech/strfry" }],
  },
  {
    id: "sob-2026-vls",
    name: "VLS",
    description: "Validating Lightning Signer isolates signing keys from Lightning node software.",
    category: "Lightning infrastructure",
    technologies: ["rust", "lightning", "security"],
    topics: ["signing", "key isolation"],
    programUrl: "https://blog.summerofbitcoin.org/summer-of-bitcoin-2026-announcing-the-next-generation-of-bitcoin-builders/",
    repositories: [{ label: "Validating Lightning Signer", url: "https://gitlab.com/lightning-signer/validating-lightning-signer" }],
  },
];

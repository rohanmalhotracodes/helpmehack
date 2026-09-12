export type CatalogTier = "beginner" | "moderate" | "high-impact";

export type RepositoryCatalogEntry = {
  repo: string;
  tier: CatalogTier;
  /** The public GitHub label used for discovery. */
  label: string;
};

// This is deliberately curated. Discovery searches these repositories for live
// issues; inclusion here never guarantees that a repository currently has a
// startable issue.
export const REPOSITORY_CATALOG: RepositoryCatalogEntry[] = [
  { repo: "oppia/oppia", tier: "beginner", label: "good first issue" },
  { repo: "zulip/zulip", tier: "beginner", label: "good first issue" },
  { repo: "publiclab/plots2", tier: "beginner", label: "first-timers-only" },
  { repo: "pallets/flask", tier: "beginner", label: "good first issue" },
  { repo: "pallets/click", tier: "beginner", label: "good first issue" },
  { repo: "jupyterlab/jupyterlab", tier: "beginner", label: "good first issue" },
  { repo: "storybookjs/storybook", tier: "beginner", label: "good first issue" },
  { repo: "processing/p5.js", tier: "beginner", label: "good first issue" },
  { repo: "openfoodfacts/openfoodfacts-server", tier: "beginner", label: "good first issue" },
  { repo: "Submitty/Submitty", tier: "beginner", label: "good first issue" },
  { repo: "refined-github/refined-github", tier: "beginner", label: "help wanted" },
  { repo: "kubernetes/website", tier: "beginner", label: "good first issue" },
  { repo: "freeCodeCamp/freeCodeCamp", tier: "beginner", label: "first timers only" },
  { repo: "open-telemetry/opentelemetry.io", tier: "beginner", label: "good first issue" },
  { repo: "godotengine/godot-docs", tier: "beginner", label: "good first issue" },
  { repo: "OWASP/www-project-juice-shop", tier: "beginner", label: "good first issue" },
  { repo: "mozilla-mobile/firefox-android", tier: "beginner", label: "good first issue" },
  { repo: "mdn/content", tier: "beginner", label: "good first issue" },
  { repo: "github/docs", tier: "beginner", label: "good first issue" },
  { repo: "withastro/astro", tier: "beginner", label: "good first issue" },
  { repo: "sveltejs/svelte", tier: "beginner", label: "good first issue" },
  { repo: "prisma/prisma", tier: "beginner", label: "good first issue" },
  { repo: "tauri-apps/tauri", tier: "beginner", label: "good first issue" },
  { repo: "bevyengine/bevy", tier: "beginner", label: "good first issue" },
  { repo: "astral-sh/ruff", tier: "beginner", label: "good first issue" },
  { repo: "microsoft/PowerToys", tier: "beginner", label: "good first issue" },

  { repo: "makeplane/plane", tier: "moderate", label: "help wanted" },
  { repo: "zulip/zulip", tier: "moderate", label: "help wanted" },
  { repo: "mattermost/mattermost", tier: "moderate", label: "help wanted" },
  { repo: "calcom/cal.com", tier: "moderate", label: "help wanted" },
  { repo: "appwrite/appwrite", tier: "moderate", label: "help wanted" },
  { repo: "directus/directus", tier: "moderate", label: "help wanted" },
  { repo: "nocodb/nocodb", tier: "moderate", label: "help wanted" },
  { repo: "twentyhq/twenty", tier: "moderate", label: "help wanted" },
  { repo: "RocketChat/Rocket.Chat", tier: "moderate", label: "help wanted" },
  { repo: "ToolJet/ToolJet", tier: "moderate", label: "help wanted" },
  { repo: "hoppscotch/hoppscotch", tier: "moderate", label: "help wanted" },
  { repo: "apache/superset", tier: "moderate", label: "help wanted" },
  { repo: "pandas-dev/pandas", tier: "moderate", label: "help wanted" },
  { repo: "scikit-learn/scikit-learn", tier: "moderate", label: "help wanted" },
  { repo: "pydantic/pydantic", tier: "moderate", label: "help wanted" },
  { repo: "fastapi/fastapi", tier: "moderate", label: "help wanted" },
  { repo: "home-assistant/core", tier: "moderate", label: "help wanted" },
  { repo: "grafana/grafana", tier: "moderate", label: "help wanted" },
  { repo: "apache/airflow", tier: "moderate", label: "good first issue" },
  { repo: "ansible/ansible", tier: "moderate", label: "help wanted" },
  { repo: "microsoft/TypeScript", tier: "moderate", label: "help wanted" },
  { repo: "angular/angular", tier: "moderate", label: "help wanted" },
  { repo: "denoland/deno", tier: "moderate", label: "help wanted" },
  { repo: "pnpm/pnpm", tier: "moderate", label: "help wanted" },
  { repo: "sveltejs/svelte", tier: "moderate", label: "help wanted" },
  { repo: "astral-sh/ruff", tier: "moderate", label: "help wanted" },
  { repo: "astral-sh/uv", tier: "moderate", label: "help wanted" },
  { repo: "vitejs/vite", tier: "moderate", label: "contribution welcome" },
  { repo: "vuejs/core", tier: "moderate", label: "contribution welcome" },

  { repo: "microsoft/vscode", tier: "high-impact", label: "help wanted" },
  { repo: "kubernetes/kubernetes", tier: "high-impact", label: "help wanted" },
  { repo: "flutter/flutter", tier: "high-impact", label: "help wanted" },
  { repo: "facebook/react", tier: "high-impact", label: "help wanted" },
  { repo: "facebook/react-native", tier: "high-impact", label: "help wanted" },
  { repo: "nodejs/node", tier: "high-impact", label: "help wanted" },
  { repo: "rust-lang/rust", tier: "high-impact", label: "E-help-wanted" },
  { repo: "godotengine/godot", tier: "high-impact", label: "help wanted" },
  { repo: "tensorflow/tensorflow", tier: "high-impact", label: "contributions welcome" },
  { repo: "pytorch/pytorch", tier: "high-impact", label: "open for contributions" },
  { repo: "llvm/llvm-project", tier: "high-impact", label: "good first issue" },
  { repo: "moby/moby", tier: "high-impact", label: "help wanted" },
  { repo: "django/django", tier: "high-impact", label: "easy pickings" },
  { repo: "python/cpython", tier: "high-impact", label: "easy" },
  { repo: "dotnet/runtime", tier: "high-impact", label: "help wanted" },
  { repo: "vercel/next.js", tier: "high-impact", label: "help wanted" },
  { repo: "apache/airflow", tier: "high-impact", label: "good first issue" },
  { repo: "grafana/grafana", tier: "high-impact", label: "help wanted" },
  { repo: "home-assistant/core", tier: "high-impact", label: "help wanted" },
  { repo: "opencv/opencv", tier: "high-impact", label: "good first issue" },
  { repo: "electron/electron", tier: "high-impact", label: "help wanted" },
  { repo: "golang/go", tier: "high-impact", label: "help wanted" },
  { repo: "prometheus/prometheus", tier: "high-impact", label: "help wanted" },
  { repo: "elastic/elasticsearch", tier: "high-impact", label: "help wanted" },
  { repo: "hashicorp/terraform", tier: "high-impact", label: "help wanted" },
  { repo: "microsoft/TypeScript", tier: "high-impact", label: "help wanted" },
  { repo: "angular/angular", tier: "high-impact", label: "help wanted" },
  { repo: "bitcoin/bitcoin", tier: "high-impact", label: "good first issue" },
  { repo: "neovim/neovim", tier: "high-impact", label: "help wanted" },
  { repo: "systemd/systemd", tier: "high-impact", label: "help wanted" },
  { repo: "apache/spark", tier: "high-impact", label: "pull-request-available" },
];

export type CatalogSearchGroup = {
  tier: CatalogTier;
  label: string;
  repositories: string[];
};

export function buildCatalogSearchGroups(entries: RepositoryCatalogEntry[], groupSize = 5): CatalogSearchGroup[] {
  const byTierAndLabel = new Map<string, RepositoryCatalogEntry[]>();
  for (const entry of entries) {
    const key = `${entry.tier}\u0000${entry.label.toLowerCase()}`;
    byTierAndLabel.set(key, [...(byTierAndLabel.get(key) ?? []), entry]);
  }
  return [...byTierAndLabel.values()].flatMap((group) => {
    const result: CatalogSearchGroup[] = [];
    for (let index = 0; index < group.length; index += groupSize) {
      result.push({ tier: group[0].tier, label: group[0].label, repositories: group.slice(index, index + groupSize).map((entry) => entry.repo) });
    }
    return result;
  });
}

export function isCatalogRepository(repo: string, entries = REPOSITORY_CATALOG) {
  return entries.some((entry) => entry.repo.toLowerCase() === repo.toLowerCase());
}

export function labelsForCatalogRepository(repo: string, entries = REPOSITORY_CATALOG) {
  return [...new Set(entries.filter((entry) => entry.repo.toLowerCase() === repo.toLowerCase()).map((entry) => entry.label))];
}

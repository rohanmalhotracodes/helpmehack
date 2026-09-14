import { createSign } from "node:crypto";

const API_ROOT = "https://api.github.com";
const API_VERSION = "2026-03-10";
const TOKEN_REFRESH_SKEW_MS = 5 * 60_000;

type InstallationTokenResponse = {
  token?: string;
  expires_at?: string;
};

let cachedInstallationToken: { token: string; expiresAt: number } | undefined;
let cachedInstallationId: string | undefined;
let installationTokenPromise: Promise<string> | undefined;
let appExchangeBackoffUntil = 0;
let activeAuthentication: "app" | "discovery-token" | "token" | "public" | undefined;

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function appCredentials() {
  const appId = process.env.GITHUB_APP_ID?.trim();
  const encodedKey = process.env.GITHUB_APP_PRIVATE_KEY_BASE64?.trim();
  const plainKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  let privateKey = plainKey;
  if (!privateKey && encodedKey) {
    try {
      privateKey = Buffer.from(encodedKey, "base64").toString("utf8").trim();
    } catch {
      privateKey = undefined;
    }
  }
  return appId && privateKey ? { appId, privateKey } : null;
}

export function hasGitHubAppCredentials() {
  return Boolean(appCredentials());
}

export function hasGitHubAuthentication() {
  return hasGitHubAppCredentials() || Boolean(process.env.GITHUB_DISCOVERY_TOKEN?.trim()) || Boolean(process.env.GITHUB_TOKEN?.trim());
}

export function githubAuthenticationLabel() {
  if (activeAuthentication === "app" || (!activeAuthentication && hasGitHubAppCredentials() && !process.env.GITHUB_DISCOVERY_TOKEN?.trim())) return "GitHub App installation";
  if (activeAuthentication === "discovery-token" || activeAuthentication === "token" || process.env.GITHUB_DISCOVERY_TOKEN?.trim() || process.env.GITHUB_TOKEN?.trim()) return "GitHub REST API · authenticated";
  return "GitHub REST API · public access";
}

export function createGitHubAppJwt(now = Date.now()) {
  const credentials = appCredentials();
  if (!credentials) throw new Error("GitHub App credentials are incomplete.");
  const issuedAt = Math.floor(now / 1000) - 60;
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({ iat: issuedAt, exp: issuedAt + 9 * 60, iss: credentials.appId }));
  const unsignedToken = `${header}.${payload}`;
  const signature = createSign("RSA-SHA256").update(unsignedToken).sign(credentials.privateKey);
  return `${unsignedToken}.${base64Url(signature)}`;
}

async function createInstallationToken(fetcher: typeof fetch) {
  const credentials = appCredentials();
  if (!credentials) throw new Error("GitHub App credentials are incomplete.");
  const installationId = await resolveInstallationId(fetcher);
  const response = await fetcher(`${API_ROOT}/app/installations/${installationId}/access_tokens`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${createGitHubAppJwt()}`,
      "X-GitHub-Api-Version": API_VERSION,
      "User-Agent": "helpmehack.com",
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`GitHub App token exchange returned ${response.status}.`);
  const body = await response.json() as InstallationTokenResponse;
  const expiresAt = body.expires_at ? Date.parse(body.expires_at) : Number.NaN;
  if (!body.token || !Number.isFinite(expiresAt)) throw new Error("GitHub App token exchange returned an invalid response.");
  cachedInstallationToken = { token: body.token, expiresAt };
  return body.token;
}

async function resolveInstallationId(fetcher: typeof fetch) {
  const configured = process.env.GITHUB_APP_INSTALLATION_ID?.trim();
  if (configured) return configured;
  if (cachedInstallationId) return cachedInstallationId;
  const response = await fetcher(`${API_ROOT}/app/installations?per_page=100`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${createGitHubAppJwt()}`,
      "X-GitHub-Api-Version": API_VERSION,
      "User-Agent": "helpmehack.com",
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`GitHub App installation lookup returned ${response.status}.`);
  const installations = await response.json() as Array<{ id?: number }>;
  const ids = installations.map((installation) => installation.id).filter((id): id is number => Number.isInteger(id));
  if (ids.length !== 1) {
    throw new Error(ids.length ? "Multiple GitHub App installations were found; configure GITHUB_APP_INSTALLATION_ID." : "No GitHub App installation was found for these credentials.");
  }
  cachedInstallationId = String(ids[0]);
  return cachedInstallationId;
}

export async function githubAuthorization(fetcher: typeof fetch = fetch, forceRefresh = false) {
  const discoveryToken = process.env.GITHUB_DISCOVERY_TOKEN?.trim();
  if (discoveryToken) {
    activeAuthentication = "discovery-token";
    return `Bearer ${discoveryToken}`;
  }
  if (hasGitHubAppCredentials()) {
    if (forceRefresh) {
      cachedInstallationToken = undefined;
      appExchangeBackoffUntil = 0;
    }
    if (cachedInstallationToken && Date.now() < cachedInstallationToken.expiresAt - TOKEN_REFRESH_SKEW_MS) {
      activeAuthentication = "app";
      return `Bearer ${cachedInstallationToken.token}`;
    }
    const fallback = process.env.GITHUB_TOKEN?.trim();
    if (fallback && Date.now() < appExchangeBackoffUntil) {
      activeAuthentication = "token";
      return `Bearer ${fallback}`;
    }
    try {
      installationTokenPromise ??= createInstallationToken(fetcher).finally(() => { installationTokenPromise = undefined; });
      const token = await installationTokenPromise;
      activeAuthentication = "app";
      return `Bearer ${token}`;
    } catch (error) {
      if (fallback) {
        appExchangeBackoffUntil = Date.now() + 5 * 60_000;
        activeAuthentication = "token";
        return `Bearer ${fallback}`;
      }
      throw error;
    }
  }
  const token = process.env.GITHUB_TOKEN?.trim();
  activeAuthentication = token ? "token" : "public";
  return token ? `Bearer ${token}` : undefined;
}

export function resetGitHubAppTokenCacheForTests() {
  cachedInstallationToken = undefined;
  cachedInstallationId = undefined;
  installationTokenPromise = undefined;
  appExchangeBackoffUntil = 0;
  activeAuthentication = undefined;
}

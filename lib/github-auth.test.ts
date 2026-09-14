import { generateKeyPairSync } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createGitHubAppJwt, githubAuthenticationLabel, githubAuthorization, resetGitHubAppTokenCacheForTests } from "./github-auth";

const original = {
  appId: process.env.GITHUB_APP_ID,
  installationId: process.env.GITHUB_APP_INSTALLATION_ID,
  privateKey: process.env.GITHUB_APP_PRIVATE_KEY,
  privateKeyBase64: process.env.GITHUB_APP_PRIVATE_KEY_BASE64,
  discoveryToken: process.env.GITHUB_DISCOVERY_TOKEN,
  token: process.env.GITHUB_TOKEN,
};

function configureApp(withInstallationId = true) {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
  process.env.GITHUB_APP_ID = "12345";
  if (withInstallationId) process.env.GITHUB_APP_INSTALLATION_ID = "67890";
  else delete process.env.GITHUB_APP_INSTALLATION_ID;
  process.env.GITHUB_APP_PRIVATE_KEY_BASE64 = Buffer.from(privateKey).toString("base64");
  delete process.env.GITHUB_APP_PRIVATE_KEY;
}

afterEach(() => {
  const restore = (key: string, value: string | undefined) => { if (value === undefined) delete process.env[key]; else process.env[key] = value; };
  restore("GITHUB_APP_ID", original.appId);
  restore("GITHUB_APP_INSTALLATION_ID", original.installationId);
  restore("GITHUB_APP_PRIVATE_KEY", original.privateKey);
  restore("GITHUB_APP_PRIVATE_KEY_BASE64", original.privateKeyBase64);
  restore("GITHUB_DISCOVERY_TOKEN", original.discoveryToken);
  restore("GITHUB_TOKEN", original.token);
  resetGitHubAppTokenCacheForTests();
});

describe("GitHub App authentication", () => {
  it("prefers an explicitly configured discovery-token alternative", async () => {
    configureApp();
    process.env.GITHUB_DISCOVERY_TOKEN = "discovery-token";
    const fetcher = vi.fn();

    await expect(githubAuthorization(fetcher as typeof fetch)).resolves.toBe("Bearer discovery-token");
    expect(fetcher).not.toHaveBeenCalled();
    expect(githubAuthenticationLabel()).toBe("GitHub REST API · authenticated");
  });

  it("creates a short-lived RS256 app JWT", () => {
    configureApp();
    const now = Date.parse("2026-09-13T00:00:00Z");
    const jwt = createGitHubAppJwt(now);
    const [header, payload, signature] = jwt.split(".");
    expect(JSON.parse(Buffer.from(header, "base64url").toString())).toMatchObject({ alg: "RS256", typ: "JWT" });
    expect(JSON.parse(Buffer.from(payload, "base64url").toString())).toMatchObject({ iss: "12345", iat: Math.floor(now / 1000) - 60, exp: Math.floor(now / 1000) + 480 });
    expect(signature.length).toBeGreaterThan(100);
  });

  it("exchanges once and reuses the installation token", async () => {
    configureApp();
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ token: "ghs_test", expires_at: new Date(Date.now() + 60 * 60_000).toISOString() }), { status: 201, headers: { "Content-Type": "application/json" } }));
    await expect(githubAuthorization(fetcher as typeof fetch)).resolves.toBe("Bearer ghs_test");
    await expect(githubAuthorization(fetcher as typeof fetch)).resolves.toBe("Bearer ghs_test");
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("discovers a single installation when no installation ID is configured", async () => {
    configureApp(false);
    const fetcher = vi.fn(async (input: string | URL | Request) => String(input).includes("/app/installations?")
      ? new Response(JSON.stringify([{ id: 24680 }]), { status: 200, headers: { "Content-Type": "application/json" } })
      : new Response(JSON.stringify({ token: "ghs_discovered", expires_at: new Date(Date.now() + 60 * 60_000).toISOString() }), { status: 201, headers: { "Content-Type": "application/json" } }));
    await expect(githubAuthorization(fetcher as typeof fetch)).resolves.toBe("Bearer ghs_discovered");
    expect(fetcher.mock.calls.map(([input]) => String(input))).toEqual([
      "https://api.github.com/app/installations?per_page=100",
      "https://api.github.com/app/installations/24680/access_tokens",
    ]);
  });

  it("falls back to the server personal token if app exchange fails", async () => {
    configureApp();
    process.env.GITHUB_TOKEN = "fallback-token";
    const fetcher = vi.fn(async () => new Response(null, { status: 401 }));
    await expect(githubAuthorization(fetcher as typeof fetch)).resolves.toBe("Bearer fallback-token");
    await expect(githubAuthorization(fetcher as typeof fetch)).resolves.toBe("Bearer fallback-token");
    expect(fetcher).toHaveBeenCalledOnce();
    expect(githubAuthenticationLabel()).toBe("GitHub REST API · authenticated");
  });
});

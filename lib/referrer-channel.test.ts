import { describe, expect, it } from "vitest";
import { classifyReferrer } from "./referrer-channel";

describe("referral classification", () => {
  it.each(["chatgpt.com", "chat.openai.com", "claude.ai", "www.perplexity.ai", "gemini.google.com", "copilot.microsoft.com"])("recognizes %s without saving its private path", host => {
    expect(classifyReferrer(`https://${host}/private?prompt=secret`, "", "example.com")).toBe("ai");
  });
  it("accepts only the bounded ChatGPT campaign marker", () => {
    expect(classifyReferrer("", "?utm_source=chatgpt.com&private=secret", "example.com")).toBe("ai");
    expect(classifyReferrer("", "?utm_source=private", "example.com")).toBe("direct");
  });
  it("rejects spoofed hosts and invalid referrers", () => {
    expect(classifyReferrer("https://chatgpt.com.evil.test", "", "example.com")).toBe("referral");
    expect(classifyReferrer("not a URL", "", "example.com")).toBe("unknown");
    expect(classifyReferrer("https://www.google.com/search?q=secret", "", "example.com")).toBe("search");
    expect(classifyReferrer("https://example.com/guide", "", "example.com")).toBe("direct");
  });
});

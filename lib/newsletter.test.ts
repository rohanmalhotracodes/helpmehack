import { describe, expect, it } from "vitest";
import { isValidNewsletterEmail } from "./newsletter";

describe("newsletter email validation", () => {
  it("accepts a normal email address", () => expect(isValidNewsletterEmail("dev@example.com")).toBe(true));
  it("rejects missing domains and non-string values", () => {
    expect(isValidNewsletterEmail("dev@localhost")).toBe(false);
    expect(isValidNewsletterEmail(null)).toBe(false);
  });
});

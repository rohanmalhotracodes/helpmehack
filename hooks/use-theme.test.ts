import { describe, expect, it } from "vitest";
import { themeForLocalTime } from "./use-theme";

describe("themeForLocalTime", () => {
  it("uses light mode from 7:00 through 18:59 in the user's local time", () => {
    expect(themeForLocalTime(new Date(2026, 8, 13, 7, 0))).toBe("light");
    expect(themeForLocalTime(new Date(2026, 8, 13, 18, 59))).toBe("light");
  });

  it("uses dark mode overnight", () => {
    expect(themeForLocalTime(new Date(2026, 8, 13, 6, 59))).toBe("dark");
    expect(themeForLocalTime(new Date(2026, 8, 13, 19, 0))).toBe("dark");
  });
});

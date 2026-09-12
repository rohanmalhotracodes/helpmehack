import { describe, expect, it } from "vitest";
import { isPotentiallyStartable, statusMeta } from "./status";

describe("availability status", () => {
  it("keeps all honesty states distinct", () => {
    expect(Object.values(statusMeta).map((value) => value.label)).toHaveLength(7);
    expect(statusMeta.unassigned.label).not.toBe(statusMeta["possibly-claimed"].label);
  });

  it("does not treat linked, blocked, closed, or stale issues as startable", () => {
    expect(isPotentiallyStartable("unassigned")).toBe(true);
    expect(isPotentiallyStartable("ask-first")).toBe(true);
    expect(isPotentiallyStartable("linked-pr")).toBe(false);
    expect(isPotentiallyStartable("blocked")).toBe(false);
    expect(isPotentiallyStartable("closed")).toBe(false);
    expect(isPotentiallyStartable("unknown")).toBe(false);
  });
});

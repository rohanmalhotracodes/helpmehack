import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useLocalList } from "./use-local-list";

describe("useLocalList", () => {
  beforeEach(() => localStorage.clear());

  it("adds, removes, and persists saved ids", async () => {
    const { result } = renderHook(() => useLocalList("test:saved"));
    await waitFor(() => expect(result.current.ready).toBe(true));
    act(() => result.current.toggle("issue-1"));
    expect(result.current.items).toEqual(["issue-1"]);
    await waitFor(() => expect(JSON.parse(localStorage.getItem("test:saved") ?? "[]")).toEqual(["issue-1"]));
    act(() => result.current.toggle("issue-1"));
    expect(result.current.items).toEqual([]);
  });
});

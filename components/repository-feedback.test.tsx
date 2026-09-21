import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { trackFunnel } from "@/lib/analytics";
import { RepositoryFeedback } from "./repository-feedback";
vi.mock("@/lib/analytics", () => ({ trackFunnel: vi.fn() }));
beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); });
afterEach(cleanup);
describe("optional repository feedback", () => {
  it("requires a choice, bounds comments, excludes replay, and prevents repeat submissions", () => {
    vi.mocked(trackFunnel).mockReturnValue(true);
    const { unmount } = render(<RepositoryFeedback repository="test/feedback" />);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    fireEvent.submit(screen.getByRole("form"));
    expect(trackFunnel).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Helpful" }));
    const input = screen.getByRole("textbox");
    expect(input.closest(".ph-no-capture")).toBeTruthy();
    expect(input).toHaveAttribute("maxlength", "300");
    fireEvent.change(input, { target: { value: "x".repeat(350) } });
    fireEvent.submit(screen.getByRole("form"));
    expect(trackFunnel).toHaveBeenCalledExactlyOnceWith("feedback_submitted", { repository: "test/feedback", helpful: true, comment: "x".repeat(300) });
    expect(screen.getByRole("status")).toHaveTextContent("Thanks");
    unmount();
    render(<RepositoryFeedback repository="test/feedback" />);
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(trackFunnel).toHaveBeenCalledTimes(1);
  });
  it("keeps feedback editable when capture is unavailable", () => {
    vi.mocked(trackFunnel).mockReturnValue(false);
    render(<RepositoryFeedback repository="test/blocked" />);
    fireEvent.click(screen.getByRole("button", { name: "Not helpful" }));
    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));
    expect(screen.getByRole("status")).toHaveTextContent("unavailable");
    expect(sessionStorage.getItem("helpmehack:feedback:test/blocked")).toBeNull();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});

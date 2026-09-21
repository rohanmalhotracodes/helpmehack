import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { NewsletterSignup } from "./newsletter-signup";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("keeps signup disabled when no provider is configured", async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ configured: false }) });
  vi.stubGlobal("fetch", fetcher);
  render(<NewsletterSignup />);
  expect(screen.getByRole("button", { name: "Subscribe" })).toBeDisabled();
  await screen.findByText("Newsletter signup is not available yet.");
  expect(screen.getByRole("textbox", { name: "Email address" })).toBeDisabled();
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it("does not enable signup when its status request fails", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  render(<NewsletterSignup />);
  await screen.findByText(/Newsletter status could not be checked/);
  expect(screen.getByRole("button", { name: "Subscribe" })).toBeDisabled();
});

it("submits only after configuration is confirmed and shows provider errors", async () => {
  const fetcher = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ configured: true }) })
    .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Provider unavailable" }) });
  vi.stubGlobal("fetch", fetcher);
  render(<NewsletterSignup />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Subscribe" })).toBeEnabled());
  fireEvent.change(screen.getByRole("textbox", { name: "Email address" }), { target: { value: "test@example.com" } });
  fireEvent.submit(screen.getByRole("button", { name: "Subscribe" }).closest("form")!);
  await screen.findByText("Provider unavailable");
  expect(fetcher).toHaveBeenLastCalledWith("/api/newsletter", expect.objectContaining({ method: "POST", body: JSON.stringify({ email: "test@example.com" }) }));
  expect(screen.queryByText(/subscribed/i)).not.toBeInTheDocument();
});

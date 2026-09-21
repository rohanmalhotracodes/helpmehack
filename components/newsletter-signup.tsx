"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Check, Mail } from "lucide-react";

type State = "idle" | "submitting" | "success" | "error";

export function NewsletterSignup() {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  const [availability, setAvailability] = useState<"checking" | "ready" | "unavailable" | "error">("checking");
  useEffect(() => {
    let active = true;
    fetch("/api/newsletter", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Status unavailable");
        const body = await response.json() as { configured?: boolean };
        if (active) setAvailability(body.configured === true ? "ready" : "unavailable");
      })
      .catch(() => { if (active) setAvailability("error"); });
    return () => { active = false; };
  }, []);

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (availability !== "ready") return;
    const formElement = event.currentTarget;
    setState("submitting");
    setMessage("");
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email") }),
      });
      const body = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Subscription failed. Please try again.");
      setState("success");
      setMessage(body.message ?? "Your signup request was accepted.");
      formElement.reset();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Subscription failed. Please try again.");
    }
  }

  return (
    <section className="x-border mt-12 border-y py-9 sm:rounded-2xl sm:border sm:px-8 sm:py-10" aria-labelledby="newsletter-title">
      <div className="mx-auto max-w-3xl text-center">
        <span className="x-raised x-muted inline-flex h-9 w-9 items-center justify-center rounded-full"><Mail size={17} aria-hidden="true" /></span>
        <h2 id="newsletter-title" className="x-text mt-4 text-xl font-bold tracking-tight sm:text-2xl">Sign up for our newsletter.</h2>
        <p className="x-text mx-auto mt-2 max-w-xl text-sm leading-6">{availability === "ready" ? "Request open-source updates by email." : availability === "checking" ? "Checking newsletter availability…" : availability === "unavailable" ? "Newsletter signup is not available yet." : "Newsletter status could not be checked. Please try again later."}</p>
        {state === "success" ? (
          <div className="x-raised x-text mx-auto mt-5 inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-medium" role="status"><Check size={16} />{message}</div>
        ) : (
          <form onSubmit={subscribe} className="mx-auto mt-5 flex max-w-lg flex-col gap-2 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input id="newsletter-email" name="email" type="email" disabled={availability !== "ready"} autoComplete="email" required maxLength={254} placeholder="you@example.com" className="focus-ring placeholder-muted x-border x-text h-11 min-w-0 flex-1 rounded-full border bg-transparent px-4 text-sm" />
            <button disabled={state === "submitting" || availability !== "ready"} className="focus-ring x-primary inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold disabled:cursor-wait disabled:opacity-60">{state === "submitting" ? "Subscribing…" : "Subscribe"}<ArrowRight size={15} aria-hidden="true" /></button>
          </form>
        )}
        {state === "error" && <p className="mt-3 text-xs text-red-400" role="status" aria-live="polite">{message}</p>}
      </div>
    </section>
  );
}

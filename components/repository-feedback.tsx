"use client";

import { useRef, useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { trackFunnel } from "@/lib/analytics";

const submitted = new Set<string>();
function alreadySent(repository: string) {
  try { return submitted.has(repository) || sessionStorage.getItem(`helpmehack:feedback:${repository}`) === "sent"; }
  catch { return submitted.has(repository); }
}

export function RepositoryFeedback({ repository }: { repository: string }) {
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(() => alreadySent(repository));
  const [failed, setFailed] = useState(false);
  const sending = useRef(false);

  const reportUrl = `mailto:helpmehack@mail.tin.computer?subject=${encodeURIComponent(`helpmehack problem: ${repository}`)}&body=${encodeURIComponent(`Repository: ${repository}\n\nWhat were you trying to do?\n\nWhat went wrong?\n\nPlease remove any private information before sending.`)}`;
  const reportLink = <p className="x-muted mt-2 text-xs"><a className="focus-ring inline-flex min-h-11 items-center underline underline-offset-4" href={reportUrl}>Report a problem by email</a><span className="block">Opens your email app. Include what you tried and what went wrong.</span></p>;

  if (sent) return <div className="px-4 py-4 sm:px-6"><p role="status" className="x-muted text-xs">Thanks for your feedback.</p>{reportLink}</div>;
  return <form className="ph-no-capture x-border border-t px-4 py-4 sm:px-6" aria-label="Repository feedback" onSubmit={(event) => {
    event.preventDefault();
    if (helpful === null || sending.current || alreadySent(repository)) return;
    sending.current = true;
    const accepted = trackFunnel("feedback_submitted", { repository, helpful, ...(comment.trim() ? { comment: comment.trim().slice(0, 300) } : {}) });
    if (!accepted) { sending.current = false; setFailed(true); return; }
    submitted.add(repository);
    try { sessionStorage.setItem(`helpmehack:feedback:${repository}`, "sent"); } catch { /* Memory still prevents duplicates. */ }
    setComment("");
    setSent(true);
  }}>
    <div className="flex flex-wrap items-center gap-2">
      <p className="x-muted mr-auto text-xs">Did this help you choose?</p>
      {[true, false].map((value) => { const Icon = value ? ThumbsUp : ThumbsDown; return <button key={String(value)} type="button" aria-label={value ? "Helpful" : "Not helpful"} aria-pressed={helpful === value} onClick={() => { setHelpful(value); setFailed(false); }} className={`focus-ring x-border inline-flex min-h-11 items-center gap-2 rounded-full border px-3 text-xs hover:bg-[var(--surface-raised)] ${helpful === value ? "x-text" : "x-muted"}`}><Icon size={14} />{value ? "Yes" : "No"}</button>; })}
    </div>
    {helpful !== null && <div className="mt-3 max-w-lg">
      <label htmlFor="repository-feedback-comment" className="x-muted text-xs">Comment (optional). Don&apos;t include personal details.</label>
      <textarea id="repository-feedback-comment" className="ph-no-capture focus-ring x-border x-text mt-2 block w-full rounded-xl border bg-transparent p-3 text-sm" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={300} rows={2} />
      <div className="mt-2 flex items-center justify-between gap-3"><span className="x-muted text-[11px]">{comment.length}/300 · Sent to helpmehack via PostHog</span><button type="submit" className="focus-ring x-border x-text min-h-11 shrink-0 rounded-full border px-4 text-xs font-semibold hover:bg-[var(--surface-raised)]">Send feedback</button></div>
      {failed && <p role="status" className="x-muted mt-2 text-xs">Feedback is unavailable. You can keep browsing.</p>}
    </div>}
    {reportLink}
  </form>;
}

"use client";

import Link from "next/link";

export function SiteFooter({ onNavigate }: { onNavigate?: (view: "overlooked" | "open-source") => void }) {
  const linkClass = "focus-ring rounded px-1 py-1 font-medium transition-colors hover:text-[var(--text)]";
  return (
    <footer className="x-border mt-12 border-t" aria-label="Site footer">
      <div className="x-muted mx-auto flex max-w-[1240px] flex-col gap-3 px-5 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 HelpMeHack</p>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Footer navigation">
          <Link href="/about" className={linkClass}>About</Link>
          <a href="https://github.com/rohanmalhotracodes/helpmehack" target="_blank" rel="noreferrer" className={linkClass}>GitHub</a>
          <a href="mailto:helpmehack@mail.tin.computer" className={linkClass}>Contact</a>
          <Link href="/terms" className={linkClass}>Terms</Link>
          <Link href="/privacy" className={linkClass}>Privacy</Link>
        </nav>
      </div>
    </footer>
  );
}

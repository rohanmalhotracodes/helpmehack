"use client";

import Link from "next/link";
import Image from "next/image";

export function SiteFooter({ onNavigate }: { onNavigate?: (view: "overlooked" | "open-source") => void }) {
  const linkClass = "focus-ring rounded px-1 py-1 font-medium transition-colors hover:text-[var(--text)]";
  return (
    <footer className="x-border mt-12 border-t" aria-label="Site footer">
      <div className="x-muted mx-auto flex max-w-[1240px] flex-col items-center gap-4 px-5 py-7 text-xs sm:flex-row sm:justify-between">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Image src="/helpmehack-mark.png" width={24} height={24} alt="" className="logo-mark h-6 w-6 rounded-md" />
          <p>© 2026 HelpMeHack</p>
          <a href="https://tin.computer" className={`${linkClass} inline-flex items-center gap-1.5`}>
            <span aria-hidden="true" className="inline-block h-[1em] w-[1em] bg-[#66DC9D]" />
            Growth by Tin
          </a>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2" aria-label="Footer navigation">
          <Link href="/#feed" onClick={onNavigate ? (event) => { event.preventDefault(); onNavigate("overlooked"); } : undefined} className={linkClass}>Feed</Link>
          <Link href="/#open-source" onClick={onNavigate ? (event) => { event.preventDefault(); onNavigate("open-source"); } : undefined} className={linkClass}>Repos</Link>
          <Link href="/open-source-projects" className={linkClass}>Find a project</Link>
          <Link href="/contribute" className={linkClass}>Ways to contribute</Link>
          <a href="https://opensource.guide/how-to-contribute/" target="_blank" rel="noreferrer" className={linkClass}>Contributor guide</a>
          <a href="https://docs.github.com/en/rest" target="_blank" rel="noreferrer" className={linkClass}>GitHub data</a>
          <a href="https://github.com/rohanmalhotracodes/helpmehack" target="_blank" rel="noreferrer" className={linkClass}>Source code</a>
        </nav>
      </div>
    </footer>
  );
}


"use client";

import Link from "next/link";
import Image from "next/image";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { SiteFooter } from "./site-footer";

export function ContributionPageShell({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="app-theme min-h-screen" data-theme={theme}>
      <header className="x-border border-b">
        <div className="mx-auto flex min-h-[61px] max-w-[1240px] items-center justify-between gap-4 px-5">
          <Link href="/" className="focus-ring flex min-h-11 items-center gap-2 rounded-lg" aria-label="HelpMeHack home">
            <Image src="/helpmehack-mark.png" width={34} height={34} priority alt="" className="logo-mark rounded-lg" />
            <span className="text-sm font-bold">helpmehack</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/#feed" className="focus-ring x-muted inline-flex min-h-11 items-center rounded text-sm hover:text-[var(--text)]">Feed</Link>
            <button onClick={toggleTheme} className="focus-ring x-muted grid h-11 w-11 place-items-center rounded-full hover:bg-[var(--surface-raised)]" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>
      {children}
      <SiteFooter />
    </div>
  );
}

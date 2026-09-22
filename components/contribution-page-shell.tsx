"use client";

import Link from "next/link";
import Image from "next/image";
import { BookOpenText, GitFork, GraduationCap, Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/hooks/use-theme";
import { SiteFooter } from "./site-footer";

export function ContributionPageShell({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const programsActive = pathname.startsWith("/programs");

  return (
    <div className="app-theme min-h-screen" data-theme={theme}>
      <header className="x-border sticky top-0 z-30 border-b bg-[color:var(--background)]/95 backdrop-blur">
        <div className="mx-auto flex h-[61px] max-w-[1240px] items-center gap-4 px-3 sm:px-5">
          <Link href="/" className="focus-ring flex shrink-0 items-center gap-2 rounded-lg" aria-label="helpmehack home">
            <Image src="/helpmehack-mark.png" width={34} height={34} priority alt="" className="logo-mark h-[34px] w-[34px] rounded-lg" />
            <span className="x-text hidden text-sm font-bold tracking-tight sm:block">helpmehack</span>
          </Link>

          <nav className="ml-auto hidden h-full items-center gap-1 sm:flex" aria-label="Primary navigation">
            <HeaderLink href="/#feed" icon={BookOpenText}>Feed</HeaderLink>
            <HeaderLink href="/#open-source" icon={GitFork}>Repos</HeaderLink>
            <HeaderLink href="/programs" icon={GraduationCap} active={programsActive}>Programs</HeaderLink>
          </nav>

          <button onClick={toggleTheme} className="focus-ring x-muted ml-auto grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--surface-raised)] sm:ml-0" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      {children}
      <SiteFooter />
    </div>
  );
}

function HeaderLink({
  href,
  icon: Icon,
  active = false,
  children,
}: {
  href: string;
  icon: typeof GitFork;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`focus-ring relative flex h-full items-center gap-2 px-4 text-sm font-semibold ${active ? "x-text" : "x-muted hover:text-[var(--text)]"}`}
    >
      <Icon size={16} />
      {children}
      {active && <span className="absolute inset-x-3 bottom-0 h-1 rounded-full bg-current" />}
    </Link>
  );
}

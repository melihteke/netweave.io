'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Github } from 'lucide-react';

export function Header() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const active = (mounted ? (resolvedTheme ?? theme) : 'light') === 'dark' ? 'dark' : 'light';

  return (
    <header className="flex h-14 items-center justify-between border-b border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-4">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">NetWeave</span>
            <span className="text-[10px] muted">YAML → interactive network topology</span>
          </div>
        </Link>
      </div>
      <nav className="flex items-center gap-1 text-sm">
        <Link className="rounded-md px-2 py-1 hover:bg-[rgb(var(--border))]" href="/examples/">
          Examples
        </Link>
        <Link className="rounded-md px-2 py-1 hover:bg-[rgb(var(--border))]" href="/docs/">
          Docs
        </Link>
        <Link className="rounded-md px-2 py-1 hover:bg-[rgb(var(--border))]" href="/about/">
          About
        </Link>
        <button
          type="button"
          aria-label="Toggle theme"
          onClick={() => setTheme(active === 'dark' ? 'light' : 'dark')}
          className="ml-1 rounded-md p-2 hover:bg-[rgb(var(--border))]"
        >
          {active === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <a
          className="ml-0.5 rounded-md p-2 hover:bg-[rgb(var(--border))]"
          href="https://github.com/melihteke/yaml-to-topo-builder"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
        >
          <Github className="h-4 w-4" />
        </a>
      </nav>
    </header>
  );
}

function Logo() {
  return (
    <span
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
      style={{ background: 'linear-gradient(135deg,#5aa0ff,#1a4bb8)' }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor">
        <circle cx="5" cy="5" r="2" />
        <circle cx="19" cy="5" r="2" />
        <circle cx="12" cy="13" r="2" />
        <circle cx="5" cy="19" r="2" />
        <circle cx="19" cy="19" r="2" />
        <path
          d="M5 5 L12 13 L19 5 M12 13 L5 19 M12 13 L19 19"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

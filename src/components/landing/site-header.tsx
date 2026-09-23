"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/icons";

/**
 * The landing header.
 *
 * Transparent over the hero, then one line of definition once the page moves:
 * a paper wash, a hairline and a blur. The threshold is 12px, which is one
 * scroll tick, so the change reads as a response to intent rather than as a
 * timer.
 *
 * Awaiting a scroll listener inside rAF keeps the state flip off the main
 * thread's frame budget; the class itself is two properties, so the swap is
 * cheap to paint.
 */
export function SiteHeader() {
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      setLifted(window.scrollY > 12);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-40 transition-all duration-300 ease-[var(--ease-out)]",
        lifted
          ? "border-b border-line bg-paper/90 shadow-card backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      ].join(" ")}
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <Link href="/" className="tappable inline-flex items-center">
          <Logo size={30} />
        </Link>

        <div className="flex items-center gap-3">
          <nav aria-label="Sections" className="hidden items-center gap-5 lg:flex">
            <a
              href="#problem"
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              The problem
            </a>
            <a
              href="#how"
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              How it works
            </a>
            <a
              href="#foryou"
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              For you
            </a>
            <a
              href="#medals"
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              Medals
            </a>
            <a
              href="#faq"
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              FAQ
            </a>
          </nav>
          <Link
            href="/signin"
            className="tappable bg-accent-deep px-4 py-2 text-sm font-semibold text-white shadow-accent"
          >
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { prefersReducedMotion } from "@/lib/ui/motion";

/**
 * Scroll entrance for landing sections.
 *
 * Below the fold, sections hold 16px down and transparent until they enter the
 * viewport, then rise once. The hidden state is opt-in per element
 * (`data-shown="false"` in CSS) and only applied from JS after the first
 * paint, so a no-JS render is never blank and the hero, which never uses this
 * wrapper, is never hidden waiting for hydration.
 *
 * Anything already on screen at mount, and any reduced-motion visitor, gets
 * the settled state immediately with no transition.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  /** Seconds of stagger, mapped to --rise-delay. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // null = undetermined (server render / pre-effect), which CSS treats as
  // settled. "false" is the armed, hidden state set from the effect below.
  const [shown, setShown] = useState<boolean | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion() || el.getBoundingClientRect().top < window.innerHeight * 0.92) {
      setShown(true);
      return;
    }

    setShown(false);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      // Fire slightly before the section is actually reached, so the rise is
      // beginning as it arrives rather than after it has been stared at.
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-shown={shown === null ? undefined : shown ? "true" : "false"}
      className={`reveal${className ? ` ${className}` : ""}`}
      style={delay ? ({ ["--rise-delay" as string]: `${delay}s` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { BadgeTile, MedalTile } from "@/components/medal-tile";

/**
 * The landing's medal rail.
 *
 * The tiles rise in with the section, then each medal is struck in place:
 * the same strike-ring-ribbon-star sequence the app plays when a medal is
 * earned, staggered left to right so the row reads as being minted. After the
 * strike each medal settles into its idle hang and swings properly when
 * hovered, which is MedalTile's built-in behaviour.
 */

type Entry =
  | { kind: "badge"; key: string; title: string; subtitle: string; footnote?: string; earned?: boolean }
  | { kind: "milestone"; tier: "FOUNDATION" | "BRONZE" | "SILVER"; label: string; skill: string; footnote: string };

const MEDALS: Entry[] = [
  {
    kind: "milestone",
    tier: "BRONZE",
    label: "Elementary ≈ N5",
    skill: "Japanese",
    footnote: "this month",
  },
  { kind: "badge", key: "the-return", title: "The Return", subtitle: "You came back after a long gap. Nothing was lost.", footnote: "after 36 quiet days" },
  { kind: "badge", key: "deep-diver", title: "Deep Diver", subtitle: "Four hours in one sitting.", footnote: "4.3h in one go" },
  {
    kind: "milestone",
    tier: "FOUNDATION",
    label: "Foundation",
    skill: "Piano",
    footnote: "last month",
  },
  { kind: "badge", key: "storyteller", title: "Storyteller", subtitle: "Twenty experiences you bothered to write about." },
  { kind: "badge", key: "hundred-hours", title: "Hundred Hours", subtitle: "A hundred hours recorded across everything you track." },
  { kind: "badge", key: "year-one", title: "? ? ?", subtitle: "Still out there", earned: false },
  { kind: "badge", key: "caretaker", title: "? ? ?", subtitle: "Still out there", earned: false },
];

export function MedalShowcase() {
  const ref = useRef<HTMLUListElement>(null);
  const [struck, setStruck] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        // The tiles rise first (CSS, staggered); the strike begins as they land.
        setTimeout(() => setStruck(true), 550);
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <ul ref={ref} className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-4">
      {MEDALS.map((entry, i) => (
        <li
          key={i}
          className="rise-in"
          style={{ ["--rise-delay" as string]: `${i * 0.07}s` }}
        >
          {entry.kind === "milestone" ? (
            <MedalTile
              index={i}
              tier={entry.tier}
              title={entry.label}
              subtitle={entry.skill}
              footnote={entry.footnote}
              earned
              striking={struck}
            />
          ) : (
            <BadgeTile
              index={i}
              badgeKey={entry.key}
              title={entry.title}
              subtitle={entry.subtitle}
              footnote={entry.footnote ?? null}
              earned={entry.earned ?? true}
              striking={struck}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

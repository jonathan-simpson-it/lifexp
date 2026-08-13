"use client";

import { useState } from "react";
import { AppNav } from "@/components/nav/app-nav";
import { LogSheet, type LogResult } from "@/components/log/log-sheet";
import { CelebrationHost } from "@/components/celebrate/celebration-host";
import type { QuickSkill } from "@/lib/growth/aggregate";

/**
 * Client shell around every signed-in page.
 *
 * It owns the two things that outlive a route change: whether the log sheet is
 * open, and what the last save earned. Pages stay server components, they come
 * through untouched as `children`.
 *
 * Both the sheet and the celebration are **mounted fresh** rather than told to
 * reset. A counter drives their `key`, so opening the sheet a second time gets
 * clean initial state for free, and neither component needs an effect that
 * copies props into state, which would cost an extra render pass every time.
 */
export function AppShell({
  skills,
  children,
}: {
  skills: QuickSkill[];
  children: React.ReactNode;
}) {
  const [openCount, setOpenCount] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [result, setResult] = useState<{ id: number; value: LogResult } | null>(
    null,
  );

  function openSheet() {
    setOpenCount((n) => n + 1);
    setSheetOpen(true);
  }

  return (
    <>
      {/* Left padding clears the desktop sidebar; bottom padding clears the
          mobile bar plus its safe area. */}
      <div className="md:pl-60">
        <div className="mx-auto max-w-3xl px-4 pt-4 pb-28 md:pb-10">{children}</div>
      </div>

      <AppNav onAdd={openSheet} sheetOpen={sheetOpen} />

      {sheetOpen && (
        <LogSheet
          key={openCount}
          skills={skills}
          onClose={() => setSheetOpen(false)}
          onLogged={(value) => setResult({ id: openCount, value })}
        />
      )}

      {result && <CelebrationHost key={result.id} result={result.value} />}
    </>
  );
}

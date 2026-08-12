"use client";

import { useState } from "react";
import { AppNav } from "@/components/nav/app-nav";
import { LogSheet, type LogResult } from "@/components/log/log-sheet";
import { CelebrationHost } from "@/components/celebrate/celebration-host";
import type { QuickSkill } from "@/lib/growth/aggregate";

/**
 * Client shell around every signed-in page.
 *
 * It owns the two pieces of state that have to outlive a route change: whether
 * the log sheet is open, and what the last save earned. Pages themselves stay
 * server components — they are passed straight through as `children`.
 */
export function AppShell({
  skills,
  children,
}: {
  skills: QuickSkill[];
  children: React.ReactNode;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [result, setResult] = useState<LogResult | null>(null);

  return (
    <>
      {/* Left padding clears the desktop sidebar; bottom padding clears the
          mobile bar plus its safe area. */}
      <div className="md:pl-60">
        <div className="mx-auto max-w-3xl px-4 pt-4 pb-28 md:pb-10">{children}</div>
      </div>

      <AppNav onAdd={() => setSheetOpen(true)} />

      <LogSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        skills={skills}
        onLogged={setResult}
      />

      <CelebrationHost result={result} onDone={() => setResult(null)} />
    </>
  );
}

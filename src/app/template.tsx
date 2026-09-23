import type { ReactNode } from "react";

/**
 * Route transitions.
 *
 * A template remounts on every navigation, which is exactly what an entrance
 * needs: each screen lands with the same 220ms rise the app's cards use, so
 * moving between sections feels like one surface settling rather than a hard
 * swap. Deliberately enter-only; the App Router has no exit hook, and faking
 * one costs more than it shows.
 *
 * The reduced-motion block in globals.css collapses this to an instant paint.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-in">{children}</div>;
}

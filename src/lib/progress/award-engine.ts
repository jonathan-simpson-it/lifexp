import { BADGES, type AwardSnapshot, type BadgeKey } from "./badges";

export type PendingAward = {
  badgeKey: BadgeKey;
  context: Record<string, unknown>;
};

/**
 * Evaluate every badge against a snapshot and return the ones now earned that
 * were not already held.
 *
 * Pure: no I/O, no clock read, no randomness. The caller supplies `now` on the
 * snapshot, which is what makes badge behaviour testable at exact boundaries.
 *
 * Safe to run after every single write, the caller persists results through a
 * unique (userId, badgeKey) constraint, so a double-run awards nothing twice.
 */
export function evaluateAwards(
  snapshot: AwardSnapshot,
  alreadyEarned: Iterable<string>,
): PendingAward[] {
  const held = new Set(alreadyEarned);
  const pending: PendingAward[] = [];

  for (const badge of BADGES) {
    if (held.has(badge.key)) continue;

    let result: false | Record<string, unknown>;
    try {
      result = badge.earned(snapshot);
    } catch {
      // A badge with a bug must never break the write that triggered it.
      // Losing one badge evaluation is survivable; losing the user's
      // experience because a predicate threw is not.
      continue;
    }

    if (result) pending.push({ badgeKey: badge.key, context: result });
  }

  return pending;
}

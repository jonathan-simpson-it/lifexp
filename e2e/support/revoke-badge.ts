/**
 * Removes one badge award, so the next qualifying write earns it again.
 *
 * The medal moment is the biggest piece of choreography in the app and was
 * completely uncovered, because the seeded demo user has already earned ten of
 * the twelve badges and the remaining two are time-of-day dependent. Revoking
 * an award is the honest way to make the moment reachable: nothing is faked,
 * the badge is genuinely re-earned by `syncProgress` on the next write.
 *
 * A separate script rather than a Prisma import inside the spec, for the same
 * reason as delete-user.ts: Playwright transpiles specs as CommonJS and the
 * generated client is ESM.
 *
 * Usage: npx tsx e2e/support/revoke-badge.ts <email> <badgeKey>
 */
import "dotenv/config";
import { db } from "../../src/lib/db";

async function main() {
  const [email, badgeKey] = process.argv.slice(2);
  if (!email || !badgeKey) throw new Error("An email and a badge key are required");

  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) throw new Error(`No user for ${email}`);

  const { count } = await db.badgeAward.deleteMany({
    where: { userId: user.id, badgeKey },
  });
  console.log(`revoked ${count}`);
  await db.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

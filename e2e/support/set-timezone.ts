/**
 * Sets the demo user's timezone.
 *
 * The garden's light comes from the user's local hour, so a screenshot run at
 * 04:00 UTC captures every screen under the night wash, which misrepresents the
 * product. This lets the capture spec pin the hour it wants.
 *
 * A separate script rather than a Prisma import inside the spec, for the same
 * reason as delete-user.ts: Playwright transpiles specs as CommonJS and the
 * generated client is ESM.
 *
 * Usage: npx tsx e2e/support/set-timezone.ts <email> <ianaZone>
 */
import "dotenv/config";
import { db } from "../../src/lib/db";

async function main() {
  const [email, timezone] = process.argv.slice(2);
  if (!email || !timezone) throw new Error("An email and a timezone are required");

  const { count } = await db.user.updateMany({ where: { email }, data: { timezone } });
  console.log(`updated ${count} to ${timezone}`);
  await db.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

/**
 * Deletes a user by email. Used by the stale-session tests.
 *
 * A separate script rather than a Prisma import inside the spec: Playwright
 * transpiles specs as CommonJS, and the generated Prisma client is ESM, so
 * importing it from a test fails on `import.meta`. Running it as its own tsx
 * process sidesteps that and keeps the database client out of the test bundle.
 *
 * Usage: npx tsx e2e/support/delete-user.ts <email>
 */
import "dotenv/config";
import { db } from "../../src/lib/db";

async function main() {
  const email = process.argv[2];
  if (!email) throw new Error("An email is required");

  const { count } = await db.user.deleteMany({ where: { email } });
  console.log(`deleted ${count}`);
  await db.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

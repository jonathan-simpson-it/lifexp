import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Next's dev server re-evaluates modules on every hot reload. Without this
// cache each reload would open a fresh pool and eventually exhaust connections.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/**
 * On the `ui-test-only` branch the app is deployed with no DATABASE_URL at all.
 * `next build` imports every route module while collecting page data, so this
 * file must not throw at import time: a missing connection string now yields a
 * stand-in client that only complains if something actually reaches for it.
 * Every read path checks `isDemoMode()` first and returns fixtures instead (see
 * lib/demo.ts), so in demo mode nothing should ever touch this proxy.
 */
function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return new Proxy({} as PrismaClient, {
      get() {
        throw new Error(
          "No database is configured on this deployment. Demo mode should have answered this read with in-memory fixtures.",
        );
      },
    });
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

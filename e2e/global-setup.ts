import { execFileSync } from "node:child_process";

/**
 * Reseed before every run.
 *
 * The suite mutates shared data, logging a maintenance item, saving an
 * experience, against one local database. Without this, each run starts from
 * the previous run's leftovers: after a few passes nothing is "been a while"
 * any more, and the freshness assertions fail for reasons that have nothing to
 * do with the code under test.
 *
 * Seeding here rather than in a fixture keeps it to once per run, and the seed
 * is deterministic, so every run sees identical data.
 */
export default function globalSetup() {
  execFileSync("npm", ["run", "seed"], {
    stdio: "inherit",
    env: process.env,
  });
}

import os from "node:os";
import type { NextConfig } from "next";

/**
 * Every non-internal IPv4 address this machine answers on.
 *
 * `allowedDevOrigins` matches hostnames and globs, it does NOT understand CIDR
 * blocks, so an earlier `192.168.0.0/16` entry silently matched nothing and the
 * dev server kept refusing requests from the LAN. Enumerating the real
 * addresses is unambiguous and needs no guessing about the local subnet.
 */
function localNetworkHosts(): string[] {
  const hosts = new Set<string>(["localhost", "127.0.0.1"]);

  for (const addresses of Object.values(os.networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family === "IPv4" && !address.internal) {
        hosts.add(address.address);
      }
    }
  }

  return [...hosts];
}

const nextConfig: NextConfig = {
  // The dev-tools indicator is a portal pinned to the bottom-left of the
  // viewport, which is exactly where this app puts its bottom navigation. It
  // covers the "Today" tab, and inside the log sheet it covers "Describe it",
  // so it both hides UI during review and swallows clicks in end-to-end tests.
  //
  // Next 16 removed `devIndicators.buildActivityPosition`, so there is no way
  // to move it. Off is better than obscuring primary navigation on every page;
  // the app has its own error boundary for the failures that matter.
  devIndicators: false,

  // LifeXP is mobile-first, so it wants to be opened on an actual phone during
  // development, which means requests arrive at the machine's LAN address
  // rather than localhost, and Next blocks those by default. Dev only; this has
  // no effect on a production build.
  allowedDevOrigins: [...localNetworkHosts(), "*.local"],
};

export default nextConfig;

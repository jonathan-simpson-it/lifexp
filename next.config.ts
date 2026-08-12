import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev-tools indicator is a portal pinned to the bottom-left of the
  // viewport, which is exactly where this app puts its bottom navigation. It
  // covers the "Today" tab, and inside the log sheet it covers "Describe it" —
  // so it both hides UI during review and swallows clicks in end-to-end tests.
  //
  // Next 16 removed `devIndicators.buildActivityPosition`, so there is no way
  // to move it. Off is better than obscuring primary navigation on every page;
  // the app has its own error boundary for the failures that matter.
  devIndicators: false,

  // LifeXP is mobile-first, so it wants to be opened on an actual phone during
  // development — which means requests arrive at the machine's LAN address
  // rather than localhost, and Next blocks those by default. Private ranges
  // only, and only in dev; this has no effect on a production build.
  allowedDevOrigins: [
    "127.0.0.1",
    "192.168.0.0/16",
    "10.0.0.0/8",
    "172.16.0.0/12",
    "*.local",
  ],
};

export default nextConfig;

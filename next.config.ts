import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev-tools indicator is rendered in a portal pinned to the bottom of the
  // viewport, which sits directly on top of LifeXP's own bottom-pinned capture
  // bar and swallows clicks in end-to-end tests. Turned off only when the e2e
  // suite is driving the app; normal `npm run dev` keeps it.
  devIndicators: process.env.LIFEXP_E2E === "1" ? false : undefined,

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

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev-tools indicator is rendered in a portal pinned to the bottom of the
  // viewport, which sits directly on top of LifeXP's own bottom-pinned capture
  // bar and swallows clicks in end-to-end tests. Turned off only when the e2e
  // suite is driving the app; normal `npm run dev` keeps it.
  devIndicators: process.env.LIFEXP_E2E === "1" ? false : undefined,
};

export default nextConfig;

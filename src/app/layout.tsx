import type { Metadata, Viewport } from "next";
import { Newsreader, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

/*
  Two faces, chosen rather than inherited.

  Newsreader is a literary serif with a real optical-size axis, so a 34px total
  and a 12px caption are drawn differently rather than scaled from one master.
  It carries every number in the app — the numbers are the emotional payload,
  and this face makes "330h" read like something recorded rather than computed.
  Its italic is the product's voice (see `.voice` in globals.css).

  Hanken Grotesk is a warm humanist sans with a large x-height, which is what
  keeps 11px nav labels and 12.5px captions legible on a phone.

  next/font self-hosts both at build time: no request to Google from the
  browser, no layout shift, nothing to fetch at runtime. Only the first build
  needs network — if that ever becomes a problem, drop the woff2 files into
  src/app/fonts/ and swap to next/font/local; the variables stay the same.
*/

const display = Newsreader({
  subsets: ["latin"],
  variable: "--font-display-face",
  style: ["normal", "italic"],
  // Not included by default — next/font ships wght only, to keep the file
  // small. Without this, font-optical-sizing has nothing to act on.
  axes: ["opsz"],
  display: "swap",
});

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans-face",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LifeXP",
  description:
    "LifeXP makes invisible progress visible. No streaks, no guilt — just evidence of the person you are gradually becoming.",
};

export const viewport: Viewport = {
  // One colour, matching --paper. LifeXP is light in every colour scheme, so
  // advertising a dark variant here would only make the phone's status bar
  // disagree with the page underneath it.
  themeColor: "#f7f1e1",
  colorScheme: "only light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}

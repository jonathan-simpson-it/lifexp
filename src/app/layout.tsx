import type { Metadata, Viewport } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

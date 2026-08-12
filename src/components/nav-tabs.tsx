"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Today" },
  { href: "/growth", label: "Growth" },
  { href: "/maintenance", label: "Maintenance" },
  { href: "/medals", label: "Medals" },
  { href: "/timeline", label: "Timeline" },
];

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Sections"
      className="mx-auto max-w-3xl overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex gap-1 pb-1">
        {TABS.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);

          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "inline-block rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
                  active
                    ? "bg-ink text-paper"
                    : "text-muted hover:bg-line/60 hover:text-ink",
                ].join(" ")}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconAdd,
  IconCalendar,
  IconGrowth,
  IconMedals,
  IconToday,
  Logo,
} from "@/components/icons";

/**
 * Primary navigation.
 *
 * Two layouts from one component: a fixed bottom bar under `md`, a persistent
 * left sidebar above it. Each device gets its native idiom, and there is one
 * source of truth for what the destinations are.
 *
 * Five items is the ceiling for a bottom bar before targets get too narrow to
 * hit reliably, which is why Maintenance lives inside Today and Calendar rather
 * than claiming a slot of its own.
 */

type Destination = {
  href: string;
  label: string;
  Icon: (props: { active?: boolean; size?: number }) => React.JSX.Element;
};

const LEFT: Destination[] = [
  { href: "/today", label: "Today", Icon: IconToday },
  { href: "/growth", label: "Growth", Icon: IconGrowth },
];

const RIGHT: Destination[] = [
  { href: "/calendar", label: "Calendar", Icon: IconCalendar },
  { href: "/medals", label: "Medals", Icon: IconMedals },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/today" ? pathname === "/today" : pathname.startsWith(href);
}

export function AppNav({ onAdd }: { onAdd: () => void }) {
  return (
    <>
      <BottomBar onAdd={onAdd} />
      <Sidebar onAdd={onAdd} />
    </>
  );
}

/* --- mobile -------------------------------------------------------------- */

function BottomBar({ onAdd }: { onAdd: () => void }) {
  const isActive = useIsActive();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur-md md:hidden"
      // Keeps the bar clear of the iOS home indicator.
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-lg items-end justify-around px-2 pt-1.5 pb-1">
        {LEFT.map((item) => (
          <NavItem key={item.href} item={item} active={isActive(item.href)} />
        ))}

        <li className="flex-1">
          <div className="flex justify-center">
            <AddButton onAdd={onAdd} />
          </div>
        </li>

        {RIGHT.map((item) => (
          <NavItem key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </ul>
    </nav>
  );
}

function NavItem({ item, active }: { item: Destination; active: boolean }) {
  const { href, label, Icon } = item;

  return (
    <li className="flex-1">
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={[
          "tappable flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px]",
          active ? "text-accent-deep" : "text-muted",
        ].join(" ")}
      >
        <span className={active ? "pop-in" : undefined}>
          <Icon active={active} size={24} />
        </span>
        <span className={active ? "font-semibold" : undefined}>{label}</span>
      </Link>
    </li>
  );
}

/**
 * The centre button. Raised above the bar and the only coral fill in the
 * chrome, because it is the one control the product depends on being found.
 */
function AddButton({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label="Record something"
      // accent-deep rather than accent: the white plus needs to be crisp, and
      // on the lighter sage it would sit at 3.1:1 rather than 5.3:1.
      className="tappable -mt-6 flex size-14 items-center justify-center rounded-full bg-accent-deep text-white shadow-accent ring-4 ring-paper"
    >
      <IconAdd size={26} />
    </button>
  );
}

/* --- desktop ------------------------------------------------------------- */

function Sidebar({ onAdd }: { onAdd: () => void }) {
  const isActive = useIsActive();
  const all = [...LEFT, ...RIGHT];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-paper px-4 py-5 md:flex"
    >
      <Link href="/today" className="tappable mb-6 inline-flex px-1">
        <Logo />
      </Link>

      <button
        type="button"
        onClick={onAdd}
        className="tappable mb-6 flex items-center justify-center gap-2 rounded-full bg-accent-deep px-4 py-3 text-sm font-semibold text-white shadow-accent"
      >
        <IconAdd size={20} />
        Record something
      </button>

      <ul className="flex flex-1 flex-col gap-1">
        {all.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={[
                  "tappable flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
                  active
                    ? "bg-accent-soft font-semibold text-accent-deep"
                    : "text-muted hover:bg-line/40 hover:text-ink",
                ].join(" ")}
              >
                <Icon active={active} size={22} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      <Link
        href="/settings"
        className="tappable rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-line/40 hover:text-ink"
      >
        Settings
      </Link>
    </nav>
  );
}

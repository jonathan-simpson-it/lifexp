"use client";

import Link from "next/link";
import { Settings } from "lucide-react";

export function AccountMenu({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-muted sm:inline">{name}</span>
      <Link
        href="/settings"
        aria-label="Settings"
        className="rounded-full p-2 text-muted transition-colors hover:bg-line/60 hover:text-ink"
      >
        <Settings size={18} aria-hidden />
      </Link>
    </div>
  );
}

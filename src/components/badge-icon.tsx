import {
  Anchor,
  Feather,
  Flag,
  Globe,
  Home,
  Moon,
  Mountain,
  PenLine,
  RotateCcw,
  Sprout,
  Sunrise,
  TreePine,
  type LucideIcon,
} from "lucide-react";

/**
 * Explicit map rather than a dynamic lookup: it keeps tree-shaking honest and
 * makes an unknown icon name a visible fallback instead of a crash.
 */
const ICONS: Record<string, LucideIcon> = {
  Anchor,
  Feather,
  Flag,
  Globe,
  Home,
  Moon,
  Mountain,
  PenLine,
  RotateCcw,
  Sprout,
  Sunrise,
  TreePine,
};

export function BadgeIcon({
  name,
  size = 20,
}: {
  name: string;
  size?: number;
}) {
  const Icon = ICONS[name] ?? Sprout;
  return <Icon size={size} aria-hidden strokeWidth={1.75} />;
}

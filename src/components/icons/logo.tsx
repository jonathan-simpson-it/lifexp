/**
 * The LifeXP mark: a sprout breaking ground.
 *
 * Chosen over anything chart- or trophy-shaped because the product is about
 * accumulation over years, not scores. It also ties the brand to the garden, so
 * the mark and the home screen are visibly the same idea.
 *
 * Name lives here once, so renaming is a single-file change.
 */

export const PRODUCT_NAME = "LifeXP";

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M16 27V14"
        stroke="var(--growth)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Left leaf sits lower and smaller: an even pair reads as a logo cliché,
          an uneven one reads as something actually growing. */}
      <path
        d="M16 19c-5 0-7.6-2.9-7.6-7 4.4 0 7.6 2.6 7.6 7Z"
        fill="var(--growth)"
        opacity="0.75"
      />
      <path
        d="M16 15.5c5.4 0 8.4-3.2 8.4-8-4.8 0-8.4 3-8.4 8Z"
        fill="var(--action)"
      />
      <path d="M8.5 27h15" stroke="var(--line-strong)" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({
  size = 28,
  showName = true,
}: {
  size?: number;
  showName?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      {showName && (
        <span className="display text-lg font-semibold tracking-tight">
          {PRODUCT_NAME}
        </span>
      )}
    </span>
  );
}

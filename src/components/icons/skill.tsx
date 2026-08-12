/**
 * Skill-type glyphs, keyed to the `templateKey` already stored on Skill
 * (lib/progress/milestones.ts decides it at creation time).
 *
 * Used on quick-log chips, skill cards and calendar legends. Simple enough to
 * stay legible at 16px on a chip.
 */

type Props = { size?: number };

const svg = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  "aria-hidden": true,
});

const stroke = {
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Language — a speech bubble with a character stroke. */
function Language({ size = 20 }: Props) {
  return (
    <svg {...svg(size)}>
      <path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H12l-4.5 3.5V16H6.5A2.5 2.5 0 0 1 4 13.5v-7Z"
        {...stroke}
      />
      <path d="M8.5 8h7M8.5 11.5h4" {...stroke} />
    </svg>
  );
}

/** Music — a note. */
function Music({ size = 20 }: Props) {
  return (
    <svg {...svg(size)}>
      <path d="M9 17.5V6l9-2v11.5" {...stroke} />
      <circle cx="6.6" cy="17.5" r="2.6" {...stroke} />
      <circle cx="15.6" cy="15.5" r="2.6" {...stroke} />
    </svg>
  );
}

/** Fitness — a mountain, which covers running, climbing and the gym alike. */
function Fitness({ size = 20 }: Props) {
  return (
    <svg {...svg(size)}>
      <path d="M3 19h18L14.5 7.5 11 13.5 8.8 10 3 19Z" {...stroke} />
      <circle cx="17" cy="5.5" r="1.8" {...stroke} />
    </svg>
  );
}

/** Reading — an open book. */
function Reading({ size = 20 }: Props) {
  return (
    <svg {...svg(size)}>
      <path d="M12 6.5C10.5 5 8.4 4.4 4.5 4.4V17c3.9 0 6 .6 7.5 2.1 1.5-1.5 3.6-2.1 7.5-2.1V4.4c-3.9 0-6 .6-7.5 2.1Z" {...stroke} />
      <path d="M12 6.5v12.6" {...stroke} />
    </svg>
  );
}

/** Mindfulness — a still circle with a rising line. */
function Mindfulness({ size = 20 }: Props) {
  return (
    <svg {...svg(size)}>
      <circle cx="12" cy="12" r="8" {...stroke} />
      <path d="M7.5 14.2c1.6-3.4 3-5.1 4.5-5.1s2.9 1.7 4.5 5.1" {...stroke} />
    </svg>
  );
}

/** Craft — a pen nib. */
function Craft({ size = 20 }: Props) {
  return (
    <svg {...svg(size)}>
      <path d="M5 19l2-6L17.2 2.8a2.1 2.1 0 0 1 3 3L10 16l-5 3Z" {...stroke} />
      <path d="M15.5 4.5l3 3" {...stroke} />
    </svg>
  );
}

/** Fallback — a spark, for anything that matched no template. */
function Generic({ size = 20 }: Props) {
  return (
    <svg {...svg(size)}>
      <path
        d="M12 3.5l2.2 5.4 5.8.4-4.4 3.7 1.4 5.6L12 15.6 7 18.6l1.4-5.6L4 9.3l5.8-.4L12 3.5Z"
        {...stroke}
      />
    </svg>
  );
}

const BY_TEMPLATE: Record<string, (p: Props) => React.JSX.Element> = {
  language: Language,
  music: Music,
  fitness: Fitness,
  reading: Reading,
  mindfulness: Mindfulness,
  craft: Craft,
};

export function SkillIcon({
  templateKey,
  size = 20,
}: {
  templateKey: string | null;
  size?: number;
}) {
  const Glyph = (templateKey && BY_TEMPLATE[templateKey]) || Generic;
  return <Glyph size={size} />;
}

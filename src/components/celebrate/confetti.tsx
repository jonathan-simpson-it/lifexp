"use client";

import { useEffect, useRef } from "react";

/**
 * Canvas confetti in the brand palette.
 *
 * Deliberately hand-rolled rather than a dependency: it is ~60 lines, it draws
 * only in our colours, and it can hard-stop for reduced motion. A library would
 * ship far more than this needs.
 */

/**
 * Green and gold only, the product's two materials. Confetti is the one place
 * it would be easy to reach for a party palette, and a burst of colours the app
 * never otherwise uses would look borrowed.
 */
const COLORS = ["#6e9f70", "#426e4a", "#c9932b", "#9dbb9f", "#e0b23f"];

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  spin: number;
  /** Phase offset for the flutter, so pieces do not sway in unison. */
  phase: number;
  /** How far this piece wanders sideways as it falls. */
  drift: number;
  color: string;
};

export function Confetti({ pieces = 90 }: { pieces?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Someone who has asked for less motion should not be handed a particle
    // system. This is a hard opt-out, not a slower animation.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = (canvas.width = canvas.offsetWidth * dpr);
    const height = (canvas.height = canvas.offsetHeight * dpr);
    ctx.scale(dpr, dpr);

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    const items: Piece[] = Array.from({ length: pieces }, () => ({
      x: w / 2 + (Math.random() - 0.5) * w * 0.5,
      y: h * 0.42 + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 7,
      vy: -Math.random() * 9 - 3,
      size: Math.random() * 6 + 4,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.28,
      phase: Math.random() * Math.PI * 2,
      drift: Math.random() * 0.7 + 0.25,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    let frame = 0;
    let raf = 0;

    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      frame++;

      for (const p of items) {
        p.vy += 0.22; // gravity
        p.vx *= 0.995; // drag
        // Flutter. Paper does not fall in a straight line, and the phase
        // offset per piece stops the burst swaying as one sheet.
        p.x += p.vx + Math.sin(frame * 0.07 + p.phase) * p.drift;
        p.y += p.vy;
        p.rotation += p.spin;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        // Squashing width by the same phase reads as the piece turning over,
        // which is most of what makes falling paper look like paper.
        ctx.scale(Math.cos(frame * 0.07 + p.phase) * 0.4 + 0.6, 1);
        ctx.globalAlpha = Math.max(0, 1 - frame / 130);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }

      if (frame < 130) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pieces]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

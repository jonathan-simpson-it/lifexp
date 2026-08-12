"use client";

import { useEffect, useRef } from "react";

/**
 * Canvas confetti in the brand palette.
 *
 * Deliberately hand-rolled rather than a dependency: it is ~60 lines, it draws
 * only in our colours, and it can hard-stop for reduced motion. A library would
 * ship far more than this needs.
 */

const COLORS = ["#e0663c", "#c9932b", "#4f6e4f", "#ad4e1f", "#e0b23f"];

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  spin: number;
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
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.spin;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
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

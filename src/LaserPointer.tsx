import { useEffect, useRef, useState } from "react";

/** Name of the window event that toggles the pointer; the deck's Q key fires it. */
export const LASER_TOGGLE_EVENT = "laser-toggle";

/** How long a trail point lives, in milliseconds. */
const TRAIL_MS = 350;
const COLOR = "255, 40, 40";

/**
 * A red laser dot that follows the mouse, with a trail that fades over a
 * fraction of a second. Toggled by the LASER_TOGGLE_EVENT window event.
 * Draws on a full-screen canvas above the deck; the real cursor is hidden
 * while the pointer is on.
 */
export const LaserPointer = () => {
  const [on, setOn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const points = useRef<{ x: number; y: number; t: number }[]>([]);
  const mouse = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const toggle = () => setOn((v) => !v);
    window.addEventListener(LASER_TOGGLE_EVENT, toggle);
    return () => window.removeEventListener(LASER_TOGGLE_EVENT, toggle);
  }, []);

  useEffect(() => {
    if (!on) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      points.current.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    };
    window.addEventListener("mousemove", onMove);

    document.documentElement.style.cursor = "none";

    let frame = 0;
    const draw = () => {
      const now = performance.now();
      const trail = points.current.filter((p) => now - p.t < TRAIL_MS);
      points.current = trail;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Trail: each segment fades and thins with age.
      for (let i = 1; i < trail.length; i++) {
        const age = (now - trail[i].t) / TRAIL_MS;
        const alpha = (1 - age) * 0.6;
        ctx.strokeStyle = `rgba(${COLOR}, ${alpha})`;
        ctx.lineWidth = 2 + (1 - age) * 6;
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.stroke();
      }

      // Dot: a soft glow around a bright core.
      const m = mouse.current;
      if (m) {
        const glow = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 22);
        glow.addColorStop(0, `rgba(${COLOR}, 0.9)`);
        glow.addColorStop(0.35, `rgba(${COLOR}, 0.45)`);
        glow.addColorStop(1, `rgba(${COLOR}, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(255, 220, 220, 1)";
        ctx.beginPath();
        ctx.arc(m.x, m.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      document.documentElement.style.cursor = "";
      points.current = [];
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
  }, [on]);

  return (
    <canvas
      ref={canvasRef}
      hidden={!on}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 1000,
      }}
    />
  );
};

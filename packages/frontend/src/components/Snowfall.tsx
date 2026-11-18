import type { CSSProperties } from 'react';

/**
 * A light, CSS-only snowfall: a fixed handful of dots on GPU-friendly
 * transforms, hidden entirely under prefers-reduced-motion.
 * Positions are deterministic so renders and tests are stable.
 */
const FLAKES = Array.from({ length: 16 }, (_, i) => {
  const left = (i * 37 + 11) % 100;
  const size = 3 + ((i * 7) % 4);
  const duration = 11 + ((i * 5) % 9);
  const delay = -((i * 13) % 17);
  const drift = ((i % 2 === 0 ? 1 : -1) * (10 + ((i * 3) % 25))).toString() + 'px';
  return { left, size, duration, delay, drift };
});

export function Snowfall() {
  return (
    <div className="snow-layer" aria-hidden="true">
      {FLAKES.map((f, i) => (
        <span
          key={i}
          className="snowflake"
          style={
            {
              left: `${f.left}%`,
              width: f.size,
              height: f.size,
              animationDuration: `${f.duration}s`,
              animationDelay: `${f.delay}s`,
              '--drift': f.drift,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

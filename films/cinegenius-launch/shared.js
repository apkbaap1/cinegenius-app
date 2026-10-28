// Timing helpers shared by every shot. Everything is a pure function of t.

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

// Progress of t through [a, b], 0..1.
export const span = (t, a, b) => clamp((t - a) / (b - a));

export const outCubic = (x) => 1 - Math.pow(1 - x, 3);
export const inOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const outBack = (x) => {
  const c = 1.6;
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};

// Fade in over [a, a+d], hold, fade out over [b-d, b].
export const inOut = (t, a, b, d = 0.4) => Math.min(span(t, a, a + d), 1 - span(t, b - d, b));

// Standard entrance for headline blocks: rise and fade.
export function enter(el, t, start, dur = 0.6, dist = 40) {
  const p = outCubic(span(t, start, start + dur));
  el.style.opacity = p;
  el.style.transform = `translateY(${(1 - p) * dist}px)`;
  return p;
}

export const fontsReady = () => document.fonts.ready;

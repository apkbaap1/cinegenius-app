// Timing helpers shared by every shot. Everything is a pure function of t.

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const span = (t, a, b) => clamp((t - a) / (b - a));
export const outCubic = (x) => 1 - Math.pow(1 - x, 3);
export const inOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const outBack = (x) => {
  const c = 1.7;
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};

// Rise and fade in at `start`; fade out over the last `out` seconds before `end`, if given.
export function enter(el, t, start, { dur = 0.4, dist = 40, end = Infinity, out = 0.25, pop = false } = {}) {
  const p = span(t, start, start + dur);
  const q = end === Infinity ? 1 : 1 - span(t, end - out, end);
  el.style.opacity = Math.min(outCubic(p), q);
  const s = pop ? 0.6 + 0.4 * outBack(p) : 0.96 + 0.04 * outBack(p);
  el.style.transform = `translateY(${(1 - outCubic(p)) * dist}px) scale(${s})`;
  return p;
}

// Text typed between a and b, by grapheme, so a Telugu letter never loses its vowel sign.
const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });
export function typed(text, t, a, b) {
  const chars = [...graphemes.segment(text)].map((g) => g.segment);
  return chars.slice(0, Math.round(chars.length * span(t, a, b))).join("");
}

export const fontsReady = () => document.fonts.ready;

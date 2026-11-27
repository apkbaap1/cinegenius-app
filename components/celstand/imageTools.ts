// In-browser cel prep: split one painting into sky / clouds / scenery,
// key out a flat background behind a character, and lift a jacket onto its own cel.

import { loadImage } from './assets';

const canvasFor = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
};

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

async function pixels(src: string) {
  const img = await loadImage(src);
  const c = canvasFor(img.naturalWidth, img.naturalHeight);
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.drawImage(img, 0, 0);
  return { c, g, data: g.getImageData(0, 0, c.width, c.height), w: c.width, h: c.height };
}

const toURL = (c: HTMLCanvasElement) => c.toDataURL('image/png');

export interface SplitResult { sky: string; clouds: string; scenery: string; }

/**
 * horizon: 0..1 — where the scenery starts. feather: 0..0.2 soft edge.
 * cloudStrength: 0..1 — how eagerly bright, low-saturation pixels become clouds.
 */
export async function splitBackground(src: string, horizon: number, feather: number, cloudStrength: number): Promise<SplitResult> {
  const { data, w, h } = await pixels(src);
  const px = data.data;
  const sky = new ImageData(w, h);
  const clouds = new ImageData(w, h);
  const scenery = new ImageData(w, h);
  const hy = horizon * h;
  const fy = Math.max(1, feather * h);
  const thrLo = 0.14 - 0.1 * cloudStrength;
  const thrHi = thrLo + 0.16;

  for (let y = 0; y < h; y++) {
    // Mask: 1 = scenery, 0 = sky, soft over the feather band.
    const m = smooth(hy - fy / 2, hy + fy / 2, y);
    // Estimate the clear-sky colour of this row from its darker half
    // (clouds are the bright half), which also fills in behind clouds.
    const row: number[] = [];
    for (let x = 0; x < w; x += 4) {
      const i = (y * w + x) * 4;
      row.push(Math.min(px[i], px[i + 1], px[i + 2]));
    }
    row.sort((a, b) => a - b);
    const cut = row[Math.floor(row.length * 0.4)] ?? 0;
    let r = 0, gg = 0, b = 0, n = 0;
    for (let x = 0; x < w; x += 2) {
      const i = (y * w + x) * 4;
      if (Math.min(px[i], px[i + 1], px[i + 2]) <= cut) { r += px[i]; gg += px[i + 1]; b += px[i + 2]; n++; }
    }
    if (n) { r /= n; gg /= n; b /= n; }
    const rowMin = Math.min(r, gg, b);

    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const R = px[i], G = px[i + 1], B = px[i + 2], A = px[i + 3];
      // scenery cel
      scenery.data[i] = R; scenery.data[i + 1] = G; scenery.data[i + 2] = B;
      scenery.data[i + 3] = A * m;
      // sky base: smooth row colour, opaque (sits behind everything)
      sky.data[i] = r; sky.data[i + 1] = gg; sky.data[i + 2] = b; sky.data[i + 3] = 255;
      // clouds: whiter than the row's clear sky
      const mn = Math.min(R, G, B);
      const mx = Math.max(R, G, B);
      const sat = mx ? (mx - mn) / mx : 0;
      const white = (mn - rowMin) / 255;
      const a = smooth(thrLo, thrHi, white) * (1 - smooth(0.25, 0.5, sat)) * (1 - m);
      clouds.data[i] = R; clouds.data[i + 1] = G; clouds.data[i + 2] = B;
      clouds.data[i + 3] = 255 * a;
    }
  }
  const out = (d: ImageData) => { const c = canvasFor(w, h); c.getContext('2d')!.putImageData(d, 0, 0); return toURL(c); };
  return { sky: out(sky), clouds: out(clouds), scenery: out(scenery) };
}

/** Removes a flat background colour (sampled from the corners) behind a character. */
export async function keyOutBackground(src: string, tolerance = 40, softness = 25): Promise<string> {
  const { c, g, data, w, h } = await pixels(src);
  const px = data.data;
  const corners = [0, w - 1, (h - 1) * w, h * w - 1].map(p => [px[p * 4], px[p * 4 + 1], px[p * 4 + 2]]);
  const key = [0, 1, 2].map(k => corners.reduce((s, c2) => s + c2[k], 0) / 4);
  // Flood from the edges so same-coloured pixels inside the character survive.
  const seen = new Uint8Array(w * h);
  const stack: number[] = [];
  const dist = (p: number) => Math.hypot(px[p * 4] - key[0], px[p * 4 + 1] - key[1], px[p * 4 + 2] - key[2]);
  for (let x = 0; x < w; x++) { stack.push(x, (h - 1) * w + x); }
  for (let y = 0; y < h; y++) { stack.push(y * w, y * w + w - 1); }
  const limit = tolerance + softness;
  while (stack.length) {
    const p = stack.pop()!;
    if (seen[p]) continue;
    const d = dist(p);
    if (d > limit) continue;
    seen[p] = 1;
    const a = smooth(tolerance, limit, d);
    px[p * 4 + 3] = Math.min(px[p * 4 + 3], 255 * a);
    const x = p % w, y = (p / w) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - w);
    if (y < h - 1) stack.push(p + w);
  }
  g.putImageData(data, 0, 0);
  return toURL(c);
}

/** Copies every pixel close to `hex` onto its own transparent cel (e.g. the jacket). */
export async function isolateColor(src: string, hex: string, tolerance = 60): Promise<string> {
  const { c, g, data } = await pixels(src);
  const px = data.data;
  const t = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  // Compare in a shading-tolerant way: chroma direction matters more than brightness.
  const tn = Math.hypot(t[0], t[1], t[2]) || 1;
  for (let i = 0; i < px.length; i += 4) {
    const n = Math.hypot(px[i], px[i + 1], px[i + 2]) || 1;
    const chroma = Math.hypot(px[i] / n - t[0] / tn, px[i + 1] / n - t[1] / tn, px[i + 2] / n - t[2] / tn) * 255;
    const bright = Math.abs(n - tn) * 0.25;
    const d = chroma + bright;
    const a = 1 - smooth(tolerance * 0.6, tolerance, d);
    px[i + 3] = px[i + 3] * a;
  }
  g.putImageData(data, 0, 0);
  return toURL(c);
}

export async function sampleColor(src: string, fx: number, fy: number): Promise<string> {
  const { data, w, h } = await pixels(src);
  const x = Math.min(w - 1, Math.max(0, Math.round(fx * w)));
  const y = Math.min(h - 1, Math.max(0, Math.round(fy * h)));
  const i = (y * w + x) * 4;
  const hx = (v: number) => v.toString(16).padStart(2, '0');
  return `#${hx(data.data[i])}${hx(data.data[i + 1])}${hx(data.data[i + 2])}`;
}

const cropCache = new Map<string, Promise<string>>();
/** Thumbnail cropped to the visible pixels of a mostly-transparent cel (e.g. a mouth). */
export function cropToContent(src: string, pad = 12): Promise<string> {
  const hit = cropCache.get(src);
  if (hit) return hit;
  const p = (async () => {
    const { c, data, w, h } = await pixels(src);
    const px = data.data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
      if (px[(y * w + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 < 0) return src;
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w, x1 + pad); y1 = Math.min(h, y1 + pad);
    const out = canvasFor(x1 - x0, y1 - y0);
    out.getContext('2d')!.drawImage(c, x0, y0, x1 - x0, y1 - y0, 0, 0, x1 - x0, y1 - y0);
    return toURL(out);
  })();
  cropCache.set(src, p);
  return p;
}

const boxCache = new Map<string, Promise<[number, number, number, number] | null>>();
/** Bounding box [x, y, w, h] of the visible pixels of a cel. */
export function contentBox(src: string): Promise<[number, number, number, number] | null> {
  const hit = boxCache.get(src);
  if (hit) return hit;
  const p = (async () => {
    const { data, w, h } = await pixels(src);
    const px = data.data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
      if (px[(y * w + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    return x1 < 0 ? null : [x0, y0, x1 - x0, y1 - y0] as [number, number, number, number];
  })();
  boxCache.set(src, p);
  return p;
}

/**
 * Water mask from one painting: takes the typical colour in the middle of the band,
 * keeps every pixel of a similar hue inside the band, then closes small gaps along
 * each row so highlights on the water move with it. Opaque = water.
 */
export async function autoWaterMask(src: string, top: number, bottom: number): Promise<string> {
  const { c, g, data, w, h } = await pixels(src);
  const px = data.data;
  const y0 = Math.max(0, Math.floor(top * h)), y1 = Math.min(h, Math.ceil(bottom * h));
  const hsv = (i: number) => {
    const r = px[i] / 255, gg = px[i + 1] / 255, b = px[i + 2] / 255, mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), d = mx - mn + 1e-9;
    let hu = mx === r ? ((gg - b) / d) % 6 : mx === gg ? (b - r) / d + 2 : (r - gg) / d + 4;
    return [(hu * 60 + 360) % 360, mx > 0 ? (mx - mn) / mx : 0, mx];
  };
  // typical water hue: circular mean over the band's middle third
  let sx = 0, sy = 0;
  const m0 = y0 + Math.floor((y1 - y0) / 3), m1 = y0 + Math.floor((2 * (y1 - y0)) / 3);
  for (let y = m0; y < m1; y += 2) for (let x = 0; x < w; x += 4) {
    const [hu, s] = hsv((y * w + x) * 4);
    if (s < 0.12) continue;
    sx += Math.cos(hu * Math.PI / 180) * s; sy += Math.sin(hu * Math.PI / 180) * s;
  }
  const waterHue = (Math.atan2(sy, sx) * 180 / Math.PI + 360) % 360;
  const on = new Uint8Array(w * h);
  for (let y = y0; y < y1; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (px[i + 3] < 30) continue;
    const [hu, s] = hsv(i);
    const dh = Math.min(Math.abs(hu - waterHue), 360 - Math.abs(hu - waterHue));
    if (s > 0.12 && dh < 32) on[y * w + x] = 1;
  }
  // close gaps along rows (sparkles, foam) but not across thick objects
  const R = 10;
  const closed = new Uint8Array(on);
  for (let y = y0; y < y1; y++) {
    let last = -1;
    for (let x = 0; x < w; x++) {
      if (on[y * w + x]) {
        if (last >= 0 && x - last > 1 && x - last <= R) for (let k = last + 1; k < x; k++) closed[y * w + k] = 1;
        last = x;
      }
    }
  }
  for (let p = 0; p < w * h; p++) {
    const i = p * 4;
    px[i] = 255; px[i + 1] = 255; px[i + 2] = 255; px[i + 3] = closed[p] ? 255 : 0;
  }
  g.putImageData(data, 0, 0);
  return toURL(c);
}

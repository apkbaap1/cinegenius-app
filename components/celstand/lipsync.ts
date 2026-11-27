// Picks a mouth cel for each moment.
// 1) Voice clip assigned to the character → loudness of the audio drives the mouth.
// 2) Otherwise a dialogue line → the text's syllables drive a flap pattern.

import { CharacterLayer, MouthShape, Scene } from './types';
import { ENV_RATE, getEnvelope } from './assets';

export interface MouthState {
  level: number;
  source: 'voice' | 'text' | 'silent';
  mouth?: MouthShape;
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 1000) / 1000;
};

const segCache = new Map<string, string[]>();
function syllables(text: string): string[] {
  const hit = segCache.get(text);
  if (hit) return hit;
  let parts: string[];
  const Seg = (Intl as any).Segmenter;
  if (Seg) {
    parts = Array.from(new Seg(undefined, { granularity: 'grapheme' }).segment(text), (s: any) => s.segment as string);
  } else {
    parts = Array.from(text);
  }
  // Latin letters are too short to be a syllable each; group them by 2.
  const out: string[] = [];
  let latin = '';
  for (const p of parts) {
    if (/^[a-z]$/i.test(p)) {
      latin += p;
      if (latin.length === 2) { out.push(latin); latin = ''; }
    } else {
      if (latin) { out.push(latin); latin = ''; }
      out.push(p);
    }
  }
  if (latin) out.push(latin);
  segCache.set(text, out);
  return out;
}

const isPause = (s: string) => /^[\s.,!?;:…\-–—'"()।]+$/.test(s);

function voiceLevel(scene: Scene, characterId: string, t: number, step: number): number | null {
  let best: number | null = null;
  for (const clip of scene.audio) {
    if (clip.role !== 'voice' || clip.characterId !== characterId || !clip.duration) continue;
    const local = t - clip.start;
    if (local < 0 || local > clip.duration) continue;
    const env = getEnvelope(clip.src);
    if (!env) continue;
    const i0 = Math.floor(local * ENV_RATE);
    const i1 = Math.max(i0 + 1, Math.floor((local + step) * ENV_RATE));
    let sum = 0, n = 0;
    for (let i = i0; i < i1 && i < env.length; i++) { sum += env[i]; n++; }
    const v = n ? sum / n : 0;
    const lvl = smooth(0.06, 0.65, v);
    best = best === null ? lvl : Math.max(best, lvl);
  }
  return best;
}

function textLevel(scene: Scene, characterId: string, t: number): number | null {
  for (const line of scene.dialogue) {
    if (line.characterId !== characterId || t < line.start || t >= line.end) continue;
    const units = syllables(line.text.trim() || '...');
    const dur = Math.max(0.05, line.end - line.start);
    const tail = Math.min(0.12, dur * 0.1);
    const speakDur = dur - tail;
    const local = t - line.start;
    if (local >= speakDur) return 0;
    const pos = (local / speakDur) * units.length;
    const idx = Math.min(units.length - 1, Math.floor(pos));
    const u = units[idx];
    if (isPause(u)) return 0;
    const phase = pos - idx;
    const amp = 0.45 + 0.55 * hash(u + idx);
    return Math.sin(Math.PI * phase) * amp;
  }
  return null;
}

export function pickMouth(mouths: MouthShape[], level: number): MouthShape | undefined {
  if (!mouths.length) return undefined;
  let best = mouths[0];
  for (const m of mouths) if (Math.abs(m.openness - level) < Math.abs(best.openness - level)) best = m;
  return best;
}

export function mouthState(scene: Scene, ch: CharacterLayer, t: number): MouthState {
  const rate = Math.max(1, scene.mouthRate || 12);
  const step = 1 / rate;
  const tq = Math.floor(t * rate) / rate;
  const v = voiceLevel(scene, ch.id, tq, step);
  if (v !== null) return { level: v, source: 'voice', mouth: pickMouth(ch.mouths, v) };
  const tx = textLevel(scene, ch.id, tq);
  if (tx !== null) return { level: tx, source: 'text', mouth: pickMouth(ch.mouths, tx) };
  return { level: 0, source: 'silent', mouth: pickMouth(ch.mouths, 0) };
}

export function isSpeaking(scene: Scene, characterId: string, t: number): boolean {
  return scene.dialogue.some(l => l.characterId === characterId && t >= l.start && t < l.end) ||
    scene.audio.some(c => c.role === 'voice' && c.characterId === characterId && c.duration && t >= c.start && t <= c.start + c.duration);
}

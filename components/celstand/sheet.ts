// The exposure sheet (タイムシート): which drawing of each character is shown on
// every frame. It is built automatically from pose cues, lip-sync and blinks,
// then a pinned pose and hand edits are applied on top, like an animator's sheet.

import { CharacterLayer, MOUTH_SLOTS, MouthSlot, Pose, Scene } from './types';
import { mouthState, pickMouth } from './lipsync';

export interface Drawing {
  frame: number;
  pose: Pose | undefined;
  slot: MouthSlot;
  /** 0..1 mouth level used to pick an overlay mouth when the pose has no variants. */
  level: number;
  blinking: boolean;
  source: 'voice' | 'text' | 'silent' | 'edit';
}

export const sheetRate = (scene: Scene) => Math.max(1, scene.mouthRate || 12);
export const frameAt = (scene: Scene, t: number) => Math.floor(t * sheetRate(scene) + 1e-6);

export function blinkingAt(t: number, seed: string): boolean {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s += seed.charCodeAt(i);
  const period = 3.1 + (s % 17) / 10;
  const local = (t + 1.3 + (s % 7) * 0.37) % period; // never mid-blink on frame 0
  return local < 0.11;
}

const levelToSlot = (lvl: number): MouthSlot => (lvl < 0.18 ? 'closed' : lvl < 0.62 ? 'half' : 'open');
export const slotLevel = (slot: MouthSlot) => MOUTH_SLOTS.find(m => m.id === slot)!.level;

function cuedPose(ch: CharacterLayer, t: number): Pose | undefined {
  let poseId = ch.defaultPoseId;
  let bestT = -Infinity;
  for (const c of ch.poseCues) if (c.t <= t && c.t >= bestT) { bestT = c.t; poseId = c.poseId; }
  return ch.poses.find(p => p.id === poseId) || ch.poses[0];
}

/** The drawing on the sheet for this character at time t. */
export function drawingAt(scene: Scene, ch: CharacterLayer, t: number): Drawing {
  const frame = frameAt(scene, t);
  const ft = frame / sheetRate(scene);
  const edit = ch.sheetEdits?.[frame];
  if (edit) {
    const [pid, slot] = edit.split('|') as [string, MouthSlot];
    const pose = ch.poses.find(p => p.id === pid) || cuedPose(ch, ft);
    return { frame, pose, slot, level: slotLevel(slot), blinking: slot === 'blink', source: 'edit' };
  }
  const pose = (ch.pinnedPoseId && ch.poses.find(p => p.id === ch.pinnedPoseId)) || cuedPose(ch, ft);
  const m = mouthState(scene, ch, ft);
  const speaking = m.level >= 0.18;
  const blinking = ch.autoBlink && blinkingAt(ft, ch.id);
  const slot: MouthSlot = speaking ? levelToSlot(m.level) : blinking ? 'blink' : 'closed';
  return { frame, pose, slot, level: m.level, blinking, source: m.source };
}

export const drawingKey = (d: Drawing) => `${d.pose?.id ?? ''}|${d.slot}`;

/** Images to stack for a drawing: either one complete variant, or pose + overlays. */
export function drawingLayers(ch: CharacterLayer, d: Drawing): { base?: string; overlays: string[] } {
  const pose = d.pose;
  if (!pose) return { overlays: [] };
  const v = pose.variants;
  if (v && Object.keys(v).length) {
    // complete hand-drawn cels: use the exact one, or the nearest that exists
    const pick = v[d.slot] ?? (d.slot === 'blink' ? v.closed : d.slot === 'open' ? v.half ?? v.closed : v.closed) ?? pose.src;
    return { base: pick, overlays: [] };
  }
  const overlays: string[] = [];
  if ((d.blinking || d.slot === 'blink') && ch.blinkSrc) overlays.push(ch.blinkSrc);
  const level = d.source === 'edit' ? slotLevel(d.slot) : d.level;
  const mouth = pickMouth(ch.mouths, d.slot === 'blink' ? 0 : level);
  if (mouth) overlays.push(mouth.src);
  return { base: pose.src, overlays };
}

/** Frame numbers where the drawing changes (for the timeline ticks). */
export function changeFrames(scene: Scene, ch: CharacterLayer): number[] {
  const rate = sheetRate(scene);
  const n = Math.ceil(scene.duration * rate);
  const out: number[] = [];
  let prev = '';
  for (let f = 0; f < n; f++) {
    const k = drawingKey(drawingAt(scene, ch, f / rate + 1e-4));
    if (k !== prev) { out.push(f); prev = k; }
  }
  return out;
}

/** Default face area for table thumbnails: around the mouth cels, else the upper middle. */
export function faceBoxOf(ch: CharacterLayer, w: number, h: number, mouthBox?: [number, number, number, number]): [number, number, number, number] {
  if (ch.faceBox) return ch.faceBox;
  if (mouthBox) {
    const cx = mouthBox[0] + mouthBox[2] / 2, cy = mouthBox[1] + mouthBox[3] / 2;
    const fw = w * 0.42, fh = fw * 0.81;
    return [cx - fw / 2, cy - fh * 0.72, fw, fh];
  }
  return [w * 0.25, h * 0.04, w * 0.5, w * 0.5 * 0.81];
}

export { pickMouth };

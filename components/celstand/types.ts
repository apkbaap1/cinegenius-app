// Cel Stand — data model.
// Everything in a scene is plain JSON (images and audio are data URLs), so a
// project can be saved, reloaded and edited again after it is "finished".

export type AspectId = '16:9' | '9:16' | '1:1';

export const ASPECTS: Record<AspectId, { w: number; h: number; label: string }> = {
  '16:9': { w: 1920, h: 1080, label: '16:9 YouTube' },
  '9:16': { w: 1080, h: 1920, label: '9:16 Reel / Short' },
  '1:1': { w: 1080, h: 1080, label: '1:1 Feed' },
};

export interface ScrollFx {
  enabled: boolean;
  /** Stage pixels per second; negative drifts left. */
  speed: number;
}

export interface RippleFx {
  enabled: boolean;
  /** Optional mask (same size as the layer image): only its opaque pixels ripple. */
  maskSrc?: string;
  /** Up-and-down wash of a shoreline band (sea), 0 = off. */
  shoreTop?: number;
  shoreBottom?: number;
  shoreAmount?: number;
  /** Band of the layer image (0 = top, 1 = bottom) that ripples. */
  top: number;
  bottom: number;
  /** Horizontal displacement in image pixels. */
  amplitude: number;
  /** Wave length in image pixels. */
  wavelength: number;
  /** Waves per second. */
  speed: number;
}

interface LayerBase {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  /** Centre of the layer on the stage, in stage pixels. */
  x: number;
  y: number;
  scale: number;
  flip: boolean;
  /** How much the layer follows camera pans (0 = fixed sky, 1 = foreground). */
  parallax: number;
}

export interface ImageLayer extends LayerBase {
  kind: 'image';
  src: string;
  scroll: ScrollFx;
  ripple: RippleFx;
}

export interface Pose {
  id: string;
  name: string;
  /** The full character cel for this pose (transparent PNG). */
  src: string;
  /** Optional jacket/costume cel, same size and alignment as `src`, recoloured live. */
  jacketSrc?: string;
  /**
   * Optional complete drawings of this pose with the mouth (or eyes) already drawn in,
   * like hand-animated cels. When present they replace the mouth/blink overlays.
   */
  variants?: Partial<Record<MouthSlot, string>>;
}

/** Columns of the pose × mouth table (as on an animator's exposure sheet). */
export type MouthSlot = 'closed' | 'half' | 'open' | 'blink';
export const MOUTH_SLOTS: { id: MouthSlot; name: string; jp: string; level: number }[] = [
  { id: 'closed', name: 'Closed', jp: '口とじ', level: 0 },
  { id: 'half', name: 'Half', jp: '半開き', level: 0.5 },
  { id: 'open', name: 'Open', jp: '開き', level: 1 },
  { id: 'blink', name: 'Blink', jp: 'まばたき', level: 0 },
];

export interface MouthShape {
  id: string;
  name: string;
  src: string;
  /** 0 = closed, 1 = wide open. Lip-sync picks the nearest shape. */
  openness: number;
}

export interface PoseCue {
  id: string;
  t: number;
  poseId: string;
}

export interface CharacterLayer extends LayerBase {
  kind: 'character';
  poses: Pose[];
  /** Pose shown before the first cue. */
  defaultPoseId: string;
  poseCues: PoseCue[];
  /** Mouth cels, same size/alignment as the pose cels. */
  mouths: MouthShape[];
  /** Optional closed-eyes cel for automatic blinking. */
  blinkSrc?: string;
  autoBlink: boolean;
  /** Jacket colour; empty string = keep the original colours. */
  jacketColor: string;
  /** 0..1, how strongly the jacket colour is applied. */
  jacketStrength: number;
  /** 'tint' = paint with a colour, 'hue' = rotate the jacket's own colours. */
  jacketMode?: 'tint' | 'hue';
  /** Degrees, for hue mode. */
  jacketHue?: number;
  /** Pose locked by clicking the pose × mouth table; mouths keep following the dialogue. */
  pinnedPoseId?: string;
  /** Hand edits on the exposure sheet: frame index → "poseId|slot". */
  sheetEdits?: Record<number, string>;
  /** Face area in cel pixels [x, y, w, h], for the table thumbnails. */
  faceBox?: [number, number, number, number];
}

export type FxKind = 'sakura' | 'sparkles' | 'snow' | 'rain' | 'fireflies' | 'speedlines';

/** Screen-space anime effect (particles or speed lines), active between start and end. */
export interface FxLayer extends LayerBase {
  kind: 'fx';
  fx: FxKind;
  start: number;
  end: number;
  /** Rough number of particles / lines. */
  density: number;
  size: number;
  speed: number;
  /** Sideways push, -1..1. */
  wind: number;
  color: string;
  seed: number;
}

export type Layer = ImageLayer | CharacterLayer | FxLayer;

export type LookId = 'none' | 'tv' | 'skydrama' | 'pastoral' | 'retro' | 'golden' | 'night';

/** The compositing "finish" (撮影) applied over the whole frame. */
export interface Look {
  preset: LookId;
  /** Soft glow from bright areas (ディフュージョン). */
  diffusion: number;
  /** Contrast/colour punch. */
  punch: number;
  desaturate: number;
  /** Lifted, washed-out blacks (old film). */
  fade: number;
  gradeTop: string;
  gradeBottom: string;
  grade: number;
  vignette: number;
  grain: number;
  /** Sun rays / lens glow (透過光). */
  rays: number;
  raysX: number;
  raysY: number;
  raysColor: string;
  letterbox: boolean;
  /** Darkens the frame towards deep blue (day-for-night). */
  darken?: number;
}

export interface DialogueLine {
  id: string;
  characterId: string;
  start: number;
  end: number;
  text: string;
}

export type ClipRole = 'voice' | 'ambient' | 'sfx';

export interface AudioClip {
  id: string;
  name: string;
  role: ClipRole;
  src: string;
  start: number;
  gain: number;
  loop: boolean;
  /** For voice clips: whose mouth this audio drives. */
  characterId?: string;
  /** Ambience that only plays while this layer is visible (crossfades when you swap backgrounds). */
  linkLayerId?: string;
  /** Filled in after decoding (seconds). */
  duration?: number;
}

export interface CameraKey {
  id: string;
  t: number;
  x: number;
  y: number;
  zoom: number;
}

export interface Scene {
  version: 1;
  title: string;
  aspect: AspectId;
  duration: number;
  fps: number;
  background: string;
  /** Bottom of the array is drawn first. */
  layers: Layer[];
  dialogue: DialogueLine[];
  audio: AudioClip[];
  camera: CameraKey[];
  subtitles: boolean;
  /** Mouth changes per second ("on twos" at 24fps = 12). */
  mouthRate: number;
  /** Anime finish; missing in older projects = none. */
  look?: Look;
}

export const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}`;

export const defaultScroll = (): ScrollFx => ({ enabled: false, speed: -20 });
export const defaultRipple = (): RippleFx => ({
  enabled: false, top: 0.6, bottom: 1, amplitude: 4, wavelength: 26, speed: 0.6,
});

const L = (preset: LookId, p: Partial<Look>): Look => ({
  preset, diffusion: 0, punch: 0, desaturate: 0, fade: 0,
  gradeTop: '#7fb8ff', gradeBottom: '#ffb070', grade: 0,
  vignette: 0, grain: 0, rays: 0, raysX: 0.78, raysY: 0.18, raysColor: '#fff1c9', letterbox: false, ...p,
});

export const LOOKS: { id: LookId; name: string; jp: string; hint: string; look: Look }[] = [
  { id: 'none', name: 'Plain cels', jp: '素材のまま', hint: 'No finish: the cels exactly as drawn.', look: L('none', {}) },
  { id: 'tv', name: 'TV anime', jp: 'テレビアニメ', hint: 'Clean modern TV finish: light glow, crisp colours, soft vignette.',
    look: L('tv', { diffusion: 0.28, punch: 0.18, grade: 0.12, gradeTop: '#a9d2ff', gradeBottom: '#ffd7b5', vignette: 0.18 }) },
  { id: 'skydrama', name: 'Sky drama', jp: '空と光', hint: 'Saturated skies, heavy diffusion and sun rays: the dramatic film look.',
    look: L('skydrama', { diffusion: 0.55, punch: 0.32, grade: 0.32, gradeTop: '#3fa0ff', gradeBottom: '#ff9a5a', vignette: 0.28, rays: 0.65 }) },
  { id: 'pastoral', name: 'Watercolour pastoral', jp: '水彩・田園', hint: 'Soft, warm, slightly faded 90s film feel with paper-like grain.',
    look: L('pastoral', { diffusion: 0.3, desaturate: 0.18, fade: 0.12, grade: 0.25, gradeTop: '#fff3d6', gradeBottom: '#e9c79a', vignette: 0.22, grain: 0.3 }) },
  { id: 'retro', name: 'Retro 80s cel', jp: 'レトロ・セル', hint: 'Faded film stock, magenta-teal cast, strong grain.',
    look: L('retro', { diffusion: 0.22, desaturate: 0.22, fade: 0.24, grade: 0.35, gradeTop: '#5ad1c6', gradeBottom: '#ff6fa3', vignette: 0.38, grain: 0.55 }) },
  { id: 'golden', name: 'Golden hour', jp: '夕焼け', hint: 'Warm sunset grade with a low sun and long glow.',
    look: L('golden', { diffusion: 0.45, punch: 0.2, grade: 0.45, gradeTop: '#ff9d5c', gradeBottom: '#ffcf7a', vignette: 0.3, rays: 0.55, raysX: 0.82, raysY: 0.42, raysColor: '#ffd08a' }) },
  { id: 'night', name: 'Night lights', jp: '夜景', hint: 'Cool blue night with glowing highlights and dark corners.',
    look: L('night', { diffusion: 0.6, punch: 0.15, desaturate: 0.15, grade: 0.5, gradeTop: '#1d2b6b', gradeBottom: '#4a3f8f', vignette: 0.45, grain: 0.15, darken: 0.62 }) },
];

export const lookOf = (s: Scene): Look => s.look ?? LOOKS[0].look;

export const FX_PRESETS: Record<FxKind, { name: string; jp: string; density: number; size: number; speed: number; wind: number; color: string }> = {
  sakura: { name: 'Sakura petals', jp: '桜吹雪', density: 60, size: 1, speed: 1, wind: 0.35, color: '#ffc4d6' },
  sparkles: { name: 'Light particles', jp: '光の粒', density: 45, size: 1, speed: 0.6, wind: 0.05, color: '#fff6c8' },
  snow: { name: 'Snow', jp: '雪', density: 90, size: 1, speed: 0.7, wind: 0.15, color: '#ffffff' },
  rain: { name: 'Rain', jp: '雨', density: 160, size: 1, speed: 1.4, wind: -0.15, color: '#cfe3ff' },
  fireflies: { name: 'Fireflies', jp: '蛍', density: 28, size: 1, speed: 0.4, wind: 0, color: '#d9ff7a' },
  speedlines: { name: 'Speed lines', jp: '集中線', density: 90, size: 1, speed: 1, wind: 0, color: '#ffffff' },
};

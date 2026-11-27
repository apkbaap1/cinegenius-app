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
}

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
}

export type Layer = ImageLayer | CharacterLayer;

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
}

export const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}`;

export const defaultScroll = (): ScrollFx => ({ enabled: false, speed: -20 });
export const defaultRipple = (): RippleFx => ({
  enabled: false, top: 0.6, bottom: 1, amplitude: 4, wavelength: 26, speed: 0.6,
});

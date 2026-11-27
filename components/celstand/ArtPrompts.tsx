import React, { useEffect, useMemo, useState } from 'react';
import { Btn } from './ui';

// Writes image-generator prompts for anime cels that line up on the stand:
// one base cel, then edits of that same image (poses, mouths, blink), plus a
// background painting. Every prompt (with its negative) stays under 10,000 characters.

const LIMIT = 10000;

const STYLES = [
  { id: 'tv', name: 'Modern TV anime', jp: 'テレビアニメ',
    art: 'modern Japanese TV anime style, clean thin even lineart in dark brown, flat cel shading with exactly two tones (base + one hard-edged shadow), crisp highlight shapes on hair, large expressive glossy eyes with gradient irises and two white catchlights, vibrant but natural colours',
    bg: 'modern Japanese anime background art, clean shapes, bright natural colours, soft atmospheric perspective' },
  { id: 'sky', name: 'Cinematic sky drama', jp: '空と光',
    art: 'cinematic Japanese anime film style, refined lineart, two-tone cel shading with a subtle rim light, luminous saturated colours, detailed sparkling eyes',
    bg: 'highly detailed painted Japanese anime film background, dramatic towering cumulonimbus clouds, deep saturated blue sky, glowing sunlight, lens glow, every leaf and reflection rendered, photographic depth' },
  { id: 'pastoral', name: 'Watercolour pastoral', jp: '水彩・田園',
    art: 'gentle hand-drawn Japanese animation film style, soft warm palette, simple rounded features, slightly thicker soft lineart, flat gouache-like cel colours',
    bg: 'hand-painted watercolour and gouache Japanese animation background, soft edges, warm afternoon light, lush countryside greens, visible brush texture' },
  { id: 'retro', name: 'Retro 80s/90s cel', jp: 'レトロ・セル',
    art: '1980s–1990s Japanese cel animation style, hand-inked lineart, sharp angular hair, two-tone cel paint, slightly muted film colours, retro character design',
    bg: '1990s hand-painted anime background on illustration board, poster-colour paint, slightly faded film tones' },
  { id: 'shoujo', name: 'Shoujo', jp: '少女漫画風',
    art: 'shoujo anime style, delicate fine lineart, very large sparkling eyes with many highlights, long eyelashes, soft pastel palette, gentle blush',
    bg: 'soft pastel shoujo anime background, dreamy light, flowers and sparkles in the air' },
  { id: 'shounen', name: 'Shounen action', jp: '少年漫画風',
    art: 'shounen action anime style, bold confident lineart, high-contrast two-tone cel shading, sharp spiky hair, determined expression',
    bg: 'dynamic shounen anime background, strong perspective, high contrast lighting' },
  { id: 'chibi', name: 'Chibi / SD', jp: 'ちびキャラ',
    art: 'chibi super-deformed anime style, head about one third of body height, round soft shapes, simple cute face, thick clean lineart, flat bright colours',
    bg: 'cute simple anime background, rounded shapes, bright pastel colours' },
];

const MOUTHS = [
  ['mouth_0_closed', 'mouth gently closed, a small soft line'],
  ['mouth_1_small', 'mouth slightly open, small oval, like saying "u"'],
  ['mouth_2_mid', 'mouth half open, rounded anime "D" shape with a hint of tongue, like saying "e"'],
  ['mouth_3_wide', 'mouth wide open, anime "D" shape showing upper teeth and tongue, like saying "a"'],
];

const KEYS = { green: 'solid flat pure chroma-key green (#00FF00)', white: 'solid flat pure white (#FFFFFF)', magenta: 'solid flat pure magenta (#FF00FF)' };

const NEG_CHAR = 'photorealistic, 3D render, CGI, realistic skin texture, painterly character shading, soft airbrush gradients on the character, multiple characters, extra people, cropped head, cut-off hair, extra fingers, deformed hands, text, watermark, signature, logo, frame, border, background scenery, floor, cast shadow on background, gradient background, vignette, blur, depth of field, low resolution, jpeg artefacts';
const NEG_EDIT = 'changed pose, moved character, different scale, different framing, different camera angle, redrawn face, changed hair, changed clothes, changed colours, changed background colour, changed lineart thickness, any change outside the requested area, ' + NEG_CHAR;
const NEG_BG = 'people, characters, person, animals in the foreground, text, watermark, signature, logo, frame, border, photorealistic photo, 3D render, blurry, low resolution, jpeg artefacts, oversaturated noise';

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n) : s);

interface Prompt { title: string; file: string; positive: string; negative: string; note?: string }

const PromptCard: React.FC<{ p: Prompt }> = ({ p }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const total = p.positive.length + p.negative.length;
  const copy = async (what: 'all' | 'pos' | 'neg') => {
    const text = what === 'pos' ? p.positive : what === 'neg' ? p.negative : `${p.positive}\n\nNegative prompt: ${p.negative}`;
    try { await navigator.clipboard.writeText(text); setCopied(what); setTimeout(() => setCopied(null), 1200); } catch { /* clipboard blocked */ }
  };
  return (
    <div className="rounded-lg border border-base-300 bg-base-100/60 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm text-gray-100 font-medium">{p.title}</div>
          <div className="text-[10px] text-gray-500 font-mono">save as {p.file}</div>
        </div>
        <span className={`text-[10px] font-mono ${total > LIMIT ? 'text-red-400' : 'text-gray-500'}`}>{total.toLocaleString()} / {LIMIT.toLocaleString()} chars</span>
      </div>
      {p.note && <p className="text-[11px] text-amber-200/80">{p.note}</p>}
      <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{p.positive}</p>
      <p className="text-[11px] text-gray-500 whitespace-pre-wrap"><span className="text-gray-400">Negative:</span> {p.negative}</p>
      <div className="flex gap-1.5">
        <Btn tone="primary" onClick={() => copy('all')}>{copied === 'all' ? 'Copied ✓' : 'Copy both'}</Btn>
        <Btn onClick={() => copy('pos')}>{copied === 'pos' ? '✓' : 'Prompt'}</Btn>
        <Btn onClick={() => copy('neg')}>{copied === 'neg' ? '✓' : 'Negative'}</Btn>
      </div>
    </div>
  );
};

const field = 'w-full bg-base-100 border border-base-300 rounded px-2 py-1.5 text-sm text-gray-100';

const ArtPrompts: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const [style, setStyle] = useState('tv');
  const [name, setName] = useState('Kiran');
  const [desc, setDesc] = useState('Telugu college boy, about 19, warm light-brown skin, short spiky black hair, dark brown eyes, friendly smile');
  const [outfit, setOutfit] = useState('white shirt with a dark tie under an open jacket');
  const [jacket, setJacket] = useState('#2f5fa8');
  const [framing, setFraming] = useState<'bust' | 'waist'>('waist');
  const [key, setKey] = useState<keyof typeof KEYS>('green');
  const [poses, setPoses] = useState('waving with the right hand raised, laughing with eyes closed happily (^^), surprised with hands up, pointing forward confidently');
  const [scene, setScene] = useState('a grassy riverbank in a small Indian town, wide calm river, distant hills, a few utility poles with wires');
  const [time, setTime] = useState('bright summer afternoon');
  const [tab, setTab] = useState<'char' | 'bg'>('char');

  const S = STYLES.find(s => s.id === style)!;

  const prompts = useMemo(() => {
    const d = clip(desc, 600), o = clip(outfit, 300), sc = clip(scene, 600), tm = clip(time, 120);
    const frame = framing === 'bust'
      ? 'bust shot from the chest up, head in the upper third, shoulders fully inside the frame'
      : 'waist-up shot, head in the upper quarter, both arms and hands fully inside the frame';
    const lock = `Portrait canvas 2:3 (for example 1024×1536). Character centred, facing the viewer at a slight three-quarter angle, ${frame}. Fixed camera: this exact framing, scale and position will be reused for every variation.`;
    const keyBg = `Background: ${KEYS[key]}, completely uniform, nothing else on it.`;
    const jacketNote = `The jacket is one flat solid colour (${jacket}) with one darker shadow tone, clearly separated from the shirt and skin so it can be isolated as its own layer.`;
    const out: Prompt[] = [];
    out.push({
      title: '1 · Base cel (do this first)', file: `${name}_pose_neutral.png`,
      positive: `Anime character cel for 2D animation. ${S.art}.\nCharacter: ${name}, ${d}. Outfit: ${o}. ${jacketNote}\nPose: standing relaxed, arms down at the sides, neutral calm expression, eyes open, mouth closed.\n${lock}\n${keyBg}\nNo cast shadow on the background, no outline glow, sharp clean edges suitable for cutting out.`,
      negative: NEG_CHAR,
      note: 'Generate until you like it. Every other cel below is an EDIT of this exact image: upload it as the reference / input image.',
    });
    const poseList = poses.split(',').map(p => p.trim()).filter(Boolean).slice(0, 8);
    poseList.forEach((p, i) => {
      out.push({
        title: `2.${i + 1} · Pose: ${clip(p, 50)}`, file: `${name}_pose_${i + 1}.png`,
        positive: `Edit the reference image (the base cel of ${name}). Keep the identical character, art style, lineart, colours, outfit, canvas size, framing, scale and head position. Change only the pose and expression to: ${clip(p, 300)}.\nThe head stays in exactly the same place and size so the cels line up when stacked. ${S.art}.\n${keyBg}`,
        negative: NEG_EDIT.replace('changed pose, moved character, ', ''),
      });
    });
    MOUTHS.forEach(([file, m], i) => {
      out.push({
        title: `3.${i + 1} · Mouth: ${file.split('_').pop()}`, file: `${name}_${file}.png`,
        positive: `Edit the reference image (the base cel of ${name}). Change ONLY the mouth: ${m}. Every other pixel stays exactly the same: same face, eyes, hair, body, outfit, colours, framing and background. ${S.art}.`,
        negative: NEG_EDIT,
        note: i === 0 ? 'Upload these 4 together with "+ Mouth cels"; the file names keep them in closed → wide order.' : undefined,
      });
    });
    out.push({
      title: '4 · Blink (eyes closed)', file: `${name}_blink.png`,
      positive: `Edit the reference image (the base cel of ${name}). Change ONLY the eyes: both eyes gently closed, drawn as soft curved anime eyelid lines with lashes, relaxed. Every other pixel stays exactly the same. ${S.art}.`,
      negative: NEG_EDIT,
    });
    return out;
  }, [S, name, desc, outfit, jacket, framing, key, poses]);

  const bgPrompt: Prompt = useMemo(() => ({
    title: 'Background painting (one image, split on the stand)', file: 'background.png',
    positive: `Anime background art for 2D animation, no characters. ${S.bg}.\nScene: ${clip(scene, 600)}. Time: ${clip(time, 120)}.\nWide 16:9 landscape (for example 1920×1080), eye-level camera, horizon at about half height. Open sky across the top half with distinct, bright white clouds separated by clear sky (so they can be lifted onto their own layer and drift). If there is water, keep it in a clear horizontal band below the horizon. Leave the lower centre open and uncluttered where characters will stand.`,
    negative: NEG_BG,
    note: 'Open it with "✂ Background from 1 painting" to split it into sky, clouds and scenery.',
  }), [S, scene, time]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-3" onClick={onClose}>
      <div className="bg-base-200 border border-base-300 rounded-xl w-full max-w-4xl max-h-[94vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-base-300">
          <div>
            <h3 className="font-semibold text-gray-100">Anime art prompts · 作画プロンプト</h3>
            <p className="text-[11px] text-gray-400">Prompts for an image generator that give you cels which line up on the stand. Each stays under 10,000 characters, including the negative prompt.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="overflow-auto p-4 space-y-4">
          <div>
            <div className="text-[11px] text-gray-400 mb-1">Anime style</div>
            <div className="flex flex-wrap gap-1.5">
              {STYLES.map(s => (
                <button key={s.id} onClick={() => setStyle(s.id)}
                  className={`rounded-md px-2.5 py-1.5 text-left border ${style === s.id ? 'border-violet-400 bg-violet-500/20' : 'border-base-300 hover:bg-base-300/50'}`}>
                  <div className="text-xs text-gray-100">{s.jp}</div>
                  <div className="text-[10px] text-gray-400">{s.name}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex rounded-md overflow-hidden border border-base-300 w-fit">
            <button onClick={() => setTab('char')} className={`px-3 py-1.5 text-xs ${tab === 'char' ? 'bg-violet-600 text-white' : 'text-gray-400'}`}>Character cels</button>
            <button onClick={() => setTab('bg')} className={`px-3 py-1.5 text-xs ${tab === 'bg' ? 'bg-violet-600 text-white' : 'text-gray-400'}`}>Background</button>
          </div>
          {tab === 'char' ? (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="text-[11px] text-gray-400">Name<input className={field} value={name} maxLength={40} onChange={e => setName(e.target.value.replace(/[^\w\- ]/g, ''))} /></label>
                <label className="text-[11px] text-gray-400">Outfit<input className={field} value={outfit} maxLength={300} onChange={e => setOutfit(e.target.value)} /></label>
                <label className="text-[11px] text-gray-400 sm:col-span-2">Who they are (age, skin, hair, eyes, vibe)<textarea className={field} rows={2} value={desc} maxLength={600} onChange={e => setDesc(e.target.value)} /></label>
                <label className="text-[11px] text-gray-400 sm:col-span-2">Extra poses (comma separated, up to 8)<textarea className={field} rows={2} value={poses} maxLength={1200} onChange={e => setPoses(e.target.value)} /></label>
                <div className="flex flex-wrap items-center gap-3 sm:col-span-2 text-[11px] text-gray-400">
                  <label className="flex items-center gap-1.5">Jacket <input type="color" value={jacket} onChange={e => setJacket(e.target.value)} className="w-7 h-6 bg-transparent" /></label>
                  <label className="flex items-center gap-1.5">Framing
                    <select className="bg-base-100 border border-base-300 rounded px-1.5 py-1 text-xs text-gray-100" value={framing} onChange={e => setFraming(e.target.value as 'bust' | 'waist')}>
                      <option value="waist">Waist-up</option><option value="bust">Bust</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-1.5">Cut-out background
                    <select className="bg-base-100 border border-base-300 rounded px-1.5 py-1 text-xs text-gray-100" value={key} onChange={e => setKey(e.target.value as keyof typeof KEYS)}>
                      <option value="green">Green screen</option><option value="white">White</option><option value="magenta">Magenta</option>
                    </select>
                  </label>
                </div>
              </div>
              <div className="rounded-lg bg-violet-500/10 border border-violet-500/30 p-3 text-[11px] text-gray-300 space-y-1">
                <div className="font-medium text-gray-100">How to get cels that line up</div>
                <div>1. Generate the <b>base cel</b>. 2. For every other cel, give the generator the base image as the input and use the <b>edit</b> prompt, so the canvas, scale and head position stay put. 3. In Cel Stand: <b>+ Character → + Pose cels / + Mouth cels / closed-eyes cel</b> (the flat background is removed automatically). 4. On a pose, <b>Jacket…</b> lifts the jacket onto its own cel for recolouring.</div>
              </div>
              <div className="space-y-3">{prompts.map(p => <PromptCard key={p.file} p={p} />)}</div>
            </>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="text-[11px] text-gray-400 sm:col-span-2">Place<textarea className={field} rows={2} value={scene} maxLength={600} onChange={e => setScene(e.target.value)} /></label>
                <label className="text-[11px] text-gray-400">Time / weather<input className={field} value={time} maxLength={120} onChange={e => setTime(e.target.value)} /></label>
              </div>
              <PromptCard p={bgPrompt} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtPrompts;

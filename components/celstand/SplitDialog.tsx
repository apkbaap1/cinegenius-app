import React, { useState } from 'react';
import { Btn, FileBtn, Slider } from './ui';
import { fileToDataURL } from './assets';
import { SplitResult, splitBackground } from './imageTools';

interface Props {
  onClose: () => void;
  onAdd: (r: SplitResult, water: { top: number; bottom: number } | null) => void;
}

const checker = 'bg-[repeating-conic-gradient(#374151_0%_25%,#1f2937_0%_50%)] bg-[length:14px_14px]';

/** Turns one background painting into three cels: sky, clouds, scenery. */
const SplitDialog: React.FC<Props> = ({ onClose, onAdd }) => {
  const [src, setSrc] = useState<string | null>(null);
  const [horizon, setHorizon] = useState(0.5);
  const [feather, setFeather] = useState(0.04);
  const [clouds, setClouds] = useState(0.5);
  const [water, setWater] = useState(true);
  const [wTop, setWTop] = useState(0.62);
  const [wBot, setWBot] = useState(0.85);
  const [result, setResult] = useState<SplitResult | null>(null);
  const [busy, setBusy] = useState(false);

  const preview = async () => {
    if (!src) return;
    setBusy(true);
    try { setResult(await splitBackground(src, horizon, feather, clouds)); } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-base-200 border border-base-300 rounded-xl w-full max-w-3xl max-h-[92vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-base-300">
          <h3 className="font-semibold text-gray-100">Split one painting into sky · clouds · scenery</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="p-4 space-y-4">
          {!src ? (
            <div className="text-center py-10 space-y-3">
              <p className="text-sm text-gray-400">Upload a single background image (e.g. from an image generator). The sky becomes a clean gradient cel, bright clouds are lifted onto their own cel so they can drift, and the land/water becomes the scenery cel.</p>
              <FileBtn tone="primary" accept="image/*" onFiles={async ([f]) => { setSrc(await fileToDataURL(f)); setResult(null); }}>Choose background painting</FileBtn>
            </div>
          ) : (
            <>
              <div className="relative">
                <img src={src} alt="" className="w-full rounded" />
                <div className="absolute left-0 right-0 border-t-2 border-dashed border-yellow-300" style={{ top: `${horizon * 100}%` }}>
                  <span className="absolute right-1 -top-5 text-[10px] bg-yellow-300 text-black px-1 rounded">horizon</span>
                </div>
                {water && (
                  <div className="absolute left-0 right-0 bg-sky-400/25 border-y border-sky-300" style={{ top: `${wTop * 100}%`, height: `${Math.max(0, wBot - wTop) * 100}%` }}>
                    <span className="absolute left-1 top-0.5 text-[10px] bg-sky-300 text-black px-1 rounded">water ripple</span>
                  </div>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Slider label="Horizon (sky above, scenery below)" value={horizon} min={0.05} max={0.95} onChange={v => { setHorizon(v); setResult(null); }} fmt={v => `${Math.round(v * 100)}%`} />
                  <Slider label="Soft edge" value={feather} min={0} max={0.2} onChange={v => { setFeather(v); setResult(null); }} fmt={v => `${Math.round(v * 100)}%`} />
                  <Slider label="Cloud pickup" value={clouds} min={0} max={1} onChange={v => { setClouds(v); setResult(null); }} fmt={v => `${Math.round(v * 100)}%`} />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-gray-300"><input type="checkbox" checked={water} onChange={e => setWater(e.target.checked)} className="accent-violet-500" /> Scenery has water that should ripple</label>
                  {water && <>
                    <Slider label="Water top" value={wTop} min={0} max={1} onChange={v => setWTop(Math.min(v, wBot))} fmt={v => `${Math.round(v * 100)}%`} />
                    <Slider label="Water bottom" value={wBot} min={0} max={1} onChange={v => setWBot(Math.max(v, wTop))} fmt={v => `${Math.round(v * 100)}%`} />
                  </>}
                </div>
              </div>
              {result && (
                <div className="grid grid-cols-3 gap-2">
                  {([['Sky', result.sky], ['Clouds', result.clouds], ['Scenery', result.scenery]] as const).map(([n, s]) => (
                    <figure key={n}>
                      <img src={s} alt={n} className={`w-full rounded ${checker}`} />
                      <figcaption className="text-[11px] text-gray-400 mt-1 text-center">{n}</figcaption>
                    </figure>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2 justify-end">
                <FileBtn accept="image/*" onFiles={async ([f]) => { setSrc(await fileToDataURL(f)); setResult(null); }}>Other image</FileBtn>
                <Btn onClick={preview} disabled={busy}>{busy ? 'Splitting…' : 'Preview split'}</Btn>
                <Btn tone="primary" disabled={busy} onClick={async () => {
                  let r = result;
                  if (!r && src) { setBusy(true); try { r = await splitBackground(src, horizon, feather, clouds); } finally { setBusy(false); } }
                  if (r) onAdd(r, water ? { top: wTop, bottom: wBot } : null);
                }}>Add as 3 layers</Btn>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SplitDialog;

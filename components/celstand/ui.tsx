import React, { useRef } from 'react';

export const Section: React.FC<{ title: string; right?: React.ReactNode; children: React.ReactNode }> = ({ title, right, children }) => (
  <div className="border-b border-base-300 px-3 py-3">
    <div className="flex items-center justify-between mb-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{title}</h4>
      {right}
    </div>
    <div className="space-y-2">{children}</div>
  </div>
);

export const Btn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'primary' | 'ghost' | 'danger' }> = ({ tone = 'ghost', className = '', ...p }) => {
  const tones = {
    primary: 'bg-brand-primary hover:bg-brand-secondary text-white',
    ghost: 'bg-base-300/60 hover:bg-base-300 text-gray-200',
    danger: 'bg-red-900/50 hover:bg-red-800 text-red-100',
  };
  return (
    <button
      {...p}
      className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${tones[tone]} ${className}`}
    />
  );
};

export const FileBtn: React.FC<{
  accept: string; multiple?: boolean; onFiles: (files: File[]) => void; children: React.ReactNode; tone?: 'primary' | 'ghost'; className?: string; title?: string;
}> = ({ accept, multiple, onFiles, children, tone = 'ghost', className = '', title }) => {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <Btn tone={tone} className={className} title={title} onClick={() => ref.current?.click()}>{children}</Btn>
      <input
        ref={ref} type="file" accept={accept} multiple={multiple} className="hidden"
        onChange={e => { const f = Array.from(e.target.files || []); e.target.value = ''; if (f.length) onFiles(f); }}
      />
    </>
  );
};

export const Slider: React.FC<{
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; fmt?: (v: number) => string;
}> = ({ label, value, min, max, step = 0.01, onChange, fmt }) => (
  <label className="block">
    <div className="flex justify-between text-[11px] text-gray-400 mb-0.5">
      <span>{label}</span>
      <span className="font-mono text-gray-300">{fmt ? fmt(value) : value.toFixed(2)}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      className="w-full accent-violet-500" />
  </label>
);

export const NumField: React.FC<{ label: string; value: number; step?: number; onChange: (v: number) => void; className?: string }> = ({ label, value, step = 1, onChange, className = '' }) => (
  <label className={`flex items-center gap-1.5 text-[11px] text-gray-400 ${className}`}>
    <span className="shrink-0">{label}</span>
    <input type="number" step={step} value={Number.isFinite(value) ? Math.round(value * 1000) / 1000 : 0}
      onChange={e => { const v = parseFloat(e.target.value); if (Number.isFinite(v)) onChange(v); }}
      className="w-full min-w-0 bg-base-100 border border-base-300 rounded px-1.5 py-1 text-xs text-gray-200 font-mono" />
  </label>
);

export const Toggle: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="accent-violet-500" />
    {label}
  </label>
);

export const fmtTime = (t: number) => {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`;
};

// KALIYA-5 — the console overlay: a fixed 1600 x 900 layout of buttons, readouts, the joint-wave chart, callouts with
// leaders, the step caption and the tour cursor. update(...) redraws everything from the frame's numbers.
import {ACCENT} from './robot.js';
import {SPEC} from './kin.js';

export const W = 1600;
export const H = 900;
const C = {ink: '#17302d', dim: 'rgba(23,48,45,.62)', mute: 'rgba(23,48,45,.45)', line: 'rgba(23,48,45,.2)', panel: 'rgba(240,245,244,.86)', accent: ACCENT};

const CSS = `
#app{font-family:Inter,system-ui,sans-serif;color:${C.ink};-webkit-font-smoothing:antialiased;font-variant-numeric:tabular-nums}
.kc{position:absolute;inset:0;pointer-events:none}
.pn{position:absolute;background:${C.panel};border:1px solid ${C.line};backdrop-filter:blur(6px)}
.hd{font-size:11px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:${C.dim};white-space:nowrap}
.hd i{font-style:normal;color:${C.accent};margin-right:6px}
.kb{position:absolute;height:26px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;letter-spacing:1.3px;border:1px solid ${C.line};background:rgba(250,252,252,.92);color:${C.ink};pointer-events:auto;cursor:pointer;user-select:none}
.kb:hover{background:#fff}
.kb.on{background:${C.ink};color:#f3f7f6;border-color:${C.ink}}
.kb.on.ac{background:${C.accent};border-color:${C.accent};color:#fff}
.rl{position:absolute;left:14px;right:14px;display:flex;justify-content:space-between;align-items:baseline}
.rl .l{font-size:10.5px;font-weight:600;letter-spacing:1.2px;color:${C.mute};text-transform:uppercase}
.rl .v{font:600 15px 'JetBrains Mono',monospace;color:${C.ink}}
.rl .v small{font-size:10.5px;color:${C.mute};margin-left:3px}
.call{position:absolute;white-space:nowrap;transform:translateY(-50%)}
.call b{display:block;font-size:12px;font-weight:700;letter-spacing:1.3px}
.call span{display:block;font-size:10.5px;letter-spacing:.8px;color:${C.dim};margin-top:2px}
.cap{position:absolute;left:300px;width:1000px;top:700px;text-align:center}
.cap .n{font:700 11px 'JetBrains Mono',monospace;letter-spacing:2px;color:${C.accent}}
.cap .t{font-size:19px;font-weight:600;letter-spacing:.2px;margin-top:4px;text-shadow:0 0 10px rgba(240,245,244,.9),0 0 3px rgba(240,245,244,1)}
.cur{position:absolute;width:22px;height:22px;margin:-3px 0 0 -3px;pointer-events:none;z-index:5}
.ring{position:absolute;border:2px solid ${C.accent};border-radius:50%;pointer-events:none}
.tourchip{position:absolute;left:800px;top:22px;transform:translateX(-50%);display:flex;align-items:center;gap:8px;height:26px;padding:0 14px;border:1px solid ${C.line};background:rgba(250,252,252,.94);font:700 10.5px Inter,sans-serif;letter-spacing:1.5px;white-space:nowrap;cursor:pointer;pointer-events:auto}
.tourchip i{display:block;width:7px;height:7px;border-radius:50%;background:${C.accent}}
.tourchip.on i{animation:blink 1.2s steps(2) infinite}
@keyframes blink{50%{opacity:.15}}
`;

export const MODES = [
  ['coil', 'COIL / GUARD'],
  ['slither', 'SLITHER'],
  ['swim', 'SWIM'],
  ['strike', 'STRIKE'],
];
export const PARTS = [
  ['spine', 'SPINE + ACTUATORS'],
  ['power', 'POWER PACKS'],
  ['necks', 'NECKS'],
  ['heads', 'HEADS + SENSORS'],
  ['hood', 'HOOD'],
  ['core', 'CORE COMPUTER'],
  ['tail', 'TAIL PADDLE'],
];
export const TOOLS = [
  ['build', '▶ ASSEMBLE'],
  ['explode', 'EXPLODE'],
  ['xray', 'X-RAY'],
  ['flare', 'FLARE HOOD'],
  ['track', 'TRACK TARGET'],
];
export const VIEWS = [
  ['hero', 'HERO'],
  ['side', 'SIDE'],
  ['top', 'TOP'],
  ['face', 'HEADS'],
  ['inside', 'INSIDE'],
];

export function createConsole(app) {
  const st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);
  const root = document.createElement('div');
  root.className = 'kc';
  app.appendChild(root);
  const add = (html) => {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    const n = t.content.firstChild;
    root.appendChild(n);
    return n;
  };

  // svg layer for leaders
  const svg = add(`<svg width="${W}" height="${H}" style="position:absolute;left:0;top:0;overflow:visible"></svg>`);

  // title
  add(`<div style="position:absolute;left:30px;top:20px;font-size:34px;font-weight:600;letter-spacing:.5px;line-height:1">KALIYA<span style="color:${C.accent}">-5</span></div>`);
  add(`<div class="hd" style="position:absolute;left:31px;top:62px;color:${C.ink}">FIVE-HEADED SERPENT ROBOT · TEARDOWN SIMULATOR</div>`);
  add(`<div class="hd" style="position:absolute;right:30px;top:27px;font-size:10px;color:${C.mute}">DRAG ORBIT · WHEEL ZOOM · 1–5 VIEWS · E EXPLODE · X X-RAY · SPACE PAUSE</div>`);

  // ---------------- left column: buttons
  const btn = {};
  const col = (title, items, y, accentOn = false) => {
    add(`<div class="hd" style="position:absolute;left:30px;top:${y}px"><i>■</i>${title}</div>`);
    items.forEach(([k, label], n) => {
      btn[k] = add(`<div class="kb${accentOn ? ' acc' : ''}" style="left:30px;top:${y + 20 + n * 31}px;width:196px">${label}</div>`);
      if (accentOn) btn[k].classList.add('ac');
    });
    return y + 20 + items.length * 31 + 16;
  };
  let y = 104;
  y = col('MODE', MODES, y);
  y = col('ANATOMY · ISOLATE', PARTS, y, true);
  y = col('TOOLS', TOOLS, y);
  // views in a row at the bottom right
  VIEWS.forEach(([k, label], n) => {
    btn[k] = add(`<div class="kb" style="left:${1170 + (n % 3) * 132 - (n >= 3 ? -66 : 0)}px;top:${n < 3 ? 816 : 847}px;width:124px">${label}</div>`);
  });
  add(`<div class="hd" style="position:absolute;left:1170px;top:796px"><i>■</i>CAMERA</div>`);

  // ---------------- right column: readouts
  const RX = 1336;
  const RW = 236;
  add(`<div class="pn" style="left:${RX}px;top:92px;width:${RW}px;height:470px"></div>`);
  add(`<div class="hd" style="position:absolute;left:${RX + 14}px;top:104px"><i>■</i>LIVE TELEMETRY</div>`);
  const rows = [
    ['speed', 'SPEED', 'm/s'],
    ['freq', 'GAIT FREQ', 'Hz'],
    ['lambda', 'WAVELENGTH', 'm'],
    ['alpha', 'WINDING α', '°'],
    ['maxJoint', 'PEAK JOINT', '°'],
    ['power', 'POWER DRAW', 'kW'],
    ['endurance', 'ENDURANCE', 'h'],
    ['hoodAngle', 'HOOD RIBS', '°'],
    ['jawDeg', 'JAW', '°'],
    ['headHeight', 'HEAD HEIGHT', 'm'],
    ['headSpeed', 'HEAD SPEED', 'm/s'],
  ];
  const val = {};
  rows.forEach(([k, l, u], n) => {
    const r = add(`<div class="rl" style="top:${130 + n * 27}px;left:${RX + 14}px;right:auto;width:${RW - 28}px"><span class="l">${l}</span><span class="v"><em style="font-style:normal">–</em><small>${u}</small></span></div>`);
    val[k] = r.querySelector('em');
  });
  // trunk torque bar
  const TY = 434;
  add(`<div class="hd" style="position:absolute;left:${RX + 14}px;top:${TY}px">TRUNK BASE TORQUE</div>`);
  const tqV = add(`<div style="position:absolute;left:${RX + 14}px;top:${TY + 18}px;font:600 22px 'JetBrains Mono',monospace">–</div>`);
  add(`<div style="position:absolute;left:${RX + 14}px;top:${TY + 52}px;width:${RW - 28}px;height:10px;background:rgba(23,48,45,.1)"></div>`);
  const tqBar = add(`<div style="position:absolute;left:${RX + 14}px;top:${TY + 52}px;width:0;height:10px;background:${C.ink}"></div>`);
  const tqL = add(`<div class="hd" style="position:absolute;left:${RX + 14}px;top:${TY + 68}px;font-size:10px;color:${C.mute}">–</div>`);
  // spec block
  add(`<div class="pn" style="left:${RX}px;top:572px;width:${RW}px;height:196px"></div>`);
  add(`<div class="hd" style="position:absolute;left:${RX + 14}px;top:584px"><i>■</i>BUILD SHEET</div>`);
  const spec = [
    ['LENGTH', `${(SPEC.nGround * SPEC.segL + SPEC.nTrunk * SPEC.trunkL).toFixed(1)} m`],
    ['MASS', `${SPEC.mass.toFixed(0)} kg`],
    ['BODY MODULES', `${SPEC.nGround} + ${SPEC.nTrunk} trunk`],
    ['NECKS', `${SPEC.heads} × ${SPEC.nNeck} seg`],
    ['ACTUATED JOINTS', `${SPEC.joints}`],
    ['BATTERY', `${SPEC.nPacks} × ${SPEC.packKWh} = ${SPEC.capacityKWh.toFixed(1)} kWh`],
  ];
  spec.forEach(([l, v], n) => add(`<div class="rl" style="top:${608 + n * 25}px;left:${RX + 14}px;right:auto;width:${RW - 28}px"><span class="l">${l}</span><span class="v" style="font-size:12.5px">${v}</span></div>`));

  // ---------------- bottom: the joint wave chart
  const CX = 250;
  const CY = 784;
  const CW = 890;
  const CH = 92;
  add(`<div class="pn" style="left:${CX}px;top:${CY}px;width:${CW}px;height:${CH + 12}px"></div>`);
  add(`<div class="hd" style="position:absolute;left:${CX + 12}px;top:${CY + 8}px"><i>■</i>JOINT ANGLES · HEAD → TAIL</div>`);
  const chartLbl = add(`<div class="hd" style="position:absolute;right:${W - CX - CW + 12}px;top:${CY + 8}px;font-size:10px;color:${C.mute}">φᵢ = −2α·sin(β/2)·sin(ψ + β(i+½))</div>`);
  const chart = add(`<svg style="position:absolute;left:${CX + 12}px;top:${CY + 26}px" width="${CW - 24}" height="${CH - 22}"></svg>`);

  // ---------------- caption, callouts, cursor
  const cap = add(`<div class="cap"><div class="n"></div><div class="t"></div></div>`);
  const callBox = add(`<div style="position:absolute;inset:0"></div>`);
  const ringEl = add(`<div class="ring" style="display:none"></div>`);
  const cur = add(
    `<svg class="cur" viewBox="0 0 22 22"><path d="M3 2 L3 18 L7.5 14 L10.5 20.5 L13 19.3 L10 13 L16 13 Z" fill="#fff" stroke="${C.ink}" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  );
  const tourChip = add(`<div class="tourchip"></div>`);

  const centre = (el) => {
    const x = parseFloat(el.style.left) + parseFloat(el.style.width) / 2;
    const y = parseFloat(el.style.top) + 13;
    return [x, y];
  };

  const fmt = (v, d) => (Number.isFinite(v) ? v.toFixed(d) : '–');
  let lastCap = '';

  return {
    root,
    btn,
    tourChip,
    spot: (k) => centre(btn[k]),
    setOn(states) {
      for (const [k, on] of Object.entries(states)) btn[k]?.classList.toggle('on', !!on);
    },
    caption(n, text) {
      const key = n + text;
      if (key === lastCap) return;
      lastCap = key;
      cap.querySelector('.n').textContent = n;
      cap.querySelector('.t').textContent = text;
    },
    readouts(r, extra) {
      val.speed.textContent = fmt(r.speed, 2);
      val.freq.textContent = fmt(r.freq, 2);
      val.lambda.textContent = fmt(r.lambda, 1);
      val.alpha.textContent = fmt((r.alpha * 180) / Math.PI, 0);
      val.maxJoint.textContent = fmt((r.maxJoint * 180) / Math.PI, 1);
      val.power.textContent = fmt(r.power / 1000, 2);
      val.endurance.textContent = r.endurance > 99 ? '99+' : fmt(r.endurance, 1);
      val.hoodAngle.textContent = fmt(r.hoodAngle, 0);
      val.jawDeg.textContent = fmt(r.jawDeg, 0);
      val.headHeight.textContent = fmt(r.headHeight, 2);
      val.headSpeed.textContent = fmt(extra.headSpeed, 2);
      tqV.innerHTML = `${fmt(r.trunkTorque, 2)}<small style="font-size:12px;color:${C.mute};margin-left:4px">kN·m</small>`;
      const load = Math.min(1, r.trunkLoad);
      tqBar.style.width = `${(load * (RW - 28)).toFixed(1)}px`;
      tqBar.style.background = r.trunkLoad > 0.8 ? C.accent : C.ink;
      tqL.textContent = `${(r.trunkLoad * 100).toFixed(0)}% OF ${(SPEC.trunkJointTorque / 1000).toFixed(1)} kN·m · ${r.mAbove.toFixed(0)} kg ABOVE`;
    },
    chart(jointYaw, trunkPitch, hot) {
      const w = CW - 24;
      const h = CH - 22;
      const n = trunkPitch.length + jointYaw.length;
      const bw = w / n;
      const mid = h / 2;
      let s = `<line x1="0" x2="${w}" y1="${mid}" y2="${mid}" stroke="${C.line}" stroke-width="1"/>`;
      const vals = [...trunkPitch.map((v) => ['t', v]), ...jointYaw.map((v) => ['y', v])];
      vals.forEach(([kind, v], i) => {
        const a = Math.max(-1, Math.min(1, v / 0.6));
        const bh = Math.abs(a) * (mid - 4);
        const x = i * bw + 1;
        const yy = a > 0 ? mid - bh : mid;
        const fill = kind === 't' ? C.ink : hot ? C.accent : '#3f7d74';
        s += `<rect x="${x.toFixed(1)}" y="${yy.toFixed(1)}" width="${(bw - 2).toFixed(1)}" height="${Math.max(1, bh).toFixed(1)}" fill="${fill}"/>`;
      });
      s += `<text x="0" y="${h}" font-size="9.5" fill="${C.mute}" font-family="JetBrains Mono">TRUNK PITCH ×${trunkPitch.length}</text>`;
      s += `<text x="${trunkPitch.length * bw + 4}" y="${h}" font-size="9.5" fill="${C.mute}" font-family="JetBrains Mono">BODY YAW ×${jointYaw.length}  (±34°)</text>`;
      chart.innerHTML = s;
    },
    callouts(list) {
      // list: [{x, y, title, sub, side}] in stage px; labels sit in a margin column on their side
      let s = '';
      let h = '';
      const used = {l: [], r: []};
      for (const c of list) {
        const side = c.side ?? (c.x < 760 ? 'l' : 'r');
        let ly = Math.max(120, Math.min(690, c.y + (c.dy ?? -40)));
        // keep labels apart
        for (const u of used[side]) if (Math.abs(u - ly) < 46) ly = u + 46;
        used[side].push(ly);
        const lx = side === 'l' ? Math.max(470, c.x - (c.dx ?? 150)) : Math.min(1120, c.x + (c.dx ?? 150));
        s += `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="4.5" fill="${c.lit ? C.accent : '#fff'}" stroke="${C.ink}" stroke-width="1.4"/>`;
        s += `<polyline points="${c.x.toFixed(1)},${c.y.toFixed(1)} ${lx.toFixed(1)},${ly.toFixed(1)} ${(lx + (side === 'l' ? -14 : 14)).toFixed(1)},${ly.toFixed(1)}" fill="none" stroke="${C.ink}" stroke-width="1.2"/>`;
        const tx = side === 'l' ? lx - 20 : lx + 20;
        h += `<div class="call" style="${side === 'l' ? `right:${(W - tx).toFixed(1)}px;text-align:right` : `left:${tx.toFixed(1)}px`};top:${ly.toFixed(1)}px"><b>${c.title}</b><span>${c.sub}</span></div>`;
      }
      svg.innerHTML = s;
      callBox.innerHTML = h;
    },
    pointer(c) {
      cur.style.transform = `translate(${c.x}px,${c.y}px) scale(${c.press ? 0.86 : 1})`;
      cur.style.display = c.x < 0 ? 'none' : 'block';
      if (c.ring > 0) {
        const r = 10 + (1 - c.ring) * 26;
        Object.assign(ringEl.style, {display: 'block', left: `${c.ringX - r}px`, top: `${c.ringY - r}px`, width: `${r * 2}px`, height: `${r * 2}px`, opacity: c.ring});
      } else ringEl.style.display = 'none';
    },
    chartLbl,
  };
}

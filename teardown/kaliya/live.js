// KALIYA-5 — the page you drive. The console (console.js) over the stage (stage.js), the robot (robot.js) posed from
// kin.js every frame. Left alone it plays SCRIPT as an auto tour with a cursor; any click, drag, wheel or key hands
// control to the visitor, and 25 s of quiet hands it back.
import * as THREE from 'three';
import {pose, readouts, smooth, STATE0, SPEC} from './kin.js';
import {buildRobot} from './robot.js';
import {createStage} from './stage.js';
import {createConsole, H, MODES, PARTS, TOOLS, VIEWS, W} from './console.js';

const IDLE = 25;
const D2R = Math.PI / 180;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ss = (a, b, t) => smooth((t - a) / (b - a));
const wrap = (d) => Math.atan2(Math.sin(d), Math.cos(d));

// ------------------------------------------------------------------ modes: the targets each one sets
const MODE = {
  coil: {coil: 1, freq: 0, raise: 1, swim: 0, alpha: 0.55},
  slither: {coil: 0, freq: 0.42, raise: 0.85, swim: 0, alpha: 0.55},
  swim: {coil: 0, freq: 0.62, raise: 0.78, swim: 1, alpha: 0.62},
  strike: {coil: 1, freq: 0, raise: 1, swim: 0, alpha: 0.55},
};

// ------------------------------------------------------------------ the tour
// at: the click; btn: what the cursor presses; n/cap: the caption
export const SCRIPT = [
  {at: 0.6, btn: 'build', n: '01 · ASSEMBLY', cap: '36 spine modules dock tail-first, then the trunk, the core, five necks and five heads'},
  {at: 11, btn: 'explode', n: '02 · EXPLODED VIEW', cap: 'Every module is the same part: armour shell, belly plate, two actuators, a spine bus'},
  {at: 16.5, btn: 'xray', n: '03 · X-RAY', cap: 'The armour turns to glass so the drivetrain inside shows'},
  {at: 21, btn: 'power', n: '04 · POWER', cap: `${SPEC.nPacks} Li-ion packs of ${SPEC.packKWh} kWh ride in the mid-body: ${SPEC.capacityKWh.toFixed(1)} kWh in all`},
  {at: 26, btn: 'spine', n: '05 · SPINE', cap: `Each body joint has a yaw and a pitch harmonic drive, ${SPEC.motorTorque} N·m each, ${SPEC.joints} joints in total`},
  {at: 31, btn: 'explode', n: '05 · SPINE', cap: 'The modules close back up'},
  {at: 32.6, btn: 'xray', n: '05 · SPINE', cap: 'The armour goes back on'},
  {at: 34.5, btn: 'slither', n: '06 · SLITHER', cap: 'A serpenoid wave runs from head to tail and pushes the body forward along its own path'},
  {at: 44, btn: 'flare', n: '07 · HOOD', cap: 'Eight ribs per head swing from 17° to 86° on linear actuators and stretch the membrane'},
  {at: 48.5, btn: 'track', n: '08 · TRACKING', cap: 'Stereo eyes and the centre head’s LIDAR lock on, and all five necks turn together'},
  {at: 54, btn: 'strike', n: '09 · STRIKE', cap: 'The trunk tips forward, the necks extend 42% and the jaws open to 63°'},
  {at: 60.5, btn: 'swim', n: '10 · SWIM', cap: 'A wider, faster wave and a tail paddle. In water, drag replaces belly friction'},
  {at: 69.5, btn: 'coil', n: '11 · GUARD', cap: 'Coiled and reared with the hood up, it holds the pose on 0.4 kW'},
];
export const DURATION = 76;
// view the tour uses from each time
const TOUR_VIEWS = [
  [0, 'full'],
  [11, 'side'],
  [21, 'inside'],
  [26, 'side'],
  [34.5, 'hero'],
  [44, 'face'],
  [54, 'hero'],
  [60.5, 'side'],
  [69.5, 'hero'],
];

// camera views: functions of the time since the view started and the pose
// the body's centre and reach, so a view frames a coil and a 10 m slither alike
const bounds = (P) => {
  let x = 0;
  let z = 0;
  for (const g of P.ground) {
    x += g.pos[0];
    z += g.pos[2];
  }
  x = (x / P.ground.length) * 0.75 + P.hub.pos[0] * 0.25;
  z = (z / P.ground.length) * 0.75 + P.hub.pos[2] * 0.25;
  let e = 0;
  for (const g of P.ground) e = Math.max(e, Math.hypot(g.pos[0] - x, g.pos[2] - z));
  e = Math.max(e, Math.hypot(P.heads[2].pos[0] - x, P.heads[2].pos[2] - z), P.heads[2].pos[1] * 0.8);
  return {x, z, e};
};
const VIEW_FN = {
  full: (t, P, B) => ({tx: B.x, ty: 1.0 + 0.9 * P.explode, tz: B.z, az: 38 + t * 2.2, el: 20, d: (3 + B.e * 2.3) * (1 + 0.3 * P.explode)}),
  hero: (t, P, B) => ({tx: P.hub.pos[0] - 0.4, ty: 1.4, tz: P.hub.pos[2] * 0.6 + B.z * 0.4, az: 30 + 6 * Math.sin(t * 0.15), el: 12, d: 8.4}),
  side: (t, P, B) => ({tx: B.x + 0.4, ty: 0.9 + 0.9 * P.explode, tz: B.z, az: 72 + t * 0.6, el: 15, d: (3.4 + B.e * 2.3) * (1 + 0.3 * P.explode)}),
  top: (t, P, B) => ({tx: B.x, ty: 0, tz: B.z, az: 90, el: 80, d: 4 + B.e * 2.4}),
  face: (t, P) => ({tx: P.heads[2].pos[0] - 0.25, ty: P.heads[2].pos[1] - 0.15, tz: P.heads[2].pos[2], az: 24 + 4 * Math.sin(t * 0.3), el: 9, d: 4.1}),
  inside: (t, P) => ({tx: P.ground[10].pos[0], ty: 0.3, tz: P.ground[10].pos[2], az: 52 + t * 2, el: 30, d: 3.4}),
};

// callouts per focus
const CALLS = {
  build: [
    ['core', 'CORE COMPUTER', 'IMU · radio · 2 GPUs'],
    ['trunk', 'TRUNK · 8 MODULES', 'rears the front 2.5 m up'],
    ['pack', 'BODY MODULE ×36', 'identical, hot-swappable'],
  ],
  explode: [
    ['shell', 'ARMOUR SHELL', 'carbon / titanium scales'],
    ['motor', 'YAW + PITCH ACTUATORS', `2 per module · ${SPEC.motorTorque} N·m`],
    ['belly', 'BELLY PLATE', 'low-friction rollers'],
  ],
  power: [['pack', 'LI-ION PACK ×19', `${SPEC.packKWh} kWh each · 48 V bus`]],
  spine: [
    ['motor', 'HARMONIC DRIVE', `${SPEC.motorTorque} N·m · 0.9 kW peak`],
    ['trunk', 'TRUNK JOINTS', '4 × 1500 N·m each'],
  ],
  necks: [['neck', 'TELESCOPING NECK', '6 × 2-axis · +42% on strike']],
  heads: [
    ['eye', 'STEREO EYES', 'RGB + thermal'],
    ['lidar', 'LIDAR', 'centre head · 120 m'],
    ['fang', 'FANGS', 'ceramic · gripper'],
    ['jaw', 'JAW SERVO', '0–63°'],
  ],
  hood: [
    ['rib', 'HOOD RIB', 'linear actuator · 17–86°'],
    ['membrane', 'MEMBRANE', 'aramid skin'],
  ],
  core: [['core', 'CORE COMPUTER', 'IMU · radio · 2 GPUs']],
  tail: [['tail', 'TAIL PADDLE', 'unfolds in water']],
  slither: [['motor', 'TRAVELLING WAVE', 'joint i lags joint i−1 by β = 15°']],
  track: [
    ['eye', 'STEREO EYES', 'target fix'],
    ['lidar', 'LIDAR', 'range to target'],
  ],
  strike: [
    ['jaw', 'JAWS 63°', 'servo snap'],
    ['neck', 'NECK +42%', 'telescoping'],
  ],
  swim: [['tail', 'TAIL PADDLE', 'unfolds in water']],
  coil: [
    ['core', 'CORE COMPUTER', 'IMU · radio · 2 GPUs'],
    ['rib', 'HOOD RIBS', 'flared to guard'],
  ],
};

export function runLive() {
  const style = document.createElement('style');
  style.textContent = `html,body{background:#e3e9e8;overflow:hidden}
#app{position:absolute!important;inset:auto!important;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0}
#gl{touch-action:none;cursor:grab}#gl.drag{cursor:grabbing}`;
  document.head.appendChild(style);
  document.title = 'KALIYA-5 · Serpent Robot Teardown';
  const app = document.getElementById('app');
  const canvas = document.createElement('canvas');
  canvas.id = 'gl';
  app.appendChild(canvas);

  const stage = createStage(canvas);
  const robot = buildRobot();
  stage.scene.add(robot.root);
  const ui = createConsole(app);

  // ---------------- fit 1600 x 900 into the window; quality tiers step down on a slow GPU
  const TIERS = [
    {pr: 2, shadow: 2048},
    {pr: 1.4, shadow: 1024},
    {pr: 1, shadow: 512},
  ];
  let tier = matchMedia('(pointer: coarse)').matches ? 1 : 0;
  let scale = 1;
  const fit = () => {
    scale = Math.min(innerWidth / W, innerHeight / H);
    app.style.transform = `translate(${(innerWidth - W * scale) / 2}px, ${(innerHeight - H * scale) / 2}px) scale(${scale})`;
    stage.resize(W, H, clamp((devicePixelRatio || 1) * scale, 0.75, TIERS[tier].pr));
    stage.setQuality(TIERS[tier]);
  };
  addEventListener('resize', fit);
  fit();

  // ---------------- state
  const s = {...STATE0, build: 1};
  const tg = {...MODE.coil, flare: 0.35, explode: 0, xray: 0, strike: 0, jaw: 0.1};
  let xray = 0;
  let mode = 'coil';
  let modeT0 = 0;
  let isolate = null;
  let isoK = 0;
  let focus = 'coil';
  let tracking = false;
  let trackT0 = 0;
  let buildT0 = -99;
  let view = 'hero';
  let viewT0 = 0;
  let paused = false;
  let T = 0;
  let simT = 0;
  let dist = 0;
  const off = {az: 0, el: 0, k: 1};
  let cam = null;
  let ring = {t: -9, x: 0, y: 0};
  let lastHead = null;
  let headSpeed = 0;
  let caption = ['KALIYA-5', 'A five-headed serpent robot, built and run part by part'];

  const setMode = (m) => {
    mode = m;
    modeT0 = simT;
    Object.assign(tg, MODE[m]);
    isolate = null;
    focus = m;
    if (m === 'swim') tg.flare = 0.2;
    if (m === 'coil') tg.flare = 1;
    if (m === 'strike') tracking = false;
  };
  const setView = (v) => {
    if (v === view) return;
    view = v;
    viewT0 = T;
  };
  const press = (k) => {
    if (MODE[k]) setMode(k);
    else if (PARTS.some(([p]) => p === k)) {
      isolate = isolate === k ? null : k;
      focus = isolate ?? mode;
      if (isolate === 'hood') tg.flare = 1;
      if (isolate === 'tail') tg.explode = Math.max(tg.explode, 0);
    } else if (k === 'build') {
      buildT0 = T;
      s.build = 0;
      focus = 'build';
    } else if (k === 'explode') {
      tg.explode = tg.explode > 0.5 ? 0 : 1;
      focus = tg.explode ? 'explode' : isolate ?? mode;
    } else if (k === 'xray') tg.xray = tg.xray > 0.5 ? 0 : 1;
    else if (k === 'flare') {
      tg.flare = tg.flare > 0.6 ? 0.2 : 1;
      focus = 'hood';
    } else if (k === 'track') {
      tracking = !tracking;
      trackT0 = simT;
      focus = tracking ? 'track' : mode;
    } else if (VIEW_FN[k]) setView(k);
  };
  const pulse = (k) => {
    const [x, y] = ui.spot(k);
    ring = {t: T, x, y};
  };

  // ---------------- the tour
  const AP = {on: true, t0: 0, next: 0, loop: -1};
  let lastInput = 0;
  const resetForTour = () => {
    Object.assign(s, {...STATE0, build: 0});
    Object.assign(tg, {...MODE.coil, flare: 0.35, explode: 0, xray: 0, strike: 0, jaw: 0.1});
    xray = 0;
    mode = 'coil';
    isolate = null;
    tracking = false;
    focus = 'build';
    Object.assign(off, {az: 0, el: 0, k: 1});
  };
  const startTour = () => {
    AP.on = true;
    AP.t0 = T;
    AP.next = 0;
    AP.loop = -1;
    paused = false;
  };
  const takeOver = () => {
    lastInput = T;
    if (!AP.on) return;
    AP.on = false;
    if (s.build < 1) {
      s.build = 1;
      buildT0 = -99;
    }
  };
  ui.tourChip.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    lastInput = T;
    if (AP.on) takeOver();
    else startTour();
  });
  addEventListener('pointerdown', takeOver);
  for (const [k] of [...MODES, ...PARTS, ...TOOLS, ...VIEWS])
    ui.btn[k].addEventListener('click', () => {
      takeOver();
      pulse(k);
      press(k);
      if (!VIEW_FN[k]) {
        // a press picks a sensible view
        const v = {power: 'inside', spine: 'side', heads: 'face', hood: 'face', necks: 'face', core: 'hero', tail: 'side', strike: 'hero', swim: 'side', slither: 'hero', coil: 'hero', build: 'full', track: 'face', flare: 'face'}[k];
        if (v) setView(v);
      }
      Object.assign(off, {az: 0, el: 0, k: 1});
    });
  addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const key = e.key.toLowerCase();
    const v = {1: 'hero', 2: 'side', 3: 'top', 4: 'face', 5: 'inside'}[key];
    takeOver();
    if (v) ui.btn[v].click();
    else if (key === 'e') ui.btn.explode.click();
    else if (key === 'x') ui.btn.xray.click();
    else if (key === 'b') ui.btn.build.click();
    else if (key === 'h') ui.btn.flare.click();
    else if (key === ' ') paused = !paused;
    else return;
    e.preventDefault();
  });
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    drag = {x: e.clientX, y: e.clientY};
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('drag');
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    off.az += ((e.clientX - drag.x) / scale) * 0.3;
    off.el = clamp(off.el + ((e.clientY - drag.y) / scale) * 0.2, -10, 70);
    drag = {x: e.clientX, y: e.clientY};
    lastInput = T;
  });
  const endDrag = () => {
    drag = null;
    canvas.classList.remove('drag');
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      takeOver();
      off.k = clamp(off.k * Math.exp(e.deltaY * 0.0012), 0.3, 2.4);
    },
    {passive: false},
  );

  // the cursor during the tour: glide to the next button, press on the beat
  const cursorAt = (c) => {
    let prev = {x: 800, y: 470};
    for (let i = 0; i < SCRIPT.length; i++) {
      const st = SCRIPT[i];
      const [x, y] = ui.spot(st.btn);
      const t0 = st.at - 1.1;
      if (c < t0) return {...prev, press: false, ring: 0};
      if (c < st.at) {
        const k = ss(t0, st.at - 0.1, c);
        return {x: prev.x + (x - prev.x) * k, y: prev.y + (y - prev.y) * k, press: c > st.at - 0.12, ring: 0};
      }
      if (c < st.at + 0.6 && (i === SCRIPT.length - 1 || c < SCRIPT[i + 1].at - 1.1)) return {x, y, press: c < st.at + 0.1, ring: 1 - (c - st.at) / 0.6, ringX: x, ringY: y};
      prev = {x, y};
    }
    return {...prev, press: false, ring: 0};
  };

  // ---------------- the frame
  let last = performance.now();
  const perf = {n: 0, sum: 0, age: 0};
  let frozen = false;
  let lastCursor = {x: -99, y: -99, press: false, ring: 0};
  const frame = (now) => {
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
    last = now;
    if (tier < TIERS.length - 1) {
      perf.age += dt;
      if (perf.age > 1) {
        perf.sum += dt;
        perf.n++;
        if (perf.n >= 30) {
          if (perf.sum / perf.n > 0.024) {
            tier++;
            fit();
          }
          Object.assign(perf, {n: 0, sum: 0, age: 0});
        }
      }
    }

    if (!frozen) lastCursor = step(dt);
    draw(frozen ? 0 : dt, lastCursor);
    requestAnimationFrame(frame);
  };

  // advance the operator and every state value by dt (no drawing)
  const step = (dt) => {
    T += dt;
    let cursor = {x: -99, y: -99, press: false, ring: 0};
    if (AP.on) {
      const c0 = T - AP.t0;
      const loop = Math.floor(c0 / DURATION);
      if (loop !== AP.loop) {
        AP.loop = loop;
        AP.next = 0;
        resetForTour();
        setView('full');
      }
      const c = c0 - loop * DURATION;
      while (AP.next < SCRIPT.length && c >= SCRIPT[AP.next].at) {
        const st = SCRIPT[AP.next];
        press(st.btn);
        caption = [st.n, st.cap];
        AP.next++;
      }
      let v = 'full';
      for (const [t0, vv] of TOUR_VIEWS) if (c >= t0) v = vv;
      setView(v);
      cursor = cursorAt(c);
    } else {
      if (T - lastInput > IDLE) startTour();
      const rk = Math.max(0, 1 - (T - ring.t) / 0.55);
      cursor = {x: -99, y: -99, press: false, ring: rk, ringX: ring.x, ringY: ring.y};
      caption = captionFor(focus);
    }

    // ease every state value toward its target
    const ease = (k, tau) => {
      s[k] += (tg[k] - s[k]) * (1 - Math.exp(-dt / tau));
    };
    if (!paused) {
      simT += dt;
      s.time = simT;
      ease('coil', 1.1);
      ease('freq', 0.6);
      ease('raise', 0.7);
      ease('swim', 0.8);
      ease('alpha', 0.6);
      ease('flare', 0.35);
      ease('explode', 0.45);
      xray += (tg.xray - xray) * (1 - Math.exp(-dt / 0.3));
      isoK += ((isolate ? 1 : 0) - isoK) * (1 - Math.exp(-dt / 0.3));
      if (buildT0 > -50) {
        s.build = clamp((T - buildT0) / 9, 0, 1);
        if (s.build >= 1) buildT0 = -99;
      }
      // strike: a pulse every 3.2 s while in strike mode (cocked, lunge, hold, recover)
      if (mode === 'strike') {
        const u = (simT - modeT0) % 3.2;
        tg.strike = u < 0.7 ? 0 : u < 0.95 ? 1 : u < 1.7 ? 1 : 0;
        tg.jaw = u > 0.5 && u < 1.8 ? 1 : 0.1;
        s.strike += (tg.strike - s.strike) * (1 - Math.exp(-dt / (tg.strike > s.strike ? 0.07 : 0.4)));
      } else {
        tg.strike = 0;
        tg.jaw = tracking ? 0.35 + 0.25 * Math.sin(simT * 2.1) : mode === 'coil' && s.flare > 0.8 ? 0.25 : 0.1;
        s.strike += (0 - s.strike) * (1 - Math.exp(-dt / 0.4));
      }
      s.jaw += (tg.jaw - s.jaw) * (1 - Math.exp(-dt / 0.08));
      // gaze: a target that moves left and right in front of the robot
      const gy = tracking ? 0.55 * Math.sin((simT - trackT0) * 0.9) : 0;
      const gp = tracking ? 0.18 * Math.sin((simT - trackT0) * 1.3) : 0;
      s.gazeYaw += (gy - s.gazeYaw) * (1 - Math.exp(-dt / 0.25));
      s.gazePitch += (gp - s.gazePitch) * (1 - Math.exp(-dt / 0.25));
      s.psi += 2 * Math.PI * s.freq * dt;
      dist += readouts(s, pose({...s, explode: 0, build: 1})).speed * dt;
    }
    s.xray = xray;
    return cursor;
  };

  const draw = (dt, cursor) => {
    const P = pose(s);
    // the numbers come from the working pose (assembled, not exploded); the camera frames that pose too
    const P0 = s.explode > 0.001 || s.build < 1 ? pose({...s, explode: 0, build: 1}) : P;
    const r = readouts(s, P0);
    robot.update(s, P);
    robot.look({isolate, isoK, glow: isolate ?? focusGlow(focus, mode), glowK: isolate ? isoK : 0.85, xray});

    // head speed from the centre head's motion
    const hp = P.heads[2].pos;
    if (lastHead && dt > 0) headSpeed += (Math.hypot(hp[0] - lastHead[0], hp[1] - lastHead[1], hp[2] - lastHead[2]) / dt - headSpeed) * 0.3;
    lastHead = hp.slice();

    // camera
    const tgt = VIEW_FN[view](T - viewT0, P, bounds(P0));
    tgt.az += off.az;
    tgt.el = clamp(tgt.el + off.el, 2, 85);
    tgt.d *= off.k;
    if (!cam) cam = {...tgt};
    const k = 1 - Math.exp(-dt / 0.7);
    cam.az += wrap((tgt.az - cam.az) * D2R) / D2R * k;
    for (const key of ['tx', 'ty', 'tz', 'el', 'd']) cam[key] += (tgt[key] - cam[key]) * k;
    stage.frame({...cam, az: cam.az * D2R, el: cam.el * D2R}, {scroll: dist, swim: s.swim, t: simT});

    // console
    ui.readouts(r, {headSpeed});
    ui.chart(P.jointYaw, P.trunkPitch, s.freq > 0.05);
    const list = [];
    for (const [a, title, sub] of CALLS[focus] ?? []) {
      const w = robot.anchor(a, P);
      const p = stage.project(w);
      if (p.visible && p.x > 240 && p.x < 1330 && p.y > 90 && p.y < 760) list.push({x: p.x, y: p.y, title, sub, lit: true});
    }
    ui.callouts(s.build < 0.98 && focus !== 'build' ? [] : list);
    ui.caption(...caption);
    ui.setOn({
      coil: mode === 'coil',
      slither: mode === 'slither',
      swim: mode === 'swim',
      strike: mode === 'strike',
      ...Object.fromEntries(PARTS.map(([p]) => [p, isolate === p])),
      build: buildT0 > -50,
      explode: tg.explode > 0.5,
      xray: tg.xray > 0.5,
      flare: tg.flare > 0.6,
      track: tracking,
      ...Object.fromEntries(VIEWS.map(([v]) => [v, view === v])),
    });
    ui.pointer(cursor);
    const chipOn = ui.tourChip.classList.contains('on');
    if (chipOn !== AP.on || !ui.tourChip.firstChild) {
      ui.tourChip.classList.toggle('on', AP.on);
      ui.tourChip.innerHTML = AP.on ? '<i></i>AUTO TOUR · CLICK TO TAKE OVER' : '▶ RESUME TOUR';
    }
    if (!window.SIM_SHOWN) {
      window.SIM_SHOWN = true;
      dispatchEvent(new Event('simframe'));
    }
  };

  window.LIVE = {s, tg, press, setView, stage, takeOver, get T() {
    return T;
  }, seekTour(t) {
    // for review captures: replay the tour from its start to t in 1/30 s steps, then draw that one frame
    startTour();
    AP.t0 = T;
    for (let k = 0; k < Math.round(t * 30); k++) step(1 / 30);
    cam = null;
    lastHead = null;
    lastCursor = step(0);
    draw(1 / 30, lastCursor);
  }, capStart() {
    // film capture: stop the rAF clock, restart the tour, hide the chip; then capStep(dt) draws each frame
    frozen = true;
    startTour();
    AP.t0 = T;
    cam = null;
    lastHead = null;
    ui.tourChip.style.display = 'none';
  }, capSkip(t, dt) {
    // advance the operator without drawing (a chunk of the film that starts later)
    for (let k = 0; k < Math.round(t / dt); k++) step(dt);
  }, capStep(dt) {
    lastCursor = step(dt);
    draw(dt, lastCursor);
  }, still(t) {
    // freeze on the tour at t (no rAF loop interference: pause the clock afterwards)
    this.seekTour(t);
    frozen = true;
  }};
  stage.renderer.compileAsync(stage.scene, stage.camera).catch(() => {}).then(() => requestAnimationFrame(frame));
}

function focusGlow(focus, mode) {
  return {slither: 'spine', swim: 'tail', strike: 'heads', track: 'heads', hood: 'hood', coil: 'hood', build: null, explode: 'spine'}[focus] ?? null;
}

function captionFor(f) {
  return (
    {
      coil: ['GUARD', 'Coiled and reared with the hood up, it holds the pose on 0.4 kW'],
      slither: ['SLITHER', 'A serpenoid wave runs from head to tail and pushes the body forward'],
      swim: ['SWIM', 'A wider, faster wave and a tail paddle. In water, drag replaces belly friction'],
      strike: ['STRIKE', 'The trunk tips forward, the necks extend 42% and the jaws open to 63°'],
      build: ['ASSEMBLY', 'Modules dock tail-first, then the trunk, the core, the necks and the heads'],
      explode: ['EXPLODED VIEW', 'Armour shell, belly plate, two actuators and a spine bus in every module'],
      spine: ['SPINE', `${SPEC.joints} actuated joints, each body joint ${SPEC.motorTorque} N·m`],
      power: ['POWER', `${SPEC.nPacks} × ${SPEC.packKWh} kWh Li-ion = ${SPEC.capacityKWh.toFixed(1)} kWh`],
      necks: ['NECKS', 'Five necks of six 2-axis segments that telescope on the strike'],
      heads: ['HEADS', 'Gold-armoured skulls with stereo eyes, a jaw servo and ceramic fangs'],
      hood: ['HOOD', 'Eight ribs per head spread an aramid membrane, 17° to 86°'],
      core: ['CORE', 'The brain sits where the five necks meet'],
      tail: ['TAIL', 'A paddle unfolds from the last module for swimming'],
      track: ['TRACKING', 'All five heads converge on one target'],
    }[f] ?? ['KALIYA-5', '']
  );
}

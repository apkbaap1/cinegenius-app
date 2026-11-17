# Sound for "One Ring at a Time" (Telugu voice): an original score in D major built on the template's own synthesized
# instruments (pad, plucked strings, glockenspiel, music box, timpani, snare, cymbal, soft brass, brushes), a synthesized
# SFX stem timed to the picture (story.ts), and the mix: voice unchanged, music ducked under speech at about -10 LU
# from the voice (the "+3 dB music" standard), SFX about 6 dB under its natural level, master -14 LUFS, <= -1.2 dBTP.
# Writes ../out/audio/{music,sfx,mix}.wav (48 kHz stereo 24-bit, exactly TOTAL frames long) and ../out/audio/cues.md.
# Run: python audio/telangana.py   (needs numpy, scipy; ffmpeg for the voice resample)
import os
import json
import subprocess
import numpy as np
from dsp import SR, ns, tt, rng, dbg, lp, hp, bp, pan, st, place, fades, widen, make_ir, convolve_st, integrated, true_peak, colored, write_wav, read_wav
import instruments as I
import sfx_gen as G

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "out", "audio")
FPS, TOTAL = 30, 3530
DUR = TOTAL / FPS
N = ns(DUR)
m = I.m2f
BEAT = 60 / 84.0
BAR = 4 * BEAT

# story clock (story.ts W): the moments sound lands on
W = dict(y1956=7.41, merge=12.31, sign=15.44, safeguards=18.68, y1969=23.15, jai=28.46, lives=31.85, quiet=34.16, idea=35.6, prof=38.16,
         y2009=46.43, fast=49.23, yes=52.81, wait=54.04, stopped=56.61, halt=59.71, strike=60.85, buses=63.83, offices=64.65, courts=65.57,
         mines=66.29, still=67.33, march=68.76, came=72.26, feb=73.86, passed=78.48, gavel=79.4, june=80.73, born=85.11, bk=86.63,
         rings=89.97, single=92.8, rests=94.85, built=97.75, gen=100.52, died=103.16, early=106.34, univ=108.46, alive=113.56, top=114.9)
CUTS = [220, 461, 692, 953, 1143, 1391, 1558, 1696, 1823, 1986, 2063, 2216, 2420, 2596, 2782, 2931, 3092, 3252, 3405]

# chords as MIDI note lists (D major)
CH = {"D": [50, 57, 62, 66, 69], "Bm": [47, 54, 59, 62, 66], "G": [43, 50, 55, 59, 62], "A": [45, 52, 57, 61, 64], "Em": [40, 47, 52, 55, 59],
      "F#m": [42, 49, 54, 57, 61], "Dlow": [38, 45, 50, 57]}


class Bus:
    def __init__(self):
        self.x = np.zeros((2, N + ns(4)))

    def add(self, y, t, g=1.0, p=0.0):
        y = np.asarray(y)
        if y.ndim == 1:
            y = pan(y, p)
        place(self.x, y * g, t)


def pads(b, t0, seq, bars_each=1.0, vel=0.32, warm=900):
    t = t0
    for c in seq:
        d = BAR * bars_each
        b.add(I.pad([m(n) for n in CH[c][:4]], d + 0.25, vel, rng(int(t * 10)), att=0.5, rel=1.2, warm=warm), t)
        t += d
    return t


def arps(b, t0, t1, seq, vel=0.32, bars_each=1.0, pat=(0, 2, 3, 4, 3, 2, 1, 2), octave=12):
    t, i = t0, 0
    while t < t1 - 0.05:
        c = CH[seq[int((t - t0) / (BAR * bars_each)) % len(seq)]]
        note = c[pat[i % len(pat)] % len(c)] + octave
        b.add(I.pluck(m(note), vel * (1.0 if i % 4 == 0 else 0.75), rng(int(t * 100)), 1.2, 0.45), t, p=0.25 * np.sin(i * 0.9))
        t += BEAT / 2
        i += 1


def melody(b, notes, vel=0.4, fn="glock"):
    for (t, n, d) in notes:
        f = m(n)
        y = I.glock(f, vel, rng(int(t * 77)), 1.8) if fn == "glock" else I.musicbox(f, vel, rng(int(t * 77)), 1.6) if fn == "box" else I.brass(f, d, vel, rng(int(t * 77)), "soft")
        b.add(y, t, p=0.15)


def build_music():
    b = Bus()
    # A hook (0-7.4): warm D, rising glock
    pads(b, 0.0, ["D", "D", "G"], 1.0, 0.3)
    arps(b, 0.6, 7.3, ["D", "D", "G"], 0.22)
    melody(b, [(1.2, 78, 1), (2.6, 81, 1), (4.0, 86, 1), (5.4, 88, 1.5)], 0.32)
    # B 1956 (7.4-23.1): the theme over D Bm G A
    t = pads(b, 7.4, ["D", "Bm", "G", "A", "D", "Bm"], 0.92, 0.28)
    arps(b, 7.4, 23.0, ["D", "Bm", "G", "A", "D", "Bm"], 0.2, 0.92)
    th = [(0, 74), (0.5, 76), (1, 78), (2, 81), (3, 78), (4, 79), (4.5, 78), (5, 76), (6, 74), (8, 76), (9, 78), (10, 81), (11, 83), (12, 81), (14, 78)]
    melody(b, [(7.6 + k * BEAT, n + 12, 1) for k, n in th], 0.26)
    # C 1969 (23.1-31.8): timpani pulse, snare 8ths growing, cymbal on "జై తెలంగాణ"
    pads(b, 23.1, ["Bm", "G", "D", "A"], 0.76, 0.3, 1200)
    for k in range(int((31.6 - 23.1) / BEAT)):
        tk = 23.1 + k * BEAT
        b.add(I.timpani(m(38 if k % 2 == 0 else 45), 0.35 + 0.35 * k / 12, rng(k)), tk)
        for h in range(2):
            b.add(I.snare(0.12 + 0.3 * (k / 12) * (1 if h == 0 else 0.6), rng(k * 3 + h), 0.25), tk + h * BEAT / 2, p=0.2)
    b.add(I.cymbal(0.55, rng(9), 2.6), W["jai"] - 0.02)
    melody(b, [(W["jai"], 74, 0.7), (W["jai"] + 0.7, 78, 0.7), (W["jai"] + 1.4, 81, 1.2)], 0.4, "brass")
    # D the loss (31.8-38.2): Bm, music box falling; the idea: a high D and the pad opens to G
    b.add(I.pad([m(n) for n in CH["Bm"][:4]], 3.9, 0.22, rng(31), 1.0, 1.4, 700), 31.9)
    melody(b, [(32.3, 83, 1), (33.3, 81, 1), (34.3, 78, 1), (35.0, 74, 1)], 0.22, "box")
    b.add(I.pad([m(n) for n in CH["G"][:4]], 2.8, 0.26, rng(35), 0.6, 1.2, 1100), W["idea"])
    melody(b, [(W["idea"] + 0.05, 86, 1), (W["idea"] + 1.2, 90, 1)], 0.3)
    # E the professor (38.2-46.4): gentle hope, G D Em A
    pads(b, 38.2, ["G", "D", "Em", "A"], 0.72, 0.26)
    arps(b, 38.2, 46.3, ["G", "D", "Em", "A"], 0.22, 0.72, pat=(0, 2, 4, 2, 3, 2, 1, 2))
    melody(b, [(38.6, 79, 1), (39.6, 81, 1), (40.6, 83, 1), (42.2, 86, 1), (43.6, 83, 1), (44.6, 81, 1.4)], 0.24)
    # F 2009 (46.4-56.6): pulse on A building, a bright yes, a cut to stillness on "wait"
    b.add(I.pad([m(45), m(52), m(57)], W["yes"] - 46.4, 0.24, rng(46), 0.8, 0.3, 700), 46.4)
    arps(b, 46.6, W["yes"] - 0.05, ["A"], 0.2, pat=(0, 0, 2, 0, 3, 0, 2, 0), octave=0)
    b.add(I.pad([m(n) for n in CH["D"][:4]], 1.2, 0.36, rng(52), 0.05, 0.25, 1600), W["yes"] - 0.02)
    b.add(I.triangle(0.5, rng(53)), W["yes"])
    b.add(I.timpani(m(33), 0.6, rng(54)), W["wait"] - 0.02)
    b.add(I.pad([m(35), m(42), m(47)], 56.6 - W["wait"], 0.18, rng(55), 1.2, 0.8, 500), W["wait"] + 0.3)
    # G the strike (56.6-68.7): a low drone and a ticking clock; one low hit as everything halts
    b.add(I.pad([m(35), m(42), m(47)], 12.0, 0.2, rng(56), 1.0, 1.0, 450), 56.6)
    for k in range(int((68.6 - 57.0) / BEAT)):
        b.add(I.pluck(m(71 if k % 2 else 66), 0.16, rng(570 + k), 0.5, 0.2), 57.0 + k * BEAT, p=0.3 if k % 2 else -0.3)
    b.add(I.timpani(m(31), 0.75, rng(59)), W["halt"])
    # H the march and the bill (68.7-80.6): a crescendo, snare rolls, the gavel
    pads(b, 68.7, ["D", "G", "Bm", "A"], 0.78, 0.3, 1300)
    arps(b, 68.7, 79.3, ["D", "G", "Bm", "A"], 0.25, 0.78)
    for k in range(int((79.2 - 68.7) / BEAT)):
        b.add(I.timpani(m(38 if k % 2 == 0 else 45), 0.3 + 0.45 * k / 14, rng(680 + k)), 68.7 + k * BEAT)
    for (ts, vs) in I.snare_roll(76.6, W["gavel"] - 0.03, 0.08, 0.55, rng(76)):
        b.add(I.snare(vs, rng(int(ts * 1000)), 0.2, buzz=True), ts, p=0.1)
    melody(b, [(70.0, 74, 1), (71.5, 78, 1), (73.0, 81, 1.2), (74.6, 83, 1), (76.0, 86, 1.4)], 0.3, "brass")
    b.add(I.cymbal(0.8, rng(79), 3.0), W["gavel"])
    b.add(I.timpani(m(38), 1.0, rng(80)), W["gavel"])
    for n in [50, 57, 62, 66]:
        b.add(I.brass(m(n), 0.9, 0.75, rng(n), "stab"), W["gavel"])
    # I the second of June (80.7-86.7): triumph
    pads(b, 80.7, ["D", "G", "A", "D"], 0.52, 0.4, 1800)
    for k, c in enumerate(["D", "G", "A", "D"]):
        for n in CH[c][1:4]:
            b.add(I.brass(m(n), BAR * 0.5, 0.55, rng(n + k), "horn"), 80.7 + k * BAR * 0.52, p=0.2 * (n % 3 - 1))
    melody(b, [(80.8 + k * BEAT / 2, n, 1) for k, n in enumerate([86, 88, 90, 93, 90, 93, 95, 98])], 0.32)
    b.add(I.cymbal(0.6, rng(81), 3.2), 80.72)
    b.add(I.cymbal(0.45, rng(85), 3.0), W["born"])
    # J Bathukamma (86.7-103): a lilting folk pattern with claps (brushes), glock tune
    seq = ["D", "D", "G", "A", "D", "Bm", "G", "A"]
    pads(b, 86.7, seq, 0.72, 0.24)
    arps(b, 86.7, 103.0, seq, 0.24, 0.72, pat=(0, 3, 2, 0, 3, 2))
    k = 0
    tc = 86.9
    while tc < 102.9:
        b.add(I.brush(0.32 if k % 3 == 0 else 0.2, rng(900 + k), 0.2), tc, p=0.4 if k % 2 else -0.4)
        tc += BEAT * 2 / 3
        k += 1
    tune = [78, 76, 74, 76, 78, 78, 78, 76, 76, 76, 78, 81, 81]
    melody(b, [(87.4 + i * BEAT * 0.75, n + 12, 1) for i, n in enumerate(tune)], 0.22)
    melody(b, [(97.8 + i * BEAT * 0.75, n + 12, 1) for i, n in enumerate(tune[:9])], 0.24)
    # K the professor's death (103.2-108.4): hush
    b.add(I.pad([m(n) for n in CH["Bm"][:4]], 2.6, 0.22, rng(103), 1.0, 1.2, 700), 103.2)
    b.add(I.pad([m(n) for n in CH["G"][:4]], 2.6, 0.22, rng(105), 1.0, 1.2, 700), 105.8)
    melody(b, [(103.6, 81, 1), (104.8, 78, 1), (106.0, 79, 1), (107.2, 74, 1)], 0.2, "box")
    # L the end (108.4-117.7): G A Bm G A -> D on the last flower, a sparkle, a long fade
    pads(b, 108.4, ["G", "A", "Bm", "G"], 0.56, 0.3, 1300)
    arps(b, 108.4, W["top"] - 0.1, ["G", "A", "Bm", "G", "A"], 0.24, 0.56)
    melody(b, [(108.6, 79, 1), (109.8, 81, 1), (111.0, 83, 1), (112.2, 86, 1), (113.5, 88, 1)], 0.28, "brass")
    b.add(I.pad([m(n) for n in CH["D"][:4]] + [m(74)], DUR - W["top"] + 0.4, 0.42, rng(114), 0.15, 2.4, 1600), W["top"] - 0.02)
    melody(b, [(W["top"], 86, 1), (W["top"] + 0.18, 90, 1), (W["top"] + 0.36, 93, 1), (W["top"] + 0.54, 98, 1)], 0.36)
    b.add(I.cymbal(0.35, rng(115), 3.5), W["top"] - 0.05)
    b.add(I.timpani(m(38), 0.6, rng(116)), W["top"])
    x = b.x[:, :N]
    ir = make_ir(2.2, 5)
    x = 0.82 * x + 0.3 * convolve_st(x, ir)[:, :N]
    env = np.ones(N)
    tail = ns(2.4)
    env[-tail:] = np.linspace(1, 0, tail) ** 1.5
    return x * env[None, :]


def build_sfx():
    b = Bus()
    r = rng(7)
    fr = lambda f: f / FPS
    # ambience per shot: breeze + birds by day, crickets at dusk, the lake on the promenade shots
    def bed(t0, t1, golden=False, lake=False, crowd=0):
        d = t1 - t0
        x = st(G.breeze(d, r, 0.6, 0.12, 700) * 0.5)
        x += pan(G.bird_chirps(d, r, 0.3 if not golden else 0.15, "sparrow") * 0.05, -0.4)
        if golden:
            x += widen(G.crickets(d, r, 3) * 0.006, r, 9, 1.0)
        if lake:
            x += st(lp(colored(ns(d), r, 0.9), 900) * 0.08)
        if crowd:
            for v in range(crowd):
                y = G.babble(d, r, r.uniform(110, 240), r.uniform(1.0, 1.2), r.uniform(3.6, 4.8), r.uniform(0.5, 0.8), fmax=3200)
                x += pan(lp(y, 2600, 1) * r.uniform(0.15, 0.4), r.uniform(-0.8, 0.8))
        b.add(fades(x, 0.15, 0.25), t0, 0.5)
    S = [0] + CUTS + [TOTAL]
    kinds = ["lake g", "air", "crowd2", "crowd6", "g", "day", "lake crowd4", "air", "day", "crowd3", "day", "lake crowd14", "air", "g crowd10", "day crowd2",
             "day", "g", "g", "g", "g"]
    for i in range(20):
        k = kinds[i]
        bed(fr(S[i]), fr(S[i + 1]), "g" in k.split(), "lake" in k, int(k.split("crowd")[1]) if "crowd" in k else 0)
    # whooshes on the hard place changes
    for f0 in [220, 461, 692, 1391, 1558, 1696, 1986, 2216]:
        b.add(G.whoosh(0.5, r, 0.25, 400, 2600, 0.8, 0.12, 0.3), fr(f0) - 0.25, 0.35)
    # 3 the pen on paper, two signatures; three little pops for the pictures
    for t0 in (16.0, 16.95):
        n = ns(0.85)
        y = bp(colored(n, r, 0.2), 2500, 7000) * (0.5 + 0.5 * np.abs(np.sin(np.arange(n) / SR * 40))) * 0.12
        b.add(fades(y, 0.02, 0.1), t0, 0.8)
    for t0 in (19.2, 20.1, 20.85):
        b.add(I.glock(m(93), 0.25, rng(int(t0 * 9)), 0.6), t0, 0.7)
    # 4 footsteps of the column and the chant swell (formant crowd hurrahs)
    for k in range(int((31.6 - 23.15) / 0.5)):
        y = np.zeros(ns(0.3))
        for j in range(6):
            s = G.stroll_step(r, 0.4)
            y[: len(s)] += s[: len(y)] * r.uniform(0.3, 0.7)
        b.add(widen(y, r, 8, 0.8), 23.15 + k * 0.5 + r.uniform(0, 0.02), 0.25)
    for j in range(14):
        h = G.hurrah(r, r.uniform(110, 220), r.uniform(1.0, 1.15))
        b.add(lp(h, 3200, 1) * r.uniform(0.3, 0.6), W["jai"] + 0.1 + r.uniform(0, 0.5), 0.6, r.uniform(-0.8, 0.8))
    # 7 the crowd round the canopy; 8 the hand pops
    b.add(G.whoosh(0.35, r, 0.08, 800, 3200, 0.7, 0.1, 0.5), W["yes"] - 0.3, 0.5)
    b.add(G.whoosh(0.35, r, 0.08, 800, 3200, 0.7, 0.1, 0.5), W["wait"] - 0.1, 0.5)
    # 9 the bus: engine idling down, brakes hiss on the halt; shutters rattling down
    d = W["halt"] - 56.6 + 1.0
    t = tt(d)
    eng = np.sin(2 * np.pi * np.cumsum(38 + 14 * np.clip((W["halt"] - 56.6 - t) / 2.5, 0, 1)) / SR) * 0.5
    eng += lp(colored(len(t), r, 1.0), 300) * 0.4
    b.add(fades(eng * np.clip((d - t) / 1.0, 0, 1), 0.3, 0.2), 56.6, 0.35, 0.2)
    b.add(fades(hp(colored(ns(0.9), r, 0.0), 2500) * np.exp(-tt(0.9) / 0.35) * 0.4, 0.01, 0.2), W["halt"] - 0.05, 0.6, 0.3)
    for i in range(3):
        t0 = W["halt"] - 0.4 + i * 0.35
        y = G.rattle(0.7, r, 70, heavy=True)
        b.add(y, t0, 0.35, -0.5)
        b.add(G.clink(r, 900, 0.2, 0.5), t0 + 0.7, 0.6, -0.5)
    # 11 the miners' lamps clicking off
    for k in range(7):
        b.add(G.clink(r, 3600, 0.05, 0.3) * 0.5, W["mines"] + 0.4 + k * 0.17, 0.5, -0.6 + k * 0.2)
    # 12 the Million March: a big cheer when the crowd comes; applause
    for j in range(30):
        h = G.hurrah(r, r.uniform(110, 300), r.uniform(1.0, 1.3), j % 7 == 6)
        b.add(lp(h, 3600, 1) * r.uniform(0.25, 0.6), W["came"] - 0.1 + r.uniform(0, 1.2), 0.6, r.uniform(-0.9, 0.9))
    env = np.interp(tt(3.4), [0, 0.4, 2.2, 3.4], [0, 1, 0.7, 0])
    b.add(G.applause(3.4, r, 40, env) * 0.5, W["came"])
    # 13 the gavel
    b.add(G.hammer_hit(r, 1.4), W["gavel"], 0.9)
    # 14 fireworks: launch whistles, bangs and crackle; the crowd
    for k in range(14):
        t0 = 80.73 + 0.1 + k * 0.42
        b.add(G.whoosh(0.45, r, 0.4, 1200, 4800, 0.4, 0.05, 0.6) * 0.4, t0 - 0.45, 0.4, r.uniform(-0.6, 0.6))
        bang = lp(colored(ns(0.6), r, 0.5), 2500) * np.exp(-tt(0.6) / 0.09) + np.sin(2 * np.pi * 55 * tt(0.6)) * np.exp(-tt(0.6) / 0.12) * 0.8
        b.add(bang, t0, 0.5, r.uniform(-0.6, 0.6))
        cr = np.zeros(ns(1.2))
        for c in range(40):
            s = G.clink(r, r.uniform(3000, 7000), 0.03, 0.2) * r.uniform(0.1, 0.4)
            i0 = ns(r.uniform(0.15, 1.1))
            cr[i0:i0 + len(s)] += s[: len(cr) - i0]
        b.add(cr, t0, 0.35, r.uniform(-0.7, 0.7))
    for j in range(24):
        h = G.hurrah(r, r.uniform(110, 300), r.uniform(1.0, 1.3), j % 6 == 5)
        b.add(lp(h, 3600, 1) * r.uniform(0.25, 0.55), 80.9 + r.uniform(0, 3.5), 0.55, r.uniform(-0.9, 0.9))
    # 15-16 the rings: a soft flower-drop on each new ring
    for i in range(3, 10):
        tr = W["rings"] - 1.5 + (i - 2) * 2.0 / 7
        b.add(lp(colored(ns(0.25), r, 0.6), 1800) * np.exp(-tt(0.25) / 0.05) * 0.4, tr, 0.6)
    # 20 the last flower: a tiny chime under the music's sparkle, a child's laugh would be a voice: left out
    b.add(I.glock(m(98), 0.25, rng(3), 1.2), W["top"], 0.6)
    return b.x[:, :N]


def load_voice():
    src = os.path.join(ROOT, "voice", "voice_te_original.wav")
    tmp = os.path.join(OUT, "voice48k.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", src, "-ar", "48000", "-ac", "2", "-c:a", "pcm_s24le", tmp], check=True)
    v, sr = read_wav(tmp)
    v = np.asarray(v, float)
    if v.shape[0] != 2:
        v = v.T
    out = np.zeros((2, N))
    out[:, : min(N, v.shape[1])] = v[:, :N]
    return out


def speech_env(words):
    """music gain under speech: -3 dB while words are spoken (from words_te.json), smooth 70 ms / 450 ms"""
    g = np.zeros(N)
    for c in words:
        a, b = ns(max(0, c["s"] - 0.08)), ns(c["e"] + 0.12)
        g[a:b] = 1
    k = ns(0.1)
    g = np.convolve(g, np.ones(k) / k, mode="same")
    return dbg(-3.0 * g)


def lufs_of(x):
    return integrated(x)


def limiter(x, ceil_db=-1.6):
    """look-ahead peak limiter: gain = min over a 6 ms window of ceil/peak, smoothed, then a true-peak safety trim"""
    from scipy.ndimage import minimum_filter1d
    c = dbg(ceil_db)
    peak = np.max(np.abs(x), axis=0)
    gain = np.minimum(1.0, c / np.maximum(peak, 1e-9))
    gain = minimum_filter1d(gain, ns(0.006))
    k = ns(0.003)
    gain = np.convolve(gain, np.ones(k) / k, mode="same")
    gain = minimum_filter1d(gain, ns(0.003))
    y = x * gain[None, :]
    tp = true_peak(y)
    if tp > -1.2:
        y *= dbg(-1.2 - tp)
    return y


def main():
    os.makedirs(OUT, exist_ok=True)
    words = json.load(open(os.path.join(ROOT, "voice", "words_te.json"), encoding="utf-8"))
    v = load_voice()
    print("music...", flush=True)
    mu = build_music()
    print("sfx...", flush=True)
    sx = build_sfx()
    lv = lufs_of(v)
    mu = mu * dbg((lv - 10.0) - lufs_of(mu))           # music bed ~10 LU under the voice
    mu = mu * speech_env([w for c in words for w in c["words"]])[None, :]
    sx = sx * dbg((lv - 15.0) - lufs_of(sx))           # effects sit ~6 dB under their natural level, ~15 LU under the voice
    mix = v + mu + sx
    g = dbg(-14.0 - lufs_of(mix))
    mix, mu, sx, vv = mix * g, mu * g, sx * g, v * g
    mix = limiter(mix)
    write_wav(os.path.join(OUT, "music.wav"), mu)
    write_wav(os.path.join(OUT, "sfx.wav"), sx)
    write_wav(os.path.join(OUT, "voice.wav"), vv)
    write_wav(os.path.join(OUT, "mix.wav"), mix)
    rep = (f"# Sound report\n\n- length {mix.shape[1] / SR:.3f} s ({TOTAL} frames at {FPS} fps)\n- voice {lufs_of(vv):.1f} LUFS, music {lufs_of(mu):.1f} LUFS, "
           f"sfx {lufs_of(sx):.1f} LUFS, mix {lufs_of(mix):.1f} LUFS, true peak {true_peak(mix):.2f} dBTP\n")
    open(os.path.join(OUT, "cues.md"), "w").write(rep)
    print(rep)


if __name__ == "__main__":
    main()

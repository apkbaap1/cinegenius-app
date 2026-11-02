"""Score for the KALIYA-5 tour film: a slow, low D-minor bed (72 bpm), a click on every button the operator presses,
soft docking knocks as the 55 parts assemble, an air sweep when the modules explode and close, a servo whine under the
slither, a hood swish, a hit on every strike lunge, and water under the swim. Every time comes from timeline.json.

    python run_sfx.py teardown/kaliya-film/score.py
"""

import os

from sfx.score_kit import airy, bed, chords, hz, motor, thud
from sfx.synth import click, whoosh

HERE = os.path.dirname(os.path.abspath(__file__))
TIMELINE = os.path.join(HERE, "timeline.json")
OUT = os.path.join(os.environ.get("TEARDOWN_OUT", "teardown-out"), "kaliya-score.wav")
TARGET_LUFS = -14.0
SEED = 5

CHORDS = chords("Dm9:D2 A2 C3 E3 F3/D1", "Bbmaj7:Bb1 F2 A2 D3/Bb0", "Gm9:G1 D2 F2 A2 Bb2/G0", "A7sus:A1 E2 G2 B2 D3/A0")
MOTIF = [(0.5, hz("A4")), (1.5, hz("F4")), (2.5, hz("E4")), (3.0, hz("D4"))]
PARTS = 36 + 8 + 1 + 10


def score(mix, tl):
    dur = tl["duration"]
    left, right, low, drums = bed(dur, 72, CHORDS, MOTIF, motif_voice="epiano", kicks=(0,), snares=(2,), hats=4, swing=0.0, keys_vel=0.62, keys_lp=3000)
    mix.put_stereo(0, left, right, 0.12)
    mix.put(0, low, 0.15)
    mix.put(0, drums, 0.035)

    for t in tl["presses"]:
        mix.put(t, click(2400, 0.025), 0.06)

    # assembly: each part docks when its arrival ends (kin.js: arrive(idx) = smooth((build * (PARTS + 3) - idx) / 3))
    b0, b1 = tl["build"]
    for idx in range(PARTS):
        t = b0 + (b1 - b0 + 0.0) * (idx + 3) / (PARTS + 3)
        if t < b0 + 9.0:
            mix.put(t, thud(150 + (idx % 5) * 12, 0.03, 0.16), 0.035, pan=((idx % 7) - 3) * 0.08)
            mix.put(t + 0.01, click(5200, 0.006), 0.012)

    for t in tl["explode"]:
        mix.put(t, whoosh(1.0, 300, 2400, 0.6), 0.07)

    s0, s1 = tl["slither"]
    mix.put(s0, motor(s1 - s0, f0=96, grit_hz=900, wobble=0.42 * 2), 0.012)
    mix.put(tl["hood"], whoosh(0.8, 500, 3000, 0.5), 0.06)
    t0, t1 = tl["track"]
    for k in range(int((t1 - t0) / 0.9)):
        mix.put(t0 + 0.4 + k * 0.9, click(4200, 0.01), 0.018)

    # strike: lunges at press + 0.7 s, then every period, until swim starts
    t = tl["strike"] + 0.7
    while t < tl["swim"][0]:
        mix.put(t - 0.25, whoosh(0.35, 400, 3500, 0.7), 0.06)
        mix.put(t + 0.1, thud(70, 0.12, 0.5), 0.16)
        t += tl["strikePeriod"]

    w0, w1 = tl["swim"]
    mix.put(w0, airy(w1 - w0 + 1.5, 260, 520, 0.6), 0.05)
    mix.put(w0 + 0.2, whoosh(1.2, 1800, 300, 0.6), 0.05)
    mix.put(tl["guard"] + 0.2, whoosh(0.9, 500, 2600, 0.5), 0.05)

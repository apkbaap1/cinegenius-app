"""Sound design for the "20 free tools" reel: a light, bright bed (Cmaj9 / Am9 / Fmaj7 / G6, 100 bpm) kept low under
the voice; a soft pop plus two typing ticks for each tool as its card slides in and its name types into the search bar;
an air whoosh on every section change; a strike-through zip and a low impact on the "no need" stamp; a ticking count-up
to 20; a riser into the grid, a 20-tick cascade as the grid fills, a chime on the keyword, and a final impact.
Every time comes from timeline.json.

    python run_sfx.py teardown/tools20-reel/score.py
"""

import os

from sfx.score_kit import bed, chords, hz, thud
from sfx.synth import chime, click, impact, pop, riser, whoosh

HERE = os.path.dirname(os.path.abspath(__file__))
TIMELINE = os.path.join(HERE, "timeline.json")
OUT = os.path.join(os.environ.get("TEARDOWN_OUT", "teardown-out"), "tools20-score.wav")
TARGET_LUFS = -14.0
SEED = 20

CHORDS = chords("Cmaj9:C2 G2 B2 D3 E3/C1", "Am9:A1 E2 G2 B2 C3/A0", "Fmaj7:F1 C2 E2 A2/F0", "G6:G1 D2 E2 B2/G0")
MOTIF = [(0.5, hz("E5")), (1.5, hz("G5")), (2.5, hz("D5"))]


def score(mix, tl):
    dur = tl["duration"]
    left, right, low, drums = bed(dur, 100, CHORDS, MOTIF, motif_voice="blip", kicks=(0, 2.5), snares=(1, 3), hats=8, swing=0.08, keys_vel=0.6, keys_lp=3800)
    mix.put_stereo(0, left, right, 0.10)
    mix.put(0, low, 0.11)
    mix.put(0, drums, 0.05)

    # intro
    mix.put(0.1, whoosh(0.5, 500, 2600, 0.5), 0.05)
    mix.put(tl["strike"], whoosh(0.22, 2500, 5200, 0.8), 0.05)
    mix.put(tl["stamp"], impact(0.9), 0.12)
    mix.put(tl["stamp"], thud(70, 0.1, 0.4), 0.18)
    for i in range(12):
        mix.put(tl["count"] + i * 0.05, click(2600 + i * 90, 0.012), 0.03)
    mix.put(tl["claude"], chime([hz("C6"), hz("G6")], 1.2, 0.4), 0.04)

    # sections and tools
    for t in tl["sections"]:
        mix.put(t - 0.12, whoosh(0.55, 350, 2800, 0.6), 0.06)
    for i, t in enumerate(tl["tools"]):
        mix.put(t - 0.05, pop(500 + i * 18, 900 + i * 25, 0.14), 0.05, pan=0.25)
        mix.put(t + 0.06, click(3600, 0.008), 0.02, pan=-0.3)
        mix.put(t + 0.16, click(3300, 0.008), 0.018, pan=-0.3)

    # proof chips light up
    for t in tl["chips"]:
        mix.put(t, pop(700, 1300, 0.12), 0.05)

    # the grid: riser in, a tick per card, chime on the keyword
    mix.put(tl["grid"] - 1.1, riser(1.1, 300, 4200), 0.05)
    for i in range(20):
        mix.put(tl["grid"] + i * tl["gridStep"], click(2000 + i * 120, 0.01), 0.03, pan=(i % 5 - 2) * 0.2)
    mix.put(tl["cta"], whoosh(0.4, 600, 3000, 0.5), 0.05)
    mix.put(tl["studio"], chime([hz("E6"), hz("B6"), hz("G6")], 1.6, 0.5), 0.05)

    # ending
    mix.put(tl["final"], impact(1.4), 0.1)
    mix.put(tl["final"], chime([hz("C5"), hz("G5"), hz("E6")], 2.0, 0.8), 0.05)
    mix.put(tl["ringOut"], whoosh(0.5, 2600, 400, 0.5), 0.04)

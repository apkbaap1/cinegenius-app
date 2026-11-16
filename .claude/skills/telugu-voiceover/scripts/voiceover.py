#!/usr/bin/env python3
"""Telugu voice-over from a script with hima-tts-nano-te.

Usage:
  python voiceover.py SCRIPT OUT_DIR [--cast "Narrator=Bhavana,Monkey=Pranay"] [--default Bhavana]
                      [--gap 0.6] [--scene-gap 1.2] [--seeds 4] [--length SECONDS]

SCRIPT formats
  .txt  one line of speech per line. Optional speaker label "Name: text" (Telugu or English name).
        A blank line = scene break (longer pause). Lines starting with # are ignored.
        Unlabelled lines use --default. Labels are mapped to voices by --cast; a label that is
        itself a voice name (Bhavana, Srinivas, ...) needs no cast entry.
  .json list of {"id","v","t", "s"?, "e"?}: v = voice, t = text, s/e = start/end seconds on a timeline.
        With s, each line is placed at s; with e too, the take that fits s..e best is chosen.

Writes OUT_DIR/line<NN>.wav per line, OUT_DIR/voiceover.wav (48 kHz mono, -18 LUFS) and
OUT_DIR/report.json (each line's voice, seed, start, end, duration, and whether it overran its slot).
"""
import argparse, json, os, re, subprocess, sys
import numpy as np

VOICES = {"Bhavana": "female", "Lakshmi": "female", "Sravani": "female",
          "Srinivas": "male", "Karthik": "male", "Pranay": "male"}
SR = 24000

# The Telugu normaliser reads digits in Telugu: "3D" -> "మూడు డీ". Tech terms (3D, 2D, 4K, 5G, 1080p)
# are said in English, so a digit glued to Latin letters is spelled as the English number in Telugu script.
EN_NUM = {"0": "జీరో", "1": "వన్", "2": "టూ", "3": "త్రీ", "4": "ఫోర్", "5": "ఫైవ్", "6": "సిక్స్", "7": "సెవెన్",
          "8": "ఎయిట్", "9": "నైన్", "10": "టెన్", "360": "త్రీ సిక్స్టీ", "1080": "టెన్ ఎయిటీ", "720": "సెవెన్ ట్వెంటీ"}
def fix_tech_terms(text):
    def sub(m):
        n, tail = m.group(1), m.group(2)
        return (EN_NUM[n] + (" " + tail if tail else "")) if n in EN_NUM else m.group(0)
    return re.sub(r"(?<![\w.])(\d{1,4})([A-Za-z]{1,3})(?![A-Za-z])", sub, text)

def parse_txt(path, cast, default):
    lines, scene_break, n = [], False, 0
    for raw in open(path, encoding="utf-8"):
        s = raw.strip()
        if not s: scene_break = bool(lines); continue
        if s.startswith("#"): continue
        voice, text = default, s
        m = re.match(r"^([^:：]{1,24})[:：]\s*(.+)$", s)
        if m and (m.group(1).strip() in cast or m.group(1).strip() in VOICES):
            label = m.group(1).strip(); text = m.group(2).strip()
            voice = cast.get(label, label)
        n += 1
        lines.append({"id": f"{n:02d}", "v": voice, "t": text, "scene": scene_break})
        scene_break = False
    return lines

def trim(a, thr=0.01):
    idx = np.where(np.abs(a) > thr)[0]
    return a if len(idx) == 0 else a[max(0, idx[0] - int(.04 * SR)): idx[-1] + int(.12 * SR)]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("script"); ap.add_argument("out")
    ap.add_argument("--cast", default=""); ap.add_argument("--default", default="Bhavana")
    ap.add_argument("--gap", type=float, default=0.6); ap.add_argument("--scene-gap", type=float, default=1.2)
    ap.add_argument("--lead", type=float, default=0.5, help="silence before the first line (text scripts)")
    ap.add_argument("--keep-digits", action="store_true", help="don't respell 3D/4K-style terms in English")
    ap.add_argument("--seeds", type=int, default=4); ap.add_argument("--length", type=float, default=None)
    ap.add_argument("--hima", default=os.environ.get("HIMA_DIR", os.path.expanduser("~/.cache/hima-tts-nano-te")))
    a = ap.parse_args()
    cast = dict(kv.split("=", 1) for kv in a.cast.split(",") if "=" in kv)
    cast = {k.strip(): v.strip() for k, v in cast.items()}
    lines = json.load(open(a.script, encoding="utf-8")) if a.script.endswith(".json") else parse_txt(a.script, cast, a.default)
    for L in lines:
        if not a.keep_digits:
            fixed = fix_tech_terms(L["t"])
            if fixed != L["t"]: print(f"{L['id']}: read as -> {fixed}")
            L["t"] = fixed
        if L["v"] not in VOICES and not L["v"].endswith((".wav", ".safetensors")):
            sys.exit(f"line {L['id']}: unknown voice {L['v']!r}; use one of {', '.join(VOICES)} or a .wav/.safetensors voice file")
    out = os.path.abspath(a.out); os.makedirs(out, exist_ok=True)
    a.hima = os.path.abspath(a.hima); sys.path.insert(0, a.hima)
    from hima_tts import TTS
    tts = TTS(a.hima)
    report, t = [], a.lead
    for L in lines:
        slot = (L["e"] - L["s"]) if "s" in L and "e" in L else None
        best = None
        for seed in range(a.seeds if slot else 1):
            audio = trim(np.asarray(tts.say(L["t"], voice=L["v"], seed=seed), dtype=np.float32))
            over = max(0.0, len(audio) / SR - slot) if slot else 0.0
            if best is None or over < best[0]: best = (over, seed, audio)
            if over == 0: break
        over, seed, audio = best
        audio = audio / (np.abs(audio).max() + 1e-9) * 0.8
        tts.save(audio, os.path.join(out, f"line{L['id']}.wav"))
        if "s" in L: start = L["s"]
        else:
            if report: t += a.scene_gap if L.get("scene") else a.gap
            start = t
        dur = len(audio) / SR; t = start + dur
        report.append({"id": L["id"], "voice": L["v"], "seed": seed, "start": round(start, 2), "end": round(t, 2),
                       "dur": round(dur, 2), "overrun": round(over, 2), "text": L["t"]})
        print(f"{L['id']} {L['v']:<9} {start:6.2f}-{t:6.2f}" + (f"  OVERRUN {over:.2f}s" if over else ""), flush=True)
    total = a.length or (max(r["end"] for r in report) + 1.0)
    mix = np.zeros(int(total * SR) + 1, np.float32)
    import soundfile as sf
    prev = None
    for r in report:
        if prev and r["start"] < prev["end"] - 0.01: print(f"WARNING: line {r['id']} overlaps line {prev['id']}")
        x, _ = sf.read(os.path.join(out, f"line{r['id']}.wav"), dtype="float32")
        i = int(r["start"] * SR); x = x[: max(0, len(mix) - i)]; mix[i:i + len(x)] += x; prev = r
    raw = os.path.join(out, "voiceover_raw.wav"); sf.write(raw, mix, SR)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", "loudnorm=I=-18:TP=-2", "-ar", "48000",
                    os.path.join(out, "voiceover.wav")], check=True)
    os.remove(raw)
    json.dump({"length": round(total, 2), "lines": report}, open(os.path.join(out, "report.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print(f"voiceover.wav: {total:.2f}s, {len(report)} lines -> {out}")

if __name__ == "__main__":
    main()

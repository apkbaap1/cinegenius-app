import json, sys, numpy as np, soundfile as sf
d = sys.argv[1]; SR = 24000; TOTAL = 80.0
lines = json.load(open(f"{d}/lines.json"))
shift = {"12": 53.2, "13": 59.3}   # line 12 runs long; nudge it and the next line
out = np.zeros(int(TOTAL*SR), np.float32); prev_end = 0
for L in lines:
    a, sr = sf.read(f"{d}/line{L['id']}.wav", dtype="float32"); assert sr == SR
    if a.ndim > 1: a = a.mean(1)
    a = a / (np.abs(a).max() + 1e-9) * 0.8
    st = shift.get(L["id"], L["s"]); i = int(st*SR)
    assert st >= prev_end - 0.01, (L["id"], st, prev_end)
    out[i:i+len(a)] += a; prev_end = st + len(a)/SR
    print(L["id"], f"{st:.2f}-{prev_end:.2f}")
sf.write(f"{d}/voiceover_raw.wav", out, SR)

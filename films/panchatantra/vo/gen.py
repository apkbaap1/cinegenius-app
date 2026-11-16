import json, sys, os, numpy as np
MODEL, OUT = sys.argv[1], sys.argv[2]
sys.path.insert(0, MODEL); os.chdir(MODEL)
from hima_tts import TTS
tts = TTS(".")
lines = json.load(open(os.path.join(OUT, "lines.json")))
SR = 24000
def trim(a, thr=0.01):
    idx = np.where(np.abs(a) > thr)[0]
    return a if len(idx)==0 else a[max(0, idx[0]-int(.04*SR)): idx[-1]+int(.12*SR)]
report = []
for L in lines:
    slot = L["e"] - L["s"]; best = None
    for seed in range(4):
        a = trim(np.asarray(tts.say(L["t"], voice=L["v"], seed=seed), dtype=np.float32))
        d = len(a)/SR
        score = (d - slot) if d > slot else 0  # prefer fits; among fits take seed 0 order
        if best is None or score < best[0]: best = (score, seed, a, d)
        if score == 0: break
    _, seed, a, d = best
    tts.save(a, os.path.join(OUT, f"line{L['id']}.wav"))
    report.append((L["id"], L["v"], seed, round(d,2), round(slot,2)))
    print(report[-1], flush=True)
json.dump(report, open(os.path.join(OUT, "report.json"), "w"))

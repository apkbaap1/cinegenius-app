import sys, subprocess, numpy as np
from faster_whisper import WhisperModel
m = WhisperModel(sys.argv[1], device="cpu", compute_type="int8")
for f in sys.argv[2:]:
    print("==", f)
    a = np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',f,'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True).stdout, np.float32)
    segs, info = m.transcribe(a, language="hi", word_timestamps=True, vad_filter=False, beam_size=5)
    for s in segs:
        print(" ".join(f"[{w.start:.1f}]{w.word.strip()}" for w in (s.words or [])))

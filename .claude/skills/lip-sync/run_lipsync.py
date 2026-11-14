#!/usr/bin/env python3
"""Run SadTalker-Video-Lip-Sync on a prepared work folder and finish the file.

    python3 run_lipsync.py --check                       # is this machine ready?
    python3 run_lipsync.py WORKDIR --out final.mp4       # run the model + finish
    python3 run_lipsync.py WORKDIR --out final.mp4 --finish-only RAW.mp4

WORKDIR comes from prep_inputs.py. The install comes from setup.sh; point
LIPSYNC_HOME (or --home) at it. --finish-only skips the model and only does the
last step (H.264 re-encode, original audio back) on a raw result made
elsewhere, so it needs nothing but ffmpeg.
"""
import argparse
import glob
import json
import os
import shutil
import subprocess
import sys

DEFAULT_HOME = os.path.expanduser("~/sadtalker-lipsync")

# Everything inference.py opens from checkpoints/ on a normal run.
WEIGHTS = [
    "BFM_Fitting",
    "shape_predictor_68_face_landmarks.dat",
    "epoch_20.pth",
    "wav2lip.pth",
    "auido2pose_00140-model.pth",
    "auido2exp_00300-model.pth",
    "facevid2vid_00189-model.pth.tar",
    "mapping_00109-model.pth.tar",
    "GFPGANv1.3.pth",
    "GPEN-BFR-512.pth",
    "ParseNet-latest.pth",
    "RetinaFace-R50.pth",
]


def die(msg):
    sys.exit(f"error: {msg}")


def venv_python(home):
    for rel in ("venv/bin/python", "venv/Scripts/python.exe"):
        p = os.path.join(home, rel)
        if os.path.isfile(p):
            return p
    return None


def gpu():
    if not shutil.which("nvidia-smi"):
        return None
    res = subprocess.run(
        ["nvidia-smi", "--query-gpu=name,memory.total",
         "--format=csv,noheader"], capture_output=True, text=True)
    return res.stdout.strip().splitlines()[0] if res.returncode == 0 and res.stdout.strip() else None


def check(home, need_dain=False, quiet=False):
    """Return a list of problems; print a report unless quiet."""
    rows, problems = [], []

    def row(name, ok, detail):
        rows.append((name, ok, detail))
        if not ok:
            problems.append(f"{name}: {detail}")

    g = gpu()
    row("NVIDIA GPU", bool(g), g or "none found (nvidia-smi missing or failed)")
    row("ffmpeg", bool(shutil.which("ffmpeg")), shutil.which("ffmpeg") or "not on PATH")

    repo = os.path.join(home, "repo")
    has_repo = os.path.isfile(os.path.join(repo, "inference.py"))
    row("install", has_repo, repo if has_repo else f"not found at {repo}; run setup.sh")
    py = venv_python(home)
    row("venv", bool(py), py or "not found; run setup.sh")
    if py:
        res = subprocess.run(
            [py, "-c", "import torch;print(torch.__version__, torch.cuda.is_available())"],
            capture_output=True, text=True)
        ok = res.returncode == 0 and res.stdout.strip().endswith("True")
        row("torch + CUDA", ok, res.stdout.strip() or res.stderr.strip()[-200:])
    if has_repo:
        ck = os.path.join(repo, "checkpoints")
        need = WEIGHTS + (["DAIN_weight"] if need_dain else [])
        missing = [w for w in need if not os.path.exists(os.path.join(ck, w))]
        row("weights", not missing,
            f"all {len(need)} present" if not missing else "missing " + ", ".join(missing))

    if not quiet:
        for name, ok, detail in rows:
            print(f"  {'ok  ' if ok else 'FAIL'}  {name:<13} {detail}")
        print("ready to run." if not problems else
              "not ready. This machine cannot run the model as it stands.")
    return problems


def newest_result(result_dir, dain):
    pattern = "*_full_dain.mp4" if dain else "*_full.mp4"
    hits = glob.glob(os.path.join(result_dir, "*", pattern))
    if not dain:
        hits = [h for h in hits if not h.endswith("_full_dain.mp4")]
    return max(hits, key=os.path.getmtime) if hits else None


def finish(raw, audio, out):
    """Re-encode the raw result to H.264 and put the full-quality audio back."""
    if not shutil.which("ffmpeg"):
        die("ffmpeg not found on PATH")
    if not os.path.isfile(raw):
        die(f"no such file: {raw}")
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    cmd = ["ffmpeg", "-y", "-v", "error", "-i", raw]
    if audio and os.path.isfile(audio):
        cmd += ["-i", audio, "-map", "0:v:0", "-map", "1:a:0", "-shortest"]
    else:
        print("  note: original audio not found; keeping the 16 kHz track")
    cmd += ["-c:v", "libx264", "-crf", "16", "-preset", "medium",
            "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
            "-movflags", "+faststart", out]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        die("ffmpeg failed:\n" + res.stderr.strip()[-1500:])
    print(f"done: {out}")


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("workdir", nargs="?", help="folder made by prep_inputs.py")
    ap.add_argument("--out", help="path of the finished MP4")
    ap.add_argument("--home", default=os.environ.get("LIPSYNC_HOME", DEFAULT_HOME),
                    help="install folder made by setup.sh")
    ap.add_argument("--enhancer", choices=["none", "lip", "face"], default="lip")
    ap.add_argument("--dain", action="store_true", help="interpolate to 50 fps")
    ap.add_argument("--time-step", type=float, default=0.5,
                    help="DAIN step: 0.5 gives 50 fps, 0.25 gives 100")
    ap.add_argument("--batch-size", type=int, default=1)
    ap.add_argument("--cpu", action="store_true")
    ap.add_argument("--check", action="store_true", help="report readiness and exit")
    ap.add_argument("--finish-only", metavar="RAW",
                    help="skip the model; finish this raw result file")
    args = ap.parse_args()
    home = os.path.abspath(os.path.expanduser(args.home))

    if args.check:
        sys.exit(1 if check(home, args.dain) else 0)

    if not args.workdir or not args.out:
        ap.error("WORKDIR and --out are required")
    job_path = os.path.join(args.workdir, "job.json")
    if not os.path.isfile(job_path):
        die(f"{job_path} not found; run prep_inputs.py first")
    with open(job_path) as f:
        job = json.load(f)

    if args.finish_only:
        finish(args.finish_only, job.get("audio_full"), args.out)
        return

    problems = check(home, args.dain, quiet=True)
    if args.cpu:
        problems = [p for p in problems
                    if not p.startswith(("NVIDIA GPU", "torch + CUDA"))]
    if problems:
        die("this machine is not ready:\n  " + "\n  ".join(problems) +
            "\nrun with --check for the full report")

    repo = os.path.join(home, "repo")
    result_dir = os.path.abspath(os.path.join(args.workdir, "results"))
    os.makedirs(result_dir, exist_ok=True)
    # inference.py opens checkpoints/ by relative path, so it must run from
    # the repo root with absolute input paths.
    cmd = [venv_python(home), "inference.py",
           "--driven_audio", job["audio"], "--source_video", job["video"],
           "--result_dir", result_dir, "--enhancer", args.enhancer,
           "--batch_size", str(args.batch_size)]
    if args.dain:
        cmd += ["--use_DAIN", "--time_step", str(args.time_step)]
    if args.cpu:
        cmd += ["--cpu"]
    print("running:", " ".join(cmd))
    res = subprocess.run(cmd, cwd=repo)
    if res.returncode != 0:
        die(f"inference.py exited with code {res.returncode}; see its output above")

    raw = newest_result(result_dir, args.dain)
    if raw is None:
        # inference.py returns 0 without output when it finds no face
        die("the model wrote no result. The usual cause is no face detected "
            "on the first frame; check it and re-run prep on a better section.")
    print(f"raw result: {raw}")
    finish(raw, job.get("audio_full"), args.out)


if __name__ == "__main__":
    main()

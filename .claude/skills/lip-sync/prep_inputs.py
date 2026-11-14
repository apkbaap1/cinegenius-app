#!/usr/bin/env python3
"""Prepare a video and an audio file for SadTalker-Video-Lip-Sync.

The model assumes 25 fps video and reads audio at 16 kHz. It holds every frame
in memory, and it stops at whichever input ends first. This script converts
both inputs, trims them to the same length, and writes a job.json that
run_lipsync.py reads. Needs only Python 3 and ffmpeg/ffprobe.

    python3 prep_inputs.py VIDEO AUDIO --out WORKDIR [--max-height 720]
                                       [--start 0] [--duration 20]
"""
import argparse
import json
import os
import shutil
import subprocess
import sys

FPS = 25
# The model keeps uncompressed frames in RAM several times over; this is the
# size of one copy above which a 16 GB machine is likely to run out.
WARN_FRAME_BYTES = 3 * 1024 ** 3


def die(msg):
    sys.exit(f"error: {msg}")


def probe(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-print_format", "json",
         "-show_format", "-show_streams", path],
        capture_output=True, text=True)
    if out.returncode != 0:
        die(f"cannot read {path}: {out.stderr.strip()}")
    return json.loads(out.stdout)


def stream(info, kind):
    for s in info.get("streams", []):
        if s.get("codec_type") == kind:
            return s
    return None


def duration(info, s):
    for src in (s, info.get("format", {})):
        try:
            return float(src["duration"])
        except (KeyError, TypeError, ValueError):
            pass
    return 0.0


def fps_of(s):
    num, _, den = s.get("avg_frame_rate", "0/1").partition("/")
    try:
        return float(num) / float(den or 1)
    except (ValueError, ZeroDivisionError):
        return 0.0


def run(cmd):
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        die("ffmpeg failed:\n" + res.stderr.strip()[-1500:])


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("video")
    ap.add_argument("audio")
    ap.add_argument("--out", required=True, help="work folder to create")
    ap.add_argument("--max-height", type=int, default=0,
                    help="downscale the video to this height (e.g. 720)")
    ap.add_argument("--start", type=float, default=0.0,
                    help="start of the video section to use, seconds")
    ap.add_argument("--duration", type=float, default=0.0,
                    help="length of the video section to use, seconds")
    ap.add_argument("--audio-start", type=float, default=0.0,
                    help="start of the audio section to use, seconds")
    args = ap.parse_args()

    for tool in ("ffmpeg", "ffprobe"):
        if not shutil.which(tool):
            die(f"{tool} not found on PATH")
    for p in (args.video, args.audio):
        if not os.path.isfile(p):
            die(f"no such file: {p}")

    vinfo, ainfo = probe(args.video), probe(args.audio)
    vs, as_ = stream(vinfo, "video"), stream(ainfo, "audio")
    if vs is None:
        die(f"{args.video} has no video stream")
    if as_ is None:
        die(f"{args.audio} has no audio stream")

    vdur = duration(vinfo, vs) - args.start
    if args.duration > 0:
        vdur = min(vdur, args.duration)
    adur = duration(ainfo, as_) - args.audio_start
    if vdur <= 0 or adur <= 0:
        die("nothing left after --start / --audio-start")
    length = min(vdur, adur)
    # whole frames only, so both files end on the same frame
    frames = int(length * FPS)
    if frames < FPS // 2:
        die(f"only {length:.2f} s of overlap; need at least half a second")
    length = frames / FPS

    w, h = int(vs["width"]), int(vs["height"])
    # phone footage stores rotation as metadata; ffmpeg applies it on decode
    rot = 0
    for sd in vs.get("side_data_list", []):
        if "rotation" in sd:
            rot = int(sd["rotation"])
    if abs(rot) in (90, 270):
        w, h = h, w
    ow, oh = w, h
    if args.max_height and h > args.max_height:
        ow = int(round(w * args.max_height / h / 2)) * 2
        oh = args.max_height // 2 * 2
    ow, oh = ow // 2 * 2, oh // 2 * 2

    os.makedirs(args.out, exist_ok=True)
    v_out = os.path.join(args.out, "video_25fps.mp4")
    a_out = os.path.join(args.out, "audio_16k.wav")
    a_full = os.path.join(args.out, "audio_full.wav")

    run(["ffmpeg", "-y", "-v", "error", "-ss", str(args.start), "-i", args.video,
         "-t", f"{length:.3f}", "-an", "-vf", f"fps={FPS},scale={ow}:{oh}",
         "-c:v", "libx264", "-crf", "14", "-preset", "medium",
         "-pix_fmt", "yuv420p", v_out])
    # what the model listens to
    run(["ffmpeg", "-y", "-v", "error", "-ss", str(args.audio_start),
         "-i", args.audio, "-t", f"{length:.3f}", "-vn",
         "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", a_out])
    # what the viewer hears: same cut, original channels and sample rate
    run(["ffmpeg", "-y", "-v", "error", "-ss", str(args.audio_start),
         "-i", args.audio, "-t", f"{length:.3f}", "-vn",
         "-c:a", "pcm_s16le", a_full])

    warnings = []
    src_fps = fps_of(vs)
    if src_fps and abs(src_fps - FPS) > 0.01:
        warnings.append(
            f"source is {src_fps:.2f} fps; converted to {FPS}. The result "
            f"will be {FPS} fps.")
    gap = abs(vdur - adur)
    if gap > 0.5:
        longer = "video" if vdur > adur else "audio"
        warnings.append(
            f"the {longer} is {gap:.1f} s longer; both were cut to "
            f"{length:.1f} s. Use --start/--duration/--audio-start to choose "
            f"which part.")
    one_copy = frames * ow * oh * 3
    if one_copy > WARN_FRAME_BYTES:
        warnings.append(
            f"{frames} frames at {ow}x{oh} is {one_copy / 1024 ** 3:.1f} GB "
            f"uncompressed per copy and the model keeps several. Expect to "
            f"run out of RAM: shorten the clip or pass --max-height 720.")
    if oh < 360:
        warnings.append(
            f"video is only {oh} px tall; the face may be too small to detect.")

    job = {
        "video": os.path.abspath(v_out),
        "audio": os.path.abspath(a_out),
        "audio_full": os.path.abspath(a_full),
        "source_video": os.path.abspath(args.video),
        "source_audio": os.path.abspath(args.audio),
        "seconds": round(length, 3),
        "frames": frames,
        "width": ow,
        "height": oh,
        "fps": FPS,
        "warnings": warnings,
    }
    with open(os.path.join(args.out, "job.json"), "w") as f:
        json.dump(job, f, indent=2)

    print(f"ready: {args.out}")
    print(f"  video  {ow}x{oh}, {FPS} fps, {length:.2f} s, {frames} frames")
    print(f"  audio  16 kHz mono for the model, original kept for the final file")
    for wmsg in warnings:
        print(f"  warning: {wmsg}")
    print("check the first frame shows one face with a visible mouth, then:")
    print(f"  python3 run_lipsync.py {args.out} --out final.mp4")


if __name__ == "__main__":
    main()

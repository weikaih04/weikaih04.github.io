#!/usr/bin/env python3
"""Build the theme montages from untouched local paper videos, at original speed.

Run from any directory: python3 scripts/build_research_montages.py
Inspect the edit list without encoding: python3 scripts/build_research_montages.py --manifest

The orchestrator uses only Python's standard library and installed ffmpeg/ffprobe.
Fit each complete source into the full 768x432 canvas, preserving its aspect ratio
with only the padding needed to fit. No added text or graphics; source-internal
labels remain untouched. Timing, layout and poster positions are fixed below.
"""

import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile


ROOT = Path(__file__).resolve().parents[1]
WIDTH, HEIGHT, FPS = 768, 432, 24
# (original paper filename / start seconds / length seconds)
EDL = {
    "3d": [("wilddet3d", 28, 4), ("wilddet3d", 36, 4), ("wilddet3d", 44, 4)],
    "robotics": [("reflex", 0, 4), ("gam", 19, 4), ("molmoact2", 35, 4)],
    "multimodal": [("ipt", 11, 4), ("molmo2", 46, 4), ("molmo2", 51, 7)],
}
# Show the question from Molmo2's complete seven-second Q&A excerpt.
POSTER_SECONDS = {"3d": 1.5, "robotics": 1.5, "multimodal": 9.5}


def run(*args):
    return subprocess.run([str(arg) for arg in args], check=True, capture_output=True)


def probe(path):
    return json.loads(run("ffprobe", "-v", "error", "-show_streams", "-show_format",
                          "-of", "json", path).stdout)


def manifest():
    return {
        "width": WIDTH, "height": HEIGHT, "fps": FPS, "playback_rate": 1,
        "fit": "contain", "overlays": False,
        "audio": False, "transition": "hard cut",
        "themes": {
            theme: {
                "video": f"img/research/{theme}.mp4",
                "poster": f"img/research/{theme}.jpg",
                "poster_seconds": POSTER_SECONDS[theme],
                "duration": sum(length for _, _, length in edits),
                "segments": [
                    {"paper_id": paper, "source": f"img/papers/{paper}.mp4",
                     "start": start, "length": length}
                    for paper, start, length in edits
                ],
            }
            for theme, edits in EDL.items()
        },
    }


def verify(path, edits):
    duration = sum(length for _, _, length in edits)
    data = probe(path)
    if len(data["streams"]) != 1:
        raise ValueError(f"Expected one video stream and no audio: {path}")
    stream = data["streams"][0]
    expected = {"codec_name": "h264", "pix_fmt": "yuv420p", "width": WIDTH,
                "height": HEIGHT, "r_frame_rate": f"{FPS}/1", "nb_frames": str(round(duration * FPS))}
    for key, value in expected.items():
        if stream.get(key) != value:
            raise ValueError(f"{path}: {key}={stream.get(key)!r}, expected {value!r}")
    if abs(float(data["format"]["duration"]) - duration) > 0.001:
        raise ValueError(f"Expected exactly {duration} seconds: {path}")


def build():
    for executable in ("ffmpeg", "ffprobe"):
        if not shutil.which(executable):
            raise ValueError(f"Missing installed executable: {executable}")
    filters = run("ffmpeg", "-hide_banner", "-filters").stdout.decode()
    available = {line.split()[1] for line in filters.splitlines() if len(line.split()) >= 3}
    required = {"scale", "pad", "fps", "setpts", "setsar", "format"}
    if not required <= available:
        raise ValueError(f"Missing ffmpeg filters: {sorted(required - available)}")
    data = manifest()
    # Check all source bounds before encoding; these files are read only.
    originals = sorted({segment[0] for edits in EDL.values() for segment in edits})
    for paper in originals:
        source = ROOT / f"img/papers/{paper}.mp4"
        duration = float(next(s for s in probe(source)["streams"]
                              if s["codec_type"] == "video")["duration"])
        if any(start + length > duration for edits in EDL.values()
               for name, start, length in edits if name == paper):
            raise ValueError(f"EDL extends beyond the source video: {source}")
    data["source_sha256"] = {
        f"img/papers/{paper}.mp4": hashlib.sha256(
            (ROOT / f"img/papers/{paper}.mp4").read_bytes()).hexdigest()
        for paper in originals
    }
    output = ROOT / "img/research"
    output.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="research-montages-") as directory:
        work = Path(directory)
        for theme, edits in EDL.items():
            parts = []
            for index, (paper, start, length) in enumerate(edits):
                part = work / f"{theme}-{index}.mp4"
                # Use the full canvas without cropping or changing source speed.
                graph = (
                    f"setpts=PTS-STARTPTS,fps={FPS},"
                    f"scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=decrease:"
                    "force_divisible_by=2:reset_sar=1:flags=lanczos,"
                    f"pad={WIDTH}:{HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=black,"
                    "setsar=1,format=yuv420p"
                )
                run("ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
                    "-ss", start, "-t", length, "-i", ROOT / f"img/papers/{paper}.mp4",
                    "-vf", graph, "-map", "0:v:0", "-an",
                    "-frames:v", length * FPS, "-c:v", "libx264", "-preset", "slow",
                    "-crf", "24", "-maxrate", "1500k", "-bufsize", "3000k",
                    "-threads", "1", "-pix_fmt", "yuv420p", "-video_track_timescale", "24000", part)
                parts.append(part)
                print(f"{theme}: {paper} [{start}, {start + length}) at 1x", flush=True)
            listing = work / f"{theme}.txt"
            # Relative generated filenames avoid concat-demuxer path escaping.
            listing.write_text("".join(f"file '{part.name}'\n" for part in parts))
            video, poster = work / f"{theme}.mp4", work / f"{theme}.jpg"
            run("ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
                "-f", "concat", "-i", listing, "-map", "0:v:0", "-an", "-c", "copy",
                "-movflags", "+faststart", video)
            verify(video, edits)
            run("ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
                "-ss", POSTER_SECONDS[theme], "-i", video,
                "-frames:v", "1", "-q:v", "2", poster)
        # Publish only complete, validated local builds. Originals are never outputs.
        for theme in EDL:
            for extension in ("mp4", "jpg"):
                target = output / f"{theme}.{extension}"
                shutil.copyfile(work / target.name, target)
                print(f"{target.relative_to(ROOT)}: {target.stat().st_size:,} bytes", flush=True)
        (output / "manifest.json").write_text(json.dumps(data, indent=2) + "\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", action="store_true", help="Print the EDL without encoding")
    args = parser.parse_args()
    if args.manifest:
        print(json.dumps(manifest(), indent=2))
        return
    try:
        build()
    except subprocess.CalledProcessError as error:
        parser.exit(1, error.stderr.decode(errors="replace") + "\n")
    except (ValueError, OSError) as error:
        parser.exit(1, str(error) + "\n")


if __name__ == "__main__":
    main()

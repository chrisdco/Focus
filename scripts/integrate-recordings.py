"""Integrate curated ambience recordings into Foco's mixer beds.

Takes long source recordings, picks a stable 60s window, level-matches,
builds a seamless loop, and encodes mono MP3s the mixer loads directly.
Cues and white-noise stay synthesized (see craft-sounds.py).

Usage:  python scripts/integrate-recordings.py
Needs:  numpy, ffmpeg. Edit INPUTS to point at the source files.
"""

import os
import subprocess

import numpy as np

SR = 22050
LOOP_S = 60
FADE_S = 2.0
TARGET_RMS = 0.05
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "sounds")

INPUTS = {
    # (source path, window strategy)
    "fireplace.mp3": (
        r"C:\Users\HP\Downloads\king_of_the_christmas-fireplace-loop-original-noise-178209.mp3",
        ("fixed", 60.0),
    ),
    "cafe.mp3": (
        r"C:\Users\HP\Downloads\freesound_community-cofee-shop-ambience-59432.mp3",
        ("median",),
    ),
    "forest.mp3": (
        r"C:\Users\HP\Downloads\mixkit-forest-birds-ambience-1210.wav",
        ("liveliest",),
    ),
    "rain.mp3": (
        r"C:\Users\HP\Downloads\dragon-studio-gentle-rain-01-437313.mp3",
        ("fixed", 120.0),
    ),
}


def load_mono(path: str) -> np.ndarray:
    r = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR),
         "-f", "s16le", "-"],
        capture_output=True,
        check=True,
    )
    return np.frombuffer(r.stdout, dtype=np.int16).astype(float) / 32768


def window_rms(x: np.ndarray, seconds: float) -> np.ndarray:
    w = int(seconds * SR)
    n = len(x) // w
    return np.array([np.sqrt((x[i * w:(i + 1) * w] ** 2).mean()) for i in range(n)])


def pick_window(x: np.ndarray, strategy: tuple) -> np.ndarray:
    need = int(LOOP_S * SR)
    kind = strategy[0]
    if kind == "fixed":
        start = int(strategy[1] * SR)
        return x[start:start + need]
    rms = window_rms(x, 10.0)
    usable = len(rms) - LOOP_S // 10
    if kind == "liveliest":
        idx = int(np.argmax([rms[i:i + 6].mean() for i in range(usable)]))
    else:  # median: steadiest representative section
        med = float(np.median(rms))
        idx = int(min(range(usable), key=lambda i: abs(rms[i:i + 6].mean() - med)))
    return x[idx * 10 * SR:idx * 10 * SR + need]


def seamless_loop(x: np.ndarray) -> np.ndarray:
    f = int(FADE_S * SR)
    t = np.linspace(0, np.pi / 2, f)
    y = x.copy()
    y[:f] = x[:f] * np.sin(t) ** 2 + x[-f:] * np.cos(t) ** 2
    return y[:-f]


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    for name, (src, strategy) in INPUTS.items():
        x = load_mono(src)
        seg = pick_window(x, strategy)
        rms = float(np.sqrt((seg**2).mean()))
        seg = seg / rms * TARGET_RMS
        peak = float(np.abs(seg).max())
        if peak > 0.89:
            # Soft-saturate transients instead of turning everything down,
            # then re-match level so all beds sit together in the mixer.
            drive = peak / 0.89
            seg = np.tanh(seg * drive) / np.tanh(drive) * 0.89
            seg = seg / float(np.sqrt((seg**2).mean())) * TARGET_RMS
        loop = seamless_loop(seg)
        tmp = os.path.join(OUT, "_bed.wav")
        import wave

        with wave.open(tmp, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes((loop * 32767).astype(np.int16).tobytes())
        out = os.path.join(OUT, name)
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", tmp,
             "-ar", "44100", "-codec:a", "libmp3lame", "-b:a", "128k", out],
            check=True,
        )
        os.remove(tmp)
        final_rms = float(np.sqrt((loop**2).mean()))
        print(f"wrote {name} ({len(loop) / SR:.1f}s, rms {final_rms:.3f}) "
              f"from {os.path.basename(src)}")
    print("done — delete the old rain/forest/cafe/fireplace .wav beds")


if __name__ == "__main__":
    main()

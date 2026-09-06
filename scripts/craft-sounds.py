"""Reproducible sound pipeline for Foco.

Regenerates every cue and ambience asset with proper envelopes, harmonic
partials, and seamless loops. Same filenames and picker ids, so no code
changes and existing user selections keep working.

Usage:  python scripts/craft-sounds.py
Needs:  numpy, ffmpeg (only for complete.mp3)
"""

import os
import subprocess

import numpy as np

SR = 22050
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "sounds")
rng = np.random.default_rng(7)


def write_wav(name: str, x: np.ndarray, peak: float = 0.6) -> None:
    x = np.asarray(x, dtype=float)
    xmax = float(np.abs(x).max())
    if xmax > 0:
        x = x / xmax * peak
    # 5ms edge fades defeat clicks.
    edge = int(0.005 * SR)
    fade = np.linspace(0.0, 1.0, edge)
    x[:edge] *= fade
    x[-edge:] *= fade[::-1]
    path = os.path.join(OUT, name)
    import wave

    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
    print(f"wrote {name} ({len(x) / SR:.2f}s, peak {float(np.abs(x).max()):.2f})")


def tone(freq: float, dur: float, partials=((1.0, 1.0),), attack=0.008, tau=0.4):
    """Sine stack with exponential decay."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for ratio, amp in partials:
        x += amp * np.sin(2 * np.pi * freq * ratio * t)
    env = np.exp(-t / tau)
    a = max(1, int(attack * SR))
    env[:a] *= np.linspace(0.0, 1.0, a)
    return x * env


def place(track: np.ndarray, note: np.ndarray, at: float) -> None:
    i = int(at * SR)
    j = min(len(track), i + len(note))
    track[i:j] += note[: j - i]


# ---------------------------------------------------------------- cues ---
def make_cues() -> None:
    mellow = ((1.0, 1.0), (2.0, 0.35), (3.0, 0.12))

    chime = np.zeros(int(1.6 * SR))
    place(chime, tone(659.25, 1.4, mellow, tau=0.5), 0.0)  # E5
    place(chime, tone(880.0, 1.2, mellow, tau=0.5), 0.18)  # A5
    write_wav("cue-chime.wav", chime)

    ping = tone(987.5, 0.7, mellow, attack=0.005, tau=0.22)  # B5
    write_wav("cue-ping.wav", ping)

    bell_partials = ((1.0, 1.0), (2.02, 0.5), (2.74, 0.32), (3.76, 0.18))
    write_wav("cue-bell.wav", tone(440.0, 1.8, bell_partials, tau=0.8))

    wood = tone(330.0, 0.35, ((1.0, 1.0), (4.0, 0.25)), attack=0.004, tau=0.09)
    write_wav("cue-wood.wav", wood)

    soft = np.zeros(int(1.4 * SR))
    place(soft, tone(392.0, 1.1, mellow, attack=0.05, tau=0.5), 0.0)  # G4
    place(soft, tone(329.63, 1.0, mellow, attack=0.05, tau=0.5), 0.3)  # E4
    write_wav("cue-break-soft.wav", soft)

    airy = np.zeros(int(1.6 * SR))
    pad = tone(220.0, 1.6, mellow, attack=0.15, tau=0.9) + 0.7 * tone(
        329.63, 1.6, mellow, attack=0.15, tau=0.9
    )
    breath = np.random.default_rng(11).standard_normal(len(airy))
    breath = fft_filter(breath, 400, 2500) * 0.15
    swell = np.sin(np.linspace(0, np.pi, len(airy))) ** 2
    place(airy, pad + breath * swell, 0.0)
    write_wav("cue-break-air.wav", airy)

    classic = np.zeros(int(2.2 * SR))
    for i, f in enumerate((523.25, 659.25, 783.99, 1046.5)):  # C5 E5 G5 C6
        place(classic, tone(f, 1.6, mellow, tau=0.55), i * 0.14)
    tmp = os.path.join(OUT, "_complete.wav")
    write_wav("_complete.wav", classic, peak=0.55)
    mp3 = os.path.join(OUT, "complete.mp3")
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-codec:a", "libmp3lame",
         "-b:a", "128k", mp3],
        check=True,
    )
    os.remove(tmp)
    print(f"wrote complete.mp3")


# -------------------------------------------------------------- ambience ---
def fft_filter(x: np.ndarray, low: float, high: float) -> np.ndarray:
    n = len(x)
    spec = np.fft.rfft(x)
    freqs = np.fft.rfftfreq(n, 1 / SR)
    mask = (freqs >= low) & (freqs <= high)
    spec[~mask] = 0
    return np.fft.irfft(spec, n)


def brown(n: int) -> np.ndarray:
    x = np.cumsum(rng.standard_normal(n))
    x -= np.linspace(x[0], x[-1], n)
    return x / (np.abs(x).max() + 1e-9)


def seamless(x: np.ndarray, fade_s: float = 1.5) -> np.ndarray:
    """Equal-power crossfade of tail into head for click-free loops."""
    f = int(fade_s * SR)
    t = np.linspace(0, np.pi / 2, f)
    y = x.copy()
    y[:f] = x[:f] * np.sin(t) ** 2 + x[-f:] * np.cos(t) ** 2
    return y[:-f] if len(y) > f else y


def loop_pad(dur: float, fade_s: float = 1.5) -> int:
    return int((dur + fade_s) * SR)


def make_ambience() -> None:
    dur, fade = 8.0, 1.5

    # Rain: bright hiss with slow swells + patter.
    n = loop_pad(dur, fade)
    rain = fft_filter(rng.standard_normal(n), 1200, 8000)
    t = np.arange(n) / SR
    rain *= 1 + 0.22 * np.sin(2 * np.pi * 0.15 * t) + 0.08 * np.sin(2 * np.pi * 2.7 * t)
    write_wav("rain.wav", seamless(rain, fade), peak=0.4)

    # Forest: dark bed + sparse chirps.
    n = loop_pad(dur, fade)
    bed = fft_filter(brown(n), 80, 600) * 0.8
    chirp_rng = np.random.default_rng(21)
    for _ in range(6):
        at = float(chirp_rng.uniform(0, dur))
        f0 = float(chirp_rng.uniform(2600, 3400))
        m = int(0.14 * SR)
        tt = np.arange(m) / SR
        chirp = np.sin(2 * np.pi * (f0 * tt + 2500 * tt**2)) * np.exp(-tt / 0.05) * 0.12
        i = int(at * SR)
        bed[i : i + m] += chirp[: max(0, min(m, len(bed) - i))]
    bed *= 1 + 0.15 * np.sin(2 * np.pi * 0.1 * np.arange(n) / SR)
    write_wav("forest.wav", seamless(bed, fade), peak=0.45)

    # Cafe: warm murmur bed + syllabic swells + rare soft clinks.
    n = loop_pad(dur, fade)
    murmur = fft_filter(brown(n), 200, 900)
    env = np.ones(n)
    for _ in range(28):
        at = int(rng.uniform(0, dur) * SR)
        m = int(rng.uniform(0.06, 0.18) * SR)
        env[at : at + m] += rng.uniform(0.3, 0.9) * np.sin(np.pi * np.arange(min(m, n - at)) / min(m, n - at))
    murmur *= env
    for _ in range(3):
        at = int(rng.uniform(0, dur) * SR)
        m = int(0.2 * SR)
        tt = np.arange(m) / SR
        clink = (np.sin(2 * np.pi * 2100 * tt) + 0.5 * np.sin(2 * np.pi * 2900 * tt))
        clink *= np.exp(-tt / 0.05) * 0.06
        murmur[at : at + m] += clink[: max(0, min(m, n - at))]
    write_wav("cafe.wav", seamless(murmur, fade), peak=0.45)

    # Fireplace: low rumble + crackle pops.
    n = loop_pad(dur, fade)
    rumble = fft_filter(brown(n), 40, 160) * 0.9
    for _ in range(26):
        at = int(rng.uniform(0, dur) * SR)
        m = int(rng.uniform(0.005, 0.02) * SR)
        pop = rng.standard_normal(m) * np.exp(-np.arange(m) / (m / 3))
        pop *= rng.uniform(0.2, 0.8)
        rumble[at : at + m] += pop[: max(0, min(m, n - at))]
    write_wav("fireplace.wav", seamless(rumble, fade), peak=0.55)

    # White noise: clean and modest.
    write_wav("white-noise.wav", seamless(rng.standard_normal(loop_pad(dur, fade)), fade), peak=0.25)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    make_cues()
    make_ambience()
    print("done")

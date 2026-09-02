/**
 * Short WAV cue tones for completion / break pickers.
 * Run: node scripts/generate-cue-tones.js
 */
const fs = require("fs");
const path = require("path");

const SAMPLE_RATE = 22050;
const OUT_DIR = path.join(__dirname, "..", "assets", "sounds");

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const writeWav = (filePath, samples) => {
  const numSamples = samples.length;
  const buffer = Buffer.alloc(44 + numSamples * 2);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  for (let i = 0; i < numSamples; i += 1) {
    const sample = clamp(samples[i], -1, 1);
    buffer.writeInt16LE(Math.round(sample * 32767), 44 + i * 2);
  }

  fs.writeFileSync(filePath, buffer);
};

const envelope = (i, total, attack = 0.02, release = 0.25) => {
  const t = i / SAMPLE_RATE;
  const dur = total / SAMPLE_RATE;
  const a = Math.min(1, t / attack);
  const r = t > dur - release ? Math.max(0, (dur - t) / release) : 1;
  return a * r;
};

const tone = (freq, seconds, volume = 0.35) => {
  const total = Math.floor(SAMPLE_RATE * seconds);
  const samples = new Array(total);
  for (let i = 0; i < total; i += 1) {
    const t = i / SAMPLE_RATE;
    samples[i] =
      Math.sin(2 * Math.PI * freq * t) * volume * envelope(i, total);
  }
  return samples;
};

const mix = (...tracks) => {
  const length = Math.max(...tracks.map((track) => track.length));
  const samples = new Array(length).fill(0);
  for (const track of tracks) {
    for (let i = 0; i < track.length; i += 1) {
      samples[i] += track[i];
    }
  }
  return samples;
};

const delay = (samples, offsetSec) => {
  const offset = Math.floor(SAMPLE_RATE * offsetSec);
  const next = new Array(samples.length + offset).fill(0);
  for (let i = 0; i < samples.length; i += 1) {
    next[i + offset] = samples[i];
  }
  return next;
};

const noiseBurst = (seconds, volume = 0.25) => {
  const total = Math.floor(SAMPLE_RATE * seconds);
  const samples = new Array(total);
  for (let i = 0; i < total; i += 1) {
    samples[i] = (Math.random() * 2 - 1) * volume * envelope(i, total, 0.005, 0.12);
  }
  return samples;
};

fs.mkdirSync(OUT_DIR, { recursive: true });

writeWav(
  path.join(OUT_DIR, "cue-chime.wav"),
  mix(tone(880, 0.55, 0.28), delay(tone(1320, 0.4, 0.18), 0.08))
);
writeWav(path.join(OUT_DIR, "cue-ping.wav"), tone(1280, 0.22, 0.4));
writeWav(
  path.join(OUT_DIR, "cue-bell.wav"),
  mix(tone(523.25, 0.7, 0.3), tone(1046.5, 0.45, 0.12))
);
writeWav(path.join(OUT_DIR, "cue-wood.wav"), noiseBurst(0.14, 0.45));
writeWav(
  path.join(OUT_DIR, "cue-break-soft.wav"),
  mix(tone(392, 0.5, 0.22), delay(tone(494, 0.45, 0.16), 0.12))
);
writeWav(
  path.join(OUT_DIR, "cue-break-air.wav"),
  mix(tone(523, 0.55, 0.18), delay(tone(659, 0.5, 0.14), 0.15))
);

console.log("Wrote cue tone wavs");

/**
 * Generates short seamless-ish ambient loop WAV files for development.
 * Run: node scripts/generate-ambient-loops.js
 */
const fs = require("fs");
const path = require("path");

const SAMPLE_RATE = 22050;
const DURATION_SEC = 3;
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

const whiteNoise = () => {
  const total = SAMPLE_RATE * DURATION_SEC;
  const samples = new Array(total);
  for (let i = 0; i < total; i += 1) {
    samples[i] = (Math.random() * 2 - 1) * 0.18;
  }
  return samples;
};

const rain = () => {
  const total = SAMPLE_RATE * DURATION_SEC;
  const samples = new Array(total).fill(0);
  let pink = 0;
  for (let i = 0; i < total; i += 1) {
    pink = pink * 0.98 + (Math.random() * 2 - 1) * 0.02;
    samples[i] = pink * 0.9;
    if (Math.random() < 0.002) {
      samples[i] += Math.random() * 0.35;
    }
  }
  return samples;
};

const cafe = () => {
  const total = SAMPLE_RATE * DURATION_SEC;
  const samples = new Array(total);
  for (let i = 0; i < total; i += 1) {
    const t = i / SAMPLE_RATE;
    const hum = Math.sin(t * Math.PI * 2 * 90) * 0.04;
    const chatter = (Math.random() * 2 - 1) * 0.06;
    const clink = Math.random() < 0.0015 ? Math.random() * 0.25 : 0;
    samples[i] = hum + chatter + clink;
  }
  return samples;
};

const forest = () => {
  const total = SAMPLE_RATE * DURATION_SEC;
  const samples = new Array(total).fill(0);
  for (let i = 0; i < total; i += 1) {
    const t = i / SAMPLE_RATE;
    samples[i] = (Math.random() * 2 - 1) * 0.04;
    if (Math.random() < 0.0008) {
      const freq = 900 + Math.random() * 1200;
      for (let j = 0; j < 800 && i + j < total; j += 1) {
        samples[i + j] += Math.sin((t + j / SAMPLE_RATE) * Math.PI * 2 * freq) * 0.08 * (1 - j / 800);
      }
    }
  }
  return samples;
};

const fireplace = () => {
  const total = SAMPLE_RATE * DURATION_SEC;
  const samples = new Array(total);
  let rumble = 0;
  for (let i = 0; i < total; i += 1) {
    rumble = rumble * 0.995 + (Math.random() * 2 - 1) * 0.005;
    const crackle = Math.random() < 0.003 ? Math.random() * 0.3 : 0;
    samples[i] = rumble * 0.5 + crackle;
  }
  return samples;
};

const tracks = {
  "white-noise.wav": whiteNoise,
  "rain.wav": rain,
  "cafe.wav": cafe,
  "forest.wav": forest,
  "fireplace.wav": fireplace,
};

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const [filename, generator] of Object.entries(tracks)) {
  writeWav(path.join(OUT_DIR, filename), generator());
  console.log(`Wrote ${filename}`);
}

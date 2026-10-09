// Tiny WebAudio kit: everything is synthesized, nothing to download. The context
// is created on the first user gesture (Take off), as browsers require.
import { dbg } from './log.js';

let ctx = null;
let master = null;

export function initAudio() {
  if (ctx) return;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    dbg('audio', 'context', ctx.state);
  } catch (err) {
    dbg('audio', 'unavailable', err);
  }
}

function tone(freq, { at = 0, dur = 0.25, type = 'triangle', gain = 0.16, to = null } = {}) {
  if (!ctx) return;
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur * 0.6);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise({ at = 0, dur = 0.3, gain = 0.12, freq = 2400, q = 0.8 } = {}) {
  if (!ctx) return;
  const t = ctx.currentTime + at;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(master);
  src.start(t);
}

export const sfx = {
  crumb: (big) => tone(big ? 520 : 700, { to: big ? 1400 : 1250, dur: 0.25, gain: 0.15 }),
  pickup: () => { tone(523, { dur: 0.18 }); tone(784, { at: 0.12, dur: 0.3 }); },
  deliver: () => { tone(523, { dur: 0.2 }); tone(659, { at: 0.1, dur: 0.22 }); tone(784, { at: 0.2, dur: 0.24 }); tone(1047, { at: 0.3, dur: 0.5, gain: 0.12 }); },
  sunset: () => { tone(196, { type: 'sine', dur: 2.2, gain: 0.22 }); tone(294, { type: 'sine', at: 0.05, dur: 1.8, gain: 0.08 }); },
  seal: () => { noise({ dur: 0.08, freq: 1200, gain: 0.25 }); noise({ at: 0.05, dur: 0.35, freq: 3200, gain: 0.08 }); },
  rustle: () => noise({ dur: 0.4, freq: 3800, gain: 0.07, q: 0.5 }),
  drop: () => tone(880, { to: 180, dur: 1.1, type: 'sine', gain: 0.14 }),
  feed: () => { for (let i = 0; i < 4; i++) tone(900 + i * 120, { at: i * 0.07, dur: 0.12, gain: 0.08 }); },
  ending: (happy) => {
    const notes = happy ? [523, 659, 784, 1047, 1319] : [440, 415, 392, 349, 330];
    notes.forEach((n, i) => tone(n, { at: i * 0.18, dur: 0.6, type: 'sine', gain: 0.12 }));
  },
};

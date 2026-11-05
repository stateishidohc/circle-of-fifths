/**
 * 簡易シンセ再生エンジン（Web Audio API）。
 * core の MIDI ノート番号列を受け取って鳴らすだけの薄い層。
 * 将来サンプル音源に差し替えるときはこのモジュールの実装だけを置き換える。
 */

export type PlayMode = 'chord' | 'arpeggio' | 'sequence';

export interface PlayOptions {
  mode: PlayMode;
  /** テンポ（4分音符/分）。arpeggio・sequence は8分音符で進む */
  bpm: number;
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const active = new Set<{ osc: OscillatorNode; gain: GainNode }>();

function ensureContext(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function voice(midi: number, startAt: number, duration: number) {
  const c = ensureContext();
  const osc = c.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = midiToFreq(midi);
  const gain = c.createGain();
  const peak = 0.28;
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(peak, startAt + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
  osc.connect(gain);
  gain.connect(master!);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.05);
  const entry = { osc, gain };
  active.add(entry);
  osc.onended = () => {
    active.delete(entry);
    gain.disconnect();
  };
}

/** 再生中の音をすべて止める */
export function stopAll() {
  if (!ctx) return;
  const now = ctx.currentTime;
  for (const { osc, gain } of active) {
    gain.gain.cancelScheduledValues(now);
    gain.gain.setTargetAtTime(0, now, 0.02);
    try {
      osc.stop(now + 0.08);
    } catch {
      // すでに停止済み
    }
  }
  active.clear();
}

/**
 * MIDI ノート番号列を再生する。
 * chord: 全音を同時に（2拍）、arpeggio: 8分音符でずらして重ねる、
 * sequence: 8分音符で順に単音再生（スケール用）。
 */
export function play(midis: number[], options: PlayOptions) {
  if (midis.length === 0) return;
  const c = ensureContext();
  stopAll();
  const start = c.currentTime + 0.03;
  const beat = 60 / options.bpm;
  const step = beat / 2;
  if (options.mode === 'chord') {
    for (const m of midis) voice(m, start, beat * 2);
  } else if (options.mode === 'arpeggio') {
    midis.forEach((m, i) => voice(m, start + i * step, beat * 2));
  } else {
    midis.forEach((m, i) => voice(m, start + i * step, step * 1.15));
  }
}

/** 再生にかかる時間（秒）。UI の再生中表示に使う */
export function playDuration(count: number, options: PlayOptions): number {
  const beat = 60 / options.bpm;
  if (options.mode === 'chord') return beat * 2;
  if (options.mode === 'arpeggio') return (count - 1) * (beat / 2) + beat * 2;
  return count * (beat / 2) + 0.2;
}

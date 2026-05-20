import {
  AudioContext,
  type OscillatorNode,
  type GainNode,
  type BiquadFilterNode,
  type OscillatorType,
} from 'react-native-audio-api';
import { midiToFreq } from './notes';

export type LFOTarget = 'pitch' | 'cutoff' | 'shape';

export interface SynthParams {
  osc1Shape: OscillatorType;
  osc2Shape: OscillatorType;
  osc2Detune: number; // cents
  mix: number; // 0 = osc1 only, 1 = osc2 only
  cutoff: number; // Hz
  resonance: number; // Q (0–20)
  attack: number; // seconds
  decay: number; // seconds
  sustain: number; // 0–1
  release: number; // seconds
  lfoRate: number; // Hz
  lfoDepth: number; // 0–1
  lfoTarget: LFOTarget;
  drive: number; // 0–1
  masterVolume: number; // 0–1
}

export const DEFAULT_PARAMS: SynthParams = {
  osc1Shape: 'sawtooth',
  osc2Shape: 'square',
  osc2Detune: -12,
  mix: 0.35,
  cutoff: 1800,
  resonance: 4,
  attack: 0.01,
  decay: 0.15,
  sustain: 0.7,
  release: 0.2,
  lfoRate: 4,
  lfoDepth: 0,
  lfoTarget: 'cutoff',
  drive: 0.2,
  masterVolume: 0.6,
};

const TC = 0.005; // setTargetAtTime smoothing constant for knobs

export class SynthEngine {
  private ctx: AudioContext | null = null;
  private params: SynthParams = { ...DEFAULT_PARAMS };

  private osc1!: OscillatorNode;
  private osc2!: OscillatorNode;
  private osc1Gain!: GainNode;
  private osc2Gain!: GainNode;
  private filter!: BiquadFilterNode;
  private amp!: GainNode; // ADSR-controlled
  private drive!: GainNode; // pre-master "drive" gain
  private master!: GainNode;

  private lfo!: OscillatorNode;
  private lfoDepth!: GainNode;
  private lfoPitchAmount!: GainNode; // scales lfo to ±cents
  private lfoCutoffAmount!: GainNode; // scales lfo to ±Hz
  private lfoShapeAmount!: GainNode; // scales lfo to ±mix offset

  private currentNote: number | null = null;
  private noteOnTime = 0;
  private started = false;

  initialized = false;

  init() {
    if (this.initialized) return;
    const ctx = new AudioContext();
    this.ctx = ctx;

    // Oscillators
    this.osc1 = ctx.createOscillator();
    this.osc1.type = this.params.osc1Shape;
    this.osc1.frequency.value = midiToFreq(60);

    this.osc2 = ctx.createOscillator();
    this.osc2.type = this.params.osc2Shape;
    this.osc2.frequency.value = midiToFreq(60);
    this.osc2.detune.value = this.params.osc2Detune;

    this.osc1Gain = ctx.createGain();
    this.osc1Gain.gain.value = 1 - this.params.mix;
    this.osc2Gain = ctx.createGain();
    this.osc2Gain.gain.value = this.params.mix;

    // Filter
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = this.params.cutoff;
    this.filter.Q.value = this.params.resonance;

    // VCA (ADSR amp)
    this.amp = ctx.createGain();
    this.amp.gain.value = 0;

    // Drive stage: pre-master input gain. The harder you push, the more the
    // filter rings and the closer the master gets to clipping — a simple
    // approximation of analog drive without WaveShaper support.
    this.drive = ctx.createGain();
    this.drive.gain.value = 1 + this.params.drive * 4;

    this.master = ctx.createGain();
    this.master.gain.value = this.params.masterVolume;

    // Routing: osc1+osc2 -> filter -> amp -> drive -> master -> dest
    this.osc1.connect(this.osc1Gain);
    this.osc1Gain.connect(this.filter);
    this.osc2.connect(this.osc2Gain);
    this.osc2Gain.connect(this.filter);
    this.filter.connect(this.amp);
    this.amp.connect(this.drive);
    this.drive.connect(this.master);
    this.master.connect(ctx.destination);

    // LFO graph
    this.lfo = ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = this.params.lfoRate;

    this.lfoDepth = ctx.createGain();
    this.lfoDepth.gain.value = this.params.lfoDepth;

    this.lfoPitchAmount = ctx.createGain();
    this.lfoPitchAmount.gain.value = 0;
    this.lfoCutoffAmount = ctx.createGain();
    this.lfoCutoffAmount.gain.value = 0;
    this.lfoShapeAmount = ctx.createGain();
    this.lfoShapeAmount.gain.value = 0;

    this.lfo.connect(this.lfoDepth);
    this.lfoDepth.connect(this.lfoPitchAmount);
    this.lfoDepth.connect(this.lfoCutoffAmount);
    this.lfoDepth.connect(this.lfoShapeAmount);

    // Pitch target: ±1200 cents max
    this.lfoPitchAmount.connect(this.osc1.detune);
    this.lfoPitchAmount.connect(this.osc2.detune);
    // Cutoff target: ±4000 Hz max
    this.lfoCutoffAmount.connect(this.filter.frequency);
    // Shape target: ±0.5 mix offset
    this.lfoShapeAmount.connect(this.osc1Gain.gain);
    // Inverted for osc2: route through another gain with -1
    const osc2ShapeInvert = ctx.createGain();
    osc2ShapeInvert.gain.value = -1;
    this.lfoShapeAmount.connect(osc2ShapeInvert);
    osc2ShapeInvert.connect(this.osc2Gain.gain);

    this.applyLFOTarget(this.params.lfoTarget);

    if (!this.started) {
      this.osc1.start();
      this.osc2.start();
      this.lfo.start();
      this.started = true;
    }

    this.initialized = true;
  }

  async resume() {
    if (!this.ctx) return;
    await this.ctx.resume();
  }

  get currentTime(): number {
    return this.ctx?.currentTime ?? 0;
  }

  noteOn(midi: number, when?: number) {
    if (!this.ctx) return;
    const t = when ?? this.ctx.currentTime;
    const freq = midiToFreq(midi);
    this.osc1.frequency.setTargetAtTime(freq, t, TC);
    this.osc2.frequency.setTargetAtTime(freq, t, TC);
    this.currentNote = midi;
    this.noteOnTime = t;

    const { attack, decay, sustain } = this.params;
    const peak = 1;
    const g = this.amp.gain;
    g.cancelScheduledValues(t);
    // Set anchor at current value to avoid clicks
    const startVal = Math.max(g.value, 0.0001);
    g.setValueAtTime(startVal, t);
    g.linearRampToValueAtTime(peak, t + attack);
    g.linearRampToValueAtTime(Math.max(sustain, 0.0001), t + attack + decay);
  }

  noteOff(when?: number) {
    if (!this.ctx) return;
    const t = when ?? this.ctx.currentTime;
    const g = this.amp.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(0.0001, t + this.params.release);
    this.currentNote = null;
  }

  setParam<K extends keyof SynthParams>(key: K, value: SynthParams[K]) {
    this.params[key] = value;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    switch (key) {
      case 'osc1Shape':
        this.osc1.type = value as OscillatorType;
        break;
      case 'osc2Shape':
        this.osc2.type = value as OscillatorType;
        break;
      case 'osc2Detune':
        this.osc2.detune.setTargetAtTime(value as number, t, TC);
        break;
      case 'mix': {
        const m = value as number;
        this.osc1Gain.gain.setTargetAtTime(1 - m, t, TC);
        this.osc2Gain.gain.setTargetAtTime(m, t, TC);
        break;
      }
      case 'cutoff':
        this.filter.frequency.setTargetAtTime(value as number, t, TC);
        break;
      case 'resonance':
        this.filter.Q.setTargetAtTime(value as number, t, TC);
        break;
      case 'lfoRate':
        this.lfo.frequency.setTargetAtTime(value as number, t, TC);
        break;
      case 'lfoDepth':
        this.lfoDepth.gain.setTargetAtTime(value as number, t, TC);
        break;
      case 'lfoTarget':
        this.applyLFOTarget(value as LFOTarget);
        break;
      case 'drive':
        this.drive.gain.setTargetAtTime(1 + (value as number) * 4, t, TC);
        break;
      case 'masterVolume':
        this.master.gain.setTargetAtTime(value as number, t, TC);
        break;
      // attack/decay/sustain/release applied at note-on / note-off time
    }
  }

  private applyLFOTarget(target: LFOTarget) {
    // Scale LFO into target-appropriate range. Depth is unit-less 0–1,
    // multiplied by the target's max excursion.
    const t = this.ctx?.currentTime ?? 0;
    this.lfoPitchAmount.gain.setTargetAtTime(target === 'pitch' ? 1200 : 0, t, TC);
    this.lfoCutoffAmount.gain.setTargetAtTime(target === 'cutoff' ? 4000 : 0, t, TC);
    this.lfoShapeAmount.gain.setTargetAtTime(target === 'shape' ? 0.5 : 0, t, TC);
  }
}

export const synth = new SynthEngine();

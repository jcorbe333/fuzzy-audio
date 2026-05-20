import { SynthEngine } from './SynthEngine';

export interface Step {
  note: number;
  active: boolean;
}

export const STEP_COUNT = 16;

export const makeEmptyPattern = (): Step[] =>
  Array.from({ length: STEP_COUNT }, (_, i) => ({
    note: 60 + (i % 8),
    active: false,
  }));

type StepCallback = (stepIndex: number) => void;

// Look-ahead scheduler (Chris Wilson "Tale of Two Clocks"). A JS interval
// fires every SCHEDULE_INTERVAL_MS and queues any steps whose audio time
// falls inside the next LOOKAHEAD seconds.
const SCHEDULE_INTERVAL_MS = 25;
const LOOKAHEAD = 0.1;

export class Sequencer {
  private synth: SynthEngine;
  pattern: Step[] = makeEmptyPattern();
  bpm = 120;
  playing = false;

  private nextStepTime = 0;
  private nextStepIndex = 0;
  private interval: ReturnType<typeof setInterval> | null = null;
  private onStep: StepCallback | null = null;

  constructor(synth: SynthEngine) {
    this.synth = synth;
  }

  setOnStep(cb: StepCallback) {
    this.onStep = cb;
  }

  setPattern(p: Step[]) {
    this.pattern = p;
  }

  setStep(idx: number, step: Partial<Step>) {
    const cur = this.pattern[idx];
    this.pattern[idx] = { ...cur, ...step };
  }

  setBpm(bpm: number) {
    this.bpm = bpm;
  }

  start() {
    if (this.playing) return;
    this.playing = true;
    this.nextStepIndex = 0;
    this.nextStepTime = this.synth.currentTime + 0.05;
    this.interval = setInterval(() => this.tick(), SCHEDULE_INTERVAL_MS);
  }

  stop() {
    if (!this.playing) return;
    this.playing = false;
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
    this.synth.noteOff();
  }

  private stepDuration(): number {
    // 16th notes: one beat (quarter) per 60/bpm, divided by 4.
    return 60 / this.bpm / 4;
  }

  private tick() {
    const horizon = this.synth.currentTime + LOOKAHEAD;
    while (this.nextStepTime < horizon) {
      const stepIdx = this.nextStepIndex;
      const step = this.pattern[stepIdx];
      const t = this.nextStepTime;
      const dur = this.stepDuration();
      if (step.active) {
        this.synth.noteOn(step.note, t);
        // Note off 80% of step length for slight gate
        this.synth.noteOff(t + dur * 0.8);
      }
      // UI update fires at JS time, not audio time — close enough for highlight
      if (this.onStep) {
        const delayMs = Math.max(0, (t - this.synth.currentTime) * 1000);
        setTimeout(() => this.onStep && this.onStep(stepIdx), delayMs);
      }
      this.nextStepTime += dur;
      this.nextStepIndex = (this.nextStepIndex + 1) % this.pattern.length;
    }
  }
}

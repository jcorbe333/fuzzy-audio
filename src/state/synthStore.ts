import { create } from 'zustand';
import {
  DEFAULT_PARAMS,
  type SynthParams,
  type LFOTarget,
} from '../audio/SynthEngine';
import { type Step, STEP_COUNT, makeEmptyPattern } from '../audio/Sequencer';

interface SynthState extends SynthParams {
  // Sequencer state
  pattern: Step[];
  bpm: number;
  playing: boolean;
  currentStep: number;
  // Actions
  setParam: <K extends keyof SynthParams>(key: K, value: SynthParams[K]) => void;
  setStep: (idx: number, step: Partial<Step>) => void;
  toggleStep: (idx: number) => void;
  setBpm: (bpm: number) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentStep: (idx: number) => void;
}

export const useSynthStore = create<SynthState>((set) => ({
  ...DEFAULT_PARAMS,
  pattern: makeEmptyPattern(),
  bpm: 120,
  playing: false,
  currentStep: -1,
  setParam: (key, value) => set({ [key]: value } as Pick<SynthState, typeof key>),
  setStep: (idx, step) =>
    set((s) => {
      const next = s.pattern.slice();
      next[idx] = { ...next[idx], ...step };
      return { pattern: next };
    }),
  toggleStep: (idx) =>
    set((s) => {
      const next = s.pattern.slice();
      next[idx] = { ...next[idx], active: !next[idx].active };
      return { pattern: next };
    }),
  setBpm: (bpm) => set({ bpm }),
  setPlaying: (playing) => set({ playing }),
  setCurrentStep: (currentStep) => set({ currentStep }),
}));

export { STEP_COUNT };
export type { LFOTarget };

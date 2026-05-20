import React from 'react';
import { Panel } from './Panel';
import { Knob } from '../Knob';
import { Selector } from '../Selector';
import { useSynthStore } from '../../state/synthStore';
import type { OscillatorType } from 'react-native-audio-api';

const SHAPE_OPTIONS: { label: string; value: OscillatorType }[] = [
  { label: 'SAW', value: 'sawtooth' },
  { label: 'TRI', value: 'triangle' },
  { label: 'SQR', value: 'square' },
];

export function OscillatorPanel() {
  const osc1Shape = useSynthStore((s) => s.osc1Shape);
  const osc2Shape = useSynthStore((s) => s.osc2Shape);
  const osc2Detune = useSynthStore((s) => s.osc2Detune);
  const mix = useSynthStore((s) => s.mix);
  const setParam = useSynthStore((s) => s.setParam);

  return (
    <Panel title="OSCILLATORS">
      <Selector
        label="VCO1"
        value={osc1Shape}
        options={SHAPE_OPTIONS}
        onChange={(v) => setParam('osc1Shape', v)}
      />
      <Selector
        label="VCO2"
        value={osc2Shape}
        options={SHAPE_OPTIONS}
        onChange={(v) => setParam('osc2Shape', v)}
      />
      <Knob
        label="Detune"
        value={osc2Detune}
        min={-1200}
        max={1200}
        step={1}
        formatValue={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}c`}
        onChange={(v) => setParam('osc2Detune', v)}
      />
      <Knob
        label="Mix"
        value={mix}
        min={0}
        max={1}
        formatValue={(v) => `${Math.round(v * 100)}%`}
        onChange={(v) => setParam('mix', v)}
      />
    </Panel>
  );
}

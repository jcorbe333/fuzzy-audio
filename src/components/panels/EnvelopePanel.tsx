import React from 'react';
import { Panel } from './Panel';
import { Knob } from '../Knob';
import { useSynthStore } from '../../state/synthStore';

const fmtSec = (v: number) => (v < 1 ? `${(v * 1000).toFixed(0)}ms` : `${v.toFixed(2)}s`);

export function EnvelopePanel() {
  const attack = useSynthStore((s) => s.attack);
  const decay = useSynthStore((s) => s.decay);
  const sustain = useSynthStore((s) => s.sustain);
  const release = useSynthStore((s) => s.release);
  const setParam = useSynthStore((s) => s.setParam);

  return (
    <Panel title="ENVELOPE">
      <Knob
        label="Attack"
        value={attack}
        min={0.001}
        max={4}
        exp
        formatValue={fmtSec}
        onChange={(v) => setParam('attack', v)}
      />
      <Knob
        label="Decay"
        value={decay}
        min={0.001}
        max={4}
        exp
        formatValue={fmtSec}
        onChange={(v) => setParam('decay', v)}
      />
      <Knob
        label="Sustain"
        value={sustain}
        min={0}
        max={1}
        formatValue={(v) => `${Math.round(v * 100)}%`}
        onChange={(v) => setParam('sustain', v)}
      />
      <Knob
        label="Release"
        value={release}
        min={0.001}
        max={6}
        exp
        formatValue={fmtSec}
        onChange={(v) => setParam('release', v)}
      />
    </Panel>
  );
}

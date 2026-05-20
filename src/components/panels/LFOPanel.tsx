import React from 'react';
import { Panel } from './Panel';
import { Knob } from '../Knob';
import { Selector } from '../Selector';
import { useSynthStore } from '../../state/synthStore';
import type { LFOTarget } from '../../state/synthStore';

const TARGETS: { label: string; value: LFOTarget }[] = [
  { label: 'PITCH', value: 'pitch' },
  { label: 'CUTOFF', value: 'cutoff' },
  { label: 'SHAPE', value: 'shape' },
];

export function LFOPanel() {
  const rate = useSynthStore((s) => s.lfoRate);
  const depth = useSynthStore((s) => s.lfoDepth);
  const target = useSynthStore((s) => s.lfoTarget);
  const setParam = useSynthStore((s) => s.setParam);

  return (
    <Panel title="LFO">
      <Knob
        label="Rate"
        value={rate}
        min={0.05}
        max={30}
        exp
        formatValue={(v) => `${v.toFixed(2)}Hz`}
        onChange={(v) => setParam('lfoRate', v)}
      />
      <Knob
        label="Depth"
        value={depth}
        min={0}
        max={1}
        formatValue={(v) => `${Math.round(v * 100)}%`}
        onChange={(v) => setParam('lfoDepth', v)}
      />
      <Selector
        label="Target"
        value={target}
        options={TARGETS}
        onChange={(v) => setParam('lfoTarget', v)}
      />
    </Panel>
  );
}

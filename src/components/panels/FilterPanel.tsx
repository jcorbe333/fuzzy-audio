import React from 'react';
import { Panel } from './Panel';
import { Knob } from '../Knob';
import { useSynthStore } from '../../state/synthStore';

export function FilterPanel() {
  const cutoff = useSynthStore((s) => s.cutoff);
  const resonance = useSynthStore((s) => s.resonance);
  const setParam = useSynthStore((s) => s.setParam);

  return (
    <Panel title="FILTER">
      <Knob
        label="Cutoff"
        value={cutoff}
        min={40}
        max={18000}
        exp
        formatValue={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v.toFixed(0)}`)}
        onChange={(v) => setParam('cutoff', v)}
      />
      <Knob
        label="Reso"
        value={resonance}
        min={0}
        max={20}
        formatValue={(v) => v.toFixed(1)}
        onChange={(v) => setParam('resonance', v)}
      />
    </Panel>
  );
}

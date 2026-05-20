import React from 'react';
import { Panel } from './Panel';
import { Knob } from '../Knob';
import { useSynthStore } from '../../state/synthStore';

export function DrivePanel() {
  const drive = useSynthStore((s) => s.drive);
  const master = useSynthStore((s) => s.masterVolume);
  const setParam = useSynthStore((s) => s.setParam);

  return (
    <Panel title="OUTPUT">
      <Knob
        label="Drive"
        value={drive}
        min={0}
        max={1}
        formatValue={(v) => `${Math.round(v * 100)}%`}
        onChange={(v) => setParam('drive', v)}
      />
      <Knob
        label="Volume"
        value={master}
        min={0}
        max={1}
        formatValue={(v) => `${Math.round(v * 100)}%`}
        onChange={(v) => setParam('masterVolume', v)}
      />
    </Panel>
  );
}

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSynthStore, STEP_COUNT } from '../state/synthStore';
import { Knob } from './Knob';
import { midiToName } from '../audio/notes';

interface Props {
  onTogglePlay: () => void;
}

export function SequencerView({ onTogglePlay }: Props) {
  const pattern = useSynthStore((s) => s.pattern);
  const currentStep = useSynthStore((s) => s.currentStep);
  const playing = useSynthStore((s) => s.playing);
  const bpm = useSynthStore((s) => s.bpm);
  const toggleStep = useSynthStore((s) => s.toggleStep);
  const setStep = useSynthStore((s) => s.setStep);
  const setBpm = useSynthStore((s) => s.setBpm);

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Text style={styles.title}>SEQUENCER</Text>
        <Pressable
          onPress={onTogglePlay}
          style={[styles.playBtn, playing && styles.playBtnActive]}
        >
          <Text style={styles.playBtnTxt}>{playing ? 'STOP' : 'PLAY'}</Text>
        </Pressable>
        <Knob
          label="BPM"
          value={bpm}
          min={40}
          max={220}
          step={1}
          formatValue={(v) => v.toFixed(0)}
          onChange={setBpm}
          size={44}
        />
      </View>
      <View style={styles.stepsRow}>
        {pattern.map((step, i) => {
          const active = step.active;
          const isCurrent = i === currentStep && playing;
          return (
            <View key={i} style={styles.stepCol}>
              <Pressable
                style={[
                  styles.step,
                  active && styles.stepActive,
                  isCurrent && styles.stepCurrent,
                ]}
                onPress={() => toggleStep(i)}
              >
                <Text style={styles.stepIdx}>{i + 1}</Text>
              </Pressable>
              <View style={styles.noteControls}>
                <Pressable
                  onPress={() =>
                    setStep(i, { note: Math.max(24, step.note - 1) })
                  }
                  style={styles.noteBtn}
                >
                  <Text style={styles.noteBtnTxt}>-</Text>
                </Pressable>
                <Text style={styles.noteLabel}>{midiToName(step.note)}</Text>
                <Pressable
                  onPress={() =>
                    setStep(i, { note: Math.min(96, step.note + 1) })
                  }
                  style={styles.noteBtn}
                >
                  <Text style={styles.noteBtnTxt}>+</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#26262c',
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  title: { color: '#ffb547', fontWeight: '700', fontSize: 13, marginRight: 12, letterSpacing: 1 },
  playBtn: {
    backgroundColor: '#1e1e22',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3a3a40',
    marginRight: 12,
  },
  playBtnActive: { backgroundColor: '#ffb547', borderColor: '#ffb547' },
  playBtnTxt: { color: '#eee', fontWeight: '700', fontSize: 12 },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepCol: { alignItems: 'center', flex: 1, marginHorizontal: 1 },
  step: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#1e1e22',
    borderWidth: 1,
    borderColor: '#3a3a40',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: 36,
  },
  stepActive: { backgroundColor: '#ffb547', borderColor: '#ffb547' },
  stepCurrent: { borderColor: '#fff', borderWidth: 2 },
  stepIdx: { color: '#666', fontSize: 9, fontWeight: '600' },
  noteControls: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  noteBtn: { paddingHorizontal: 4 },
  noteBtnTxt: { color: '#888', fontSize: 12, fontWeight: '700' },
  noteLabel: { color: '#ccc', fontSize: 9, minWidth: 24, textAlign: 'center' },
});

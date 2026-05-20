import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { midiToName } from '../audio/notes';

interface Props {
  startOctave?: number;
  octaves?: number;
  onNoteOn: (midi: number) => void;
  onNoteOff: (midi: number) => void;
}

// Black-key positions within an octave (semitone offset from C).
const BLACK_OFFSETS = [1, 3, 6, 8, 10];
// White-key MIDI offsets within an octave: C D E F G A B.
const WHITE_OFFSETS = [0, 2, 4, 5, 7, 9, 11];

export function Keyboard({
  startOctave = 4,
  octaves = 2,
  onNoteOn,
  onNoteOff,
}: Props) {
  const heldRef = useRef<number | null>(null);

  const whiteKeys: number[] = [];
  for (let o = 0; o < octaves; o++) {
    for (const off of WHITE_OFFSETS) {
      whiteKeys.push((startOctave + 1 + o) * 12 + off);
    }
  }

  const press = (midi: number) => {
    heldRef.current = midi;
    onNoteOn(midi);
  };
  const release = (midi: number) => {
    if (heldRef.current === midi) heldRef.current = null;
    onNoteOff(midi);
  };

  return (
    <View style={styles.outer}>
      <View style={styles.row}>
        {whiteKeys.map((m) => (
          <Pressable
            key={`w${m}`}
            style={styles.whiteKey}
            onPressIn={() => press(m)}
            onPressOut={() => release(m)}
          >
            <Text style={styles.whiteLabel}>{midiToName(m)}</Text>
          </Pressable>
        ))}
      </View>
      {/* Black keys overlay */}
      <View style={styles.blackRow} pointerEvents="box-none">
        {Array.from({ length: octaves }).map((_, o) => {
          const baseMidi = (startOctave + 1 + o) * 12;
          // White-key width as fraction of the whole keyboard:
          const whitesPerOctave = 7;
          const totalWhites = octaves * whitesPerOctave;
          const wWidthPct = 100 / totalWhites;
          // Position black keys relative to white keys within this octave:
          // After white-key index i (0-based, C=0, D=1, E=2...), a black key
          // sits centered on the boundary i+1. The black keys appear after
          // C, D, F, G, A — white indexes 0,1,3,4,5.
          const positions: Array<{ midi: number; afterWhite: number }> = [
            { midi: baseMidi + 1, afterWhite: 0 },
            { midi: baseMidi + 3, afterWhite: 1 },
            { midi: baseMidi + 6, afterWhite: 3 },
            { midi: baseMidi + 8, afterWhite: 4 },
            { midi: baseMidi + 10, afterWhite: 5 },
          ];
          // Each octave starts at offset (o * 7) white-keys from the left.
          return positions.map(({ midi, afterWhite }) => {
            const leftPct = ((o * whitesPerOctave + afterWhite + 1) * wWidthPct) - wWidthPct * 0.3;
            return (
              <Pressable
                key={`b${midi}`}
                style={[styles.blackKey, { left: `${leftPct}%`, width: `${wWidthPct * 0.6}%` }]}
                onPressIn={() => press(midi)}
                onPressOut={() => release(midi)}
              />
            );
          });
        })}
      </View>
    </View>
  );
}

const KEY_HEIGHT = 110;

const styles = StyleSheet.create({
  outer: { width: '100%', height: KEY_HEIGHT, position: 'relative' },
  row: { flexDirection: 'row', width: '100%', height: '100%' },
  whiteKey: {
    flex: 1,
    backgroundColor: '#f5f1e8',
    borderColor: '#222',
    borderWidth: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 6,
  },
  whiteLabel: { color: '#888', fontSize: 9 },
  blackRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: KEY_HEIGHT * 0.6,
  },
  blackKey: {
    position: 'absolute',
    top: 0,
    height: '100%',
    backgroundColor: '#111',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#000',
  },
});

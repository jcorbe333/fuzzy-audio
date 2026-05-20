import React, { useRef } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  exp?: boolean; // exponential scaling (e.g. filter cutoff)
  formatValue?: (v: number) => string;
  onChange: (v: number) => void;
  size?: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function Knob({
  label,
  value,
  min,
  max,
  step,
  exp = false,
  formatValue,
  onChange,
  size = 56,
}: Props) {
  // Normalized 0–1 representation (for rotation drawing + drag math).
  const toNorm = (v: number): number => {
    if (exp) {
      const lo = Math.log(Math.max(min, 1e-6));
      const hi = Math.log(max);
      return (Math.log(Math.max(v, 1e-6)) - lo) / (hi - lo);
    }
    return (v - min) / (max - min);
  };
  const fromNorm = (n: number): number => {
    const c = clamp(n, 0, 1);
    if (exp) {
      const lo = Math.log(Math.max(min, 1e-6));
      const hi = Math.log(max);
      return Math.exp(lo + c * (hi - lo));
    }
    let raw = min + c * (max - min);
    if (step) raw = Math.round(raw / step) * step;
    return raw;
  };

  const norm = clamp(toNorm(value), 0, 1);
  const startNormRef = useRef(norm);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startNormRef.current = clamp(toNorm(value), 0, 1);
      },
      onPanResponderMove: (_e, gesture) => {
        // 200 px of vertical drag covers the full range.
        const delta = -gesture.dy / 200;
        const next = clamp(startNormRef.current + delta, 0, 1);
        onChange(fromNorm(next));
      },
    }),
  ).current;

  // Map norm 0..1 to rotation -135deg..+135deg
  const angle = -135 + norm * 270;

  return (
    <View style={styles.wrap}>
      <View
        {...responder.panHandlers}
        style={[styles.knob, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <View
          style={[
            styles.indicator,
            {
              height: size / 2 - 4,
              transform: [
                { translateY: -size / 4 + 2 },
                { rotate: `${angle}deg` },
              ],
            },
          ]}
        />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>
        {formatValue ? formatValue(value) : value.toFixed(2)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginHorizontal: 6, marginVertical: 4 },
  knob: {
    backgroundColor: '#1e1e22',
    borderWidth: 2,
    borderColor: '#3a3a40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 3,
    backgroundColor: '#ffb547',
    position: 'absolute',
    top: '50%',
    borderRadius: 1.5,
  },
  label: {
    marginTop: 4,
    color: '#ccc',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  value: { color: '#888', fontSize: 9, marginTop: 1 },
});

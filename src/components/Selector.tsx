import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Option<T extends string> {
  label: string;
  value: T;
}

interface Props<T extends string> {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
}

export function Selector<T extends string>({ label, value, options, onChange }: Props<T>) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              style={[styles.opt, active && styles.optActive]}
            >
              <Text style={[styles.optTxt, active && styles.optTxtActive]}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginHorizontal: 6, marginVertical: 4 },
  label: {
    color: '#ccc',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  row: { flexDirection: 'row', backgroundColor: '#1e1e22', borderRadius: 4, padding: 2 },
  opt: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
  },
  optActive: { backgroundColor: '#ffb547' },
  optTxt: { color: '#888', fontSize: 11, fontWeight: '600' },
  optTxtActive: { color: '#1a1a1a' },
});

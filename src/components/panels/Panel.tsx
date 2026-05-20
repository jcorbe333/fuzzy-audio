import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface Props {
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Panel({ title, children, style }: Props) {
  return (
    <View style={[styles.panel, style]}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.row}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#26262c',
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
    marginHorizontal: 4,
    flexGrow: 1,
  },
  title: {
    color: '#ffb547',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
});

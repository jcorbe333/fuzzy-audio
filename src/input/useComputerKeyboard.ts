import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { QWERTY_MAP } from '../audio/notes';

interface Handlers {
  onNoteOn: (midi: number) => void;
  onNoteOff: (midi: number) => void;
}

export function useComputerKeyboard({ onNoteOn, onNoteOff }: Handlers) {
  const octaveRef = useRef(0);
  const heldRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const keyToMidi = (key: string): number | null => {
      const k = key.toLowerCase();
      if (!(k in QWERTY_MAP)) return null;
      return QWERTY_MAP[k] + octaveRef.current * 12;
    };

    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (k === 'z') {
        octaveRef.current = Math.max(-3, octaveRef.current - 1);
        return;
      }
      if (k === 'x') {
        octaveRef.current = Math.min(3, octaveRef.current + 1);
        return;
      }
      const midi = keyToMidi(k);
      if (midi === null) return;
      if (heldRef.current.has(midi)) return;
      heldRef.current.add(midi);
      onNoteOn(midi);
    };

    const up = (e: KeyboardEvent) => {
      const midi = keyToMidi(e.key);
      if (midi === null) return;
      if (!heldRef.current.has(midi)) return;
      heldRef.current.delete(midi);
      if (heldRef.current.size === 0) onNoteOff(midi);
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [onNoteOn, onNoteOff]);
}

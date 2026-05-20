export const midiToFreq = (midi: number): number =>
  440 * Math.pow(2, (midi - 69) / 12);

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const midiToName = (midi: number): string => {
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[midi % 12]}${octave}`;
};

// QWERTY-to-MIDI mapping starting at C4 (60). Mirrors a common DAW layout:
//   W E   T Y U   O P
//  A S D F G H J K L ;
// Z/X transpose octave down/up.
export const QWERTY_MAP: Record<string, number> = {
  a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67,
  y: 68, h: 69, u: 70, j: 71, k: 72, o: 73, l: 74, p: 75, ';': 76,
};

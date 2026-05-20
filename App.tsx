import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { synth } from './src/audio/SynthEngine';
import { Sequencer } from './src/audio/Sequencer';
import { useSynthStore } from './src/state/synthStore';
import { useComputerKeyboard } from './src/input/useComputerKeyboard';
import { Keyboard } from './src/components/Keyboard';
import { OscillatorPanel } from './src/components/panels/OscillatorPanel';
import { FilterPanel } from './src/components/panels/FilterPanel';
import { EnvelopePanel } from './src/components/panels/EnvelopePanel';
import { LFOPanel } from './src/components/panels/LFOPanel';
import { DrivePanel } from './src/components/panels/DrivePanel';
import { SequencerView } from './src/components/Sequencer';

export default function App() {
  const [ready, setReady] = useState(false);

  const state = useSynthStore();
  const seqRef = useRef<Sequencer | null>(null);

  useEffect(() => {
    if (!ready) return;
    synth.setParam('osc1Shape', state.osc1Shape);
    synth.setParam('osc2Shape', state.osc2Shape);
    synth.setParam('osc2Detune', state.osc2Detune);
    synth.setParam('mix', state.mix);
    synth.setParam('cutoff', state.cutoff);
    synth.setParam('resonance', state.resonance);
    synth.setParam('attack', state.attack);
    synth.setParam('decay', state.decay);
    synth.setParam('sustain', state.sustain);
    synth.setParam('release', state.release);
    synth.setParam('lfoRate', state.lfoRate);
    synth.setParam('lfoDepth', state.lfoDepth);
    synth.setParam('lfoTarget', state.lfoTarget);
    synth.setParam('drive', state.drive);
    synth.setParam('masterVolume', state.masterVolume);
  }, [
    ready,
    state.osc1Shape,
    state.osc2Shape,
    state.osc2Detune,
    state.mix,
    state.cutoff,
    state.resonance,
    state.attack,
    state.decay,
    state.sustain,
    state.release,
    state.lfoRate,
    state.lfoDepth,
    state.lfoTarget,
    state.drive,
    state.masterVolume,
  ]);

  useEffect(() => {
    if (!seqRef.current) return;
    seqRef.current.setPattern(state.pattern);
  }, [state.pattern]);
  useEffect(() => {
    if (!seqRef.current) return;
    seqRef.current.setBpm(state.bpm);
  }, [state.bpm]);

  const start = useCallback(async () => {
    synth.init();
    await synth.resume();
    if (!seqRef.current) {
      const seq = new Sequencer(synth);
      seq.setOnStep((i) => useSynthStore.getState().setCurrentStep(i));
      seqRef.current = seq;
    }
    setReady(true);
  }, []);

  const onNoteOn = useCallback(
    (midi: number) => {
      if (!ready) return;
      synth.noteOn(midi);
    },
    [ready],
  );
  const onNoteOff = useCallback(() => {
    if (!ready) return;
    synth.noteOff();
  }, [ready]);

  useComputerKeyboard({ onNoteOn, onNoteOff });

  const togglePlay = useCallback(() => {
    const seq = seqRef.current;
    if (!seq) return;
    if (seq.playing) {
      seq.stop();
      useSynthStore.getState().setPlaying(false);
      useSynthStore.getState().setCurrentStep(-1);
    } else {
      seq.setBpm(useSynthStore.getState().bpm);
      seq.setPattern(useSynthStore.getState().pattern);
      seq.start();
      useSynthStore.getState().setPlaying(true);
    }
  }, []);

  const hint = useMemo(() => {
    if (Platform.OS === 'web') {
      return 'Click a key or use A W S E D F T G Y H U J K  •  Z/X = octave';
    }
    return 'Tap keys to play';
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.brand}>FUZZY AUDIO</Text>
        <Text style={styles.sub}>monophonic synth</Text>
      </View>
      {!ready ? (
        <View style={styles.startWrap}>
          <Pressable style={styles.startBtn} onPress={start}>
            <Text style={styles.startTxt}>POWER ON</Text>
          </Pressable>
          <Text style={styles.hint}>Audio requires a user gesture to start.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.grid}>
            <OscillatorPanel />
            <FilterPanel />
            <EnvelopePanel />
            <LFOPanel />
            <DrivePanel />
          </View>
          <SequencerView onTogglePlay={togglePlay} />
          <Text style={styles.hint}>{hint}</Text>
          <Keyboard onNoteOn={onNoteOn} onNoteOff={onNoteOff} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#16161a' },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brand: { color: '#ffb547', fontWeight: '800', fontSize: 18, letterSpacing: 2 },
  sub: { color: '#666', fontSize: 11, marginLeft: 10, letterSpacing: 1 },
  startWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  startBtn: {
    backgroundColor: '#ffb547',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 6,
  },
  startTxt: { color: '#1a1a1a', fontWeight: '800', letterSpacing: 2 },
  scroll: { paddingHorizontal: 8, paddingBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch' },
  hint: { color: '#888', fontSize: 11, textAlign: 'center', marginVertical: 8 },
});

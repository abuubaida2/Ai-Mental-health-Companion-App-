import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Animated, Easing, Alert
} from 'react-native';
import { Audio } from 'expo-av';
import AnalysisService from '../services/AnalysisService';

const EMOTION_COLORS = {
  joy: '#f6c90e', happiness: '#f6c90e', gratitude: '#2ecc71', love: '#e84393',
  admiration: '#9b59b6', neutral: '#95a5a6', sadness: '#3498db', fear: '#e67e22',
  anger: '#e74c3c', disgust: '#8e44ad', surprise: '#1abc9c', default: '#007bff'
};

function getEmotionColor(emotion) {
  return EMOTION_COLORS[emotion?.toLowerCase()] || EMOTION_COLORS.default;
}

// Animated waveform bars shown while recording
function WaveformBars({ isRecording }) {
  const bars = Array.from({ length: 18 }, (_, i) => {
    const anim = useRef(new Animated.Value(0.2)).current;
    useEffect(() => {
      if (isRecording) {
        const delay = (i % 6) * 80;
        const loop = Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 0.3 + Math.random() * 0.7, duration: 200 + Math.random() * 300, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            Animated.timing(anim, { toValue: 0.1 + Math.random() * 0.3, duration: 200 + Math.random() * 200, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          ])
        );
        setTimeout(() => loop.start(), delay);
        return () => loop.stop();
      } else {
        Animated.timing(anim, { toValue: 0.15, duration: 300, useNativeDriver: true }).start();
      }
    }, [isRecording]);
    return (
      <Animated.View
        key={i}
        style={[styles.waveBar, { transform: [{ scaleY: anim }], backgroundColor: isRecording ? '#e74c3c' : '#ccc' }]}
      />
    );
  });
  return <View style={styles.waveformContainer}>{bars}</View>;
}

// Pulsing ring around the mic button while recording
function PulseRing({ isRecording }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isRecording) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scale, { toValue: 1.6, duration: 900, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 900, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      scale.setValue(1);
      opacity.setValue(0);
    }
  }, [isRecording]);
  return (
    <Animated.View style={[styles.pulseRing, { transform: [{ scale }], opacity }]} />
  );
}

export default function RecordScreen({ navigation }) {
  const [phase, setPhase] = useState('idle'); // idle | recording | reviewing | analyzing | done
  const [recording, setRecording] = useState(null);
  const [recordedUri, setRecordedUri] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  function formatTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  async function startRecording() {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Required', 'Microphone access is needed to record audio.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setElapsed(0);
      setPhase('recording');
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } catch (err) {
      Alert.alert('Error', 'Could not start recording: ' + err.message);
    }
  }

  async function stopRecording() {
    clearInterval(timerRef.current);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordedUri(uri);
      setRecording(null);
      setPhase('reviewing');
    } catch (err) {
      Alert.alert('Error', 'Could not stop recording: ' + err.message);
      setPhase('idle');
    }
  }

  async function playRecording() {
    try {
      if (sound) await sound.unloadAsync();
      const { sound: s } = await Audio.Sound.createAsync({ uri: recordedUri });
      setSound(s);
      setIsPlaying(true);
      await s.playAsync();
      s.setOnPlaybackStatusUpdate(status => {
        if (status.didJustFinish) setIsPlaying(false);
      });
    } catch (err) {
      Alert.alert('Playback Error', err.message);
    }
  }

  async function stopPlayback() {
    if (sound) { await sound.stopAsync(); setIsPlaying(false); }
  }

  async function analyzeRecording() {
    setPhase('analyzing');
    try {
      const res = await AnalysisService.analyzeAudio(recordedUri);
      if (res.error) throw new Error(res.error);
      setResult(res);
      setPhase('done');
    } catch (err) {
      Alert.alert('Analysis Failed', err.message || 'Could not reach the server.');
      setPhase('reviewing');
    }
  }

  function resetAll() {
    clearInterval(timerRef.current);
    if (sound) sound.unloadAsync();
    setRecording(null); setRecordedUri(null); setSound(null);
    setIsPlaying(false); setResult(null); setElapsed(0);
    setPhase('idle');
  }

  const getTopEmotions = () => {
    if (!result?.probabilities) return [];
    return Object.entries(result.probabilities)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([emotion, prob]) => ({ emotion, probability: (prob * 100).toFixed(1) }));
  };

  const topEmotions = getTopEmotions();
  const dominantColor = result ? getEmotionColor(result.dominant) : '#007bff';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>🎙 Voice Analysis</Text>
      <Text style={styles.subtitle}>Record your voice to detect emotional tone</Text>

      {/* Waveform */}
      <WaveformBars isRecording={phase === 'recording'} />

      {/* Timer */}
      {(phase === 'recording' || phase === 'reviewing') && (
        <Text style={[styles.timer, phase === 'recording' && styles.timerActive]}>
          {phase === 'recording' ? '⏺ ' : '✓ '}{formatTime(elapsed)}
        </Text>
      )}

      {/* Mic Button */}
      {(phase === 'idle' || phase === 'recording') && (
        <View style={styles.micWrapper}>
          <PulseRing isRecording={phase === 'recording'} />
          <TouchableOpacity
            style={[styles.micButton, phase === 'recording' && styles.micButtonActive]}
            onPress={phase === 'recording' ? stopRecording : startRecording}
            activeOpacity={0.8}
          >
            <Text style={styles.micIcon}>{phase === 'recording' ? '⏹' : '🎙'}</Text>
          </TouchableOpacity>
        </View>
      )}
      {phase === 'idle' && <Text style={styles.hint}>Tap to start recording</Text>}
      {phase === 'recording' && <Text style={styles.hint}>Tap to stop recording</Text>}

      {/* Review Controls */}
      {phase === 'reviewing' && (
        <View style={styles.reviewCard}>
          <Text style={styles.reviewTitle}>Recording Ready</Text>
          <Text style={styles.reviewDuration}>Duration: {formatTime(elapsed)}</Text>
          <View style={styles.reviewButtons}>
            <TouchableOpacity style={[styles.btn, styles.btnPlay]} onPress={isPlaying ? stopPlayback : playRecording}>
              <Text style={styles.btnText}>{isPlaying ? '⏹ Stop' : '▶ Play Back'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnAnalyze]} onPress={analyzeRecording}>
              <Text style={styles.btnText}>🔍 Analyze</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.reRecordBtn} onPress={resetAll}>
            <Text style={styles.reRecordText}>✕ Discard & Re-record</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Analyzing */}
      {phase === 'analyzing' && (
        <View style={styles.analyzingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.analyzingText}>Analyzing emotional tone…</Text>
        </View>
      )}

      {/* Results */}
      {phase === 'done' && result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Voice Emotion Analysis</Text>
          <View style={[styles.dominantBadge, { backgroundColor: dominantColor + '22', borderColor: dominantColor }]}>
            <Text style={[styles.dominantEmoji]}>
              {result.dominant === 'joy' || result.dominant === 'happiness' ? '😄' :
               result.dominant === 'sadness' ? '😢' :
               result.dominant === 'anger' ? '😠' :
               result.dominant === 'fear' ? '😨' :
               result.dominant === 'love' ? '❤️' :
               result.dominant === 'neutral' ? '😐' : '🎭'}
            </Text>
            <Text style={[styles.dominantLabel, { color: dominantColor }]}>
              {result.dominant?.charAt(0).toUpperCase() + result.dominant?.slice(1)}
            </Text>
            <Text style={styles.dominantSub}>Primary Emotion Detected</Text>
          </View>

          <Text style={styles.topLabel}>Emotion Breakdown:</Text>
          {topEmotions.map((item, idx) => (
            <View key={idx} style={styles.emotionRow}>
              <Text style={styles.emotionName}>{item.emotion}</Text>
              <View style={styles.barContainer}>
                <View style={[styles.bar, {
                  width: `${item.probability}%`,
                  backgroundColor: idx === 0 ? dominantColor : '#adb5bd'
                }]} />
              </View>
              <Text style={styles.emotionProb}>{item.probability}%</Text>
            </View>
          ))}

          <View style={styles.resultButtons}>
            <TouchableOpacity style={[styles.btn, styles.btnPlay]} onPress={resetAll}>
              <Text style={styles.btnText}>🎙 Record Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnAnalyze]} onPress={() => navigation.navigate('History')}>
              <Text style={styles.btnText}>📋 View History</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  contentContainer: { padding: 20, alignItems: 'center', paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a202c', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#718096', marginBottom: 24, textAlign: 'center' },

  waveformContainer: { flexDirection: 'row', alignItems: 'center', height: 60, marginBottom: 16, gap: 3 },
  waveBar: { width: 4, height: 40, borderRadius: 4, backgroundColor: '#ccc' },

  timer: { fontSize: 22, fontWeight: '600', color: '#4a5568', marginBottom: 20, letterSpacing: 2 },
  timerActive: { color: '#e74c3c' },

  micWrapper: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  pulseRing: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: '#e74c3c' },
  micButton: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#007bff', justifyContent: 'center', alignItems: 'center', shadowColor: '#007bff', shadowOpacity: 0.5, shadowRadius: 10, elevation: 8 },
  micButtonActive: { backgroundColor: '#e74c3c', shadowColor: '#e74c3c' },
  micIcon: { fontSize: 36 },
  hint: { fontSize: 13, color: '#718096', marginBottom: 24 },

  reviewCard: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, alignItems: 'center' },
  reviewTitle: { fontSize: 18, fontWeight: '600', color: '#2d3748', marginBottom: 4 },
  reviewDuration: { fontSize: 13, color: '#718096', marginBottom: 16 },
  reviewButtons: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  reRecordBtn: { marginTop: 4 },
  reRecordText: { color: '#e74c3c', fontSize: 13 },

  btn: { flex: 1, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center' },
  btnPlay: { backgroundColor: '#6c757d' },
  btnAnalyze: { backgroundColor: '#007bff' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  analyzingContainer: { alignItems: 'center', marginTop: 30 },
  analyzingText: { marginTop: 12, fontSize: 15, color: '#718096' },

  resultCard: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  resultTitle: { fontSize: 18, fontWeight: '700', color: '#2d3748', marginBottom: 16, textAlign: 'center' },
  dominantBadge: { alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1.5, marginBottom: 20 },
  dominantEmoji: { fontSize: 40, marginBottom: 4 },
  dominantLabel: { fontSize: 22, fontWeight: '700', textTransform: 'capitalize' },
  dominantSub: { fontSize: 12, color: '#718096', marginTop: 2 },
  topLabel: { fontSize: 13, color: '#718096', marginBottom: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  emotionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  emotionName: { width: 95, fontSize: 13, textTransform: 'capitalize', color: '#4a5568' },
  barContainer: { flex: 1, height: 10, backgroundColor: '#e9ecef', borderRadius: 5, marginHorizontal: 8, overflow: 'hidden' },
  bar: { height: 10, borderRadius: 5 },
  emotionProb: { width: 45, fontSize: 12, color: '#718096', textAlign: 'right' },
  resultButtons: { flexDirection: 'row', gap: 10, marginTop: 20 },
});

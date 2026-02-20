import React, {useState} from 'react';
import {View, Text, Button, TextInput, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity} from 'react-native';
import AnalysisService from '../services/AnalysisService';

export default function HomeScreen({navigation}){
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await AnalysisService.analyzeText(text);
      setResult(res);
    } catch (e) {
      setResult({ error: 'Failed to connect to server' });
    }
    setLoading(false);
  };

  // Get top 5 emotions sorted by probability
  const getTopEmotions = () => {
    if (!result || !result.probabilities) return [];
    const probs = result.probabilities;
    return Object.entries(probs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([emotion, prob]) => ({ emotion, probability: (prob * 100).toFixed(1) }));
  };

  const topEmotions = getTopEmotions();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>AI Mental Health Companion</Text>
      <Text style={styles.disclaimer}>This is an AI Support Tool — Not a Medical Diagnosis System.</Text>
      
      <TextInput
        placeholder="How are you feeling today?"
        value={text}
        onChangeText={setText}
        style={styles.input}
        multiline
        numberOfLines={3}
      />
      
      <View style={styles.buttonRow}>
        <Button title="Analyze Text" onPress={analyze} disabled={loading} />
      </View>
      <TouchableOpacity style={styles.voiceButton} onPress={() => navigation.navigate('Record')} activeOpacity={0.85}>
        <Text style={styles.voiceButtonIcon}>🎙</Text>
        <View>
          <Text style={styles.voiceButtonTitle}>Voice Mode</Text>
          <Text style={styles.voiceButtonSub}>Record & analyze emotional tone</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.buttonRow}>
        <Button title="View History" onPress={() => navigation.navigate('History')} color="#17a2b8" />
      </View>

      {loading && <ActivityIndicator size="large" style={styles.loader} />}

      {result && result.error && (
        <Text style={styles.errorText}>{result.error}</Text>
      )}

      {result && result.dominant && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Analysis Results</Text>
          <Text style={styles.dominantLabel}>
            Primary Emotion: <Text style={styles.dominantValue}>{result.dominant}</Text>
          </Text>
          <Text style={styles.topLabel}>Top Detected Emotions:</Text>
          {topEmotions.map((item, idx) => (
            <View key={idx} style={styles.emotionRow}>
              <Text style={styles.emotionName}>{item.emotion}</Text>
              <View style={styles.barContainer}>
                <View style={[styles.bar, { width: `${item.probability}%` }]} />
              </View>
              <Text style={styles.emotionProb}>{item.probability}%</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f9fa' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 4, color: '#343a40' },
  disclaimer: { fontSize: 11, color: '#6c757d', marginBottom: 16, fontStyle: 'italic' },
  input: { borderWidth: 1, borderColor: '#ced4da', borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#fff', minHeight: 80, textAlignVertical: 'top' },
  buttonRow: { marginBottom: 8 },
  loader: { marginTop: 16 },
  errorText: { color: 'red', marginTop: 12 },
  voiceButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a202c', borderRadius: 12, padding: 14, marginBottom: 8, gap: 14 },
  voiceButtonIcon: { fontSize: 28 },
  voiceButtonTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  voiceButtonSub: { color: '#a0aec0', fontSize: 12, marginTop: 1 },
  resultCard: { marginTop: 20, padding: 16, backgroundColor: '#fff', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  resultTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#495057' },
  dominantLabel: { fontSize: 14, marginBottom: 12 },
  dominantValue: { fontWeight: 'bold', color: '#007bff', textTransform: 'capitalize' },
  topLabel: { fontSize: 13, color: '#6c757d', marginBottom: 8 },
  emotionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  emotionName: { width: 100, fontSize: 13, textTransform: 'capitalize', color: '#495057' },
  barContainer: { flex: 1, height: 10, backgroundColor: '#e9ecef', borderRadius: 5, marginHorizontal: 8 },
  bar: { height: 10, backgroundColor: '#28a745', borderRadius: 5 },
  emotionProb: { width: 45, fontSize: 12, color: '#6c757d', textAlign: 'right' }
});

import React, { useContext, useState, useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from "react-native";
import { ThemeContext } from "./_layout";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Speech from 'expo-speech'; 
import { getFlashcardsByCategory, updateFlashcardStats } from "../services/learningService";
import { getAIRecommendation } from "../services/aiService";

// EKSİK OLAN SATIR BURASIYDI:
const { width, height } = Dimensions.get("window");

export default function QuizScreen() {
  const { theme } = useContext(ThemeContext) as any;
  const params = useLocalSearchParams();
  const categoryId = params.categoryId as string;
  
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [aiHint, setAiHint] = useState("");
  const [hintLoading, setHintLoading] = useState(false);

  useEffect(() => { loadFlashcards(); }, [categoryId]);

  const loadFlashcards = async () => {
    setLoading(true);
    try {
      const data = await getFlashcardsByCategory(categoryId);
      setFlashcards(data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const speak = (text: string) => {
    Speech.speak(text, { language: 'en-US' });
  };

  const getAIHint = async () => {
    if (!flashcards[currentCardIndex]) return;
    setHintLoading(true);
    const prompt = `Şu terimi tahmin etmem için kısa bir ipucu ver: "${flashcards[currentCardIndex].term}"`;
    const response = await getAIRecommendation(prompt);
    setAiHint(response);
    setHintLoading(false);
  };

  const handleAnswer = async (isCorrect: boolean) => {
    const currentCard = flashcards[currentCardIndex];
    await updateFlashcardStats(currentCard.id, isCorrect);
    
    setAiHint("");
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setShowDefinition(false);
    } else {
      Alert.alert("Tebrikler!", "Quiz bitti.", [{ text: "Tamam", onPress: () => router.back() }]);
    }
  };

  if (loading) return <View style={[styles.center, {backgroundColor: theme.background}]}><ActivityIndicator size="large" color={theme.accent}/></View>;
  if (flashcards.length === 0) return (
    <View style={[styles.center, {backgroundColor: theme.background}]}>
      <Text style={{color: theme.text, marginBottom: 20}}>Henüz kart eklenmemiş.</Text>
      <TouchableOpacity onPress={() => router.back()} style={{backgroundColor: theme.accent, padding: 15, borderRadius: 10}}>
        <Text style={{color: '#fff'}}>Geri Dön</Text>
      </TouchableOpacity>
    </View>
  );

  const currentCard = flashcards[currentCardIndex];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}><MaterialIcons name="close" size={28} color={theme.text}/></TouchableOpacity>
        <Text style={[styles.progress, {color: theme.subtle}]}>{currentCardIndex + 1} / {flashcards.length}</Text>
        <View style={{width: 28}} />
      </View>

      <TouchableOpacity 
        style={[styles.card, { backgroundColor: theme.card }]} 
        onPress={() => { setShowDefinition(!showDefinition); if(!showDefinition) speak(currentCard.term); }}
        activeOpacity={0.9}
      >
        <Text style={[styles.cardTitle, { color: theme.text }]}>
          {showDefinition ? currentCard.definition : currentCard.term}
        </Text>
        <MaterialIcons name="touch-app" size={24} color={theme.accent + "40"} style={{position: 'absolute', bottom: 20}} />
      </TouchableOpacity>

      <View style={[styles.aiBox, { backgroundColor: theme.card }]}>
        <View style={styles.aiHeader}>
          <FontAwesome5 name="robot" size={16} color={theme.accent} />
          <Text style={[styles.aiTitle, { color: theme.accent }]}>AI İPUCU</Text>
        </View>
        {aiHint ? (
          <Text style={[styles.aiContent, { color: theme.text }]}>{aiHint}</Text>
        ) : (
          <TouchableOpacity onPress={getAIHint}>
            {hintLoading ? <ActivityIndicator size="small" color={theme.accent} /> : <Text style={{color: theme.subtle}}>İpucu ister misin?</Text>}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.btnRow}>
        <TouchableOpacity style={[styles.btn, {backgroundColor: '#ef4444'}]} onPress={() => handleAnswer(false)}>
          <Text style={styles.btnText}>Yanlış</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, {backgroundColor: '#22c55e'}]} onPress={() => handleAnswer(true)}>
          <Text style={styles.btnText}>Doğru</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  progress: { fontWeight: 'bold' },
  card: { width: '100%', height: height * 0.45, borderRadius: 35, justifyContent: 'center', alignItems: 'center', padding: 25, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1 },
  cardTitle: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  aiBox: { width: '100%', marginTop: 30, padding: 20, borderRadius: 25, borderLeftWidth: 5, borderLeftColor: '#a855f7' },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  aiTitle: { fontWeight: 'bold', marginLeft: 8, fontSize: 12 },
  aiContent: { fontSize: 14, fontStyle: 'italic' },
  btnRow: { flexDirection: 'row', gap: 20, marginTop: 'auto', marginBottom: 40 },
  btn: { flex: 1, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '800' }
});
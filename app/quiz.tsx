import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { generateQuiz, finishQuiz } from '../services/quizService';
import { ThemeContext } from './_layout';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width } = Dimensions.get("window");

export default function QuizScreen() {
  const { theme } = useContext(ThemeContext) as any;
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quizEnded, setQuizEnded] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, message: "" });

  useEffect(() => {
    startNewQuiz();
  }, []);

  const startNewQuiz = async () => {
    try {
      const data = await generateQuiz();
      if (!data || data.length === 0) {
        throw new Error("Henüz yeterli kelimeniz yok. En az 4 kelime kaydetmiş olmalısın.");
      }
      setQuestions(data);
    } catch (err: any) {
      setErrorModal({ 
        visible: true, 
        message: err.message || "Soru havuzu oluşturulamadı. Lütfen kelime eklediğinizden emin olun." 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (answer: string) => {
    if (!questions[currentIdx]) return;

    const isCorrect = answer === questions[currentIdx].correctAnswer;
    const newScore = isCorrect ? score + 1 : score;
    
    if (isCorrect) setScore(newScore);

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setLoading(true);
      try {
        await finishQuiz(newScore);
      } catch (e) {
        console.log("Puan kaydetme hatası:", e);
      }
      setLoading(false);
      setQuizEnded(true);
    }
  };

  // KRİTİK: Veri yüklenirken veya bir hata varken render'ı koruyoruz
  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={{ color: theme.text, marginTop: 15, fontWeight: '600' }}>Test Hazırlanıyor...</Text>
      </View>
    );
  }

  // Quiz bittiyse başarı ekranı
  if (quizEnded) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ConfettiCannon count={200} origin={{ x: width / 2, y: -20 }} fadeOut={true} />
        <Ionicons name="trophy" size={100} color="#FFD700" />
        <Text style={[styles.successTitle, { color: theme.text }]}>Tebrikler!</Text>
        <Text style={[styles.successSub, { color: theme.subtle }]}>{score} doğru ile {score * 10} XP kazandın.</Text>
        <TouchableOpacity 
          style={[styles.finishBtn, { backgroundColor: theme.accent }]} 
          onPress={() => router.replace("/(tabs)/settings")}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Profili Gör</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQuestion = questions[currentIdx];

  // Eğer soru yüklenemediyse boş dön (crash'i önler)
  if (!currentQuestion) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={{ color: theme.text, fontWeight: '700', fontSize: 16 }}>
          Soru {currentIdx + 1}/{questions.length}
        </Text>
        <Text style={{ color: theme.accent, fontWeight: 'bold', fontSize: 16 }}>
          {score * 10} XP
        </Text>
      </View>

      <LinearGradient colors={[theme.accent, '#6366f1']} style={styles.questionCard}>
        <Text style={styles.questionText}>
          "{currentQuestion.question}"{"\n"}teriminin anlamı nedir?
        </Text>
      </LinearGradient>

      <View style={{ gap: 12 }}>
        {currentQuestion.options?.map((opt: string, i: number) => (
          <TouchableOpacity 
            key={i} 
            style={[styles.optionBtn, { backgroundColor: theme.card, borderColor: theme.accent + '20' }]}
            onPress={() => handleAnswer(opt)}
            activeOpacity={0.7}
          >
            <Text style={{ color: theme.text, flex: 1, fontSize: 16, fontWeight: '600' }}>{opt}</Text>
            <Ionicons name="chevron-forward-circle" size={20} color={theme.accent} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Modern Hata Modalı */}
      <Modal visible={errorModal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Ionicons name="alert-circle" size={50} color="#ef4444" />
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold', marginTop: 10 }}>Hoppala!</Text>
            <Text style={{ color: theme.subtle, textAlign: 'center', marginVertical: 15, paddingHorizontal: 10 }}>
              {errorModal.message}
            </Text>
            <TouchableOpacity 
              style={[styles.finishBtn, { backgroundColor: theme.accent, width: '100%' }]} 
              onPress={() => router.back()}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Anladım</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  questionCard: { width: '100%', padding: 40, borderRadius: 30, marginBottom: 30, elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  questionText: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center', lineHeight: 30 },
  optionBtn: { padding: 20, borderRadius: 20, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  successTitle: { fontSize: 32, fontWeight: '900', marginTop: 20 },
  successSub: { fontSize: 16, marginTop: 10, textAlign: 'center' },
  finishBtn: { marginTop: 20, paddingHorizontal: 40, paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 30 },
  modalContent: { padding: 25, borderRadius: 30, alignItems: 'center', elevation: 20 }
});
import React, { useContext, useState, useEffect } from "react";
import { 
  StyleSheet, View, Text, ScrollView, TouchableOpacity, 
  Dimensions, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform 
} from "react-native";
import { ThemeContext } from "../_layout";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router"; 
import Toast from 'react-native-root-toast';
import * as Speech from 'expo-speech';
import { 
  getCategories, 
  addCategory, 
  addFlashcard, 
  getAllFlashcards, 
  deleteFlashcard,
  deleteCategory 
} from "../../services/learningService";
import { getAIRecommendation } from "../../services/aiService";

const { width } = Dimensions.get("window");

export default function LearningScreen() {
  const { theme } = useContext(ThemeContext) as any;
  const [categories, setCategories] = useState<any[]>([]);
  const [allCards, setAllCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modallar için State'ler
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, name: string, type: 'card' | 'category'} | null>(null);
  
  // Form State'leri
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const categoryColors = ["#a855f7", "#3b82f6", "#22c55e", "#ef4444", "#f59e0b", "#ec4899"];

  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    setLoading(true);
    await Promise.all([loadCategories(), loadAllCards()]);
    setLoading(false);
  };

  const loadCategories = async () => {
    const data = await getCategories();
    setCategories(data);
  };

  const loadAllCards = async () => {
    const cards = await getAllFlashcards();
    setAllCards(cards);
  };

  const showSuccessToast = (msg: string) => {
    Toast.show(msg, {
      duration: Toast.durations.LONG,
      position: Toast.positions.TOP + 40,
      backgroundColor: theme.accent,
      textColor: '#ffffff',
      containerStyle: { borderRadius: 25, paddingHorizontal: 25, paddingVertical: 12 }
    });
  };

  const handleSave = async () => {
    if (!term || !definition || !categoryInput) return;
    try {
      let category = categories.find(c => c.name.toLowerCase() === categoryInput.toLowerCase());
      let catId = category?.id;
      if (!catId) {
        const randomColor = categoryColors[Math.floor(Math.random() * categoryColors.length)];
        const newCat = await addCategory(categoryInput, "bookmark", randomColor);
        catId = newCat.id;
      }
      await addFlashcard(catId, term, definition);
      showSuccessToast('Hafızaya eklendi! 🚀');
      setTerm(""); setDefinition(""); setCategoryInput("");
      setModalVisible(false);
      loadInitialData();
    } catch (error) {
      console.error(error);
    }
  };

  // Silme Onay Mekanizması
  const requestDelete = (id: string, name: string, type: 'card' | 'category') => {
    setItemToDelete({ id, name, type });
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'card') {
      await deleteFlashcard(itemToDelete.id);
    } else {
      await deleteCategory(itemToDelete.id);
    }
    setDeleteModalVisible(false);
    showSuccessToast('Başarıyla silindi.');
    loadInitialData();
  };

  const getAiDefinition = async () => {
    if (!term) return;
    setAiLoading(true);
    const resp = await getAIRecommendation(`${term} teriminin çok kısa anlamını yaz.`);
    setDefinition(resp);
    setAiLoading(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
      <Text style={[styles.headerTitle, { color: theme.text }]}>Öğrenme Merkezi</Text>

      {/* Quiz Kartı */}
      <TouchableOpacity activeOpacity={0.9} onPress={() => router.push("/quiz")}>
        <LinearGradient colors={["#8B5CF6", "#D946EF"]} style={styles.quizCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.quizTag}>HAZIR MISIN?</Text>
            <Text style={styles.quizTitle}>Quize Başla</Text>
            <Text style={styles.quizSub}>Terimleri test etme zamanı.</Text>
          </View>
          <FontAwesome5 name="brain" size={40} color="#fff" style={{ opacity: 0.7 }} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Kategoriler */}
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Kategorilerim</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.addText}>Yeni Terim</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {categories.map((cat) => (
          <TouchableOpacity 
            key={cat.id} 
            style={[styles.catCard, { backgroundColor: theme.card }]}
            onPress={() => router.push({ pathname: "/flashcard" , params: { categoryId: cat.id } })}
            onLongPress={() => requestDelete(cat.id, cat.name, 'category')}
            delayLongPress={500}
          >
            <View style={[styles.iconBox, { backgroundColor: cat.color + "15" }]}>
              <Ionicons name="bookmark" size={24} color={cat.color} />
            </View>
            <Text style={[styles.catName, { color: theme.text }]} numberOfLines={1}>{cat.name}</Text>
            <Text style={[styles.catSub, { color: theme.subtle }]}>Tekrar: 24s</Text>
            <View style={styles.barBg}><View style={[styles.barFill, { backgroundColor: cat.color, width: '60%' }]} /></View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Kelime Bankası */}
      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 35, marginBottom: 15 }]}>Kelime Bankası</Text>

      {allCards.map((item) => (
        <View key={item.id} style={[styles.wordCard, { backgroundColor: theme.card }]}>
          <View style={styles.wordInfo}>
            <Text style={[styles.wordTerm, { color: theme.text }]}>{item.term}</Text>
            <Text style={[styles.wordDef, { color: theme.subtle }]} numberOfLines={1}>{item.definition}</Text>
          </View>
          <View style={styles.wordActions}>
            <TouchableOpacity onPress={() => Speech.speak(item.term, { language: 'en-US' })} style={[styles.actionIcon, { backgroundColor: theme.accent + '10' }]}>
              <Ionicons name="volume-medium" size={18} color={theme.accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => requestDelete(item.id, item.term, 'card')} style={[styles.actionIcon, { backgroundColor: '#ef444410' }]}>
              <Ionicons name="trash" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* YENİ TERİM EKLEME MODALI */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Hafızaya Al</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={28} color={theme.subtle} /></TouchableOpacity>
            </View>
            <TextInput style={[styles.input, { color: theme.text, borderColor: theme.accent + "15" }]} placeholder="Kelime / Terim" placeholderTextColor={theme.subtle} value={term} onChangeText={setTerm} />
            <View style={styles.aiRow}>
              <TextInput style={[styles.input, { flex: 1, color: theme.text, borderColor: theme.accent + "15" }]} placeholder="Anlamı" placeholderTextColor={theme.subtle} value={definition} onChangeText={setDefinition} multiline />
              <TouchableOpacity onPress={getAiDefinition} style={styles.aiBtn}>
                {aiLoading ? <ActivityIndicator size="small" color="#fff" /> : <MaterialIcons name="auto-awesome" size={24} color="#fff" />}
              </TouchableOpacity>
            </View>
            <TextInput style={[styles.input, { color: theme.text, borderColor: theme.accent + "15" }]} placeholder="Kategori" placeholderTextColor={theme.subtle} value={categoryInput} onChangeText={setCategoryInput} />
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.accent }]} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODERN SİLME ONAY MODALI (HİÇ DEMODE DEĞİL!) */}
      <Modal visible={deleteModalVisible} animationType="fade" transparent>
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmContent, { backgroundColor: theme.card }]}>
            <View style={styles.confirmIconBox}>
              <Ionicons name="trash-outline" size={32} color="#ef4444" />
            </View>
            <Text style={[styles.confirmTitle, { color: theme.text }]}>Emin misin?</Text>
            <Text style={[styles.confirmSub, { color: theme.subtle }]}>"{itemToDelete?.name}" kalıcı olarak silinecek.</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: theme.subtle + '10' }]} onPress={() => setDeleteModalVisible(false)}>
                <Text style={[styles.confirmBtnText, { color: theme.text }]}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: '#ef4444' }]} onPress={confirmDelete}>
                <Text style={[styles.confirmBtnText, { color: '#fff' }]}>Sil</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60 },
  headerTitle: { fontSize: 32, fontWeight: "900", letterSpacing: -1, marginBottom: 25 },
  quizCard: { padding: 25, borderRadius: 30, flexDirection: 'row', alignItems: 'center', marginBottom: 30, elevation: 5 },
  quizTag: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.2 },
  quizTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 4 },
  quizSub: { color: '#fff', fontSize: 13, marginTop: 4, opacity: 0.8 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '800' },
  addBtn: { backgroundColor: '#a855f7', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 15, flexDirection: 'row', alignItems: 'center' },
  addText: { color: '#fff', fontWeight: 'bold', fontSize: 13, marginLeft: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  catCard: { width: width * 0.43, padding: 20, borderRadius: 28, marginBottom: 15, elevation: 2 },
  iconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  catName: { fontSize: 16, fontWeight: '700' },
  catSub: { fontSize: 11, marginTop: 5, fontWeight: '600' },
  barBg: { height: 5, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 5, marginTop: 15, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  wordCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 22, marginBottom: 10, elevation: 1 },
  wordInfo: { flex: 1 },
  wordTerm: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  wordDef: { fontSize: 13, opacity: 0.7 },
  wordActions: { flexDirection: 'row', gap: 8 },
  actionIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { padding: 25, borderTopLeftRadius: 35, borderTopRightRadius: 35, paddingBottom: 50 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '800' },
  input: { borderWidth: 1.5, borderRadius: 18, padding: 15, marginBottom: 15, fontSize: 16 },
  aiRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  aiBtn: { backgroundColor: '#a855f7', width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  saveBtn: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  confirmContent: { width: '100%', padding: 25, borderRadius: 35, alignItems: 'center' },
  confirmIconBox: { width: 70, height: 70, borderRadius: 25, backgroundColor: '#ef444415', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  confirmTitle: { fontSize: 22, fontWeight: '800', marginBottom: 10 },
  confirmSub: { fontSize: 15, textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  confirmActions: { flexDirection: 'row', gap: 15 },
  confirmBtn: { flex: 1, height: 55, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  confirmBtnText: { fontSize: 16, fontWeight: '700' },
});
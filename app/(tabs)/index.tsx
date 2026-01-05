import React, { useContext, useState, useEffect, useCallback } from "react";
import { 
  StyleSheet, View, Text, ScrollView, TouchableOpacity, 
  Dimensions, ActivityIndicator, Image, RefreshControl 
} from "react-native";
import { ThemeContext } from "../_layout";
import { Ionicons, FontAwesome5, Feather, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { getTasks } from "../../services/taskService";
import { auth, db } from "../../firebaseConfig"; 
import { doc, getDoc } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get("window");

// Görev veri tipi tanımı
interface Task {
  id: string;
  title: string;
  category: string;
  date: string;
  completed: boolean;
}

// Kullanıcı veri tipi tanımı
interface UserData {
  displayName?: string;
  avatarUrl?: string;
  gender?: string;
}

export default function HomeScreen() {
  // ThemeContext'i güvenli bir şekilde alıyoruz
  const { theme } = useContext(ThemeContext) as any;
  const isFocused = useIsFocused(); // Ekran odağı değiştiğinde tetikleyici

  // State Yönetimi
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // Aşağı çekip yenileme için
  const [aiMessage, setAiMessage] = useState("Motivasyon yükleniyor...");

  // Ekran her odaklandığında verileri yükle
  useEffect(() => {
    if (isFocused) {
      loadAllData();
    }
  }, [isFocused]);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchUserData(),
      loadTasks(),
      fetchFirebaseMessagePool()
    ]);
    setLoading(false);
  };

  // Manuel yenileme (Pull to Refresh) fonksiyonu
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchUserData(),
      loadTasks(),
      fetchFirebaseMessagePool()
    ]);
    setRefreshing(false);
  }, []);

  // --- FIREBASE 100 MESAJ HAVUZ SİSTEMİ ---
  const fetchFirebaseMessagePool = async () => {
    try {
      const lastUpdate = await AsyncStorage.getItem('last_firebase_msg_update');
      const now = Date.now();
      const twelveHours = 12 * 60 * 60 * 1000;

      // Eğer veri yoksa veya 12 saat geçtiyse Firebase'den çek
      if (!lastUpdate || now - parseInt(lastUpdate) > twelveHours) {
        const msgDoc = await getDoc(doc(db, "ai_messages", "motivations"));
        
        if (msgDoc.exists()) {
          const data = msgDoc.data();
          const pool = data?.messages || []; 
          if (pool.length > 0) {
            await AsyncStorage.setItem('local_msg_pool', JSON.stringify(pool));
            await AsyncStorage.setItem('last_firebase_msg_update', now.toString());
            setAiMessage(pool[Math.floor(Math.random() * pool.length)]);
            return;
          }
        }
      } 
      
      // Yerel havuzdan veri çek
      const localPool = await AsyncStorage.getItem('local_msg_pool');
      if (localPool) {
        const pool = JSON.parse(localPool);
        if (pool.length > 0) {
          setAiMessage(pool[Math.floor(Math.random() * pool.length)]);
        }
      } else {
        // Hiçbir veri yoksa varsayılan mesaj
        setAiMessage("Bugün harika şeyler başarmak için mükemmel bir gün! ✨");
      }
    } catch (error) {
      console.log("Mesaj havuzu hatası:", error);
      setAiMessage("Hedeflerine odaklan, başarı seninle! 🚀");
    }
  };

  // Kullanıcı verisini çek
  const fetchUserData = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        } else {
          setUserData({ displayName: user.displayName || "Kullanıcı" });
        }
      } catch (e) {
        console.log("Kullanıcı verisi çekilemedi:", e);
      }
    }
  };

  // Görevleri çek ve filtrele
  const loadTasks = async () => {
    try {
      const allTasks = await getTasks() as Task[];
      const today = new Date().toISOString().split('T')[0];
      
      const upcoming = allTasks
        .filter(t => t.date && !t.completed && t.date >= today) // Bugünden eski olmayanlar
        .sort((a, b) => (a.date || "").localeCompare(b.date || "")) // Tarihe göre sırala (En yakın en üstte)
        .slice(0, 3); // Sadece ilk 3 görevi al
      
      setTasks(upcoming);
    } catch (error) {
      console.log("Görev çekme hatası:", error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return "İyi Geceler";
    if (hour < 12) return "Günaydın";
    if (hour < 18) return "İyi Günler";
    return "İyi Akşamlar";
  };

  // --- DİNAMİK AVATAR SİSTEMİ ---
  const getAvatar = () => {
    if (userData?.avatarUrl) return { uri: userData.avatarUrl };
    
    // Cinsiyet verisinin güvenli kontrolü (null check)
    const gender = userData?.gender ? userData.gender.toLowerCase() : "other";
    
    if (gender === "female" || gender === "kadın") {
      return { uri: 'https://avatar.iran.liara.run/public/78' };
    } else if (gender === "male" || gender === "erkek") {
      return { uri: 'https://avatar.iran.liara.run/public/31' };
    } else {
      return { uri: 'https://avatar.iran.liara.run/public/48' };
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
      }
    >
      
      {/* ÜST BİLGİ ALANI (HEADER) */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greetingText, { color: theme.subtle }]}>{getGreeting()},</Text>
          <Text style={[styles.userName, { color: theme.text }]}>
            {userData?.displayName || "Kullanıcı"} 👋
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.avatarContainer, { borderColor: theme.accent }]}
          onPress={() => router.push("/settings")}
          activeOpacity={0.8}
        >
          <Image source={getAvatar()} style={styles.avatar} />
        </TouchableOpacity>
      </View>

      {/* GÜNÜN MOTİVASYON KARTI */}
      <LinearGradient 
        colors={[theme.accent, '#6366f1']} 
        style={styles.aiCard} 
        start={{x:0, y:0}} 
        end={{x:1, y:1}}
      >
        <View style={styles.aiIconCircle}>
          <MaterialIcons name="auto-awesome" size={20} color={theme.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.aiTitle}>Günün Mesajı</Text>
          <Text style={styles.aiMessage}>"{aiMessage}"</Text>
        </View>
      </LinearGradient>

      {/* HIZLI AKSİYON MENÜSÜ */}
      <View style={styles.actionGrid}>
        <TouchableOpacity 
          style={[styles.actionBox, { backgroundColor: theme.card }]} 
          onPress={() => router.push("/learning")}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#a855f715' }]}>
            <FontAwesome5 name="brain" size={20} color="#a855f7" />
          </View>
          <Text style={[styles.actionLabel, { color: theme.text }]}>Öğren</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBox, { backgroundColor: theme.card }]} 
          onPress={() => router.push("/tasks")}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#3b82f615' }]}>
            <Feather name="calendar" size={20} color="#3b82f6" />
          </View>
          <Text style={[styles.actionLabel, { color: theme.text }]}>Planner</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBox, { backgroundColor: theme.card }]} 
          onPress={() => router.push("/quiz")}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#22c55e15' }]}>
            <Ionicons name="flash" size={20} color="#22c55e" />
          </View>
          <Text style={[styles.actionLabel, { color: theme.text }]}>Quiz</Text>
        </TouchableOpacity>
      </View>

      {/* YAKLAŞAN GÖREVLER BÖLÜMÜ */}
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Yaklaşan Görevler</Text>
        <TouchableOpacity onPress={() => router.push("/tasks")}>
          <Text style={{ color: theme.accent, fontWeight: '700' }}>Hepsini Gör</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator color={theme.accent} style={{ marginTop: 20 }} />
      ) : tasks.length > 0 ? (
        tasks.map((task) => (
          <TouchableOpacity 
            key={task.id} 
            style={[styles.taskCard, { backgroundColor: theme.card }]}
            onPress={() => router.push("/tasks")}
            activeOpacity={0.9}
          >
            <View style={[styles.taskLine, { backgroundColor: theme.accent }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.taskTitle, { color: theme.text }]} numberOfLines={1}>{task.title}</Text>
              <View style={styles.taskMeta}>
                <Feather name="clock" size={12} color={theme.subtle} />
                <Text style={[styles.taskDate, { color: theme.subtle }]}> {task.date}</Text>
                <Text style={[styles.taskCategory, { color: theme.accent }]}> • {task.category}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.subtle} />
          </TouchableOpacity>
        ))
      ) : (
        <View style={[styles.emptyContainer, { borderColor: theme.subtle + '40' }]}>
          <Feather name="check-circle" size={32} color={theme.subtle} style={{ opacity: 0.5 }} />
          <Text style={{ color: theme.subtle, marginTop: 10, textAlign: 'center' }}>
            Harika! Şu an için{'\n'}tüm görevler tamamlandı.
          </Text>
          <TouchableOpacity 
            style={{ marginTop: 15 }} 
            onPress={() => router.push("/tasks")}
          >
            <Text style={{ color: theme.accent, fontWeight: 'bold' }}>+ Yeni Görev Ekle</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Tab Bar arkasında kalmaması için boşluk */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  greetingText: { fontSize: 16, fontWeight: '600' },
  userName: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  avatarContainer: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, padding: 2 },
  avatar: { width: '100%', height: '100%', borderRadius: 25 },
  aiCard: { padding: 20, borderRadius: 28, flexDirection: 'row', alignItems: 'center', marginBottom: 30, elevation: 8, shadowColor: '#6366f1', shadowOpacity: 0.3, shadowRadius: 10 },
  aiIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  aiTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  aiMessage: { color: '#fff', fontSize: 15, fontWeight: '700', marginTop: 4, lineHeight: 22 },
  actionGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 35 },
  actionBox: { width: (width - 60) / 3, paddingVertical: 20, borderRadius: 24, alignItems: 'center', elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5 },
  actionIcon: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  actionLabel: { fontSize: 14, fontWeight: '700' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: '800' },
  taskCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 22, marginBottom: 12, elevation: 1, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 3 },
  taskLine: { width: 4, height: 40, borderRadius: 2, marginRight: 15 },
  taskTitle: { fontSize: 16, fontWeight: '700' },
  taskMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  taskDate: { fontSize: 12, marginLeft: 4 },
  taskCategory: { fontSize: 12, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', padding: 30, borderRadius: 20, borderStyle: 'dashed', borderWidth: 1.5, marginTop: 10, justifyContent: 'center' }
});
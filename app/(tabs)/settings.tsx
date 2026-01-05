import React, { useContext, useState, useEffect } from "react";
import { 
  StyleSheet, View, Text, ScrollView, TouchableOpacity, 
  Image, TextInput, Modal, Alert, ActivityIndicator, Dimensions 
} from "react-native";
import { ThemeContext } from "../_layout";
import { Ionicons, FontAwesome5, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { getTasks } from "../../services/taskService";
import { router } from "expo-router";

const { width, height } = Dimensions.get("window");

export default function SettingsScreen() {
  const { theme, toggleTheme } = useContext(ThemeContext) as any;
  const [userData, setUserData] = useState<any>(null);
  const [stats, setStats] = useState({ completedTasks: 0, streak: 0, points: 0 });
  const [loading, setLoading] = useState(true);

  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedGender, setSelectedGender] = useState("");

  const avatarOptions = {
    male: 'https://avatar.iran.liara.run/public/31',
    female: 'https://avatar.iran.liara.run/public/78',
    other: 'https://avatar.iran.liara.run/public/48'
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        let points = 0;
        let streak = 0;

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setNewName(data.displayName || "");
          setSelectedGender(data.gender || "other");
          points = data.points || 0;
          streak = data.streak || 0;
        }

        const allTasks: any = await getTasks();
        const completedCount = allTasks.filter((t: any) => t.completed).length;
        
        setStats({
          completedTasks: completedCount,
          streak: streak,
          points: points
        });
      } catch (error) {
        console.log("Veri çekme hatası:", error);
      }
    }
    setLoading(false);
  };

  const handleUpdateProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(doc(db, "users", user.uid), {
        displayName: newName,
        gender: selectedGender,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setEditProfileVisible(false);
      loadUserData();
      Alert.alert("Başarılı", "Profilin güncellendi! ✨");
    } catch (error) {
      Alert.alert("Hata", "Güncelleme yapılamadı.");
    }
  };

  const handleLogout = () => {
    Alert.alert("Çıkış", "Ayrılmak istediğine emin misin?", [
      { text: "Vazgeç" },
      { text: "Çıkış Yap", style: "destructive", onPress: () => signOut(auth).then(() => router.replace("/auth/login" as any)) }
    ]);
  };

  const getAvatar = (gender: string) => {
    const g = gender?.toLowerCase();
    if (g === "kadın" || g === "female") return { uri: avatarOptions.female };
    if (g === "erkek" || g === "male") return { uri: avatarOptions.male };
    return { uri: avatarOptions.other };
  };

  if (loading) return (
    <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.accent} />
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
      
      {/* PROFİL VE XP KARTI */}
      <LinearGradient colors={[theme.accent, '#6366f1']} style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <Image source={getAvatar(userData?.gender)} style={styles.mainAvatar} />
          <View style={styles.nameInfo}>
            <Text style={styles.profileName}>{userData?.displayName || "Kullanıcı"}</Text>
            {/* Seviye her 100 XP'de bir artar */}
            <Text style={styles.profileLevel}>
              Seviye {Math.floor(stats.points / 100) + 1} • {stats.points % 100}/100 XP
            </Text>
          </View>
          <TouchableOpacity onPress={() => setEditProfileVisible(true)} style={styles.editBtn}>
            <Ionicons name="create-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <FontAwesome5 name="fire" size={24} color="#FFD700" />
            <Text style={styles.statValue}>{stats.streak}</Text>
            <Text style={styles.statLabel}>Seri</Text>
          </View>
          <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }]}>
            <MaterialCommunityIcons name="trophy" size={24} color="#FFD700" />
            <Text style={styles.statValue}>{stats.points}</Text>
            <Text style={styles.statLabel}>Toplam XP</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="checkbox" size={24} color="#22C55E" />
            <Text style={styles.statValue}>{stats.completedTasks}</Text>
            <Text style={styles.statLabel}>Biten İş</Text>
          </View>
        </View>
      </LinearGradient>

      {/* AYARLAR MENÜSÜ */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Uygulama Ayarları</Text>
      <View style={[styles.menuCard, { backgroundColor: theme.card }]}>
        <TouchableOpacity style={styles.menuItem} onPress={toggleTheme}>
          <View style={[styles.menuIcon, { backgroundColor: '#3b82f615' }]}>
            <Ionicons name={theme.dark ? "sunny" : "moon"} size={22} color="#3b82f6" />
          </View>
          <Text style={[styles.menuText, { color: theme.text }]}>Görünüm</Text>
          <Text style={{color: theme.subtle, fontWeight: '600'}}>{theme.dark ? "Aydınlık" : "Karanlık"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
          <View style={[styles.menuIcon, { backgroundColor: '#ef444415' }]}>
            <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          </View>
          <Text style={[styles.menuText, { color: '#ef4444' }]}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>

      {/* PROFİL DÜZENLEME MODALI */}
      <Modal visible={editProfileVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Profili Güncelle</Text>
              <TouchableOpacity onPress={() => setEditProfileVisible(false)}>
                <Ionicons name="close-circle" size={32} color={theme.subtle} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.inputLabel, { color: theme.text }]}>Görünen Adın</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.background }]}>
              <TextInput 
                style={[styles.input, { color: theme.text }]}
                value={newName}
                onChangeText={setNewName}
                placeholder="İsminizi yazın..."
                placeholderTextColor={theme.subtle}
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile}>
              <LinearGradient colors={[theme.accent, '#6366f1']} style={styles.saveBtnGradient}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Değişiklikleri Kaydet</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileCard: { padding: 25, borderRadius: 30, marginBottom: 30, elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  mainAvatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: '#fff' },
  nameInfo: { marginLeft: 15, flex: 1 },
  profileName: { color: '#fff', fontSize: 22, fontWeight: '800' },
  profileLevel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', marginTop: 2 },
  editBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 15 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingVertical: 18 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 22, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15, marginLeft: 5 },
  menuCard: { borderRadius: 25, padding: 10, marginBottom: 25 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  menuIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { fontSize: 16, fontWeight: '700', flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, paddingBottom: 50 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 22, fontWeight: '900' },
  inputLabel: { fontSize: 14, fontWeight: '700', marginBottom: 10, marginLeft: 5 },
  inputWrapper: { borderRadius: 18, paddingHorizontal: 15, height: 60, justifyContent: 'center', marginBottom: 20 },
  input: { fontSize: 16, fontWeight: '600' },
  saveBtn: { borderRadius: 20, overflow: 'hidden' },
  saveBtnGradient: { paddingVertical: 18, alignItems: 'center' }
});
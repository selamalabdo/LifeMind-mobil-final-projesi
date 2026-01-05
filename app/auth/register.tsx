import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; 
import React, { useContext, useState, useRef, useEffect } from "react";
import LottieView from "lottie-react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { auth, db } from "../../firebaseConfig";
import { ThemeContext } from "../_layout";
import { SafeAreaView } from "react-native-safe-area-context";
export default function Register() {

const { theme } = useContext(ThemeContext) as any;
  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState(""); 
  const [birthDate, setBirthDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animasyonlar
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 20, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    Keyboard.dismiss();
    
    // Modern Validasyon Kontrolleri
    if (!fullName || !email || !gender) {
      Alert.alert("Eksik Bilgi", "Lütfen tüm alanları doldurduğunuzdan emin olun.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Güvenlik", "Şifreniz güvenliğiniz için en az 6 karakter olmalıdır.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Şifre Hatası", "Girdiğiniz şifreler birbiriyle eşleşmiyor.");
      return;
    }

    setLoading(true);
    try {
      // 1. Kullanıcı Oluşturma
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      
      // 2. Auth Profil Güncelleme
      await updateProfile(userCredential.user, { displayName: fullName });

      // 3. Firestore Veri Kaydı (Cinsiyet ve Doğum Tarihi)
      await setDoc(doc(db, "users", userCredential.user.uid), {
        fullName,
        email: email.toLowerCase(),
        gender,
        birthDate: birthDate.toISOString(),
        createdAt: new Date().toISOString()
      });

      // 4. Otomatik Giriş ve Yönlendirme
      setLoading(false);
      router.replace("/(tabs)"); 
      
    } catch (error: any) {
      setLoading(false);
      let title = "Kayıt Başarısız";
      let message = "Bir hata oluştu, lütfen tekrar deneyin.";

      if (error.code === "auth/email-already-in-use") {
        message = "Bu e-posta adresi zaten kullanımda.";
      } else if (error.code === "auth/invalid-email") {
        message = "Geçersiz bir e-posta adresi girdiniz.";
      }

      Alert.alert(title, message);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.headerSection}>
            <LottieView
              source={require("../../assets/animations/register.json")}
              autoPlay loop style={styles.lottie}
            />
            <Text style={[styles.title, { color: theme.text }]}>Yeni Hesap Oluştur</Text>
            <Text style={[styles.subtitle, { color: theme.subtle }]}>Akıllı planlayıcınla tanışmaya hazır mısın?</Text>
          </View>

          <Animated.View style={[styles.formCard, { backgroundColor: theme.card, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            
            {/* Ad Soyad */}
            <View style={styles.inputGroup}>
              <MaterialIcons name="person-outline" size={20} color={theme.accent} style={styles.inputIcon} />
              <TextInput
                placeholder="Ad Soyad"
                placeholderTextColor={theme.subtle}
                style={[styles.input, { color: theme.text, borderColor: theme.subtle + "30" }]}
                onChangeText={setFullName}
              />
            </View>

            {/* E-posta */}
            <View style={styles.inputGroup}>
              <MaterialIcons name="alternate-email" size={20} color={theme.accent} style={styles.inputIcon} />
              <TextInput
                placeholder="E-posta Adresi"
                placeholderTextColor={theme.subtle}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, { color: theme.text, borderColor: theme.subtle + "30" }]}
                onChangeText={setEmail}
              />
            </View>

            {/* Doğum Tarihi */}
            <TouchableOpacity 
              style={[styles.inputGroup, styles.datePickerBtn, { borderColor: theme.subtle + "30" }]} 
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialIcons name="cake" size={20} color={theme.accent} style={styles.inputIcon} />
              <Text style={{ color: theme.text, marginLeft: 35 }}>
                Doğum Tarihi: {birthDate.toLocaleDateString('tr-TR')}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={birthDate}
                mode="date"
                onChange={(e, date) => { setShowDatePicker(false); if(date) setBirthDate(date); }}
              />
            )}

            {/* Cinsiyet Seçimi */}
            <Text style={[styles.label, { color: theme.text }]}>Cinsiyet</Text>
            <View style={styles.genderContainer}>
              {['Kadın', 'Erkek', 'Diğer'].map((item) => (
                <TouchableOpacity 
                  key={item}
                  style={[
                    styles.genderOption, 
                    { borderColor: theme.accent + "40" },
                    gender === item && { backgroundColor: theme.accent, borderColor: theme.accent }
                  ]}
                  onPress={() => setGender(item)}
                >
                  <Text style={[styles.genderText, { color: gender === item ? '#fff' : theme.text }]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Şifre */}
            <View style={styles.inputGroup}>
              <MaterialIcons name="lock-outline" size={20} color={theme.accent} style={styles.inputIcon} />
              <TextInput
                placeholder="Şifre (Min. 6 Karakter)"
                placeholderTextColor={theme.subtle}
                secureTextEntry={!showPassword}
                style={[styles.input, { color: theme.text, borderColor: theme.subtle + "30" }]}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={20} color={theme.subtle} />
              </TouchableOpacity>
            </View>

            {/* Şifre Tekrar */}
            <View style={styles.inputGroup}>
              <MaterialIcons name="security" size={20} color={theme.accent} style={styles.inputIcon} />
              <TextInput
                placeholder="Şifreyi Onayla"
                placeholderTextColor={theme.subtle}
                secureTextEntry={!showPassword}
                style={[styles.input, { color: theme.text, borderColor: theme.subtle + "30" }]}
                onChangeText={setConfirmPassword}
              />
            </View>

            {/* Kayıt Butonu */}
            <TouchableOpacity 
                style={[styles.primaryButton, { backgroundColor: theme.accent }]} 
                onPress={handleRegister}
                disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Hemen Başla</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/auth/login")} style={styles.footerLink}>
              <Text style={{ color: theme.subtle }}>
                Hesabın var mı? <Text style={{ color: theme.accent, fontWeight: "bold" }}>Giriş Yap</Text>
              </Text>
            </TouchableOpacity>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 40 },
  headerSection: { alignItems: "center", marginTop: 20, marginBottom: 20 },
  lottie: { width: 160, height: 160 },
  title: { fontSize: 26, fontWeight: "900", marginTop: 10 },
  subtitle: { fontSize: 14, textAlign: "center", marginTop: 5, opacity: 0.7 },
  formCard: { padding: 25, borderRadius: 30, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 8 },
  inputGroup: { flexDirection: "row", alignItems: "center", marginBottom: 15, position: "relative" },
  inputIcon: { position: "absolute", left: 15, zIndex: 1 },
  input: { flex: 1, height: 55, borderWidth: 1, borderRadius: 18, paddingLeft: 45, paddingRight: 45, fontSize: 15 },
  eyeIcon: { position: "absolute", right: 15 },
  datePickerBtn: { height: 55, borderWidth: 1, borderRadius: 18, justifyContent: 'center' },
  label: { fontSize: 15, fontWeight: "700", marginBottom: 10, marginLeft: 5 },
  genderContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  genderOption: { flex: 1, paddingVertical: 12, borderWidth: 1, borderRadius: 15, alignItems: 'center', marginHorizontal: 4 },
  genderText: { fontSize: 13, fontWeight: "600" },
  primaryButton: { height: 55, borderRadius: 18, justifyContent: "center", alignItems: "center", marginTop: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, elevation: 5 },
  primaryButtonText: { color: "#fff", fontSize: 17, fontWeight: "800" },
  footerLink: { marginTop: 20, alignItems: "center" }
});
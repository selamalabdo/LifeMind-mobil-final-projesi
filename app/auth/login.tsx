import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useContext, useState, useRef, useEffect } from "react";
import LottieView from "lottie-react-native";
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
import { auth } from "../../firebaseConfig";
import { ThemeContext } from "../_layout";
import { SafeAreaView } from "react-native-safe-area-context";
export default function Login() {
  const { theme } = useContext(ThemeContext) as any;

  // State Yönetimi
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const handleLogin = async () => {
    Keyboard.dismiss();

    if (!email || !password) {
      Alert.alert("Eksik Bilgi", "Lütfen e-posta ve şifrenizi girin.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setLoading(false);
      router.replace("/(tabs)"); // Başarılı girişte ana sayfaya yönlendir
    } catch (error: any) {
      setLoading(false);
      console.log("Login Error Code:", error.code);

      // Hata Yönetimi - Kullanıcı dostu mesajlar
      let errorTitle = "Giriş Başarısız";
      let errorMessage = "E-posta veya şifre hatalı. Lütfen tekrar deneyin.";

      if (error.code === "auth/user-not-found") {
        errorMessage = "Bu e-posta adresi ile kayıtlı bir kullanıcı bulunamadı.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Girdiğiniz şifre hatalı.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Lütfen geçerli bir e-posta adresi girin.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Çok fazla hatalı deneme yaptınız. Lütfen bir süre bekleyin.";
      }

      Alert.alert(errorTitle, errorMessage);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Header & Lottie Bölümü */}
          <View style={styles.headerSection}>
            <LottieView
              source={require("../../assets/animations/login.json")} // assets/animations/login.json dosyanızın olduğundan emin olun
              autoPlay 
              loop 
              style={styles.lottie}
            />
            <Text style={[styles.title, { color: theme.text }]}>Hoş Geldin!</Text>
            <Text style={[styles.subtitle, { color: theme.subtle }]}>Planlarına kaldığın yerden devam et.</Text>
          </View>

          {/* Giriş Kartı */}
          <Animated.View style={[styles.formCard, { backgroundColor: theme.card, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            
            {/* E-posta Input */}
            <View style={styles.inputGroup}>
              <MaterialIcons name="alternate-email" size={20} color={theme.accent} style={styles.inputIcon} />
              <TextInput
                placeholder="E-posta Adresi"
                placeholderTextColor={theme.subtle}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, { color: theme.text, borderColor: theme.subtle + "30" }]}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Şifre Input */}
            <View style={styles.inputGroup}>
              <MaterialIcons name="lock-outline" size={20} color={theme.accent} style={styles.inputIcon} />
              <TextInput
                placeholder="Şifre"
                placeholderTextColor={theme.subtle}
                secureTextEntry={!showPassword}
                style={[styles.input, { color: theme.text, borderColor: theme.subtle + "30" }]}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={20} color={theme.subtle} />
              </TouchableOpacity>
            </View>

            {/* Şifremi Unuttum */}
            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={{ color: theme.accent, fontWeight: "600", fontSize: 13 }}>Şifremi Unuttum?</Text>
            </TouchableOpacity>

            {/* Giriş Butonu */}
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: theme.accent }]} 
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Giriş Yap</Text>
              )}
            </TouchableOpacity>

            {/* Kayıt Ol Linki */}
            <TouchableOpacity onPress={() => router.push("/auth/register")} style={styles.footerLink}>
              <Text style={{ color: theme.subtle }}>
                Henüz hesabın yok mu? <Text style={{ color: theme.accent, fontWeight: "bold" }}>Hemen Kayıt Ol</Text>
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
  scrollContent: { paddingHorizontal: 25, paddingBottom: 40, flexGrow: 1, justifyContent: "center" },
  headerSection: { alignItems: "center", marginBottom: 30 },
  lottie: { width: 180, height: 180 },
  title: { fontSize: 32, fontWeight: "900", marginTop: 10 },
  subtitle: { fontSize: 15, textAlign: "center", marginTop: 5, opacity: 0.7 },
  formCard: { padding: 25, borderRadius: 30, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 8 },
  inputGroup: { flexDirection: "row", alignItems: "center", marginBottom: 15, position: "relative" },
  inputIcon: { position: "absolute", left: 15, zIndex: 1 },
  input: { flex: 1, height: 55, borderWidth: 1, borderRadius: 18, paddingLeft: 45, paddingRight: 45, fontSize: 15 },
  eyeIcon: { position: "absolute", right: 15 },
  forgotBtn: { alignSelf: "flex-end", marginBottom: 20, marginRight: 5 },
  primaryButton: { height: 55, borderRadius: 18, justifyContent: "center", alignItems: "center", marginTop: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, elevation: 5 },
  primaryButtonText: { color: "#fff", fontSize: 17, fontWeight: "800" },
  footerLink: { marginTop: 25, alignItems: "center" }
});
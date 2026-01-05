import React, { useEffect, useState, useCallback, createContext } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth"; 
import { auth } from "../firebaseConfig"; 
import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

SplashScreen.preventAutoHideAsync();

// Tema Ayarları
export const themeLight = {
  background: "#ffffff",
  text: "#1e1e2e",
  subtle: "#64748b",
  accent: "#6366f1", 
  card: "#f8fafc",
  border: "#e2e8f0",
  error: "#ef4444",
  success: "#22c55e",
  isDark: false,
};

export const themeDark = {
  background: "#0f172a", 
  text: "#f8fafc", 
  subtle: "#94a3b8", 
  accent: "#818cf8", 
  card: "#1e293b", 
  border: "#334155", 
  error: "#f87171",
  success: "#4ade80",
  isDark: true,
};

interface ThemeContextType {
  theme: typeof themeLight;
  toggleTheme: () => void;
}
export const ThemeContext = createContext<ThemeContextType | null>(null);

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
const [isDarkMode, setIsDarkMode] = useState(false);
  
  const theme = isDarkMode ? themeDark : themeLight;
  const router = useRouter();
  const segments = useSegments();

  // 1. Firebase Auth Kontrolü
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, []);

  // 2. İlk Açılış Kontrolü
  useEffect(() => {
    async function checkFirstLaunch() {
      try {
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        if (hasLaunched === null) {
          setIsFirstLaunch(true); 
        } else {
          setIsFirstLaunch(false); 
        }
      } catch (error) {
        setIsFirstLaunch(false);
      }
    }
    checkFirstLaunch();
  }, []);

  // 3. YÖNLENDİRME MANTIĞI (Burayı Düzellttik)
  useEffect(() => {
    if (initializing || isFirstLaunch === null) return;

    const segment = segments[0] as string; 
    // Auth grubunda olup olmadığını kontrol et
    const inAuthGroup = segment === "(auth)" || segment === "auth";
    const inOnboarding = segment === "onboarding";

    if (user) {
      // Kullanıcı giriş yapmışsa ve Login/Onboarding sayfalarındaysa Ana Sayfaya at
      if (inAuthGroup || inOnboarding) {
        router.replace("/(tabs)");
      }
    } else {
      // Kullanıcı giriş YAPMAMIŞSA
      
      // KRİTİK DÜZELTME: Eğer kullanıcı zaten Auth (Login/Register) sayfalarındaysa
      // onu rahat bırak, yönlendirme yapma. Döngüyü kıran satır bu:
      if (inAuthGroup) return;

      if (isFirstLaunch && !inOnboarding) {
        // İlk açılışsa ve onboarding'de değilse -> Onboarding'e gönder
        router.replace("/onboarding");
      } else if (!isFirstLaunch && !inOnboarding) {
        // İlk açılış değilse -> Login'e gönder
        router.replace("/auth/login" as any);
      }
    }
  }, [user, initializing, isFirstLaunch, segments]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const onLayoutRootView = useCallback(async () => {
    if (!initializing && isFirstLaunch !== null) {
      await SplashScreen.hideAsync();
    }
  }, [initializing, isFirstLaunch]);

  if (initializing || isFirstLaunch === null) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <ThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <View style={{ flex: 1, backgroundColor: theme.background }} onLayout={onLayoutRootView}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="auth" /> 
            <Stack.Screen name="onboarding" />
          </Stack>
        </View>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
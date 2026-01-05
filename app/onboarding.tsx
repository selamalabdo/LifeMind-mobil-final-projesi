import React, { useState, useRef, useContext } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  FlatList,
  Animated,
  ViewToken,
} from "react-native";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import { ThemeContext } from "./_layout";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
const { width, height } = Dimensions.get("window");

// Veri yapısı için tip tanımlama
interface OnboardingItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  animation: any;
}

const DATA: OnboardingItem[] = [
  {
    id: "1",
    title: "LifeMind",
    subtitle: "Akıllı Hatırlatıcı ve Yaşam Asistanı",
    description: "Hayatını planla, öğrenmeni güçlendir.",
    animation: require("../assets/animations/brain.json"),
  },
  {
    id: "2",
    title: "Akıllı Görev Yönetimi",
    subtitle: "Alışkanlıklarına göre öneriler sunar",
    description: "Görevlerini planla, lifemind senin için en doğru zamanı hatırlatsın.",
    animation: require("../assets/animations/Clock.json"),
  },
  {
    id: "3",
    title: "Öğren, Takip Et, Dengede Kal",
    subtitle: "Sana özel bir deneyim",
    description: "Ezber modülü,  her zaman yanındayız.",
    animation: require("../assets/animations/task.json"),
  },
];

export default function Onboarding() {

  const context = useContext(ThemeContext) as any;
  const theme = context?.theme;

  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  // Sayfa değişimini yakalayan fonksiyon
  const viewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  // Görünürlük ayarları
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

const scrollTo = async () => { // async yaptık
    if (currentIndex < DATA.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      // Son sayfadaysa:
      try {
        // 1. "Gördüm" bilgisini kaydet
        await AsyncStorage.setItem('hasLaunched', 'true'); 
        // 2. Kayıt ol sayfasına git
        router.replace("/auth/register");
      } catch (error) {
        console.log("Hata:", error);
        router.replace("/auth/register");
      }
    }
  };

  const renderItem = ({ item }: { item: OnboardingItem }) => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.lottieContainer}>
        <LottieView 
          source={item.animation} 
          autoPlay 
          loop 
          style={styles.lottie} 
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme?.accent || "#22c55e" }]}>{item.title}</Text>
        <Text style={[styles.subtitle, { color: theme?.text || "#000" }]}>{item.subtitle}</Text>
        <Text style={[styles.description, { color: theme?.subtle || "#666" }]}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme?.background || "#fff" }]}>
      <View style={{ flex: 3 }}>
        <FlatList
          data={DATA}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
          })}
          scrollEventThrottle={32}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={slidesRef}
        />
      </View>

      <View style={styles.footer}>
        {/* Sayfa Gösterge Noktaları */}
        <View style={styles.indicatorContainer}>
          {DATA.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [10, 20, 10],
              extrapolate: "clamp",
            });
            return (
              <Animated.View 
                key={i} 
                style={[styles.dot, { width: dotWidth, backgroundColor: theme?.accent || "#22c55e" }]} 
              />
            );
          })}
        </View>

        {/* Ana Buton */}
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme?.accent || "#22c55e" }]} 
          onPress={scrollTo}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {currentIndex === DATA.length - 1 ? "Başlayın" : "İleri"}
          </Text>
          <MaterialIcons name="chevron-right" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Giriş Linki */}
        <View style={styles.loginLinkContainer}>
          {currentIndex === DATA.length - 1 ? (
            <TouchableOpacity onPress={() => router.push("/auth/login")}>
              <Text style={[styles.loginLinkText, { color: theme?.subtle || "#666" }]}>
                Zaten hesabım var
              </Text>
            </TouchableOpacity>
          ) : (
             <View style={{ height: 20 }} /> 
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slide: { flex: 1, alignItems: "center", padding: 20 },
  lottieContainer: { flex: 0.6, justifyContent: 'center', alignItems: 'center' },
  lottie: { width: width * 0.75, height: width * 0.75 },
  textContainer: { flex: 0.4, alignItems: "center", paddingHorizontal: 20 },
  title: { fontSize: 32, fontWeight: "900", textAlign: "center" },
  subtitle: { fontSize: 18, fontWeight: "700", marginTop: 10, textAlign: "center" },
  description: { fontSize: 15, textAlign: "center", marginTop: 15, lineHeight: 22 },
  footer: { height: height * 0.25, justifyContent: "space-between", paddingHorizontal: 20, alignItems: "center" },
  indicatorContainer: { flexDirection: "row", height: 40, alignItems: 'center' },
  dot: { height: 10, borderRadius: 5, marginHorizontal: 5 },
  button: {
    width: width * 0.85,
    height: 60,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "800", marginRight: 8 },
  loginLinkContainer: { marginBottom: 30, height: 20 },
  loginLinkText: { fontSize: 14, fontWeight: "600" },
});
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useContext } from "react";
import { ThemeContext } from "../_layout"; 

export default function TabsLayout() {
  const { theme } = useContext(ThemeContext) as any; 

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarStyle: { 
          backgroundColor: theme.card,
          borderTopColor: theme.subtle + "20" 
        },
        tabBarIcon: ({ color, size }) => {
          let icon: any = "home";
          if (route.name === "index") icon = "home";
          else if (route.name === "tasks") icon = "list";
          else if (route.name === "learning") icon = "school"; 
          else if (route.name === "calendar") icon = "calendar";
          else if (route.name === "settings") icon = "settings";
          
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="tasks" options={{ title: "Görevler" }} />
      {/* Sadece bu satırı ekledik */}
      <Tabs.Screen name="learning" options={{ title: "Öğren" }} /> 
      <Tabs.Screen name="calendar" options={{ title: "Takvim" }} />
      <Tabs.Screen name="settings" options={{ title: "Ayarlar" }} />
    </Tabs>
  );
}
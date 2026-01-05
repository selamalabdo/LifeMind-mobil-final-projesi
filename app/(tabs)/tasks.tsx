import React, { useState, useEffect, useContext } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Modal, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from "react-native";
import { db, auth } from "../../firebaseConfig";
import { ThemeContext } from "../_layout";
import { addTask, getTasks, deleteTask, toggleTaskCompletion } from "../../services/taskService";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

interface Task {
  id: string;
  title: string;
  category: string;
  date: string;
  completed: boolean;
}

export default function TasksScreen() {
  const { theme } = useContext(ThemeContext) as any;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Yeni Görev Formu
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Genel");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await getTasks();
      setTasks(data as Task[]);
    } catch (error) {
      console.error("Görevler yüklenirken hata:", error);
    }
    setLoading(false);
  };

  const handleAddTask = async () => {
    if (!title.trim()) {
      Alert.alert("Hata", "Lütfen bir görev başlığı girin.");
      return;
    }
    await addTask(title, category, selectedDate);
    setTitle("");
    setModalVisible(false);
    fetchTasks();
  };

  const handleDelete = (id: string) => {
    Alert.alert("Görevi Sil", "Bu görevi silmek istediğinize emin misiniz?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: async () => {
          await deleteTask(id);
          fetchTasks();
      }},
    ]);
  };

  const handleToggle = async (id: string, status: boolean) => {
    await toggleTaskCompletion(id, status);
    fetchTasks();
  };

  // GÜNCELLENEN VE HATA KONTROLÜ EKLENEN FONKSİYON
  const getStatusInfo = (dateStr: string | undefined, completed: boolean) => {
    if (completed) return { label: "Tamamlandı", color: "#22c55e", icon: "check-circle" };
    
    // Eğer tarih yoksa veya geçersizse varsayılan bir değer dön
    if (!dateStr) return { label: "Tarihsiz", color: theme.subtle, icon: "calendar" };

    try {
      const date = parseISO(dateStr);
      // parseISO başarısız olursa invalid date döner, bunu kontrol etmeliyiz
      if (isNaN(date.getTime())) {
        return { label: "Geçersiz Tarih", color: "#ef4444", icon: "alert-circle" };
      }

      if (isPast(date) && !isToday(date)) return { label: "Gecikmiş", color: "#ef4444", icon: "alert-circle" };
      if (isToday(date)) return { label: "Bugün", color: "#3b82f6", icon: "clock" };
      if (isTomorrow(date)) return { label: "Yarın", color: "#f59e0b", icon: "calendar" };
      
      return { label: format(date, "d MMM", { locale: tr }), color: theme.subtle, icon: "calendar" };
    } catch (error) {
      return { label: "Hata", color: "#ef4444", icon: "alert-circle" };
    }
  };

  const renderItem = ({ item }: { item: Task }) => {
    const status = getStatusInfo(item.date, item.completed);

    return (
      <View style={[styles.taskCard, { backgroundColor: theme.card }]}>
        <TouchableOpacity 
          style={styles.checkArea} 
          onPress={() => handleToggle(item.id, item.completed)}
        >
          <Ionicons 
            name={item.completed ? "checkbox" : "square-outline"} 
            size={26} 
            color={item.completed ? "#22c55e" : theme.accent} 
          />
        </TouchableOpacity>

        <View style={styles.contentArea}>
          <Text style={[styles.taskTitle, { color: theme.text, textDecorationLine: item.completed ? 'line-through' : 'none' }]}>
            {item.title}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.badge, { backgroundColor: status.color + "20" }]}>
              <MaterialCommunityIcons name={status.icon as any} size={12} color={status.color} />
              <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
            </View>
            <Text style={[styles.categoryText, { color: theme.subtle }]}>• {item.category}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Feather name="trash-2" size={20} color="#ef4444" style={{ marginLeft: 10 }} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Planner</Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: theme.accent }]}
          onPress={() => setModalVisible(true)}
        >
          <Feather name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: theme.subtle, marginTop: 50 }}>Henüz bir görev eklenmemiş.</Text>
          }
        />
      )}

      {/* GÖREV EKLEME MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Yeni Görev</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.subtle + "40" }]}
              placeholder="Görev adı..."
              placeholderTextColor={theme.subtle}
              value={title}
              onChangeText={setTitle}
            />

            <View style={styles.datePickerContainer}>
               <Text style={{color: theme.text, marginBottom: 10, fontWeight: '600'}}>Tarih Seçin:</Text>
               <View style={styles.dateRow}>
                  {["Bugün", "Yarın"].map((day) => {
                    const dateVal = day === "Bugün" 
                      ? new Date().toISOString().split('T')[0] 
                      : new Date(Date.now() + 86400000).toISOString().split('T')[0];
                    return (
                      <TouchableOpacity 
                        key={day}
                        style={[styles.dateChip, { backgroundColor: selectedDate === dateVal ? theme.accent : theme.background }]}
                        onPress={() => setSelectedDate(dateVal)}
                      >
                        <Text style={{ color: selectedDate === dateVal ? "#fff" : theme.text }}>{day}</Text>
                      </TouchableOpacity>
                    );
                  })}
               </View>
            </View>

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.accent }]} onPress={handleAddTask}>
              <Text style={styles.saveButtonText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: "center", marginBottom: 30 },
  headerTitle: { fontSize: 28, fontWeight: "800" },
  addButton: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  
  taskCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12, elevation: 2 },
  checkArea: { marginRight: 15 },
  contentArea: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 10 },
  badgeText: { fontSize: 11, fontWeight: 'bold', marginLeft: 4 },
  categoryText: { fontSize: 12 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { padding: 30, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  input: { borderWidth: 1, borderRadius: 15, padding: 15, fontSize: 16, marginBottom: 20 },
  datePickerContainer: { marginBottom: 25 },
  dateRow: { flexDirection: 'row' },
  dateChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginRight: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  saveButton: { padding: 18, borderRadius: 15, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});
import React, { useContext, useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { ThemeContext } from "../_layout";
import { MaterialIcons, Ionicons, Feather, AntDesign } from "@expo/vector-icons";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { addTask, deleteTask, toggleTaskCompletion } from "../../services/taskService";

LocaleConfig.locales['tr'] = {
  monthNames: ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'],
  monthNamesShort: ['Oca.','Şub.','Mar.','Nis.','May.','Haz.','Tem.','Ağu.','Eyl.','Eki.','Kas.','Ara.'],
  dayNames: ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'],
  dayNamesShort: ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'],
  today: 'Bugün'
};
LocaleConfig.defaultLocale = 'tr';

export default function CalendarScreen() {
  const { theme } = useContext(ThemeContext) as any;
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  
 
  const [modalVisible, setModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const loadTasks = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, "tasks"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTasks(list);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTasks(); }, []);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      await addTask(newTaskTitle, "Genel", selectedDate);
      setNewTaskTitle("");
      setModalVisible(false);
      loadTasks(); 
    } catch (error) {
      Alert.alert("Hata", "Görev eklenemedi.");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Sil", "Bu görevi silmek istediğine emin misin?", [
      { text: "İptal", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: async () => {
          await deleteTask(id);
          loadTasks();
      }}
    ]);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    await toggleTaskCompletion(id, currentStatus);
    loadTasks();
  };

  const marked: any = {};
  tasks.forEach((t) => {
    if (t.date) {
      marked[t.date] = {
        marked: true,
        dotColor: theme.accent,
        selected: selectedDate === t.date,
        selectedColor: theme.accent,
      };
    }
  });

  const tasksForSelectedDay = tasks.filter((t) => t.date === selectedDate);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.headerTitle, { color: theme.text }]}>Takvim</Text>
      
      <Calendar
        markedDates={marked}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        theme={{
          calendarBackground: theme.card,
          dayTextColor: theme.text,
          monthTextColor: theme.text,
          todayTextColor: theme.accent,
          selectedDayBackgroundColor: theme.accent,
          arrowColor: theme.accent,
        }}
        style={styles.calendar}
      />

      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Feather name="list" size={20} color={theme.accent} />
          <Text style={[styles.sectionHeaderText, { color: theme.text }]}>Planlar</Text>
        </View>
        
        {/* EKLEME BUTONU */}
        <TouchableOpacity 
          onPress={() => setModalVisible(true)}
          style={[styles.addButton, { backgroundColor: theme.accent }]}
        >
          <AntDesign name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.accent} />
      ) : (
        <FlatList
          data={tasksForSelectedDay}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => (
            <View style={[styles.taskBox, { backgroundColor: theme.card, borderColor: theme.accent + '20' }]}>
              <TouchableOpacity onPress={() => handleToggle(item.id, item.completed)} style={styles.checkArea}>
                <Ionicons 
                  name={item.completed ? "checkmark-circle" : "ellipse-outline"} 
                  size={24} 
                  color={item.completed ? "#22c55e" : theme.subtle} 
                />
              </TouchableOpacity>
              
              <View style={{ flex: 1 }}>
                <Text style={[styles.taskTitle, { color: theme.text, textDecorationLine: item.completed ? 'line-through' : 'none' }]}>
                  {item.title}
                </Text>
              </View>

              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Feather name="trash-2" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* YENİ GÖREV EKLEME MODALI */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedDate} İçin Yeni Görev</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.accent + '40' }]}
              placeholder="Görev adı..."
              placeholderTextColor={theme.subtle}
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: theme.subtle + '20' }]} onPress={() => setModalVisible(false)}>
                <Text style={{ color: theme.text }}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: theme.accent }]} onPress={handleAddTask}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60 },
  headerTitle: { fontSize: 28, fontWeight: "900", marginBottom: 20 },
  calendar: { borderRadius: 20, overflow: "hidden", marginBottom: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: 'space-between', marginBottom: 15 },
  sectionHeaderText: { fontSize: 18, fontWeight: "800" },
  addButton: { width: 35, height: 35, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  taskBox: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 18, borderWidth: 1, marginBottom: 10 },
  checkArea: { marginRight: 12 },
  taskTitle: { fontSize: 15, fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { padding: 25, borderRadius: 25, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15 },
  input: { width: '100%', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 20 },
  btn: { flex: 1, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }
});
import { db, auth } from "../firebaseConfig";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc,
  orderBy 
} from "firebase/firestore";


export const addTask = async (title: string, category: string, date: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Kullanıcı oturumu bulunamadı");
  
  return await addDoc(collection(db, "tasks"), {
    userId: user.uid,
    title,
    category,
    date, 
    completed: false,
    createdAt: new Date().toISOString()
  });
};


export const getTasks = async () => {
  const user = auth.currentUser;
  if (!user) return [];
  
  const q = query(
    collection(db, "tasks"), 
    where("userId", "==", user.uid),
    orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};


export const toggleTaskCompletion = async (taskId: string, currentStatus: boolean) => {
  const taskRef = doc(db, "tasks", taskId);
  return await updateDoc(taskRef, {
    completed: !currentStatus
  });
};


export const deleteTask = async (taskId: string) => {
  const taskRef = doc(db, "tasks", taskId);
  return await deleteDoc(taskRef);
};


export const getTodayTasks = async () => {
  const user = auth.currentUser;
  if (!user) return [];
  
  const today = new Date().toISOString().split('T')[0]; // Örn: "2024-05-20"
  
  const q = query(
    collection(db, "tasks"), 
    where("userId", "==", user.uid),
    where("date", "==", today),
    where("completed", "==", false) 
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
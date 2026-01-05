
import { db, auth } from "../firebaseConfig";
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc, orderBy } from "firebase/firestore";

export const addCategory = async (name: string, icon: string, color: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Kullanıcı oturumu bulunamadı.");
  return await addDoc(collection(db, "learningCategories"), {
    userId: user.uid,
    name,
    icon,
    color,
    createdAt: new Date().toISOString()
  });
};

export const getCategories = async () => {
  const user = auth.currentUser;
  if (!user) return [];
  const q = query(collection(db, "learningCategories"), where("userId", "==", user.uid), orderBy("createdAt", "asc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// --- Kelime/Terim Kartı İşlemleri ---
export const addFlashcard = async (categoryId: string, term: string, definition: string, aiGenerated?: boolean) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Kullanıcı oturumu bulunamadı.");
  return await addDoc(collection(db, "flashcards"), {
    userId: user.uid,
    categoryId,
    term,
    definition,
    aiGenerated: aiGenerated || false,
    correctAttempts: 0,
    wrongAttempts: 0,
    createdAt: new Date().toISOString()
  });
};

export const getFlashcardsByCategory = async (categoryId: string) => {
  const user = auth.currentUser;
  if (!user) return [];
  const q = query(collection(db, "flashcards"), where("userId", "==", user.uid), where("categoryId", "==", categoryId), orderBy("createdAt", "asc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};


export const updateFlashcardStats = async (cardId: string, isCorrect: boolean) => {
  const cardRef = doc(db, "flashcards", cardId);
  const dataToUpdate = isCorrect ? { correctAttempts: (await getDocs(query(collection(db, "flashcards"), where("id", "==", cardId)))).docs[0]?.data().correctAttempts + 1 } : { wrongAttempts: (await getDocs(query(collection(db, "flashcards"), where("id", "==", cardId)))).docs[0]?.data().wrongAttempts + 1 };
  return await updateDoc(cardRef, dataToUpdate);
};



export const deleteCategory = async (categoryId: string) => {
  try {
    const categoryRef = doc(db, "learningCategories", categoryId);
    await deleteDoc(categoryRef);
    // Not: Gerçek bir uygulamada bu kategoriye ait tüm kartları da silmek iyi olur
    return true;
  } catch (error) {
    console.error("Kategori silme hatası:", error);
    return false;
  }
};
// Tüm kelimeleri getir
export const getAllFlashcards = async () => {
  const user = auth.currentUser;
  if (!user) return [];
  const q = query(collection(db, "flashcards"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Kelimeyi sil
export const deleteFlashcard = async (cardId: string) => {
  const cardRef = doc(db, "flashcards", cardId);
  await deleteDoc(cardRef);
};
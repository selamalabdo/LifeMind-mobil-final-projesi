import { db, auth } from "../firebaseConfig";
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc, 
  increment, 
  query, 
  where 
} from "firebase/firestore";


interface QuizQuestion {
  question: string;
  correctAnswer: string;
  options: string[];
}


export const generateQuiz = async (): Promise<QuizQuestion[] | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  try {

    const q = query(collection(db, "flashcards"), where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);
    
 
    const allCards = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as any[];


    if (allCards.length < 4) {
      throw new Error("Düzgün bir test oluşturabilmek için en az 4 farklı kelime kaydetmiş olmalısın.");
    }

    const selectedCards = allCards.sort(() => 0.5 - Math.random()).slice(0, 10);


    const quizData = selectedCards.map((card) => {
      const correctAnswer = card.definition;


      const otherDefinitions = allCards
        .filter(c => c.id !== card.id)
        .map(c => c.definition);


      const distractors = otherDefinitions
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);


      const options = [...distractors, correctAnswer].sort(() => 0.5 - Math.random());

      return {
        question: card.term,
        correctAnswer: correctAnswer,
        options: options
      };
    });

    return quizData;
  } catch (error) {
    console.error("Quiz üretim hatası:", error);

    throw error;
  }
};


export const finishQuiz = async (correctCount: number) => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    const today = new Date().toISOString().split('T')[0]; 

    let newStreak = 1;
    const earnedPoints = correctCount * 10; 

    if (userDoc.exists()) {
      const data = userDoc.data();
      const lastQuizDate = data.lastQuizDate;
      const currentStreak = data.streak || 0;
      
      if (lastQuizDate === today) {

        newStreak = currentStreak || 1;
      } else {

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastQuizDate === yesterdayStr) {

          newStreak = currentStreak + 1;
        } else {

          newStreak = 1;
        }
      }
    }


    await setDoc(userRef, {
      points: increment(earnedPoints),
      streak: newStreak,
      lastQuizDate: today,
      updatedAt: new Date().toISOString()
    }, { merge: true });

  } catch (error) {
    console.error("Puan kaydetme hatası:", error);
  }
};
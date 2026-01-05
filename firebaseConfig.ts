import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// burda benim oluşturdugum Firebase bilgileri burda eklenmleli  ben ekledim ve denedim veritabanı hatasız bir şekilde çalışıyor hocam
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

// Firebase'i başlat
export const app = initializeApp(firebaseConfig);

// Firestore Database'i dışa aktar (Veri kaydetmek için)
export const db = getFirestore(app);

// Authentication'ı dışa aktar (Giriş/Kayıt için)
export const auth = getAuth(app);
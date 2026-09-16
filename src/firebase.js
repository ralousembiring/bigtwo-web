import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCyS8jUzge4eeigS7PpHZ735_nT35Fvh6c",
  authDomain: "big-two-8948c.firebaseapp.com",
  databaseURL: "https://big-two-8948c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "big-two-8948c",
  storageBucket: "big-two-8948c.firebasestorage.app",
  messagingSenderId: "283826869645",
  appId: "1:283826869645:web:fffc92117a5a5d9de959c4",
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
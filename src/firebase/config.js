import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD4Go_4BHnTJvayufHXMQYMGv_kvmfZE1g",
  authDomain: "react-projects-46390.firebaseapp.com",
  projectId: "react-projects-46390",
  storageBucket: "react-projects-46390.firebasestorage.app",
  messagingSenderId: "316973810774",
  appId: "1:316973810774:web:d079e1314eb66af1e167f7",
  measurementId: "G-GRB2ZCFQ4C"
  
  
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

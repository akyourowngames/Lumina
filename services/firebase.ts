import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC_TM0iaW9bFkU7mzsJ9jSE2Acywz-YWF0",
  authDomain: "lumina-b2db8.firebaseapp.com",
  projectId: "lumina-b2db8",
  storageBucket: "lumina-b2db8.firebasestorage.app",
  messagingSenderId: "574948419040",
  appId: "1:574948419040:web:08e0c469c1c4c48ff1f785",
  measurementId: "G-7B0BHZH5RB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const firestore = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, analytics, firestore, storage };
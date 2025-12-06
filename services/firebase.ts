import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";
import "firebase/compat/analytics";

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
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const firestore = firebase.firestore();
const storage = firebase.storage();
const analytics = firebase.analytics();
const googleProvider = new firebase.auth.GoogleAuthProvider();
// Helper for server timestamp
const timestamp = firebase.firestore.FieldValue.serverTimestamp;

export { auth, googleProvider, analytics, firestore, storage, timestamp };
export default firebase;
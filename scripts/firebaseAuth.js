import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyD07yCJKNC8a_wZYzYwcmu_IDPFO9H5opM",
    authDomain: "daily-tools-a8e92.firebaseapp.com",
    projectId: "daily-tools-a8e92",
    storageBucket: "daily-tools-a8e92.firebasestorage.app",
    messagingSenderId: "1080811919260",
    appId: "1:1080811919260:web:90de4d8c1b394b3e2f9a59",
    measurementId: "G-8Y8W8VL0D8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export function googleLogin() {
  return signInWithPopup(auth, provider);
}
export function logout() {
  return signOut(auth);
}
export function onAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// ✅ Expose to global scope so inline onclicks work
window.googleLogin = googleLogin;
window.logout = logout;





import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { auth, db } from './firebaseAuth.js';

export async function saveCountdown(data) {
  const user = auth.currentUser;
  if (!user) {
    console.error("User not logged in");
    return;
  }

  const countdownRef = collection(db, "users", user.uid, "countdowns");

  const countdownData = {
    ...data,
    uid: user.uid,
    createdAt: serverTimestamp()
  };

  try {
    const docRef = await addDoc(countdownRef, countdownData);
    console.log("✅ Countdown saved with ID:", docRef.id);
  } catch (error) {
    console.error("❌ Error saving countdown:", error);
  }
}

export async function loadCountdowns() {
    const user = auth.currentUser;
    if (!user) {
      console.warn("User not logged in — cannot load countdowns.");
      return [];
    }
  
    const countdownRef = collection(db, "users", user.uid, "countdowns");
  
    try {
      const snapshot = await getDocs(countdownRef);
      const result = [];
  
      snapshot.forEach(doc => {
        const data = doc.data();
        result.push({
          ...data,
          id: doc.id // Include Firestore document ID
        });
      });      
  
      return result;
    } catch (error) {
      console.error("Error loading countdowns:", error);
      return [];
    }
  }

  export async function deleteCountdownById(docId) {
    const user = auth.currentUser;
    if (!user) {
      console.warn("Cannot delete — user not logged in.");
      return;
    }
  
    const docRef = doc(db, "users", user.uid, "countdowns", docId);
  
    try {
      await deleteDoc(docRef);
      console.log("🗑️ Countdown deleted:", docId);
    } catch (error) {
      console.error("❌ Error deleting countdown:", error);
    }
  }
  

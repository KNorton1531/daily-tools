import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { auth, db } from './firebaseAuth.js';

// Add a countdown (requires login)
export async function saveCountdown(data) {
  const user = auth.currentUser;
  if (!user) {
    console.error("User not logged in");
    return;
  }

  const countdownRef = collection(db, "countdowns");
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

// Load all countdowns (public)
export async function loadCountdowns() {
  const countdownRef = collection(db, "countdowns");
  try {
    const snapshot = await getDocs(countdownRef);
    const result = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      result.push({
        ...data,
        id: doc.id
      });
    });
    return result;
  } catch (error) {
    console.error("Error loading countdowns:", error);
    return [];
  }
}


// Delete a countdown (requires login)
export async function deleteCountdownById(docId) {
  const user = auth.currentUser;
  if (!user) {
    console.warn("Cannot delete — user not logged in.");
    return;
  }

  const docRef = doc(db, "countdowns", docId);

  try {
    await deleteDoc(docRef);
    console.log("🗑️ Countdown deleted:", docId);
  } catch (error) {
    console.error("❌ Error deleting countdown:", error);
  }
}

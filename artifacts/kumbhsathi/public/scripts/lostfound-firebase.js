import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC2EforYq6_MMuhDy2OLTyD-Agtknau8pc",
  authDomain: "kumbhsathi.firebaseapp.com",
  projectId: "kumbhsathi",
  storageBucket: "kumbhsathi.firebasestorage.app",
  messagingSenderId: "315391398454",
  appId: "1:315391398454:web:8710cb44bc17541210be97"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.submitFirebaseReport = async function(report) {
  try {
    await addDoc(collection(db, "lostfound"), {
      ...report,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("[KumbhSathi] Firestore write failed:", err);
    throw err;
  }
};

window.subscribeToReports = function(callback) {
  const q = query(collection(db, "lostfound"), orderBy("createdAt", "desc"));
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const reports = snapshot.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() }));
      callback(reports);
    },
    (err) => {
      console.error("[KumbhSathi] Firestore listener error:", err);
      callback([]);
    }
  );
  return unsubscribe;
};

// Firebase Config
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

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

// Submit Lost/Found Report
window.submitReport = async function(formData) {
  try {
    await addDoc(collection(db, "lostfound"), {
      ...formData,
      timestamp: new Date().toISOString(),
      status: "active"
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

// Load All Reports
window.loadReports = async function() {
  try {
    const q = query(collection(db, "lostfound"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    return [];
  }
};

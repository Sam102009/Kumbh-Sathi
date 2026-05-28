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

// Submit report to Firebase
window.submitFirebaseReport = async function(report) {
  try {
    await addDoc(collection(db, "lostfound"), report);
    return true;
  } catch(e) {
    console.error(e);
    return false;
  }
};

// Load reports from Firebase
window.loadFirebaseReports = async function() {
  try {
    const q = query(collection(db, "lostfound"), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch(e) {
    console.error(e);
    return [];
  }
};

// Auto-load reports when page opens
window.addEventListener('load', async () => {
  const container = document.getElementById('reports-container');
  if (!container) return;
  container.innerHTML = '<p style="text-align:center;padding:20px;">Loading...</p>';
  const reports = await window.loadFirebaseReports();
  if (!reports.length) {
    container.innerHTML = '<div class="empty-state"><p>Koi report nahi mili</p></div>';
    return;
  }
  container.innerHTML = reports.map(r => `
    <div class="card" style="padding:14px;margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;">
        <span class="badge ${r.type === 'lost' ? 'badge-red' : 'badge-green'}">${r.type === 'lost' ? '🔴 LOST' : '🟢 FOUND'}</span>
        <span style="font-size:11px;color:#999;">${r.timestamp}</span>
      </div>
      <div style="font-weight:700;margin-top:8px;">${r.name}</div>
      <div style="font-size:12px;color:#666;">Age: ${r.age} | ${r.gender}</div>
      <div style="font-size:12px;color:#666;">Last seen: ${r.location}</div>
      <div style="font-size:12px;margin-top:4px;">${r.desc}</div>
      <a href="https://wa.me/${r.contact}" style="display:inline-block;margin-top:8px;background:#25D366;color:white;padding:6px 12px;border-radius:6px;font-size:12px;">📞 Contact</a>
    </div>
  `).join('');
});

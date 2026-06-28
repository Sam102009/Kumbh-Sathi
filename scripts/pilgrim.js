
const PILGRIM_GAS_URL = 'https://script.google.com/macros/s/AKfycbyp_E-2tqiBfAtswJIxIeeq2iH6gwMjjlPZwlxxijqU6RdfZW8UOlcM83Gd9Yay7ZbufQ/exec';

function switchPilgrimTab(tab) {
  const registerTab = document.getElementById('pilgrim-register-tab');
  const listTab = document.getElementById('pilgrim-list-tab');
  const btnRegister = document.getElementById('pilgrim-tab-register');
  const btnList = document.getElementById('pilgrim-tab-list');
  if (tab === 'register') {
    registerTab.style.display = 'block';
    listTab.style.display = 'none';
    btnRegister.style.color = 'var(--saffron)';
    btnRegister.style.borderBottom = '3px solid var(--saffron)';
    btnList.style.color = 'var(--light-brown)';
    btnList.style.borderBottom = 'none';
  } else {
    registerTab.style.display = 'none';
    listTab.style.display = 'block';
    btnList.style.color = 'var(--saffron)';
    btnList.style.borderBottom = '3px solid var(--saffron)';
    btnRegister.style.color = 'var(--light-brown)';
    btnRegister.style.borderBottom = 'none';
    loadPilgrimList();
  }
}

function generatePilgrimId() {
  return 'KS' + Date.now() + Math.floor(1000 + Math.random() * 9000);
}

function submitPilgrimRegistration() {
  const name = document.getElementById('p-name').value.trim();
  const age = document.getElementById('p-age').value.trim();
  const gender = document.getElementById('p-gender').value;
  const city = document.getElementById('p-city').value.trim();
  const contact1 = document.getElementById('p-contact1').value.trim();
  const contact2 = document.getElementById('p-contact2').value.trim();
  const medical = document.getElementById('p-medical').value.trim();
  const photoFile = document.getElementById('p-photo').files[0];

  if (!name || !age || !city || !contact1) {
    alert('कृपया सभी आवश्यक फ़ील्ड भरें (नाम, आयु, शहर, संपर्क)');
    return;
  }

  const btn = document.getElementById('pilgrim-submit-btn');
  btn.disabled = true;
  btn.innerHTML = '⏳ कार्ड बन रहा है...';

  const processAndSubmit = (photoBase64) => {
    const pilgrimId = generatePilgrimId();
    const timestamp = new Date().toISOString();
    const pilgrimData = { action: 'registerPilgrim', id: pilgrimId, name, age, gender, city, contact1, contact2, medical, photo: photoBase64 || '', timestamp };

    fetch(PILGRIM_GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pilgrimData)
    })
    .then(r => r.json())
    .then(() => {
      savePilgrimLocally({ id: pilgrimId, name, age, gender, city, contact1, contact2, medical, photo: photoBase64 || '', timestamp });
      showQRCard({ id: pilgrimId, name, age, gender, city, contact1, contact2, medical, photo: photoBase64 || '' });
      btn.disabled = false;
      btn.innerHTML = '🪪 QR कार्ड बनाएं';
    })
    .catch(() => {
      const pilgrimId2 = generatePilgrimId();
      savePilgrimLocally({ id: pilgrimId2, name, age, gender, city, contact1, contact2, medical, photo: photoBase64 || '', timestamp });
      showQRCard({ id: pilgrimId2, name, age, gender, city, contact1, contact2, medical, photo: photoBase64 || '' });
      btn.disabled = false;
      btn.innerHTML = '🪪 QR कार्ड बनाएं';
    });
  };

  if (photoFile) {
    const reader = new FileReader();
    reader.onload = (e) => processAndSubmit(e.target.result);
    reader.readAsDataURL(photoFile);
  } else {
    processAndSubmit('');
  }
}

function showQRCard(pilgrim) {
  const output = document.getElementById('pilgrim-qr-output');
  const appUrl = 'https://Sam102009.github.io/Kumbh-Sathi/#pilgrim?id=' + pilgrim.id;

  output.style.display = 'block';
  output.innerHTML = \`
    <div id="qr-card-printable" style="background:#fff;border-radius:16px;padding:20px;box-shadow:0 4px 20px rgba(0,0,0,0.15);border:2px solid var(--saffron);">
      <div style="text-align:center;margin-bottom:12px;">
        <div style="font-size:18px;font-weight:800;color:var(--saffron);">🙏 KumbhSathi</div>
        <div style="font-size:11px;color:var(--light-brown);">Kumbh Mela Nashik 2027 — Pilgrim ID Card</div>
      </div>
      <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:12px;">
        \${pilgrim.photo ? \`<img src="\${pilgrim.photo}" style="width:70px;height:70px;border-radius:8px;object-fit:cover;border:2px solid var(--saffron);">\` : '<div style="width:70px;height:70px;border-radius:8px;background:#f5f0e8;border:2px dashed #ccc;display:flex;align-items:center;justify-content:center;font-size:24px;">👤</div>'}
        <div style="flex:1;">
          <div style="font-size:18px;font-weight:800;color:var(--dark-brown);">\${pilgrim.name}</div>
          <div style="font-size:13px;color:var(--light-brown);">आयु: \${pilgrim.age} | \${pilgrim.gender}</div>
          <div style="font-size:13px;color:var(--light-brown);">🏠 \${pilgrim.city}</div>
          \${pilgrim.medical ? \`<div style="font-size:11px;color:#c62828;margin-top:4px;">🏥 \${pilgrim.medical}</div>\` : ''}
        </div>
      </div>
      <div style="text-align:center;margin-bottom:12px;">
        <div id="qr-code-container" style="display:inline-block;padding:8px;background:#fff;border:1px solid #eee;border-radius:8px;"></div>
        <div style="font-size:10px;color:var(--light-brown);margin-top:4px;">ID: \${pilgrim.id}</div>
      </div>
      <div style="background:#fff3e0;border-radius:8px;padding:10px;margin-bottom:12px;">
        <div style="font-size:12px;font-weight:700;color:var(--dark-brown);margin-bottom:6px;">📞 आपातकालीन संपर्क</div>
        <div style="font-size:14px;font-weight:700;color:var(--saffron);">📱 \${pilgrim.contact1}</div>
        \${pilgrim.contact2 ? \`<div style="font-size:13px;color:var(--light-brown);">📱 \${pilgrim.contact2}</div>\` : ''}
      </div>
      <div style="text-align:center;font-size:10px;color:var(--light-brown);margin-bottom:14px;">
        QR कोड स्कैन करें और परिवार से संपर्क करें
      </div>
      <div style="display:flex;gap:8px;">
        <button onclick="window.print()" style="flex:1;padding:12px;background:var(--saffron);color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;">🖨️ Print</button>
        <button onclick="registerAnotherPilgrim()" style="flex:1;padding:12px;background:#f5f0e8;color:var(--dark-brown);border:none;border-radius:8px;font-weight:700;cursor:pointer;">➕ नया यात्री</button>
      </div>
    </div>
  \`;

  setTimeout(() => {
    const qrContainer = document.getElementById('qr-code-container');
    if (qrContainer && typeof QRCode !== 'undefined') {
      new QRCode(qrContainer, { text: appUrl, width: 160, height: 160, colorDark: '#3E1F0D', colorLight: '#ffffff' });
    }
  }, 100);

  output.scrollIntoView({ behavior: 'smooth' });
}

function registerAnotherPilgrim() {
  document.getElementById('p-name').value = '';
  document.getElementById('p-age').value = '';
  document.getElementById('p-city').value = '';
  document.getElementById('p-contact1').value = '';
  document.getElementById('p-contact2').value = '';
  document.getElementById('p-medical').value = '';
  document.getElementById('p-photo').value = '';
  document.getElementById('pilgrim-qr-output').style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function savePilgrimLocally(pilgrim) {
  const existing = JSON.parse(localStorage.getItem('kumbh_pilgrims') || '[]');
  existing.unshift(pilgrim);
  localStorage.setItem('kumbh_pilgrims', JSON.stringify(existing));
}

function loadPilgrimList() {
  const container = document.getElementById('pilgrim-list-container');
  const pilgrims = JSON.parse(localStorage.getItem('kumbh_pilgrims') || '[]');
  if (!pilgrims.length) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--light-brown);"><i class="fa-solid fa-id-card" style="font-size:40px;opacity:0.3;"></i><p style="margin-top:12px;">कोई पंजीकृत यात्री नहीं</p></div>';
    return;
  }
  container.innerHTML = pilgrims.map((p, i) => \`
    <div style="background:#fff;border-radius:12px;padding:14px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);display:flex;align-items:center;gap:12px;">
      \${p.photo ? \`<img src="\${p.photo}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;border:2px solid var(--saffron);">\` : '<div style="width:50px;height:50px;border-radius:50%;background:#f5f0e8;display:flex;align-items:center;justify-content:center;font-size:20px;">👤</div>'}
      <div style="flex:1;">
        <div style="font-weight:700;color:var(--dark-brown);">\${p.name}</div>
        <div style="font-size:12px;color:var(--light-brown);">आयु \${p.age} | \${p.city}</div>
        <div style="font-size:10px;color:var(--light-brown);">ID: \${p.id}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        <button onclick="showQRCard(\${JSON.stringify(p).replace(/"/g, '&quot;')})" style="padding:6px 10px;background:var(--saffron);color:#fff;border:none;border-radius:6px;font-size:11px;cursor:pointer;">QR देखें</button>
        <button onclick="deletePilgrim(\${i})" style="padding:6px 10px;background:#ffebee;color:#c62828;border:none;border-radius:6px;font-size:11px;cursor:pointer;">हटाएं</button>
      </div>
    </div>
  \`).join('');
}

function deletePilgrim(index) {
  if (!confirm('इस यात्री को हटाएं?')) return;
  const pilgrims = JSON.parse(localStorage.getItem('kumbh_pilgrims') || '[]');
  pilgrims.splice(index, 1);
  localStorage.setItem('kumbh_pilgrims', JSON.stringify(pilgrims));
  loadPilgrimList();
}

function initPilgrim() {
  loadPilgrimList();
  const hash = window.location.hash;
  if (hash.includes('pilgrim?id=')) {
    const id = hash.split('id=')[1];
    if (id) fetchPilgrimById(id);
  }
}

function fetchPilgrimById(id) {
  const output = document.getElementById('pilgrim-qr-output');
  const local = JSON.parse(localStorage.getItem('kumbh_pilgrims') || '[]');
  const found = local.find(p => p.id === id);
  if (found) { showPilgrimDetails(found); return; }
  fetch(PILGRIM_GAS_URL + '?sheet=Pilgrims&id=' + id)
    .then(r => r.json())
    .then(data => { if (data && !data.error) showPilgrimDetails(data); })
    .catch(() => {});
}

function showPilgrimDetails(p) {
  const output = document.getElementById('pilgrim-qr-output');
  if (!output) return;
  output.style.display = 'block';
  output.innerHTML = \`
    <div style="background:#fff3e0;border-radius:16px;padding:20px;border:3px solid var(--saffron);text-align:center;">
      <div style="font-size:24px;margin-bottom:8px;">🚨</div>
      <div style="font-size:16px;font-weight:800;color:#c62828;margin-bottom:12px;">यह व्यक्ति खो गया हो सकता है</div>
      \${p.photo ? \`<img src="\${p.photo}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--saffron);margin-bottom:12px;">\` : ''}
      <div style="font-size:20px;font-weight:800;color:var(--dark-brown);">\${p.name}</div>
      <div style="font-size:14px;color:var(--light-brown);margin-bottom:4px;">आयु: \${p.age} | \${p.gender}</div>
      <div style="font-size:14px;color:var(--light-brown);margin-bottom:12px;">🏠 \${p.city}</div>
      \${p.medical ? \`<div style="background:#ffebee;border-radius:8px;padding:8px;margin-bottom:12px;font-size:12px;color:#c62828;">🏥 \${p.medical}</div>\` : ''}
      <a href="tel:\${p.contact1}" style="display:block;padding:14px;background:var(--saffron);color:#fff;border-radius:10px;font-weight:700;font-size:16px;text-decoration:none;margin-bottom:8px;">📞 परिवार को कॉल करें: \${p.contact1}</a>
      \${p.contact2 ? \`<a href="tel:\${p.contact2}" style="display:block;padding:12px;background:#fff;color:var(--saffron);border:2px solid var(--saffron);border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;margin-bottom:8px;">📞 वैकल्पिक: \${p.contact2}</a>\` : ''}
      <a href="https://wa.me/\${p.contact1.replace(/[^0-9]/g,'')}" target="_blank" style="display:block;padding:12px;background:#25D366;color:#fff;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;">💬 WhatsApp करें</a>
    </div>
  \`;
  output.scrollIntoView({ behavior: 'smooth' });
}

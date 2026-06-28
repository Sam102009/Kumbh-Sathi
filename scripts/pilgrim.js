const PILGRIM_GAS_URL = 'https://script.google.com/macros/s/AKfycbyp_E-2tqiBfAtswJIxIeeq2iH6gwMjjlPZwlxxijqU6RdfZW8UOlcM83Gd9Yay7ZbufQ/exec';

function switchPilgrimTab(tab) {
  var registerTab = document.getElementById('pilgrim-register-tab');
  var listTab = document.getElementById('pilgrim-list-tab');
  var btnRegister = document.getElementById('pilgrim-tab-register');
  var btnList = document.getElementById('pilgrim-tab-list');
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
  var name = document.getElementById('p-name').value.trim();
  var age = document.getElementById('p-age').value.trim();
  var gender = document.getElementById('p-gender').value;
  var city = document.getElementById('p-city').value.trim();
  var contact1 = document.getElementById('p-contact1').value.trim();
  var contact2 = document.getElementById('p-contact2').value.trim();
  var medical = document.getElementById('p-medical').value.trim();
  var photoFile = document.getElementById('p-photo').files[0];

  if (!name || !age || !city || !contact1) {
    alert('कृपया सभी आवश्यक फ़ील्ड भरें (नाम, आयु, शहर, संपर्क)');
    return;
  }

  var btn = document.getElementById('pilgrim-submit-btn');
  btn.disabled = true;
  btn.innerHTML = '⏳ कार्ड बन रहा है...';

  function processAndSubmit(photoBase64) {
    var pilgrimId = generatePilgrimId();
    var timestamp = new Date().toISOString();
    var pilgrimData = {
      action: 'registerPilgrim',
      id: pilgrimId,
      name: name,
      age: age,
      gender: gender,
      city: city,
      contact1: contact1,
      contact2: contact2,
      medical: medical,
      photo: photoBase64 || '',
      timestamp: timestamp
    };

    fetch(PILGRIM_GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pilgrimData)
    })
    .then(function(r) { return r.json(); })
    .then(function() {
      savePilgrimLocally({ id: pilgrimId, name: name, age: age, gender: gender, city: city, contact1: contact1, contact2: contact2, medical: medical, photo: photoBase64 || '', timestamp: timestamp });
      showQRCard({ id: pilgrimId, name: name, age: age, gender: gender, city: city, contact1: contact1, contact2: contact2, medical: medical, photo: photoBase64 || '' });
      btn.disabled = false;
      btn.innerHTML = '🪪 QR कार्ड बनाएं';
    })
    .catch(function() {
      savePilgrimLocally({ id: pilgrimId, name: name, age: age, gender: gender, city: city, contact1: contact1, contact2: contact2, medical: medical, photo: photoBase64 || '', timestamp: timestamp });
      showQRCard({ id: pilgrimId, name: name, age: age, gender: gender, city: city, contact1: contact1, contact2: contact2, medical: medical, photo: photoBase64 || '' });
      btn.disabled = false;
      btn.innerHTML = '🪪 QR कार्ड बनाएं';
    });
  }

  if (photoFile) {
    var reader = new FileReader();
    reader.onload = function(e) { processAndSubmit(e.target.result); };
    reader.readAsDataURL(photoFile);
  } else {
    processAndSubmit('');
  }
}

function showQRCard(pilgrim) {
  var output = document.getElementById('pilgrim-qr-output');
  var appUrl = 'https://Sam102009.github.io/Kumbh-Sathi/#pilgrim?id=' + pilgrim.id;

  var photoHtml = pilgrim.photo
    ? '<img src="' + pilgrim.photo + '" style="width:70px;height:70px;border-radius:8px;object-fit:cover;border:2px solid var(--saffron);">'
    : '<div style="width:70px;height:70px;border-radius:8px;background:#f5f0e8;border:2px dashed #ccc;display:flex;align-items:center;justify-content:center;font-size:24px;">👤</div>';

  var medicalHtml = pilgrim.medical
    ? '<div style="font-size:11px;color:#c62828;margin-top:4px;">🏥 ' + pilgrim.medical + '</div>'
    : '';

  var contact2Html = pilgrim.contact2
    ? '<div style="font-size:13px;color:var(--light-brown);">📱 ' + pilgrim.contact2 + '</div>'
    : '';

  output.style.display = 'block';
  output.innerHTML =
    '<div id="qr-card-printable" style="background:#fff;border-radius:16px;padding:20px;box-shadow:0 4px 20px rgba(0,0,0,0.15);border:2px solid var(--saffron);">' +
      '<div style="text-align:center;margin-bottom:12px;">' +
        '<div style="font-size:18px;font-weight:800;color:var(--saffron);">🙏 KumbhSathi</div>' +
        '<div style="font-size:11px;color:var(--light-brown);">Kumbh Mela Nashik 2027 — Pilgrim ID Card</div>' +
      '</div>' +
      '<div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:12px;">' +
        photoHtml +
        '<div style="flex:1;">' +
          '<div style="font-size:18px;font-weight:800;color:var(--dark-brown);">' + pilgrim.name + '</div>' +
          '<div style="font-size:13px;color:var(--light-brown);">आयु: ' + pilgrim.age + ' | ' + pilgrim.gender + '</div>' +
          '<div style="font-size:13px;color:var(--light-brown);">🏠 ' + pilgrim.city + '</div>' +
          medicalHtml +
        '</div>' +
      '</div>' +
      '<div style="text-align:center;margin-bottom:12px;">' +
        '<div id="qr-code-container" style="display:inline-block;padding:8px;background:#fff;border:1px solid #eee;border-radius:8px;"></div>' +
        '<div style="font-size:10px;color:var(--light-brown);margin-top:4px;">ID: ' + pilgrim.id + '</div>' +
      '</div>' +
      '<div style="background:#fff3e0;border-radius:8px;padding:10px;margin-bottom:12px;">' +
        '<div style="font-size:12px;font-weight:700;color:var(--dark-brown);margin-bottom:6px;">📞 आपातकालीन संपर्क</div>' +
        '<div style="font-size:14px;font-weight:700;color:var(--saffron);">📱 ' + pilgrim.contact1 + '</div>' +
        contact2Html +
      '</div>' +
      '<div style="text-align:center;font-size:10px;color:var(--light-brown);margin-bottom:14px;">QR कोड स्कैन करें और परिवार से संपर्क करें</div>' +
      '<div style="display:flex;gap:8px;">' +
        '<button onclick="window.print()" style="flex:1;padding:12px;background:var(--saffron);color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;">🖨️ Print</button>' +
        '<button onclick="registerAnotherPilgrim()" style="flex:1;padding:12px;background:#f5f0e8;color:var(--dark-brown);border:none;border-radius:8px;font-weight:700;cursor:pointer;">➕ नया यात्री</button>' +
      '</div>' +
    '</div>';

  setTimeout(function() {
    var qrContainer = document.getElementById('qr-code-container');
    if (qrContainer && typeof QRCode !== 'undefined') {
      new QRCode(qrContainer, {
        text: appUrl,
        width: 160,
        height: 160,
        colorDark: '#3E1F0D',
        colorLight: '#ffffff'
      });
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
  var existing = JSON.parse(localStorage.getItem('kumbh_pilgrims') || '[]');
  existing.unshift(pilgrim);
  localStorage.setItem('kumbh_pilgrims', JSON.stringify(existing));
}

function loadPilgrimList() {
  var container = document.getElementById('pilgrim-list-container');
  var pilgrims = JSON.parse(localStorage.getItem('kumbh_pilgrims') || '[]');
  if (!pilgrims.length) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--light-brown);"><i class="fa-solid fa-id-card" style="font-size:40px;opacity:0.3;"></i><p style="margin-top:12px;">कोई पंजीकृत यात्री नहीं</p></div>';
    return;
  }
  container.innerHTML = pilgrims.map(function(p, i) {
    var photoHtml = p.photo
      ? '<img src="' + p.photo + '" style="width:50px;height:50px;border-radius:50%;object-fit:cover;border:2px solid var(--saffron);">'
      : '<div style="width:50px;height:50px;border-radius:50%;background:#f5f0e8;display:flex;align-items:center;justify-content:center;font-size:20px;">👤</div>';
    var pStr = JSON.stringify(p).replace(/"/g, '&quot;');
    return '<div style="background:#fff;border-radius:12px;padding:14px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);display:flex;align-items:center;gap:12px;">' +
      photoHtml +
      '<div style="flex:1;">' +
        '<div style="font-weight:700;color:var(--dark-brown);">' + p.name + '</div>' +
        '<div style="font-size:12px;color:var(--light-brown);">आयु ' + p.age + ' | ' + p.city + '</div>' +
        '<div style="font-size:10px;color:var(--light-brown);">ID: ' + p.id + '</div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:6px;">' +
        '<button onclick=\'showQRCard(' + pStr + ')\' style="padding:6px 10px;background:var(--saffron);color:#fff;border:none;border-radius:6px;font-size:11px;cursor:pointer;">QR देखें</button>' +
        '<button onclick="deletePilgrim(' + i + ')" style="padding:6px 10px;background:#ffebee;color:#c62828;border:none;border-radius:6px;font-size:11px;cursor:pointer;">हटाएं</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

function deletePilgrim(index) {
  if (!confirm('इस यात्री को हटाएं?')) return;
  var pilgrims = JSON.parse(localStorage.getItem('kumbh_pilgrims') || '[]');
  pilgrims.splice(index, 1);
  localStorage.setItem('kumbh_pilgrims', JSON.stringify(pilgrims));
  loadPilgrimList();
}

function initPilgrim() {
  loadPilgrimList();
  var hash = window.location.hash;
  if (hash.includes('pilgrim?id=')) {
    var id = hash.split('id=')[1];
    if (id) fetchPilgrimById(id);
  }
}

function fetchPilgrimById(id) {
  var local = JSON.parse(localStorage.getItem('kumbh_pilgrims') || '[]');
  var found = local.find(function(p) { return p.id === id; });
  if (found) { showPilgrimDetails(found); return; }
  fetch(PILGRIM_GAS_URL + '?sheet=Pilgrims&id=' + id)
    .then(function(r) { return r.json(); })
    .then(function(data) { if (data && !data.error) showPilgrimDetails(data); })
    .catch(function() {});
}

function showPilgrimDetails(p) {
  var output = document.getElementById('pilgrim-qr-output');
  if (!output) return;
  var photoHtml = p.photo
    ? '<img src="' + p.photo + '" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--saffron);margin-bottom:12px;">'
    : '';
  var medicalHtml = p.medical
    ? '<div style="background:#ffebee;border-radius:8px;padding:8px;margin-bottom:12px;font-size:12px;color:#c62828;">🏥 ' + p.medical + '</div>'
    : '';
  var contact2Html = p.contact2
    ? '<a href="tel:' + p.contact2 + '" style="display:block;padding:12px;background:#fff;color:var(--saffron);border:2px solid var(--saffron);border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;margin-bottom:8px;">📞 वैकल्पिक: ' + p.contact2 + '</a>'
    : '';
  var phone = p.contact1.replace(/[^0-9]/g, '');
  output.style.display = 'block';
  output.innerHTML =
    '<div style="background:#fff3e0;border-radius:16px;padding:20px;border:3px solid var(--saffron);text-align:center;">' +
      '<div style="font-size:24px;margin-bottom:8px;">🚨</div>' +
      '<div style="font-size:16px;font-weight:800;color:#c62828;margin-bottom:12px;">यह व्यक्ति खो गया हो सकता है</div>' +
      photoHtml +
      '<div style="font-size:20px;font-weight:800;color:var(--dark-brown);">' + p.name + '</div>' +
      '<div style="font-size:14px;color:var(--light-brown);margin-bottom:4px;">आयु: ' + p.age + ' | ' + p.gender + '</div>' +
      '<div style="font-size:14px;color:var(--light-brown);margin-bottom:12px;">🏠 ' + p.city + '</div>' +
      medicalHtml +
      '<a href="tel:' + p.contact1 + '" style="display:block;padding:14px;background:var(--saffron);color:#fff;border-radius:10px;font-weight:700;font-size:16px;text-decoration:none;margin-bottom:8px;">📞 परिवार को कॉल करें: ' + p.contact1 + '</a>' +
      contact2Html +
      '<a href="https://wa.me/' + phone + '" target="_blank" style="display:block;padding:12px;background:#25D366;color:#fff;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;">💬 WhatsApp करें</a>' +
    '</div>';
  output.scrollIntoView({ behavior: 'smooth' });
}

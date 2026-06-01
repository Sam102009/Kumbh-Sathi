/* ===================================================
   KumbhSathi — Group Location Sharing
   =================================================== */

const GROUPS_URL = 'https://script.google.com/macros/s/AKfycbyp_E-2tqiBfAtswJIxIeeq2iH6gwMjjlPZwlxxijqU6RdfZW8UOlcM83Gd9Yay7ZbufQ/exec';

var currentGroup = null;
var currentMember = null;
var groupUpdateInterval = null;
var groupMap = null;
var groupMarkers = {};

/* Generate 6-digit group code */
function generateGroupCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

/* Save group info to localStorage */
function saveGroupInfo(code, name) {
  try {
    sessionStorage.setItem('ks_group_code', code);
    sessionStorage.setItem('ks_member_name', name);
  } catch(e) {}
}

/* Load group info */
function loadGroupInfo() {
  try {
    currentGroup = sessionStorage.getItem('ks_group_code');
    currentMember = sessionStorage.getItem('ks_member_name');
  } catch(e) {}
}

/* Create new group */
function createGroup() {
  alert('createGroup called');
  var name = document.getElementById('group-member-name').value.trim();
  if (!name) { showToast('कृपया अपना नाम दर्ज करें'); return; }
  var code = generateGroupCode();
  currentGroup = code;
  currentMember = name;
  saveGroupInfo(code, name);
  document.getElementById('group-code-display').textContent = code;
  document.getElementById('group-setup').style.display = 'none';
  document.getElementById('group-active').style.display = 'block';
  document.getElementById('active-group-code').textContent = code;
  document.getElementById('active-member-name').textContent = name;
  startGroupTracking();
  showToast('ग्रुप बनाया गया! कोड शेयर करें: ' + code);
}

/* Join existing group */
function joinGroup() {
  var name = document.getElementById('group-member-name').value.trim();
  var code = document.getElementById('group-join-code').value.trim().toUpperCase();
  if (!name) { showToast('कृपया अपना नाम दर्ज करें'); return; }
  if (!code || code.length < 4) { showToast('कृपया सही ग्रुप कोड दर्ज करें'); return; }
  currentGroup = code;
  currentMember = name;
  saveGroupInfo(code, name);
  document.getElementById('group-code-display').textContent = code;
  document.getElementById('group-setup').style.display = 'none';
  document.getElementById('group-active').style.display = 'block';
  document.getElementById('active-group-code').textContent = code;
  document.getElementById('active-member-name').textContent = name;
  startGroupTracking();
  showToast('ग्रुप से जुड़ गए! कोड: ' + code);
}

/* Start location tracking */
function startGroupTracking() {
  updateGroupLocation(false);
  groupUpdateInterval = setInterval(function() {
    updateGroupLocation(false);
  }, 60 * 1000);
  loadGroupMembers();
  setInterval(loadGroupMembers, 30 * 1000);
}

/* Update own location */
function updateGroupLocation(isPanic) {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(function(pos) {
    var data = {
      action: 'updateGroup',
      groupCode: currentGroup,
      memberName: currentMember,
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      timestamp: new Date().toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'}),
      panic: isPanic
    };
    fetch(GROUPS_URL, {
      method: 'POST',
      body: JSON.stringify(data)
    }).then(function() {
      loadGroupMembers();
    }).catch(function() {});
  }, function() {
    showToast('लोकेशन एक्सेस दें');
  });
}

/* Send panic alert */
function sendPanic() {
  updateGroupLocation(true);
  showToast('🚨 SOS भेजा गया! ग्रुप के सभी सदस्यों को सूचित किया गया।');
}

/* Load group members */
function loadGroupMembers() {
  if (!currentGroup) return;
  fetch(GROUPS_URL + '?sheet=Groups&code=' + currentGroup)
    .then(function(res) { return res.json(); })
    .then(function(members) {
      renderGroupMembers(members);
      updateGroupMap(members);
    })
    .catch(function() {});
}

/* Render member list */
function renderGroupMembers(members) {
  var container = document.getElementById('group-members-list');
  if (!container) return;
  if (!members || members.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:var(--light-brown);font-size:12px;padding:10px;">अभी कोई सदस्य नहीं</div>';
    return;
  }
  container.innerHTML = members.map(function(m) {
    var isPanic = m.panic === true || m.panic === 'true' || m.panic === 'TRUE';
    var isMe = m.memberName === currentMember;
    return '<div class="group-member-card' + (isPanic ? ' panic' : '') + '">' +
      '<div class="member-avatar" style="background:' + (isPanic ? '#b71c1c' : isMe ? 'var(--saffron)' : '#1565c0') + ';">' +
      m.memberName.charAt(0).toUpperCase() + '</div>' +
      '<div class="member-info">' +
      '<div class="member-name">' + m.memberName + (isMe ? ' (आप)' : '') + '</div>' +
      '<div class="member-time">अपडेट: ' + (m.timestamp || 'अज्ञात') + '</div>' +
      (isPanic ? '<div class="member-panic">🚨 SOS भेजा!</div>' : '') +
      '</div>' +
      '<div class="member-status" style="color:' + (isPanic ? '#b71c1c' : '#2e7d32') + ';">' +
      (isPanic ? '🚨' : '✓') + '</div>' +
      '</div>';
  }).join('');
}

/* Update group map */
function updateGroupMap(members) {
  var mapEl = document.getElementById('group-map');
  if (!mapEl) return;
  if (!groupMap) {
    groupMap = L.map('group-map', { center: [20.0024, 73.7882], zoom: 14 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors', maxZoom: 19
    }).addTo(groupMap);
  }
  members.forEach(function(m) {
    if (!m.lat || !m.lng) return;
    var isPanic = m.panic === true || m.panic === 'true' || m.panic === 'TRUE';
    var color = isPanic ? '#b71c1c' : m.memberName === currentMember ? '#FF6F00' : '#1565c0';
    var icon = L.divIcon({
      html: '<div style="background:' + color + ';color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);">' +
        m.memberName.charAt(0).toUpperCase() + '</div>',
      className: '', iconSize: [32, 32], iconAnchor: [16, 16]
    });
    if (groupMarkers[m.memberName]) {
      groupMarkers[m.memberName].setLatLng([m.lat, m.lng]);
      groupMarkers[m.memberName].setIcon(icon);
    } else {
      groupMarkers[m.memberName] = L.marker([m.lat, m.lng], { icon: icon })
        .bindPopup(m.memberName + (isPanic ? ' 🚨 SOS!' : ''))
        .addTo(groupMap);
    }
  });
}

/* Copy group code */
function copyGroupCode() {
  var code = currentGroup;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(function() {
      showToast('कोड कॉपी हो गया: ' + code);
    });
  } else {
    showToast('कोड: ' + code);
  }
}

/* Share group code via WhatsApp */
function shareGroupWhatsApp() {
  var text = 'KumbhSathi पर मेरे ग्रुप से जुड़ें! ग्रुप कोड: ' + currentGroup + '\nApp: https://Sam102009.github.io/Kumbh-Sathi/';
  window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
}

/* Leave group */
function leaveGroup() {
  if (groupUpdateInterval) clearInterval(groupUpdateInterval);
  currentGroup = null;
  currentMember = null;
  try { sessionStorage.removeItem('ks_group_code'); sessionStorage.removeItem('ks_member_name'); } catch(e) {}
  document.getElementById('group-setup').style.display = 'block';
  document.getElementById('group-active').style.display = 'none';
  if (groupMap) { groupMap.remove(); groupMap = null; groupMarkers = {}; }
  showToast('ग्रुप छोड़ दिया');
}

/* Init groups page */
function initGroups() {
  loadGroupInfo();
  if (currentGroup && currentMember) {
    document.getElementById('group-setup').style.display = 'none';
    document.getElementById('group-active').style.display = 'block';
    document.getElementById('active-group-code').textContent = currentGroup;
    document.getElementById('active-member-name').textContent = currentMember;
    startGroupTracking();
  } else {
    document.getElementById('group-setup').style.display = 'block';
    document.getElementById('group-active').style.display = 'none';
  }
  setTimeout(function() {
    if (groupMap) groupMap.invalidateSize();
  }, 300);
}

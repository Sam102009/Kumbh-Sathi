/* ===================================================
   KumbhSathi — Group Location Sharing
   =================================================== */

const GROUPS_URL = 'https://script.google.com/macros/s/AKfycbxIpxbFmkxOIJi-dNMPmleSq17DrMkBIUCICb6r8Cp_7H8cLU96N-wM-JuKTX0XV-ct/exec';

var currentGroup = null;
var currentMember = null;
var groupUpdateInterval = null;
var groupMembersInterval = null;
var groupMap = null;
var groupMarkers = {};

/* Generate 6-digit group code */
function generateGroupCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

/* Save group info to localStorage */
function saveGroupInfo(code, name) {
  try {
    localStorage.setItem('kumbh_group', JSON.stringify({
      groupCode: code,
      memberName: name
    }));
  } catch(e) {}
}

/* Load group info */
function loadGroupInfo() {
  var saved = null;
  try {
    saved = localStorage.getItem('kumbh_group');
    if (saved) {
      var parsed = JSON.parse(saved);
      if (parsed && parsed.groupCode && parsed.memberName) {
        currentGroup = parsed.groupCode;
        currentMember = parsed.memberName;
        return;
      }
      localStorage.removeItem('kumbh_group');
    }
  } catch(e) {}

  // Migrate any group saved by older versions of the app.
  try {
    var legacyGroup = sessionStorage.getItem('ks_group_code');
    var legacyMember = sessionStorage.getItem('ks_member_name');
    if (legacyGroup && legacyMember) {
      currentGroup = legacyGroup;
      currentMember = legacyMember;
      saveGroupInfo(legacyGroup, legacyMember);
    }
  } catch(e) {}
}

/* Create new group */
function createGroup() {
  var name = document.getElementById('group-member-name').value.trim();
  if (!name) { showToast(t('group_enter_name')); return; }
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
  showToast(t('group_created_toast') + code);
}

/* Join existing group */
function joinGroup() {
  var name = document.getElementById('group-member-name').value.trim();
  var code = document.getElementById('group-join-code').value.trim().toUpperCase();
  if (!name) { showToast(t('group_enter_name')); return; }
  if (!code || code.length < 4) { showToast(t('group_enter_code')); return; }
  currentGroup = code;
  currentMember = name;
  saveGroupInfo(code, name);
  document.getElementById('group-code-display').textContent = code;
  document.getElementById('group-setup').style.display = 'none';
  document.getElementById('group-active').style.display = 'block';
  document.getElementById('active-group-code').textContent = code;
  document.getElementById('active-member-name').textContent = name;
  startGroupTracking();
  showToast(t('group_joined_toast') + code);
}

/* Start location tracking */
function startGroupTracking() {
  if (groupUpdateInterval) clearInterval(groupUpdateInterval);
  if (groupMembersInterval) clearInterval(groupMembersInterval);
  groupMapCentered = false;
  ksOwnRow = null;
  ksGroupMembers = [];
  ksSosSeen = {};
  updateGroupLocation(false, true);
  groupUpdateInterval = setInterval(function() {
    updateGroupLocation(false, false);
  }, 60 * 1000);
  loadGroupMembers();
  groupMembersInterval = setInterval(function() {
    if (!document.hidden) loadGroupMembers();
  }, 15 * 1000);
}

/* Update own location */
var ksLastGroupPos = null;

var ksSosUntil = 0;
var ksOwnRow = null;
var ksGroupMembers = [];
var ksSosSeen = {};

function ksNowStamp() {
  return new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  }).replace(/\b(am|pm)\b/i, function(period) {
    return period.toUpperCase();
  });
}

function ksApplyOwnUpdate(lat, lng, panic) {
  ksOwnRow = { groupCode: currentGroup, memberName: currentMember, lat: lat, lng: lng, timestamp: ksNowStamp(), panic: panic };
  var idx = -1;
  ksGroupMembers.forEach(function(m, i) { if (m.memberName === currentMember) idx = i; });
  if (idx >= 0) ksGroupMembers[idx] = ksOwnRow; else ksGroupMembers.push(ksOwnRow);
  renderGroupMembers(ksGroupMembers);
  updateGroupMap(ksGroupMembers);
}

function ksPostGroupUpdate(lat, lng, isPanic) {
  if (isPanic) ksSosUntil = Date.now() + 10 * 60 * 1000;
  var panicNow = Date.now() < ksSosUntil;
  ksApplyOwnUpdate(lat, lng, panicNow);
  var data = {
    action: 'updateGroup',
    groupCode: currentGroup,
    memberName: currentMember,
    lat: lat,
    lng: lng,
    timestamp: ksNowStamp(),
    panic: panicNow,
    token: 'kumbh2027secure'
  };
  fetch(GROUPS_URL, {
    method: 'POST',
    body: JSON.stringify(data)
  }).then(function() {
    loadGroupMembers();
  }).catch(function() {});
}

function updateGroupLocation(isPanic, loud) {
  if (!navigator.geolocation) return;
  // SOS: send the last known position right away, then refine below
  if (isPanic && ksLastGroupPos) ksPostGroupUpdate(ksLastGroupPos.lat, ksLastGroupPos.lng, true);
  var opts = { enableHighAccuracy: false, timeout: 20000, maximumAge: isPanic ? 300000 : 60000 };
  navigator.geolocation.getCurrentPosition(function(pos) {
    ksLastGroupPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    ksPostGroupUpdate(ksLastGroupPos.lat, ksLastGroupPos.lng, isPanic);
  }, function(err) {
    if (isPanic) {
      if (!ksLastGroupPos) showInfoPopup('\uD83D\uDEA8', t('group_sos_nopos_title'), t('group_sos_nopos'), '#b71c1c');
    } else if (loud && typeof ksLocationError === 'function') {
      ksLocationError(err);
    }
  }, opts);
}

/* Send panic alert */
function sendPanic() {
  updateGroupLocation(true, true);
  showToast(t('group_sos_sent'));
}

/* Format time-only values returned by Google Sheets */
function formatGroupTimestamp(value) {
  if (!value) return '—';

  var raw = String(value).trim();
  var legacyTime = raw.match(/^1899-12-(?:29|30)T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?Z$/i);
  if (legacyTime) {
    // Sheets serializes time-only cells using India's 1899 offset (+05:21:10), not +05:30
    var utcSec = Number(legacyTime[1]) * 3600 + Number(legacyTime[2]) * 60 + Number(legacyTime[3] || 0);
    var istMin = Math.round(((utcSec + 19270) % 86400) / 60) % 1440;
    return formatClockTime(Math.floor(istMin / 60), istMin % 60);
  }

  var meridiemTime = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap])\.?m\.?$/i);
  if (meridiemTime) {
    return String(Number(meridiemTime[1])).padStart(2, '0') + ':' +
      meridiemTime[2] + ' ' + meridiemTime[3].toUpperCase() + 'M';
  }

  var twentyFourHourTime = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (twentyFourHourTime) {
    return formatClockTime(Number(twentyFourHourTime[1]), Number(twentyFourHourTime[2]));
  }

  return raw;
}

function formatClockTime(hours, minutes) {
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return '—';
  var period = hours >= 12 ? 'PM' : 'AM';
  var hour12 = hours % 12 || 12;
  return String(hour12).padStart(2, '0') + ':' + String(minutes).padStart(2, '0') + ' ' + period;
}

/* Load group members */
function loadGroupMembers() {
  if (!currentGroup) return;
  fetch(GROUPS_URL + '?sheet=Groups&code=' + currentGroup)
    .then(function(res) { return res.json(); })
    .then(function(members) {
      if (!Array.isArray(members)) return;
      if (ksOwnRow) {
        var idx = -1;
        members.forEach(function(m, i) { if (m.memberName === currentMember) idx = i; });
        if (idx >= 0) members[idx] = ksOwnRow; else members.push(ksOwnRow);
      }
      ksGroupMembers = members;
      renderGroupMembers(members);
      updateGroupMap(members);
      ksCheckSos(members);
    })
    .catch(function() {});
}

/* Render member list */
function renderGroupMembers(members) {
  var container = document.getElementById('group-members-list');
  if (!container) return;
  if (!members || members.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:var(--light-brown);font-size:12px;padding:10px;">' + t('group_no_members') + '</div>';
    return;
  }
  container.innerHTML = members.map(function(m) {
    var isPanic = m.panic === true || m.panic === 'true' || m.panic === 'TRUE';
    var isMe = m.memberName === currentMember;
    return '<div class="group-member-card' + (isPanic ? ' panic' : '') + '">' +
      '<div class="member-avatar" style="background:' + (isPanic ? '#b71c1c' : isMe ? 'var(--saffron)' : '#1565c0') + ';">' +
      m.memberName.charAt(0).toUpperCase() + '</div>' +
      '<div class="member-info">' +
      '<div class="member-name">' + m.memberName + (isMe ? ' ' + t('group_you') : '') + '</div>' +
       '<div class="member-time">' + t('group_updated') + formatGroupTimestamp(m.timestamp) + '</div>' +
      (isPanic ? '<div class="member-panic">' + t('group_sos_sent_label') + '</div>' : '') +
      '</div>' +
      '<div class="member-status" style="color:' + (isPanic ? '#b71c1c' : '#2e7d32') + ';">' +
      (isPanic ? '🚨' : '✓') + '</div>' +
      '</div>';
  }).join('');
}

/* Update group map */
var groupMapCentered = false;

function updateGroupMap(members) {
  var mapEl = document.getElementById('group-map');
  if (!mapEl) return;
  if (!groupMap) {
    groupMap = L.map('group-map', { center: [20.0024, 73.7882], zoom: 14 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors', maxZoom: 19
    }).addTo(groupMap);
    var GroupLocate = L.Control.extend({
      options: { position: 'bottomright' },
      onAdd: function() {
        var btn = L.DomUtil.create('button', 'ks-locate-btn');
        btn.type = 'button';
        btn.textContent = ksLocateLabel();
        btn.title = t('my_location');
        btn.style.cssText = 'min-width:44px;height:44px;padding:0 14px;border-radius:22px;background:#fff;border:2px solid rgba(0,0,0,.2);font-size:14px;font-weight:700;color:#3e2723;line-height:1;box-shadow:0 2px 8px rgba(0,0,0,.3);cursor:pointer;white-space:nowrap;';
        L.DomEvent.disableClickPropagation(btn);
        L.DomEvent.on(btn, 'click', function() {
          if (!navigator.geolocation) return;
          btn.textContent = '\u23F3';
          ksGetLocation(function(pos) {
            btn.textContent = ksLocateLabel();
            ksLastGroupPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            groupMap.flyTo([pos.coords.latitude, pos.coords.longitude], Math.max(groupMap.getZoom(), 15), { duration: 1 });
          }, function() { btn.textContent = ksLocateLabel(); });
        });
        return btn;
      }
    });
    groupMap.addControl(new GroupLocate());
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
  if (!groupMapCentered) {
    var me = members.filter(function(m) { return m.memberName === currentMember && m.lat && m.lng; })[0];
    if (me) {
      groupMap.setView([me.lat, me.lng], 15);
      groupMapCentered = true;
    }
  }
}

/* Copy group code */
function copyGroupCode() {
  var code = currentGroup;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(function() {
      showToast(t('group_copied_toast') + code);
    });
  } else {
    showToast(t('group_copied_toast') + code);
  }
}

/* Share group code via WhatsApp */
function shareGroupWhatsApp() {
  var text = t('group_share_text') + currentGroup + '\nApp: https://Sam102009.github.io/Kumbh-Sathi/';
  window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
}

/* Leave group */
function leaveGroup() {
  if (groupUpdateInterval) clearInterval(groupUpdateInterval);
  if (groupMembersInterval) clearInterval(groupMembersInterval);
  groupUpdateInterval = null;
  groupMembersInterval = null;
  currentGroup = null;
  currentMember = null;
  try {
    localStorage.removeItem('kumbh_group');
    sessionStorage.removeItem('ks_group_code');
    sessionStorage.removeItem('ks_member_name');
  } catch(e) {}
  document.getElementById('group-setup').style.display = 'block';
  document.getElementById('group-active').style.display = 'none';
  if (groupMap) { groupMap.remove(); groupMap = null; groupMarkers = {}; }
  showToast(t('group_left_toast'));
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

/* ===== SOS alert for other members: siren + vibration + red popup ===== */
var ksAudioCtx = null;

function ksUnlockAudio() {
  try {
    if (!ksAudioCtx) ksAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (ksAudioCtx.state === 'suspended') ksAudioCtx.resume();
  } catch (e) {}
}
document.addEventListener('click', ksUnlockAudio);
document.addEventListener('touchstart', ksUnlockAudio);

function ksPlayAlarm() {
  try { if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500, 200, 500]); } catch (e) {}
  try {
    ksUnlockAudio();
    if (!ksAudioCtx) return;
    var ctx = ksAudioCtx, now = ctx.currentTime;
    var gain = ctx.createGain();
    gain.gain.value = 0.5;
    gain.connect(ctx.destination);
    for (var i = 0; i < 8; i++) {
      var osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = (i % 2 === 0) ? 880 : 660;
      osc.connect(gain);
      osc.start(now + i * 0.5);
      osc.stop(now + i * 0.5 + 0.45);
    }
  } catch (e) {}
}

function ksCheckSos(members) {
  members.forEach(function(m) {
    if (m.memberName === currentMember) return;
    var isPanic = m.panic === true || m.panic === 'true' || m.panic === 'TRUE';
    if (isPanic && !ksSosSeen[m.memberName]) {
      ksSosSeen[m.memberName] = true;
      ksPlayAlarm();
      showInfoPopup('\uD83D\uDEA8', t('group_sos_alert_title'), m.memberName + ' ' + t('group_sos_alert_msg'), '#b71c1c');
    } else if (!isPanic) {
      ksSosSeen[m.memberName] = false;
    }
  });
}

document.addEventListener('visibilitychange', function() {
  if (!document.hidden && typeof currentGroup !== 'undefined' && currentGroup) loadGroupMembers();
});

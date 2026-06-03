/* KumbhSathi - Crowd Density v2 */

var LOCATIONS = [
  { id: 'ramkund', name: 'Ramkund Ghat', name_hi: 'रामकुंड घाट', icon: '💧', area: 'nashik' },
  { id: 'kushavart', name: 'Kushavart Kund', name_hi: 'कुशावर्त कुंड', icon: '💧', area: 'trimbak' },
  { id: 'trimbakeshwar', name: 'Trimbakeshwar Temple', name_hi: 'त्र्यंबकेश्वर मंदिर', icon: '🕉️', area: 'trimbak' },
  { id: 'kalaram', name: 'Kalaram Temple', name_hi: 'कालाराम मंदिर', icon: '🕉️', area: 'nashik' },
  { id: 'panchavati', name: 'Panchavati Area', name_hi: 'पंचवटी क्षेत्र', icon: '🌿', area: 'nashik' },
  { id: 'cbs', name: 'CBS Bus Stand', name_hi: 'सीबीएस बस स्टैंड', icon: '🚌', area: 'nashik' },
  { id: 'nashikroad', name: 'Nashik Road Station', name_hi: 'नाशिक रोड स्टेशन', icon: '🚆', area: 'nashik' },
  { id: 'parking_a', name: 'Parking Zone A', name_hi: 'पार्किंग जोन A', icon: '🅿️', area: 'nashik' }
];

function getScore(id) {
  var h = new Date().getHours();
  var base = 20;
  if (h >= 4 && h < 7) base = 60;
  else if (h >= 7 && h < 10) base = 85;
  else if (h >= 10 && h < 13) base = 70;
  else if (h >= 13 && h < 16) base = 45;
  else if (h >= 16 && h < 19) base = 75;
  else if (h >= 19 && h < 21) base = 55;
  var boosts = { ramkund: 10, kushavart: 8, trimbakeshwar: 8, kalaram: 5, panchavati: 5 };
  return Math.min(100, base + (boosts[id] || 0));
}

function getLevel(score) {
  if (score >= 85) return { label: 'Extreme', label_hi: 'अत्यधिक', color: '#b71c1c', emoji: '🔴' };
  if (score >= 65) return { label: 'High', label_hi: 'अधिक', color: '#e65100', emoji: '🟠' };
  if (score >= 40) return { label: 'Moderate', label_hi: 'सामान्य', color: '#f9a825', emoji: '🟡' };
  return { label: 'Low', label_hi: 'कम', color: '#2e7d32', emoji: '🟢' };
}

function drawCrowd() {
  var box = document.getElementById('crowd-container');
  if (!box) { console.log('crowd-container not found'); return; }
  
  var html = '<div class="section-title">नाशिक — मुख्य क्षेत्र</div>';
  
  LOCATIONS.filter(function(l){ return l.area === 'nashik'; }).forEach(function(loc) {
    var score = getScore(loc.id);
    var lv = getLevel(score);
    html += '<div class="crowd-card" style="border-left:4px solid ' + lv.color + ';background:rgba(0,0,0,0.03);margin-bottom:10px;padding:12px;border-radius:8px;">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
    html += '<div><div style="font-weight:700;">' + loc.icon + ' ' + loc.name_hi + '</div>';
    html += '<div style="font-size:11px;color:#888;">' + loc.name + '</div></div>';
    html += '<div style="background:' + lv.color + ';color:#fff;padding:4px 10px;border-radius:20px;font-size:12px;">' + lv.emoji + ' ' + lv.label + '</div>';
    html += '</div>';
    html += '<div style="margin-top:8px;background:#eee;border-radius:4px;height:6px;">';
    html += '<div style="width:' + score + '%;background:' + lv.color + ';height:6px;border-radius:4px;"></div></div>';
    html += '<div style="font-size:10px;color:#aaa;margin-top:4px;">' + lv.label_hi + ' भीड़ • ' + score + '%</div>';
    html += '</div>';
  });

  html += '<div class="section-title" style="margin-top:16px;">त्र्यंबकेश्वर क्षेत्र</div>';
  
  LOCATIONS.filter(function(l){ return l.area === 'trimbak'; }).forEach(function(loc) {
    var score = getScore(loc.id);
    var lv = getLevel(score);
    html += '<div class="crowd-card" style="border-left:4px solid ' + lv.color + ';background:rgba(0,0,0,0.03);margin-bottom:10px;padding:12px;border-radius:8px;">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
    html += '<div><div style="font-weight:700;">' + loc.icon + ' ' + loc.name_hi + '</div>';
    html += '<div style="font-size:11px;color:#888;">' + loc.name + '</div></div>';
    html += '<div style="background:' + lv.color + ';color:#fff;padding:4px 10px;border-radius:20px;font-size:12px;">' + lv.emoji + ' ' + lv.label + '</div>';
    html += '</div>';
    html += '<div style="margin-top:8px;background:#eee;border-radius:4px;height:6px;">';
    html += '<div style="width:' + score + '%;background:' + lv.color + ';height:6px;border-radius:4px;"></div></div>';
    html += '<div style="font-size:10px;color:#aaa;margin-top:4px;">' + lv.label_hi + ' भीड़ • ' + score + '%</div>';
    html += '</div>';
  });

  box.innerHTML = html;
  console.log('crowd rendered OK');
}

function initCrowd() { drawCrowd(); }
function loadCrowdOverrides() { drawCrowd(); }

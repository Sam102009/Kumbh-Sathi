/* ===================================================
   KumbhSathi — Crowd Density Feature
   Auto time-based + Google Sheets manual override
   =================================================== */

const CROWD_SHEET_URL = 'https://script.google.com/macros/s/AKfycbyp_E-2tqiBfAtswJIxIeeq2iH6gwMjjlPZwlxxijqU6RdfZW8UOlcM83Gd9Yay7ZbufQ/exec?sheet=Crowd';

/* Key locations to track */
const CROWD_LOCATIONS = [
  { id: 'ramkund',        name: 'Ramkund Ghat',              name_hi: 'रामकुंड घाट',          icon: '💧', area: 'nashik' },
  { id: 'kushavart',      name: 'Kushavart Kund',            name_hi: 'कुशावर्त कुंड',         icon: '💧', area: 'trimbak' },
  { id: 'trimbakeshwar',  name: 'Trimbakeshwar Temple',      name_hi: 'त्र्यंबकेश्वर मंदिर',   icon: '🕉️', area: 'trimbak' },
  { id: 'kalaram',        name: 'Kalaram Temple',            name_hi: 'कालाराम मंदिर',         icon: '🕉️', area: 'nashik' },
  { id: 'panchavati',     name: 'Panchavati Area',           name_hi: 'पंचवटी क्षेत्र',        icon: '🌿', area: 'nashik' },
  { id: 'cbs',            name: 'CBS Bus Stand',             name_hi: 'सीबीएस बस स्टैंड',      icon: '🚌', area: 'nashik' },
  { id: 'nashikroad',     name: 'Nashik Road Railway Stn',   name_hi: 'नाशिक रोड रेलवे स्टेशन', icon: '🚆', area: 'nashik' },
  { id: 'parking_a',      name: 'Parking Zone A',            name_hi: 'पार्किंग जोन A',        icon: '🅿️', area: 'nashik' },
  { id: 'civil_hospital', name: 'Civil Hospital',            name_hi: 'सिविल अस्पताल',         icon: '🏥', area: 'nashik' },
  { id: 'trimbak_road',   name: 'Nashik–Trimbak Road',       name_hi: 'नाशिक-त्र्यंबक मार्ग', icon: '🛣️', area: 'nashik' },
];

/* Shahi Snan dates */
const SHAHI_SNAN_DATES = ['2027-08-29', '2027-09-12', '2027-09-27'];

/* Auto density calculation based on time */
function getAutoDensity(locationId) {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0=Sun
  const dateStr = now.toISOString().split('T')[0];
  const isShahiSnan = SHAHI_SNAN_DATES.includes(dateStr);
  const isWeekend = day === 0 || day === 6;

  // Base density by hour
  let base = 0;
  if (hour >= 4 && hour < 7)       base = 60;  // Early morning — high
  else if (hour >= 7 && hour < 10) base = 85;  // Morning peak
  else if (hour >= 10 && hour < 13) base = 70; // Mid morning
  else if (hour >= 13 && hour < 16) base = 45; // Afternoon low
  else if (hour >= 16 && hour < 19) base = 75; // Evening peak
  else if (hour >= 19 && hour < 21) base = 55; // Night
  else base = 20;                               // Late night

  // Boost for Shahi Snan
  if (isShahiSnan) base = Math.min(100, base + 30);
  // Boost for weekends
  if (isWeekend) base = Math.min(100, base + 15);

  // Location-specific adjustments
  const boosts = {
    ramkund: 10, kushavart: 8, trimbakeshwar: 8,
    kalaram: 5, panchavati: 5, cbs: 3,
    nashikroad: 3, parking_a: isShahiSnan ? 15 : 5,
    civil_hospital: 0, trimbak_road: isShahiSnan ? 20 : 5,
  };
  base = Math.min(100, base + (boosts[locationId] || 0));

  return base;
}

/* Get density level from score */
function getDensityLevel(score) {
  if (score >= 85) return { level: 'extreme', label: 'अत्यधिक भीड़', label_en: 'Extreme', color: '#b71c1c', bg: 'rgba(183,28,28,0.1)', emoji: '🔴' };
  if (score >= 65) return { level: 'high',    label: 'अधिक भीड़',    label_en: 'High',    color: '#e65100', bg: 'rgba(230,81,0,0.1)',   emoji: '🟠' };
  if (score >= 40) return { level: 'medium',  label: 'सामान्य भीड़', label_en: 'Moderate', color: '#f9a825', bg: 'rgba(249,168,37,0.1)', emoji: '🟡' };
  return                  { level: 'low',     label: 'कम भीड़',      label_en: 'Low',      color: '#2e7d32', bg: 'rgba(46,125,50,0.1)',  emoji: '🟢' };
}

/* Render crowd page */
let crowdOverrides = {};
let crowdLastUpdated = null;

function renderCrowd() {
  const container = document.getElementById('crowd-container');
  const updatedEl = document.getElementById('crowd-last-updated');
  if (!container) return;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  if (updatedEl) updatedEl.textContent = `अंतिम अपडेट: ${timeStr}`;

  // Check Shahi Snan
  const dateStr = now.toISOString().split('T')[0];
  const isShahiSnan = SHAHI_SNAN_DATES.includes(dateStr);
  const alertEl = document.getElementById('crowd-shahi-alert');
  if (alertEl) alertEl.style.display = isShahiSnan ? 'flex' : 'none';

  // Group by area
  const nashikLocs = CROWD_LOCATIONS.filter(l => l.area === 'nashik');
  const trimbakLocs = CROWD_LOCATIONS.filter(l => l.area === 'trimbak');

  container.innerHTML = `
    ${renderCrowdGroup('नाशिक — मुख्य क्षेत्र', nashikLocs)}
    ${renderCrowdGroup('त्र्यंबकेश्वर क्षेत्र', trimbakLocs)}
  `;
}

function renderCrowdGroup(title, locations) {
  return `
    <div class="crowd-group">
      <div class="section-title">${title}</div>
      ${locations.map(loc => renderCrowdCard(loc)).join('')}
    </div>
  `;
}

function renderCrowdCard(loc) {
  const override = crowdOverrides[loc.id];
  const score = override ? parseInt(override.score) : getAutoDensity(loc.id);
  const note = override ? override.note : '';
  const density = getDensityLevel(score);
  const isOverride = !!override;

  return `
    <div class="crowd-card" style="border-left: 4px solid ${density.color}; background: ${density.bg};">
      <div class="crowd-card-top">
        <div class="crowd-icon">${loc.icon}</div>
        <div class="crowd-info">
          <div class="crowd-name">${loc.name_hi}</div>
          <div class="crowd-name-en">${loc.name}</div>
          ${note ? `<div class="crowd-note"><i class="fa-solid fa-circle-info"></i> ${note}</div>` : ''}
        </div>
        <div class="crowd-badge" style="background:${density.color};">
          ${density.emoji} ${density.label_en}
        </div>
      </div>
      <div class="crowd-bar-wrap">
        <div class="crowd-bar-bg">
          <div class="crowd-bar-fill" style="width:${score}%; background:${density.color};"></div>
        </div>
        <span class="crowd-score" style="color:${density.color};">${score}%</span>
      </div>
      <div class="crowd-footer">
        <span style="font-size:10px;color:var(--light-brown);">
          ${density.label}
          ${isOverride ? ' • <i class="fa-solid fa-pen" style="color:var(--saffron);"></i> Manual' : ' • <i class="fa-solid fa-clock"></i> Auto'}
        </span>
      </div>
    </div>
  `;
}

/* Load overrides from Google Sheets */
function loadCrowdOverrides() {
  const container = document.getElementById('crowd-container');
  if (container) {
    container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-spinner fa-spin" style="color:var(--saffron);font-size:28px;"></i><p style="margin-top:10px;">लोड हो रहा है...</p></div>';
  }

  fetch(CROWD_SHEET_URL)
    .then(res => res.json())
    .then(data => {
      crowdOverrides = {};
      if (Array.isArray(data)) {
        data.forEach(row => {
          if (row.location && row.override) {
            crowdOverrides[row.location] = {
              score: row.override,
              note: row.note || ''
            };
          }
        });
      }
      renderCrowd();
    })
    .catch(() => {
      // If sheet fails, still render with auto data
      renderCrowd();
    });
}

function initCrowd() {
  renderCrowd();
  loadCrowdOverrides();
  // Auto refresh every 5 minutes
  setInterval(loadCrowdOverrides, 5 * 60 * 1000);
    }
    
// cache bust Sun May 31 06:49:44 AM UTC 2026

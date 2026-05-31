const CROWD_SHEET_URL =
  'https://script.google.com/macros/s/AKfycbyp_E-2tqiBfAtswJIxIeeq2iH6gwMjjlPZwlxxijqU6RdfZW8UOlcM83Gd9Yay7ZbufQ/exec?sheet=Crowd';

const SHAHI_SNAN_DATES = [
  '2027-08-29',
  '2027-09-12',
  '2027-09-27'
];

var crowdOverrides = {};

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function getLocalDateString() {
  const now = new Date();

  return (
    now.getFullYear() +
    '-' +
    String(now.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(now.getDate()).padStart(2, '0')
  );
}

function getAutoDensity(locationId) {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  const dateStr = getLocalDateString();

  const isShahiSnan = SHAHI_SNAN_DATES.includes(dateStr);
  const isWeekend = day === 0 || day === 6;

  let base = 20;

  if (hour >= 4 && hour < 7) {
    base = 60;
  } else if (hour >= 7 && hour < 10) {
    base = 85;
  } else if (hour >= 10 && hour < 13) {
    base = 70;
  } else if (hour >= 13 && hour < 16) {
    base = 45;
  } else if (hour >= 16 && hour < 19) {
    base = 75;
  } else if (hour >= 19 && hour < 21) {
    base = 55;
  }

  if (isShahiSnan) {
    base = Math.min(100, base + 30);
  }

  if (isWeekend) {
    base = Math.min(100, base + 15);
  }

  const boosts = {
    ramkund: 10,
    kushavart: 8,
    trimbakeshwar: 8,
    kalaram: 5,
    panchavati: 5,
    cbs: 3,
    nashikroad: 3,
    parking_a: 5,
    civil_hospital: 0,
    trimbak_road: 5
  };

  base += boosts[locationId] || 0;

  return Math.max(0, Math.min(100, base));
}

function getDensityLevel(score) {
  if (score >= 85) {
    return {
      label: 'Extreme',
      label_hi: 'अत्यधिक',
      color: '#b71c1c',
      bg: 'rgba(183,28,28,0.08)',
      emoji: '🔴'
    };
  }

  if (score >= 65) {
    return {
      label: 'High',
      label_hi: 'अधिक',
      color: '#e65100',
      bg: 'rgba(230,81,0,0.08)',
      emoji: '🟠'
    };
  }

  if (score >= 40) {
    return {
      label: 'Moderate',
      label_hi: 'सामान्य',
      color: '#f9a825',
      bg: 'rgba(249,168,37,0.08)',
      emoji: '🟡'
    };
  }

  return {
    label: 'Low',
    label_hi: 'कम',
    color: '#2e7d32',
    bg: 'rgba(46,125,50,0.08)',
    emoji: '🟢'
  };
}

const CROWD_LOCATIONS = [
  { id: 'ramkund', name: 'Ramkund Ghat', name_hi: 'रामकुंड घाट', icon: '💧', area: 'nashik' },
  { id: 'kushavart', name: 'Kushavart Kund', name_hi: 'कुशावर्त कुंड', icon: '💧', area: 'trimbak' },
  { id: 'trimbakeshwar', name: 'Trimbakeshwar Temple', name_hi: 'त्र्यंबकेश्वर मंदिर', icon: '🕉️', area: 'trimbak' },
  { id: 'kalaram', name: 'Kalaram Temple', name_hi: 'कालाराम मंदिर', icon: '🕉️', area: 'nashik' },
  { id: 'panchavati', name: 'Panchavati Area', name_hi: 'पंचवटी क्षेत्र', icon: '🌿', area: 'nashik' },
  { id: 'cbs', name: 'CBS Bus Stand', name_hi: 'सीबीएस बस स्टैंड', icon: '🚌', area: 'nashik' },
  { id: 'nashikroad', name: 'Nashik Road Railway Station', name_hi: 'नाशिक रोड रेलवे स्टेशन', icon: '🚆', area: 'nashik' },
  { id: 'parking_a', name: 'Parking Zone A', name_hi: 'पार्किंग जोन A', icon: '🅿️', area: 'nashik' },
  { id: 'civil_hospital', name: 'Civil Hospital', name_hi: 'सिविल अस्पताल', icon: '🏥', area: 'nashik' },
  { id: 'trimbak_road', name: 'Nashik-Trimbak Road', name_hi: 'नाशिक-त्र्यंबक मार्ग', icon: '🛣️', area: 'nashik' }
];

function renderCrowd() {
  const container = document.getElementById('crowd-container');
  if (!container) return;

  let html = '';

  const nashik = CROWD_LOCATIONS.filter(loc => loc.area === 'nashik');
  const trimbak = CROWD_LOCATIONS.filter(loc => loc.area === 'trimbak');

  html += '<div class="section-title">नाशिक — मुख्य क्षेत्र</div>';

  nashik.forEach(loc => {
    html += buildCard(loc);
  });

  html += '<div class="section-title">त्र्यंबकेश्वर क्षेत्र</div>';

  trimbak.forEach(loc => {
    html += buildCard(loc);
  });

  container.innerHTML = html;
}

function buildCard(loc) {
  const override = crowdOverrides[loc.id];

  let score = override
    ? parseInt(override.score, 10)
    : getAutoDensity(loc.id);

  if (isNaN(score)) {
    score = getAutoDensity(loc.id);
  }

  score = Math.max(0, Math.min(100, score));

  const note = override
    ? escapeHtml(override.note || '')
    : '';

  const d = getDensityLevel(score);

  return `
    <div class="crowd-card"
      style="border-left:4px solid ${d.color};background:${d.bg};">

      <div class="crowd-card-top">

        <div class="crowd-icon">${loc.icon}</div>

        <div class="crowd-info">

          <div class="crowd-name">${loc.name_hi}</div>

          <div class="crowd-name-en">${loc.name}</div>

          ${
            note
              ? `<div class="crowd-note">${note}</div>`
              : ''
          }

        </div>

        <div
          class="crowd-badge"
          style="background:${d.color};">
          ${d.emoji} ${d.label}
        </div>

      </div>

      <div class="crowd-bar-wrap">

        <div class="crowd-bar-bg">

          <div
            class="crowd-bar-fill"
            style="width:${score}%;background:${d.color};">
          </div>

        </div>

        <span
          class="crowd-score"
          style="color:${d.color};">
          ${score}%
        </span>

      </div>

      <div class="crowd-footer">

        <span
          style="font-size:10px;color:var(--light-brown);">

          ${d.label_hi} भीड़ •
          ${override ? 'Manual' : 'Estimated'}

        </span>

      </div>

    </div>
  `;
}

function loadCrowdOverrides() {
  renderCrowd();

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 5000);

  fetch(CROWD_SHEET_URL, {
    signal: controller.signal
  })
    .then(res => {
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error('Failed to load crowd data');
      }

      return res.json();
    })
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
    .catch(error => {
      console.warn('Crowd fetch failed:', error);
      renderCrowd();
    });
}

function initCrowd() {
  renderCrowd();

  loadCrowdOverrides();

  setInterval(() => {
    loadCrowdOverrides();
  }, 5 * 60 * 1000);
    }

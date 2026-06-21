/* ===================================================
   KumbhSathi — Main App Logic
   Kumbh Mela Nashik 2027 PWA
   =================================================== */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyp_E-2tqiBfAtswJIxIeeq2iH6gwMjjlPZwlxxijqU6RdfZW8UOlcM83Gd9Yay7ZbufQ/exec';

/* ===== COUNTDOWN TIMER ===== */
function updateCountdown() {
  const now = new Date();
  const target = FIRST_SHAHI_SNAN_DATE;
  const diff = target - now;

  if (diff <= 0) {
    document.getElementById('cd-days').textContent  = '00';
    document.getElementById('cd-hours').textContent = '00';
    document.getElementById('cd-mins').textContent  = '00';
    document.getElementById('cd-secs').textContent  = '00';
    return;
  }

  const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs  = Math.floor((diff % (1000 * 60)) / 1000);

  const pad = n => String(n).padStart(2, '0');
  document.getElementById('cd-days').textContent  = pad(days);
  document.getElementById('cd-hours').textContent = pad(hours);
  document.getElementById('cd-mins').textContent  = pad(mins);
  document.getElementById('cd-secs').textContent  = pad(secs);
}

/* ===== SCHEDULE PAGE ===== */
let activeScheduleFilter = 'all';
window._scheduleCache = null;

/* Convert Google Sheets time value (fraction or string) to readable format */
function parseSheetTime(val) {
  if (!val && val !== 0) return '';
  if (typeof val === 'number') {
    const totalMins = Math.round(val * 24 * 60);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return h12 + ':' + String(m).padStart(2, '0') + ' ' + ampm;
  }
  if (typeof val === 'string') {
    const isoMatch = val.match(/^(1899-12-(29|30|31)|1900-01-0[01])T(\d{2}):(\d{2}):(\d{2})/);
    if (isoMatch) {
      let h = parseInt(isoMatch[3], 10);
      const m = isoMatch[4];
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return h12 + ':' + m + ' ' + ampm;
    }
    const fullIsoMatch = val.match(/^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2}):(\d{2})/);
    if (fullIsoMatch) {
      let h = parseInt(fullIsoMatch[1], 10);
      const m = fullIsoMatch[2];
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return h12 + ':' + m + ' ' + ampm;
    }
    return val;
  }
  return String(val);
}

function parseSheetDateParts(dateStr) {
  if (!dateStr) return null;
  const str = String(dateStr);
  if (str.includes('T') && str.includes('Z')) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return { day: d.getUTCDate(), month: d.getUTCMonth() + 1, year: d.getUTCFullYear() };
    }
  }
  const datePart = str.split('T')[0];
  const parts = datePart.split('-');
  if (parts.length >= 3) {
    return { day: parseInt(parts[2], 10), month: parseInt(parts[1], 10), year: parseInt(parts[0], 10) };
  }
  return null;
}

function getShortMonth(dateStr) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const parts = parseSheetDateParts(dateStr);
  if (!parts) return '';
  return months[parts.month - 1] || '';
}

function getSheetDay(dateStr) {
  const parts = parseSheetDateParts(dateStr);
  if (!parts) return String(dateStr || '');
  return parts.day;
}

function renderSchedule() {
  const container = document.getElementById('events-container');
  if (!container) return;

  let filtered = EVENTS_DATA;
  if (activeScheduleFilter !== 'all') {
    filtered = EVENTS_DATA.filter(ev => ev.type === activeScheduleFilter);
  }

  const lang = currentLang;
  container.innerHTML = filtered.map(ev => {
    const title = ev[`title_${lang}`] || ev.title_en;
    const desc  = ev.significance_en || '';
    const typeClass = ev.type === 'shahi' ? 'type-shahi' : ev.type === 'cultural' ? 'type-cultural' : 'type-religious';
    const typeLabel = ev.type === 'shahi' ? '⭐ Shahi Snan' : ev.type === 'cultural' ? '🎭 Cultural' : '🕉️ Religious';
    const calUrl  = makeCalendarUrl(ev);

    return `
      <div class="event-card ${typeClass} reveal" data-type="${ev.type}">
        <div class="event-card-inner">
          <div style="display:flex;gap:12px;align-items:flex-start;">
            <div class="event-date-badge ${ev.type === 'shahi' ? 'shahi' : ''}">
              <span class="day">${ev.day}</span>
              <span class="month">${ev.month}</span>
              <span class="year">${ev.year}</span>
            </div>
            <div style="flex:1;">
              <div class="event-tithi">${ev.tithi}</div>
              <div class="event-title">${title}</div>
              <div class="event-desc">${desc}</div>
              <div class="event-meta">
                <span><i class="fa-solid fa-location-dot"></i> ${ev.location}</span>
                <span><i class="fa-solid fa-clock"></i> ${ev.time}</span>
              </div>
            </div>
          </div>
          <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
            <span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:12px;
                         background:${ev.type==='shahi'?'rgba(255,215,0,0.15)':ev.type==='cultural'?'rgba(123,31,162,0.12)':'rgba(21,101,192,0.12)'};
                         color:${ev.type==='shahi'?'#e65100':ev.type==='cultural'?'#6a1b9a':'#1565c0'};">
              ${typeLabel}
            </span>
            <a href="${calUrl}" class="btn btn-outline btn-sm" style="padding:4px 12px;font-size:11px;">
              <i class="fa-solid fa-calendar-plus"></i>
              <span data-t="add_to_calendar">${t('add_to_calendar')}</span>
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
  if (typeof applyTranslations === 'function') applyTranslations();
}

function renderSheetSchedule(rows) {
  const container = document.getElementById('events-container');
  if (!container) return;
  let filtered = rows;
  if (activeScheduleFilter !== 'all') {
    filtered = rows.filter(r => (r['Category'] || '').toLowerCase() === activeScheduleFilter);
  }
  if (filtered.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--light-brown);">' + t('no_events') + '</div>';
    return;
  }
  container.innerHTML = filtered.map(r => {
    const cat = (r['Category'] || 'religious').toLowerCase();
    const typeClass = cat === 'shahi' ? 'type-shahi' : cat === 'cultural' ? 'type-cultural' : 'type-religious';
    const typeLabel = cat === 'shahi' ? '⭐ Shahi Snan' : cat === 'cultural' ? '🎭 Cultural' : '🕉️ Religious';
    const dateStr = String(r['Date'] || '');
    const dayNum = getSheetDay(dateStr);
    const timeVal = parseSheetTime(r['Time']);
    return `
      <div class="event-card ${typeClass} reveal">
        <div class="event-card-inner">
          ${r['Image'] ? `<img src="${r['Image']}" style="width:100%;height:140px;object-fit:cover;border-radius:8px;margin-bottom:10px;" onerror="this.style.display='none'">` : ''}
          <div style="display:flex;gap:12px;align-items:flex-start;">
            <div class="event-date-badge ${cat === 'shahi' ? 'shahi' : ''}">
              <span class="day">${dayNum}</span>
              <span class="month">${getShortMonth(dateStr)}</span>
              <span class="year">2027</span>
            </div>
            <div style="flex:1;">
              <div class="event-title">${r['Event'] || ''}</div>
              <div class="event-desc">${r['Description'] || ''}</div>
              <div class="event-meta">
                ${r['Location'] ? `<span><i class="fa-solid fa-location-dot"></i> ${r['Location']}</span>` : ''}
                ${timeVal ? `<span><i class="fa-solid fa-clock"></i> ${timeVal}</span>` : ''}
              </div>
            </div>
          </div>
          <div style="margin-top:10px;">
            <span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:12px;
                         background:${cat==='shahi'?'rgba(255,215,0,0.15)':cat==='cultural'?'rgba(123,31,162,0.12)':'rgba(21,101,192,0.12)'};
                         color:${cat==='shahi'?'#e65100':cat==='cultural'?'#6a1b9a':'#1565c0'};">
              ${typeLabel}
            </span>
          </div>
        </div>
      </div>
    `;
  }).join('');
  if (typeof applyTranslations === 'function') applyTranslations();
}

function fetchAndRenderSchedule() {
  const container = document.getElementById('events-container');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:40px;color:#FF6F00;">📅 ' + t('loading') + '</div>';
  fetch(GAS_URL + '?sheet=Schedule')
    .then(r => r.json())
    .then(rows => {
      if (!rows || rows.length === 0) { renderSchedule(); return; }
      window._scheduleCache = rows;
      renderSheetSchedule(rows);
    })
    .catch(() => renderSchedule());
}

function makeCalendarUrl(ev) {
  const dateStr = ev.date.replace(/-/g, '');
  const title = encodeURIComponent(ev.title_en + ' — Kumbh Nashik 2027');
  const details = encodeURIComponent(ev.significance_en || '');
  const loc = encodeURIComponent(ev.location);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${details}&location=${loc}`;
}

function initSchedule() {
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeScheduleFilter = chip.dataset.filter;
      if (window._scheduleCache && window._scheduleCache.length > 0) {
        renderSheetSchedule(window._scheduleCache);
      } else {
        renderSchedule();
      }
    });
  });
  fetchAndRenderSchedule();
}

/* ── STAY PAGE ──────────────────────────────────────────
   Real data only. No hardcoded fallback.
   Root bug fixed: GAS returns Phone as a NUMBER — always
   coerce to String before calling .replace() on it.
   ───────────────────────────────────────────────────── */
var activeStayFilter = 'all';
window._stayCache = null;

function _stayPhoneStr(raw) {
  /* GAS may send Phone as number or string — always return a string */
  return String(raw == null ? '' : raw).replace(/[^0-9+]/g, '');
}

function _stayCategoryFromType(typeStr) {
  var v = String(typeStr || '').toLowerCase().trim();
  if (!v) return 'hotel';
  if (v === 'dharamshala') return 'dharam';
  return v; /* hotel / budget / camping unchanged */
}

function _stayCard(s) {
  var rating = isNaN(s.rating) ? 3.5 : Number(s.rating);
  var full   = Math.floor(rating);
  var stars  = '★'.repeat(full) + ((rating - full) >= 0.5 ? '½' : '');
  var phone  = _stayPhoneStr(s.phone);

  return (
    '<div class="listing-card' + (s.sponsored ? ' sponsored' : '') + ' reveal">' +
      (s.image
        ? '<div class="stay-card-image">' +
            '<img src="' + s.image + '" alt="' + s.name + '" loading="lazy" onerror="this.style.display=\'none\'">' +
            '<div class="stay-card-overlay"></div>' +
            (s.sponsored
              ? '<div class="stay-badges"><span class="listing-sponsored-badge">' +
                  '<i class="fa-solid fa-star"></i> ' + t('sponsored_tag') +
                '</span></div>'
              : '') +
          '</div>'
        : '') +
      '<div class="listing-card-header">' +
        '<div>' +
          '<div class="listing-name">' + s.name + '</div>' +
          '<div class="listing-meta">' +
            '<span><i class="fa-solid fa-hotel"></i> ' + (s.type || '') + '</span>' +
            (s.address ? '<span><i class="fa-solid fa-map-marker-alt"></i> ' + s.address + '</span>' : '') +
          '</div>' +
          '<div class="stars">' + stars + '</div>' +
        '</div>' +
        '<div class="listing-price">' + (s.price || '') +
          '<br><span style="font-size:10px;color:var(--light-brown);font-weight:400;">' + t('per_night') + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="listing-card-body">' +
        '<p style="font-size:12px;color:var(--light-brown);line-height:1.6;margin-bottom:8px;">' + (s.description || '') + '</p>' +
      '</div>' +
      '<div class="listing-card-footer">' +
        '<a href="tel:' + phone + '" class="btn btn-primary btn-sm" style="flex:1;">' +
          '<i class="fa-solid fa-phone"></i> ' + t('book_contact') +
        '</a>' +
        (phone
          ? '<a href="https://wa.me/' + phone + '" target="_blank" rel="noopener" class="btn btn-whatsapp btn-sm">' +
              '<i class="fa-brands fa-whatsapp"></i>' +
            '</a>'
          : '') +
      '</div>' +
    '</div>'
  );
}

function renderStay(staysArray) {
  var container = document.getElementById('stay-container');
  if (!container) return;

  var source = staysArray || window._stayCache || [];

  var filtered = (activeStayFilter === 'all')
    ? source.slice()
    : source.filter(function(s) { return s.category === activeStayFilter; });

  filtered.sort(function(a, b) { return (b.sponsored ? 1 : 0) - (a.sponsored ? 1 : 0); });

  if (!filtered.length) {
    container.innerHTML =
      '<div style="text-align:center;padding:40px;color:var(--light-brown);">' +
      '<i class="fa-solid fa-bed" style="font-size:28px;opacity:0.4;"></i>' +
      '<p style="margin-top:10px;">' + t('no_results') + '</p></div>';
    return;
  }

  try {
    container.innerHTML = filtered.map(_stayCard).join('');
  } catch (e) {
    console.error('[KumbhSathi] renderStay error:', e);
    container.innerHTML =
      '<div style="text-align:center;padding:30px;color:#b71c1c;font-size:13px;">Render error: ' + e.message + '</div>';
    return;
  }

  if (typeof applyTranslations === 'function') applyTranslations();
}

function fetchAndRenderStay() {
  var container = document.getElementById('stay-container');
  if (!container) return;

  container.innerHTML =
    '<div style="text-align:center;padding:40px;color:var(--saffron);">' +
    '<i class="fa-solid fa-bed" style="font-size:28px;"></i>' +
    '<p style="margin-top:10px;font-size:13px;">Loading accommodations…</p></div>';

  fetch(GAS_URL + '?sheet=Stay')
    .then(function(res) { return res.json(); })
    .then(function(rows) {
      console.log('[KumbhSathi Stay] GAS response:', rows); /* DEBUG — remove once confirmed */

      if (!Array.isArray(rows)) {
        /* GAS returned an error object */
        throw new Error('Not an array: ' + JSON.stringify(rows).slice(0, 120));
      }

      if (rows.length === 0) {
        container.innerHTML =
          '<div style="text-align:center;padding:40px;color:var(--light-brown);">' +
          '<i class="fa-solid fa-bed" style="font-size:28px;opacity:0.4;"></i>' +
          '<p style="margin-top:10px;">No accommodations available yet. Check back soon.</p></div>';
        return;
      }

      var stays = rows.map(function(r, i) {
        return {
          id:          'stay-' + i,
          name:        String(r['Name']        || ''),
          type:        String(r['Type']        || '').trim(),
          category:    _stayCategoryFromType(r['Type']),
          address:     String(r['Address']     || ''),
          price:       String(r['Price']       || ''),
          phone:       r['Phone'],                 /* kept raw — _stayPhoneStr handles number/string */
          rating:      parseFloat(r['Rating'])  || 3.5,
          description: String(r['Description'] || ''),
          image:       String(r['Image']       || ''),
          sponsored:   (r['Sponsored'] === true || r['Sponsored'] === 'TRUE' || r['Sponsored'] === 'true'),
        };
      });

      window._stayCache = stays;
      renderStay(stays);
    })
    .catch(function(err) {
      /* Network/parse failure — show error message, NEVER leave spinner */
      console.error('[KumbhSathi Stay] fetch failed:', err);
      container.innerHTML =
        '<div style="text-align:center;padding:30px;color:#b71c1c;">' +
        '<i class="fa-solid fa-triangle-exclamation" style="font-size:28px;"></i>' +
        '<p style="margin-top:10px;font-size:12px;word-break:break-word;">' +
          'Error loading accommodations: ' + (err.message || err) +
        '</p>' +
        '<button onclick="fetchAndRenderStay()" ' +
          'style="margin-top:12px;padding:8px 20px;background:var(--saffron);color:#fff;' +
                 'border:none;border-radius:20px;font-size:13px;cursor:pointer;">' +
          'Try again' +
        '</button></div>';
    });
}

function initStay() {
  document.querySelectorAll('.stay-filter-chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      document.querySelectorAll('.stay-filter-chip').forEach(function(c) { c.classList.remove('active'); });
      chip.classList.add('active');
      activeStayFilter = chip.dataset.filter;
      renderStay(window._stayCache || null);
    });
  });
  fetchAndRenderStay();
}

/* ===== TRANSPORT PAGE ===== */
function initTransport() {
  renderTransport();
  document.querySelectorAll('.transport-mode-header').forEach(header => {
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      const isOpen = body.classList.contains('open');
      document.querySelectorAll('.transport-mode-body').forEach(b => b.classList.remove('open'));
      document.querySelectorAll('.transport-mode-header').forEach(h => h.classList.remove('open'));
      if (!isOpen) {
        body.classList.add('open');
        header.classList.add('open');
      }
    });
  });
}

function renderTransport() {
  const localContainer = document.getElementById('local-transport-container');
  if (localContainer) {
    localContainer.innerHTML = TRANSPORT_DATA.local.map(item => `
      <div class="transport-route">
        <div class="transport-route-icon"><i class="fa-solid ${item.icon}"></i></div>
        <div class="transport-route-info">
          <h4>${item.mode}</h4>
          <p>${item.route}</p>
          <p><strong>Frequency:</strong> ${item.frequency}</p>
          <div class="route-tags">
            <span class="route-tag"><i class="fa-solid fa-tag"></i> ${item.cost}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  const trainContainer = document.getElementById('train-routes-container');
  if (trainContainer) {
    trainContainer.innerHTML = TRANSPORT_DATA.byTrain.map(r => `
      <div class="transport-route">
        <div class="transport-route-icon"><i class="fa-solid fa-train"></i></div>
        <div class="transport-route-info">
          <h4>${r.route}</h4>
          <p>${r.info}</p>
          <div class="route-tags">
            <span class="route-tag">⏱ ${r.duration}</span>
            <span class="route-tag">💰 ${r.cost}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  const busContainer = document.getElementById('bus-routes-container');
  if (busContainer) {
    busContainer.innerHTML = TRANSPORT_DATA.byBus.map(r => `
      <div class="transport-route">
        <div class="transport-route-icon"><i class="fa-solid fa-bus"></i></div>
        <div class="transport-route-info">
          <h4>${r.route}</h4>
          <p>${r.info}</p>
          <div class="route-tags">
            <span class="route-tag">⏱ ${r.duration}</span>
            <span class="route-tag">💰 ${r.cost}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  const airContainer = document.getElementById('air-routes-container');
  if (airContainer) {
    airContainer.innerHTML = TRANSPORT_DATA.byAir.map(r => `
      <div class="transport-route">
        <div class="transport-route-icon"><i class="fa-solid fa-plane"></i></div>
        <div class="transport-route-info">
          <h4>${r.airport}</h4>
          <p>${r.info}</p>
          ${r.dist ? `<div class="route-tags"><span class="route-tag">📍 ${r.dist}</span></div>` : ''}
        </div>
      </div>
    `).join('');
  }

  const roadContainer = document.getElementById('road-routes-container');
  if (roadContainer) {
    roadContainer.innerHTML = TRANSPORT_DATA.byRoad.map(r => `
      <div class="transport-route">
        <div class="transport-route-icon"><i class="fa-solid fa-car"></i></div>
        <div class="transport-route-info">
          <h4>${r.route}</h4>
          <p><strong>${r.highway}</strong></p>
          <p>${r.info}</p>
          <div class="route-tags">
            <span class="route-tag">⏱ ${r.duration}</span>
            <span class="route-tag">📍 ${r.dist}</span>
          </div>
        </div>
      </div>
    `).join('');
  }
}

/* ===== EMERGENCY PAGE ===== */
function initEmergency() {
  renderHospitals();
  renderFirstAid();
}

function renderHospitals() {
  const container = document.getElementById('hospitals-container');
  if (!container) return;
  container.innerHTML = HOSPITALS_DATA.map(h => `
    <div class="hospital-card">
      <div class="hospital-icon"><i class="fa-solid fa-hospital"></i></div>
      <div class="hospital-info">
        <div class="hospital-name">${h.name}</div>
        <div class="hospital-addr"><i class="fa-solid fa-location-dot"></i> ${h.addr}</div>
      </div>
      <a href="tel:${h.phone.replace(/[^0-9]/g,'')}" class="btn btn-primary btn-sm" style="flex-shrink:0;">
        <i class="fa-solid fa-phone"></i>
      </a>
    </div>
  `).join('');
}

function renderFirstAid() {
  const container = document.getElementById('first-aid-container');
  if (!container) return;
  container.innerHTML = FIRST_AID_DATA.map((item, i) => `
    <div class="first-aid-item">
      <div class="first-aid-header" id="fa-header-${i}">
        <i class="fa-solid fa-kit-medical main-icon"></i>
        <h4>${item.title_en} / ${item.title_hi}</h4>
        <i class="fa-solid fa-chevron-down toggle"></i>
      </div>
      <div class="first-aid-body" id="fa-body-${i}">
        <ul>
          ${item.tips_en.map(tip => `<li>${tip}</li>`).join('')}
        </ul>
      </div>
    </div>
  `).join('');
  document.querySelectorAll('.first-aid-header').forEach(header => {
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      const isOpen = body.classList.contains('open');
      document.querySelectorAll('.first-aid-body').forEach(b => b.classList.remove('open'));
      document.querySelectorAll('.first-aid-header').forEach(h => h.classList.remove('open'));
      if (!isOpen) {
        body.classList.add('open');
        header.classList.add('open');
      }
    });
  });
  if (typeof applyTranslations === 'function') applyTranslations();
}

function shareLocation() {
  if (!navigator.geolocation) {
    showToast('Geolocation not supported on this device.');
    return;
  }
  navigator.geolocation.getCurrentPosition(pos => {
    const url = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
    window.open(url, '_blank');
  }, () => {
    showToast('Could not get location. Please allow location access.');
  });
}

/* ===== LOST & FOUND PAGE — handled by scripts/lostfound.js ===== */

/* ===== NEWS PAGE ===== */
let activeNewsCategory = 'all';

function renderNews(newsArray) {
  const container = document.getElementById('news-container');
  if (!container) return;
  const data = newsArray || window._newsCache || [];
  let filtered = data;
  if (activeNewsCategory !== 'all') {
    filtered = data.filter(n => n.category === activeNewsCategory);
  }
  if (!filtered.length) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--light-brown);">' + t('no_news') + '</div>';
    return;
  }
  const lang = currentLang;
  container.innerHTML = filtered.map(n => {
    const headline = n[`headline_${lang}`] || n.headline_en || n.title || '';
    const short    = n[`short_${lang}`]    || n.short_en || n.description || '';
    const catColors = { announce:'#FF6F00', vip:'#6a1b9a', weather:'#1565c0', traffic:'#e65100' };
    const catLabels = { announce:'📢 Announcement', vip:'⭐ VIP', weather:'🌧 Weather', traffic:'🚗 Traffic' };

    return `
      <div class="news-card reveal" onclick="toggleNewsCard(this)">
        ${n.image ? `
        <div class="news-card-image">
          <img src="${n.image}" alt="${headline}" loading="lazy" onerror="this.style.display='none'">
          <span class="news-card-category" style="background:${catColors[n.category]||'#FF6F00'};">
            ${catLabels[n.category] || n.category}
          </span>
        </div>` : ''}
        <div class="news-card-content">
          <div class="news-card-title">${headline}</div>
          <div class="news-card-date"><i class="fa-solid fa-calendar-days"></i> ${n.date || ''}</div>
          <div class="news-card-desc">${short}</div>
          <div class="news-card-expanded">${n.full_en || short}</div>
          <button class="btn btn-outline btn-sm" style="margin-top:8px;font-size:11px;" onclick="event.stopPropagation();toggleNewsCard(this.closest('.news-card'))">
            <i class="fa-solid fa-chevron-down"></i>
            <span class="read-more-label" data-t="read_more">${t('read_more')}</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
  if (typeof applyTranslations === 'function') applyTranslations();
}

function toggleNewsCard(card) {
  const expanded = card.querySelector('.news-card-expanded');
  const label    = card.querySelector('.read-more-label');
  const isOpen   = expanded.classList.contains('open');
  expanded.classList.toggle('open');
  if (label) label.textContent = isOpen ? t('read_more') : t('read_less');
}

function fetchAndRenderNews() {
  const container = document.getElementById('news-container');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:40px;color:#FF6F00;">📰 ' + t('loading') + '</div>';
  fetch(GAS_URL + '?sheet=News')
    .then(r => r.json())
    .then(rows => {
      if (!rows || rows.length === 0) {
        renderNews(NEWS_DATA);
        return;
      }
      const news = rows.map((r, i) => ({
        id: 'n' + i,
        category: (r['Category'] || 'announce').toLowerCase(),
        headline_en: r['Headline_EN'] || '',
        headline_hi: r['Headline_HI'] || r['Headline_EN'] || '',
        headline_mr: r['Headline_MR'] || r['Headline_EN'] || '',
        short_en: r['Short_EN'] || '',
        short_hi: r['Short_HI'] || r['Short_EN'] || '',
        short_mr: r['Short_MR'] || r['Short_EN'] || '',
        full_en: r['Short_EN'] || '',
        date: r['Date'] || '',
        image: r['Image'] || ''
      }));
      window._newsCache = news;
      renderNews(news);
    })
    .catch(() => {
      renderNews(NEWS_DATA);
    });
}

function initNews() {
  document.querySelectorAll('.news-filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.news-filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeNewsCategory = chip.dataset.cat;
      renderNews(window._newsCache || NEWS_DATA);
    });
  });
  fetchAndRenderNews();
}

/* ===== AKHARAS PAGE ===== */
function renderAkharas() {
  const container = document.getElementById('akharas-container');
  if (!container) return;
  container.innerHTML = AKHARAS_DATA.map(a => `
    <div class="akhara-card reveal">
      <div class="akhara-icon">${a.icon}</div>
      <div style="flex:1;">
        <div class="akhara-name">${a.name}</div>
        <div class="akhara-type">${a.type}</div>
        <div class="akhara-desc">${a.desc_en}</div>
        <div class="akhara-location">
          <i class="fa-solid fa-location-dot"></i> ${a.camp}
        </div>
        <div style="font-size:11px;color:var(--light-brown);margin-top:3px;">
          <i class="fa-solid fa-om"></i> Deity: ${a.deity} &nbsp;|&nbsp; ${a.est}
        </div>
      </div>
    </div>
  `).join('');
  if (typeof applyTranslations === 'function') applyTranslations();
}

function fetchAndRenderAkharas() {
  const container = document.getElementById('akharas-container');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:40px;color:#FF6F00;">🕉️ ' + t('loading') + '</div>';
  fetch(GAS_URL + '?sheet=Akharas')
    .then(r => r.json())
    .then(rows => {
      if (!rows || rows.length === 0) { renderAkharas(); return; }
      container.innerHTML = rows.map(r => `
        <div class="akhara-card reveal">
          ${r['Image'] ? `<img src="${r['Image']}" style="width:56px;height:56px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none'">` : '<div class="akhara-icon">🕉️</div>'}
          <div style="flex:1;">
            <div class="akhara-name">${r['Name'] || ''}</div>
            <div class="akhara-type">${r['Location'] || ''}</div>
            <div class="akhara-desc">${r['Description'] || ''}</div>
            ${r['Location'] ? `<div class="akhara-location"><i class="fa-solid fa-location-dot"></i> ${r['Location']}</div>` : ''}
            ${r['Founded'] ? `<div style="font-size:11px;color:var(--light-brown);margin-top:3px;"><i class="fa-solid fa-calendar"></i> Est: ${r['Founded']}</div>` : ''}
            ${r['Significance'] ? `<div style="font-size:11px;color:var(--light-brown);line-height:1.5;margin-top:4px;">${r['Significance']}</div>` : ''}
          </div>
        </div>
      `).join('');
      if (typeof applyTranslations === 'function') applyTranslations();
    })
    .catch(() => renderAkharas());
}

/* ===== MANAGED AD SLOTS ===== */
function fetchAndRenderAds() {
  fetch(GAS_URL + '?sheet=Ads')
    .then(function(r) { return r.json(); })
    .then(function(rows) {
      if (!rows || !Array.isArray(rows)) return;
      var active = rows.filter(function(r) {
        return r['Active'] === true || r['Active'] === 'TRUE' || r['Active'] === 'true';
      });
      ['home', 'map'].forEach(function(slotName) {
        var el = document.getElementById(slotName + '-ad-slot');
        if (!el) return;
        var ad = null;
        for (var i = 0; i < active.length; i++) {
          if ((active[i]['Slot'] || '').toLowerCase().trim() === slotName) { ad = active[i]; break; }
        }
        if (!ad) { el.style.display = 'none'; return; }
        el.style.display = 'block';
        var bg = ad['BgColor'] || 'linear-gradient(135deg,#FF6F00,#E64A19)';
        el.innerHTML =
          '<a href="' + (ad['Link'] || '#') + '" target="_blank" rel="noopener" ' +
          'style="display:flex;align-items:center;gap:12px;padding:12px 14px;' +
          'background:' + bg + ';border-radius:var(--radius-md);text-decoration:none;' +
          'box-shadow:0 2px 10px rgba(255,111,0,0.25);">' +
          (ad['Image'] ? '<img src="' + ad['Image'] + '" style="width:44px;height:44px;object-fit:contain;border-radius:8px;background:#fff;padding:4px;flex-shrink:0;" onerror="this.style.display=\'none\'">' : '') +
          '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:9px;color:rgba(255,255,255,0.75);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;" data-t="home_ad_label">Sponsored</div>' +
          '<div style="font-size:13px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (ad['Title'] || '') + '</div>' +
          '</div>' +
          '<i class="fa-solid fa-chevron-right" style="color:rgba(255,255,255,0.7);flex-shrink:0;"></i>' +
          '</a>';
      });
    })
    .catch(function() {
      ['home-ad-slot', 'map-ad-slot'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
    });
}

/* ===== ABOUT PAGE ===== */
function fetchAndRenderSponsors() {
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbyp_E-2tqiBfAtswJIxIeeq2iH6gwMjjlPZwlxxijqU6RdfZW8UOlcM83Gd9Yay7ZbufQ/exec';
  const container = document.getElementById('sponsors-container');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:20px;color:#FF6F00;">Loading...</div>';
  fetch(GAS_URL + '?sheet=Sponsors')
    .then(r => r.json())
    .then(rows => {
      const active = rows.filter(r => r['Active'] === true || r['Active'] === 'TRUE');
      if (!active.length) { container.innerHTML = ''; return; }
      container.innerHTML = active.map(s => `
        <a href="${s['Website'] || '#'}" target="_blank" style="display:inline-block;margin:8px;text-align:center;text-decoration:none;">
          <div style="background:#fff;border-radius:12px;padding:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);min-width:120px;">
            <img src="${s['Logo']}" alt="${s['Name']}" style="height:50px;object-fit:contain;" onerror="this.style.display='none'">
            <div style="font-size:11px;color:#FF6F00;font-weight:600;margin-top:6px;">${s['Name']}</div>
            <div style="font-size:10px;color:#666;">${s['Tagline'] || ''}</div>
          </div>
        </a>`).join('');
    })
    .catch(() => { container.innerHTML = ''; });
}

function renderAbout() {
  const g = document.getElementById('gallery-container');
  if (g) {
    g.innerHTML = GALLERY_IMAGES.map(img => `
      <div class="gallery-item">
        <img src="${img.src}" alt="${img.alt}" loading="lazy">
        <div class="gallery-overlay"></div>
      </div>
    `).join('');
  }
  fetchAndRenderSponsors();
  const about1 = document.getElementById('about-content-1');
  if (about1) about1.textContent = ABOUT_CONTENT.what_is_kumbh_en;
  const about2 = document.getElementById('about-content-2');
  if (about2) about2.textContent = ABOUT_CONTENT.nashik_special_en;
  const about3 = document.getElementById('about-content-3');
  if (about3) about3.textContent = ABOUT_CONTENT.shahi_significance_en;
}

/* ===== NEWS TICKER ===== */
function initTicker() {
  const el = document.getElementById('ticker-content');
  if (!el) return;
  const items = TICKER_ITEMS[currentLang] || TICKER_ITEMS.hi;
  el.textContent = items.join('   •••   ');
}

/* ===== TOAST NOTIFICATION ===== */
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

/* ===== WHATSAPP SHARE APP ===== */
function shareAppWhatsApp() {
  const msg = encodeURIComponent('Check out KumbhSathi app for Kumbh Mela Nashik 2027! 🙏 https://Sam102009.github.io/Kumbh-Sathi/');
  window.open('https://wa.me/?text=' + msg, '_blank');
}

/* ===== LANGUAGE SWITCHER ===== */
function initLangSwitcher() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setLang(btn.dataset.lang);
      // Re-render all dynamic content with new language
      renderSchedule();
      if (window._scheduleCache && window._scheduleCache.length) renderSheetSchedule(window._scheduleCache);
      renderNews(window._newsCache || NEWS_DATA);
      renderAkharas();
      renderStay(window._stayCache || null);
      initTicker();
      // Sync second ticker on news page
      var t2 = document.getElementById('ticker-content-2');
      if (t2) {
        var items = TICKER_ITEMS[currentLang] || TICKER_ITEMS['hi'];
        t2.textContent = items.join('   •••   ');
      }
      // Final pass to catch any remaining data-t elements
      if (typeof applyTranslations === 'function') applyTranslations();
    });
  });
}

/* ===== DARK MODE ===== */
function initDarkMode() {
  var saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.body.classList.add('dark-mode');
    var btn = document.getElementById('dark-mode-toggle');
    if (btn) btn.textContent = '☀️';
  }
}

function toggleDarkMode() {
  var isDark = document.body.classList.toggle('dark-mode');
  var btn = document.getElementById('dark-mode-toggle');
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

/* ===== PWA INSTALL PROMPT ===== */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
});

/* ===== MAIN APP INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  initLangSwitcher();
  updateCountdown();
  setInterval(updateCountdown, 1000);
  initTicker();
  initRouter();
  initSchedule();
  initStay();
  initTransport();
  initLostFound();
  initNews();
  initEmergency();
  initCrowd();
  fetchAndRenderAkharas();
  renderAbout();
  fetchAndRenderAds();
  if (typeof initChatbot === 'function') initChatbot();
});

/* Watch for crowd page activation */
(function() {
  var crowdPage = document.getElementById('page-crowd');
  if (!crowdPage) return;
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      if (crowdPage.classList.contains('active')) {
        setTimeout(function() {
          if (typeof renderCrowd === 'function') renderCrowd();
        }, 100);
      }
    });
  });
  observer.observe(crowdPage, { attributes: true, attributeFilter: ['class'] });
})();

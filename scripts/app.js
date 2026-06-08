/* ===================================================
   KumbhSathi — Main App Logic
   Kumbh Mela Nashik 2027 PWA
   =================================================== */

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

function renderSchedule() {
  const container = document.getElementById('events-container');
  if (!container) return;

  let filtered = EVENTS_DATA;
  if (activeScheduleFilter !== 'all') {
    filtered = EVENTS_DATA.filter(ev => ev.type === activeScheduleFilter);
  }

  container.innerHTML = filtered.map(ev => {
    const lang = currentLang;
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
              <span data-t="add_to_calendar">Add to Calendar</span>
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
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
      renderSchedule();
    });
  });
  renderSchedule();
}

/* ===== STAY PAGE ===== */
let activeStayFilter = 'all';

function renderStay() {
  const container = document.getElementById('stay-container');
  if (!container) return;

  let filtered = STAY_DATA;
  if (activeStayFilter !== 'all') {
    filtered = STAY_DATA.filter(s => s.category === activeStayFilter);
  }

  container.innerHTML = filtered.map(s => {
    const stars = '★'.repeat(Math.floor(s.rating)) + (s.rating % 1 >= 0.5 ? '½' : '');
    const facilities = s.facilities.map(f =>
      `<span style="font-size:10px;background:rgba(255,111,0,0.08);color:var(--saffron);
                    padding:2px 7px;border-radius:8px;border:1px solid rgba(255,111,0,0.18);">${f}</span>`
    ).join('');

    return `
      <div class="listing-card${s.sponsored ? ' sponsored' : ''} reveal">
        <div class="stay-card-image">
          <img src="${s.image}" alt="${s.name}" loading="lazy">
          <div class="stay-card-overlay"></div>
          <div class="stay-badges">
            ${s.sponsored ? '<span class="sponsored-badge"><i class="fa-solid fa-star"></i> Sponsored</span>' : ''}
          </div>
        </div>
        <div class="listing-card-header">
          <div>
            <div class="listing-name">${s.name}</div>
            <div class="listing-meta">
              <span><i class="fa-solid fa-hotel"></i> ${s.type}</span>
              <span><i class="fa-solid fa-map-marker-alt"></i> ${s.distance}</span>
            </div>
            <div class="stars">${stars}</div>
          </div>
          <div class="listing-price">${s.price}<br><span style="font-size:10px;color:var(--light-brown);font-weight:400;">per night</span></div>
        </div>
        <div class="listing-card-body">
          <p style="font-size:12px;color:var(--light-brown);line-height:1.6;margin-bottom:8px;">${s.description}</p>
          <div style="display:flex;flex-wrap:wrap;gap:4px;">${facilities}</div>
        </div>
        <div class="listing-card-footer">
          <a href="tel:${s.contact.replace(/\s/g,'')}" class="btn btn-primary btn-sm" style="flex:1;">
            <i class="fa-solid fa-phone"></i> Book / Contact
          </a>
          <a href="https://wa.me/${s.contact.replace(/[^0-9]/g,'')}" target="_blank" rel="noopener"
             class="btn btn-whatsapp btn-sm">
            <i class="fa-brands fa-whatsapp"></i>
          </a>
        </div>
      </div>
    `;
  }).join('');
}

function initStay() {
  document.querySelectorAll('.stay-filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.stay-filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeStayFilter = chip.dataset.filter;
      renderStay();
    });
  });
  renderStay();
}

/* ===== TRANSPORT PAGE ===== */
function initTransport() {
  // Build transport sections dynamically
  renderTransport();
  // Accordion toggles
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
  // Render local transport cards
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

  // Render by-train routes
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

  // Render by-bus routes
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

  // Render by-air
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

  // Render by-road
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
  // Re-attach events
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
  const lang = currentLang;
  container.innerHTML = filtered.map(n => {
    const headline = n[`headline_${lang}`] || n.headline_en;
    const short    = n[`short_${lang}`]    || n.short_en;
    const catColors = { announce:'#FF6F00', vip:'#6a1b9a', weather:'#1565c0', traffic:'#e65100' };
    const catLabels = { announce:'📢 Announcement', vip:'⭐ VIP', weather:'🌧 Weather', traffic:'🚗 Traffic' };

    return `
      <div class="news-card reveal" onclick="toggleNewsCard(this)">
        <div class="news-card-image">
          <img src="${n.image}" alt="${headline}" loading="lazy">
          <span class="news-card-category" style="background:${catColors[n.category]||'#FF6F00'};">
            ${catLabels[n.category] || n.category}
          </span>
        </div>
        <div class="news-card-content">
          <div class="news-card-title">${headline}</div>
          <div class="news-card-date"><i class="fa-solid fa-calendar-days"></i> ${n.date}</div>
          <div class="news-card-desc">${short}</div>
          <div class="news-card-expanded">${n.full_en}</div>
          <button class="btn btn-outline btn-sm" style="margin-top:8px;font-size:11px;" onclick="event.stopPropagation();toggleNewsCard(this.closest('.news-card'))">
            <i class="fa-solid fa-chevron-down"></i>
            <span class="read-more-label" data-t="read_more">Read More</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function toggleNewsCard(card) {
  const expanded = card.querySelector('.news-card-expanded');
  const label    = card.querySelector('.read-more-label');
  const isOpen   = expanded.classList.contains('open');
  expanded.classList.toggle('open');
  if (label) label.textContent = isOpen ? t('read_more') : t('read_less');
}

function fetchAndRenderNews() {
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbyp_E-2tqiBfAtswJIxIeeq2iH6gwMjjlPZwlxxijqU6RdfZW8UOlcM83Gd9Yay7ZbufQ/exec';
  const container = document.getElementById('news-container');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:40px;color:#FF6F00;">Loading news...</div>';
  fetch(GAS_URL + '?sheet=News')
    .then(r => r.json())
    .then(rows => {
      if (!rows || rows.length < 2) {
        container.innerHTML = '<div style="padding:20px;color:#FF6F00;">No news found in sheet.</div>';
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
        date: r['Date'] || '',
        image: r['Image'] || ''
      }));
      window._newsCache = news;
      renderNews(news);
    })
    .catch((err) => {
      container.innerHTML = '<div style="padding:20px;color:red;">Failed: ' + err + '</div>';
    });
}

function initNews() {
  document.querySelectorAll('.news-filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.news-filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeNewsCategory = chip.dataset.cat;
      renderNews();
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
}

/* ===== ABOUT PAGE ===== */
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
  function updateTicker() {
    const items = TICKER_ITEMS[currentLang] || TICKER_ITEMS.hi;
    el.textContent = items.join('   •••   ');
  }
  updateTicker();
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

/* ===== LANGUAGE SWITCHER ===== */
function initLangSwitcher() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setLang(btn.dataset.lang);
      // Re-render dynamic content with new language
      renderSchedule();
      renderNews();
      renderAkharas();
      initTicker();
    });
  });
}

/* ===== PWA INSTALL PROMPT ===== */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  // Could show a custom install button here
});


/* ===== HOME PAGE QUICK CARDS ===== */
function initQuickCards() {
  // Already handled via data-nav attributes in router.js
}

/* ===== MAIN APP INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  // Language switcher
  initLangSwitcher();

  // Countdown timer
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // News ticker
  initTicker();

  // Router
  initRouter();

  // Initialize page-specific content
initSchedule();
initStay();
initTransport();
initLostFound();
initNews();
initEmergency();

initCrowd(); // ← ADD THIS LINE

renderAkharas();
renderAbout();

  // Update ticker when language changes
  const originalSetLang = window.setLang || function(){};
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

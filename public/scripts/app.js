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
    const localized = EVENT_TRANSLATIONS[ev.id] && EVENT_TRANSLATIONS[ev.id][lang];
    const title = ev[`title_${lang}`] || (lang === 'en' ? ev.title_en : t('translation_unavailable'));
    const desc = lang === 'en'
      ? (ev.significance_en || '')
      : (localized && localized.significance) || t('translation_unavailable');
    const tithi = (localized && localized.tithi) || ev.tithi;
    const locale = ({ en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' })[lang] || 'en-IN';
    const month = lang === 'en'
      ? ev.month
      : new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' })
        .format(new Date(ev.date + 'T12:00:00Z'));
    const typeClass = ev.type === 'shahi' ? 'type-shahi' : ev.type === 'cultural' ? 'type-cultural' : 'type-religious';
    const typeKey = ev.type === 'shahi' ? 'event_type_shahi' : ev.type === 'cultural' ? 'event_type_cultural' : 'event_type_religious';
    const typeLabel = t(typeKey);
    const calUrl  = makeCalendarUrl(ev);

    return `
      <div class="event-card ${typeClass} reveal" data-type="${ev.type}">
        <div class="event-card-inner">
          <div style="display:flex;gap:12px;align-items:flex-start;">
            <div class="event-date-badge ${ev.type === 'shahi' ? 'shahi' : ''}">
              <span class="day">${ev.day}</span>
              <span class="month">${month}</span>
              <span class="year">${ev.year}</span>
            </div>
            <div style="flex:1;">
              <div class="event-tithi">${tithi}</div>
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
  if (typeof applyTranslations === 'function') applyTranslations();
}

function makeCalendarUrl(ev) {
  const dateStr = ev.date.replace(/-/g, '');
  const localized = EVENT_TRANSLATIONS[ev.id] && EVENT_TRANSLATIONS[ev.id][currentLang];
  const title = encodeURIComponent((ev[`title_${currentLang}`] || ev.title_en) + ' — Kumbh Nashik 2027');
  const details = encodeURIComponent(currentLang === 'en' ? (ev.significance_en || '') : ((localized && localized.significance) || ''));
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
    const lang = currentLang || 'en';
    const stars = '★'.repeat(Math.floor(s.rating)) + (s.rating % 1 >= 0.5 ? '½' : '');
    const types = {
      Hotel: { hi: 'होटल', mr: 'हॉटेल' },
      Resort: { hi: 'रिसॉर्ट', mr: 'रिसॉर्ट' },
      Dharamshala: { hi: 'धर्मशाला', mr: 'धर्मशाळा' },
      Camping: { hi: 'कैंप', mr: 'कॅम्प' },
      Camp: { hi: 'कैंप', mr: 'कॅम्प' },
      'Guest House': { hi: 'गेस्ट हाउस', mr: 'अतिथिगृह' },
      Ashram: { hi: 'आश्रम', mr: 'आश्रम' },
      'Tent Camp': { hi: 'टेंट कैंप', mr: 'टेंट कॅम्प' },
    };
    const type = lang === 'en' ? s.type : ((types[s.type] && types[s.type][lang]) || s.type);
    const description = lang === 'en' ? s.description :
      (s['description_' + lang] || (STAY_TRANSLATIONS[s.id] && STAY_TRANSLATIONS[s.id][lang]) || t('translation_unavailable'));
    const facilityLabels = {
      AC: { hi: 'एसी', mr: 'एसी' }, Restaurant: { hi: 'रेस्तराँ', mr: 'रेस्टॉरंट' },
      WiFi: { hi: 'वाई-फ़ाई', mr: 'वाय-फाय' }, Parking: { hi: 'पार्किंग', mr: 'पार्किंग' },
      Pool: { hi: 'स्विमिंग पूल', mr: 'स्विमिंग पूल' }, Spa: { hi: 'स्पा', mr: 'स्पा' },
      'Meals Included': { hi: 'भोजन शामिल', mr: 'भोजन समाविष्ट' }, Yoga: { hi: 'योग', mr: 'योग' },
      Meditation: { hi: 'ध्यान', mr: 'ध्यान' }, 'Common Bathrooms': { hi: 'साझा स्नानघर', mr: 'सामायिक स्नानगृहे' },
      'Safe Lockers': { hi: 'सुरक्षित लॉकर', mr: 'सुरक्षित लॉकर' }, 'AC Available': { hi: 'एसी उपलब्ध', mr: 'एसी उपलब्ध' },
      'Hot Water': { hi: 'गर्म पानी', mr: 'गरम पाणी' }, 'Fan Rooms': { hi: 'पंखे वाले कमरे', mr: 'पंख्याच्या खोल्या' },
      'Shared Bathrooms': { hi: 'साझा स्नानघर', mr: 'सामायिक स्नानगृहे' }, Meals: { hi: 'भोजन', mr: 'भोजन' },
      Security: { hi: 'सुरक्षा', mr: 'सुरक्षा' }, 'Free Meals': { hi: 'निःशुल्क भोजन', mr: 'मोफत भोजन' },
      'Puja Hall': { hi: 'पूजा कक्ष', mr: 'पूजा सभागृह' }, Gym: { hi: 'जिम', mr: 'व्यायामशाळा' },
    };
    const facilities = s.facilities.map(f =>
      `<span style="font-size:10px;background:rgba(255,111,0,0.08);color:var(--saffron);
                    padding:2px 7px;border-radius:8px;border:1px solid rgba(255,111,0,0.18);">${lang === 'en' ? f : ((facilityLabels[f] && facilityLabels[f][lang]) || f)}</span>`
    ).join('');
    const distance = lang === 'en' ? s.distance : String(s.distance || '').replace(
      /([\d.]+)\s*km from/i,
      lang === 'hi' ? '$1 किमी दूर' : '$1 किमी अंतरावर'
    );

    return `
      <div class="listing-card${s.sponsored ? ' sponsored' : ''} reveal">
        <div class="stay-card-image">
          <img src="${s.image}" alt="${s.name}" loading="lazy">
          <div class="stay-card-overlay"></div>
          <div class="stay-badges">
            ${s.sponsored ? '<span class="sponsored-badge"><i class="fa-solid fa-star"></i> ' + t('stay_sponsored_label') + '</span>' : ''}
          </div>
        </div>
        <div class="listing-card-header">
          <div>
            <div class="listing-name">${s.name}</div>
            <div class="listing-meta">
              <span><i class="fa-solid fa-hotel"></i> ${type}</span>
              <span><i class="fa-solid fa-map-marker-alt"></i> ${distance}</span>
            </div>
            <div class="stars">${stars}</div>
          </div>
          <div class="listing-price">${s.price}<br><span style="font-size:10px;color:var(--light-brown);font-weight:400;">${t('stay_per_night')}</span></div>
        </div>
        <div class="listing-card-body">
          <p style="font-size:12px;color:var(--light-brown);line-height:1.6;margin-bottom:8px;">${description}</p>
          <div style="display:flex;flex-wrap:wrap;gap:4px;">${facilities}</div>
        </div>
        <div class="listing-card-footer">
          <a href="tel:${s.contact.replace(/\s/g,'')}" class="btn btn-primary btn-sm" style="flex:1;">
            <i class="fa-solid fa-phone"></i> ${t('stay_contact')}
          </a>
          <a href="https://wa.me/${s.contact.replace(/[^0-9]/g,'')}" target="_blank" rel="noopener"
             class="btn btn-whatsapp btn-sm">
            <i class="fa-brands fa-whatsapp"></i>
          </a>
        </div>
      </div>
    `;
  }).join('');
  if (typeof applyTranslations === 'function') applyTranslations();
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
          <p><strong>${t('frequency')}:</strong> ${item.frequency}</p>
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
          <p>${r['info_' + currentLang] || r.info}</p>
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
          <p>${r['info_' + currentLang] || r.info}</p>
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
          <p>${r['info_' + currentLang] || r.info}</p>
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
          <p>${r['info_' + currentLang] || r.info}</p>
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
  const lang = currentLang || 'en';
  container.innerHTML = FIRST_AID_DATA.map((item, i) => `
    <div class="first-aid-item">
      <div class="first-aid-header" id="fa-header-${i}">
        <i class="fa-solid fa-kit-medical main-icon"></i>
        <h4>${item['title_' + lang] || item.title_en}</h4>
        <i class="fa-solid fa-chevron-down toggle"></i>
      </div>
      <div class="first-aid-body" id="fa-body-${i}">
        <ul>
          ${(item['tips_' + lang] || item.tips_en).map(tip => `<li>${tip}</li>`).join('')}
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

function renderNews() {
  const container = document.getElementById('news-container');
  if (!container) return;
  let filtered = NEWS_DATA;
  if (activeNewsCategory !== 'all') {
    filtered = NEWS_DATA.filter(n => n.category === activeNewsCategory);
  }
  const lang = currentLang;
  container.innerHTML = filtered.map(n => {
    const headline = n[`headline_${lang}`] || (lang === 'en' ? n.headline_en : t('translation_unavailable'));
    const short = n[`short_${lang}`] || (lang === 'en' ? n.short_en : t('translation_unavailable'));
    const catColors = { announce:'#FF6F00', vip:'#6a1b9a', weather:'#1565c0', traffic:'#e65100' };
    const catLabels = {
      announce: { en: '📢 Announcement', hi: '📢 घोषणा', mr: '📢 घोषणा' },
      vip: { en: '⭐ VIP', hi: '⭐ विशिष्ट अतिथि', mr: '⭐ मान्यवर' },
      weather: { en: '🌧 Weather', hi: '🌧 मौसम', mr: '🌧 हवामान' },
      traffic: { en: '🚗 Traffic', hi: '🚗 यातायात', mr: '🚗 वाहतूक' },
    };

    return `
      <div class="news-card reveal" onclick="toggleNewsCard(this)">
        <div class="news-card-image">
          <img src="${n.image}" alt="${headline}" loading="lazy">
          <span class="news-card-category" style="background:${catColors[n.category]||'#FF6F00'};">
            ${(catLabels[n.category] && catLabels[n.category][lang]) || n.category}
          </span>
        </div>
        <div class="news-card-content">
          <div class="news-card-title">${headline}</div>
          <div class="news-card-date"><i class="fa-solid fa-calendar-days"></i> ${n.date}</div>
          <div class="news-card-desc">${short}</div>
          <div class="news-card-expanded">${n['full_' + lang] || short}</div>
          <button class="btn btn-outline btn-sm" style="margin-top:8px;font-size:11px;" onclick="event.stopPropagation();toggleNewsCard(this.closest('.news-card'))">
            <i class="fa-solid fa-chevron-down"></i>
            <span class="read-more-label" data-t="read_more">Read More</span>
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

function initNews() {
  document.querySelectorAll('.news-filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.news-filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeNewsCategory = chip.dataset.cat;
      renderNews();
    });
  });
  renderNews();
}

/* ===== AKHARAS PAGE ===== */
function renderAkharas() {
  const container = document.getElementById('akharas-container');
  if (!container) return;
  const lang = currentLang || 'en';
  const types = {
    Shaiva: { en: 'Shaiva', hi: 'शैव', mr: 'शैव' },
    'Shaiva Naga': { en: 'Shaiva Naga', hi: 'शैव — नागा', mr: 'शैव — नागा' },
    Sikh: { en: 'Sikh', hi: 'सिख', mr: 'शीख' },
    Vaishnava: { en: 'Vaishnava', hi: 'वैष्णव', mr: 'वैष्णव' },
    Udaseen: { en: 'Udaseen', hi: 'उदासीन', mr: 'उदासीन' },
  };
  const deities = {
    'Lord Shiva (Kapila)': { hi: 'भगवान शिव (कपिल)', mr: 'भगवान शिव (कपिल)' },
    'Lord Dattatreya': { hi: 'भगवान दत्तात्रेय', mr: 'भगवान दत्तात्रेय' },
    'Lord Kartik': { hi: 'भगवान कार्तिकेय', mr: 'भगवान कार्तिकेय' },
    'Lord Ganesha': { hi: 'भगवान गणेश', mr: 'भगवान गणेश' },
    'Guru Granth Sahib': { hi: 'गुरु ग्रंथ साहिब', mr: 'गुरु ग्रंथ साहिब' },
    'Lord Vishnu': { hi: 'भगवान विष्णु', mr: 'भगवान विष्णू' },
    'Lord Ram & Shiva': { hi: 'भगवान राम और शिव', mr: 'भगवान राम आणि शिव' },
  };
  container.innerHTML = AKHARAS_DATA.map(a => {
    const group = ((a.type || '').match(/\(([^)]+)\)$/) || [null, ''])[1];
    const name = lang === 'en' ? a.name_en : (a['name_' + lang] || a.name);
    const description = a['desc_' + lang] || (lang === 'en' ? a.desc_en : t('translation_unavailable'));
    const type = (types[group] && types[group][lang]) || a.type;
    const deity = lang === 'en' ? a.deity : (deities[a.deity] && deities[a.deity][lang]) || a.deity;
    return `
    <div class="akhara-card reveal">
      <div class="akhara-icon">${a.icon}</div>
      <div style="flex:1;">
        <div class="akhara-name">${name}</div>
        <div class="akhara-type">${type}</div>
        <div class="akhara-desc">${description}</div>
        <div class="akhara-location">
          <i class="fa-solid fa-location-dot"></i> ${a.camp}
        </div>
        <div style="font-size:11px;color:var(--light-brown);margin-top:3px;">
          <i class="fa-solid fa-om"></i> ${t('akhara_deity')}: ${deity} &nbsp;|&nbsp; ${t('akhara_established')}: ${a.est}
        </div>
      </div>
    </div>
  `;
  }).join('');
  if (typeof applyTranslations === 'function') applyTranslations();
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
  if (about1) about1.textContent = ABOUT_CONTENT['what_is_kumbh_' + currentLang] || ABOUT_CONTENT.what_is_kumbh_en;
  const about2 = document.getElementById('about-content-2');
  if (about2) about2.textContent = ABOUT_CONTENT['nashik_special_' + currentLang] || ABOUT_CONTENT.nashik_special_en;
  const about3 = document.getElementById('about-content-3');
  if (about3) about3.textContent = ABOUT_CONTENT['shahi_significance_' + currentLang] || ABOUT_CONTENT.shahi_significance_en;
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
      renderStay();
      renderTransport();
      renderFirstAid();
      renderAbout();
      initTicker();
      if (typeof renderReports === 'function') renderReports();
      if (typeof refreshPilgrimLanguage === 'function') refreshPilgrimLanguage();
      if (typeof applyTranslations === 'function') applyTranslations();
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
  renderAkharas();
  renderAbout();

  // Update ticker when language changes
  const originalSetLang = window.setLang || function(){};
});

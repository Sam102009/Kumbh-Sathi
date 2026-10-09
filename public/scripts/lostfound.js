/* =====================================================
   KumbhSathi — Lost & Found (Google Apps Script backend)
   Replace APPS_SCRIPT_URL with your deployed Web App URL.
   ===================================================== */

var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwdyCiH2W3q7bGoRMjSl2U3grEuNWSDgg3p-oEqrxpVabbizuVh7V0Qa9XpxLJfhlicWg/exec';

var activeReportType = 'lost';
window._lostFoundCache = null;

/* ---------- helpers ---------- */

function _lfShowSpinner(container) {
  container.innerHTML =
    '<div class="empty-state">' +
    '<i class="fa-solid fa-spinner fa-spin" style="font-size:28px;color:var(--saffron);"></i>' +
    '<p style="margin-top:10px;">' + t('lf_loading_reports') + '</p>' +
    '</div>';
}

function _lfShowError(container) {
  container.innerHTML =
    '<div class="empty-state" style="color:#b71c1c;">' +
    '<i class="fa-solid fa-triangle-exclamation" style="font-size:28px;"></i>' +
    '<p style="margin-top:10px;">' + t('lf_error_connect') + '</p>' +
    '</div>';
}

function _lfShowEmpty(container) {
  container.innerHTML =
    '<div class="empty-state">' +
    '<i class="fa-solid fa-magnifying-glass"></i>' +
    '<p>' + t('lf_no_approved_reports') + '</p>' +
    '</div>';
}

function _lfCard(r) {
  var type = String(r.type || 'lost').toLowerCase();
  var typeLabel = type === 'found' ? t('lf_report_found_badge') : t('lf_report_lost_badge');
  var waText = encodeURIComponent(
    '\uD83D\uDD0D *KumbhSathi \u2014 ' + typeLabel + '*\n\n' +
    t('field_name') + ': ' + r.name + '\n' + t('field_age') + ': ' + r.age + '\n' + t('field_gender') + ': ' + r.gender + '\n' +
    t('field_location') + ': ' + r.location + '\n' + t('field_desc') + ': ' + r.desc + '\n' + t('field_contact') + ': ' + r.contact + '\n' +
    t('lf_reported_label') + ': ' + r.timestamp + '\n\n' + t('app_name')
  );
  var phone = String(r.contact).replace(/[^0-9]/g, '');
  return (
    '<div class="report-card ' + r.type + '">' +
      '<span class="report-type-badge ' + type + '">' + typeLabel + '</span>' +
      '<div style="font-size:15px;font-weight:700;color:var(--dark-brown);margin-bottom:4px;">' + r.name + '</div>' +
      '<div style="font-size:12px;color:var(--light-brown);margin-bottom:4px;">' +
        '<i class="fa-solid fa-user"></i> ' + t('field_age') + ': ' + r.age + ' ' + t('lf_age_years') + ', ' +
        t('field_gender') + ': ' + r.gender +
        ' &nbsp;|&nbsp; <i class="fa-solid fa-location-dot"></i> ' + r.location +
      '</div>' +
      '<div style="font-size:12px;color:var(--light-brown);margin-bottom:8px;">' + (r.desc || '') + '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<a href="https://wa.me/?text=' + waText + '" target="_blank" rel="noopener" class="btn btn-whatsapp btn-sm">' +
          '<i class="fa-brands fa-whatsapp"></i> ' + t('whatsapp_share') +
        '</a>' +
        '<a href="tel:' + phone + '" class="btn btn-primary btn-sm">' +
          '<i class="fa-solid fa-phone"></i> ' + r.contact +
        '</a>' +
      '</div>' +
      '<div style="font-size:10px;color:var(--light-brown);margin-top:8px;">' +
        '<i class="fa-solid fa-clock"></i> ' + t('lf_reported_label') + ': ' + r.timestamp +
      '</div>' +
    '</div>'
  );
}

/* ---------- core functions (also used by router.js) ---------- */

function renderReports(forceFetch) {
  var container = document.getElementById('reports-container');
  if (!container) return;
  if (!forceFetch && Array.isArray(window._lostFoundCache)) {
    if (!window._lostFoundCache.length) { _lfShowEmpty(container); return; }
    container.innerHTML = window._lostFoundCache.map(_lfCard).join('');
    return;
  }
  _lfShowSpinner(container);

  fetch(APPS_SCRIPT_URL)
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function(reports) {
      if (!Array.isArray(reports) || reports.length === 0) {
        window._lostFoundCache = [];
        _lfShowEmpty(container);
        return;
      }
      window._lostFoundCache = reports;
      container.innerHTML = reports.map(_lfCard).join('');
    })
    .catch(function(err) {
      console.error('[KumbhSathi] Load reports failed:', err);
      _lfShowError(container);
    });
}

function initLostFound() {
  document.querySelectorAll('.form-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.form-tab').forEach(function(t) {
        t.classList.remove('active');
      });
      tab.classList.add('active');
      activeReportType = tab.dataset.type;
    });
  });

  renderReports();

  var form = document.getElementById('lf-form');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      var report = {
        type: activeReportType,
        name: fd.get('name'),
        age: fd.get('age'),
        gender: fd.get('gender'),
        location: fd.get('location'),
        desc: fd.get('desc'),
        contact: fd.get('contact'),
        timestamp: new Date().toLocaleString('en-IN')
      };

      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = t('submitting'); }

      fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(report)
      })
        .then(function(res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function() {
          e.target.reset();
          window._lostFoundCache = null;
          if (typeof showToast === 'function') showToast(t('report_submitted_title'));
          renderReports();
        })
        .catch(function(err) {
          console.error('[KumbhSathi] Submit failed:', err);
          if (typeof showToast === 'function') showToast(t('lf_error_connect'));
        })
        .finally(function() {
          if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> ' + t('submit_report'); }
        });
    });
  }
}

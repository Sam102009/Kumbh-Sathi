/* =====================================================
   KumbhSathi — Lost & Found (Google Apps Script backend)
   Replace APPS_SCRIPT_URL with your deployed Web App URL.
   ===================================================== */

var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwdyCiH2W3q7bGoRMjSl2U3grEuNWSDgg3p-oEqrxpVabbizuVh7V0Qa9XpxLJfhlicWg/exec';

var activeReportType = 'lost';

/* ---------- helpers ---------- */

function _lfShowSpinner(container) {
  container.innerHTML =
    '<div class="empty-state">' +
    '<i class="fa-solid fa-spinner fa-spin" style="font-size:28px;color:var(--saffron);"></i>' +
    '<p style="margin-top:10px;">Loading reports…</p>' +
    '</div>';
}

function _lfShowError(container) {
  container.innerHTML =
    '<div class="empty-state" style="color:#b71c1c;">' +
    '<i class="fa-solid fa-triangle-exclamation" style="font-size:28px;"></i>' +
    '<p style="margin-top:10px;">Could not connect. Please try again.</p>' +
    '</div>';
}

function _lfShowEmpty(container) {
  container.innerHTML =
    '<div class="empty-state">' +
    '<i class="fa-solid fa-magnifying-glass"></i>' +
    '<p>No reports yet. Be the first to submit one.</p>' +
    '</div>';
}

function _lfCard(r) {
  var waText = encodeURIComponent(
    '\uD83D\uDD0D *KumbhSathi \u2014 ' + (r.type === 'lost' ? 'LOST PERSON' : 'FOUND PERSON') + '*\n\n' +
    'Name: ' + r.name + '\nAge: ' + r.age + '\nGender: ' + r.gender + '\n' +
    'Last Seen: ' + r.location + '\nDetails: ' + r.desc + '\nContact: ' + r.contact + '\n' +
    'Reported: ' + r.timestamp + '\n\nDownload KumbhSathi App for Kumbh Nashik 2027'
  );
  var phone = String(r.contact).replace(/[^0-9]/g, '');
  return (
    '<div class="report-card ' + r.type + '">' +
      '<span class="report-type-badge ' + r.type + '">' + r.type.toUpperCase() + '</span>' +
      '<div style="font-size:15px;font-weight:700;color:var(--dark-brown);margin-bottom:4px;">' + r.name + '</div>' +
      '<div style="font-size:12px;color:var(--light-brown);margin-bottom:4px;">' +
        '<i class="fa-solid fa-user"></i> ' + r.age + ' yrs, ' + r.gender +
        ' &nbsp;|&nbsp; <i class="fa-solid fa-location-dot"></i> ' + r.location +
      '</div>' +
      '<div style="font-size:12px;color:var(--light-brown);margin-bottom:8px;">' + (r.desc || '') + '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<a href="https://wa.me/?text=' + waText + '" target="_blank" rel="noopener" class="btn btn-whatsapp btn-sm">' +
          '<i class="fa-brands fa-whatsapp"></i> WhatsApp' +
        '</a>' +
        '<a href="tel:' + phone + '" class="btn btn-primary btn-sm">' +
          '<i class="fa-solid fa-phone"></i> ' + r.contact +
        '</a>' +
      '</div>' +
      '<div style="font-size:10px;color:var(--light-brown);margin-top:8px;">' +
        '<i class="fa-solid fa-clock"></i> ' + r.timestamp +
      '</div>' +
    '</div>'
  );
}

/* ---------- core functions (also used by router.js) ---------- */

function renderReports() {
  var container = document.getElementById('reports-container');
  if (!container) return;
  _lfShowSpinner(container);

  fetch(APPS_SCRIPT_URL)
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function(reports) {
      if (!Array.isArray(reports) || reports.length === 0) {
        _lfShowEmpty(container);
        return;
      }
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
      if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }

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
          if (typeof showToast === 'function') showToast('Report submitted successfully!');
          renderReports();
        })
        .catch(function(err) {
          console.error('[KumbhSathi] Submit failed:', err);
          if (typeof showToast === 'function') showToast('Could not connect. Please try again.');
        })
        .finally(function() {
          if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> <span data-t="submit_report">रिपोर्ट सबमिट करें</span>'; }
        });
    });
  }
}

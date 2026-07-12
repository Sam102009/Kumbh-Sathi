/* =====================================================
   KumbhSathi — Lost & Found (Google Apps Script backend)
   ===================================================== */

var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyp_E-2tqiBfAtswJIxIeeq2iH6gwMjjlPZwlxxijqU6RdfZW8UOlcM83Gd9Yay7ZbufQ/exec';

var activeReportType = 'lost';

/* ---------- helpers ---------- */

function _lfIsApproved(r) {
  var val = r['Approved'] !== undefined ? r['Approved'] : r['approved'];
  if (val === true) return true;
  if (typeof val === 'string' && val.trim().toUpperCase() === 'TRUE') return true;
  return false;
}

function _lfShowSpinner(container) {
  container.innerHTML =
    '<div class="empty-state">' +
    '<i class="fa-solid fa-spinner fa-spin" style="font-size:28px;color:var(--saffron);"></i>' +
    '<p style="margin-top:10px;">Loading reports…</p>' +
    '</div>';
}

function _lfShowEmpty(container) {
  container.innerHTML =
    '<div class="empty-state">' +
    '<i class="fa-solid fa-magnifying-glass" style="font-size:28px;color:var(--saffron);"></i>' +
    '<p style="margin-top:10px;">No approved reports yet.</p>' +
    '</div>';
}

function _lfCard(r) {
  var name     = r.name     || r.Name     || '';
  var age      = r.age      || r.Age      || '';
  var gender   = r.gender   || r.Gender   || '';
  var location = r.location || r.Location || '';
  var desc     = r.desc     || r.Desc     || '';
  var contact  = r.contact  || r.Contact  || '';
  var timestamp= r.timestamp|| r.Timestamp|| '';
  var type     = (r.type    || r.Type     || 'lost').toLowerCase();
  var photo    = r.photo    || r.Photo    || '';
  var reportId = r.id       || r.ID       || (name + age).replace(/\s/g,'');

  /* Photo */
  var photoHtml = photo
    ? '<img src="' + photo + '" style="width:100%;max-height:180px;object-fit:cover;border-radius:8px;margin-bottom:10px;">'
    : '';

  /* Contact / Verify button — only show contact if signed in AND approved */
  var isSignedIn = (typeof KumbhAuth !== 'undefined') && KumbhAuth.isSignedIn();
  var verifications = [];
  try { verifications = JSON.parse(localStorage.getItem('kumbh_verifications') || '[]'); } catch(e) {}
  var approved = isSignedIn && verifications.find(function(v) {
    return v.ReportID === reportId && (v.Status === 'Approved' || v.Status === 'approved');
  });

  var waText = encodeURIComponent(
    '\uD83D\uDD0D *KumbhSathi \u2014 ' + (type === 'lost' ? 'LOST PERSON' : 'FOUND PERSON') + '*\n\n' +
    'Name: ' + name + '\nAge: ' + age + '\nGender: ' + gender + '\n' +
    'Last Seen: ' + location + '\nDetails: ' + desc + '\nContact: ' + contact + '\n' +
    'Reported: ' + timestamp + '\n\nDownload KumbhSathi App for Kumbh Nashik 2027'
  );
  var phone = String(contact).replace(/[^0-9]/g, '');

  var contactHtml = approved
    ? '<a href="tel:' + phone + '" class="btn btn-primary btn-sm"><i class="fa-solid fa-phone"></i> ' + contact + '</a>'
    : '<button onclick="KumbhVerifyUI.startVerification(\'' + reportId.replace(/'/g,"\'") + '\')" style="padding:8px 14px;background:var(--saffron);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;">🔍 I know this person</button>';

  return (
    '<div class="report-card ' + type + '">' +
      photoHtml +
      '<span class="report-type-badge ' + type + '">' + type.toUpperCase() + '</span>' +
      '<div style="font-size:15px;font-weight:700;color:var(--dark-brown);margin-bottom:4px;">' + name + '</div>' +
      '<div style="font-size:12px;color:var(--light-brown);margin-bottom:4px;">' +
        '<i class="fa-solid fa-user"></i> ' + age + ' yrs, ' + gender +
        ' &nbsp;|&nbsp; <i class="fa-solid fa-location-dot"></i> ' + location +
      '</div>' +
      '<div style="font-size:12px;color:var(--light-brown);margin-bottom:8px;">' + (desc || '') + '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">' +
        contactHtml +
      '</div>' +
      '<div style="font-size:10px;color:var(--light-brown);margin-top:8px;">' +
        '<i class="fa-solid fa-clock"></i> ' + timestamp +
      '</div>' +
    '</div>'
  );
}

/* ---------- success modal ---------- */

function _lfShowSuccessModal() {
  var existing = document.getElementById('lf-success-modal');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'lf-success-modal';
  overlay.style.cssText =
    'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:99999;' +
    'display:flex;align-items:center;justify-content:center;padding:24px;';

  var box = document.createElement('div');
  box.style.cssText =
    'background:#fff;border-radius:18px;padding:28px 24px;max-width:340px;width:100%;' +
    'text-align:center;box-shadow:0 8px 40px rgba(0,0,0,0.25);';

  var title = (typeof t === 'function') ? t('report_submitted_title') : 'Report Submitted! ✅';
  var msg   = (typeof t === 'function') ? t('report_submitted_msg')   :
    'Your report has been submitted! It will be reviewed and usually approved within 24 hours. Thank you for helping reunite families. 🙏';

  box.innerHTML =
    '<div style="font-size:52px;margin-bottom:12px;">✅</div>' +
    '<div style="font-size:17px;font-weight:800;color:#2e7d32;margin-bottom:10px;">' + title + '</div>' +
    '<div style="font-size:13px;color:#555;line-height:1.7;margin-bottom:20px;">' + msg + '</div>' +
    '<button id="lf-modal-ok" style="background:linear-gradient(135deg,var(--saffron),var(--deep-orange));' +
      'color:#fff;border:none;border-radius:22px;padding:10px 32px;font-size:14px;font-weight:700;cursor:pointer;">' +
      'OK 🙏' +
    '</button>';

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  function closeModal() { overlay.remove(); }
  document.getElementById('lf-modal-ok').addEventListener('click', closeModal);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });
}

/* ---------- core: render reports ---------- */

function renderReports() {
  var container = document.getElementById('reports-container');
  if (!container) return;
  _lfShowSpinner(container);

  fetch(APPS_SCRIPT_URL + '?sheet=Lost%20and%20Found')
    .then(function(res) { return res.text(); })
    .then(function(text) {
      var reports;
      try { reports = JSON.parse(text); } catch(e) {
        throw new Error('JSON parse failed: ' + text.slice(0, 100));
      }
      if (!Array.isArray(reports)) {
        if (reports && reports.error) throw new Error(reports.error);
        throw new Error('Expected array');
      }
      var approved = reports.filter(_lfIsApproved);
      if (approved.length === 0) { _lfShowEmpty(container); return; }
      container.innerHTML = approved.map(_lfCard).join('');
    })
    .catch(function(err) {
      console.error('[KumbhSathi] Load reports failed:', err);
      container.innerHTML =
        '<div class="empty-state" style="color:#b71c1c;">' +
        '<i class="fa-solid fa-triangle-exclamation" style="font-size:28px;"></i>' +
        '<p style="margin-top:10px;font-size:12px;word-break:break-word;">Error: ' + (err.message || err) + '</p>' +
        '<button onclick="renderReports()" style="margin-top:12px;padding:8px 20px;background:var(--saffron);color:#fff;border:none;border-radius:20px;font-size:13px;cursor:pointer;">Retry</button>' +
        '</div>';
    });
}

/* ---------- core: submit report ---------- */

function submitLostFoundReport(report, btn) {
  fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(report)
  })
    .then(function(res) { return res.text(); })
    .then(function() {
      document.getElementById('lf-form').reset();
      _lfShowSuccessModal();
    })
    .catch(function(err) {
      console.error('[KumbhSathi] Submit failed:', err);
      if (typeof showToast === 'function') showToast('❌ Could not connect. Please try again.');
    })
    .finally(function() {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> <span data-t="submit_report">रिपोर्ट सबमिट करें</span>';
      }
    });
}

/* ---------- init ---------- */

function initLostFound() {
  document.querySelectorAll('.form-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.form-tab').forEach(function(t) { t.classList.remove('active'); });
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
        type:      activeReportType,
        name:      fd.get('name'),
        age:       fd.get('age'),
        gender:    fd.get('gender'),
        location:  fd.get('location'),
        desc:      fd.get('desc'),
        contact:   fd.get('contact'),
        timestamp: new Date().toLocaleString('en-IN'),
        token:     'kumbh2027secure'
      };

      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }

      var photoFile = document.getElementById('lf-photo') && document.getElementById('lf-photo').files[0];
      if (photoFile) {
        var reader = new FileReader();
        reader.onload = function(e2) {
          report.photo = e2.target.result;
          submitLostFoundReport(report, btn);
        };
        reader.readAsDataURL(photoFile);
      } else {
        report.photo = '';
        submitLostFoundReport(report, btn);
      }
    });
  }
}

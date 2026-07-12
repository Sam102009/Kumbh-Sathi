var KumbhVerify = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycbyp_E-2tqiBfAtswJIxIeeq2iH6gwMjjlPZwlxxijqU6RdfZW8UOlcM83Gd9Yay7ZbufQ/exec',
  TOKEN: 'kumbh2027secure',

  submit: function(reportId, documentPhoto, callback) {
    var user = KumbhAuth.getUser();
    if (!user) { callback({error: 'Not signed in'}); return; }
    fetch(this.GAS_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'submitVerification',
        token: this.TOKEN,
        reportId: reportId,
        userName: user.name,
        userEmail: user.email,
        documentPhoto: documentPhoto
      })
    })
    .then(function(r) { return r.text(); })
    .then(function(text) {
      try { callback(JSON.parse(text)); } catch(e) { callback({error: 'Parse error'}); }
    })
    .catch(function() { callback({error: 'Failed to submit'}); });
  },

  checkStatus: function(callback) {
    var user = KumbhAuth.getUser();
    if (!user) { callback([]); return; }
    fetch(this.GAS_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'checkVerification',
        token: this.TOKEN,
        userEmail: user.email
      })
    })
    .then(function(r) { return r.text(); })
    .then(function(text) {
      try {
        var results = JSON.parse(text);
        callback(Array.isArray(results) ? results : []);
      } catch(e) { callback([]); }
    })
    .catch(function() { callback([]); });
  }
};

var KumbhVerifyUI = {
  pendingReportId: null,

  startVerification: function(reportId) {
    this.pendingReportId = reportId;
    if (!KumbhAuth.isSignedIn()) {
      KumbhAuth.signIn(function(user) {
        document.getElementById('kumbh-signin-modal').style.display = 'none';
        KumbhVerifyUI.showVerifyModal(reportId);
        if (typeof KumbhAuthUI !== 'undefined') KumbhAuthUI.updateHeader();
      });
    } else {
      this.showVerifyModal(reportId);
    }
  },

  showVerifyModal: function(reportId) {
    document.getElementById('verify-report-id').value = reportId;
    document.getElementById('verify-status-msg').textContent = '';
    document.getElementById('verify-doc-input').value = '';
    document.getElementById('verify-submit-btn').disabled = false;
    document.getElementById('verify-submit-btn').textContent = 'Submit for Verification';
    document.getElementById('kumbh-verify-modal').style.display = 'flex';
  },

  submitVerification: function() {
    var reportId = document.getElementById('verify-report-id').value;
    var fileInput = document.getElementById('verify-doc-input');
    var btn = document.getElementById('verify-submit-btn');
    var statusMsg = document.getElementById('verify-status-msg');

    if (!fileInput.files[0]) {
      statusMsg.textContent = 'Please upload an ID document.';
      statusMsg.style.color = 'red';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Submitting...';

    var reader = new FileReader();
    reader.onload = function(e) {
      KumbhVerify.submit(reportId, e.target.result, function(result) {
        if (result.error) {
          statusMsg.textContent = 'Failed. Please try again.';
          statusMsg.style.color = 'red';
          btn.disabled = false;
          btn.textContent = 'Submit for Verification';
        } else {
          statusMsg.textContent = '✅ Submitted! We will review within 24 hours.';
          statusMsg.style.color = 'green';
          btn.textContent = 'Submitted';
          setTimeout(function() {
            document.getElementById('kumbh-verify-modal').style.display = 'none';
            if (typeof loadLostFound === 'function') loadLostFound();
          }, 2000);
        }
      });
    };
    reader.readAsDataURL(fileInput.files[0]);
  }
};

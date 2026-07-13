var KumbhNotifications = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycbyp_E-2tqiBfAtswJIxIeeq2iH6gwMjjlPZwlxxijqU6RdfZW8UOlcM83Gd9Yay7ZbufQ/exec',

  fetchBroadcast: function(callback) {
    fetch(this.GAS_URL + '?sheet=Notifications')
      .then(function(r) { return r.text(); })
      .then(function(text) {
        try { callback(JSON.parse(text)); } catch(e) { callback([]); }
      })
      .catch(function() { callback([]); });
  },

  getSeenBroadcast: function() {
    try { return JSON.parse(localStorage.getItem('seen_broadcasts') || '[]'); } catch(e) { return []; }
  },

  markBroadcastSeen: function(notifications) {
    var ids = notifications.map(function(n) { return n.Timestamp; });
    localStorage.setItem('seen_broadcasts', JSON.stringify(ids));
  },

  hasUnseenBroadcast: function(notifications) {
    var seen = this.getSeenBroadcast();
    return notifications.some(function(n) { return seen.indexOf(n.Timestamp) === -1; });
  },

  getUnseenBroadcast: function(notifications) {
    var seen = this.getSeenBroadcast();
    return notifications.filter(function(n) { return seen.indexOf(n.Timestamp) === -1; });
  },

  getLastSeenVerifStatus: function(verificationId) {
    try {
      var statuses = JSON.parse(localStorage.getItem('seen_verif_statuses') || '{}');
      return statuses[verificationId] || null;
    } catch(e) { return null; }
  },

  markVerifStatusSeen: function(verificationId, status) {
    try {
      var statuses = JSON.parse(localStorage.getItem('seen_verif_statuses') || '{}');
      statuses[verificationId] = status;
      localStorage.setItem('seen_verif_statuses', JSON.stringify(statuses));
    } catch(e) {}
  },

  hasUnseenVerifUpdate: function(verifications) {
    var self = this;
    return verifications.some(function(v) {
      var lastSeen = self.getLastSeenVerifStatus(v.VerificationID);
      return (v.Status === 'Approved' || v.Status === 'Rejected') && lastSeen !== v.Status;
    });
  },

  getUnseenVerifUpdates: function(verifications) {
    var self = this;
    return verifications.filter(function(v) {
      var lastSeen = self.getLastSeenVerifStatus(v.VerificationID);
      return (v.Status === 'Approved' || v.Status === 'Rejected') && lastSeen !== v.Status;
    });
  },

  checkAll: function() {
    var self = this;
    var isSignedIn = (typeof KumbhAuth !== 'undefined') && KumbhAuth.isSignedIn();

    self.fetchBroadcast(function(broadcasts) {
      var hasNewBroadcast = self.hasUnseenBroadcast(broadcasts);

      if (!isSignedIn) {
        self._updateBadge(hasNewBroadcast);
        self._storeData(broadcasts, []);
        return;
      }

      KumbhVerify.checkStatus(function(verifications) {
        var hasNewVerif = self.hasUnseenVerifUpdate(verifications);
        self._updateBadge(hasNewBroadcast || hasNewVerif);
        self._storeData(broadcasts, verifications);
      });
    });
  },

  _latestBroadcasts: [],
  _latestVerifications: [],

  _storeData: function(broadcasts, verifications) {
    this._latestBroadcasts = broadcasts;
    this._latestVerifications = verifications;
  },

  _updateBadge: function(show) {
    var badge = document.getElementById('notif-badge');
    if (badge) badge.style.display = show ? 'block' : 'none';
  }
};

var KumbhNotifUI = {
  render: function() {
    var broadcasts     = KumbhNotifications._latestBroadcasts;
    var verifications  = KumbhNotifications._latestVerifications;
    var isSignedIn     = (typeof KumbhAuth !== 'undefined') && KumbhAuth.isSignedIn();

    var unseenBroadcasts = KumbhNotifications.getUnseenBroadcast(broadcasts);
    var unseenVerifs     = isSignedIn ? KumbhNotifications.getUnseenVerifUpdates(verifications) : [];
    var allUnseen        = unseenBroadcasts.concat(unseenVerifs);

    var notifSection  = document.getElementById('notif-section');
    var notifDivider  = document.getElementById('notif-divider');
    var notifList     = document.getElementById('notif-list');

    if (allUnseen.length === 0) {
      if (notifSection) notifSection.style.display = 'none';
      if (notifDivider) notifDivider.style.display = 'none';
      return;
    }

    if (notifSection) notifSection.style.display = 'block';
    if (notifDivider) notifDivider.style.display = 'block';

    var html = '';
    unseenBroadcasts.forEach(function(n) {
      html +=
        '<div style="padding:8px;background:var(--bg, #f9f5f0);border-radius:8px;margin-bottom:6px;">' +
          '<p style="font-size:13px;font-weight:600;margin:0 0 2px 0;">📢 ' + n.Title + '</p>' +
          '<p style="font-size:12px;color:#888;margin:0;">' + n.Message + '</p>' +
        '</div>';
    });

    unseenVerifs.forEach(function(v) {
      var icon = v.Status === 'Approved' ? '✅' : '❌';
      var msg  = v.Status === 'Approved'
        ? 'Your identity verification was approved. You can now view the contact number.'
        : 'Your identity verification was rejected. Please try again with a clearer document.';
      html +=
        '<div style="padding:8px;background:var(--bg, #f9f5f0);border-radius:8px;margin-bottom:6px;">' +
          '<p style="font-size:13px;font-weight:600;margin:0 0 2px 0;">' + icon + ' Verification ' + v.Status + '</p>' +
          '<p style="font-size:12px;color:#888;margin:0;">' + msg + '</p>' +
        '</div>';
    });

    if (notifList) notifList.innerHTML = html;
  },

  markAllSeen: function() {
    var broadcasts    = KumbhNotifications._latestBroadcasts;
    var verifications = KumbhNotifications._latestVerifications;

    KumbhNotifications.markBroadcastSeen(broadcasts);
    verifications.forEach(function(v) {
      KumbhNotifications.markVerifStatusSeen(v.VerificationID, v.Status);
    });

    KumbhNotifications._updateBadge(false);
    var notifSection = document.getElementById('notif-section');
    var notifDivider = document.getElementById('notif-divider');
    if (notifSection) notifSection.style.display = 'none';
    if (notifDivider) notifDivider.style.display = 'none';
  }
};

window.addEventListener('load', function() {
  setTimeout(function() {
    if (typeof KumbhNotifications !== 'undefined') KumbhNotifications.checkAll();
  }, 2000);
});

// Google Auth Manager
var KumbhAuth = {
  clientId: '145095692060-i0ln8i31gh44dqtrdtpfoida506qk2li.apps.googleusercontent.com',
  user: null,
  pendingCallback: null,

  init: function() {
    var saved = localStorage.getItem('kumbh_user');
    if (saved) {
      try { this.user = JSON.parse(saved); } catch(e) { this.user = null; }
    }
  },

  isSignedIn: function() {
    return this.user !== null;
  },

  getUser: function() {
    return this.user;
  },

  signIn: function(callback) {
    if (this.isSignedIn()) {
      callback(this.user);
      return;
    }
    this.pendingCallback = callback;
    google.accounts.id.prompt(function(notification) {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        document.getElementById('auth-panel').style.display = 'block';
      }
    });
  },

  signOut: function() {
    this.user = null;
    localStorage.removeItem('kumbh_user');
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.disableAutoSelect();
    }
  },

  _parseJwt: function(token) {
    var base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    var json = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(json);
  }
};

KumbhAuth.init();

var KumbhAuthUI = {
  init: function() {
    this.updateHeader();
    document.addEventListener('click', function(e) {
      var panel = document.getElementById('auth-panel');
      var btn = document.getElementById('auth-avatar-btn');
      if (panel && btn && !panel.contains(e.target) && !btn.contains(e.target)) {
        panel.style.display = 'none';
      }
    });
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({
        client_id: KumbhAuth.clientId,
        callback: function(response) {
          var payload = KumbhAuth._parseJwt(response.credential);
          KumbhAuth.user = {
            name: payload.name,
            email: payload.email,
            picture: payload.picture
          };
          localStorage.setItem('kumbh_user', JSON.stringify(KumbhAuth.user));
          KumbhAuthUI.updateHeader();
          document.getElementById('auth-panel').style.display = 'none';
          if (KumbhAuth.pendingCallback) {
            KumbhAuth.pendingCallback(KumbhAuth.user);
            KumbhAuth.pendingCallback = null;
          }
          if (typeof KumbhVerifyUI !== 'undefined') {
            KumbhVerifyUI.checkAndUpdateStatus();
          }
        }
      });
      var panelBtn = document.getElementById('auth-panel-signin-btn');
      if (panelBtn) {
        google.accounts.id.renderButton(panelBtn, { theme: 'outline', size: 'large', width: 210 });
      }
    }
  },

  updateHeader: function() {
    var user = KumbhAuth.getUser();
    var avatarImg  = document.getElementById('auth-avatar-img');
    var avatarIcon = document.getElementById('auth-avatar-icon');
    var signedIn   = document.getElementById('auth-panel-signedin');
    var signedOut  = document.getElementById('auth-panel-signedout');
    if (user) {
      if (avatarImg)  { avatarImg.src = user.picture || ''; avatarImg.style.display = 'block'; }
      if (avatarIcon) avatarIcon.style.display = 'none';
      if (signedIn)   signedIn.style.display  = 'block';
      if (signedOut)  signedOut.style.display = 'none';
      var nameEl       = document.getElementById('auth-panel-name');
      var emailEl      = document.getElementById('auth-panel-email');
      var panelAvatar  = document.getElementById('auth-panel-avatar');
      if (nameEl)      nameEl.textContent      = user.name;
      if (emailEl)     emailEl.textContent     = user.email;
      if (panelAvatar) panelAvatar.src         = user.picture || '';
    } else {
      if (avatarImg)  avatarImg.style.display  = 'none';
      if (avatarIcon) avatarIcon.style.display = 'block';
      if (signedIn)   signedIn.style.display   = 'none';
      if (signedOut)  signedOut.style.display  = 'block';
    }
    // keep the legacy About-page auth section in sync if it still exists
    var outView = document.getElementById('signed-out-view');
    var inView  = document.getElementById('signed-in-view');
    var nameSpan = document.getElementById('auth-user-name');
    if (outView && inView) {
      if (user) {
        outView.style.display = 'none';
        inView.style.display  = 'block';
        if (nameSpan) nameSpan.textContent = user.name;
      } else {
        outView.style.display = 'block';
        inView.style.display  = 'none';
      }
    }
  },

  togglePanel: function() {
    var panel = document.getElementById('auth-panel');
    if (panel) panel.style.display = (panel.style.display === 'none' || panel.style.display === '') ? 'block' : 'none';
  },

  signOut: function() {
    KumbhAuth.signOut();
    this.updateHeader();
    var panel = document.getElementById('auth-panel');
    if (panel) panel.style.display = 'none';
    if (typeof renderReports === 'function') renderReports();
  }
};

document.addEventListener('DOMContentLoaded', function() {
  KumbhAuthUI.init();
});

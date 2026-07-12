// Google Auth Manager
var KumbhAuth = {
  clientId: '145095692060-i0ln8i31gh44dqtrdtpfoida506qk2li.apps.googleusercontent.com',
  user: null,

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
    google.accounts.id.initialize({
      client_id: this.clientId,
      callback: function(response) {
        var payload = KumbhAuth._parseJwt(response.credential);
        KumbhAuth.user = {
          name: payload.name,
          email: payload.email,
          picture: payload.picture
        };
        localStorage.setItem('kumbh_user', JSON.stringify(KumbhAuth.user));
        callback(KumbhAuth.user);
      }
    });
    google.accounts.id.prompt(function(notification) {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        google.accounts.id.renderButton(
          document.getElementById('kumbh-signin-btn'),
          { theme: 'outline', size: 'large', width: 280 }
        );
        document.getElementById('kumbh-signin-modal').style.display = 'flex';
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

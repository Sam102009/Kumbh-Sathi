/* ===== Offline cache: drop-in replacement for fetch() on GET data calls =====
   Online  -> fetch fresh, save a copy, return it.
   Offline / timeout / bad response -> return the last saved copy + show a banner.
   The saved copy is only ever replaced by newer good data, never left empty. */
function ksShowOfflineBanner(ts) {
  var b = document.getElementById('ks-offline-banner');
  if (!b) {
    b = document.createElement('div');
    b.id = 'ks-offline-banner';
    b.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#7a4a00;color:#fff;font-size:13px;padding:8px 12px;text-align:center;';
    document.body.appendChild(b);
  }
  var d = new Date(ts);
  var hh = d.getHours() % 12 || 12;
  var mm = ('0' + d.getMinutes()).slice(-2);
  b.textContent = '\uD83D\uDCF4 Offline - showing saved data from ' + hh + ':' + mm + ' ' + (d.getHours() >= 12 ? 'PM' : 'AM');
  b.style.display = 'block';
}

function ksHideOfflineBanner() {
  var b = document.getElementById('ks-offline-banner');
  if (b) b.style.display = 'none';
}

function cachedFetch(url) {
  var key = 'ks_cache:' + url;
  var lastText = null;
  var hasCache = false;
  try { hasCache = !!localStorage.getItem(key); } catch (e) {}
  var request = fetch(url);
  var timeout = new Promise(function(_, reject) {
    if (hasCache) setTimeout(function() { reject(new Error('timeout')); }, 10000);
  });
  return Promise.race([request, timeout])
    .then(function(res) { return res.text(); })
    .then(function(text) {
      lastText = text;
      var parsed = JSON.parse(text);
      var bad = parsed && !Array.isArray(parsed) &&
        (parsed.error || (parsed.cod && String(parsed.cod) !== '200'));
      if (bad) throw new Error('bad response');
      try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: text })); } catch (e) {}
      ksHideOfflineBanner();
      return new Response(text, { status: 200 });
    })
    .catch(function(err) {
      var raw = null;
      try { raw = localStorage.getItem(key); } catch (e) {}
      if (raw) {
        try {
          var c = JSON.parse(raw);
          ksShowOfflineBanner(c.t);
          return new Response(c.d, { status: 200 });
        } catch (e2) {}
      }
      if (lastText !== null) return new Response(lastText, { status: 200 });
      throw err;
    });
}

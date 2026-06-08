const NEWS_URL = 'https://script.google.com/macros/s/AKfycbyp_E-2tqiBfAtswJIxIeeq2iH6gwMjjlPZwlxxijqU6RdfZW8UOlcM83Gd9Yay7ZbufQ/exec?sheet=News';

function initNews() {
  renderNewsLoading();
  fetchNews();
}

function renderNewsLoading() {
  var container = document.getElementById('news-container');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--light-brown);">📰 समाचार लोड हो रहा है...</div>';
}

function fetchNews() {
  fetch(NEWS_URL)
    .then(function(res) { return res.json(); })
    .then(function(data) {
      renderNews(data);
    })
    .catch(function() {
      var container = document.getElementById('news-container');
      if (container) container.innerHTML = '<div style="text-align:center;padding:40px;color:#b71c1c;">❌ समाचार लोड नहीं हो सका</div>';
    });
}

function renderNews(data) {
  var container = document.getElementById('news-container');
  if (!container) return;

  if (!data || data.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--light-brown);">कोई समाचार उपलब्ध नहीं है</div>';
    return;
  }

  var html = '';
  data.forEach(function(item) {
    if (!item.title) return;
    var categoryColor = '#FF6F00';
    if (item.category === 'alert') categoryColor = '#b71c1c';
    if (item.category === 'info') categoryColor = '#1565c0';
    if (item.category === 'event') categoryColor = '#2e7d32';

    html += '<div class="card" style="margin-bottom:12px;overflow:hidden;">';
    
    if (item.image) {
      html += '<img src="' + item.image + '" style="width:100%;height:180px;object-fit:cover;" onerror="this.style.display=\'none\'">';
    }
    
    html += '<div style="padding:12px;">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">';
    html += '<span style="background:' + categoryColor + ';color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;">' + (item.category || 'news').toUpperCase() + '</span>';
    html += '<span style="font-size:11px;color:var(--light-brown);">' + (item.date || '') + '</span>';
    html += '</div>';
    html += '<div style="font-weight:700;font-size:15px;margin-bottom:6px;color:var(--dark-brown);">' + item.title + '</div>';
    html += '<div style="font-size:13px;color:#555;line-height:1.5;">' + (item.description || '') + '</div>';
    html += '</div></div>';
  });

  container.innerHTML = html;
}

/* ===================================================
   KumbhSathi — Client-side Router
   Hash-based routing: #home, #map, #events, etc.
   =================================================== */

const ROUTES = {
  'home':      { page: 'page-home',      nav: 'nav-home',   more: null },
  'schedule':  { page: 'page-schedule',  nav: 'nav-events', more: null },
  'map':       { page: 'page-map',       nav: 'nav-map',    more: null },
  'stay':      { page: 'page-stay',      nav: 'nav-stay',   more: null },
  'transport': { page: 'page-transport', nav: null,         more: 'transport' },
  'lostfound': { page: 'page-lostfound', nav: null,         more: 'lostfound' },
  'emergency': { page: 'page-emergency', nav: null,         more: 'emergency' },
  'news':      { page: 'page-news',      nav: null,         more: 'news' },
  'akharas':   { page: 'page-akharas',   nav: null,         more: 'akharas' },
  'about':     { page: 'page-about',     nav: null,         more: 'about' },
  'sponsor':   { page: 'page-sponsor',   nav: null,         more: 'sponsor' },
  'crowd':     { page: 'page-crowd',     nav: null,         more: 'crowd' },
  'groups':    { page: 'page-groups',    nav: null,         more: 'groups' },
};

let currentRoute = 'home';

function getRoute() {
  const hash = window.location.hash.replace('#', '').toLowerCase().trim();
  return ROUTES[hash] ? hash : 'home';
}

function navigateTo(route, pushState = true) {
  if (!ROUTES[route]) route = 'home';
  
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  
  // Show target page
  const targetPage = document.getElementById(ROUTES[route].page);
  if (targetPage) targetPage.classList.add('active');

  // Update bottom nav active states
  document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
  const targetNav = ROUTES[route].nav;
  if (targetNav) {
    const navEl = document.getElementById(targetNav);
    if (navEl) navEl.classList.add('active');
  }

  // Scroll main content to top
  const mainContent = document.getElementById('main-content');
  if (mainContent) mainContent.scrollTop = 0;

  // Close more drawer if open
  closeMoreDrawer();

  // Update hash (without triggering hashchange loop)
  if (pushState) {
    window.location.hash = route === 'home' ? '' : route;
  }

  currentRoute = route;

  // Fire route-specific hooks
  onRouteChange(route);
}

function onRouteChange(route) {
  if (route === 'map') {
    // Initialize Leaflet map on first visit
    if (typeof initMap === 'function') initMap();
  }
  if (route === 'news') {
    if (typeof renderNews === 'function') renderNews();
  }
  if (route === 'groups') {
    if (typeof initGroups === 'function') initGroups();
  }
  if (route === 'crowd') {
    if (typeof initCrowd === "function") initCrowd(); else setTimeout(function(){ if (typeof initCrowd === "function") initCrowd(); }, 1500);
  }
  if (route === 'emergency') {
    if (typeof renderFirstAid === 'function') renderFirstAid();
  }
  if (route === 'lostfound') {
    if (typeof renderReports === 'function') renderReports();
  }
}

/* --- More Drawer --- */
function openMoreDrawer() {
  document.getElementById('more-drawer').classList.add('open');
  document.getElementById('drawer-overlay').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeMoreDrawer() {
  document.getElementById('more-drawer').classList.remove('open');
  document.getElementById('drawer-overlay').classList.remove('show');
  document.body.style.overflow = '';
}

/* --- Listen for hash changes --- */
window.addEventListener('hashchange', () => {
  const route = getRoute();
  navigateTo(route, false);
});

/* --- Initialize router --- */
function initRouter() {
  const route = getRoute();
  navigateTo(route, false);

  // Bottom nav click handlers
  document.querySelectorAll('.nav-item[data-route]').forEach(item => {
    item.addEventListener('click', () => {
      const route = item.dataset.route;
      if (route === 'more') {
        openMoreDrawer();
      } else {
        navigateTo(route);
      }
    });
  });

  // More drawer item click handlers
  document.querySelectorAll('.drawer-item[data-route]').forEach(item => {
    item.addEventListener('click', () => {
      navigateTo(item.dataset.route);
    });
  });

  // Overlay click closes drawer
  document.getElementById('drawer-overlay').addEventListener('click', closeMoreDrawer);

  // Quick access card clicks
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => navigateTo(el.dataset.nav));
  });
}

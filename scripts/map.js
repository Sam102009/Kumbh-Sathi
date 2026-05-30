/* ===================================================
   KumbhSathi — Leaflet.js Map Integration
   OpenStreetMap (free) + Leaflet.js (free CDN)
   =================================================== */

let leafletMap = null;
let mapLayers = {};
let routingControl = null;
let activeFilters = new Set(['ghats','temples','camps','hospitals','police','parking','transport','toilets']);

/* Color-coded marker icons per category */
const CATEGORY_COLORS = {
  ghats:     '#1565c0',
  temples:   '#FF6F00',
  camps:     '#6a1b9a',
  hospitals: '#b71c1c',
  police:    '#1b5e20',
  parking:   '#e65100',
  transport: '#004d40',
  toilets:   '#4e342e',
};

const CATEGORY_ICONS = {
  ghats:     '💧',
  temples:   '🕉️',
  camps:     '🏕️',
  hospitals: '🏥',
  police:    '👮',
  parking:   '🅿️',
  transport: '🚌',
  toilets:   '🚻',
};

/* Create a custom div icon for Leaflet */
function createMarkerIcon(category) {
  const color = CATEGORY_COLORS[category] || '#FF6F00';
  const emoji = CATEGORY_ICONS[category] || '📍';
  return L.divIcon({
    html: `
      <div style="
        background:${color};
        width:32px;height:32px;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        border:2px solid rgba(255,255,255,0.8);
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(45deg);font-size:14px;line-height:1;">${emoji}</span>
      </div>
    `,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

/* Get directions inside the app using Leaflet Routing Machine */
function getDirections(destLat, destLng, destName) {
  if (!leafletMap) return;

  if (!navigator.geolocation) {
    alert('आपके डिवाइस पर जियोलोकेशन समर्थित नहीं है।');
    return;
  }

  leafletMap.closePopup();

  // Show loading indicator
  if (typeof showToast === 'function') showToast('आपकी लोकेशन ढूंढी जा रही है...');

  navigator.geolocation.getCurrentPosition(
    pos => {
      const userLat = pos.coords.latitude;
      const userLng = pos.coords.longitude;

      // Remove previous route if exists
      if (routingControl) {
        leafletMap.removeControl(routingControl);
        routingControl = null;
      }

      routingControl = L.Routing.control({
        waypoints: [
          L.latLng(userLat, userLng),
          L.latLng(destLat, destLng)
        ],
        routeWhileDragging: false,
        addWaypoints: false,
        fitSelectedRoutes: true,
        show: true,
        collapsible: true,
        lineOptions: {
          styles: [{ color: '#FF6F00', weight: 5, opacity: 0.8 }]
        },
        createMarker: function(i, wp) {
          const label = i === 0 ? '📍 आप यहाँ हैं' : `🏁 ${destName}`;
          return L.marker(wp.latLng).bindPopup(label);
        }
      }).addTo(leafletMap);

      if (typeof showToast === 'function') showToast(`${destName} का रास्ता दिखाया जा रहा है`);
    },
    err => {
      alert('लोकेशन एक्सेस नहीं मिली। कृपया लोकेशन परमिशन दें।');
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

/* Clear current route */
function clearRoute() {
  if (routingControl && leafletMap) {
    leafletMap.removeControl(routingControl);
    routingControl = null;
  }
}

/* Initialize the map (called on first visit to map page) */
function initMap() {
  if (leafletMap) return;

  const mapEl = document.getElementById('leaflet-map');
  if (!mapEl || typeof L === 'undefined') return;

  leafletMap = L.map('leaflet-map', {
    center: [20.0024, 73.7882],
    zoom: 14,
    zoomControl: true,
    attributionControl: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(leafletMap);

  // Add all marker layers
  Object.keys(MAP_MARKERS).forEach(category => {
    const markers = MAP_MARKERS[category];
    const layerGroup = L.layerGroup();

    markers.forEach(point => {
      const marker = L.marker([point.lat, point.lng], {
        icon: createMarkerIcon(category),
        title: point.name,
      });

      marker.bindPopup(`
        <div style="font-family:'Poppins',sans-serif;min-width:180px;">
          <strong style="font-size:13px;color:#3E2723;display:block;margin-bottom:4px;">${point.name}</strong>
          <p style="font-size:11px;color:#6D4C41;margin:0 0 10px;line-height:1.4;">${point.info}</p>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button onclick="getDirections(${point.lat},${point.lng},'${point.name.replace(/'/g, '')}')"
               style="display:inline-flex;align-items:center;gap:4px;background:#FF6F00;color:#fff;
                      padding:6px 10px;border-radius:12px;font-size:11px;font-weight:600;
                      border:none;cursor:pointer;">
              📍 रास्ता देखें
            </button>
            <button onclick="clearRoute()"
               style="display:inline-flex;align-items:center;gap:4px;background:#6D4C41;color:#fff;
                      padding:6px 10px;border-radius:12px;font-size:11px;font-weight:600;
                      border:none;cursor:pointer;">
              ✕ रास्ता हटाएं
            </button>
          </div>
        </div>
      `, { maxWidth: 240 });

      layerGroup.addLayer(marker);
    });

    mapLayers[category] = layerGroup;
    layerGroup.addTo(leafletMap);
  });

  // Bind filter buttons
  document.querySelectorAll('.map-filter-btn[data-category]').forEach(btn => {
    const cat = btn.dataset.category;

    if (cat === 'all') {
      btn.addEventListener('click', () => {
        const showAll = !btn.classList.contains('active');
        Object.keys(mapLayers).forEach(c => {
          if (showAll) {
            activeFilters.add(c);
            if (!leafletMap.hasLayer(mapLayers[c])) mapLayers[c].addTo(leafletMap);
          } else {
            activeFilters.delete(c);
            if (leafletMap.hasLayer(mapLayers[c])) leafletMap.removeLayer(mapLayers[c]);
          }
        });
        document.querySelectorAll('.map-filter-btn[data-category]').forEach(b => {
          b.classList.toggle('active', showAll);
        });
      });
    } else {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        if (activeFilters.has(cat)) {
          activeFilters.delete(cat);
          if (leafletMap.hasLayer(mapLayers[cat])) leafletMap.removeLayer(mapLayers[cat]);
        } else {
          activeFilters.add(cat);
          if (mapLayers[cat] && !leafletMap.hasLayer(mapLayers[cat])) {
            mapLayers[cat].addTo(leafletMap);
          }
        }
      });
    }
  });
}
   

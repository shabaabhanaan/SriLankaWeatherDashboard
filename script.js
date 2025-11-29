// Flood zones data and popup descriptions
const floodZones = [
  // Western Province
  { name: "Colombo",      coords: [6.9271, 79.8612], popup: "Colombo District" },
  { name: "Gampaha",      coords: [7.0906, 79.9975], popup: "Gampaha District" },
  { name: "Kalutara",     coords: [6.5833, 79.9667], popup: "Kalutara District" },

  // Central Province
  { name: "Kandy",        coords: [7.2906, 80.6337], popup: "Kandy District" },
  { name: "Matale",       coords: [7.4675, 80.6234], popup: "Matale District" },
  { name: "Nuwara Eliya", coords: [6.9708, 80.7829], popup: "Nuwara Eliya District" },

  // Southern Province
  { name: "Galle",        coords: [6.0535, 80.2210], popup: "Galle District" },
  { name: "Matara",       coords: [5.9478, 80.5423], popup: "Matara District" },
  { name: "Hambantota",   coords: [6.1240, 81.1185], popup: "Hambantota District" },

  // Northern Province
  { name: "Jaffna",       coords: [9.6615, 80.0255], popup: "Jaffna District" },
  { name: "Kilinochchi",  coords: [9.3763, 80.3995], popup: "Kilinochchi District" },
  { name: "Mannar",       coords: [8.9770, 79.9044], popup: "Mannar District" },
  { name: "Vavuniya",     coords: [8.7514, 80.4976], popup: "Vavuniya District" },
  { name: "Mullaitivu",   coords: [9.2671, 80.8151], popup: "Mullaitivu District" },

  // Eastern Province
  { name: "Batticaloa",   coords: [7.7314, 81.6924], popup: "Batticaloa District" },
  { name: "Ampara",       coords: [7.2970, 81.6820], popup: "Ampara District" },
  { name: "Trincomalee",  coords: [8.5711, 81.2335], popup: "Trincomalee District" },

  // North Western Province
  { name: "Kurunegala",   coords: [7.4863, 80.3623], popup: "Kurunegala District" },
  { name: "Puttalam",     coords: [8.0408, 79.8409], popup: "Puttalam District" },

  // North Central Province
  { name: "Anuradhapura", coords: [8.3114, 80.4037], popup: "Anuradhapura District" },
  { name: "Polonnaruwa",  coords: [7.9396, 81.0036], popup: "Polonnaruwa District" },

  // Uva Province
  { name: "Badulla",      coords: [6.9896, 81.0550], popup: "Badulla District" },
  { name: "Monaragala",   coords: [6.8731, 81.3500], popup: "Monaragala District" },

  // Sabaragamuwa Province
  { name: "Ratnapura",    coords: [6.6828, 80.3962], popup: "Ratnapura District" },
  { name: "Kegalle",      coords: [7.2513, 80.3464], popup: "Kegalle District" }
];


// DOM elements
const searchBtn             = document.getElementById('searchBtn');
const refreshBtn            = document.getElementById('refreshBtn');
const cityInput             = document.getElementById('cityInput');
const weatherContent        = document.getElementById('weatherContent');
const forecastInfo          = document.getElementById('forecastInfo');
const alertsContainer       = document.getElementById('alertsContent');
const notificationContainer = document.getElementById('notificationContainer');
const statusDiv             = document.getElementById('status');
const weatherSpinner        = document.getElementById('weatherSpinner');

// Initialize map
// Initialize map
const map = L.map('map').setView([7.8731, 80.7718], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors | Weather: Open-Meteo'
}).addTo(map);

// Fix map display issues
setTimeout(() => {
  map.invalidateSize();
}, 200);

// Handle window resize
window.addEventListener('resize', () => {
  setTimeout(() => map.invalidateSize(), 250);
});


// Geocoder control
L.Control.geocoder({
  defaultMarkGeocode: true,
  placeholder: 'Search location...'
}).addTo(map);


// Status helpers
function showStatus(message, type = 'loading') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
}
function hideStatus() {
  statusDiv.style.display = 'none';
}

// Notification helper
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  notificationContainer.appendChild(notification);
  setTimeout(() => notification.remove(), 5000);
}

// Geocode city to coordinates using Nominatim API
async function geocodeCity(city) {
  const c = city.trim().toLowerCase();

  // Try geocoding first
  try {
    showStatus(`Locating ${city}...`, 'loading');
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(city + ', Sri Lanka')}`
    );
    if (response.ok) {
      const data = await response.json();
      if (data[0]) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch {}

  // Fallback: Look up in district array if geocoding failed
  const fallback = floodZones.find(z => z.name.toLowerCase() === c);
  if (fallback) return fallback.coords;

  // Not found
  return null;
}


// Combined risk based on rain + wind
function getCombinedRisk(rain, wind) {
  if (rain > 50 || wind > 15) {
    return { color: 'red',    level: 'Extreme',  detail: 'Heavy rain / strong wind' };
  }
  if (rain > 20 || wind > 10) {
    return { color: 'orange', level: 'High',     detail: 'Moderate–heavy rain or windy' };
  }
  if (rain > 5 || wind > 5) {
    return { color: 'yellow', level: 'Moderate', detail: 'Light rain / breezy' };
  }
  return { color: 'green', level: 'Low', detail: 'Calm / little rain' };
}

// Update flood & wind risk for all zones
async function updateFloodZones() {
  showStatus('Updating flood & wind risk...', 'loading');

  const riskByZone = [];

  for (const zone of floodZones) {
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${zone.coords[0]}` +
        `&longitude=${zone.coords[1]}` +
        `&hourly=precipitation,windspeed_10m,temperature_2m` +
        `&timezone=Asia/Colombo&forecast_days=1`;

      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Failed to fetch data for ${zone.name}`);
        continue;
      }

      const data = await response.json();
      const h    = data.hourly;

      const rain = h && Array.isArray(h.precipitation)   ? (h.precipitation[0]   ?? 0) : 0;
      const wind = h && Array.isArray(h.windspeed_10m)   ? (h.windspeed_10m[0]   ?? 0) : 0;
      const temp = h && Array.isArray(h.temperature_2m)  ? (h.temperature_2m[0]  ?? 0) : 0;

      const risk = getCombinedRisk(rain, wind);

      // Remove old layer
      if (zone.layer) map.removeLayer(zone.layer);

      const radiusBase = 8;
      const radius = radiusBase + Math.min(rain, 60) / 4 + Math.min(wind, 20) / 2;

      zone.layer = L.circleMarker(zone.coords, {
        radius,
        color: risk.color,
        fillColor: risk.color,
        fillOpacity: 0.7,
        weight: 3
      }).addTo(map)
      .bindPopup(`
        <b>📍 ${zone.name}</b><br>
        🌧️ Rain: ${rain.toFixed(1)} mm<br>
        💨 Wind: ${wind.toFixed(1)} m/s<br>
        🌡️ Temp: ${temp.toFixed(1)} °C<br>
        🧭 Risk Level: <span style="color:${risk.color}; font-weight:bold;">${risk.level}</span><br>
        🔎 ${risk.detail}<br>
        <small>${zone.popup}</small>
      `);

      riskByZone.push({
        name: zone.name,
        level: risk.level,
        detail: risk.detail
      });
    } catch (error) {
      console.error(`Error updating ${zone.name}:`, error);
    }
  }

  showFloodAlerts(riskByZone);
  hideStatus();
}

// Show all risk levels in alerts panel
function showFloodAlerts(riskByZone) {
  if (!riskByZone || riskByZone.length === 0) {
    alertsContainer.innerHTML = '⚠️ No data for flood/wind risk right now.';
    return;
  }

  const extremeHigh = riskByZone.filter(z => z.level === 'Extreme' || z.level === 'High');
  const moderate    = riskByZone.filter(z => z.level === 'Moderate');
  const low         = riskByZone.filter(z => z.level === 'Low');

  let html = '';

  if (extremeHigh.length) {
    html += '<strong style="color:red;">🔴 High / Extreme Risk</strong><br>';
    html += extremeHigh
      .map(z => `🚨 ${z.name} – ${z.level} (${z.detail})`)
      .join('<br>') + '<br><br>';
  }

  if (moderate.length) {
    html += '<strong style="color:orange;">🟠 Moderate Risk</strong><br>';
    html += moderate
      .map(z => `⚠️ ${z.name} – ${z.level} (${z.detail})`)
      .join('<br>') + '<br><br>';
  }

  if (low.length) {
    html += '<strong style="color:green;">🟢 Low Risk</strong><br>';
    html += low
      .map(z => `✅ ${z.name} – ${z.level} (${z.detail})`)
      .join('<br>');
  }

  if (!html) html = '✅ No significant flood / wind risk detected.';

  alertsContainer.innerHTML = html;

  if (extremeHigh.length || moderate.length) {
    showNotification(`${extremeHigh.length + moderate.length} locations with Medium or higher risk.`);
  }
}

// Current weather + detailed hourly forecast
async function getRealTimeWeather(lat, lon) {
  weatherSpinner.style.display = 'block';
  weatherContent.innerHTML = '';

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&current_weather=true` +
      `&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,precipitation` +
      `&timezone=Asia/Colombo`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Weather API unavailable');

    const data    = await response.json();
    const current = data.current_weather;
    const hourly  = data.hourly;

    const rain     = hourly.precipitation[0];
    const humidity = hourly.relativehumidity_2m[0];
    const risk     = getCombinedRisk(rain, current.windspeed);

    weatherContent.innerHTML = `
      <div style="font-size: 1.2rem; margin-bottom: 15px;">
        📍 ${lat.toFixed(2)}, ${lon.toFixed(2)}
      </div>
      <div style="font-size: 2.5rem; font-weight: bold; margin-bottom: 20px;">
        ${current.temperature}°C
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px; font-size: 1.1rem;">
        <div>🌡️ ${current.temperature}°C</div>
        <div>🌧️ ${rain.toFixed(1)}mm</div>
        <div>💨 ${current.windspeed.toFixed(1)}m/s</div>
        <div>💧 ${humidity.toFixed(0)}%</div>
        <div style="color: ${risk.color}; font-weight: bold; font-size: 1.2rem;">🚨 ${risk.level}</div>
      </div>
    `;

    showEnhancedForecast(hourly);
  } catch (error) {
    console.error('Weather error:', error);
    weatherContent.innerHTML = `<p style="color: #ffc107;">⚠️ Weather data temporarily unavailable</p>`;
  } finally {
    weatherSpinner.style.display = 'none';
  }
}

// 6‑hour forecast cards
function showEnhancedForecast(hourly) {
  forecastInfo.innerHTML = '';

  for (let i = 0; i < Math.min(6, hourly.time.length); i++) {
    const date     = new Date(hourly.time[i]);
    const hours    = date.getHours().toString().padStart(2, '0');
    const temp     = hourly.temperature_2m[i];
    const humidity = hourly.relativehumidity_2m[i];
    const wind     = hourly.windspeed_10m[i];
    const rain     = hourly.precipitation[i];

    const risk     = getCombinedRisk(rain, wind);

    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">${hours}:00</div>
      <div style="font-size: 1.8rem; margin-bottom: 10px;">${temp.toFixed(1)}°C</div>
      <div style="font-size: 0.9rem; opacity: 0.9;">
        💧 ${humidity.toFixed(0)}% | 💨 ${wind.toFixed(1)}m/s<br>
        🌧️ ${rain.toFixed(1)}mm
        <span style="color: ${risk.color}; font-weight: 600;">${risk.level}</span>
      </div>
    `;
    forecastInfo.appendChild(card);
  }
}

// Search handler
async function handleSearch() {
  const city = cityInput.value.trim();
  if (!city) {
    showStatus('Please enter a city or place name.', 'error');
    return;
  }

  hideStatus();

  const coords = await geocodeCity(city);
  if (!coords) {
    showStatus('Place not found in Sri Lanka.', 'error');
    return;
  }

  map.setView(coords, 10);
  await getRealTimeWeather(coords[0], coords[1]);
  await updateFloodZones();
}

// Events
searchBtn.addEventListener('click', handleSearch);

refreshBtn.addEventListener('click', async () => {
  if (!cityInput.value.trim()) {
    showStatus('Please enter a city to refresh weather.', 'error');
    return;
  }
  await handleSearch();
});

cityInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') handleSearch();
});

// Auto‑refresh every 10 minutes
setInterval(() => {
  if (cityInput.value.trim()) handleSearch();
}, 600000);

// Initial load
updateFloodZones();

// Make map responsive on window resize
window.addEventListener('resize', () => {
  if (map) {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }
});

async function loadWeatherNews() {
    const newsBox = document.getElementById("newsContent");
    newsBox.innerHTML = "Loading latest weather news...";

    try {
        const keywords = "Sri Lanka weather OR Sri Lanka rain OR Sri Lanka flood OR monsoon OR cyclone OR landslide";

        const response = await fetch(
            `https://newsapi.org/v2/everything?q=${encodeURIComponent(
                keywords
            )}&language=en&sortBy=publishedAt&apiKey=6d371dd33eb04582a57d9b6cf8f37d72`
        );

        const data = await response.json();

        if (!data.articles || data.articles.length === 0) {
            newsBox.innerHTML = "No weather updates at the moment.";
            return;
        }

        newsBox.innerHTML = data.articles
            .slice(0, 6)
            .map(article => `
                <div class="news-item">
                    <h4>${article.title}</h4>
                    <p>${article.description || ""}</p>
                    <a href="${article.url}" target="_blank">Read more →</a>
                    <hr>
                </div>
            `)
            .join("");

    } catch (error) {
        newsBox.innerHTML = "⚠️ Failed to load weather news.";
        console.error("News API error:", error);
    }
}

// Load weather news on page start
loadWeatherNews();

// Refresh every 10 minutes
setInterval(loadWeatherNews, 600000);

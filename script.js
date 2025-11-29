// ================================
// DOM Elements
// ================================
const searchBtn             = document.getElementById('searchBtn');
const refreshBtn            = document.getElementById('refreshBtn');
const cityInput             = document.getElementById('cityInput');
const weatherContent        = document.getElementById('weatherContent');
const forecastInfo          = document.getElementById('forecastInfo');
const alertsContainer       = document.getElementById('alertsContent');
const notificationContainer = document.getElementById('notificationContainer');
const statusDiv             = document.getElementById('status');
const weatherSpinner        = document.getElementById('weatherSpinner');
const newsSpinner           = document.getElementById('newsSpinner');
const newsContent           = document.getElementById('newsContent');

// ================================
// Flood Zones Data
// ================================
const floodZones = [
    { name: "Colombo", coords: [6.9271, 79.8612] },
    { name: "Gampaha", coords: [7.0906, 79.9975] },
    { name: "Kalutara", coords: [6.5833, 79.9667] },
    { name: "Kandy", coords: [7.2906, 80.6337] },
    { name: "Matale", coords: [7.4675, 80.6234] },
    { name: "Nuwara Eliya", coords: [6.9708, 80.7829] },
    { name: "Galle", coords: [6.0535, 80.2210] },
    { name: "Matara", coords: [5.9478, 80.5423] },
    { name: "Hambantota", coords: [6.1240, 81.1185] },
    { name: "Jaffna", coords: [9.6615, 80.0255] },
    { name: "Kilinochchi", coords: [9.3763, 80.3995] },
    { name: "Mannar", coords: [8.9770, 79.9044] },
    { name: "Vavuniya", coords: [8.7514, 80.4976] },
    { name: "Mullaitivu", coords: [9.2671, 80.8151] },
    { name: "Batticaloa", coords: [7.7314, 81.6924] },
    { name: "Ampara", coords: [7.2970, 81.6820] },
    { name: "Trincomalee", coords: [8.5711, 81.2335] },
    { name: "Kurunegala", coords: [7.4863, 80.3623] },
    { name: "Puttalam", coords: [8.0408, 79.8409] },
    { name: "Anuradhapura", coords: [8.3114, 80.4037] },
    { name: "Polonnaruwa", coords: [7.9396, 81.0036] },
    { name: "Badulla", coords: [6.9896, 81.0550] },
    { name: "Monaragala", coords: [6.8731, 81.3500] },
    { name: "Ratnapura", coords: [6.6828, 80.3962] },
    { name: "Kegalle", coords: [7.2513, 80.3464] }
];

// Simulated Flood Alerts
const floodAlerts = [
    { name: "Colombo", risk: "Extreme", description: "Heavy rain / strong wind" },
    { name: "Gampaha", risk: "Extreme", description: "Heavy rain / strong wind" },
    { name: "Kalutara", risk: "Extreme", description: "Heavy rain / strong wind" },
    { name: "Kandy", risk: "Extreme", description: "Heavy rain / strong wind" },
    { name: "Matale", risk: "High", description: "Moderate-heavy rain / windy" },
    { name: "Nuwara Eliya", risk: "Extreme", description: "Heavy rain / strong wind" },
    { name: "Galle", risk: "Extreme", description: "Heavy rain / strong wind" },
    { name: "Matara", risk: "Extreme", description: "Heavy rain / strong wind" },
    { name: "Hambantota", risk: "Extreme", description: "Heavy rain / strong wind" }
];

// ================================
// Initialize Map
// ================================
const map = L.map('map').setView([7.8731, 80.7718], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors | Weather: Open-Meteo'
}).addTo(map);

// Fix map rendering
setTimeout(() => map.invalidateSize(), 200);
window.addEventListener('resize', () => setTimeout(() => map.invalidateSize(), 250));

// ================================
// Add Flood Zone Markers
// ================================
floodZones.forEach(zone => {
    const alert = floodAlerts.find(a => a.name === zone.name);
    let color;
    if(alert){
        color = alert.risk === "Extreme" ? "red" :
                alert.risk === "High" ? "orange" :
                "yellow";
    } else { color = "green"; }

    const circle = L.circleMarker(zone.coords, {
        radius: 10,
        color: color,
        fillColor: color,
        fillOpacity: 0.6,
        weight: 1
    }).addTo(map);

    circle.bindPopup(`<strong>${zone.name}</strong><br>${alert ? alert.risk : 'No Alert'}`);
});

// ================================
// Populate Flood Alerts Section
// ================================
function loadFloodAlerts(){
    alertsContainer.innerHTML = "";
    floodAlerts.forEach(alert => {
        const div = document.createElement('div');
        div.innerHTML = `🚨 <strong>${alert.name}</strong> - ${alert.risk} (${alert.description})`;
        alertsContainer.appendChild(div);
    });
}
loadFloodAlerts();

// ================================
// Fetch Weather (Open-Meteo API)
// ================================
async function fetchWeather(city = "Colombo") {
    weatherSpinner.style.display = "block";
    weatherContent.innerHTML = "";
    forecastInfo.innerHTML = "";

    try {
        // For simplicity, using Colombo coordinates; ideally you convert city -> lat/lon
        const url = `https://api.open-meteo.com/v1/forecast?latitude=6.9271&longitude=79.8612&current_weather=true&hourly=temperature_2m,precipitation`;
        const res = await fetch(url);
        const data = await res.json();

        weatherSpinner.style.display = "none";

        if(!data.current_weather){
            weatherContent.innerHTML = "Weather data not available";
            return;
        }

        weatherContent.innerHTML = `
            🌡️ Temp: ${data.current_weather.temperature}°C<br>
            💨 Wind: ${data.current_weather.windspeed} km/h<br>
            ⛅ Weather Code: ${data.current_weather.weathercode}
        `;

        // Forecast (next 6 hours)
        const hourly = data.hourly.temperature_2m.slice(0,6);
        hourly.forEach((temp, idx) => {
            const div = document.createElement('div');
            div.className = "forecast-item";
            div.innerHTML = `Hour +${idx+1}: ${temp}°C`;
            forecastInfo.appendChild(div);
        });

    } catch(err) {
        weatherSpinner.style.display = "none";
        weatherContent.innerHTML = "Error fetching weather data";
        console.error(err);
    }
}
fetchWeather();

// ================================
// Load Sri Lanka News (Secure Backend)
// ================================
async function loadSriLankaNews() {
    newsSpinner.style.display = "block";
    newsContent.innerHTML = "";

    try {
        const res = await fetch("/api/news"); // Backend proxy
        const data = await res.json();

        newsSpinner.style.display = "none";

        if(!data.news || data.news.length === 0){
            newsContent.innerHTML = "<p>No news available</p>";
            return;
        }

        data.news.forEach(item => {
            const div = document.createElement("div");
            div.className = "news-item";
            div.innerHTML = `
                <h4>${item.title}</h4>
                <p>${item.summary || "No summary available."}</p>
                <a href="${item.url}" target="_blank">Read Full Article</a>
            `;
            newsContent.appendChild(div);
        });

    } catch(err) {
        newsSpinner.style.display = "none";
        newsContent.innerHTML = "<p>Error loading news</p>";
        console.error(err);
    }
}
loadSriLankaNews();

// ================================
// Search & Refresh Buttons
// ================================
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if(city){
        fetchWeather(city);
    } else {
        alert("Please enter a city name!");
    }
});

refreshBtn.addEventListener('click', () => {
    fetchWeather();
    loadSriLankaNews();
    loadFloodAlerts();
});    { name: "Kurunegala", coords: [7.4863, 80.3623] },
    { name: "Puttalam", coords: [8.0408, 79.8409] },
    { name: "Anuradhapura", coords: [8.3114, 80.4037] },
    { name: "Polonnaruwa", coords: [7.9396, 81.0036] },
    { name: "Badulla", coords: [6.9896, 81.0550] },
    { name: "Monaragala", coords: [6.8731, 81.3500] },
    { name: "Ratnapura", coords: [6.6828, 80.3962] },
    { name: "Kegalle", coords: [7.2513, 80.3464] }
];

// Simulated flood alerts (replace with real API data if available)
const floodAlerts = [
    { name: "Colombo", risk: "Extreme", description: "Heavy rain / strong wind" },
    { name: "Gampaha", risk: "Extreme", description: "Heavy rain / strong wind" },
    { name: "Kalutara", risk: "Extreme", description: "Heavy rain / strong wind" },
    { name: "Kandy", risk: "Extreme", description: "Heavy rain / strong wind" },
    { name: "Matale", risk: "High", description: "Moderate-heavy rain / windy" },
    { name: "Nuwara Eliya", risk: "Extreme", description: "Heavy rain / strong wind" },
    { name: "Galle", risk: "Extreme", description: "Heavy rain / strong wind" },
    { name: "Matara", risk: "Extreme", description: "Heavy rain / strong wind" },
    { name: "Hambantota", risk: "Extreme", description: "Heavy rain / strong wind" }
];

// ================================
// Initialize Map
// ================================
const map = L.map('map').setView([7.8731, 80.7718], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors | Weather: Open-Meteo'
}).addTo(map);

// Fix map rendering
setTimeout(() => map.invalidateSize(), 200);
window.addEventListener('resize', () => setTimeout(() => map.invalidateSize(), 250));

// ================================
// Add Flood Zone Markers
// ================================
floodZones.forEach(zone => {
    const alert = floodAlerts.find(a => a.name === zone.name);
    let color;
    if(alert){
        color = alert.risk === "Extreme" ? "red" :
                alert.risk === "High" ? "orange" :
                "yellow";
    } else { color = "green"; }

    const circle = L.circleMarker(zone.coords, {
        radius: 10,
        color: color,
        fillColor: color,
        fillOpacity: 0.6,
        weight: 1
    }).addTo(map);

    circle.bindPopup(`<strong>${zone.name}</strong><br>${alert ? alert.risk : 'No Alert'}`);
});

// ================================
// Populate Flood Alerts Section
// ================================
function loadFloodAlerts(){
    alertsContainer.innerHTML = "";
    floodAlerts.forEach(alert => {
        const div = document.createElement('div');
        div.innerHTML = `🚨 <strong>${alert.name}</strong> - ${alert.risk} (${alert.description})`;
        alertsContainer.appendChild(div);
    });
}
loadFloodAlerts();

// ================================
// Fetch Weather
// ================================
async function fetchWeather(city = "Colombo") {
    weatherSpinner.style.display = "block";
    weatherContent.innerHTML = "";
    forecastInfo.innerHTML = "";

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=6.9271&longitude=79.8612&current_weather=true&hourly=temperature_2m,precipitation`;
        const res = await fetch(url);
        const data = await res.json();

        weatherSpinner.style.display = "none";

        if(!data.current_weather){
            weatherContent.innerHTML = "Weather data not available";
            return;
        }

        weatherContent.innerHTML = `
            🌡️ Temp: ${data.current_weather.temperature}°C<br>
            💨 Wind: ${data.current_weather.windspeed} km/h<br>
            ⛅ Weather: ${data.current_weather.weathercode}
        `;

        // Forecast (next 6 hours)
        const hourly = data.hourly.temperature_2m.slice(0,6);
        hourly.forEach((temp, idx) => {
            const div = document.createElement('div');
            div.className = "forecast-item";
            div.innerHTML = `Hour +${idx+1}: ${temp}°C`;
            forecastInfo.appendChild(div);
        });

    } catch(err) {
        weatherSpinner.style.display = "none";
        weatherContent.innerHTML = "Error fetching weather data";
    }
}
fetchWeather();

// ================================
// Load Sri Lanka News (Secure Backend)
// ================================
async function loadSriLankaNews() {
    newsSpinner.style.display = "block";
    newsContent.innerHTML = "";

    try {
        const res = await fetch("/api/news"); // Your backend proxy
        const data = await res.json();

        newsSpinner.style.display = "none";

        if(!data.news || data.news.length === 0){
            newsContent.innerHTML = "<p>No news available</p>";
            return;
        }

        data.news.forEach(item => {
            const div = document.createElement("div");
            div.className = "news-item";
            div.innerHTML = `
                <h4>${item.title}</h4>
                <p>${item.summary || "No summary available."}</p>
                <a href="${item.url}" target="_blank">Read Full Article</a>
            `;
            newsContent.appendChild(div);
        });

    } catch(err) {
        newsSpinner.style.display = "none";
        newsContent.innerHTML = "<p>Error loading news</p>";
    }
}
loadSriLankaNews();

// ================================
// Search & Refresh Buttons
// ================================
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if(city){
        fetchWeather(city);
    } else {
        alert("Please enter a city name!");
    }
});

refreshBtn.addEventListener('click', () => {
    fetchWeather();
    loadSriLankaNews();
    loadFloodAlerts();
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
async function loadSriLankaNews() {
    const newsContent = document.getElementById("newsContent");
    const spinner = document.getElementById("newsSpinner");

    spinner.style.display = "block";
    newsContent.innerHTML = "";

    try {
        const response = await fetch("/api/news"); // backend proxy
        const data = await response.json();

        spinner.style.display = "none";

        if (!data.news || data.news.length === 0) {
            newsContent.innerHTML = "<p>No news currently.</p>";
            return;
        }

        data.news.forEach(item => {
            const div = document.createElement("div");
            div.className = "news-item";
            div.innerHTML = `
                <h4>${item.title}</h4>
                <p>${item.summary || "No summary available."}</p>
                <a href="${item.url}" target="_blank">Read Full Article</a>
            `;
            newsContent.appendChild(div);
        });
    } catch (err) {
        spinner.style.display = "none";
        newsContent.innerHTML = "<p>Error loading news.</p>";
    }
}

loadSriLankaNews();
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
async function loadSriLankaNews() {
    const newsContent = document.getElementById("newsContent");
    const spinner = document.getElementById("newsSpinner");

    spinner.style.display = "block";
    newsContent.innerHTML = "";

    try {
        // Call your backend proxy (safe)
        const response = await fetch("https://your-proxy-url/news");

        const data = await response.json();

        spinner.style.display = "none";

        if (!data || data.news.length === 0) {
            newsContent.innerHTML = "<p>No current news available.</p>";
            return;
        }

        data.news.forEach(item => {
            const div = document.createElement("div");
            div.className = "news-item";

            div.innerHTML = `
                <h4>${item.title}</h4>
                <p>${item.summary || "No summary available."}</p>
                <a href="${item.url}" target="_blank">Read Full Article</a>
            `;

            newsContent.appendChild(div);
        });

    } catch (err) {
        spinner.style.display = "none";
        newsContent.innerHTML = "<p>Error loading news.</p>";
    }
}

loadSriLankaNews();
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

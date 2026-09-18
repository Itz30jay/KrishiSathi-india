/* ============================================================
   KrishiSathi India - Weather Module
   Open-Meteo API (100% Free, No API Key Required)
   + Nominatim Reverse Geocoding (Free, No Key)
   ============================================================ */
 
// Open-Meteo base URLs
const OPEN_METEO_BASE    = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_BASE     = 'https://geocoding-api.open-meteo.com/v1/search';
const NOMINATIM_BASE     = 'https://nominatim.openstreetmap.org/reverse';

/* ============================================================
   SAVED LOCATION (fixes "keeps detecting the wrong place")
   ------------------------------------------------------------
   GPS and manually-searched locations are trustworthy, so they're
   remembered — once you're correctly detected (or you search your
   own city), the app stops re-guessing on every visit. IP-based
   location is only ever approximate (it reflects your ISP's
   network, not your exact address), so it's intentionally NOT
   auto-saved — that would risk permanently locking in a wrong
   guess. It's shown clearly labelled instead, with an easy way to
   correct it via the search box.
   ============================================================ */
const SAVED_LOCATION_KEY = 'krishisathi-location';

function getSavedLocation() {
  try {
    const raw = localStorage.getItem(SAVED_LOCATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

function saveLocation(lat, lon, label, source) {
  try {
    localStorage.setItem(SAVED_LOCATION_KEY, JSON.stringify({ lat, lon, label, source, savedAt: Date.now() }));
  } catch (_) {}
}

function clearSavedLocation() {
  try { localStorage.removeItem(SAVED_LOCATION_KEY); } catch (_) {}
}
 
// WMO Weather Code → emoji + description
const WMO_CODES = {
  0:  { icon: '☀️',  desc: 'Clear Sky' },
  1:  { icon: '🌤️', desc: 'Mainly Clear' },
  2:  { icon: '⛅',  desc: 'Partly Cloudy' },
  3:  { icon: '☁️',  desc: 'Overcast' },
  45: { icon: '🌫️', desc: 'Fog' },
  48: { icon: '🌫️', desc: 'Icy Fog' },
  51: { icon: '🌦️', desc: 'Light Drizzle' },
  53: { icon: '🌦️', desc: 'Drizzle' },
  55: { icon: '🌧️', desc: 'Heavy Drizzle' },
  61: { icon: '🌧️', desc: 'Slight Rain' },
  63: { icon: '🌧️', desc: 'Rain' },
  65: { icon: '🌧️', desc: 'Heavy Rain' },
  71: { icon: '❄️',  desc: 'Slight Snow' },
  73: { icon: '❄️',  desc: 'Snow' },
  75: { icon: '❄️',  desc: 'Heavy Snow' },
  77: { icon: '🌨️', desc: 'Snow Grains' },
  80: { icon: '🌦️', desc: 'Rain Showers' },
  81: { icon: '🌧️', desc: 'Showers' },
  82: { icon: '⛈️', desc: 'Violent Showers' },
  85: { icon: '🌨️', desc: 'Snow Showers' },
  86: { icon: '🌨️', desc: 'Heavy Snow Showers' },
  95: { icon: '⛈️', desc: 'Thunderstorm' },
  96: { icon: '⛈️', desc: 'Thunderstorm w/ Hail' },
  99: { icon: '⛈️', desc: 'Thunderstorm w/ Heavy Hail' }
};
 
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
 
// Shared query params for Open-Meteo
const METEO_PARAMS = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'wind_speed_10m',
  'precipitation',
  'weathercode',
  'visibility',
  'uv_index'
].join(',');
 
const METEO_DAILY_PARAMS = [
  'weathercode',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'windspeed_10m_max'
].join(',');
 
 
/* ============================================================
   CITY SEARCH → Geocoding → Weather
   ============================================================ */
async function getWeatherByCity(city) {
  try {
    showWeatherLoading(true);
 
    // Step 1: Geocode city name via Open-Meteo Geocoding API
    const geoRes = await fetch(
      `${GEOCODING_BASE}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    if (!geoRes.ok) throw new Error('Geocoding request failed.');
 
    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
      throw new Error(`City "${city}" not found. Please try another name.`);
    }
 
    const { latitude, longitude, name, admin1, country } = geoData.results[0];
    const locationLabel = [name, admin1, country].filter(Boolean).join(', ');

    // A manual search is the most reliable signal of where the user actually
    // is — remember it so we stop guessing (possibly wrong) on future visits.
    saveLocation(latitude, longitude, locationLabel, 'manual');
    showLocationBanner('manual', locationLabel);
 
    // Step 2: Fetch weather with coordinates
    await fetchAndDisplayWeather(latitude, longitude, locationLabel);
 
  } catch (err) {
    console.error('Weather by city error:', err);
    showWeatherError(err.message);
  } finally {
    showWeatherLoading(false);
  }
}
 
 
/* ============================================================
   COORDS → Weather
   ============================================================ */
async function getWeatherByCoords(lat, lon, presetLabel, source) {
  try {
    showWeatherLoading(true);

    let locationLabel = presetLabel || `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;

    if (!presetLabel) {
      try {
        const revRes = await fetch(
          `${NOMINATIM_BASE}?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        if (revRes.ok) {
          const revData = await revRes.json();
          const addr = revData.address || {};
          const city = addr.city || addr.town || addr.village || addr.county || '';
          const state = addr.state || '';
          locationLabel = [city, state, 'India'].filter(Boolean).join(', ');

          // Update city input field for reference
          const cityInput = document.getElementById('city-input');
          if (cityInput && city) cityInput.value = city;
        }
      } catch (_) { /* use fallback label */ }
    }

    // GPS is trustworthy — remember it so we don't need to ask again next visit.
    if (source === 'gps') saveLocation(lat, lon, locationLabel, 'gps');

    await fetchAndDisplayWeather(lat, lon, locationLabel);
    showLocationBanner(source, locationLabel);

  } catch (err) {
    console.error('Weather by coords error:', err);
    showWeatherError(err.message);
  } finally {
    showWeatherLoading(false);
  }
}
 
 
/* ============================================================
   CORE FETCH + DISPLAY (shared by city & coords paths)
   ============================================================ */
async function fetchAndDisplayWeather(lat, lon, locationLabel) {
  const url = new URL(OPEN_METEO_BASE);
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('current', METEO_PARAMS);
  url.searchParams.set('daily', METEO_DAILY_PARAMS);
  url.searchParams.set('timezone', 'Asia/Kolkata');
  url.searchParams.set('forecast_days', '7');
  url.searchParams.set('wind_speed_unit', 'kmh');
 
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Weather service is temporarily unavailable. Please try again.');
 
  const data = await res.json();
 
  displayCurrentWeather(data, locationLabel);
  displayForecast(data);
  generateFarmingAdvice(data.current, locationLabel);
  updateCropSuggestions(data.current);
}
 
 
/* ============================================================
   DISPLAY CURRENT WEATHER
   ============================================================ */
function displayCurrentWeather(data, locationLabel) {
  const c = data.current;
  const wmo = WMO_CODES[c.weathercode] || { icon: '🌤️', desc: 'Unknown' };
  const temp = Math.round(c.temperature_2m);

  // Update the dashboard mini-widget whenever it exists on the page — this
  // must NOT depend on the full weather-current card below, since the
  // Dashboard page has the mini-widget but not that card.
  updateDashboardWeather(temp, wmo.desc, wmo.icon, locationLabel.split(',')[0]);

  const container = document.getElementById('weather-current');
  if (!container) return;

  const feelsLike = Math.round(c.apparent_temperature);
  const humidity  = c.relative_humidity_2m;
  const wind      = Math.round(c.wind_speed_10m);
  const precip    = c.precipitation ?? 0;
  const vis       = c.visibility != null ? (c.visibility / 1000).toFixed(1) : 'N/A';
  const uv        = c.uv_index ?? '—';
  const now       = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
 
  container.innerHTML = `
    <div class="weather-card">
      <div class="weather-location">
        <span style="font-size:1.05rem;font-weight:700;font-family:var(--font-display)">
          📍 ${locationLabel}
        </span>
        <span style="font-size:0.78rem;color:var(--green-200)">Updated: ${now}</span>
      </div>
 
      <div class="weather-main" style="margin-top:1rem">
        <div>
          <div style="font-size:5rem;line-height:1">${wmo.icon}</div>
          <div style="font-size:0.9rem;color:var(--green-200);margin-top:0.3rem">${wmo.desc}</div>
        </div>
        <div>
          <div class="weather-temp-big">${temp}°C</div>
          <div style="font-size:0.85rem;color:var(--green-200)">Feels like ${feelsLike}°C</div>
        </div>
      </div>
 
      <div class="weather-details-grid" style="margin-top:1.5rem">
        <div class="weather-detail-item">
          <span style="font-size:1.3rem">💧</span>
          <div>
            <div class="label">Humidity</div>
            <div class="value">${humidity}%</div>
          </div>
        </div>
        <div class="weather-detail-item">
          <span style="font-size:1.3rem">💨</span>
          <div>
            <div class="label">Wind Speed</div>
            <div class="value">${wind} km/h</div>
          </div>
        </div>
        <div class="weather-detail-item">
          <span style="font-size:1.3rem">🌧️</span>
          <div>
            <div class="label">Precipitation</div>
            <div class="value">${precip} mm</div>
          </div>
        </div>
        <div class="weather-detail-item">
          <span style="font-size:1.3rem">☀️</span>
          <div>
            <div class="label">UV Index</div>
            <div class="value">${uv}</div>
          </div>
        </div>
        <div class="weather-detail-item">
          <span style="font-size:1.3rem">👁️</span>
          <div>
            <div class="label">Visibility</div>
            <div class="value">${vis} km</div>
          </div>
        </div>
        <div class="weather-detail-item">
          <span style="font-size:1.3rem">🌡️</span>
          <div>
            <div class="label">Condition</div>
            <div class="value" style="font-size:0.8rem">${wmo.desc}</div>
          </div>
        </div>
      </div>
 
      ${buildRainAlert(c)}
    </div>
  `;
}
 
 
/* ============================================================
   DISPLAY 7-DAY FORECAST
   ============================================================ */
function displayForecast(data) {
  const container = document.getElementById('weather-forecast');
  if (!container) return;
 
  const daily = data.daily;
  if (!daily || !daily.time) return;
 
  const days = daily.time.slice(0, 7).map((dateStr, i) => {
    const wmo = WMO_CODES[daily.weathercode[i]] || { icon: '🌤️' };
    const max = Math.round(daily.temperature_2m_max[i]);
    const min = Math.round(daily.temperature_2m_min[i]);
    const date = new Date(dateStr + 'T00:00:00');
    const dayName = i === 0 ? 'Today' : DAYS_SHORT[date.getDay()];
    const rain = daily.precipitation_sum[i] ?? 0;
 
    return `
      <div class="forecast-day">
        <div class="day-name">${dayName}</div>
        <div class="day-icon">${wmo.icon}</div>
        <div class="day-temp">${max}° / <span style="color:var(--green-200);font-weight:400">${min}°</span></div>
        ${rain > 0 ? `<div style="font-size:0.7rem;color:var(--sky);margin-top:0.2rem">💧${rain}mm</div>` : ''}
      </div>
    `;
  });
 
  container.innerHTML = `
    <h3 style="font-family:var(--font-display);font-weight:700;margin-bottom:1rem;font-size:1rem">
      📅 7-Day Forecast
    </h3>
    <div class="forecast-grid forecast-grid-7">
      ${days.join('')}
    </div>
  `;
}
 
 
/* ============================================================
   FARMING ADVICE
   ============================================================ */
function generateFarmingAdvice(current, location) {
  const container = document.getElementById('farming-advice');
  if (!container) return;
 
  const temp     = Math.round(current.temperature_2m);
  const humidity = current.relative_humidity_2m;
  const wind     = Math.round(current.wind_speed_10m);
  const wmo      = WMO_CODES[current.weathercode] || { desc: 'Clear' };
  const precip   = current.precipitation ?? 0;
  const uv       = current.uv_index ?? 0;
 
  const advice = [];
 
  // Temperature advice
  if (temp > 40) {
    advice.push({ icon: '🔥', text: 'Extreme heat warning! Irrigate crops in early morning or evening only. Cover young seedlings with shade nets.' });
  } else if (temp > 35) {
    advice.push({ icon: '🌡️', text: 'High temperatures. Increase irrigation frequency. Mulch soil to retain moisture and reduce heat stress.' });
  } else if (temp >= 20 && temp <= 35) {
    advice.push({ icon: '✅', text: 'Temperature is optimal for most Kharif crops. Good time for sowing, transplanting, or field operations.' });
  } else if (temp < 10) {
    advice.push({ icon: '❄️', text: 'Cold conditions. Protect seedlings from frost. Delay irrigation to avoid waterlogging in cold soil.' });
  }
 
  // Humidity advice
  if (humidity > 85) {
    advice.push({ icon: '🍄', text: 'Very high humidity — fungal and blight disease risk is elevated. Apply preventive fungicide, ensure good drainage.' });
  } else if (humidity > 70) {
    advice.push({ icon: '⚠️', text: 'Moderate-high humidity. Monitor crops for early signs of fungal disease, especially paddy and cotton.' });
  } else if (humidity < 35) {
    advice.push({ icon: '💧', text: 'Low humidity detected. Increase drip/sprinkler irrigation. Check soil moisture regularly.' });
  }
 
  // Precipitation / rain advice
  if (precip > 5) {
    advice.push({ icon: '🌧️', text: 'Significant rainfall. Avoid pesticide and fertilizer application — rain will wash them away. Check field drainage.' });
    advice.push({ icon: '🌱', text: 'Good time for transplanting seedlings. Natural irrigation reduces water costs.' });
  } else if (current.weathercode >= 61 && current.weathercode <= 82) {
    advice.push({ icon: '🌦️', text: 'Rainy/showery conditions expected. Postpone field spraying operations. Inspect crops for waterlogging.' });
  } else if (current.weathercode <= 1) {
    advice.push({ icon: '☀️', text: 'Clear skies — ideal for harvesting dry crops, threshing, and post-harvest drying operations.' });
  }
 
  // Wind advice
  if (wind > 30) {
    advice.push({ icon: '💨', text: 'Strong winds (>30 km/h). Do NOT spray pesticides or fertilizers — risk of drift damage to neighbouring crops.' });
  } else if (wind > 15) {
    advice.push({ icon: '🌬️', text: 'Moderate wind. Apply foliar sprays early morning when wind is calm for best absorption.' });
  }
 
  // UV advice
  if (uv >= 8) {
    advice.push({ icon: '🧴', text: 'Very high UV index. Farm workers should wear protective clothing and hats. Avoid field work 11 AM–3 PM.' });
  }
 
  if (advice.length === 0) {
    advice.push({ icon: '🌾', text: 'Weather conditions are stable. Good time for general crop maintenance and scouting for pest activity.' });
  }
 
  container.innerHTML = `
    <h3 style="font-family:var(--font-display);font-weight:700;margin-bottom:1rem;font-size:1.1rem">
      🌱 Farming Recommendations
    </h3>
    <div style="display:flex;flex-direction:column;gap:0.8rem">
      ${advice.map(a => `
        <div style="display:flex;align-items:flex-start;gap:0.8rem;padding:0.8rem;background:rgba(255,255,255,0.04);border-radius:12px;border:1px solid rgba(255,255,255,0.08)">
          <span style="font-size:1.3rem;flex-shrink:0">${a.icon}</span>
          <span style="font-size:0.88rem;color:var(--green-100);line-height:1.5">${a.text}</span>
        </div>
      `).join('')}
    </div>
  `;
}
 
 
/* ============================================================
   CROP SUGGESTIONS BASED ON WEATHER
   ============================================================ */
function updateCropSuggestions(current) {
  const container = document.getElementById('weather-crops');
  if (!container) return;
 
  const temp     = Math.round(current.temperature_2m);
  const humidity = current.relative_humidity_2m;
  const wmo      = current.weathercode;
 
  let crops = [];
 
  if (temp >= 25 && temp <= 38 && humidity >= 60) {
    crops = ['🌾 Rice', '🌽 Maize', '🥜 Groundnut', '🌿 Cotton', '🫘 Soybean', '🌶️ Chilli'];
  } else if (temp >= 15 && temp <= 25) {
    crops = ['🌾 Wheat', '🌱 Mustard', '🫛 Chickpea', '🧅 Onion', '🥕 Carrot', '🫘 Lentil'];
  } else if (temp >= 20 && temp <= 30 && wmo >= 51) {
    crops = ['🌾 Rice', '🌿 Jute', '🌽 Maize', '🍅 Tomato', '🥬 Spinach'];
  } else if (temp > 38) {
    crops = ['🌵 Bajra', '🌾 Jowar', '🌻 Sunflower', '🌿 Cotton'];
  } else {
    crops = ['🌾 Rice', '🌽 Maize', '🥜 Groundnut', '🌿 Cotton', '🫘 Soybean'];
  }
 
  container.innerHTML = crops.map(c => `<span class="crop-chip">${c}</span>`).join('');
}
 
 
/* ============================================================
   RAIN / STORM ALERT BANNER
   ============================================================ */
function buildRainAlert(current) {
  const wmo = current.weathercode;
  const precip = current.precipitation ?? 0;
 
  if (wmo >= 95) {
    return `<div style="margin-top:1rem;padding:0.8rem 1rem;background:rgba(230,57,70,0.15);border:1px solid rgba(230,57,70,0.3);border-radius:12px;font-size:0.85rem;color:#ff6b6b">
      ⚡ <strong>Thunderstorm Alert:</strong> Stay indoors. Avoid open fields and tall trees. Secure farm equipment.
    </div>`;
  }
  if (precip > 10 || (wmo >= 65 && wmo <= 82)) {
    return `<div style="margin-top:1rem;padding:0.8rem 1rem;background:rgba(0,180,216,0.1);border:1px solid rgba(0,180,216,0.3);border-radius:12px;font-size:0.85rem;color:var(--sky)">
      🌧️ <strong>Rain Alert:</strong> Heavy rain expected. Check field drainage and postpone spraying.
    </div>`;
  }
  return '';
}
 
 
/* ============================================================
   LOADING / ERROR STATES
   ============================================================ */
function showLocationBanner(source, label) {
  const container = document.getElementById('weather-current');
  if (!container || !source) return;

  const existing = document.getElementById('location-confidence-banner');
  if (existing) existing.remove();
  if (source === 'gps') return; // precise — no caveat needed

  const banner = document.createElement('div');
  banner.id = 'location-confidence-banner';
  banner.style.cssText = 'margin-top:0.8rem;padding:0.6rem 1rem;border-radius:10px;font-size:0.78rem;text-align:center;line-height:1.6';

  if (source === 'ip') {
    banner.style.background = 'rgba(255,193,7,0.08)';
    banner.style.border = '1px solid rgba(255,193,7,0.2)';
    banner.style.color = 'var(--gold-300)';
    banner.innerHTML = `📍 <strong>Approximate location</strong> (based on your internet connection, not GPS) — this can be a different city than expected. ` +
      `Type your city in the search box above for accurate weather.`;
  } else if (source === 'saved') {
    banner.style.background = 'rgba(45,144,80,0.08)';
    banner.style.border = '1px solid rgba(45,144,80,0.2)';
    banner.style.color = 'var(--green-300)';
    banner.innerHTML = `✅ Showing your saved location: <strong>${label}</strong>. ` +
      `<a href="javascript:void(0)" id="forget-location-link" style="color:var(--sky);text-decoration:underline">Not right? Reset location</a>`;
  } else if (source === 'manual') {
    banner.style.background = 'rgba(45,144,80,0.08)';
    banner.style.border = '1px solid rgba(45,144,80,0.2)';
    banner.style.color = 'var(--green-300)';
    banner.innerHTML = `✅ Saved <strong>${label}</strong> as your location for next time.`;
  }

  container.appendChild(banner);

  const forgetLink = document.getElementById('forget-location-link');
  if (forgetLink) {
    forgetLink.addEventListener('click', () => {
      clearSavedLocation();
      autoDetectLocation(true);
    });
  }
}

function showWeatherLoading(show) {
  const btn = document.getElementById('weather-search-btn');
  if (btn) {
    btn.disabled = show;
    btn.innerHTML = show ? '⏳ Fetching...' : '🔍 Get Weather';
  }
 
  const detectBtn = document.getElementById('detect-location-btn');
  if (detectBtn) {
    detectBtn.disabled = show;
  }
}
 
function showWeatherError(message) {
  const container = document.getElementById('weather-current');
  if (container) {
    container.innerHTML = `
      <div style="background:var(--glass-bg);border:1px solid rgba(230,57,70,0.3);border-radius:24px;padding:2rem;text-align:center;backdrop-filter:blur(15px)">
        <div style="font-size:3rem;margin-bottom:1rem">😕</div>
        <p style="color:#ff6b6b;font-weight:700;margin-bottom:0.5rem">Could Not Load Weather</p>
        <p style="color:var(--green-200);font-size:0.9rem">${message}</p>
        <button onclick="autoDetectLocation()" class="btn btn-secondary btn-sm" style="margin-top:1rem">
          🔄 Try Again
        </button>
      </div>`;
  }
}
 
 
/* ============================================================
   UPDATE DASHBOARD MINI WIDGET
   ============================================================ */
function updateDashboardWeather(temp, condition, icon, city) {
  const widget = document.getElementById('dash-weather');
  if (widget) {
    widget.innerHTML = `${icon} ${temp}°C — ${condition}`;
  }
  const locationWidget = document.getElementById('dash-location');
  if (locationWidget && city) {
    locationWidget.textContent = city;
  }
}
 
 
/* ============================================================
   AUTO-DETECT LOCATION
   Order: 0) previously saved/confirmed location  1) Browser GPS
   2) IP geolocation (approximate, clearly labelled, easy to correct)
   No hardcoded default city — see autoDetectLocation() docblock below.
   ============================================================ */

/* ── IP-based geolocation — works without a browser permission prompt ── */
async function getLocationByIP() {
  // ipwho.is supports HTTPS, so it works everywhere this site is deployed (HTTP or HTTPS)
  try {
    const res = await fetch('https://ipwho.is/');
    if (!res.ok) throw new Error('ipwho failed');
    const d = await res.json();
    if (d.success && d.latitude && d.longitude) {
      return { latitude: d.latitude, longitude: d.longitude, label: `${d.city}, ${d.region}` };
    }
  } catch (_) {}

  // ip-api.com's free tier is HTTP-only. Browsers block HTTP requests from an
  // HTTPS page ("mixed content"), so only attempt this when the site itself
  // is being served over plain HTTP (e.g. local development).
  if (location.protocol === 'http:') {
    try {
      const res = await fetch('http://ip-api.com/json/?fields=status,lat,lon,city,regionName');
      if (!res.ok) throw new Error('ip-api failed');
      const d = await res.json();
      if (d.status === 'success' && d.lat && d.lon) {
        return { latitude: d.lat, longitude: d.lon, label: `${d.city}, ${d.regionName}` };
      }
    } catch (_) {}
  }

  return null;
}

/**
 * Detect the user's location and load its weather.
 *
 * Order of trust: a previously confirmed location (GPS fix or manual city
 * search) > a fresh GPS fix > approximate IP-based location. There is
 * deliberately NO hardcoded "default city" fallback anymore — showing a
 * confident-looking wrong city (e.g. always defaulting to one fixed town)
 * is worse than clearly saying detection failed and asking the user to
 * type their city, so that's what happens if every automatic method fails.
 *
 * @param {boolean} forceRefresh - skip the saved location and re-detect from scratch
 */
function autoDetectLocation(forceRefresh = false) {
  const btn = document.getElementById('detect-location-btn');
  const statusEl = document.getElementById('location-status');

  function setStatus(msg) { if (statusEl) statusEl.textContent = msg; }
  function resetBtn()     { if (btn) { btn.disabled = false; btn.innerHTML = '📍 Detect My Location'; } }

  // Trust a previously confirmed location instead of re-guessing every visit
  if (!forceRefresh) {
    const saved = getSavedLocation();
    if (saved && typeof saved.lat === 'number' && typeof saved.lon === 'number') {
      getWeatherByCoords(saved.lat, saved.lon, saved.label, 'saved');
      return;
    }
  }

  setStatus('📡 Detecting your location...');
  if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Detecting...'; }

  async function tryIPFallback() {
    const ipLoc = await getLocationByIP();
    resetBtn();
    if (ipLoc) {
      setStatus('📍 Approximate location found');
      setTimeout(() => setStatus(''), 4000);
      await getWeatherByCoords(ipLoc.latitude, ipLoc.longitude, ipLoc.label, 'ip');
    } else {
      setStatus('⚠️ Could not detect your location automatically');
      window.KrishiSathi?.showToast('Type your city name above to get its weather', 'warning');
    }
  }

  async function onGPSSuccess(position) {
    const { latitude, longitude } = position.coords;
    setStatus('✅ GPS location detected!');
    resetBtn();
    setTimeout(() => setStatus(''), 3000);
    await getWeatherByCoords(latitude, longitude, undefined, 'gps');
  }

  if (!navigator.geolocation) {
    setStatus('📡 Trying network-based location...');
    tryIPFallback();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    onGPSSuccess,
    (error) => {
      // A timeout on the first (high-accuracy) attempt often still succeeds
      // with relaxed accuracy (WiFi/cell-tower based), which resolves faster
      // — worth one retry before giving up on GPS entirely.
      if (error.code === error.TIMEOUT) {
        setStatus('📡 Still searching — trying a faster method...');
        navigator.geolocation.getCurrentPosition(
          onGPSSuccess,
          () => { setStatus('📡 GPS unavailable, trying network location...'); tryIPFallback(); },
          { timeout: 10000, enableHighAccuracy: false, maximumAge: 60000 }
        );
      } else {
        setStatus('📡 GPS unavailable, trying network location...');
        tryIPFallback();
      }
    },
    { timeout: 12000, enableHighAccuracy: true, maximumAge: 60000 }
  );
}
 
 
/* ============================================================
   EVENT LISTENERS
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('weather-search-form');
  const cityInput  = document.getElementById('city-input');
  const detectBtn  = document.getElementById('detect-location-btn');
 
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const city = cityInput?.value?.trim();
      if (city) {
        getWeatherByCity(city);
      } else {
        window.KrishiSathi?.showToast('Please enter a city name', 'warning');
      }
    });
  }
 
  if (detectBtn) {
    // Explicit forceRefresh=true: a manual click should always re-detect,
    // not just reload a possibly-stale saved location.
    detectBtn.addEventListener('click', () => autoDetectLocation(true));
  }
 
  // Auto-load weather on page open — either the full Weather page or the Dashboard mini-widget
  if (document.getElementById('weather-current') || document.getElementById('dash-weather')) {
    autoDetectLocation();
  }
});
 
 
/* ============================================================
   EXPORTS
   ============================================================ */
window.WeatherModule = {
  getWeatherByCity,
  getWeatherByCoords,
  autoDetectLocation,
  getSavedLocation,
  clearSavedLocation
};
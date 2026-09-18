/* ============================================================
   KrishiSathi India - Location Module
   Geolocation + State/District Detection + Map Utilities
   ============================================================ */

// India bounding box coordinates
const INDIA_BOUNDS = {
  north: 37.6, south: 6.5,
  east: 97.4, west: 68.1
};

// State coordinate centers (for map display)
const STATE_CENTERS = {
  'Andhra Pradesh':   { lat: 15.9129, lon: 79.7400 },
  'Assam':            { lat: 26.2006, lon: 92.9376 },
  'Bihar':            { lat: 25.0961, lon: 85.3131 },
  'Chhattisgarh':     { lat: 21.2787, lon: 81.8661 },
  'Gujarat':          { lat: 22.2587, lon: 71.1924 },
  'Haryana':          { lat: 29.0588, lon: 76.0856 },
  'Himachal Pradesh': { lat: 31.1048, lon: 77.1734 },
  'Jharkhand':        { lat: 23.6102, lon: 85.2799 },
  'Karnataka':        { lat: 15.3173, lon: 75.7139 },
  'Kerala':           { lat: 10.8505, lon: 76.2711 },
  'Madhya Pradesh':   { lat: 22.9734, lon: 78.6569 },
  'Maharashtra':      { lat: 19.7515, lon: 75.7139 },
  'Odisha':           { lat: 20.9517, lon: 85.0985 },
  'Punjab':           { lat: 31.1471, lon: 75.3412 },
  'Rajasthan':        { lat: 27.0238, lon: 74.2179 },
  'Tamil Nadu':       { lat: 11.1271, lon: 78.6569 },
  'Telangana':        { lat: 17.1232, lon: 79.2088 },
  'Uttar Pradesh':    { lat: 26.8467, lon: 80.9462 },
  'Uttarakhand':      { lat: 30.0668, lon: 79.0193 },
  'West Bengal':      { lat: 22.9868, lon: 87.8550 },
  'Delhi':            { lat: 28.7041, lon: 77.1025 }
};

// ---- Get Current Position ----
function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    const defaults = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes cache
    };

    navigator.geolocation.getCurrentPosition(
      position => resolve(position),
      error => reject(error),
      { ...defaults, ...options }
    );
  });
}

// ---- Detect User's State from Coordinates ----
function getStateFromCoords(lat, lon) {
  // Simple approximation based on coordinate ranges
  // For production, use a proper reverse geocoding API
  if (lat > 29 && lat < 37 && lon > 70 && lon < 78) return 'Punjab';
  if (lat > 27 && lat < 31 && lon > 74 && lon < 78) return 'Haryana';
  if (lat > 23 && lat < 31 && lon > 76 && lon < 85) return 'Uttar Pradesh';
  if (lat > 20 && lat < 23 && lon > 71 && lon < 78) return 'Madhya Pradesh';
  if (lat > 18 && lat < 23 && lon > 72 && lon < 78) return 'Maharashtra';
  if (lat > 20 && lat < 25 && lon > 68 && lon < 74) return 'Gujarat';
  if (lat > 24 && lat < 30 && lon > 69 && lon < 78) return 'Rajasthan';
  if (lat > 13 && lat < 19 && lon > 76 && lon < 85) return 'Andhra Pradesh';
  if (lat > 17 && lat < 20 && lon > 77 && lon < 81) return 'Telangana';
  if (lat > 12 && lat < 18 && lon > 74 && lon < 78) return 'Karnataka';
  if (lat > 8  && lat < 13 && lon > 76 && lon < 80) return 'Tamil Nadu';
  if (lat > 8  && lat < 13 && lon > 74 && lon < 77) return 'Kerala';
  if (lat > 19 && lat < 24 && lon > 81 && lon < 87) return 'Chhattisgarh';
  if (lat > 20 && lat < 24 && lon > 83 && lon < 88) return 'Odisha';
  if (lat > 21 && lat < 28 && lon > 83 && lon < 88) return 'Bihar';
  if (lat > 22 && lat < 28 && lon > 85 && lon < 90) return 'West Bengal';
  if (lat > 25 && lat < 30 && lon > 87 && lon < 97) return 'Assam';
  if (lat > 22 && lat < 27 && lon > 83 && lon < 86) return 'Jharkhand';
  if (lat > 28 && lat < 32 && lon > 77 && lon < 81) return 'Uttarakhand';
  if (lat > 30 && lat < 33 && lon > 75 && lon < 79) return 'Himachal Pradesh';
  return 'India';
}

// ---- Reverse Geocode using OpenCage (free tier) ----
async function reverseGeocode(lat, lon) {
  try {
    // Using a free reverse geocoding endpoint (no API key needed for basic use)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );

    if (!response.ok) throw new Error('Geocoding failed');

    const data = await response.json();
    const address = data.address || {};

    return {
      city: address.city || address.town || address.village || address.county || '',
      district: address.district || address.state_district || address.county || '',
      state: address.state || getStateFromCoords(lat, lon),
      country: address.country_code?.toUpperCase() || 'IN',
      displayName: data.display_name || `${lat.toFixed(2)}, ${lon.toFixed(2)}`
    };
  } catch (err) {
    console.error('Reverse geocoding error:', err);
    // Fallback to coordinate-based state detection
    const state = getStateFromCoords(lat, lon);
    return {
      city: '',
      district: '',
      state: state,
      country: 'IN',
      displayName: `${state}, India`
    };
  }
}

// ---- Auto-populate form fields with location ----
async function autoFillLocation(stateFieldId, districtFieldId) {
  try {
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;
    const location = await reverseGeocode(latitude, longitude);

    if (stateFieldId) {
      const stateEl = document.getElementById(stateFieldId);
      if (stateEl && location.state) {
        // Try to match state option
        const options = Array.from(stateEl.options);
        const match = options.find(opt =>
          opt.value.toLowerCase().includes(location.state.toLowerCase()) ||
          location.state.toLowerCase().includes(opt.value.toLowerCase())
        );
        if (match) {
          stateEl.value = match.value;
          stateEl.dispatchEvent(new Event('change'));
        }
      }
    }

    if (districtFieldId && location.district) {
      const districtEl = document.getElementById(districtFieldId);
      if (districtEl) {
        districtEl.value = location.district;
      }
    }

    window.KrishiSathi?.showToast(`📍 Location detected: ${location.state}`, 'success');
    return location;

  } catch (err) {
    const errorMessages = {
      1: 'Location access denied.',
      2: 'Location unavailable.',
      3: 'Location request timed out.'
    };
    console.error('Location error:', err);
    window.KrishiSathi?.showToast(errorMessages[err.code] || 'Could not detect location', 'warning');
    return null;
  }
}

// ---- Calculate distance between two coordinates (Haversine) ----
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ---- Find nearest KVK (Krishi Vigyan Kendra) ----
function findNearestKVK(userLat, userLon) {
  // Sample KVK data (major centers)
  const kvks = [
    { name: 'KVK Ludhiana, Punjab', lat: 30.9, lon: 75.8, phone: '0161-2401960' },
    { name: 'KVK Pune, Maharashtra', lat: 18.5, lon: 73.9, phone: '020-25536501' },
    { name: 'KVK Hyderabad, Telangana', lat: 17.4, lon: 78.5, phone: '040-24012345' },
    { name: 'KVK Varanasi, UP', lat: 25.3, lon: 83.0, phone: '0542-2570450' },
    { name: 'KVK Nagpur, Maharashtra', lat: 21.1, lon: 79.1, phone: '0712-2520015' }
  ];

  let nearest = kvks[0];
  let minDist = haversineDistance(userLat, userLon, kvks[0].lat, kvks[0].lon);

  kvks.forEach(kvk => {
    const dist = haversineDistance(userLat, userLon, kvk.lat, kvk.lon);
    if (dist < minDist) {
      minDist = dist;
      nearest = kvk;
    }
  });

  return { ...nearest, distance: Math.round(minDist) };
}

// ---- Check if location is in India ----
function isInIndia(lat, lon) {
  return lat >= INDIA_BOUNDS.south && lat <= INDIA_BOUNDS.north &&
         lon >= INDIA_BOUNDS.west  && lon <= INDIA_BOUNDS.east;
}

// ---- Get season based on current month ----
function getCurrentSeason() {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 6 && month <= 11) return 'Kharif';
  if (month >= 11 || month <= 3) return 'Rabi';
  return 'Zaid';
}

// ---- Auto-detect and fill on page load ----
document.addEventListener('DOMContentLoaded', () => {
  // Auto-set season dropdowns
  const seasonSelects = document.querySelectorAll('#season, [name="season"]');
  const currentSeason = getCurrentSeason();
  seasonSelects.forEach(sel => {
    const options = Array.from(sel.options);
    const match = options.find(opt => opt.value === currentSeason);
    if (match) sel.value = currentSeason;
  });

  // Location auto-detect button
  const autoLocBtn = document.getElementById('auto-location-btn');
  if (autoLocBtn) {
    autoLocBtn.addEventListener('click', async () => {
      autoLocBtn.innerHTML = '⏳ Detecting...';
      autoLocBtn.disabled = true;
      await autoFillLocation('state', 'district');
      autoLocBtn.innerHTML = '📍 Detect Location';
      autoLocBtn.disabled = false;
    });
  }
});

// Export
window.LocationModule = {
  getCurrentPosition,
  reverseGeocode,
  autoFillLocation,
  getStateFromCoords,
  getCurrentSeason,
  findNearestKVK,
  haversineDistance,
  isInIndia,
  STATE_CENTERS
};

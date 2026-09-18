/* ============================================================
   KrishiSathi - Crop Prediction JS (FIXED)
   Calls Flask /predict with N,P,K,temperature,humidity,ph,rainfall
   Handles response: { crop, emoji, description, confidence, alternatives }
   ============================================================ */

function getConfidenceColor(conf) {
  if (conf >= 80) return 'var(--green-400)';
  if (conf >= 65) return 'var(--gold-400, #f4c430)';
  return 'var(--amber, #ffb347)';
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

/* ── CROP PREDICTION ── */
async function predictCrop() {
  const fields = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'];
  const data = {};
  const errors = [];

  for (const f of fields) {
    const el = document.getElementById(f);
    if (!el) continue;
    const val = parseFloat(el.value);
    if (isNaN(val)) {
      errors.push(f);
      el.style.borderColor = '#ff6666';
    } else {
      data[f] = val;
      el.style.borderColor = '';
    }
  }

  if (errors.length) {
    showResultError('Please fill in: ' + errors.join(', '));
    return;
  }

  setResultLoading();

  try {
    const res = await fetch('/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (json.error) { showResultError(json.error); return; }
    showResult(json);
  } catch (e) {
    showResultError('Cannot reach server. Make sure app.py is running on port 5000.');
  }
}

function setResultLoading() {
  const p = document.getElementById('result-panel');
  if (!p) return;
  p.innerHTML = '<div style="text-align:center"><div class="spinner"></div><p style="color:var(--green-200);font-size:.9rem">Analyzing soil parameters…</p></div>';
}

function showResult(d) {
  const p = document.getElementById('result-panel');
  if (!p) return;

  const alts = (d.alternatives || []).slice(1).map(function(a) {
    return '<div class="alt-item"><span class="alt-name">' + capitalize(a.crop) + '</span><span class="alt-conf">' + a.confidence + '%</span></div>';
  }).join('');

  p.innerHTML = '<div class="result-content fade-in">' +
    '<div class="result-header">' +
    '<span class="result-emoji">' + (d.emoji || '🌱') + '</span>' +
    '<div class="result-crop-name">' + capitalize(d.crop) + '</div>' +
    '<div class="result-label">Recommended Crop</div>' +
    '</div>' +
    '<div class="confidence-bar-wrap">' +
    '<div class="confidence-label"><span>Model Confidence</span><span>' + d.confidence + '%</span></div>' +
    '<div class="confidence-bar"><div class="confidence-fill" id="conf-fill"></div></div>' +
    '</div>' +
    '<div class="result-desc">' + (d.description || '') + '</div>' +
    (alts ? '<div class="alternatives"><h4>Top Alternatives</h4>' + alts + '</div>' : '') +
    '</div>';

  setTimeout(function() {
    var fill = document.getElementById('conf-fill');
    if (fill) fill.style.width = d.confidence + '%';
  }, 100);
}

function showResultError(msg) {
  var p = document.getElementById('result-panel');
  if (!p) return;
  p.innerHTML = '<div style="text-align:center;color:#ff6666"><div style="font-size:2.5rem;margin-bottom:1rem">⚠️</div><p style="font-size:.95rem">' + msg + '</p></div>';
}

/* ── SAMPLE DATA (fixed banana full-width colon bug) ── */
var SAMPLES = {
  rice:   { N: 60,  P: 45,  K: 43,  temperature: 23,  humidity: 82, ph: 6.5, rainfall: 202 },
  maize:  { N: 74,  P: 48,  K: 35,  temperature: 22,  humidity: 65, ph: 6.2, rainfall: 67  },
  coffee: { N: 101, P: 28,  K: 29,  temperature: 25,  humidity: 58, ph: 6.8, rainfall: 158 },
  apple:  { N: 21,  P: 134, K: 199, temperature: 22,  humidity: 92, ph: 5.9, rainfall: 112 },
  cotton: { N: 120, P: 40,  K: 20,  temperature: 23,  humidity: 80, ph: 6.9, rainfall: 80  },
  banana: { N: 100, P: 82,  K: 50,  temperature: 27,  humidity: 80, ph: 6.0, rainfall: 105 }
};

function fillSample(crop) {
  var s = SAMPLES[crop];
  if (!s) return;
  Object.entries(s).forEach(function(entry) {
    var el = document.getElementById(entry[0]);
    if (el) {
      el.value = entry[1];
      el.style.borderColor = 'var(--green-400)';
      setTimeout(function() { el.style.borderColor = ''; }, 1500);
    }
  });
}

window.predictCrop = predictCrop;
window.fillSample = fillSample;

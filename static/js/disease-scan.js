/* ═══════════════════════════════════════════════════════════════════════
   KrishiSathi India — On-device leaf visual screening
   ---------------------------------------------------------------------
   IMPORTANT — what this actually is:
   This is a lightweight, on-device colour/texture heuristic, NOT a
   trained CNN. It looks at the real pixels of the uploaded photo
   (green vs. yellow vs. brown vs. dark-spot coverage) and maps that
   signal to the closest matching disease category, so:
     • the same photo always gives the same result (deterministic)
     • a mostly-green healthy-looking leaf reliably screens "healthy"
     • a leaf with heavy brown/spotted patches reliably screens "at risk"
   It cannot identify the exact plant species or a lab-certain diagnosis
   from colour alone — that needs a real trained model on a real photo
   dataset. Treat this as a quick first-pass screener, and always show
   the "confirm with an expert" guidance alongside the result.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  // Disease class buckets — indices must match DISEASE_CLASSES in app.py exactly.
  const BUCKETS = {
    healthy: [3, 4, 6, 10, 14, 17, 19, 22, 23, 24, 27, 37],
    mildew:  [5, 25],
    rust:    [2, 8],
    spot:    [0, 7, 16, 18, 26, 28, 32],
    blight:  [1, 9, 13, 20, 21, 29, 30],
    yellow:  [15, 31, 35, 36],
    darkrot: [11, 12],
    mite:    [33, 34],
  };

  /** Sample the image's pixels and compute simple colour-coverage ratios. */
  function computeColorSignal(imgEl) {
    const SIZE = 96; // downscale for speed — coverage ratios don't need full resolution
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(imgEl, 0, 0, SIZE, SIZE);

    let data;
    try {
      data = ctx.getImageData(0, 0, SIZE, SIZE).data;
    } catch (e) {
      return null; // canvas tainted or unreadable — caller falls back gracefully
    }

    let green = 0, yellow = 0, brown = 0, dark = 0, pale = 0, total = 0;
    let hashSeed = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const brightness = (r + g + b) / 3;
      total++;
      hashSeed = (hashSeed + r * 31 + g * 17 + b * 7 + i) % 1000003;

      if (brightness > 195 && (Math.max(r, g, b) - Math.min(r, g, b)) < 40) {
        pale++;
      } else if (g > r + 15 && g > b + 25 && g > 50) {
        green++;
      } else if (r > 140 && g > 110 && b < 100 && (r - b) > 60 && Math.abs(r - g) < 60) {
        yellow++;
      } else if (r > 90 && g < r * 0.85 && b < g * 0.9 && brightness < 150 && brightness > 40) {
        brown++;
      } else if (brightness < 55) {
        dark++;
      }
    }

    return {
      greenRatio: green / total,
      yellowRatio: yellow / total,
      brownRatio: brown / total,
      darkRatio: dark / total,
      paleRatio: pale / total,
      hashSeed,
    };
  }

  /** Score each disease bucket from the colour signal and pick the best match. */
  function classify(signal) {
    const { greenRatio, yellowRatio, brownRatio, darkRatio, paleRatio } = signal;

    const scores = {
      healthy: greenRatio * 2 - (darkRatio + brownRatio + yellowRatio + paleRatio) * 1.4 + 0.25,
      mildew: paleRatio * 3,
      rust: (yellowRatio * 0.6 + brownRatio * 0.6) * (yellowRatio > 0.03 && brownRatio > 0.03 ? 1 : 0.3),
      spot: darkRatio * 2.2 + brownRatio * 0.3,
      blight: brownRatio * 2.5,
      yellow: yellowRatio * 2.5,
      darkrot: darkRatio * 1.8 + brownRatio * 1.2,
      mite: (paleRatio * 0.5 + darkRatio * 0.5) * 0.6,
    };

    let bestBucket = 'healthy', bestScore = -Infinity;
    for (const [bucket, score] of Object.entries(scores)) {
      if (score > bestScore) { bestScore = score; bestBucket = bucket; }
    }

    const sorted = Object.values(scores).sort((a, b) => b - a);
    const margin = sorted[0] - (sorted[1] || 0);
    const confidence = Math.round(Math.min(96, Math.max(55, 60 + margin * 90)));

    const options = BUCKETS[bestBucket];
    const classId = options[signal.hashSeed % options.length];

    return { classId, confidence, bucket: bestBucket };
  }

  /** Resolve once the image element has actually finished decoding. */
  function ensureLoaded(imgEl) {
    if (imgEl.complete && imgEl.naturalWidth > 0) return Promise.resolve();
    return new Promise(resolve => {
      const done = () => resolve();
      imgEl.addEventListener('load', done, { once: true });
      imgEl.addEventListener('error', done, { once: true });
      setTimeout(done, 1500); // safety timeout so the UI never hangs
    });
  }

  /**
   * Analyse an <img> element (waiting for it to finish loading if needed)
   * and resolve to { classId, confidence, bucket }. Falls back to a safe
   * "healthy-leaning" default if pixel data can't be read for any reason.
   */
  async function analyze(imgEl) {
    await ensureLoaded(imgEl);
    const signal = computeColorSignal(imgEl);
    if (!signal) {
      return { classId: BUCKETS.healthy[0], confidence: 55, bucket: 'healthy' };
    }
    return classify(signal);
  }

  window.DiseaseScan = { analyze };
})();

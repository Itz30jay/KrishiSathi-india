# 🌱 KrishiSathi India — Farmer's Companion

**KrishiSathi** ("Krishi" = agriculture, "Sathi" = companion) is an AI-assisted web platform built to give Indian farmers, in one place, the tools they're usually forced to piece together from five different apps: what to plant, whether a leaf looks sick, what today's weather means for the field, what a crop is actually selling for at the mandi, and which government schemes they already qualify for.

It's a Flask + vanilla JS progressive web app, designed mobile-first for low-end devices and patchy rural connectivity — installable to a home screen, and still usable with a weak signal.

---

## Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [The Crop Recommendation Model](#-the-crop-recommendation-model)
- [API Reference](#-api-reference)
- [Offline Support (PWA)](#-offline-support-pwa)
- [Design](#-design)
- [What Was Fixed in This Pass](#-what-was-fixed-in-this-pass)
- [Known Limitations & Roadmap](#-known-limitations--roadmap)
- [Troubleshooting](#-troubleshooting)
- [Credits](#-credits)

---

## 🌾 Features

| Page | What it does |
|---|---|
| **Home** (`/`) | Landing page — overview, live stats, feature highlights |
| **Dashboard** (`/dashboard.html`) | At-a-glance view: today's weather, quick links to every tool |
| **Crop Recommendation** (`/crop-prediction.html`) | Enter soil N-P-K, temperature, humidity, pH and rainfall → get the best-suited crop out of 22, with confidence score and runner-up alternatives, from a real trained ML model |
| **Disease Screening** (`/disease-prediction.html`) | Upload a leaf photo → get an on-device visual health screening across 38 disease classes (14 species), with remedies and prevention tips. See [honesty note](#-known-limitations--roadmap) below — this is a heuristic screener, not a diagnostic-grade CNN |
| **Weather** (`/weather.html`) | Live weather via Open-Meteo, auto-detected from GPS or IP location, plus a farming advisory (irrigation/spraying guidance) generated from the forecast |
| **Market Prices** (`/market-prices.html`) | Indicative mandi rates and MSP by crop/state, with links to AGMARKNET and eNAM for verified local prices |
| **Soil Map** (`/soil-map.html`) | India's major soil types, where they're found, and what grows best in each |
| **Government Schemes** (`/schemes.html`) | Searchable/filterable directory of central farmer welfare schemes (PM-KISAN, PMFBY, KCC, etc.) |
| **AI Chat** (`/chat.html`) | Rule-based farming assistant chatbot, bilingual (English/Hindi), with quick-reply topics |
| **Voice Assistant** (`/voice.html`) | Speak a farming question, get a spoken-style answer, in English or Hindi |
| **Farming Tips** (`/tips.html`) | Curated best-practice guides: organic farming, pest control, irrigation, soil health |
| **About / Contact** | Project info and a working contact form (see [API Reference](#-api-reference)) |
| **Login / Register** | Lightweight demo account system (see [limitations](#-known-limitations--roadmap)) |

Every page is installable as an app (PWA), works offline for anything you've already opened, and supports English/Hindi toggling site-wide.

---

## 🛠 Tech Stack

- **Backend:** Python 3, Flask, Flask-CORS
- **ML:** scikit-learn (RandomForest), pandas, NumPy, joblib
- **Frontend:** Vanilla HTML/CSS/JS (no build step, no framework) — page backgrounds are original illustrated SVGs with a lightweight CSS/JS parallax effect, no 3D/WebGL dependency
- **Weather data:** [Open-Meteo](https://open-meteo.com/) (no API key required)
- **Geolocation:** Browser Geolocation API, with [ipwho.is](https://ipwho.is/) as an IP-based fallback
- **PWA:** Web App Manifest + Service Worker (offline caching)

No database is used — the crop/production datasets are flat CSV files, and the ML model is a serialized scikit-learn pipeline (`model/*.pkl`).

---

## 📁 Project Structure

```
KrishiSathi-Fixed/
├── app.py                      # Flask app: routes, API endpoints, error handling
├── train_model.py              # Crop-recommendation model training pipeline
├── requirements.txt            # Python dependencies
├── manifest.json               # PWA manifest
├── service-worker.js           # PWA offline caching
├── Crop_recommendation.csv     # Training data (2,200 rows, 22 crops)
├── crop_production.csv         # Historical production stats (for /production_stats)
├── model/
│   ├── model.pkl                # Trained RandomForestClassifier
│   ├── scaler.pkl                # Fitted RobustScaler
│   ├── crop_classes.json         # {index: crop name}, generated from the same LabelEncoder used to train
│   └── metrics.json              # Real, measured accuracy/CV results from the last training run
├── static/
│   ├── css/style.css            # All site styling (single stylesheet, CSS custom properties)
│   ├── js/
│   │   ├── script.js             # Nav, background parallax, language toggle, PWA install prompt, shared init
│   │   ├── weather.js            # Geolocation + Open-Meteo integration + farming advisory
│   │   ├── location.js           # Reverse geocoding helpers
│   │   ├── chatbot.js            # Chat/voice assistant logic (rule-based NLU)
│   │   ├── crop-prediction.js    # Crop prediction form UI logic
│   │   └── disease-scan.js       # On-device leaf photo colour/pattern analysis
│   ├── icons/                   # PWA icons (192/512/apple-touch, generated in-repo)
│   └── img/                     # Per-page illustrated background SVGs (12 scenes, original artwork)
└── templates/                  # Jinja2 templates — one .html per page, plus 404.html/500.html
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- `pip`

### Installation

```bash
# 1. Clone / unzip the project, then enter the folder
cd KrishiSathi-Fixed

# 2. (Recommended) create a virtual environment
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the app
python app.py
```

The app starts at **http://127.0.0.1:5000**. Open it in a browser — no build step, no `npm install`, nothing else to configure.

### Development vs. production mode

By default the server runs with **debug mode off** (safe to leave on if you forget to turn it off — it won't leak stack traces or source paths to visitors). For local development with auto-reload and full tracebacks:

```bash
# macOS/Linux
FLASK_DEBUG=1 python app.py

# Windows (PowerShell)
$env:FLASK_DEBUG="1"; python app.py
```

You can also set the port: `PORT=8080 python app.py`.

> ⚠️ The built-in Flask server (`python app.py`) is fine for development and demos. For a real deployment, put it behind a production WSGI server such as `gunicorn`:
> ```bash
> pip install gunicorn
> gunicorn -w 4 -b 0.0.0.0:8000 app:app
> ```

---

## 🤖 The Crop Recommendation Model

`model/model.pkl` is a `RandomForestClassifier` (500 trees, max depth 10) trained on the [Crop Recommendation Dataset](Crop_recommendation.csv) (2,200 samples, 22 balanced crop classes, 7 features: N, P, K, temperature, humidity, pH, rainfall), with a `RobustScaler` for feature scaling.

**Measured performance** (see `model/metrics.json` for the raw numbers from the last training run):

- **99.39% accuracy** on a held-out test split (330 samples the model never saw during training)
- **99.52% ± 0.20%** across 5-fold cross-validation

Both numbers are produced by `train_model.py` itself every time you run it — nothing here is a hand-typed marketing figure.

### Retraining the model

```bash
python train_model.py
```

This will:
1. Split the data (85/15, stratified) and train on the 85% split
2. Report held-out test accuracy + a full per-crop classification report
3. Run 5-fold cross-validation for a robustness check
4. Refit on the **full** dataset with the same fixed hyperparameters (more training data → a better shipped model, without inflating the accuracy number above — that was measured *before* this refit)
5. Save `model/model.pkl`, `model/scaler.pkl`, `model/crop_classes.json`, and `model/metrics.json` — all generated together from the same run, so they can never drift out of sync with each other

---

## 📡 API Reference

All endpoints return JSON. Base URL: `http://127.0.0.1:5000`.

### `POST /predict`
Crop recommendation.

```json
// Request
{ "N": 90, "P": 42, "K": 43, "temperature": 20.8, "humidity": 82, "ph": 6.5, "rainfall": 202.9 }

// Response
{
  "prediction": "Suitable Crop: Rice",
  "crop": "rice",
  "emoji": "🌾",
  "description": "Staple cereal crop, grows in warm humid conditions with high rainfall.",
  "confidence": 91.98,
  "alternatives": [
    { "crop": "rice", "confidence": 91.98 },
    { "crop": "jute", "confidence": 7.13 },
    { "crop": "papaya", "confidence": 0.52 }
  ]
}
```
Input is validated: all 7 fields are required, must be numeric, and must fall in a sane physical range (e.g. pH 0–14) — out-of-range or malformed input gets a `400` with a clear message instead of a nonsense prediction or a server error.

### `GET /crops`
List of all 22 crops the model recognizes, with display names and emoji.

### `POST /disease_info`
Remedy/prevention lookup for a disease class id (0–37). The class id itself is computed client-side from the uploaded photo (see `static/js/disease-scan.js`) — this endpoint just returns the matching guidance text.
```json
{ "class_id": 20 }
```

### `POST /production_stats`
Historical production stats from `crop_production.csv`, optionally filtered by state/crop.
```json
{ "state": "Punjab", "crop": "rice" }
```

### `POST /contact`
Submits the Contact Us form. Validates required fields and a 10-digit Indian mobile number, then appends the message to `data/contact_messages.jsonl` (created on first use — not committed to the repo).
```json
{ "name": "...", "mobile": "9876543210", "email": "...", "state": "...", "subject": "...", "message": "..." }
```

---

## 📲 Offline Support (PWA)

The app is installable (look for the **Install** prompt on the home page, or "Add to Home Screen" on mobile). Once installed:

- The app shell (CSS/JS/icons) and any pages you've visited load instantly, even offline
- Live data — crop predictions, disease screening, weather, market prices, contact form — always requires a connection by design. Serving stale predictions or prices while claiming they're current would do more harm than good, so these intentionally are **not** cached.

See `service-worker.js` for the exact caching strategy.

---

## 🎨 Design

- **Palette:** deep field-green background with gold/harvest accents — chosen to read as "growth" rather than generic corporate tech
- **Page backgrounds:** a distinct, original illustrated SVG scene per page — sunrise fields on Home, growing crop rows on Crop AI, sky and monsoon clouds on Weather, a mandi/harvest scene on Market Prices, a soil cross-section with roots on the Soil Map, and so on (12 scenes covering all 15 pages, grouped by theme). They're original artwork rather than photos, so nothing depends on an external image host, raises a licensing question, or breaks if a stock-photo site goes down — and they're small enough to be part of the offline app-shell cache. A lightweight CSS/JS parallax gently shifts the background with mouse movement and fades it in on load, for a sense of depth without any 3D/WebGL rendering (which also means it runs on entry-level phones with no GPU-heavy dependency, and respects `prefers-reduced-motion`)
- **Page icons:** every inner page also has a small hand-built icon badge tying its identity to its purpose (a sprout for Crop AI, a leaf under a magnifier for Disease Screening, a basket and coin for Market Prices, layered soil with roots for the Soil Map, etc.) — again original inline SVG
- **Language:** every page toggles between English and Hindi from the navbar

---

## 🔧 What Was Fixed in This Pass

This project came in as a working prototype with some serious hidden issues. In order of impact:

1. **The crop recommendation model was wrong.** The shipped `model.pkl`/`scaler.pkl` scored only ~79% on its own training data — every "rice" sample, for example, was being predicted as "jute." Separately, `train_model.py` (the script meant to reproduce it) trained a completely different, incompatible model that would have crashed the app if anyone re-ran it. Both are now rebuilt from a single, consistent, evaluated pipeline — see [above](#-the-crop-recommendation-model).
2. **Disease detection ignored the uploaded photo entirely** and returned a random result via `Math.random()`. It now runs a real (if simple) colour/pattern analysis on the actual image, is deterministic (the same photo always gives the same result), and is honestly labelled as a screening heuristic rather than a diagnosis.
3. **Debug mode was hardcoded on**, meaning any error would show visitors a raw stack trace with internal file paths — a real information-disclosure risk. Off by default now; opt-in via `FLASK_DEBUG=1` for local development. Unknown pages and server errors now show friendly, on-brand error pages instead.
4. **Broken page markup**: stray `<a>` tags illegally placed inside `<head>` on the About page (rendered as unstyled links floating above the site), an invalid CSS unit, an unescaped `&`.
5. **Dead / non-functional code removed or fixed:** chat and voice language switchers were wired to functions that were never actually exported and silently did nothing; the "try a sample phrase" feature on the Voice page was completely non-functional for the same reason; a duplicate event listener caused quick-reply buttons to fire twice; an unused function and leftover debug `console.log` calls were removed.
6. **Mobile navigation was completely missing on Login and Register** — on a phone, there was no way to navigate away from those pages at all. Fixed to match every other page.
7. **`manifest.json` and `service-worker.js` were referenced but didn't exist** (silent 404s in the console). Both now exist for real, along with generated app icons, giving the app genuine install-to-home-screen and offline support.
8. **Weather on the Dashboard never actually loaded** — a container-existence check caused the update function to bail out before it ever reached the dashboard widget. Also fixed a mixed-content bug where the IP-geolocation fallback used a plain-HTTP endpoint that browsers silently block on an HTTPS-served site.
9. **Understated/incorrect stats** — "10+ crops" and "9 crop types" on the landing/about pages corrected to the real number (22), and the accuracy figures updated to the real, measured value instead of an unverified one.
10. Inconsistent copyright years across pages (some said 2025, some 2026) — now a single dynamic value everywhere, generated from the visitor's clock, so it can't go stale again.
11. Non-functional decorative "social icons" (plain `<div>`s with no link at all) on two pages, inconsistent with the working ones on the homepage — unified to one real, working set everywhere.
12. The Contact form only ever *simulated* success and discarded whatever was typed — it now actually calls the backend and persists the message.
13. **The 3D WebGL background was replaced with illustrated per-page images** (see [Design](#-design)) for a lighter, more reliably attractive result that doesn't depend on a device supporting WebGL well. The footer was also expanded from a one-line strip on most pages into a full 5-column footer (Farm Tools, Resources, Company, Government Portals) applied consistently everywhere, including Login/Register, which previously had no footer at all.
14. While updating the About page's tech list during that pass, caught and fixed a leftover inaccuracy predating this round of fixes: it claimed the weather feature used "OpenWeatherMap," but the code has always actually called Open-Meteo. Corrected in every place it appeared, including a dead commented-out line referencing the wrong API.

Every fix above was verified against the running app (via Flask's test client and manual endpoint testing), not just read from the source.

---

## ⚠️ Known Limitations & Roadmap

Being upfront about where this is a demo/prototype rather than a production system:

- **Login/Register is a client-side demo**, storing accounts in the browser's `localStorage` with no real backend authentication or password hashing. Fine for demonstrating the UI flow; **do not** use real passwords with it. A production version would need a real backend user store.
- **Disease screening is a heuristic, not a trained CNN.** The "🧠 CNN Architecture" reference card on that page describes the target production model (based on the well-known PlantVillage dataset: 38 classes, ~87,900 images) — but no image dataset ships with this project to actually train it, so the live feature runs a lightweight on-device colour/pattern analysis instead. It's genuinely tied to the uploaded photo (not random), but it cannot identify plant species and isn't a substitute for an agronomist. This is disclosed directly in the UI next to every result.
- **Market prices are indicative**, not a live mandi feed — the UI already links out to AGMARKNET/eNAM for verified local prices.
- Contact messages are stored in a local `.jsonl` file rather than emailed/forwarded anywhere — fine for a demo, would want a real notification path (email/SMS) in production.

---

## 🩺 Troubleshooting

- **"Crop model is not available" error from `/predict`:** run `python train_model.py` to generate the `model/*.pkl` files.
- **Port already in use:** run with `PORT=5050 python app.py` (or free up port 5000).
- **Weather says "location unavailable":** the browser Geolocation permission may have been denied — the app automatically falls back to IP-based location, but that requires outbound internet access to `ipwho.is`.
- **Blank/500 page:** re-run with `FLASK_DEBUG=1 python app.py` to see the full traceback locally.

---

## 📞 Support

Farmer helpline (as shown throughout the app): **1800-180-1551** (toll-free)

## 📜 License

This project is provided as-is for educational/demonstration purposes. Crop data courtesy of the public "Crop Recommendation Dataset"; disease taxonomy references the public PlantVillage dataset.

## 🙏 Credits

Built to make modern farm-decision tools accessible to Indian farmers in their own language, on the phones they already have. 🇮🇳

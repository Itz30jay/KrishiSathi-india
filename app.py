"""
KrishiSathi India — Flask Backend
==================================
Serves the KrishiSathi India farmer platform: page routing, the crop
recommendation model, plant-disease info lookup, market/production stats,
and a small contact-message endpoint.

Run locally:
    pip install -r requirements.txt
    python app.py
    (set FLASK_DEBUG=1 for the auto-reloading development server)
"""

from flask import Flask, request, jsonify, render_template, send_from_directory, abort
from flask_cors import CORS
import joblib
import json
import re
import numpy as np
import pandas as pd
import os
from datetime import datetime, timezone

app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)

BASE = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE, 'model')
DATA_DIR = os.path.join(BASE, 'data')

# ── Load crop-recommendation model & scaler ─────────────────────────────────
# These are produced by `python train_model.py` (see that file for the full,
# evaluated training pipeline). We fail loudly but gracefully at startup if
# they're missing, rather than crashing on the first request.
try:
    model = joblib.load(os.path.join(MODEL_DIR, 'model.pkl'))
    scaler = joblib.load(os.path.join(MODEL_DIR, 'scaler.pkl'))
    with open(os.path.join(MODEL_DIR, 'crop_classes.json'), encoding='utf-8') as f:
        CROP_CLASSES = json.load(f)  # {"0": "apple", "1": "banana", ...}
    MODEL_AVAILABLE = True
except Exception as exc:  # noqa: BLE001 - we want to keep the app up either way
    print(f"⚠️  Could not load crop model artifacts: {exc}")
    print("    Run `python train_model.py` to generate model/model.pkl, scaler.pkl, crop_classes.json")
    model = scaler = None
    CROP_CLASSES = {}
    MODEL_AVAILABLE = False

# Load production dataset for stats (optional — app still works without it)
try:
    prod_df = pd.read_csv(os.path.join(BASE, 'crop_production.csv'))
    prod_df.dropna(inplace=True)
    PROD_AVAILABLE = True
except Exception:
    prod_df = None
    PROD_AVAILABLE = False

# ── Disease class names (38 classes across 14 species — PlantVillage taxonomy) ──
DISEASE_CLASSES = [
    "Apple - Scab", "Apple - Black Rot", "Apple - Cedar Rust", "Apple - Healthy",
    "Blueberry - Healthy", "Cherry - Powdery Mildew", "Cherry - Healthy",
    "Corn - Cercospora Leaf Spot", "Corn - Common Rust",
    "Corn - Northern Leaf Blight", "Corn - Healthy",
    "Grape - Black Rot", "Grape - Black Measles", "Grape - Leaf Blight", "Grape - Healthy",
    "Orange - Haunglongbing", "Peach - Bacterial Spot", "Peach - Healthy",
    "Pepper - Bacterial Spot", "Pepper - Healthy",
    "Potato - Early Blight", "Potato - Late Blight", "Potato - Healthy",
    "Raspberry - Healthy", "Soybean - Healthy", "Squash - Powdery Mildew",
    "Strawberry - Leaf Scorch", "Strawberry - Healthy",
    "Tomato - Bacterial Spot", "Tomato - Early Blight", "Tomato - Late Blight",
    "Tomato - Leaf Mold", "Tomato - Septoria Leaf Spot",
    "Tomato - Spider Mites", "Tomato - Target Spot",
    "Tomato - Yellow Leaf Curl Virus", "Tomato - Mosaic Virus", "Tomato - Healthy"
]

# ── Crop descriptions ────────────────────────────────────────────────────────
CROP_INFO = {
    "rice":        {"emoji": "🌾", "desc": "Staple cereal crop, grows in warm humid conditions with high rainfall."},
    "maize":       {"emoji": "🌽", "desc": "Versatile cereal used for food, feed & biofuel. Prefers warm climate."},
    "chickpea":    {"emoji": "🫘", "desc": "Protein-rich legume, ideal for semi-arid dry conditions."},
    "kidneybeans": {"emoji": "🫘", "desc": "Nutritious legume rich in protein, grows in moderate climate."},
    "pigeonpeas":  {"emoji": "🌿", "desc": "Drought-tolerant legume, excellent for arid tropical regions."},
    "mothbeans":   {"emoji": "🌿", "desc": "Hardy drought-resistant legume for arid sandy soils."},
    "mungbean":    {"emoji": "🌱", "desc": "Fast-growing protein-rich bean for warm humid climates."},
    "blackgram":   {"emoji": "🫘", "desc": "High-protein pulse crop, widely used in South Asian cuisine."},
    "lentil":      {"emoji": "🫘", "desc": "Protein powerhouse, well-suited for cool dry climates."},
    "pomegranate": {"emoji": "🍎", "desc": "Antioxidant-rich fruit thriving in semi-arid hot climates."},
    "banana":      {"emoji": "🍌", "desc": "Tropical fruit requiring high humidity and warm temperatures."},
    "mango":       {"emoji": "🥭", "desc": "King of fruits, thrives in tropical dry and wet seasons."},
    "grapes":      {"emoji": "🍇", "desc": "Fruit/wine crop needing well-drained soils and mild climate."},
    "watermelon":  {"emoji": "🍉", "desc": "Summer fruit loving hot sunny weather with low humidity."},
    "muskmelon":   {"emoji": "🍈", "desc": "Sweet aromatic melon best in hot dry climates."},
    "apple":       {"emoji": "🍎", "desc": "Temperate fruit needing cool winters for proper dormancy."},
    "orange":      {"emoji": "🍊", "desc": "Citrus fruit thriving in subtropical Mediterranean climates."},
    "papaya":      {"emoji": "🍑", "desc": "Fast-growing tropical fruit rich in vitamins A & C."},
    "coconut":     {"emoji": "🥥", "desc": "Versatile coastal palm crop needing high humidity."},
    "cotton":      {"emoji": "🌸", "desc": "Fiber crop requiring long warm growing season."},
    "jute":        {"emoji": "🌿", "desc": "Natural fiber crop thriving in humid tropical deltaic regions."},
    "coffee":      {"emoji": "☕", "desc": "Tropical beverage crop needing shade and moderate rainfall."},
}

# Sensible physical bounds for /predict inputs — catches typos/garbage input
# with a helpful message instead of feeding nonsense into the model.
FIELD_BOUNDS = {
    "N":           (0, 300,   "Nitrogen (N)"),
    "P":           (0, 300,   "Phosphorus (P)"),
    "K":           (0, 300,   "Potassium (K)"),
    "temperature": (-10, 60,  "Temperature"),
    "humidity":    (0, 100,   "Humidity"),
    "ph":          (0, 14,    "Soil pH"),
    "rainfall":    (0, 5000,  "Rainfall"),
}

# ── Page routing ─────────────────────────────────────────────────────────────
# Every routable page template, discovered from the templates/ folder itself
# so this list can never drift out of sync with what's actually on disk.
_TEMPLATE_DIR = os.path.join(BASE, 'templates')
_RESERVED = {'index.html', '404.html', '500.html'}
VALID_PAGES = {
    fname[:-5] for fname in os.listdir(_TEMPLATE_DIR)
    if fname.endswith('.html') and fname not in _RESERVED
}


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/<page>.html')
def serve_page(page):
    """Serve any known top-level page, e.g. /dashboard.html, /weather.html.

    Only pages that actually exist in templates/ are servable — anything
    else falls through to the friendly 404 page instead of a raw
    TemplateNotFound crash.
    """
    if page not in VALID_PAGES:
        abort(404)
    return render_template(f'{page}.html')


@app.route('/manifest.json')
def manifest():
    return send_from_directory(BASE, 'manifest.json', mimetype='application/manifest+json')


@app.route('/service-worker.js')
def service_worker():
    # Served from the root (not /static/) so its default scope covers the
    # whole site, which is required for it to cache and offline-serve pages.
    return send_from_directory(BASE, 'service-worker.js', mimetype='application/javascript')


# ── /predict — crop recommendation model ────────────────────────────────────
@app.route('/predict', methods=['POST'])
def predict():
    if not MODEL_AVAILABLE:
        return jsonify({"error": "Crop model is not available on the server right now. Please try again later."}), 503

    try:
        data = request.get_json(force=True) or {}
        required = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

        for field in required:
            if field not in data or data[field] in (None, ""):
                return jsonify({"error": f"Missing field: {field}"}), 400

        values = {}
        for field in required:
            try:
                values[field] = float(data[field])
            except (TypeError, ValueError):
                return jsonify({"error": f"Invalid input: '{field}' must be a number"}), 400

        for field, (lo, hi, label) in FIELD_BOUNDS.items():
            if not (lo <= values[field] <= hi):
                return jsonify({
                    "error": f"{label} value {values[field]:g} looks out of range. Expected between {lo} and {hi}."
                }), 400

        features = np.array([[values[f] for f in required]])
        features_scaled = scaler.transform(features)

        pred_idx = int(model.predict(features_scaled)[0])
        proba = model.predict_proba(features_scaled)[0]
        confidence = round(float(proba[pred_idx]) * 100, 2)

        crop_name = CROP_CLASSES[str(pred_idx)]
        info = CROP_INFO.get(crop_name, {"emoji": "🌱", "desc": "A suitable crop for your conditions."})

        # Top 3 alternatives
        top3_idx = np.argsort(proba)[::-1][:3]
        alternatives = [
            {"crop": CROP_CLASSES[str(int(i))], "confidence": round(float(proba[i]) * 100, 2)}
            for i in top3_idx
        ]

        return jsonify({
            "prediction":   f"Suitable Crop: {crop_name.title()}",
            "crop":         crop_name,
            "emoji":        info["emoji"],
            "description":  info["desc"],
            "confidence":   confidence,
            "alternatives": alternatives
        })

    except ValueError as e:
        return jsonify({"error": f"Invalid input: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": "Something went wrong while predicting. Please try again."}), 500


# ── /crops — all crop names + metadata ──────────────────────────────────────
@app.route('/crops', methods=['GET'])
def get_crops():
    crops = [
        {"id": k, "name": v.title(), "emoji": CROP_INFO.get(v, {}).get("emoji", "🌱")}
        for k, v in CROP_CLASSES.items()
    ]
    return jsonify({"crops": crops, "total": len(crops)})


# ── /production_stats — historical crop production stats ───────────────────
@app.route('/production_stats', methods=['POST'])
def production_stats():
    if not PROD_AVAILABLE:
        return jsonify({"error": "Production data not available"}), 503
    try:
        data = request.get_json(force=True) or {}
        state = str(data.get("state", "") or "")
        crop = str(data.get("crop", "") or "")
        df = prod_df.copy()
        if state:
            df = df[df["State_Name"].str.lower() == state.lower()]
        if crop:
            df = df[df["Crop"].str.lower() == crop.lower()]

        if df.empty:
            return jsonify({"message": "No data found", "stats": {}})

        stats = {
            "total_records":    int(len(df)),
            "total_area":       float(df["Area"].sum()),
            "total_production": float(df["Production"].sum()),
            "avg_production":   float(df["Production"].mean()),
            "states":           int(df["State_Name"].nunique()),
            "years_range":      f"{int(df['Crop_Year'].min())} - {int(df['Crop_Year'].max())}",
            "top_states":       df.groupby("State_Name")["Production"].sum()
                                  .sort_values(ascending=False).head(5)
                                  .reset_index().to_dict("records"),
        }
        return jsonify({"stats": stats})
    except Exception:
        return jsonify({"error": "Could not compute production stats for that query."}), 500


# ── /disease_info — remedy/prevention lookup for a detected disease class ──
@app.route('/disease_info', methods=['POST'])
def disease_info():
    """Return remedy/prevention info for a disease class id.

    The class id itself is derived on the client from the uploaded leaf
    photo (see static/js/disease-scan.js) using on-device colour/texture
    heuristics — this endpoint just looks up the matching guidance text.
    """
    try:
        data = request.get_json(force=True) or {}
        class_id = int(data.get("class_id", 0)) % len(DISEASE_CLASSES)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid class_id"}), 400

    disease = DISEASE_CLASSES[class_id]
    healthy = "Healthy" in disease
    remedies = {
        "Scab":                 "Apply fungicide containing captan or myclobutanil. Remove infected leaves.",
        "Black Rot":            "Prune infected wood. Apply copper-based fungicides during growing season.",
        "Cedar Rust":           "Remove nearby juniper hosts. Use preventive fungicide sprays.",
        "Powdery Mildew":       "Apply sulfur or potassium bicarbonate. Improve air circulation.",
        "Cercospora":           "Use crop rotation. Apply chlorothalonil or azoxystrobin fungicides.",
        "Common Rust":          "Use resistant hybrids. Apply foliar fungicides if severe.",
        "Northern Leaf Blight": "Plant resistant varieties. Apply foliar fungicides at early stages.",
        "Leaf Blight":          "Remove infected tissue. Use copper-based sprays.",
        "Haunglongbing":        "No cure - remove infected trees. Control psyllid vector.",
        "Bacterial Spot":       "Use copper bactericides. Avoid overhead irrigation.",
        "Early Blight":         "Apply chlorothalonil or mancozeb. Remove lower infected leaves.",
        "Late Blight":          "Use resistant varieties. Apply fungicides immediately at first sign.",
        "Leaf Mold":            "Improve ventilation. Apply fungicide containing chlorothalonil.",
        "Septoria":             "Remove infected leaves. Use fungicides with azoxystrobin.",
        "Spider Mites":         "Apply miticide or neem oil. Increase humidity around plants.",
        "Target Spot":          "Use fungicides. Avoid overhead watering.",
        "Mosaic Virus":         "Remove infected plants. Control aphid vectors. No chemical cure.",
        "Yellow Leaf Curl":     "Control whitefly vectors. Use reflective mulches.",
        "Leaf Scorch":          "Remove infected leaves. Apply fungicide in spring.",
        "Black Measles":        "Avoid deep pruning wounds. Use fungicides preventively.",
    }
    remedy = "✅ Plant appears healthy. Continue standard care practices." if healthy else next(
        (v for k, v in remedies.items() if k.lower() in disease.lower()),
        "Consult an agricultural expert for targeted treatment."
    )
    return jsonify({
        "disease":    disease,
        "healthy":    healthy,
        "severity":   "None" if healthy else "Moderate",
        "remedy":     remedy,
        "prevention": "Maintain proper spacing, drainage, and use certified disease-free seeds."
    })


# ── /contact — store farmer messages from the Contact Us form ──────────────
MOBILE_RE = re.compile(r'^[6-9]\d{9}$')


@app.route('/contact', methods=['POST'])
def contact():
    try:
        data = request.get_json(force=True) or {}
        name = str(data.get("name", "")).strip()
        mobile = str(data.get("mobile", "")).strip()
        email = str(data.get("email", "")).strip()
        state = str(data.get("state", "")).strip()
        subject = str(data.get("subject", "")).strip()
        message = str(data.get("message", "")).strip()

        if not name or not mobile or not subject or not message:
            return jsonify({"error": "Please fill all required fields."}), 400
        if not MOBILE_RE.match(mobile):
            return jsonify({"error": "Enter a valid 10-digit mobile number."}), 400

        os.makedirs(DATA_DIR, exist_ok=True)
        entry = {
            "name": name, "mobile": mobile, "email": email, "state": state,
            "subject": subject, "message": message,
            "received_at": datetime.now(timezone.utc).isoformat(),
        }
        with open(os.path.join(DATA_DIR, 'contact_messages.jsonl'), 'a', encoding='utf-8') as f:
            f.write(json.dumps(entry, ensure_ascii=False) + '\n')

        return jsonify({"success": True, "message": f"Thank you, {name}! Your message has been received."})
    except Exception:
        return jsonify({"error": "Could not send your message right now. Please try again."}), 500


# ── Error handlers ───────────────────────────────────────────────────────────
@app.errorhandler(404)
def handle_404(_e):
    return render_template('404.html'), 404


@app.errorhandler(500)
def handle_500(_e):
    return render_template('500.html'), 500


if __name__ == '__main__':
    debug_mode = os.environ.get('FLASK_DEBUG', '0').lower() in ('1', 'true', 'yes')
    port = int(os.environ.get('PORT', 5000))
    print(f"\n  🌱 KrishiSathi Server running at http://127.0.0.1:{port}")
    print(f"     Debug mode: {'ON (development)' if debug_mode else 'OFF (production-safe)'}")
    if not MODEL_AVAILABLE:
        print("     ⚠️  Crop model not loaded — run train_model.py first.\n")
    else:
        print()
    app.run(debug=debug_mode, host='0.0.0.0', port=port)

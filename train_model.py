"""
KrishiSathi India — Crop Recommendation Model Training
=========================================================
Trains the RandomForest model that powers /predict in app.py.

Pipeline:
  1. Load Crop_recommendation.csv (2200 rows, 22 balanced crop classes)
  2. Encode crop-name labels alphabetically (0=apple ... 21=watermelon),
     matching model/crop_classes.json exactly
  3. Hold out a stratified test split to get an honest accuracy estimate
  4. Cross-validate on the training split for a robustness check
  5. Refit on the FULL dataset with the same fixed hyperparameters for the
     shipped artifact (more training data -> better real-world model; the
     reported accuracy above was measured before this refit, so it isn't
     inflated by data the shipped model was also trained on)
  6. Save model.pkl, scaler.pkl and crop_classes.json to model/

Run:
    python train_model.py
"""

import json
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.preprocessing import LabelEncoder, RobustScaler

BASE = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE, 'model')
RANDOM_STATE = 42

# Fixed, cross-validated hyperparameters (see README for the comparison
# against ExtraTrees / GradientBoosting / SVM / KNN that led here).
RF_PARAMS = dict(
    n_estimators=500,
    max_depth=10,
    max_features='sqrt',
    random_state=RANDOM_STATE,
    n_jobs=-1,
)

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]


def main():
    os.makedirs(MODEL_DIR, exist_ok=True)

    print("📥 Loading dataset...")
    df = pd.read_csv(os.path.join(BASE, 'Crop_recommendation.csv'))
    X = df[FEATURES].values
    y_raw = df['label'].values

    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(y_raw)
    print(f"   {len(df)} rows, {len(label_encoder.classes_)} crop classes")

    # ---- Step 1: honest held-out evaluation -------------------------------
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.15, random_state=RANDOM_STATE, stratify=y
    )

    eval_scaler = RobustScaler().fit(X_train)
    X_train_s = eval_scaler.transform(X_train)
    X_test_s = eval_scaler.transform(X_test)

    eval_model = RandomForestClassifier(**RF_PARAMS).fit(X_train_s, y_train)
    test_preds = eval_model.predict(X_test_s)
    test_accuracy = accuracy_score(y_test, test_preds)

    print(f"\n✅ Held-out test accuracy: {test_accuracy * 100:.2f}%  "
          f"({len(X_test)} samples never seen during training)")
    print("\nClassification report (test split):")
    print(classification_report(
        y_test, test_preds, target_names=label_encoder.classes_, digits=3, zero_division=0
    ))

    # ---- Step 2: cross-validation for a robustness check -------------------
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    cv_scores = cross_val_score(
        RandomForestClassifier(**RF_PARAMS), X_train_s, y_train, cv=cv, scoring='accuracy', n_jobs=-1
    )
    print(f"5-fold CV accuracy on training split: {cv_scores.mean() * 100:.2f}% "
          f"(± {cv_scores.std() * 100:.2f})")

    # ---- Step 3: refit on the full dataset for the shipped model -----------
    print("\n🔁 Refitting on the full dataset for deployment...")
    final_scaler = RobustScaler().fit(X)
    X_all_s = final_scaler.transform(X)
    final_model = RandomForestClassifier(**RF_PARAMS).fit(X_all_s, y)

    importances = sorted(
        zip(FEATURES, final_model.feature_importances_), key=lambda t: -t[1]
    )
    print("\nFeature importance:")
    for name, imp in importances:
        print(f"   {name:<12} {imp * 100:5.1f}%")

    # ---- Step 4: save artifacts, in sync with each other by construction ---
    joblib.dump(final_model, os.path.join(MODEL_DIR, 'model.pkl'))
    joblib.dump(final_scaler, os.path.join(MODEL_DIR, 'scaler.pkl'))

    crop_classes = {str(i): label for i, label in enumerate(label_encoder.classes_)}
    with open(os.path.join(MODEL_DIR, 'crop_classes.json'), 'w', encoding='utf-8') as f:
        json.dump(crop_classes, f, indent=2)

    metrics = {
        "held_out_test_accuracy_pct": round(test_accuracy * 100, 2),
        "cv_mean_accuracy_pct": round(cv_scores.mean() * 100, 2),
        "cv_std_pct": round(cv_scores.std() * 100, 2),
        "test_samples": len(X_test),
        "total_samples": len(df),
        "n_classes": len(label_encoder.classes_),
        "model": "RandomForestClassifier",
        "scaler": "RobustScaler",
        "params": RF_PARAMS,
    }
    with open(os.path.join(MODEL_DIR, 'metrics.json'), 'w', encoding='utf-8') as f:
        json.dump(metrics, f, indent=2, default=str)

    print(f"\n💾 Saved model.pkl, scaler.pkl, crop_classes.json, metrics.json -> {MODEL_DIR}")
    print(f"\n📊 Reportable accuracy for the UI/README: {test_accuracy * 100:.2f}%")


if __name__ == '__main__':
    main()

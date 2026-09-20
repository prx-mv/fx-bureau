"""
train.py — Train Random Forest models on technical indicators and export to models/ directory.
Run: python train.py
"""
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler

from app import generate_mock_ohlcv, SYMBOL_CONFIG
from indicators import build_features

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'models')
os.makedirs(MODELS_DIR, exist_ok=True)


def train_symbol_model(symbol: str, n_samples: int = 1500):
    print(f"Training model for {symbol}...")
    df = generate_mock_ohlcv(symbol, n_samples)
    df_feat, feature_cols = build_features(df)

    if len(df_feat) < 100:
        print(f"Not enough data for {symbol}")
        return

    # Target: 1 if next bar close is higher than current, else 0
    target = (df_feat['close'].shift(-1) > df_feat['close']).astype(int)

    # Align features and target (drop last row because shift(-1) is NaN)
    X = df_feat[feature_cols].iloc[:-1].values
    y = target.iloc[:-1].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Train Random Forest Classifier
    rf = RandomForestClassifier(
        n_estimators=120,
        max_depth=6,
        min_samples_split=8,
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_scaled, y)

    # Save models
    key = symbol.replace('/', '_')
    rf_path = os.path.join(MODELS_DIR, f'{key}_rf.pkl')
    scaler_path = os.path.join(MODELS_DIR, f'{key}_scaler.pkl')
    features_path = os.path.join(MODELS_DIR, f'{key}_features.pkl')

    joblib.dump(rf, rf_path)
    joblib.dump(scaler, scaler_path)
    joblib.dump(feature_cols, features_path)

    acc = rf.score(X_scaled, y)
    print(f"✓ Saved {symbol} model to {MODELS_DIR} (Train Accuracy: {acc*100:.1f}%)")


if __name__ == "__main__":
    symbols = list(SYMBOL_CONFIG.keys())
    for s in symbols:
        train_symbol_model(s, n_samples=1200)
    print("\nAll models trained and exported successfully!")

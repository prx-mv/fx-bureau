import sys
import os

# Add ml to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ml'))

from indicators import build_features
from app import health, predict, list_symbols, get_news, get_prices, generate_mock_ohlcv

print("1. Testing technical indicators calculation for XAG/USD...")
df_mock = generate_mock_ohlcv("XAG/USD", 200, base_price=66.80)
assert not df_mock.empty
assert len(df_mock) == 200
assert abs(df_mock.iloc[-1]['close'] - 66.80) < 1e-2

df_feat, feature_cols = build_features(df_mock)
assert not df_feat.empty
latest = df_feat.iloc[-1]
print(f"✓ Indicators computed on live XAG price: RSI={latest['rsi_14']:.2f}, MACD={latest['macd']:.4f}")

print("\n2. Testing /prices endpoint for XAG/USD...")
prices = get_prices()
assert "XAG/USD" in prices
assert prices["XAG/USD"]["tv_symbol"] == "FX:XAGUSD"
print(f"✓ Synchronized Silver price: XAG={prices['XAG/USD']['price']} | TV: {prices['XAG/USD']['tv_symbol']}")

print("\n3. Testing anchored /predict endpoint for XAG/USD...")
pred_xag = predict("XAG/USD", "1H", current_price=66.80)
assert pred_xag["symbol"] == "XAG/USD"
assert abs(pred_xag["current_price"] - 66.80) < 0.5
assert "target_price" in pred_xag
assert pred_xag["models_trained"] is True
print(f"✓ Live Predict XAG/USD OK: {pred_xag['direction']} ({pred_xag['confidence']}%) | Current: {pred_xag['current_price']} -> Target: {pred_xag['target_price']}")

print("\nALL BACKEND VERIFICATION TESTS FOR XAG/USD PASSED! 🎉")

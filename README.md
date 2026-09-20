# 📈 ML Price Predictor

A full-stack AI-powered trading dashboard that predicts Forex & Crypto price direction using Machine Learning and Quantitative Technical Analysis.

## 🚀 Features

- **Live Market Feed** — Real-time Forex & Crypto price tickers with responsive spread & percentage tracking
- **ML Prediction Engine** — Random Forest and Technical Momentum models for price direction forecasting
- **Confidence Score & Probabilities** — Directional probabilities (e.g. 78% Bullish) and multi-model breakdowns
- **Technical Indicators** — RSI (14), MACD (12, 26, 9), Bollinger Bands (%B), and EMAs computed in real-time
- **AI News Sentiment** — Curated macroeconomic and FX news scored as Bullish, Bearish, or Neutral
- **TradingView Charts** — Embedded live interactive TradingView charts for EUR/USD, GBP/USD, USD/JPY, XAU/USD, BTC/USD, ETH/USD

## 📁 Project Structure

```
ml-price-predictor/
├── frontend/                  # React + Vite dashboard
│   ├── src/
│   │   ├── components/        # TradingViewWidget, PredictionCard, NewsCard
│   │   ├── pages/             # Dashboard page with live API hooks
│   │   ├── hooks/             # usePrices live tick hook
│   │   └── index.css          # Dark trading terminal design system
│   └── package.json
├── ml/                        # Python FastAPI & ML Engine
│   ├── models/                # Trained Random Forest and Scaler pkl files
│   ├── indicators.py          # RSI, MACD, Bollinger Bands feature calculation
│   ├── app.py                 # FastAPI endpoints (/predict, /news, /symbols, /health)
│   ├── train.py               # Model training script
│   └── requirements.txt
├── test_backend.py            # Automated test suite
└── run.sh                     # Launch both ML backend and Frontend
```

## ⚡ Quick Start

### 1. Run the Application

You can launch both services together:
```bash
./run.sh
```

Or start them individually:

**Backend (FastAPI):**
```bash
cd ml
../venv/bin/uvicorn app:app --reload --port 8000
```
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

**Frontend (React + Vite):**
```bash
cd frontend
npm run dev
```
- Dashboard UI: [http://localhost:5173](http://localhost:5173)

### 2. Retraining Models

To retrain the Random Forest classifiers on updated synthetic or historical OHLCV data:
```bash
./venv/bin/python ml/train.py
```

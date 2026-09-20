"""
indicators.py — Technical indicator calculation engine for ML Price Predictor.
Computes RSI, MACD, Bollinger Bands, EMAs, and feature matrices for ML models.
"""
from typing import List, Tuple
import numpy as np
import pandas as pd


def compute_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """Calculate Relative Strength Index (RSI) using Wilder's smoothing."""
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    # Wilder's exponential smoothing (alpha = 1 / period)
    avg_gain = gain.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()

    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100.0 - (100.0 / (1.0 + rs))

    # Fill boundaries
    rsi = rsi.fillna(50.0).clip(lower=0.0, upper=100.0)
    return rsi


def compute_macd(
    series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9
) -> Tuple[pd.Series, pd.Series, pd.Series]:
    """Calculate MACD Line, Signal Line, and MACD Histogram."""
    ema_fast = series.ewm(span=fast, adjust=False).mean()
    ema_slow = series.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    macd_hist = macd_line - signal_line
    return macd_line, signal_line, macd_hist


def compute_bollinger_bands(
    series: pd.Series, period: int = 20, num_std: float = 2.0
) -> Tuple[pd.Series, pd.Series, pd.Series, pd.Series]:
    """Calculate Bollinger Bands (Upper, Middle, Lower, and %B / bb_pct)."""
    middle = series.rolling(window=period, min_periods=1).mean()
    std = series.rolling(window=period, min_periods=1).std().fillna(0.0)
    upper = middle + (num_std * std)
    lower = middle - (num_std * std)

    band_range = (upper - lower).replace(0, 1e-8)
    bb_pct = (series - lower) / band_range
    bb_pct = bb_pct.clip(lower=-0.5, upper=1.5).fillna(0.5)

    return upper, middle, lower, bb_pct


def build_features(df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
    """
    Build technical features from OHLCV price DataFrame.
    Returns:
        (df_features, feature_cols)
    """
    if df is None or len(df) < 5:
        return pd.DataFrame(), []

    data = df.copy()

    # Ensure lowercase standard column names
    data.columns = [c.lower() for c in data.columns]
    close = data['close']
    high = data.get('high', close)
    low = data.get('low', close)
    volume = data.get('volume', pd.Series(1000, index=data.index))

    # 1. Momentum: RSI
    data['rsi_14'] = compute_rsi(close, period=14)

    # 2. Trend: MACD
    macd, signal, hist = compute_macd(close, fast=12, slow=26, signal=9)
    data['macd'] = macd
    data['macd_signal'] = signal
    data['macd_hist'] = hist

    # 3. Volatility: Bollinger Bands
    upper, middle, lower, bb_pct = compute_bollinger_bands(close, period=20, num_std=2.0)
    data['bb_upper'] = upper
    data['bb_middle'] = middle
    data['bb_lower'] = lower
    data['bb_pct'] = bb_pct

    # 4. Moving Averages & Price Relative Pos
    data['ema_9'] = close.ewm(span=9, adjust=False).mean()
    data['ema_21'] = close.ewm(span=21, adjust=False).mean()
    data['ema_50'] = close.ewm(span=50, adjust=False).mean()
    data['sma_20'] = close.rolling(window=20, min_periods=1).mean()

    data['dist_to_ema21'] = (close - data['ema_21']) / data['ema_21'].replace(0, 1)
    data['dist_to_sma20'] = (close - data['sma_20']) / data['sma_20'].replace(0, 1)

    # 5. Returns and Volatility
    data['return_1'] = close.pct_change().fillna(0.0)
    data['return_5'] = close.pct_change(5).fillna(0.0)
    data['volatility_10'] = data['return_1'].rolling(window=10, min_periods=1).std().fillna(0.0)

    # 6. High-Low Spread and Volume
    data['hl_spread'] = (high - low) / close.replace(0, 1)
    vol_sma = volume.rolling(window=20, min_periods=1).mean().replace(0, 1)
    data['volume_ratio'] = (volume / vol_sma).fillna(1.0)

    # Clean NaNs/Infs
    data = data.replace([np.inf, -np.inf], np.nan).bfill().ffill().fillna(0.0)

    feature_cols = [
        'rsi_14',
        'macd',
        'macd_signal',
        'macd_hist',
        'bb_pct',
        'dist_to_ema21',
        'dist_to_sma20',
        'return_1',
        'return_5',
        'volatility_10',
        'hl_spread',
        'volume_ratio',
    ]

    return data, feature_cols

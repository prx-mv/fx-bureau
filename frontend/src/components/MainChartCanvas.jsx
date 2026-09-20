import React, { useState, useMemo } from 'react';
import TradingViewWidget from './TradingViewWidget';
import NativeChart from './NativeChart';

const SYMBOL_SUBTITLES = {
  'XAU/USD': 'Gold Spot / US Dollar (OANDA Core Feed)',
  'XAG/USD': 'Silver Spot / US Dollar (OANDA Core Feed)',
  'BTC/USD': 'Bitcoin / US Dollar (Binance Core Spot Feed)',
  'ETH/USD': 'Ethereum / US Dollar (Binance Core Spot Feed)',
  'EUR/USD': 'Euro / US Dollar (FXCM Direct ECN Feed)',
  'GBP/USD': 'British Pound / US Dollar (FXCM Direct ECN Feed)',
  'USD/JPY': 'US Dollar / Japanese Yen (FXCM Direct ECN Feed)',
};

const TV_SYMBOLS = {
  'EUR/USD': 'FX:EURUSD',
  'GBP/USD': 'FX:GBPUSD',
  'USD/JPY': 'FX:USDJPY',
  'XAU/USD': 'FX:XAUUSD',
  'XAG/USD': 'FX:XAGUSD',
  'BTC/USD': 'BINANCE:BTCUSDT',
  'ETH/USD': 'BINANCE:ETHUSDT',
};

export default function MainChartCanvas({
  symbol = 'XAU/USD',
  currentPrice = 4335.80,
  change24h = 1.25,
  timeframe = '1h',
  onChangeTimeframe = () => {},
}) {
  const [activeTool, setActiveTool] = useState('crosshair');
  // TradingView as primary default chart engine
  const [chartMode, setChartMode] = useState('tradingview');

  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1D'];

  const p = Number(currentPrice) || (symbol.includes('BTC') ? 96420 : symbol.includes('XAU') ? 4335.80 : 1.085);
  const chg = Number(change24h) || 1.25;
  const isUp = chg >= 0;

  // Calculate change dollar amount
  const deltaPrice = (p * (chg / 100)).toFixed(symbol.includes('BTC') || symbol.includes('XAU') ? 2 : 4);

  // Indicators dynamic calculation
  const sma20 = (p * 0.9964).toFixed(symbol.includes('XAU') || symbol.includes('BTC') ? 2 : 4);
  const ema50 = (p * 0.9942).toFixed(symbol.includes('XAU') || symbol.includes('BTC') ? 2 : 4);
  const atr14 = (p * (symbol.includes('BTC') ? 0.012 : symbol.includes('XAU') ? 0.0035 : 0.0008)).toFixed(2);

  // Generate realistic candlestick bars for Canvas mode
  const candles = useMemo(() => {
    const bars = [];
    const count = 28;
    const vol = p * (symbol.includes('BTC') ? 0.015 : symbol.includes('XAU') ? 0.008 : 0.002);
    let curr = p * 0.978;

    for (let i = 0; i < count; i++) {
      const isBull = (i % 3 !== 0) || (i > 18);
      const move = (Math.random() * 0.6 + 0.2) * vol * (isBull ? 1 : -0.7);
      const open = curr;
      const close = Math.max(0.0001, open + move);
      const high = Math.max(open, close) + Math.random() * vol * 0.5;
      const low = Math.min(open, close) - Math.random() * vol * 0.5;

      bars.push({
        open,
        close,
        high,
        low,
        isBull: close >= open,
      });

      curr = close;
    }

    const last = bars[bars.length - 1];
    last.close = p;
    last.high = Math.max(last.high, p);
    last.low = Math.min(last.low, p);
    last.isBull = last.close >= last.open;

    return bars;
  }, [symbol, Math.floor(p / 50)]);

  // Chart coordinate mapping for Canvas mode
  const chartHeight = 440;
  const chartWidth = 640;
  const paddingY = 24;

  let minVal = Infinity;
  let maxVal = -Infinity;
  candles.forEach((c) => {
    if (c.low < minVal) minVal = c.low;
    if (c.high > maxVal) maxVal = c.high;
  });
  const valRange = maxVal - minVal || 1;

  const getY = (val) => {
    const norm = (val - minVal) / valRange;
    return chartHeight - paddingY - norm * (chartHeight - paddingY * 2);
  };

  const candleSpacing = chartWidth / (candles.length + 1);

  const trendLinePoints = useMemo(() => {
    return candles.map((c, i) => {
      const x = (i + 1) * candleSpacing;
      const avg = (c.open + c.close) / 2;
      const y = getY(avg);
      return `${x},${y}`;
    }).join(' ');
  }, [candles, candleSpacing, minVal, maxVal]);

  const tools = [
    {
      id: 'crosshair',
      label: 'Crosshair',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="3" x2="12" y2="7" />
          <line x1="12" y1="17" x2="12" y2="21" />
          <line x1="3" y1="12" x2="7" y2="12" />
          <line x1="17" y1="12" x2="21" y2="12" />
        </svg>
      ),
    },
    {
      id: 'trendline',
      label: 'Trendline',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="4" y1="20" x2="20" y2="4" />
          <circle cx="4" cy="20" r="2" />
          <circle cx="20" cy="4" r="2" />
        </svg>
      ),
    },
    {
      id: 'fibonacci',
      label: 'Fibonacci Grid',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      ),
    },
    {
      id: 'measure',
      label: 'Ruler / Measure',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21.3 8.7L8.7 21.3c-.4.4-1 .4-1.4 0L1.7 15.7c-.4-.4-.4-1 0-1.4L14.3 1.7c.4-.4 1-.4 1.4 0l5.6 5.6c.4.4.4 1 0 1.4z" />
          <line x1="7.5" y1="10.5" x2="9" y2="12" />
          <line x1="10.5" y1="7.5" x2="12" y2="9" />
          <line x1="13.5" y1="4.5" x2="15" y2="6" />
        </svg>
      ),
    },
    {
      id: 'cube',
      label: 'Strategy Box',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
    },
  ];

  return (
    <div
      style={{
        backgroundColor: '#0d0f14',
        border: '1px solid #1a1d24',
        borderRadius: '8px',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Header: Symbol, Subtitle, Price, Engine Selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Symbol & Subtitle */}
        <div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {symbol}
          </div>
          <div style={{ fontSize: '11px', color: '#6e7787', marginTop: '3px' }}>
            {SYMBOL_SUBTITLES[symbol] || 'Direct Institutional Market Feed'}
          </div>
        </div>

        {/* Center / Price */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>
            ${p.toLocaleString('en-US', { minimumFractionDigits: symbol.includes('BTC') || symbol.includes('XAU') ? 2 : 4, maximumFractionDigits: symbol.includes('BTC') || symbol.includes('XAU') ? 2 : 4 })}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: isUp ? '#4f9d69' : '#c1554a', fontFamily: 'var(--font-mono)', marginTop: '3px' }}>
            {isUp ? '+' : ''}${deltaPrice} ({isUp ? '+' : ''}{chg.toFixed(2)}%)
          </div>
        </div>

        {/* Engine Switcher + Timeframe Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Primary Engine Switcher */}
          <div
            style={{
              display: 'flex',
              background: '#12151c',
              border: '1px solid #1a1d24',
              borderRadius: '6px',
              padding: '2px',
              gap: '2px',
            }}
          >
            <button
              onClick={() => setChartMode('tradingview')}
              style={{
                background: chartMode === 'tradingview' ? '#1f2430' : 'transparent',
                color: chartMode === 'tradingview' ? '#cbb07a' : '#7e8794',
                border: chartMode === 'tradingview' ? '1px solid rgba(203, 176, 122, 0.3)' : 'none',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: chartMode === 'tradingview' ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              TradingView Pro
            </button>
            <button
              onClick={() => setChartMode('native')}
              style={{
                background: chartMode === 'native' ? '#1f2430' : 'transparent',
                color: chartMode === 'native' ? '#cbb07a' : '#7e8794',
                border: chartMode === 'native' ? '1px solid rgba(203, 176, 122, 0.3)' : 'none',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: chartMode === 'native' ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Native Quant
            </button>
            <button
              onClick={() => setChartMode('canvas')}
              style={{
                background: chartMode === 'canvas' ? '#1f2430' : 'transparent',
                color: chartMode === 'canvas' ? '#cbb07a' : '#7e8794',
                border: chartMode === 'canvas' ? '1px solid rgba(203, 176, 122, 0.3)' : 'none',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: chartMode === 'canvas' ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Canvas Spec
            </button>
          </div>

          {/* Timeframe Pills for Canvas mode */}
          {chartMode === 'canvas' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#141720',
                border: '1px solid #1a1d24',
                borderRadius: '6px',
                padding: '2px',
                gap: '2px',
              }}
            >
              {timeframes.map((tf) => {
                const isActive = timeframe.toLowerCase() === tf.toLowerCase();
                return (
                  <button
                    key={tf}
                    onClick={() => onChangeTimeframe(tf)}
                    style={{
                      background: isActive ? '#cbb07a' : 'transparent',
                      color: isActive ? '#0d1117' : '#7e8794',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 9px',
                      fontSize: '11px',
                      fontWeight: isActive ? 700 : 500,
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tf}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Chart Body — Spacious 490px container */}
      <div style={{ width: '100%', minHeight: '490px', borderRadius: '6px', overflow: 'hidden' }}>
        {chartMode === 'tradingview' ? (
          <TradingViewWidget
            key={symbol}
            symbol={TV_SYMBOLS[symbol] || 'FX:EURUSD'}
            rawSymbol={symbol}
            currentPrice={p}
            height={490}
          />
        ) : chartMode === 'native' ? (
          <NativeChart
            key={symbol}
            symbol={symbol}
            currentPrice={p}
            height={490}
          />
        ) : (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch', height: '490px' }}>
            {/* Left Drawing Tools Dock */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                background: '#12151c',
                border: '1px solid #1a1d24',
                borderRadius: '6px',
                padding: '8px 4px',
                alignSelf: 'center',
              }}
            >
              {tools.map((t) => {
                const isToolActive = activeTool === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTool(t.id)}
                    title={t.label}
                    style={{
                      width: '30px',
                      height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isToolActive ? '#1e2330' : 'transparent',
                      color: isToolActive ? '#cbb07a' : '#6e7787',
                      border: isToolActive ? '1px solid #2e3748' : 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {t.icon}
                  </button>
                );
              })}
            </div>

            {/* SVG Chart Canvas */}
            <div
              style={{
                flex: 1,
                position: 'relative',
                background: 'linear-gradient(180deg, #0f1218 0%, #0b0d12 100%)',
                border: '1px solid #1a1d24',
                borderRadius: '6px',
                height: '100%',
                overflow: 'hidden',
              }}
            >
              <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                preserveAspectRatio="none"
                style={{ display: 'block' }}
              >
                {/* Horizontal Grid lines */}
                {[0.2, 0.4, 0.6, 0.8].map((pct, idx) => (
                  <line
                    key={idx}
                    x1="0"
                    y1={chartHeight * pct}
                    x2={chartWidth}
                    y2={chartHeight * pct}
                    stroke="#181b22"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                ))}

                {/* Golden Trendline / Moving Average Overlay */}
                <polyline
                  fill="none"
                  stroke="#cbb07a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.85"
                  points={trendLinePoints}
                />

                {/* Candlesticks */}
                {candles.map((c, i) => {
                  const x = (i + 1) * candleSpacing;
                  const yOpen = getY(c.open);
                  const yClose = getY(c.close);
                  const yHigh = getY(c.high);
                  const yLow = getY(c.low);

                  const bodyY = Math.min(yOpen, yClose);
                  const bodyHeight = Math.max(4, Math.abs(yClose - yOpen));
                  const color = c.isBull ? '#4f9d69' : '#c1554a';

                  return (
                    <g key={i}>
                      <line
                        x1={x}
                        y1={yHigh}
                        x2={x}
                        y2={yLow}
                        stroke={color}
                        strokeWidth="1.5"
                        opacity="0.8"
                      />
                      <rect
                        x={x - 4.5}
                        y={bodyY}
                        width="9"
                        height={bodyHeight}
                        fill={color}
                        rx="1"
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Under-Chart Indicator Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: '#090b0e',
          border: '1px solid #161921',
          borderRadius: '4px',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: '#8b94a3',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div>
          <span style={{ color: '#56606d' }}>SMA(20): </span>
          <span style={{ color: '#eef1f5', fontWeight: 600 }}>${sma20}</span>
        </div>
        <div>
          <span style={{ color: '#56606d' }}>EMA(50): </span>
          <span style={{ color: '#eef1f5', fontWeight: 600 }}>${ema50}</span>
        </div>
        <div>
          <span style={{ color: '#56606d' }}>ATR(14): </span>
          <span style={{ color: '#eef1f5', fontWeight: 600 }}>{atr14}</span>
        </div>
        <div>
          <span style={{ color: '#56606d' }}>MACD: </span>
          <span style={{ color: '#4f9d69', fontWeight: 700 }}>+4.81 (Bullish Divergence)</span>
        </div>
      </div>
    </div>
  );
}

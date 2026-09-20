import React from 'react';

export default function PredictionCard({
  symbol,
  price,
  change,
  pct,
  direction = 'BULLISH',
  confidence = 70,
  timeframe = '1H',
  models,
  indicators,
}) {
  const isBullish = direction.toUpperCase() === 'BULLISH';
  const accentColor = isBullish ? 'var(--accent-green)' : 'var(--accent-red)';
  const accentBg = isBullish ? 'var(--accent-green-bg)' : 'var(--accent-red-bg)';

  const numPrice = Number(price);
  const formattedPrice = !isNaN(numPrice)
    ? numPrice.toFixed(symbol?.includes('JPY') ? 3 : symbol?.includes('BTC') || symbol?.includes('XAU') ? 2 : 5)
    : price || '—';

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Header: Symbol & Direction Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>
            {symbol}
          </span>
          <span
            style={{
              marginLeft: '8px',
              fontSize: '11px',
              color: 'var(--text-muted)',
              background: 'rgba(255,255,255,0.05)',
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            {timeframe}
          </span>
        </div>

        <div
          style={{
            background: accentBg,
            color: accentColor,
            border: `1px solid ${accentColor}40`,
            padding: '3px 10px',
            borderRadius: '16px',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>{isBullish ? '▲' : '▼'}</span>
          <span>{direction.toUpperCase()}</span>
        </div>
      </div>

      {/* Price & Change if available */}
      {price && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 600 }}>
            {formattedPrice}
          </span>
          {change !== undefined && (
            <span style={{ fontSize: '11px', color: (Number(change) >= 0) ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {Number(change) >= 0 ? '+' : ''}{Number(change).toFixed(4)} ({Number(pct) >= 0 ? '+' : ''}{Number(pct).toFixed(2)}%)
            </span>
          )}
        </div>
      )}

      {/* Confidence Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Model Confidence</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: accentColor }}>
            {confidence}%
          </span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(100, Math.max(0, confidence))}%`,
              height: '100%',
              background: accentColor,
              borderRadius: '3px',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>

      {/* Model Breakdown / Indicators if present */}
      {(models || indicators) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
            paddingTop: '8px',
            borderTop: '1px solid var(--border)',
            fontSize: '10px',
          }}
        >
          {models?.lstm !== undefined && (
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)' }}>LSTM</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {models.lstm}%
              </div>
            </div>
          )}
          {models?.random_forest !== undefined && (
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)' }}>Rand Forest</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {models.random_forest}%
              </div>
            </div>
          )}
          {indicators?.rsi !== undefined && (
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)' }}>RSI (14)</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {indicators.rsi}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

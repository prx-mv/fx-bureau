import React from 'react';
import { isForexOrMetalsMarketOpen } from '../hooks/usePrices';

export default function MarketIntelligenceCockpit({
  symbol,
  currentPrice,
  priceData,
  prediction,
  loading,
  onRefresh,
  onOpenOrderModal,
  timeframe,
}) {
  const isOpen = priceData?.isOpen ?? isForexOrMetalsMarketOpen(symbol);
  const decimals = priceData?.decimals || (symbol.includes('JPY') ? 3 : symbol.includes('BTC') || symbol.includes('XAU') ? 2 : 5);
  const isBullish = prediction?.direction === 'BULLISH';
  const accentColor = isBullish ? 'var(--accent-green)' : 'var(--accent-red)';
  const accentBg = isBullish ? 'var(--accent-green-bg)' : 'var(--accent-red-bg)';

  const livePriceFormatted = Number(currentPrice || priceData?.price || 0).toFixed(decimals);
  const targetPriceFormatted = prediction?.target_price ? Number(prediction.target_price).toFixed(decimals) : null;
  const isUp = (priceData?.change ?? 0) >= 0;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>
            Market Intelligence · {symbol}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {livePriceFormatted}
            </span>
            {isOpen ? (
              <span style={{ fontSize: '12px', fontWeight: 700, color: isUp ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {isUp ? '+' : ''}{Number(priceData?.change || 0).toFixed(decimals)} ({isUp ? '+' : ''}{Number(priceData?.pct || 0).toFixed(2)}%)
              </span>
            ) : (
              <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent-yellow)', background: 'rgba(201, 138, 60, 0.15)', border: '1px solid rgba(201, 138, 60, 0.3)', padding: '2px 7px', borderRadius: '4px' }}>
                MARKET CLOSED · FRIDAY SETTLEMENT
              </span>
            )}
          </div>
        </div>

        <button
          onClick={isOpen ? onRefresh : () => {}}
          disabled={loading || !isOpen}
          style={{
            background: !isOpen ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: !isOpen ? 'var(--text-muted)' : 'var(--text-secondary)',
            padding: '5px 10px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: !isOpen ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>{!isOpen ? '🔒 Stopped (Market Closed)' : loading ? '⟳ Calculating...' : '⟳ Refresh ML'}</span>
        </button>
      </div>

      {!isOpen && (
        <div
          style={{
            background: 'rgba(201, 138, 60, 0.09)',
            border: '1px solid rgba(201, 138, 60, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '18px', lineHeight: 1 }}>🔒</span>
          <div>
            <div style={{ color: 'var(--accent-yellow)', fontWeight: 800, fontSize: '12px' }}>
              MARKET CLOSED · INTELLIGENCE STOPPED & FROZEN AT CLOSE
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.4 }}>
              Trading for {symbol} is halted for the weekend session. All price movements, momentum drifts, and real-time inference calculations are stopped. Reopens Sunday at 17:00 ET (21:00 UTC).
            </div>
          </div>
        </div>
      )}

      {/* Main Signal Banner */}
      <div
        style={{
          background: accentBg,
          border: `1px solid ${accentColor}50`,
          borderRadius: '8px',
          padding: '14px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            {!isOpen ? `FROZEN SESSION CLOSE SIGNAL (${timeframe})` : `ML PREDICTED DIRECTION (${timeframe})`}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: accentColor, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span>{isBullish ? '▲' : '▼'}</span>
            <span>{prediction?.direction || 'NEUTRAL'}</span>
            {!isOpen && (
              <span style={{ fontSize: '9px', fontWeight: 800, background: 'rgba(0,0,0,0.25)', color: 'var(--accent-yellow)', border: '1px solid rgba(201, 138, 60, 0.3)', padding: '1px 5px', borderRadius: '4px', marginLeft: '4px' }}>
                FROZEN
              </span>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>
            {!isOpen ? 'SETTLEMENT CONFIDENCE' : 'CONFIDENCE'}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 800, color: accentColor, marginTop: '2px' }}>
            {prediction?.confidence || 50}%
          </div>
        </div>
      </div>

      {/* Confidence Meter Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '5px' }}>
          <span>Bearish (0%)</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Equilibrium</span>
          <span>Bullish (100%)</span>
        </div>
        <div style={{ height: '7px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
          <div
            style={{
              width: `${Math.min(100, Math.max(0, isBullish ? prediction?.confidence : 100 - (prediction?.confidence || 50)))}%`,
              height: '100%',
              background: accentColor,
              borderRadius: '4px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Quick Simulated Order Execution Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <button
          type="button"
          onClick={() => onOpenOrderModal && onOpenOrderModal('BUY')}
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            color: 'var(--accent-green)',
            border: '1px solid var(--accent-green)',
            borderRadius: '8px',
            padding: '10px',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <span>BUY / LONG</span>
          <span>▲</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenOrderModal && onOpenOrderModal('SELL')}
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            color: 'var(--accent-red)',
            border: '1px solid var(--accent-red)',
            borderRadius: '8px',
            padding: '10px',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <span>SELL / SHORT</span>
          <span>▼</span>
        </button>
      </div>

      {/* Target Price Projection */}
      {targetPriceFormatted && (
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
          }}
        >
          <span style={{ color: 'var(--text-secondary)' }}>Projected ML Target ({timeframe})</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: accentColor }}>
            {targetPriceFormatted}
          </span>
        </div>
      )}

      {/* Multi-Model Breakdown */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Ensemble Architecture Weights
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Random Forest</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}>
              {prediction?.models?.random_forest ?? 75}%
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>LSTM Neural</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}>
              {prediction?.models?.lstm ?? 72}%
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Quant Ensemble</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, marginTop: '2px', color: accentColor }}>
              {prediction?.models?.ensemble ?? 74}%
            </div>
          </div>
        </div>
      </div>

      {/* Technical Indicator Matrix */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Real-Time Technical Metrics
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '8px 10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>RSI (14)</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
              {prediction?.indicators?.rsi ?? 52.4}
            </span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '8px 10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>MACD Hist</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: (prediction?.indicators?.macd_hist ?? 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {prediction?.indicators?.macd_hist ?? '0.0001'}
            </span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '8px 10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Bollinger %B</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
              {prediction?.indicators?.bb_pct ?? 0.52}
            </span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '8px 10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Trend</span>
            <span style={{ fontWeight: 700, color: isBullish ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {prediction?.indicators?.trend ?? (isBullish ? 'UPTREND' : 'DOWNTREND')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

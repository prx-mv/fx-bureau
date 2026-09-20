import React, { useState, useEffect } from 'react';
import { isForexOrMetalsMarketOpen } from '../hooks/usePrices';

export default function InstitutionalRightSidebar({
  symbol = 'XAU/USD',
  currentPrice = 4335.80,
  prediction = null,
  balance = 50000,
  onExecuteOrder = () => {},
  alerts = [],
  alertHistory = [],
  onOpenAlertModal = () => {},
  onRefreshPrediction = () => {},
}) {
  const [side, setSide] = useState('BUY');
  const [lotSize, setLotSize] = useState('1.00');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [isTransmitting, setIsTransmitting] = useState(false);

  const isOpen = isForexOrMetalsMarketOpen(symbol);
  const priceNum = Number(currentPrice) || (symbol.includes('BTC') ? 96420 : symbol.includes('XAU') ? 4335.80 : 1.085);
  const decimals = symbol.includes('JPY') ? 3 : symbol.includes('BTC') || symbol.includes('XAU') ? 2 : 4;

  const isBullish = prediction?.direction === 'BULLISH' || (!prediction && side === 'BUY');
  const confidence = prediction?.confidence || 89.4;

  // Auto-fill SL & TP defaults when symbol or price changes if user hasn't typed custom
  useEffect(() => {
    const atr = priceNum * (symbol.includes('BTC') ? 0.012 : symbol.includes('XAU') ? 0.006 : 0.0015);
    if (side === 'BUY') {
      setStopLoss((priceNum - atr * 1.5).toFixed(decimals));
      setTakeProfit((priceNum + atr * 2.5).toFixed(decimals));
    } else {
      setStopLoss((priceNum + atr * 1.5).toFixed(decimals));
      setTakeProfit((priceNum - atr * 2.5).toFixed(decimals));
    }
  }, [symbol, priceNum, side, decimals]);

  // Sizing calculations
  const parsedLot = parseFloat(lotSize) || 1.0;
  const contractMultiplier = symbol.includes('BTC') || symbol.includes('ETH') ? 1 : symbol.includes('XAU') ? 100 : symbol.includes('XAG') ? 1000 : 100000;
  const maxLots = ((balance * 0.7) / (priceNum * (contractMultiplier === 100000 ? 0.02 : 0.05))).toFixed(1);
  const requiredMargin = ((priceNum * parsedLot * contractMultiplier) * 0.02).toFixed(2);

  const parsedSL = parseFloat(stopLoss) || 0;
  const parsedTP = parseFloat(takeProfit) || 0;
  const slDist = Math.abs(priceNum - parsedSL);
  const tpDist = Math.abs(parsedTP - priceNum);
  const rrRatio = slDist > 0 && tpDist > 0 ? (tpDist / slDist).toFixed(1) : '2.4';
  const estimatedMaxLoss = (slDist * parsedLot * contractMultiplier).toFixed(2);

  const handleTransmit = () => {
    setIsTransmitting(true);
    setTimeout(() => {
      onExecuteOrder({
        symbol,
        side,
        volume: parsedLot,
        entryPrice: priceNum,
        stopLoss: parsedSL || null,
        takeProfit: parsedTP || null,
      });
      setIsTransmitting(false);
    }, 200);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        width: '100%',
        userSelect: 'none',
      }}
    >
      {/* 1. MARKET INTELLIGENCE COCKPIT */}
      <div
        style={{
          backgroundColor: '#0d0f14',
          border: '1px solid #1a1d24',
          borderRadius: '8px',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.6px',
              color: '#cbb07a',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-display)',
            }}
          >
            Market Intelligence Cockpit
          </span>

          {!isOpen ? (
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                color: '#c98a3c',
                backgroundColor: 'rgba(201, 138, 60, 0.15)',
                border: '1px solid rgba(201, 138, 60, 0.3)',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              🔒 MARKET CLOSED
            </span>
          ) : (
            <button
              onClick={onRefreshPrediction}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#6e7787',
                fontSize: '10px',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
              }}
              title="Recalculate inference"
            >
              ⟳ Refresh
            </button>
          )}
        </div>

        {/* Closed Market Weekend Alert Banner if Forex/Metals weekend */}
        {!isOpen && (
          <div
            style={{
              backgroundColor: 'rgba(201, 138, 60, 0.08)',
              border: '1px solid rgba(201, 138, 60, 0.25)',
              borderRadius: '6px',
              padding: '8px 10px',
              fontSize: '11px',
              color: '#c3cbd6',
              lineHeight: 1.4,
            }}
          >
            <div style={{ color: '#c98a3c', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>
              Weekend Settlement · Signals Frozen
            </div>
            <div style={{ fontSize: '10px', color: '#8b94a3', marginTop: '2px' }}>
              {symbol} spot trading halted. Predictions stopped at Friday close. Reopens Sunday 17:00 ET.
            </div>
          </div>
        )}

        {/* ML Predictive Model Card */}
        <div
          style={{
            backgroundColor: '#12151c',
            border: '1px solid #1c212b',
            borderRadius: '6px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '10px', color: '#6e7787', fontWeight: 600 }}>ML Predictive Model</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
              {symbol} Direction {!isOpen && <span style={{ fontSize: '10px', color: '#c98a3c' }}>(Frozen)</span>}
            </div>
          </div>

          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.5px',
              padding: '4px 10px',
              borderRadius: '4px',
              backgroundColor: isBullish ? 'rgba(79, 157, 105, 0.18)' : 'rgba(193, 85, 74, 0.18)',
              color: isBullish ? '#4f9d69' : '#c1554a',
              border: isBullish ? '1px solid rgba(79, 157, 105, 0.4)' : '1px solid rgba(193, 85, 74, 0.4)',
            }}
          >
            {isBullish ? 'STRONG BUY' : 'STRONG SELL'}
          </span>
        </div>

        {/* 3 Metrics: Confidence, Estimated Target, ATR Stop */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.2fr 1fr',
            gap: '8px',
          }}
        >
          <div
            style={{
              backgroundColor: '#12151c',
              border: '1px solid #1c212b',
              borderRadius: '6px',
              padding: '8px 10px',
            }}
          >
            <div style={{ fontSize: '10px', color: '#6e7787', fontWeight: 600 }}>Confidence</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: isBullish ? '#4f9d69' : '#c1554a', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              {confidence}%
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#12151c',
              border: '1px solid #1c212b',
              borderRadius: '6px',
              padding: '8px 10px',
            }}
          >
            <div style={{ fontSize: '10px', color: '#6e7787', fontWeight: 600 }}>Target</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#cbb07a', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              ${takeProfit || (priceNum * 1.008).toFixed(decimals)}
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#12151c',
              border: '1px solid #1c212b',
              borderRadius: '6px',
              padding: '8px 10px',
            }}
          >
            <div style={{ fontSize: '10px', color: '#6e7787', fontWeight: 600 }}>ATR Stop</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#e5e7eb', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              ${stopLoss || (priceNum * 0.994).toFixed(decimals)}
            </div>
          </div>
        </div>

        {/* Ensemble Multi-Model Weights */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6e7787', marginBottom: '6px' }}>
            Ensemble Architecture Weights
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            <div style={{ backgroundColor: '#12151c', border: '1px solid #1c212b', borderRadius: '5px', padding: '6px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#6e7787' }}>Random Forest</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#d6dbe3', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {prediction?.models?.random_forest ?? 75}%
              </div>
            </div>
            <div style={{ backgroundColor: '#12151c', border: '1px solid #1c212b', borderRadius: '5px', padding: '6px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#6e7787' }}>LSTM Neural</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#d6dbe3', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {prediction?.models?.lstm ?? 72}%
              </div>
            </div>
            <div style={{ backgroundColor: '#12151c', border: '1px solid #1c212b', borderRadius: '5px', padding: '6px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#6e7787' }}>Quant Ensemble</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: isBullish ? '#4f9d69' : '#c1554a', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {prediction?.models?.ensemble ?? 74}%
              </div>
            </div>
          </div>
        </div>

        {/* Technical Indicators Matrix */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
          <div style={{ backgroundColor: '#12151c', border: '1px solid #1c212b', borderRadius: '5px', padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#6e7787' }}>RSI (14)</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
              {prediction?.indicators?.rsi ?? 52.4}
            </span>
          </div>
          <div style={{ backgroundColor: '#12151c', border: '1px solid #1c212b', borderRadius: '5px', padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#6e7787' }}>MACD Hist</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: (prediction?.indicators?.macd_hist ?? 0) >= 0 ? '#4f9d69' : '#c1554a', fontFamily: 'var(--font-mono)' }}>
              {prediction?.indicators?.macd_hist ?? '+0.0001'}
            </span>
          </div>
          <div style={{ backgroundColor: '#12151c', border: '1px solid #1c212b', borderRadius: '5px', padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#6e7787' }}>Bollinger %B</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
              {prediction?.indicators?.bb_pct ?? 0.52}
            </span>
          </div>
          <div style={{ backgroundColor: '#12151c', border: '1px solid #1c212b', borderRadius: '5px', padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#6e7787' }}>Trend</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: isBullish ? '#4f9d69' : '#c1554a' }}>
              {prediction?.indicators?.trend ?? (isBullish ? 'UPTREND' : 'DOWNTREND')}
            </span>
          </div>
        </div>
      </div>

      {/* 2. INSTITUTIONAL TICKET */}
      <div
        style={{
          backgroundColor: '#0d0f14',
          border: '1px solid #1a1d24',
          borderRadius: '8px',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.6px',
            color: '#cbb07a',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-display)',
          }}
        >
          Institutional Ticket
        </div>

        {/* Side Selector Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            backgroundColor: '#12151c',
            padding: '3px',
            borderRadius: '6px',
            border: '1px solid #1c212b',
          }}
        >
          <button
            onClick={() => setSide('BUY')}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: side === 'BUY' ? '1px solid #4f9d69' : 'none',
              backgroundColor: side === 'BUY' ? '#173623' : 'transparent',
              color: side === 'BUY' ? '#4f9d69' : '#6e7787',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>▲</span>
            <span>BUY / LONG</span>
          </button>

          <button
            onClick={() => setSide('SELL')}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: side === 'SELL' ? '1px solid #c1554a' : 'none',
              backgroundColor: side === 'SELL' ? '#3d1c1a' : 'transparent',
              color: side === 'SELL' ? '#c1554a' : '#6e7787',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>▼</span>
            <span>SELL / SHORT</span>
          </button>
        </div>

        {/* Lot Size Input */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <label style={{ fontSize: '10px', color: '#8b94a3', fontWeight: 600 }}>
              Lot Size ({contractMultiplier === 100 ? '100oz per lot' : 'Standard Unit'})
            </label>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#6e7787' }}>
              MAX LOT: {maxLots}
            </span>
          </div>
          <input
            type="number"
            step="0.1"
            min="0.01"
            value={lotSize}
            onChange={(e) => setLotSize(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#12151c',
              border: '1px solid #1c212b',
              borderRadius: '5px',
              color: '#ffffff',
              padding: '8px 10px',
              fontSize: '13px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Stop Loss & Take Profit Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '10px', color: '#8b94a3', fontWeight: 600, marginBottom: '4px' }}>
              Stop Loss
            </label>
            <input
              type="number"
              step="any"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="0.00"
              style={{
                width: '100%',
                backgroundColor: '#12151c',
                border: '1px solid #1c212b',
                borderRadius: '5px',
                color: '#c1554a',
                padding: '8px 10px',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '10px', color: '#8b94a3', fontWeight: 600, marginBottom: '4px' }}>
              Take Profit
            </label>
            <input
              type="number"
              step="any"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              placeholder="0.00"
              style={{
                width: '100%',
                backgroundColor: '#12151c',
                border: '1px solid #1c212b',
                borderRadius: '5px',
                color: '#4f9d69',
                padding: '8px 10px',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Sizing & Margin Breakdown Rows */}
        <div
          style={{
            borderTop: '1px solid #1a1d24',
            paddingTop: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '11px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6e7787' }}>Required Margin</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#d6dbe3', fontWeight: 600 }}>${requiredMargin}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6e7787' }}>Risk / Reward Ratio</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#cbb07a', fontWeight: 700 }}>1 : {rrRatio}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6e7787' }}>Estimated Max Loss</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#c1554a', fontWeight: 600 }}>-${estimatedMaxLoss}</span>
          </div>
        </div>

        {/* Primary Action Button: TRANSMIT ORDER TICKET */}
        <button
          onClick={handleTransmit}
          disabled={isTransmitting}
          style={{
            width: '100%',
            backgroundColor: '#cbb07a',
            color: '#0d1117',
            border: 'none',
            borderRadius: '6px',
            padding: '11px',
            fontSize: '12px',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.6px',
            cursor: isTransmitting ? 'wait' : 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 0 14px rgba(203, 176, 122, 0.25)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#d8be87';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#cbb07a';
          }}
        >
          {isTransmitting ? 'TRANSMITTING...' : 'TRANSMIT ORDER TICKET'}
        </button>
      </div>

      {/* 3. QUANT ALERTS & TRIGGERS */}
      <div
        style={{
          backgroundColor: '#0d0f14',
          border: '1px solid #1a1d24',
          borderRadius: '8px',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.6px',
              color: '#cbb07a',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-display)',
            }}
          >
            Quant Alerts & Triggers
          </span>
          <button
            onClick={onOpenAlertModal}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6e7787',
              fontSize: '11px',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            + Config
          </button>
        </div>

        {/* Alert Notification Card */}
        <div
          style={{
            backgroundColor: '#12151c',
            border: '1px solid #1c212b',
            borderRadius: '6px',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4f9d69' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>
                {symbol} Direction Flip
              </span>
            </div>
            <span style={{ fontSize: '10px', color: '#6e7787', fontFamily: 'var(--font-mono)' }}>10m ago</span>
          </div>

          <div style={{ fontSize: '10px', color: '#8b94a3', lineHeight: 1.4 }}>
            Machine Learning signals flipped to BULLISH
          </div>
        </div>
      </div>
    </div>
  );
}

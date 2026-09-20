import React, { useState, useEffect } from 'react';
import { isForexOrMetalsMarketOpen } from '../hooks/usePrices';

export default function OrderModal({
  isOpen,
  onClose,
  symbol,
  currentPrice,
  prediction,
  onExecuteTrade,
  balance,
  initialSide,
  initialData,
  onOpenRiskCalculator,
}) {
  const [side, setSide] = useState('BUY');
  const [volume, setVolume] = useState('1.0');
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [orderType, setOrderType] = useState('MARKET');

  const decimals = symbol?.includes('JPY') ? 3 : symbol?.includes('BTC') || symbol?.includes('XAU') || symbol?.includes('XAG') ? 2 : 5;
  const numPrice = Number(currentPrice || 0);

  // Auto-populate side and TP/SL from ML recommendation or risk calculator when opened
  useEffect(() => {
    if (!isOpen || !numPrice) return;

    if (initialData) {
      if (initialData.side) setSide(initialData.side);
      if (initialData.volume) setVolume(initialData.volume);
      if (initialData.takeProfit) setTakeProfit(initialData.takeProfit);
      if (initialData.stopLoss) setStopLoss(initialData.stopLoss);
      return;
    }

    const isBull = prediction?.direction === 'BULLISH';
    const recSide = initialSide || (isBull ? 'BUY' : 'SELL');
    setSide(recSide);

    // Default suggested volume
    setVolume(symbol.includes('BTC') ? '0.2' : symbol.includes('ETH') ? '1.5' : '1.0');

    // Auto-calculate suggested TP and SL from volatility/prediction
    const tpPrice = prediction?.target_price ? Number(prediction.target_price) : null;
    const spreadOffset = numPrice * (symbol.includes('BTC') ? 0.015 : symbol.includes('XAU') ? 0.008 : symbol.includes('XAG') ? 0.012 : 0.004);

    if (recSide === 'BUY') {
      const calculatedTp = tpPrice && tpPrice > numPrice ? tpPrice : numPrice + spreadOffset;
      const calculatedSl = numPrice - spreadOffset * 0.75;
      setTakeProfit(calculatedTp.toFixed(decimals));
      setStopLoss(calculatedSl.toFixed(decimals));
    } else {
      const calculatedTp = tpPrice && tpPrice < numPrice ? tpPrice : numPrice - spreadOffset;
      const calculatedSl = numPrice + spreadOffset * 0.75;
      setTakeProfit(calculatedTp.toFixed(decimals));
      setStopLoss(calculatedSl.toFixed(decimals));
    }
  }, [isOpen, symbol, numPrice, prediction, initialSide, initialData, decimals]);

  if (!isOpen) return null;

  const numVol = parseFloat(volume) || 0.1;
  const isBuy = side === 'BUY';
  const accentColor = isBuy ? 'var(--accent-green)' : 'var(--accent-red)';
  const accentBg = isBuy ? 'var(--accent-green-bg)' : 'var(--accent-red-bg)';

  // Leverage & Margin estimation
  const leverage = symbol.includes('BTC') || symbol.includes('ETH') ? 5 : 30;
  const multiplier = symbol.includes('BTC') || symbol.includes('ETH') ? 1 : symbol.includes('XAU') ? 100 : symbol.includes('XAG') ? 1000 : 100000;
  const notionalValue = numPrice * numVol * (symbol.includes('BTC') || symbol.includes('ETH') ? 1 : symbol.includes('XAU') ? 1 : 1);
  const requiredMargin = notionalValue / leverage;

  const numTp = parseFloat(takeProfit);
  const numSl = parseFloat(stopLoss);
  const estProfit = numTp ? Math.abs(numTp - numPrice) * numVol * (symbol.includes('BTC') || symbol.includes('ETH') ? 1 : 100) : 0;
  const estLoss = numSl ? Math.abs(numPrice - numSl) * numVol * (symbol.includes('BTC') || symbol.includes('ETH') ? 1 : 100) : 0;
  const riskReward = estLoss > 0 ? (estProfit / estLoss).toFixed(2) : '—';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!numPrice || numVol <= 0) return;

    onExecuteTrade({
      symbol,
      side,
      entryPrice: numPrice,
      volume: numVol,
      takeProfit: numTp || null,
      stopLoss: numSl || null,
      margin: requiredMargin,
      mlDirection: prediction?.direction || 'NEUTRAL',
      mlConfidence: prediction?.confidence || 50,
      timeframe: prediction?.timeframe || '1H',
    });

    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 15, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '460px',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Paper Order Ticket · {symbol}
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Execution Price: <b style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{numPrice.toFixed(decimals)}</b>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '20px',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {!isForexOrMetalsMarketOpen(symbol) && (
          <div
            style={{
              background: 'rgba(201, 138, 60, 0.1)',
              border: '1px solid rgba(201, 138, 60, 0.3)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '12px',
              color: 'var(--accent-yellow)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '15px' }}>⚠️</span>
            <span>
              <strong>Weekend Session Notice:</strong> {symbol} trading is closed until Sunday 17:00 ET (21:00 UTC). This order is simulated against Friday's closing settlement price of <strong style={{ fontFamily: 'var(--font-mono)' }}>{numPrice.toFixed(decimals)}</strong>.
            </span>
          </div>
        )}

        {/* ML Signal Notice */}
        {prediction && (
          <div
            style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>AI Signal: </span>
              <b style={{ color: prediction.direction === 'BULLISH' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {prediction.direction} ({prediction.confidence}%)
              </b>
            </div>
            {prediction.target_price && (
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)', fontSize: '11px' }}>
                Target: {Number(prediction.target_price).toFixed(decimals)}
              </span>
            )}
          </div>
        )}

        {/* Order Side Selector (BUY vs SELL) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setSide('BUY')}
            style={{
              background: side === 'BUY' ? 'var(--accent-green)' : 'rgba(16, 185, 129, 0.08)',
              color: side === 'BUY' ? '#ffffff' : 'var(--accent-green)',
              border: `1px solid ${side === 'BUY' ? 'var(--accent-green)' : 'rgba(16, 185, 129, 0.3)'}`,
              borderRadius: '8px',
              padding: '12px',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            BUY / LONG ▲
          </button>
          <button
            type="button"
            onClick={() => setSide('SELL')}
            style={{
              background: side === 'SELL' ? 'var(--accent-red)' : 'rgba(239, 68, 68, 0.08)',
              color: side === 'SELL' ? '#ffffff' : 'var(--accent-red)',
              border: `1px solid ${side === 'SELL' ? 'var(--accent-red)' : 'rgba(239, 68, 68, 0.3)'}`,
              borderRadius: '8px',
              padding: '12px',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            SELL / SHORT ▼
          </button>
        </div>

        {/* Volume / Lot Size Input */}
        <div>
          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            <span>Order Volume ({symbol.includes('BTC') || symbol.includes('ETH') ? 'Units' : 'Lots'})</span>
            <span style={{ color: 'var(--text-muted)' }}>Avail: ${(balance || 50000).toLocaleString()}</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-main)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '15px',
              fontWeight: 700,
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
            {(symbol.includes('BTC') ? ['0.05', '0.1', '0.25', '0.5'] : ['0.1', '0.5', '1.0', '2.5']).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVolume(v)}
                style={{
                  flex: 1,
                  background: volume === v ? 'var(--accent-blue)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${volume === v ? 'var(--accent-blue)' : 'var(--border)'}`,
                  borderRadius: '4px',
                  color: volume === v ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '11px',
                  padding: '4px 0',
                  cursor: 'pointer',
                  fontWeight: volume === v ? 700 : 500,
                }}
              >
                {v}
              </button>
            ))}
            {onOpenRiskCalculator && (
              <button
                type="button"
                onClick={onOpenRiskCalculator}
                title="Calculate position size based on 1% risk"
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: 'var(--accent-blue)',
                  border: '1px solid var(--accent-blue)',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                🧮 1% Sizer
              </button>
            )}
          </div>
        </div>

        {/* Take-Profit and Stop-Loss Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--accent-green)', marginBottom: '4px' }}>
              Take-Profit (TP)
            </label>
            <input
              type="number"
              step="any"
              placeholder={`e.g. ${numPrice.toFixed(decimals)}`}
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-main)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '6px',
                padding: '8px 10px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--accent-red)', marginBottom: '4px' }}>
              Stop-Loss (SL)
            </label>
            <input
              type="number"
              step="any"
              placeholder={`e.g. ${numPrice.toFixed(decimals)}`}
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-main)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                padding: '8px 10px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Risk / Reward Metrics summary */}
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '11px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '8px',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ color: 'var(--text-muted)' }}>Req Margin</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
              ${requiredMargin.toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)' }}>R:R Ratio</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-blue)', marginTop: '2px' }}>
              1 : {riskReward}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)' }}>Est. Profit</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-green)', marginTop: '2px' }}>
              +${estProfit.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Execute Button */}
        <button
          type="button"
          onClick={handleSubmit}
          style={{
            background: accentColor,
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '14px',
            fontWeight: 800,
            fontSize: '15px',
            cursor: 'pointer',
            boxShadow: `0 4px 15px ${isBuy ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            transition: 'transform 0.1s ease',
          }}
        >
          Execute Simulated {side} Order
        </button>
      </div>
    </div>
  );
}

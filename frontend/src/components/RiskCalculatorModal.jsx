import React, { useState, useEffect } from 'react';

const PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'XAG/USD', 'BTC/USD', 'ETH/USD'];

export default function RiskCalculatorModal({
  isOpen,
  onClose,
  symbol = 'XAU/USD',
  currentPrice = 0,
  balance = 50000,
  prediction,
  onApplyToOrder,
}) {
  const [selectedSymbol, setSelectedSymbol] = useState(symbol);
  const [side, setSide] = useState('BUY');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [riskPercent, setRiskPercent] = useState('1.0'); // 1% default institutional risk

  const decimals = selectedSymbol.includes('JPY') ? 3 : selectedSymbol.includes('BTC') || selectedSymbol.includes('XAU') || selectedSymbol.includes('XAG') ? 2 : 5;

  useEffect(() => {
    if (isOpen) {
      setSelectedSymbol(symbol);
      const numP = Number(currentPrice || 0);
      setEntryPrice(numP ? numP.toFixed(decimals) : '');

      const isBull = prediction?.direction === 'BULLISH';
      const recSide = isBull ? 'BUY' : 'SELL';
      setSide(recSide);

      // Suggest SL / TP using ATR-like volatility offset
      const offset = numP * (symbol.includes('BTC') ? 0.015 : symbol.includes('XAU') ? 0.008 : symbol.includes('XAG') ? 0.012 : 0.004);
      if (numP > 0) {
        if (recSide === 'BUY') {
          setStopLoss((numP - offset * 0.8).toFixed(decimals));
          setTakeProfit((numP + offset * 1.6).toFixed(decimals));
        } else {
          setStopLoss((numP + offset * 0.8).toFixed(decimals));
          setTakeProfit((numP - offset * 1.6).toFixed(decimals));
        }
      }
    }
  }, [isOpen, symbol, currentPrice, prediction, decimals]);

  if (!isOpen) return null;

  const numEntry = parseFloat(entryPrice) || 0;
  const numSl = parseFloat(stopLoss) || 0;
  const numTp = parseFloat(takeProfit) || 0;
  const numRiskPct = parseFloat(riskPercent) || 1.0;

  // Max risk amount in currency
  const riskAmount = (balance * (numRiskPct / 100.0));

  // Multiplier
  const getMultiplier = (sym, price) => {
    if (sym.includes('BTC') || sym.includes('ETH')) return 1;
    if (sym.includes('XAU')) return 100;
    if (sym.includes('XAG')) return 1000;
    if (sym.includes('JPY')) return 100000 / (price || 155);
    return 100000;
  };

  const mult = getMultiplier(selectedSymbol, numEntry);
  const slDistance = numEntry > 0 && numSl > 0 ? Math.abs(numEntry - numSl) : 0;
  const tpDistance = numEntry > 0 && numTp > 0 ? Math.abs(numTp - numEntry) : 0;

  // Position size in lots
  let recommendedLots = 0.01;
  let lossPerLot = slDistance * mult;
  if (lossPerLot > 0) {
    recommendedLots = Math.max(0.01, Math.round((riskAmount / lossPerLot) * 100) / 100);
  }

  // Est loss & Est profit
  const estLoss = slDistance * recommendedLots * mult;
  const estProfit = tpDistance * recommendedLots * mult;
  const riskRewardRatio = estLoss > 0 && estProfit > 0 ? (estProfit / estLoss).toFixed(2) : '—';

  // Leverage & Margin required
  const leverage = selectedSymbol.includes('BTC') || selectedSymbol.includes('ETH') ? 5 : 30;
  const notionalValue = numEntry * recommendedLots * (selectedSymbol.includes('BTC') || selectedSymbol.includes('ETH') ? 1 : 1);
  const requiredMargin = notionalValue / leverage;
  const marginUsagePct = balance > 0 ? ((requiredMargin / balance) * 100).toFixed(1) : '0.0';

  const handleApply = () => {
    if (onApplyToOrder) {
      onApplyToOrder({
        symbol: selectedSymbol,
        side,
        volume: recommendedLots.toString(),
        entryPrice: numEntry,
        stopLoss: numSl ? numSl.toFixed(decimals) : '',
        takeProfit: numTp ? numTp.toFixed(decimals) : '',
      });
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 15, 0.75)',
        backdropFilter: 'blur(6px)',
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
          borderRadius: '14px',
          width: '100%',
          maxWidth: '520px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🧮</span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Institutional Risk & Position Sizer
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Dynamic ATR stop-distance & institutional capital protection sizing
            </p>
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

        {/* Top Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>ACCOUNT BALANCE</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '3px' }}>
              ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '10px' }}>
            <div style={{ fontSize: '10px', color: 'var(--accent-red)', fontWeight: 700 }}>MAX RISK ({numRiskPct}%)</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 800, color: 'var(--accent-red)', marginTop: '3px' }}>
              -${riskAmount.toFixed(2)}
            </div>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '10px' }}>
            <div style={{ fontSize: '10px', color: 'var(--accent-green)', fontWeight: 700 }}>R:R RATIO</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 800, color: 'var(--accent-green)', marginTop: '3px' }}>
              1 : {riskRewardRatio}
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Symbol & Direction */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Asset
              </label>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: '4px',
                  background: 'var(--bg-card-hover)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                {PAIRS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Order Direction
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setSide('BUY')}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer',
                    border: side === 'BUY' ? '1px solid var(--accent-green)' : '1px solid var(--border)',
                    background: side === 'BUY' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                    color: side === 'BUY' ? 'var(--accent-green)' : 'var(--text-muted)',
                  }}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setSide('SELL')}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer',
                    border: side === 'SELL' ? '1px solid var(--accent-red)' : '1px solid var(--border)',
                    background: side === 'SELL' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                    color: side === 'SELL' ? 'var(--accent-red)' : 'var(--text-muted)',
                  }}
                >
                  SELL
                </button>
              </div>
            </div>
          </div>

          {/* Risk % Preset Buttons */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Account Risk Tolerance (%)
              </label>
              <span style={{ fontSize: '11px', color: 'var(--accent-blue)', fontWeight: 700 }}>
                ${riskAmount.toFixed(2)} at risk
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '4px' }}>
              {['0.5', '1.0', '1.5', '2.0'].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setRiskPercent(pct)}
                  style={{
                    padding: '6px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: riskPercent === pct ? '1px solid var(--accent-blue)' : '1px solid var(--border)',
                    background: riskPercent === pct ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.02)',
                    color: riskPercent === pct ? '#ffffff' : 'var(--text-secondary)',
                  }}
                >
                  {pct}% {pct === '1.0' ? '(Standard)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Entry, Stop Loss & Take Profit Price Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>ENTRY PRICE</label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: '4px',
                  background: 'var(--bg-card-hover)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '10px', color: 'var(--accent-red)', fontWeight: 700 }}>STOP LOSS (SL)</label>
              <input
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: '4px',
                  background: 'var(--bg-card-hover)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  color: 'var(--accent-red)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '10px', color: 'var(--accent-green)', fontWeight: 700 }}>TAKE PROFIT (TP)</label>
              <input
                type="number"
                step="any"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: '4px',
                  background: 'var(--bg-card-hover)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  color: 'var(--accent-green)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>

        {/* Calculated Results Banner */}
        <div
          style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase' }}>
                Recommended Position Size
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                {recommendedLots.toFixed(2)} <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>Lot(s)</span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>REQUIRED MARGIN</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                ${requiredMargin.toFixed(2)} <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({marginUsagePct}%)</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', fontSize: '12px' }}>
            <div style={{ color: 'var(--accent-red)' }}>
              Est. Max Loss: <b>-${estLoss.toFixed(2)}</b>
            </div>
            <div style={{ color: 'var(--accent-green)', textAlign: 'right' }}>
              Est. Profit: <b>+${estProfit.toFixed(2)}</b>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              padding: '10px 14px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              flex: 1,
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            style={{
              background: 'var(--accent-blue)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              flex: 2,
              boxShadow: '0 0 15px var(--accent-blue-glow)',
            }}
          >
            Apply to Order Ticket ({recommendedLots.toFixed(2)} Lots) →
          </button>
        </div>
      </div>
    </div>
  );
}

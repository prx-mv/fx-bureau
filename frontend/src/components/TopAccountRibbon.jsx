import React from 'react';

export default function TopAccountRibbon({
  balance = 50000,
  equity = 50210.45,
  unrealizedPnl = 210.45,
  unrealizedPnlPct = 0.42,
  winRate = 64.2,
}) {
  const isPnlPositive = unrealizedPnl >= 0;

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0 16px 0',
        borderBottom: '1px solid #1a1d24',
        marginBottom: '14px',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      {/* Left: Workstation Title & Engine Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h1
          style={{
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: '#ffffff',
            margin: 0,
            fontFamily: 'var(--font-display)',
          }}
        >
          Institutional Workstation
        </h1>
        <span
          style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: '#8b94a3',
            backgroundColor: '#161921',
            border: '1px solid #242b36',
            borderRadius: '4px',
            padding: '2px 8px',
            fontWeight: 600,
            letterSpacing: '0.4px',
          }}
        >
          LIVE CORE FED v2.4
        </span>
      </div>

      {/* Right: 4-Column Live Metric Ribbon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
        {/* Account Balance */}
        <div>
          <div
            style={{
              fontSize: '10px',
              color: '#6e7787',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
            }}
          >
            Account Balance
          </div>
          <div
            style={{
              fontSize: '15px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: '#ffffff',
              marginTop: '1px',
            }}
          >
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Net Equity */}
        <div>
          <div
            style={{
              fontSize: '10px',
              color: '#6e7787',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
            }}
          >
            Net Equity
          </div>
          <div
            style={{
              fontSize: '15px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: '#ffffff',
              marginTop: '1px',
            }}
          >
            ${equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Unrealized P&L */}
        <div>
          <div
            style={{
              fontSize: '10px',
              color: '#6e7787',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
            }}
          >
            Unrealized P&L
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '1px',
            }}
          >
            <span
              style={{
                fontSize: '15px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                color: isPnlPositive ? '#4f9d69' : '#c1554a',
              }}
            >
              {isPnlPositive ? '+' : ''}${unrealizedPnl.toFixed(2)}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                color: isPnlPositive ? '#4f9d69' : '#c1554a',
                background: isPnlPositive ? 'rgba(79, 157, 105, 0.14)' : 'rgba(193, 85, 74, 0.14)',
                padding: '1px 5px',
                borderRadius: '3px',
              }}
            >
              {isPnlPositive ? '+' : ''}{unrealizedPnlPct.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Win Rate */}
        <div>
          <div
            style={{
              fontSize: '10px',
              color: '#6e7787',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
            }}
          >
            Win Rate
          </div>
          <div
            style={{
              fontSize: '15px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: '#ffffff',
              marginTop: '1px',
            }}
          >
            {winRate}%
          </div>
        </div>
      </div>
    </header>
  );
}

import React from 'react';

const DEFAULT_SIGNALS = {
  'XAU/USD': 'BUY',
  'XAG/USD': 'SELL',
  'BTC/USD': 'BUY',
  'ETH/USD': 'HOLD',
  'EUR/USD': 'BUY',
  'GBP/USD': 'BUY',
  'USD/JPY': 'HOLD',
};

export default function TickerPillCarousel({
  pairs = ['XAU/USD', 'XAG/USD', 'BTC/USD', 'ETH/USD', 'EUR/USD'],
  prices = {},
  activeSymbol = 'XAU/USD',
  onSelectSymbol = () => {},
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '14px',
        userSelect: 'none',
      }}
    >
      {pairs.map((sym) => {
        const pData = prices[sym] || {};
        const priceVal = pData.price || (sym === 'XAU/USD' ? 4335.80 : sym === 'XAG/USD' ? 24.85 : sym === 'BTC/USD' ? 96420.00 : sym === 'ETH/USD' ? 3120.50 : 1.0850);
        const chgVal = pData.change24h !== undefined ? pData.change24h : (sym === 'XAU/USD' ? 1.25 : sym === 'XAG/USD' ? -0.45 : sym === 'BTC/USD' ? 3.40 : sym === 'ETH/USD' ? 1.15 : 0.12);
        const isUp = chgVal >= 0;
        const signal = DEFAULT_SIGNALS[sym] || (isUp ? 'BUY' : 'SELL');
        const isActive = activeSymbol === sym;

        const formatPrice = (val) => {
          if (sym.includes('BTC')) return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          if (sym.includes('ETH')) return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          if (sym.includes('XAU')) return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          if (sym.includes('XAG')) return `$${Number(val).toFixed(2)}`;
          if (sym.includes('JPY')) return Number(val).toFixed(2);
          return Number(val).toFixed(4);
        };

        return (
          <button
            key={sym}
            onClick={() => onSelectSymbol(sym)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              backgroundColor: isActive ? '#141720' : '#0d0f14',
              border: isActive ? '1px solid #cbb07a' : '1px solid #1a1d24',
              borderRadius: '6px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              boxShadow: isActive ? '0 0 10px rgba(203, 176, 122, 0.12)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.borderColor = '#2a303c';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.borderColor = '#1a1d24';
            }}
          >
            {/* Symbol */}
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#ffffff',
                fontFamily: 'var(--font-display)',
              }}
            >
              {sym}
            </span>

            {/* Price */}
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                color: '#d6dbe3',
              }}
            >
              {formatPrice(priceVal)}
            </span>

            {/* Change */}
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                color: isUp ? '#4f9d69' : '#c1554a',
              }}
            >
              {isUp ? '+' : ''}{chgVal.toFixed(2)}%
            </span>

            {/* Signal Badge */}
            <span
              style={{
                fontSize: '9px',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.4px',
                padding: '1px 5px',
                borderRadius: '3px',
                backgroundColor:
                  signal === 'BUY'
                    ? 'rgba(79, 157, 105, 0.18)'
                    : signal === 'SELL'
                    ? 'rgba(193, 85, 74, 0.18)'
                    : 'rgba(139, 148, 163, 0.18)',
                color:
                  signal === 'BUY'
                    ? '#4f9d69'
                    : signal === 'SELL'
                    ? '#c1554a'
                    : '#8b94a3',
              }}
            >
              {signal}
            </span>
          </button>
        );
      })}
    </div>
  );
}

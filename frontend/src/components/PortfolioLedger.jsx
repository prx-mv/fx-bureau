import React, { useState } from 'react';

export default function PortfolioLedger({
  balance = 50000,
  positions = [],
  closedTrades = [],
  prices = {},
  onClosePosition,
  onResetAccount,
  onSelectSymbol,
}) {
  const [activeTab, setActiveTab] = useState('positions'); // 'positions' | 'history'

  // Calculate live unrealized PnL for each position
  let totalUnrealizedPnl = 0;
  const positionsWithLivePnl = positions.map((pos) => {
    const curP = Number(prices[pos.symbol]?.price || pos.entryPrice);
    const isBuy = pos.side === 'BUY';
    let mult = 1;
    if (pos.symbol.includes('BTC') || pos.symbol.includes('ETH')) {
      mult = 1;
    } else if (pos.symbol.includes('XAU')) {
      mult = 100; // 100 oz per lot
    } else if (pos.symbol.includes('XAG')) {
      mult = 1000; // 1,000 oz per lot
    } else if (pos.symbol.includes('JPY')) {
      mult = 100000 / (curP || 155);
    } else {
      mult = 100000; // 100k units per lot
    }
    const diff = isBuy ? (curP - pos.entryPrice) : (pos.entryPrice - curP);
    const pnl = diff * pos.volume * mult;
    const pnlPct = (diff / pos.entryPrice) * 100.0 * (isBuy ? 1 : 1);

    totalUnrealizedPnl += pnl;

    return {
      ...pos,
      currentPrice: curP,
      unrealizedPnl: pnl,
      unrealizedPnlPct: pnlPct,
    };
  });

  const equity = balance + totalUnrealizedPnl;

  // Closed trades metrics
  const totalRealizedPnl = closedTrades.reduce((sum, t) => sum + (t.realizedPnl || 0), 0);
  const winningTrades = closedTrades.filter((t) => (t.realizedPnl || 0) > 0);
  const winRate = closedTrades.length > 0 ? ((winningTrades.length / closedTrades.length) * 100).toFixed(1) : '0.0';

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
      }}
    >
      {/* Portfolio Top Ribbon Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '14px 18px',
        }}
      >
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Account Equity
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
            ${equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Cash Balance
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Live Floating PnL
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '18px',
              fontWeight: 800,
              color: totalUnrealizedPnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
              marginTop: '2px',
            }}
          >
            {totalUnrealizedPnl >= 0 ? '+' : ''}${totalUnrealizedPnl.toFixed(2)}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Realized Profit
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '18px',
              fontWeight: 800,
              color: totalRealizedPnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
              marginTop: '2px',
            }}
          >
            {totalRealizedPnl >= 0 ? '+' : ''}${totalRealizedPnl.toFixed(2)}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Win Rate ({closedTrades.length} Trades)
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 800, color: 'var(--accent-blue)', marginTop: '2px' }}>
            {winRate}%
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <button
            onClick={onResetAccount}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text-muted)',
              fontSize: '11px',
              fontWeight: 600,
              padding: '6px 10px',
              cursor: 'pointer',
            }}
          >
            Reset $50K Demo
          </button>
        </div>
      </div>

      {/* Tabs: Open Positions vs Trade History */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('positions')}
            style={{
              background: activeTab === 'positions' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: activeTab === 'positions' ? 'var(--accent-blue)' : 'var(--text-secondary)',
              border: `1px solid ${activeTab === 'positions' ? 'var(--accent-blue)' : 'transparent'}`,
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Active Positions ({positions.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              background: activeTab === 'history' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: activeTab === 'history' ? 'var(--accent-blue)' : 'var(--text-secondary)',
              border: `1px solid ${activeTab === 'history' ? 'var(--accent-blue)' : 'transparent'}`,
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Trade History ({closedTrades.length})
          </button>
        </div>
      </div>

      {/* Table Content */}
      {activeTab === 'positions' ? (
        positionsWithLivePnl.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No open positions. Click <b>"Execute Simulated Order"</b> in the Market Intelligence panel to open a paper trade.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '8px 10px' }}>Symbol</th>
                  <th style={{ padding: '8px 10px' }}>Side</th>
                  <th style={{ padding: '8px 10px' }}>Size</th>
                  <th style={{ padding: '8px 10px' }}>Entry</th>
                  <th style={{ padding: '8px 10px' }}>Current</th>
                  <th style={{ padding: '8px 10px' }}>TP / SL</th>
                  <th style={{ padding: '8px 10px' }}>Unrealized PnL</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {positionsWithLivePnl.map((pos) => {
                  const isBuy = pos.side === 'BUY';
                  const isWinning = pos.unrealizedPnl >= 0;
                  const dec = pos.symbol.includes('JPY') ? 3 : pos.symbol.includes('BTC') || pos.symbol.includes('XAU') || pos.symbol.includes('XAG') ? 2 : 5;

                  return (
                    <tr key={pos.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '10px', fontWeight: 800 }}>
                        <span
                          onClick={() => onSelectSymbol && onSelectSymbol(pos.symbol)}
                          style={{ cursor: 'pointer', color: 'var(--text-primary)' }}
                        >
                          {pos.symbol}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span
                          style={{
                            background: isBuy ? 'var(--accent-green-bg)' : 'var(--accent-red-bg)',
                            color: isBuy ? 'var(--accent-green)' : 'var(--accent-red)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 800,
                            fontSize: '11px',
                          }}
                        >
                          {pos.side}
                        </span>
                      </td>
                      <td style={{ padding: '10px', fontFamily: 'var(--font-mono)' }}>{pos.volume}</td>
                      <td style={{ padding: '10px', fontFamily: 'var(--font-mono)' }}>{pos.entryPrice.toFixed(dec)}</td>
                      <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{pos.currentPrice.toFixed(dec)}</td>
                      <td style={{ padding: '10px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        <div>TP: {pos.takeProfit ? pos.takeProfit.toFixed(dec) : '—'}</div>
                        <div>SL: {pos.stopLoss ? pos.stopLoss.toFixed(dec) : '—'}</div>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: isWinning ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                          {isWinning ? '+' : ''}${pos.unrealizedPnl.toFixed(2)} ({isWinning ? '+' : ''}{pos.unrealizedPnlPct.toFixed(2)}%)
                        </div>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <button
                          onClick={() => onClosePosition(pos.id, pos.currentPrice)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            color: 'var(--accent-red)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Close
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        closedTrades.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No closed trades recorded yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '8px 10px' }}>Symbol</th>
                  <th style={{ padding: '8px 10px' }}>Side</th>
                  <th style={{ padding: '8px 10px' }}>Size</th>
                  <th style={{ padding: '8px 10px' }}>Entry</th>
                  <th style={{ padding: '8px 10px' }}>Exit</th>
                  <th style={{ padding: '8px 10px' }}>Realized PnL</th>
                  <th style={{ padding: '8px 10px' }}>AI Match</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Close Time</th>
                </tr>
              </thead>
              <tbody>
                {closedTrades.map((t) => {
                  const isWinning = (t.realizedPnl || 0) >= 0;
                  const dec = t.symbol.includes('JPY') ? 3 : t.symbol.includes('BTC') || t.symbol.includes('XAU') || t.symbol.includes('XAG') ? 2 : 5;

                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 800 }}>{t.symbol}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ color: t.side === 'BUY' ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 800 }}>
                          {t.side}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)' }}>{t.volume}</td>
                      <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)' }}>{t.entryPrice.toFixed(dec)}</td>
                      <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)' }}>{t.exitPrice.toFixed(dec)}</td>
                      <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: isWinning ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        {isWinning ? '+' : ''}${t.realizedPnl.toFixed(2)}
                      </td>
                      <td style={{ padding: '8px 10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {t.mlDirection ? `${t.mlDirection} (${t.mlConfidence}%)` : '—'}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '11px' }}>
                        {t.closeTime ? new Date(t.closeTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

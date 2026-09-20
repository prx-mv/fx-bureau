import React, { useState, useEffect } from 'react';
import { playBullishChime, playBearishChime, playOrderFilledChime, playAlertWarningChime } from '../utils/audioAlerts';

const PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'XAG/USD', 'BTC/USD', 'ETH/USD'];

export default function AlertCenterModal({
  isOpen,
  onClose,
  activeSymbol = 'XAU/USD',
  currentPrice = 0,
  alerts = [],
  alertHistory = [],
  onAddAlert,
  onDeleteAlert,
  onClearHistory,
  soundEnabled = true,
  onToggleSound,
}) {
  const [symbol, setSymbol] = useState(activeSymbol);
  const [alertType, setAlertType] = useState('PRICE_ABOVE'); // PRICE_ABOVE, PRICE_BELOW, ML_CONFIDENCE, ML_DIRECTION
  const [threshold, setThreshold] = useState('');
  const [directionTarget, setDirectionTarget] = useState('BULLISH');
  const [soundNotify, setSoundNotify] = useState(true);
  const [toastNotify, setToastNotify] = useState(true);
  const [webhookNotify, setWebhookNotify] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [testStatus, setTestStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'active' | 'history'

  useEffect(() => {
    if (isOpen) {
      setSymbol(activeSymbol);
      if (currentPrice) {
        const offset = currentPrice * 0.005;
        setThreshold((currentPrice + offset).toFixed(activeSymbol.includes('JPY') ? 3 : activeSymbol.includes('BTC') || activeSymbol.includes('XAU') ? 2 : 5));
      }
    }
  }, [isOpen, activeSymbol, currentPrice]);

  if (!isOpen) return null;

  const handleTestSoundAndWebhook = async () => {
    if (soundNotify) {
      playBullishChime();
    }
    if (webhookNotify && webhookUrl) {
      setTestStatus('Sending test ping...');
      try {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🔔 **Antigravity Alert Test**: Webhook connection verified successfully for ${symbol}!`,
            symbol: symbol,
            status: 'TEST_OK',
            timestamp: new Date().toISOString(),
          }),
        });
        if (res.ok || res.status === 204) {
          setTestStatus('Webhook delivered successfully! ✓');
        } else {
          setTestStatus(`Dispatched (status ${res.status})`);
        }
      } catch (err) {
        setTestStatus(`Error reaching webhook: ${err.message}`);
      }
      setTimeout(() => setTestStatus(null), 4000);
    } else {
      setTestStatus('Sound chime played! ✓');
      setTimeout(() => setTestStatus(null), 3000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!threshold && alertType !== 'ML_DIRECTION') return;

    const newAlert = {
      id: `alert_${Date.now()}`,
      symbol,
      alertType,
      threshold: parseFloat(threshold),
      directionTarget,
      soundNotify,
      toastNotify,
      webhookNotify,
      webhookUrl: webhookNotify ? webhookUrl : null,
      createdAt: Date.now(),
      status: 'ACTIVE',
    };

    onAddAlert(newAlert);
    if (soundNotify) playOrderFilledChime();
    setActiveTab('active');
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
          maxWidth: '560px',
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
              <span style={{ fontSize: '20px' }}>🔔</span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Market Alert & Webhook Center
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Institutional real-time price limits, ML confidence triggers & webhooks
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onToggleSound}
              title={soundEnabled ? 'Mute Alert Audio' : 'Unmute Alert Audio'}
              style={{
                background: soundEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${soundEnabled ? 'var(--accent-green)' : 'var(--accent-red)'}`,
                color: soundEnabled ? 'var(--accent-green)' : 'var(--accent-red)',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {soundEnabled ? '🔊 Sound ON' : '🔇 Muted'}
            </button>
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
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '4px' }}>
          {[
            { id: 'create', label: '+ Create Alert' },
            { id: 'active', label: `Active (${alerts.length})` },
            { id: 'history', label: `History (${alertHistory.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === t.id ? '2px solid var(--accent-blue)' : '2px solid transparent',
                color: activeTab === t.id ? '#ffffff' : 'var(--text-muted)',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Create Alert */}
        {activeTab === 'create' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Symbol & Condition Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Asset Symbol
                </label>
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
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
                  Trigger Condition
                </label>
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: '4px',
                    background: 'var(--bg-card-hover)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  <option value="PRICE_ABOVE">Price Crosses Above (&gt;)</option>
                  <option value="PRICE_BELOW">Price Crosses Below (&lt;)</option>
                  <option value="ML_CONFIDENCE">ML Confidence Exceeds (≥ %)</option>
                  <option value="ML_DIRECTION">ML Direction Flips To</option>
                </select>
              </div>
            </div>

            {/* Threshold Input */}
            {alertType === 'ML_DIRECTION' ? (
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Target ML Direction
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                  {['BULLISH', 'BEARISH'].map((dir) => (
                    <button
                      key={dir}
                      type="button"
                      onClick={() => setDirectionTarget(dir)}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        fontWeight: 800,
                        fontSize: '12px',
                        cursor: 'pointer',
                        border: directionTarget === dir ? `1px solid ${dir === 'BULLISH' ? 'var(--accent-green)' : 'var(--accent-red)'}` : '1px solid var(--border)',
                        background: directionTarget === dir ? (dir === 'BULLISH' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)') : 'transparent',
                        color: dir === 'BULLISH' ? 'var(--accent-green)' : 'var(--accent-red)',
                      }}
                    >
                      {dir === 'BULLISH' ? '▲ BULLISH' : '▼ BEARISH'}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  {alertType === 'ML_CONFIDENCE' ? 'Confidence Threshold (%)' : 'Trigger Price Level'}
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder={alertType === 'ML_CONFIDENCE' ? 'e.g. 75' : 'e.g. 4350.00'}
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: '4px',
                    background: 'var(--bg-card-hover)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '14px',
                    fontWeight: 700,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            {/* Notification Channels */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Delivery Channels
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-primary)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={soundNotify} onChange={(e) => setSoundNotify(e.target.checked)} />
                  <span>🔊 Web Audio Chime</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={toastNotify} onChange={(e) => setToastNotify(e.target.checked)} />
                  <span>💬 In-App Toast Banner</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={webhookNotify} onChange={(e) => setWebhookNotify(e.target.checked)} />
                  <span>🌐 Webhook (Discord / Telegram)</span>
                </label>
              </div>

              {webhookNotify && (
                <div style={{ marginTop: '6px' }}>
                  <input
                    type="url"
                    placeholder="https://discord.com/api/webhooks/... or custom URL"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '11px',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>
                    JSON payload will be sent via HTTP POST with symbol, trigger price, and timestamp.
                  </div>
                </div>
              )}
            </div>

            {testStatus && (
              <div style={{ fontSize: '11px', color: 'var(--accent-blue)', background: 'rgba(59, 130, 246, 0.1)', padding: '6px 10px', borderRadius: '6px' }}>
                {testStatus}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={handleTestSoundAndWebhook}
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
                Test Sound & Webhook
              </button>

              <button
                type="submit"
                style={{
                  background: 'var(--accent-blue)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  flex: 1.5,
                  boxShadow: '0 0 15px var(--accent-blue-glow)',
                }}
              >
                + Set Real-Time Alert
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Active Alerts */}
        {activeTab === 'active' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '200px' }}>
            {alerts.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: '13px' }}>
                No active alerts running. Set one above to get real-time price & ML notifications.
              </div>
            ) : (
              alerts.map((al) => (
                <div
                  key={al.id}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)' }}>
                        {al.symbol}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: al.alertType.includes('ABOVE') || al.directionTarget === 'BULLISH'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                          color: al.alertType.includes('ABOVE') || al.directionTarget === 'BULLISH'
                            ? 'var(--accent-green)'
                            : 'var(--accent-red)',
                        }}
                      >
                        {al.alertType === 'PRICE_ABOVE' && `> ${al.threshold}`}
                        {al.alertType === 'PRICE_BELOW' && `< ${al.threshold}`}
                        {al.alertType === 'ML_CONFIDENCE' && `Conf ≥ ${al.threshold}%`}
                        {al.alertType === 'ML_DIRECTION' && `Flips to ${al.directionTarget}`}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Created {new Date(al.createdAt).toLocaleTimeString()} ·
                      {al.soundNotify && ' 🔊 Sound'}
                      {al.toastNotify && ' 💬 Toast'}
                      {al.webhookNotify && ' 🌐 Webhook'}
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteAlert(al.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: 'var(--accent-red)',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: History */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              {alertHistory.length > 0 && (
                <button
                  onClick={onClearHistory}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '11px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Clear History
                </button>
              )}
            </div>

            {alertHistory.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: '13px' }}>
                No triggered alerts in history yet.
              </div>
            ) : (
              alertHistory.map((h, i) => (
                <div
                  key={h.id || i}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {h.symbol} · {h.triggerReason}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Triggered at: <b style={{ fontFamily: 'var(--font-mono)' }}>{h.triggerPrice}</b> · {new Date(h.triggeredAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-green)', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 6px', borderRadius: '4px' }}>
                    FIRED ✓
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

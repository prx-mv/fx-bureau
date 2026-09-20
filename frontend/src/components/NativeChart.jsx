import React, { useState, useEffect, useMemo, useRef } from 'react';

export default function NativeChart({ symbol = 'EUR/USD', currentPrice = 1.0842, height = 490 }) {
  const [candles, setCandles] = useState([]);
  const [hoverData, setHoverData] = useState(null);
  const [selectedTool, setSelectedTool] = useState('cursor'); // 'cursor' | 'trendline' | 'horizontal' | 'fibonacci' | 'risk_reward' | 'text'
  const [drawings, setDrawings] = useState([]);
  const [drawingPending, setDrawingPending] = useState(null); // First anchor point for 2-click tools
  const [learningTip, setLearningTip] = useState(null);
  const svgRef = useRef(null);

  // Generate initial historical bars for the symbol
  useEffect(() => {
    const base = Number(currentPrice) || 100;
    const vol = base * (symbol.includes('BTC') ? 0.003 : symbol.includes('XAU') || symbol.includes('XAG') ? 0.002 : symbol.includes('JPY') ? 0.001 : 0.0006);
    const bars = [];
    let p = base * 0.985;
    const now = Date.now();

    for (let i = 50; i >= 0; i--) {
      const delta = (Math.random() - 0.48) * vol;
      const open = p;
      const close = Math.max(0.001, open + delta);
      const high = Math.max(open, close) + Math.random() * vol * 0.8;
      const low = Math.min(open, close) - Math.random() * vol * 0.8;
      const volume = Math.floor(Math.random() * 5000 + 1000);
      bars.push({
        time: new Date(now - i * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        open,
        high,
        low,
        close,
        volume,
      });
      p = close;
    }
    setCandles(bars);
  }, [symbol]);

  // Update last candle with current live price
  useEffect(() => {
    if (!currentPrice || candles.length === 0) return;
    const p = Number(currentPrice);
    if (isNaN(p) || p <= 0) return;

    setCandles((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const last = { ...next[next.length - 1] };
      last.close = p;
      last.high = Math.max(last.high, p);
      last.low = Math.min(last.low, p);
      next[next.length - 1] = last;
      return next;
    });
  }, [currentPrice]);

  // Calculate chart geometry
  const chartWidth = 900;
  const chartHeight = height - 90;
  const padding = { top: 25, right: 75, bottom: 35, left: 10 };

  const { minPrice, maxPrice, maLine, coords } = useMemo(() => {
    if (candles.length === 0) return { minPrice: 0, maxPrice: 1, maLine: '', coords: [] };

    let min = Infinity;
    let max = -Infinity;

    candles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    });

    const range = (max - min) || 1;
    const paddedMin = min - range * 0.06;
    const paddedMax = max + range * 0.06;
    const paddedRange = paddedMax - paddedMin;

    const plotWidth = chartWidth - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;
    const barWidth = plotWidth / candles.length;

    // Moving average (10)
    const maPoints = [];
    for (let i = 0; i < candles.length; i++) {
      if (i >= 9) {
        const slice = candles.slice(i - 9, i + 1);
        const avg = slice.reduce((sum, b) => sum + b.close, 0) / slice.length;
        const x = padding.left + i * barWidth + barWidth / 2;
        const y = padding.top + plotHeight - ((avg - paddedMin) / paddedRange) * plotHeight;
        maPoints.push(`${x},${y}`);
      }
    }

    const calculatedCoords = candles.map((c, i) => {
      const x = padding.left + i * barWidth;
      const openY = padding.top + plotHeight - ((c.open - paddedMin) / paddedRange) * plotHeight;
      const closeY = padding.top + plotHeight - ((c.close - paddedMin) / paddedRange) * plotHeight;
      const highY = padding.top + plotHeight - ((c.high - paddedMin) / paddedRange) * plotHeight;
      const lowY = padding.top + plotHeight - ((c.low - paddedMin) / paddedRange) * plotHeight;
      const isUp = c.close >= c.open;

      return {
        ...c,
        x,
        barWidth: Math.max(3, barWidth * 0.65),
        openY,
        closeY,
        highY,
        lowY,
        isUp,
      };
    });

    return {
      minPrice: paddedMin,
      maxPrice: paddedMax,
      maLine: maPoints.join(' '),
      coords: calculatedCoords,
    };
  }, [candles, chartHeight]);

  const decimals = symbol.includes('JPY') ? 3 : symbol.includes('BTC') || symbol.includes('XAU') || symbol.includes('XAG') ? 2 : 5;

  // Helper: map client click to SVG coordinates and price
  const getSvgCoordinates = (e) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    const x = ((clientX - rect.left) / rect.width) * chartWidth;
    const y = ((clientY - rect.top) / rect.height) * chartHeight;

    const plotHeight = chartHeight - padding.top - padding.bottom;
    const priceVal = maxPrice - ((y - padding.top) / plotHeight) * (maxPrice - minPrice);

    return { x, y, price: priceVal };
  };

  // Click handler on SVG canvas for interactive drawing
  const handleSvgClick = (e) => {
    if (selectedTool === 'cursor') return;

    const pt = getSvgCoordinates(e);
    if (!pt) return;

    if (selectedTool === 'horizontal') {
      const isResistance = pt.price > (Number(currentPrice) || minPrice + (maxPrice - minPrice) * 0.5);
      const newD = {
        id: `h_${Date.now()}`,
        type: 'horizontal',
        y: pt.y,
        price: pt.price,
        label: isResistance ? `Resistance: ${pt.price.toFixed(decimals)}` : `Support: ${pt.price.toFixed(decimals)}`,
        color: isResistance ? '#ef4444' : '#10b981',
      };
      setDrawings((d) => [...d, newD]);
      setLearningTip('Horizontal level drawn! Resistance acts as a price ceiling, and Support acts as a price floor.');
      setSelectedTool('cursor');
    } else if (selectedTool === 'trendline') {
      if (!drawingPending) {
        setDrawingPending(pt);
        setLearningTip('Click 2nd point to anchor the Trendline.');
      } else {
        const newD = {
          id: `tl_${Date.now()}`,
          type: 'trendline',
          x1: drawingPending.x,
          y1: drawingPending.y,
          x2: pt.x,
          y2: pt.y,
          price1: drawingPending.price,
          price2: pt.price,
          color: '#3b82f6',
        };
        setDrawings((d) => [...d, newD]);
        setDrawingPending(null);
        setLearningTip('Trendline connected! Upward sloped lines identify dynamic support in bull trends.');
        setSelectedTool('cursor');
      }
    } else if (selectedTool === 'fibonacci') {
      if (!drawingPending) {
        setDrawingPending(pt);
        setLearningTip('Click 2nd point (Swing Low/High) to calculate Fibonacci Retracement levels.');
      } else {
        const highY = Math.min(drawingPending.y, pt.y);
        const lowY = Math.max(drawingPending.y, pt.y);
        const highPrice = Math.max(drawingPending.price, pt.price);
        const lowPrice = Math.min(drawingPending.price, pt.price);

        const newD = {
          id: `fib_${Date.now()}`,
          type: 'fibonacci',
          highY,
          lowY,
          highPrice,
          lowPrice,
        };
        setDrawings((d) => [...d, newD]);
        setDrawingPending(null);
        setLearningTip('Fibonacci levels plotted! The 61.8% Golden Ratio and 50.0% Equilibrium are key reversal zones.');
        setSelectedTool('cursor');
      }
    } else if (selectedTool === 'risk_reward') {
      const entryPrice = pt.price;
      const spread = (maxPrice - minPrice) * 0.08;
      const tpPrice = entryPrice + spread * 2.0;
      const slPrice = entryPrice - spread;

      const plotHeight = chartHeight - padding.top - padding.bottom;
      const entryY = pt.y;
      const tpY = padding.top + plotHeight - ((tpPrice - minPrice) / (maxPrice - minPrice)) * plotHeight;
      const slY = padding.top + plotHeight - ((slPrice - minPrice) / (maxPrice - minPrice)) * plotHeight;

      const newD = {
        id: `rr_${Date.now()}`,
        type: 'risk_reward',
        x: pt.x,
        entryY,
        tpY,
        slY,
        entryPrice,
        tpPrice,
        slPrice,
        rrRatio: '2.0',
      };
      setDrawings((d) => [...d, newD]);
      setLearningTip('Risk/Reward box placed! 1:2.0 Ratio means you stand to gain $2 for every $1 risked.');
      setSelectedTool('cursor');
    } else if (selectedTool === 'text') {
      const labels = ['Breakout Zone', 'Double Bottom', 'Liquidity Pool', 'Demand Zone', 'Fair Value Gap'];
      const chosen = labels[drawings.length % labels.length];
      const newD = {
        id: `txt_${Date.now()}`,
        type: 'text',
        x: pt.x,
        y: pt.y,
        text: chosen,
      };
      setDrawings((d) => [...d, newD]);
      setLearningTip(`Annotation added: "${chosen}"`);
      setSelectedTool('cursor');
    }
  };

  // Educational Auto-Detect Support & Resistance
  const handleAutoSupportResistance = () => {
    if (candles.length === 0) return;

    let highest = -Infinity;
    let lowest = Infinity;
    candles.forEach((c) => {
      if (c.high > highest) highest = c.high;
      if (c.low < lowest) lowest = c.low;
    });

    const mid = (highest + lowest) / 2;
    const plotHeight = chartHeight - padding.top - padding.bottom;

    const resY = padding.top + plotHeight - ((highest - minPrice) / (maxPrice - minPrice)) * plotHeight;
    const midY = padding.top + plotHeight - ((mid - minPrice) / (maxPrice - minPrice)) * plotHeight;
    const supY = padding.top + plotHeight - ((lowest - minPrice) / (maxPrice - minPrice)) * plotHeight;

    const autoDrawings = [
      { id: 'auto_res', type: 'horizontal', y: resY, price: highest, label: `Major Resistance: ${highest.toFixed(decimals)}`, color: '#ef4444' },
      { id: 'auto_mid', type: 'horizontal', y: midY, price: mid, label: `Pivot Equilibrium: ${mid.toFixed(decimals)}`, color: '#3b82f6' },
      { id: 'auto_sup', type: 'horizontal', y: supY, price: lowest, label: `Major Support: ${lowest.toFixed(decimals)}`, color: '#10b981' },
    ];

    setDrawings((prev) => [...prev.filter((d) => !d.id.startsWith('auto_')), ...autoDrawings]);
    setLearningTip('Auto Support & Resistance mapped! Red = 24h Ceiling (Sell Zone), Green = 24h Floor (Buy Zone).');
  };

  const handleUndo = () => {
    setDrawings((d) => d.slice(0, -1));
    setDrawingPending(null);
  };

  const handleClearAll = () => {
    setDrawings([]);
    setDrawingPending(null);
    setLearningTip('Cleared all drawings.');
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: '10px',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        position: 'relative',
        height: `${height}px`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Header Bar: Symbol & Live Metric */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(255,255,255,0.01)',
          fontSize: '12px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '13px' }}>{symbol}</span>
          <span style={{ color: 'var(--text-muted)' }}>1M Candles</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#06b6d4', fontSize: '11px' }}>
            <span style={{ width: '8px', height: '2px', background: '#06b6d4', display: 'inline-block' }}></span>
            EMA 10
          </span>
        </div>

        {hoverData ? (
          <div style={{ display: 'flex', gap: '10px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            <span>O: <b style={{ color: 'var(--text-primary)' }}>{hoverData.open.toFixed(decimals)}</b></span>
            <span>H: <b style={{ color: 'var(--accent-green)' }}>{hoverData.high.toFixed(decimals)}</b></span>
            <span>L: <b style={{ color: 'var(--accent-red)' }}>{hoverData.low.toFixed(decimals)}</b></span>
            <span>C: <b style={{ color: hoverData.isUp ? 'var(--accent-green)' : 'var(--accent-red)' }}>{hoverData.close.toFixed(decimals)}</b></span>
          </div>
        ) : (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
            Live: <b style={{ color: 'var(--text-primary)' }}>{Number(currentPrice || 0).toFixed(decimals)}</b>
          </div>
        )}
      </div>

      {/* Interactive Drawing & Technical Learning Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid var(--border)',
          gap: '6px',
          flexWrap: 'wrap',
        }}
      >
        {/* Drawing Tools Group */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {[
            { id: 'cursor', label: '🖱️ Inspect', title: 'Hover & inspect candle coordinates' },
            { id: 'horizontal', label: '➖ Level (S/R)', title: 'Click to draw Support / Resistance horizontal line' },
            { id: 'trendline', label: '📏 Trendline', title: 'Click 2 points to draw an angled trendline' },
            { id: 'fibonacci', label: '🌀 Fibonacci', title: 'Click Swing High and Swing Low for Golden Ratio levels' },
            { id: 'risk_reward', label: '🎯 Risk/Reward', title: 'Click to drop a Long/Short profit-loss target box' },
            { id: 'text', label: '📝 Note', title: 'Click to place a pattern label (Breakout, Demand Zone)' },
          ].map((t) => {
            const isActive = selectedTool === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelectedTool(t.id);
                  setDrawingPending(null);
                  if (t.id === 'horizontal') setLearningTip('Click anywhere on the chart to place a Support/Resistance level.');
                  else if (t.id === 'trendline') setLearningTip('Click the 1st candle swing point for your Trendline.');
                  else if (t.id === 'fibonacci') setLearningTip('Click Swing High, then click Swing Low to compute Fibonacci retracements.');
                  else if (t.id === 'risk_reward') setLearningTip('Click where you want to plan your trade entry.');
                  else if (t.id === 'text') setLearningTip('Click on the chart to place a technical pattern annotation.');
                  else setLearningTip(null);
                }}
                title={t.title}
                style={{
                  background: isActive ? 'var(--accent-blue)' : 'rgba(255,255,255,0.03)',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  border: `1px solid ${isActive ? 'var(--accent-blue)' : 'var(--border)'}`,
                  borderRadius: '5px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Learning Automation & Clean-up Actions */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleAutoSupportResistance}
            title="Automatically compute 24h Peak Resistance, Mid-Pivot, and Support"
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              color: 'var(--accent-green)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '5px',
              padding: '3px 9px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🎓 Auto S/R
          </button>

          {drawings.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleUndo}
                title="Undo last drawn object"
                style={{
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  borderRadius: '5px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                ↶ Undo
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                title="Remove all drawings"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--accent-red)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '5px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                🗑️ Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Educational Active Guide Tip Banner */}
      {learningTip && (
        <div
          style={{
            background: 'rgba(59, 130, 246, 0.12)',
            borderBottom: '1px solid rgba(59, 130, 246, 0.25)',
            padding: '4px 14px',
            fontSize: '11px',
            color: '#60a5fa',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>💡 <b>Educational Guide:</b> {learningTip}</span>
          <button
            onClick={() => setLearningTip(null)}
            style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '12px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* SVG Canvas with Interactive Drawing Engine */}
      <div style={{ flex: 1, position: 'relative' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            cursor: selectedTool === 'cursor' ? 'default' : 'crosshair',
          }}
          onClick={handleSvgClick}
          onMouseLeave={() => setHoverData(null)}
        >
          {/* Horizontal Gridlines & Price Scale */}
          {[0.2, 0.4, 0.6, 0.8].map((pct) => {
            const y = padding.top + (chartHeight - padding.top - padding.bottom) * pct;
            const priceVal = maxPrice - (maxPrice - minPrice) * pct;
            return (
              <g key={pct}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.05)"
                  strokeDasharray="4 4"
                />
                <text
                  x={chartWidth - padding.right + 8}
                  y={y + 4}
                  fill="var(--text-muted)"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                >
                  {priceVal.toFixed(decimals)}
                </text>
              </g>
            );
          })}

          {/* User Drawings: Fibonacci Bands */}
          {drawings.filter((d) => d.type === 'fibonacci').map((fib) => {
            const dy = fib.lowY - fib.highY;
            const levels = [
              { pct: 0.0, label: '0.0% High', color: '#3b82f6' },
              { pct: 0.236, label: '23.6%', color: '#60a5fa' },
              { pct: 0.382, label: '38.2%', color: '#10b981' },
              { pct: 0.500, label: '50.0% Equilibrium', color: '#f59e0b' },
              { pct: 0.618, label: '61.8% Golden Ratio', color: '#ec4899' },
              { pct: 1.0, label: '100.0% Low', color: '#ef4444' },
            ];

            return (
              <g key={fib.id}>
                {levels.map((lvl, idx) => {
                  const y = fib.highY + dy * lvl.pct;
                  const price = fib.highPrice - (fib.highPrice - fib.lowPrice) * lvl.pct;
                  return (
                    <g key={idx}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={chartWidth - padding.right}
                        y2={y}
                        stroke={lvl.color}
                        strokeWidth="1.2"
                        strokeDasharray={lvl.pct === 0.618 || lvl.pct === 0.5 ? 'none' : '3 3'}
                        opacity="0.85"
                      />
                      <rect
                        x={padding.left + 8}
                        y={y - 8}
                        width="135"
                        height="14"
                        rx="3"
                        fill="rgba(15, 23, 42, 0.85)"
                      />
                      <text
                        x={padding.left + 12}
                        y={y + 2.5}
                        fill={lvl.color}
                        fontSize="9"
                        fontWeight="700"
                        fontFamily="var(--font-mono)"
                      >
                        {lvl.label} ({price.toFixed(decimals)})
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* User Drawings: Risk/Reward Box */}
          {drawings.filter((d) => d.type === 'risk_reward').map((rr) => {
            const boxWidth = 140;
            const x = Math.min(chartWidth - padding.right - boxWidth - 10, Math.max(padding.left + 10, rr.x - boxWidth / 2));
            const tpHeight = Math.max(4, Math.abs(rr.entryY - rr.tpY));
            const slHeight = Math.max(4, Math.abs(rr.slY - rr.entryY));

            return (
              <g key={rr.id}>
                {/* Take Profit (Green Box) */}
                <rect
                  x={x}
                  y={rr.tpY}
                  width={boxWidth}
                  height={tpHeight}
                  fill="rgba(16, 185, 129, 0.18)"
                  stroke="#10b981"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text x={x + 6} y={rr.tpY + 12} fill="#10b981" fontSize="9" fontWeight="700">
                  TP Target: {rr.tpPrice.toFixed(decimals)}
                </text>

                {/* Stop Loss (Red Box) */}
                <rect
                  x={x}
                  y={rr.entryY}
                  width={boxWidth}
                  height={slHeight}
                  fill="rgba(239, 68, 68, 0.18)"
                  stroke="#ef4444"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text x={x + 6} y={rr.slY - 4} fill="#ef4444" fontSize="9" fontWeight="700">
                  SL Stop: {rr.slPrice.toFixed(decimals)}
                </text>

                {/* Entry Center Line & Ratio Badge */}
                <line x1={x} y1={rr.entryY} x2={x + boxWidth} y2={rr.entryY} stroke="#ffffff" strokeWidth="1.5" />
                <rect x={x + boxWidth - 62} y={rr.entryY - 8} width="60" height="16" rx="3" fill="#1e293b" stroke="var(--border)" />
                <text x={x + boxWidth - 58} y={rr.entryY + 3.5} fill="#ffffff" fontSize="9" fontWeight="800">
                  R:R 1 : {rr.rrRatio}
                </text>
              </g>
            );
          })}

          {/* User Drawings: Trendlines */}
          {drawings.filter((d) => d.type === 'trendline').map((tl) => (
            <g key={tl.id}>
              <line
                x1={tl.x1}
                y1={tl.y1}
                x2={tl.x2}
                y2={tl.y2}
                stroke={tl.color}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx={tl.x1} cy={tl.y1} r="3.5" fill={tl.color} />
              <circle cx={tl.x2} cy={tl.y2} r="3.5" fill={tl.color} />
            </g>
          ))}

          {/* Pending anchor point for 2-click tools */}
          {drawingPending && (
            <g>
              <circle cx={drawingPending.x} cy={drawingPending.y} r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx={drawingPending.x} cy={drawingPending.y} r="12" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 3" />
            </g>
          )}

          {/* Candlestick Wicks & Bodies */}
          {coords.map((c, i) => {
            const color = c.isUp ? 'var(--accent-green)' : 'var(--accent-red)';
            const topY = Math.min(c.openY, c.closeY);
            const bodyHeight = Math.max(2, Math.abs(c.closeY - c.openY));

            return (
              <g
                key={i}
                onMouseEnter={() => setHoverData(c)}
                style={{ cursor: selectedTool === 'cursor' ? 'crosshair' : 'crosshair' }}
              >
                {/* Wick */}
                <line
                  x1={c.x + c.barWidth / 2}
                  y1={c.highY}
                  x2={c.x + c.barWidth / 2}
                  y2={c.lowY}
                  stroke={color}
                  strokeWidth="1.2"
                />
                {/* Body */}
                <rect
                  x={c.x}
                  y={topY}
                  width={c.barWidth}
                  height={bodyHeight}
                  fill={color}
                  rx="1"
                />
              </g>
            );
          })}

          {/* EMA 10 Line */}
          {maLine && (
            <polyline
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1.5"
              points={maLine}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />
          )}

          {/* User Drawings: Horizontal Levels with price tags */}
          {drawings.filter((d) => d.type === 'horizontal').map((hl) => (
            <g key={hl.id}>
              <line
                x1={padding.left}
                y1={hl.y}
                x2={chartWidth - padding.right}
                y2={hl.y}
                stroke={hl.color}
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <rect
                x={padding.left + 10}
                y={hl.y - 14}
                width="130"
                height="13"
                rx="3"
                fill="rgba(15, 23, 42, 0.9)"
                stroke={hl.color}
                strokeWidth="0.5"
              />
              <text
                x={padding.left + 14}
                y={hl.y - 4}
                fill={hl.color}
                fontSize="9"
                fontWeight="700"
                fontFamily="var(--font-mono)"
              >
                {hl.label}
              </text>
            </g>
          ))}

          {/* User Drawings: Text Annotations */}
          {drawings.filter((d) => d.type === 'text').map((txt) => (
            <g key={txt.id}>
              <rect
                x={txt.x - 4}
                y={txt.y - 14}
                width={txt.text.length * 7 + 10}
                height="18"
                rx="4"
                fill="rgba(30, 41, 59, 0.9)"
                stroke="#3b82f6"
                strokeWidth="1"
              />
              <text
                x={txt.x + 2}
                y={txt.y - 1}
                fill="#ffffff"
                fontSize="10"
                fontWeight="700"
              >
                🏷️ {txt.text}
              </text>
            </g>
          ))}

          {/* Current Live Price Line */}
          {coords.length > 0 && (
            <g>
              <line
                x1={padding.left}
                y1={coords[coords.length - 1].closeY}
                x2={chartWidth - padding.right}
                y2={coords[coords.length - 1].closeY}
                stroke={coords[coords.length - 1].isUp ? 'var(--accent-green)' : 'var(--accent-red)'}
                strokeDasharray="2 2"
                opacity="0.6"
              />
              <rect
                x={chartWidth - padding.right + 4}
                y={coords[coords.length - 1].closeY - 9}
                width={padding.right - 8}
                height="18"
                rx="3"
                fill={coords[coords.length - 1].isUp ? 'var(--accent-green)' : 'var(--accent-red)'}
              />
              <text
                x={chartWidth - padding.right + 8}
                y={coords[coords.length - 1].closeY + 3.5}
                fill="#ffffff"
                fontSize="10"
                fontWeight="700"
                fontFamily="var(--font-mono)"
              >
                {coords[coords.length - 1].close.toFixed(decimals)}
              </text>
            </g>
          )}

          {/* Time scale labels at bottom */}
          {coords.filter((_, idx) => idx % 10 === 0).map((c, idx) => (
            <text
              key={idx}
              x={c.x}
              y={chartHeight - 10}
              fill="var(--text-muted)"
              fontSize="10"
              fontFamily="var(--font-mono)"
            >
              {c.time}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

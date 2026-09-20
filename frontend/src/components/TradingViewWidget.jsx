import React, { useEffect, useRef, useState, memo } from 'react';
import NativeChart from './NativeChart';

function TradingViewWidget({ symbol = 'FX:EURUSD', rawSymbol = 'EUR/USD', currentPrice = 1.0842, height = 490 }) {
  const containerRef = useRef(null);
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setLoadError(false);
    setIsLoading(true);

    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    // Create the required inner container div with the official class
    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    containerRef.current.appendChild(widgetDiv);

    // Create and configure the official TradingView script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: '60',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: true,
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      withdateranges: true,
      save_image: true,
      calendar: false,
      support_host: 'https://www.tradingview.com',
    });

    script.onerror = () => {
      console.warn('TradingView script blocked by browser or network.');
      setLoadError(true);
      setIsLoading(false);
    };

    containerRef.current.appendChild(script);

    // Guard against iframe autofocus scrolling parent away from top
    const resetScroll = () => {
      const mainEl = containerRef.current?.closest('main');
      if (mainEl && mainEl.scrollTop > 30) {
        mainEl.scrollTop = 0;
      }
    };

    const t1 = setTimeout(resetScroll, 200);
    const t2 = setTimeout(resetScroll, 800);
    const t3 = setTimeout(resetScroll, 1800);

    const checkTimer = setTimeout(() => {
      if (containerRef.current) {
        const iframe = containerRef.current.querySelector('iframe');
        if (!iframe) {
          console.info('TradingView iframe not detected after timeout, enabling fallback.');
          setLoadError(true);
        } else {
          resetScroll();
        }
      }
      setIsLoading(false);
    }, 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(checkTimer);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol]);

  if (loadError) {
    return (
      <div>
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '8px',
            padding: '8px 14px',
            marginBottom: '10px',
            fontSize: '12px',
            color: 'var(--accent-yellow)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>
            ⚡ External TradingView CDN script blocked or slow. Showing live Quant Chart.
          </span>
          <button
            onClick={() => setLoadError(false)}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              color: 'var(--text-primary)',
              padding: '3px 8px',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            Retry TradingView
          </button>
        </div>
        <NativeChart symbol={rawSymbol} currentPrice={currentPrice} height={height} />
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: '6px',
        overflow: 'hidden',
        border: '1px solid #1a1d24',
        background: '#090b0e',
        height: `${height}px`,
        width: '100%',
        position: 'relative',
      }}
    >
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0d0f14',
            zIndex: 1,
            fontSize: '13px',
            color: '#8b94a3',
            gap: '8px',
          }}
        >
          <div className="pulse-dot" style={{ backgroundColor: '#cbb07a' }} />
          Loading TradingView Pro Institutional Feed...
        </div>
      )}
      <div
        className="tradingview-widget-container"
        ref={containerRef}
        style={{ width: '100%', height: `${height}px` }}
      />
    </div>
  );
}

export default memo(TradingViewWidget);

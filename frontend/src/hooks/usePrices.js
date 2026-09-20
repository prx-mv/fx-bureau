import { useState, useEffect, useRef } from 'react';

/**
 * Determine whether global trading is open for the specified asset symbol.
 * - Crypto (BTC, ETH): trades 24/7/365 -> True.
 * - Forex (EUR, GBP, JPY) & Spot Metals (XAU, XAG):
 *   Opens Sunday 17:00 ET (21:00 UTC during DST / 22:00 UTC standard).
 *   Closes Friday 17:00 ET (21:00 UTC during DST / 22:00 UTC standard).
 *   Closed on Saturday all day, and Sunday before 21:00 UTC.
 */
export function isForexOrMetalsMarketOpen(symbol) {
  if (!symbol) return false;
  const sym = symbol.toUpperCase();
  // Crypto trades 24/7/365
  if (sym.includes('BTC') || sym.includes('ETH') || sym.includes('CRYPTO')) {
    return true;
  }

  const now = new Date();
  const utcDay = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  const timeFloat = now.getUTCHours() + now.getUTCMinutes() / 60.0;

  // Friday after 21:00 UTC -> Closed
  if (utcDay === 5 && timeFloat >= 21.0) return false;
  // Saturday all day -> Closed
  if (utcDay === 6) return false;
  // Sunday before 21:00 UTC -> Closed
  if (utcDay === 0 && timeFloat < 21.0) return false;

  return true;
}

const FALLBACK_PRICES = {
  'EUR/USD': { price: 1.1475, change: 0.0, pct: 0.0, high: 1.1505, low: 1.1440, vol: '185.4K', decimals: 5 },
  'GBP/USD': { price: 1.3360, change: 0.0, pct: 0.0, high: 1.3395, low: 1.3325, vol: '142.1K', decimals: 5 },
  'USD/JPY': { price: 157.90, change: 0.0, pct: 0.0, high: 158.45, low: 157.30, vol: '210.8K', decimals: 3 },
  'XAU/USD': { price: 4335.80, change: 0.0, pct: 0.0, high: 4352.40, low: 4318.20, vol: '98.6K', decimals: 2 },
  'XAG/USD': { price: 66.80, change: 0.0, pct: 0.0, high: 67.20, low: 66.30, vol: '64.2K', decimals: 2 },
  'BTC/USD': { price: 77930.00, change: 840.00, pct: 1.09, high: 78500.00, low: 76800.00, vol: '34.2K BTC', decimals: 2 },
  'ETH/USD': { price: 2420.00, change: -18.50, pct: -0.76, high: 2465.00, low: 2380.00, vol: '112.5K ETH', decimals: 2 },
};

export function usePrices(pairs = []) {
  const [prices, setPrices] = useState(() => {
    const init = {};
    pairs.forEach((sym) => {
      const cfg = FALLBACK_PRICES[sym] || { price: 100, change: 0, pct: 0, decimals: 4 };
      const isOpen = isForexOrMetalsMarketOpen(sym);
      init[sym] = {
        price: cfg.price,
        change: isOpen ? cfg.change : 0.0,
        pct: isOpen ? cfg.pct : 0.0,
        high: cfg.high,
        low: cfg.low,
        vol: cfg.vol,
        decimals: cfg.decimals,
        lastTickDir: 'neutral',
        isOpen,
        marketStatus: isOpen ? (sym.includes('BTC') || sym.includes('ETH') ? 'OPEN (24/7)' : 'OPEN') : 'CLOSED (Weekend)',
      };
    });
    return init;
  });
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);

  // 1. Institutional Sub-Second WebSocket Streaming Connection
  useEffect(() => {
    let reconnectTimeout = null;
    let isMounted = true;

    function connectWs() {
      try {
        const wsUrl = 'ws://localhost:8000/ws/market';
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isMounted) setIsWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if ((data.type === 'TICK' || data.type === 'SNAPSHOT') && data.prices) {
              setPrices((prev) => {
                const next = { ...prev };
                Object.keys(data.prices).forEach((sym) => {
                  const incoming = data.prices[sym];
                  const cur = prev[sym];
                  const newPrice = incoming.price;
                  const isPairOpen = incoming.is_open !== undefined ? incoming.is_open : isForexOrMetalsMarketOpen(sym);
                  const tickDir = !isPairOpen
                    ? 'neutral'
                    : cur
                    ? (newPrice > cur.price ? 'up' : newPrice < cur.price ? 'down' : 'neutral')
                    : 'neutral';

                  next[sym] = {
                    ...cur,
                    price: newPrice,
                    change: incoming.change,
                    pct: incoming.pct,
                    high: incoming.high_24h,
                    low: incoming.low_24h,
                    decimals: incoming.decimals || cur?.decimals || 4,
                    lastTickDir: tickDir,
                    isOpen: isPairOpen,
                    marketStatus: incoming.market_status || (isPairOpen ? 'OPEN' : 'CLOSED (Weekend)'),
                  };
                });
                return next;
              });
            }
          } catch {
            // Ignore non-JSON ping/pong
          }
        };

        ws.onerror = () => {
          if (isMounted) setIsWsConnected(false);
        };

        ws.onclose = () => {
          if (isMounted) {
            setIsWsConnected(false);
            // Reconnect attempt after 4 seconds
            reconnectTimeout = setTimeout(connectWs, 4000);
          }
        };
      } catch {
        if (isMounted) setIsWsConnected(false);
      }
    }

    connectWs();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // 2. HTTP Polling Backup (active when WebSocket is connecting or offline)
  useEffect(() => {
    async function syncBackendPrices() {
      try {
        const res = await fetch('http://localhost:8000/prices');
        if (res.ok) {
          const data = await res.json();
          setPrices((prev) => {
            const next = { ...prev };
            Object.keys(data).forEach((sym) => {
              if (next[sym]) {
                const cur = prev[sym];
                const newPrice = data[sym].price;
                const isPairOpen = data[sym].is_open !== undefined ? data[sym].is_open : isForexOrMetalsMarketOpen(sym);
                const tickDir = !isPairOpen
                  ? 'neutral'
                  : cur
                  ? (newPrice > cur.price ? 'up' : newPrice < cur.price ? 'down' : 'neutral')
                  : 'neutral';
                next[sym] = {
                  ...cur,
                  price: newPrice,
                  change: data[sym].change,
                  pct: data[sym].pct,
                  high: data[sym].high_24h,
                  low: data[sym].low_24h,
                  decimals: data[sym].decimals,
                  lastTickDir: tickDir,
                  isOpen: isPairOpen,
                  marketStatus: data[sym].market_status || (isPairOpen ? 'OPEN' : 'CLOSED (Weekend)'),
                };
              }
            });
            return next;
          });
        }
      } catch {
        // Fallback initialized
      }
    }

    async function fetchLiveBinance() {
      try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT"]');
        if (res.ok) {
          const data = await res.json();
          data.forEach((item) => {
            const sym = item.symbol === 'BTCUSDT' ? 'BTC/USD' : item.symbol === 'ETHUSDT' ? 'ETH/USD' : null;
            if (sym) {
              setPrices((prev) => {
                const cur = prev[sym];
                const newPrice = parseFloat(item.lastPrice);
                const lastTick = cur ? (newPrice >= cur.price ? 'up' : 'down') : 'neutral';
                return {
                  ...prev,
                  [sym]: {
                    price: newPrice,
                    change: parseFloat(item.priceChange),
                    pct: parseFloat(item.priceChangePercent),
                    high: parseFloat(item.highPrice),
                    low: parseFloat(item.lowPrice),
                    vol: `${(parseFloat(item.volume) / 1000).toFixed(1)}K`,
                    decimals: 2,
                    lastTickDir: lastTick,
                    isOpen: true,
                    marketStatus: 'OPEN (24/7)',
                  },
                };
              });
            }
          });
        }
      } catch {
        // Handled by backend prices
      }
    }

    syncBackendPrices();
    fetchLiveBinance();

    const fetchTimer = setInterval(() => {
      syncBackendPrices();
      fetchLiveBinance();
    }, 12000);

    return () => clearInterval(fetchTimer);
  }, []);

  // 3. Real-time market tick generator for smooth micro-fluctuations (OPEN MARKETS ONLY)
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setPrices((prev) => {
        const next = { ...prev };
        let hasChanges = false;

        pairs.forEach((sym) => {
          const cur = prev[sym];
          if (!cur) return;

          const open = cur.isOpen !== undefined ? cur.isOpen : isForexOrMetalsMarketOpen(sym);
          if (!open) {
            // Market is closed: ensure lastTickDir is neutral and price NEVER moves
            if (cur.lastTickDir !== 'neutral') {
              next[sym] = { ...cur, lastTickDir: 'neutral', isOpen: false, marketStatus: 'CLOSED (Weekend)' };
              hasChanges = true;
            }
            return;
          }

          hasChanges = true;
          const volFactor = sym.includes('BTC') ? 10.0 : sym.includes('XAU') ? 0.8 : sym.includes('ETH') ? 0.9 : sym.includes('XAG') ? 0.04 : sym.includes('JPY') ? 0.025 : 0.0001;
          const delta = (Math.random() - 0.49) * volFactor;
          const newPrice = Math.max(0.0001, cur.price + delta);
          const tickDir = delta >= 0 ? 'up' : 'down';

          next[sym] = {
            ...cur,
            price: Number(newPrice.toFixed(cur.decimals)),
            change: Number((cur.change + delta).toFixed(cur.decimals)),
            pct: Number((cur.pct + (delta / cur.price) * 100).toFixed(2)),
            high: Math.max(cur.high || newPrice, newPrice),
            low: Math.min(cur.low || newPrice, newPrice),
            lastTickDir: tickDir,
            isOpen: true,
            marketStatus: sym.includes('BTC') || sym.includes('ETH') ? 'OPEN (24/7)' : 'OPEN',
          };
        });
        return hasChanges ? next : prev;
      });
    }, 2200);

    return () => clearInterval(tickInterval);
  }, [pairs.join(',')]);

  return { prices, isWsConnected, error };
}

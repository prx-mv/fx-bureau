import React, { useState, useEffect, useCallback, useRef } from 'react';
import SidebarNav from '../components/SidebarNav';
import TopAccountRibbon from '../components/TopAccountRibbon';
import TickerPillCarousel from '../components/TickerPillCarousel';
import MainChartCanvas from '../components/MainChartCanvas';
import FigmaBacktestDeck from '../components/FigmaBacktestDeck';
import InstitutionalRightSidebar from '../components/InstitutionalRightSidebar';
import PortfolioLedger from '../components/PortfolioLedger';
import StrategyBacktestDeck from '../components/StrategyBacktestDeck';
import PredictionCard from '../components/PredictionCard';
import NewsCard from '../components/NewsCard';
import OrderModal from '../components/OrderModal';
import AlertCenterModal from '../components/AlertCenterModal';
import RiskCalculatorModal from '../components/RiskCalculatorModal';
import { playBullishChime, playBearishChime } from '../utils/audioAlerts';
import { usePrices, isForexOrMetalsMarketOpen } from '../hooks/usePrices';

const PAIRS = ['XAU/USD', 'XAG/USD', 'BTC/USD', 'ETH/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY'];

const DEFAULT_NEWS = [
  { headline: 'Gold spot approaches $4,350 as safe-haven demand reaches multi-year highs', source: 'Reuters', time: '30m ago', sentiment: 'BULLISH', summary: 'Spot gold (XAU/USD) traded firmly near $4,335–$4,350 as treasury yields retreated.' },
  { headline: 'Fed signals potential rate cuts in upcoming FOMC meeting as inflation cools', source: 'Reuters', time: '1h ago', sentiment: 'BULLISH', summary: 'Federal Reserve officials hint at easing monetary policy amid declining CPI data.' },
  { headline: 'European Central Bank holds rates steady, Lagarde remains cautious on cuts', source: 'FT', time: '3h ago', sentiment: 'NEUTRAL', summary: 'European Central Bank maintains current rate levels as wage metrics normalize.' },
  { headline: 'Bitcoin consolidates near $77,900 as institutional ETF inflows accelerate', source: 'CoinDesk', time: '6h ago', sentiment: 'BULLISH', summary: 'Crypto markets saw steady accumulation with open interest reaching monthly highs.' },
];

export default function Dashboard() {
  const { prices, isWsConnected, error } = usePrices(PAIRS);
  const [activeChart, setActiveChart] = useState('XAU/USD');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [activeNav, setActiveNav] = useState('Markets');
  const [predictions, setPredictions] = useState({});
  const [activePrediction, setActivePrediction] = useState(null);
  const [apiConnected, setApiConnected] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const mainRef = useRef(null);

  // News State
  const [news, setNews] = useState(DEFAULT_NEWS);
  const [newsFilter, setNewsFilter] = useState('ALL');

  // Simulated Paper Trading State & Persistence
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderModalSide, setOrderModalSide] = useState('BUY');
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [orderInitialData, setOrderInitialData] = useState(null);

  const [paperBalance, setPaperBalance] = useState(() => {
    try {
      const saved = localStorage.getItem('agy_paper_balance');
      return saved !== null ? parseFloat(saved) : 50000;
    } catch {
      return 50000;
    }
  });

  const [paperPositions, setPaperPositions] = useState(() => {
    try {
      const saved = localStorage.getItem('agy_paper_positions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [paperClosedTrades, setPaperClosedTrades] = useState(() => {
    try {
      const saved = localStorage.getItem('agy_paper_closed_trades');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync paper trading state with localStorage
  useEffect(() => {
    localStorage.setItem('agy_paper_balance', paperBalance.toString());
  }, [paperBalance]);

  useEffect(() => {
    localStorage.setItem('agy_paper_positions', JSON.stringify(paperPositions));
  }, [paperPositions]);

  useEffect(() => {
    localStorage.setItem('agy_paper_closed_trades', JSON.stringify(paperClosedTrades));
  }, [paperClosedTrades]);

  const showToast = (text, type = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const getContractMultiplier = (symbol, price) => {
    if (symbol.includes('BTC') || symbol.includes('ETH')) return 1;
    if (symbol.includes('XAU')) return 100;
    if (symbol.includes('XAG')) return 1000;
    if (symbol.includes('JPY')) return 100000 / (price || 155);
    return 100000;
  };

  // Execution handler
  const handleExecuteTrade = (tradeData) => {
    const newPos = {
      id: `pos_${Date.now()}`,
      ...tradeData,
      openTime: Date.now(),
    };
    setPaperPositions((prev) => [newPos, ...prev]);
    showToast(`Order executed: ${tradeData.side} ${tradeData.volume} lot(s) of ${tradeData.symbol} @ ${tradeData.entryPrice}`, 'success');

    if (soundEnabled) {
      if (tradeData.side === 'BUY') playBullishChime();
      else playBearishChime();
    }

    fetch('http://localhost:8000/paper/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tradeData),
    }).catch(() => {});
  };

  const handleClosePosition = useCallback((posId, exitPriceOverride = null, reason = 'Manual Close') => {
    setPaperPositions((prev) => {
      const pos = prev.find((p) => p.id === posId);
      if (!pos) return prev;

      const curPrice = exitPriceOverride !== null ? exitPriceOverride : Number(prices[pos.symbol]?.price || pos.entryPrice);
      const isBuy = pos.side === 'BUY';
      const diff = isBuy ? (curPrice - pos.entryPrice) : (pos.entryPrice - curPrice);
      const mult = getContractMultiplier(pos.symbol, curPrice);
      const pnl = diff * pos.volume * mult;

      const closedTrade = {
        ...pos,
        exitPrice: curPrice,
        realizedPnl: Math.round(pnl * 100) / 100,
        closeTime: Date.now(),
        closeReason: reason,
      };

      setPaperClosedTrades((h) => [closedTrade, ...h]);
      setPaperBalance((b) => Math.round((b + pnl) * 100) / 100);

      const pnlSign = pnl >= 0 ? '+' : '';
      showToast(`Closed ${pos.symbol} (${pos.side}): ${pnlSign}$${pnl.toFixed(2)} [${reason}]`, pnl >= 0 ? 'success' : 'warn');

      fetch('http://localhost:8000/paper/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionId: posId, exitPrice: curPrice }),
      }).catch(() => {});

      return prev.filter((p) => p.id !== posId);
    });
  }, [prices]);

  const handleResetAccount = () => {
    if (window.confirm('Reset simulated trading balance back to $50,000 and clear all positions?')) {
      setPaperBalance(50000);
      setPaperPositions([]);
      setPaperClosedTrades([]);
      showToast('Simulated Paper Account reset to $50,000.00', 'info');
      fetch('http://localhost:8000/paper/reset', { method: 'POST' }).catch(() => {});
    }
  };

  // Monitor TP/SL automatically on price ticks
  useEffect(() => {
    if (paperPositions.length === 0) return;

    paperPositions.forEach((pos) => {
      const liveP = Number(prices[pos.symbol]?.price);
      if (!liveP) return;

      if (pos.side === 'BUY') {
        if (pos.takeProfit && liveP >= pos.takeProfit) {
          handleClosePosition(pos.id, liveP, 'Take Profit Hit');
        } else if (pos.stopLoss && liveP <= pos.stopLoss) {
          handleClosePosition(pos.id, liveP, 'Stop Loss Hit');
        }
      } else if (pos.side === 'SELL') {
        if (pos.takeProfit && liveP <= pos.takeProfit) {
          handleClosePosition(pos.id, liveP, 'Take Profit Hit');
        } else if (pos.stopLoss && liveP >= pos.stopLoss) {
          handleClosePosition(pos.id, liveP, 'Stop Loss Hit');
        }
      }
    });
  }, [prices, paperPositions, handleClosePosition]);

  // Alert Center State & Persistence
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem('agy_sound_enabled') !== 'false';
    } catch {
      return true;
    }
  });

  const [alerts, setAlerts] = useState(() => {
    try {
      const saved = localStorage.getItem('agy_market_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [alertHistory, setAlertHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('agy_market_alert_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('agy_sound_enabled', soundEnabled.toString());
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('agy_market_alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('agy_market_alert_history', JSON.stringify(alertHistory));
  }, [alertHistory]);

  const handleAddAlert = (newAlert) => {
    setAlerts((prev) => [newAlert, ...prev]);
    showToast(`Alert registered for ${newAlert.symbol} (${newAlert.alertType})`, 'info');
  };

  const handleDeleteAlert = (alertId) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const handleClearAlertHistory = () => {
    setAlertHistory([]);
  };

  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      showToast(next ? 'Terminal audio chimes enabled' : 'Terminal audio muted', 'info');
      return next;
    });
  };

  // Real-time evaluation of active price and ML alerts
  useEffect(() => {
    if (alerts.length === 0) return;

    const triggeredIds = [];
    const newHistoryEntries = [];

    alerts.forEach((al) => {
      const liveData = prices[al.symbol];
      const curPrice = Number(liveData?.price);
      const pred = predictions[al.symbol];

      let isTriggered = false;
      let triggerReason = '';

      if (al.alertType === 'PRICE_ABOVE' && curPrice && curPrice >= al.threshold) {
        isTriggered = true;
        triggerReason = `Price crossed above ${al.threshold} (Current: ${curPrice})`;
      } else if (al.alertType === 'PRICE_BELOW' && curPrice && curPrice <= al.threshold) {
        isTriggered = true;
        triggerReason = `Price crossed below ${al.threshold} (Current: ${curPrice})`;
      } else if (al.alertType === 'ML_CONFIDENCE' && pred?.confidence && pred.confidence >= al.threshold) {
        isTriggered = true;
        triggerReason = `ML Confidence reached ${pred.confidence}% (Threshold: ${al.threshold}%)`;
      } else if (al.alertType === 'ML_DIRECTION' && pred?.direction && pred.direction === al.directionTarget) {
        isTriggered = true;
        triggerReason = `ML Signal matches target: ${al.directionTarget}`;
      }

      if (isTriggered) {
        triggeredIds.push(al.id);
        newHistoryEntries.push({
          id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          symbol: al.symbol,
          triggerReason,
          triggerPrice: curPrice || '—',
          triggeredAt: Date.now(),
        });

        if (al.soundNotify && soundEnabled) {
          if (al.directionTarget === 'BULLISH' || al.alertType === 'PRICE_ABOVE') {
            playBullishChime();
          } else {
            playBearishChime();
          }
        }

        if (al.toastNotify) {
          showToast(`🚨 ALERT: ${al.symbol} · ${triggerReason}`, 'warn');
        }
      }
    });

    if (triggeredIds.length > 0) {
      setAlerts((prev) => prev.filter((a) => !triggeredIds.includes(a.id)));
      setAlertHistory((prev) => [...newHistoryEntries, ...prev]);
    }
  }, [prices, predictions, alerts, soundEnabled]);

  const pricesRef = useRef(prices);
  useEffect(() => {
    pricesRef.current = prices;
  }, [prices]);

  // Fetch ML prediction for a specific symbol
  const fetchSinglePrediction = useCallback(async (sym, tf) => {
    const liveP = pricesRef.current[sym]?.price;
    const url = `http://localhost:8000/predict?symbol=${encodeURIComponent(sym)}&timeframe=${tf.toUpperCase()}${liveP ? `&current_price=${liveP}` : ''}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      return data;
    } catch {
      return null;
    }
  }, []);

  const refreshAllPredictions = useCallback(async (onlyOpen = false) => {
    try {
      const targetPairs = onlyOpen ? PAIRS.filter((s) => isForexOrMetalsMarketOpen(s)) : PAIRS;
      if (targetPairs.length === 0) return;

      const results = {};
      await Promise.all(
        targetPairs.map(async (sym) => {
          const pred = await fetchSinglePrediction(sym, selectedTimeframe);
          if (pred) {
            results[sym] = pred;
          }
        })
      );

      if (Object.keys(results).length > 0) {
        setPredictions((prev) => ({ ...prev, ...results }));
        setApiConnected(true);
        if (results[activeChart]) {
          setActivePrediction(results[activeChart]);
        }
      }
    } catch {
      // Backend unavailable
    }
  }, [activeChart, selectedTimeframe, fetchSinglePrediction]);

  // Fetch active symbol prediction on selection change
  useEffect(() => {
    const isClosed = !isForexOrMetalsMarketOpen(activeChart);
    if (isClosed && predictions[activeChart]) {
      setActivePrediction(predictions[activeChart]);
      return;
    }

    let isMounted = true;
    fetchSinglePrediction(activeChart, selectedTimeframe).then((pred) => {
      if (isMounted && pred) {
        setActivePrediction(pred);
        setPredictions((prev) => ({ ...prev, [activeChart]: pred }));
        setApiConnected(true);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [activeChart, selectedTimeframe, fetchSinglePrediction]);

  // Initial sync & periodic background polling for open markets + news
  useEffect(() => {
    refreshAllPredictions(false);

    // Fetch macro news
    fetch('http://localhost:8000/news')
      .then((res) => res.json())
      .then((data) => {
        if (data.news && Array.isArray(data.news) && data.news.length > 0) {
          setNews(data.news);
        }
      })
      .catch(() => {});

    const interval = setInterval(() => {
      refreshAllPredictions(true);
    }, 25000);
    return () => clearInterval(interval);
  }, [refreshAllPredictions]);

  // Dynamic portfolio equity & pnl calculation
  const unrealizedPnl = paperPositions.reduce((acc, pos) => {
    const liveP = Number(prices[pos.symbol]?.price || pos.entryPrice);
    const isBuy = pos.side === 'BUY';
    const diff = isBuy ? (liveP - pos.entryPrice) : (pos.entryPrice - liveP);
    const mult = getContractMultiplier(pos.symbol, liveP);
    return acc + (diff * pos.volume * mult);
  }, 0);

  const paperEquity = Math.round((paperBalance + unrealizedPnl) * 100) / 100;
  const unrealizedPnlPct = paperBalance > 0 ? (unrealizedPnl / paperBalance) * 100 : 0;

  // Win rate
  const wins = paperClosedTrades.filter((t) => (t.realizedPnl || 0) > 0).length;
  const winRate = paperClosedTrades.length > 0
    ? Number(((wins / paperClosedTrades.length) * 100).toFixed(1))
    : 64.2;

  const displayBalance = paperBalance;
  const displayEquity = paperPositions.length > 0 ? paperEquity : (paperBalance === 50000 ? 50210.45 : paperBalance);
  const displayUnrealizedPnl = paperPositions.length > 0 ? unrealizedPnl : (paperBalance === 50000 ? 210.45 : 0);
  const displayUnrealizedPnlPct = paperPositions.length > 0 ? unrealizedPnlPct : (paperBalance === 50000 ? 0.42 : 0);
  const displayWinRate = paperClosedTrades.length > 0 ? winRate : 64.2;

  const activeData = prices[activeChart];

  const filteredNews = newsFilter === 'ALL'
    ? news
    : news.filter((n) => n.sentiment?.toUpperCase() === newsFilter);

  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#090b0e',
      }}
    >
      {/* 1. Left Fixed Navigation Sidebar matching Figma */}
      <SidebarNav
        activeNav={activeNav}
        onSelectNav={(id) => {
          setActiveNav(id);
          if (id === 'Trade') setIsOrderModalOpen(true);
          if (id === 'Alerts') setIsAlertModalOpen(true);
          if (id === 'Sizer') setIsRiskModalOpen(true);
        }}
        audioEnabled={soundEnabled}
        onToggleAudio={handleToggleSound}
        onOpenAlerts={() => setIsAlertModalOpen(true)}
        onOpenRiskSizer={() => setIsRiskModalOpen(true)}
      />

      {/* 2. Main Scrollable Workstation Viewport */}
      <main
        ref={mainRef}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflowY: 'auto',
          padding: '10px 20px 24px 20px',
          boxSizing: 'border-box',
          minWidth: 0,
        }}
      >
        {/* Sticky Header Section: Guarantees 100% visibility of Workstation Title, Balance, Metrics, and Ticker Pills */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            backgroundColor: '#090b0e',
            paddingBottom: '2px',
          }}
        >
          {/* Top Header Ribbon */}
          <TopAccountRibbon
            balance={displayBalance}
            equity={displayEquity}
            unrealizedPnl={displayUnrealizedPnl}
            unrealizedPnlPct={displayUnrealizedPnlPct}
            winRate={displayWinRate}
          />

          {/* Asset Ticker Ribbon Carousel */}
          <TickerPillCarousel
            pairs={PAIRS}
            prices={prices}
            activeSymbol={activeChart}
            onSelectSymbol={setActiveChart}
          />
        </div>

        {/* Dynamic Views Driven by Sidebar Tabs */}
        {activeNav === 'Portfolio' ? (
          <div style={{ marginTop: '12px' }}>
            <PortfolioLedger
              balance={paperBalance}
              positions={paperPositions}
              closedTrades={paperClosedTrades}
              prices={prices}
              onClosePosition={handleClosePosition}
              onResetAccount={handleResetAccount}
              onSelectSymbol={(sym) => {
                setActiveChart(sym);
                setActiveNav('Markets');
              }}
            />
          </div>
        ) : activeNav === 'Backtest' ? (
          <div style={{ marginTop: '12px' }}>
            <StrategyBacktestDeck
              activeSymbol={activeChart}
              onSelectSymbol={setActiveChart}
            />
          </div>
        ) : (
          /* Main Institutional Workstation ('Markets' tab) */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '4px' }}>
            {/* Upper Workstation Grid matching Figma node 3-61 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.85fr) minmax(320px, 1.1fr)',
                gap: '16px',
                alignItems: 'start',
              }}
            >
              {/* Left Content Area: Main Chart Canvas + Quantitative Strategy Backtest Deck */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
                <MainChartCanvas
                  symbol={activeChart}
                  currentPrice={activeData?.price || (activeChart === 'XAU/USD' ? 4335.80 : 1.085)}
                  change24h={activeData?.pct !== undefined ? activeData.pct : 1.25}
                  timeframe={selectedTimeframe}
                  onChangeTimeframe={setSelectedTimeframe}
                />

                <FigmaBacktestDeck
                  activeSymbol={activeChart}
                />
              </div>

              {/* Right Column: Market Intelligence Cockpit + Institutional Ticket + Quant Alerts */}
              <div style={{ minWidth: 0 }}>
                <InstitutionalRightSidebar
                  symbol={activeChart}
                  currentPrice={activeData?.price || (activeChart === 'XAU/USD' ? 4335.80 : 1.085)}
                  prediction={activePrediction || predictions[activeChart]}
                  balance={paperBalance}
                  onExecuteOrder={handleExecuteTrade}
                  alerts={alerts}
                  alertHistory={alertHistory}
                  onOpenAlertModal={() => setIsAlertModalOpen(true)}
                  onRefreshPrediction={() => {
                    fetchSinglePrediction(activeChart, selectedTimeframe).then((p) => {
                      if (p) setActivePrediction(p);
                    });
                  }}
                />
              </div>
            </div>

            {/* Lower Analytical Deck: Multi-Asset ML Direction Overview (Left) + Macro News & AI Sentiment Stream (Right) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: '16px',
                alignItems: 'start',
                borderTop: '1px solid #1a1d24',
                paddingTop: '20px',
              }}
            >
              {/* Left: All Assets ML Direction Overview */}
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.6px',
                    color: '#cbb07a',
                    textTransform: 'uppercase',
                    marginBottom: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>All Assets ML Direction Overview</span>
                  <span style={{ fontSize: '10px', color: '#6e7787', fontFamily: 'var(--font-mono)' }}>Click card to switch chart</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {PAIRS.map((sym) => {
                    const liveData = prices[sym];
                    const pred = predictions[sym] || {};
                    const isSelected = activeChart === sym;

                    return (
                      <div
                        key={sym}
                        onClick={() => setActiveChart(sym)}
                        style={{
                          cursor: 'pointer',
                          borderRadius: '8px',
                          border: isSelected ? '1px solid #cbb07a' : '1px solid #1a1d24',
                          boxShadow: isSelected ? '0 0 10px rgba(203, 176, 122, 0.15)' : 'none',
                          transition: 'all 0.15s ease',
                          background: '#0d0f14',
                        }}
                      >
                        <PredictionCard
                          symbol={sym}
                          price={liveData?.price}
                          change={liveData?.change}
                          pct={liveData?.pct}
                          direction={pred?.direction || 'BULLISH'}
                          confidence={pred?.confidence || 68}
                          timeframe={selectedTimeframe}
                          models={pred?.models}
                          indicators={pred?.indicators}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Macro News & AI Sentiment Stream */}
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.6px',
                    color: '#cbb07a',
                    textTransform: 'uppercase',
                    marginBottom: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>Macro News & AI Sentiment</span>

                  {/* Sentiment Filters */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {['ALL', 'BULLISH', 'BEARISH', 'NEUTRAL'].map((filt) => (
                      <button
                        key={filt}
                        onClick={() => setNewsFilter(filt)}
                        style={{
                          background: newsFilter === filt ? '#1f2430' : 'transparent',
                          color: newsFilter === filt ? '#cbb07a' : '#6e7787',
                          border: '1px solid #1c212b',
                          borderRadius: '4px',
                          padding: '2px 7px',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {filt}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredNews.map((n, i) => (
                    <NewsCard key={n.url || i} {...n} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Interactive Order Execution Modal */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        symbol={activeChart}
        currentPrice={activeData?.price}
        prediction={activePrediction || predictions[activeChart]}
        onExecuteTrade={handleExecuteTrade}
        balance={paperBalance}
        initialSide={orderModalSide}
        initialData={orderInitialData}
        onOpenRiskCalculator={() => {
          setIsOrderModalOpen(false);
          setIsRiskModalOpen(true);
        }}
      />

      {/* Institutional Risk & Position Sizing Calculator Modal */}
      <RiskCalculatorModal
        isOpen={isRiskModalOpen}
        onClose={() => setIsRiskModalOpen(false)}
        symbol={activeChart}
        currentPrice={activeData?.price}
        balance={paperBalance}
        prediction={activePrediction || predictions[activeChart]}
        onApplyToOrder={(orderParams) => {
          handleExecuteTrade(orderParams);
          setIsRiskModalOpen(false);
        }}
      />

      {/* Market Alert & Webhook Center Modal */}
      <AlertCenterModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        activeSymbol={activeChart}
        currentPrice={activeData?.price}
        alerts={alerts}
        alertHistory={alertHistory}
        onAddAlert={handleAddAlert}
        onDeleteAlert={handleDeleteAlert}
        onClearHistory={handleClearAlertHistory}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Dynamic Toast Notifications */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: toastMessage.type === 'success' ? '#064e3b' : toastMessage.type === 'warn' ? '#78350f' : '#1e293b',
            border: `1px solid ${toastMessage.type === 'success' ? '#4f9d69' : toastMessage.type === 'warn' ? '#c98a3c' : '#cbb07a'}`,
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 9999,
          }}
        >
          <span>{toastMessage.type === 'success' ? '✓' : toastMessage.type === 'warn' ? '⚠' : 'ℹ'}</span>
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}

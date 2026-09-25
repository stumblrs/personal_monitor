'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Currency,
  Cryptocurrency,
  Position,
  PositionWithMetrics,
  Alert,
  AlertEvent,
} from '@/types/domain';
import { PositionStore } from '@/lib/storage';
import { calculatePositionMetrics, calculatePortfolioSummary, formatCurrency } from '@/lib/calculations';
import { evaluatePositionAlerts } from '@/lib/alertEngine';
import { Navbar } from '@/components/layout/Navbar';
import { PortfolioHeader } from '@/components/dashboard/PortfolioHeader';
import { PositionCard } from '@/components/dashboard/PositionCard';
import { EmptyDashboard } from '@/components/dashboard/EmptyDashboard';
import { PositionDetailView } from '@/components/positions/PositionDetailView';
import { SelectCoinModal } from '@/components/modals/SelectCoinModal';
import { PositionSetupModal } from '@/components/modals/PositionSetupModal';
import { AlertSetupModal } from '@/components/modals/AlertSetupModal';
import { NotificationBanner } from '@/components/notifications/NotificationBanner';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { Bell, Archive, Trash2, ArrowLeft, RotateCcw } from 'lucide-react';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertEvents, setAlertEvents] = useState<AlertEvent[]>([]);
  const [deviceId, setDeviceId] = useState<string>('');
  const [baseCurrency, setBaseCurrency] = useState<Currency>('EUR');
  const [refreshInterval, setRefreshInterval] = useState<number>(30);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // View state: 'dashboard' | 'archived' | 'history'
  const [activeView, setActiveView] = useState<'dashboard' | 'archived' | 'history'>('dashboard');
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);

  // Modals state
  const [isSelectCoinOpen, setIsSelectCoinOpen] = useState(false);
  const [selectedCoinForSetup, setSelectedCoinForSetup] = useState<Cryptocurrency | null>(null);
  const [positionForAlertSetup, setPositionForAlertSetup] = useState<Position | null>(null);

  // Prices cache & tracking: id -> { price, timestamp }
  const [marketPrices, setMarketPrices] = useState<Record<string, { price: number; timestamp: string }>>({});
  const previousPricesRef = useRef<Record<string, number>>({});

  // Load and sync data from server database with localStorage fallback
  const reloadData = useCallback(async () => {
    const curDeviceId = PositionStore.getDeviceId();
    try {
      const res = await fetch(`/api/positions?deviceId=${encodeURIComponent(curDeviceId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.positions) && data.positions.length > 0) {
          const adaptedPositions: Position[] = data.positions.map((p: any) => ({
            id: p.id,
            userId: p.userId,
            cryptocurrencyId: p.cryptocurrencyId,
            cryptocurrency: {
              id: p.cryptocurrency.id,
              symbol: p.cryptocurrency.symbol,
              name: p.cryptocurrency.name,
              logoUrl: p.cryptocurrency.logoUrl || undefined,
              status: p.cryptocurrency.status,
            },
            quantity: p.quantity,
            entryPrice: p.entryPrice,
            entryCurrency: p.entryCurrency,
            purchaseDate: p.purchaseDate || undefined,
            fees: p.fees || undefined,
            exchange: p.exchange || undefined,
            wallet: p.wallet || undefined,
            notes: p.notes || undefined,
            status: p.status,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
          }));

          const extractedAlerts: Alert[] = [];
          for (const p of data.positions) {
            for (const a of p.alerts || []) {
              extractedAlerts.push({
                id: a.id,
                positionId: a.positionId,
                type: a.type,
                direction: a.direction,
                threshold: a.threshold,
                targetPrice: a.targetPrice,
                repeatMode: a.repeatMode,
                cooldownMinutes: a.cooldownMinutes,
                status: a.status,
                lastTriggeredAt: a.lastTriggeredAt || undefined,
                createdAt: a.createdAt,
                updatedAt: a.updatedAt,
              });
            }
          }

          // Also load alert events from server
          try {
            const evtsRes = await fetch(`/api/alerts?deviceId=${encodeURIComponent(curDeviceId)}`);
            if (evtsRes.ok) {
              const evtsData = await evtsRes.json();
              if (Array.isArray(evtsData.events)) {
                setAlertEvents(evtsData.events);
                PositionStore.saveAlertEvents(evtsData.events);
              }
            }
          } catch (evErr) {
            console.warn('Failed to load server alert events:', evErr);
            setAlertEvents(PositionStore.getAlertEvents());
          }

          setPositions(adaptedPositions);
          setAlerts(extractedAlerts);
          PositionStore.savePositions(adaptedPositions);
          PositionStore.saveAlerts(extractedAlerts);
          return;
        }
      }
    } catch (e) {
      console.warn('Server fetch fallback to local cache:', e);
    }

    // Fallback to local store
    setPositions(PositionStore.getPositions());
    setAlerts(PositionStore.getAlerts());
    setAlertEvents(PositionStore.getAlertEvents());
  }, []);

  // Initialize client store on mount
  useEffect(() => {
    setIsClient(true);
    const dId = PositionStore.getDeviceId();
    setDeviceId(dId);
    setBaseCurrency(PositionStore.getBaseCurrency());
    setRefreshInterval(PositionStore.getRefreshInterval());
    reloadData();
  }, [reloadData]);

  // Price Fetching and Alert Evaluation Engine
  const fetchPricesAndEvaluateAlerts = useCallback(async () => {
    const activePositions = positions.filter((p) => p.status === 'ACTIVE');
    if (activePositions.length === 0) return;

    setIsRefreshing(true);
    const coinIds = Array.from(new Set(activePositions.map((p) => p.cryptocurrencyId)));

    try {
      const res = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coinIds, currency: baseCurrency }),
      });

      if (res.ok) {
        const data = await res.json();
        const newPrices: Record<string, { price: number; timestamp: string }> = {};
        const currentAlerts = PositionStore.getAlerts();
        let allNewAlertEvents: AlertEvent[] = [];
        let updatedAlertsList: Alert[] = [...currentAlerts];

        for (const [id, info] of Object.entries<any>(data.prices || {})) {
          const currentPrice = info.price;
          newPrices[id] = {
            price: currentPrice,
            timestamp: info.timestamp,
          };

          // Evaluate alerts for any active positions of this coin
          const pos = activePositions.find((p) => p.cryptocurrencyId === id);
          if (pos) {
            const posAlerts = currentAlerts.filter((a) => a.positionId === pos.id);
            const prevPrice = previousPricesRef.current[id] || pos.entryPrice;

            const { triggeredAlerts, updatedAlerts } = evaluatePositionAlerts(
              pos,
              posAlerts,
              prevPrice,
              currentPrice
            );

            if (triggeredAlerts.length > 0) {
              allNewAlertEvents.push(...triggeredAlerts.map((t) => t.event));
            }

            // Update alerts in the global list
            updatedAlertsList = updatedAlertsList.map((a) => {
              const found = updatedAlerts.find((u) => u.id === a.id);
              return found || a;
            });
          }

          // Record as previous price for next tick
          previousPricesRef.current[id] = currentPrice;
        }

        setMarketPrices((prev) => ({ ...prev, ...newPrices }));

        if (allNewAlertEvents.length > 0) {
          const existingEvents = PositionStore.getAlertEvents();
          const combined = [...allNewAlertEvents, ...existingEvents];
          PositionStore.saveAlertEvents(combined);
          PositionStore.saveAlerts(updatedAlertsList);
          setAlertEvents(combined);
          setAlerts(updatedAlertsList);
        }
      }
    } catch (err) {
      console.error('Failed to fetch prices', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [positions, baseCurrency]);

  // Scheduled background price polling
  useEffect(() => {
    if (!isClient) return;
    fetchPricesAndEvaluateAlerts();

    const intervalId = setInterval(() => {
      fetchPricesAndEvaluateAlerts();
    }, refreshInterval * 1000);

    return () => clearInterval(intervalId);
  }, [isClient, refreshInterval, fetchPricesAndEvaluateAlerts]);

  // Handle Currency change
  const handleCurrencyChange = (curr: Currency) => {
    setBaseCurrency(curr);
    PositionStore.setBaseCurrency(curr);
  };

  // Handle Refresh Interval change
  const handleIntervalChange = (sec: number) => {
    setRefreshInterval(sec);
    PositionStore.setRefreshInterval(sec);
  };

  // Build Positions with Calculated Metrics
  const positionsWithMetrics: PositionWithMetrics[] = positions.map((p) => {
    const priceInfo = marketPrices[p.cryptocurrencyId];
    const currentPrice = priceInfo?.price;
    const posAlerts = alerts.filter((a) => a.positionId === p.id);

    let metrics = undefined;
    if (currentPrice) {
      metrics = calculatePositionMetrics(p.quantity, p.entryPrice, currentPrice);
    }

    return {
      ...p,
      currentPrice,
      priceUpdatedAt: priceInfo?.timestamp,
      priceFreshness: currentPrice ? 'LIVE' : 'RECENT',
      metrics,
      alerts: posAlerts,
    };
  });

  const activePositions = positionsWithMetrics.filter((p) => p.status === 'ACTIVE' || p.status === 'PAUSED');
  const archivedPositions = positionsWithMetrics.filter((p) => p.status === 'ARCHIVED');
  const portfolioSummary = calculatePortfolioSummary(positionsWithMetrics);

  const selectedPosition = positionsWithMetrics.find((p) => p.id === selectedPositionId);

  // Position CRUD & Lifecycle actions
  const handleSaveNewPosition = async (
    posData: Omit<Position, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
  ) => {
    // 1. Immediately store locally for zero latency
    PositionStore.addPosition(posData);
    reloadData();
    fetchPricesAndEvaluateAlerts();

    // 2. Persist in Server Prisma Database
    try {
      await fetch('/api/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          cryptocurrencyId: posData.cryptocurrencyId,
          symbol: posData.cryptocurrency.symbol,
          name: posData.cryptocurrency.name,
          logoUrl: posData.cryptocurrency.logoUrl,
          quantity: posData.quantity,
          entryPrice: posData.entryPrice,
          entryCurrency: posData.entryCurrency,
          purchaseDate: posData.purchaseDate,
          fees: posData.fees,
          exchange: posData.exchange,
          notes: posData.notes,
        }),
      });
      reloadData();
    } catch (e) {
      console.warn('Could not sync position creation to server database:', e);
    }
  };

  const handlePauseResume = async (id: string, isPaused: boolean) => {
    const newStatus = isPaused ? 'ACTIVE' : 'PAUSED';
    if (isPaused) {
      PositionStore.resumePosition(id);
    } else {
      PositionStore.pausePosition(id);
    }
    reloadData();

    try {
      await fetch(`/api/positions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) {
      console.warn('Server patch failed:', e);
    }
  };

  const handleArchive = async (id: string) => {
    PositionStore.archivePosition(id);
    reloadData();
    if (selectedPositionId === id) setSelectedPositionId(null);

    try {
      await fetch(`/api/positions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ARCHIVED' }),
      });
    } catch (e) {
      console.warn('Server archive failed:', e);
    }
  };

  const handleRestore = async (id: string) => {
    PositionStore.restorePosition(id);
    reloadData();

    try {
      await fetch(`/api/positions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
    } catch (e) {
      console.warn('Server restore failed:', e);
    }
  };

  const handleDelete = async (id: string) => {
    PositionStore.deletePosition(id);
    reloadData();
    if (selectedPositionId === id) setSelectedPositionId(null);

    try {
      await fetch(`/api/positions/${id}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('Server delete failed:', e);
    }
  };

  const handleEditEntryPrice = async (newPrice: number) => {
    if (selectedPositionId) {
      PositionStore.updatePosition(selectedPositionId, { entryPrice: newPrice });
      reloadData();

      try {
        await fetch(`/api/positions/${selectedPositionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entryPrice: newPrice }),
        });
      } catch (e) {
        console.warn('Server edit failed:', e);
      }
    }
  };

  const handleSaveAlert = async (
    alertData: Omit<Alert, 'id' | 'createdAt' | 'updatedAt' | 'targetPrice'>
  ) => {
    PositionStore.addAlert(alertData);
    reloadData();
    fetchPricesAndEvaluateAlerts();

    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData),
      });
      reloadData();
    } catch (e) {
      console.warn('Server alert creation failed:', e);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    PositionStore.deleteAlert(alertId);
    reloadData();

    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('Server alert delete failed:', e);
    }
  };

  const handleResetAlert = async (alertId: string) => {
    PositionStore.resetAlert(alertId);
    reloadData();

    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
    } catch (e) {
      console.warn('Server alert reset failed:', e);
    }
  };

  const handleDismissNotification = (eventId: string) => {
    PositionStore.dismissAlertEvent(eventId);
    setAlertEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const handleClearAlertHistory = async () => {
    PositionStore.saveAlertEvents([]);
    setAlertEvents([]);
    try {
      await fetch(`/api/alerts?deviceId=${encodeURIComponent(deviceId)}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('Failed to clear alert history on server:', e);
    }
  };


  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Navbar */}
      <Navbar
        deviceId={deviceId}
        baseCurrency={baseCurrency}
        onCurrencyChange={handleCurrencyChange}
        refreshInterval={refreshInterval}
        onRefreshIntervalChange={handleIntervalChange}
        onRefreshNow={fetchPricesAndEvaluateAlerts}
        isRefreshing={isRefreshing}
        activeView={activeView}
        onNavigate={(view) => {
          setActiveView(view);
          setSelectedPositionId(null);
        }}
        unreadAlertsCount={alertEvents.filter((e) => e.delivered).length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-8">
        {/* VIEW 1: Specific Position Detail View */}
        {selectedPosition ? (
          <PositionDetailView
            position={selectedPosition}
            onBack={() => setSelectedPositionId(null)}
            onAddAlert={() => setPositionForAlertSetup(selectedPosition)}
            onDeleteAlert={handleDeleteAlert}
            onResetAlert={handleResetAlert}
            onPauseResume={handlePauseResume}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onEditEntryPrice={handleEditEntryPrice}
          />
        ) : activeView === 'archived' ? (
          /* VIEW 2: Archived Positions */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Archived Positions</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Historical positions no longer actively monitored on your dashboard
                </p>
              </div>
              <button
                onClick={() => setActiveView('dashboard')}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Dashboard</span>
              </button>
            </div>

            {archivedPositions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500 text-sm">
                No archived positions.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {archivedPositions.map((pos) => (
                  <div
                    key={pos.id}
                    className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">{pos.cryptocurrency.name}</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          {pos.cryptocurrency.symbol}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        Entry: {formatCurrency(pos.entryPrice, pos.entryCurrency)} • Qty: {pos.quantity}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleRestore(pos.id)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/20 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => handleDelete(pos.id)}
                        className="p-2 text-zinc-500 hover:text-rose-400 rounded-xl hover:bg-zinc-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeView === 'history' ? (
          /* VIEW 3: Alert History */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Alert Trigger History</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Chronological record of all condition events triggered by market prices
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {alertEvents.length > 0 && (
                  <button
                    onClick={handleClearAlertHistory}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear History</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Dashboard</span>
                </button>
              </div>
            </div>

            {alertEvents.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500 text-sm">
                No alert events recorded yet.
              </div>
            ) : (
              <div className="space-y-2">
                {alertEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-sm">{evt.coinSymbol}</span>
                          <span className="text-emerald-400 font-semibold">{evt.conditionDescription}</span>
                        </div>
                        <p className="text-zinc-500 text-[11px] mt-0.5">
                          Triggered: {new Date(evt.triggeredAt).toLocaleString()} • Trigger: {formatCurrency(evt.triggerPrice)} • Actual: {formatCurrency(evt.actualPrice)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPositionId(evt.positionId);
                        setActiveView('dashboard');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition-colors"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* VIEW 4: Core Active Dashboard (Screens 01 & 02) */
          <div className="space-y-8">
            {/* Top Portfolio Summary Banner */}
            <PortfolioHeader
              summary={portfolioSummary}
              baseCurrency={baseCurrency}
              onSelectCoinClick={() => setIsSelectCoinOpen(true)}
            />

            {/* Invariant 1: If empty, show deliberately clean empty dashboard state */}
            {activePositions.length === 0 ? (
              <EmptyDashboard
                onSelectCoinClick={() => setIsSelectCoinOpen(true)}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm uppercase font-bold tracking-wider text-zinc-400">
                    My Monitored Positions ({activePositions.length})
                  </h2>

                  <button
                    onClick={() => setIsSelectCoinOpen(true)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
                  >
                    + Add Another Coin
                  </button>
                </div>

                {/* Position Cards Grid: Side-by-Side Invariant */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {activePositions.map((pos) => (
                    <PositionCard
                      key={pos.id}
                      position={pos}
                      onViewDetails={(id) => setSelectedPositionId(id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODALS */}
      {/* 1. Select Coin Gateway */}
      <SelectCoinModal
        isOpen={isSelectCoinOpen}
        onClose={() => setIsSelectCoinOpen(false)}
        alreadyMonitoredCoinIds={positions.filter((p) => p.status === 'ACTIVE').map((p) => p.cryptocurrencyId)}
        onSelectCoin={(coin) => {
          setIsSelectCoinOpen(false);
          setSelectedCoinForSetup(coin);
        }}
      />

      {/* 2. Position Setup Form */}
      <PositionSetupModal
        coin={selectedCoinForSetup}
        baseCurrency={baseCurrency}
        isOpen={!!selectedCoinForSetup}
        onClose={() => setSelectedCoinForSetup(null)}
        onSavePosition={handleSaveNewPosition}
      />

      {/* 3. Alert Setup Modal */}
      <AlertSetupModal
        position={positionForAlertSetup}
        isOpen={!!positionForAlertSetup}
        onClose={() => setPositionForAlertSetup(null)}
        onSaveAlert={handleSaveAlert}
      />

      {/* Pop-up Live Notifications */}
      <NotificationBanner
        events={alertEvents.filter((e) => e.delivered)}
        onDismiss={handleDismissNotification}
        onViewPosition={(posId) => {
          setSelectedPositionId(posId);
          setActiveView('dashboard');
        }}
      />

      {/* PWA Mobile Installation Prompt */}
      <InstallPrompt />
    </div>
  );
}

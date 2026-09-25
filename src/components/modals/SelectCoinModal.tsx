'use client';

import { useState, useEffect } from 'react';
import { Cryptocurrency } from '@/types/domain';
import { Search, X, Loader2, Check } from 'lucide-react';

interface SelectCoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCoin: (coin: Cryptocurrency) => void;
  alreadyMonitoredCoinIds: string[];
}

export function SelectCoinModal({
  isOpen,
  onClose,
  onSelectCoin,
  alreadyMonitoredCoinIds,
}: SelectCoinModalProps) {
  const [query, setQuery] = useState('');
  const [coins, setCoins] = useState<Cryptocurrency[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return;
    }

    let isMounted = true;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/cryptocurrencies/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setCoins(data.coins || []);
          }
        }
      } catch (err) {
        console.error('Search error', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }, query ? 300 : 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/80">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Select Coin</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Choose a cryptocurrency to record and monitor
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input field */}
        <div className="p-4 border-b border-zinc-800/60 bg-zinc-900/50">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cryptocurrency (e.g., Bitcoin, BTC, SOL)..."
              autoFocus
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
            />
            {loading && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 animate-spin" />
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y divide-transparent">
          {coins.length === 0 && !loading ? (
            <div className="text-center py-12 text-zinc-500 text-sm">
              No cryptocurrencies found matching "{query}".
            </div>
          ) : (
            coins.map((coin) => {
              const isAlreadyMonitored = alreadyMonitoredCoinIds.includes(coin.id);

              return (
                <div
                  key={coin.id}
                  onClick={() => {
                    if (!isAlreadyMonitored) {
                      onSelectCoin(coin);
                    }
                  }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all cursor-pointer ${
                    isAlreadyMonitored
                      ? 'bg-zinc-950/40 opacity-60 cursor-not-allowed'
                      : 'hover:bg-zinc-800/80 active:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    {coin.logoUrl ? (
                      <img
                        src={coin.logoUrl}
                        alt={coin.name}
                        className="w-9 h-9 rounded-full ring-1 ring-zinc-700/60 p-0.5 bg-zinc-800 object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-300 ring-1 ring-zinc-700">
                        {coin.symbol.slice(0, 3)}
                      </div>
                    )}
                    <div className="text-left">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white text-sm">{coin.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono font-medium">
                          {coin.symbol}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500 font-mono capitalize">{coin.id}</span>
                    </div>
                  </div>

                  <div>
                    {isAlreadyMonitored ? (
                      <span className="inline-flex items-center text-xs font-medium text-emerald-400/90 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        <Check className="w-3.5 h-3.5 mr-1" /> Monitored
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 transition-colors">
                        Select
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

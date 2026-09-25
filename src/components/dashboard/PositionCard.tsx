import { PositionWithMetrics } from '@/types/domain';
import { formatCurrency, formatRoi } from '@/lib/calculations';
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Bell,
  Clock,
  Pause,
  AlertTriangle,
  Radio,
} from 'lucide-react';

interface PositionCardProps {
  position: PositionWithMetrics;
  onViewDetails: (id: string) => void;
  onOpenAlertSetup?: (id: string) => void;
}

export function PositionCard({
  position,
  onViewDetails,
  onOpenAlertSetup,
}: PositionCardProps) {
  const { cryptocurrency, entryPrice, entryCurrency, currentPrice, metrics, status, alerts, priceFreshness } = position;
  const isPositive = (metrics?.priceDifference ?? 0) >= 0;
  const isPaused = status === 'PAUSED';

  // Find next active alert if any
  const nextAlert = alerts.find((a) => a.status === 'ACTIVE');

  return (
    <div
      onClick={() => onViewDetails(position.id)}
      className={`group relative rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
        isPaused
          ? 'bg-zinc-900/40 border-zinc-800/60 opacity-75'
          : 'bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border-zinc-800 hover:border-zinc-700/80 hover:shadow-xl hover:shadow-black/40'
      }`}
    >
      {/* Top subtle highlight gradient */}
      <div
        className={`absolute inset-x-0 top-0 h-[2px] transition-opacity duration-300 ${
          isPositive ? 'bg-gradient-to-r from-emerald-500/0 via-emerald-500/60 to-emerald-500/0' : 'bg-gradient-to-r from-rose-500/0 via-rose-500/60 to-rose-500/0'
        }`}
      />

      <div className="p-5 sm:p-6 space-y-4">
        {/* Header: Coin Identity & Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {cryptocurrency.logoUrl ? (
              <img
                src={cryptocurrency.logoUrl}
                alt={cryptocurrency.name}
                className="w-9 h-9 rounded-full ring-1 ring-zinc-700/60 p-0.5 bg-zinc-800 object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-300 ring-1 ring-zinc-700">
                {cryptocurrency.symbol.slice(0, 3)}
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-base tracking-tight">
                  {cryptocurrency.name}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-400 font-mono font-semibold">
                  {cryptocurrency.symbol}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {position.quantity.toLocaleString('en-US', { maximumFractionDigits: 6 })} {cryptocurrency.symbol}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isPaused ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Pause className="w-3 h-3 mr-1" /> Paused
              </span>
            ) : priceFreshness === 'LIVE' ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                Live
              </span>
            ) : priceFreshness === 'STALE' ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-3 h-3 mr-1" /> Stale
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700/40">
                <Radio className="w-3 h-3 mr-1 text-zinc-500" /> Active
              </span>
            )}
          </div>
        </div>

        {/* HERO SECTION: Entry Price ↔ Current Price (Side-by-Side Invariant) */}
        <div className="rounded-xl bg-zinc-950/60 border border-zinc-800/80 p-4">
          <div className="grid grid-cols-2 gap-4 divide-x divide-zinc-800/60">
            {/* Entry Price */}
            <div>
              <p className="text-[11px] font-medium tracking-wider uppercase text-zinc-500">
                ENTRY PRICE
              </p>
              <p className="mt-1 text-xl sm:text-2xl font-bold font-mono text-zinc-200 tracking-tight">
                {formatCurrency(entryPrice, entryCurrency)}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Cost: {formatCurrency(metrics?.costBasis ?? entryPrice * position.quantity, entryCurrency)}
              </p>
            </div>

            {/* Current Price */}
            <div className="pl-4">
              <p className="text-[11px] font-medium tracking-wider uppercase text-zinc-500 flex items-center justify-between">
                <span>CURRENT PRICE</span>
              </p>
              <p className="mt-1 text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
                {currentPrice ? formatCurrency(currentPrice, entryCurrency) : '—'}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Val: {currentPrice ? formatCurrency(metrics?.currentValue ?? 0, entryCurrency) : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Calculated Performance Banner: Difference & ROI */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2">
            <div
              className={`p-1.5 rounded-lg ${
                isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
            <div>
              <span
                className={`text-sm sm:text-base font-bold font-mono ${
                  isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {metrics ? (isPositive ? `+${formatCurrency(metrics.priceDifference, entryCurrency)}` : formatCurrency(metrics.priceDifference, entryCurrency)) : '—'}
              </span>
              <span
                className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded ${
                  isPositive ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
                }`}
              >
                {metrics ? formatRoi(metrics.roi) : '0.00%'}
              </span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(position.id);
            }}
            className="flex items-center text-xs text-zinc-400 hover:text-white font-medium transition-colors pl-2"
          >
            <span>View Position</span>
            <ChevronRight className="w-4 h-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Next Alert / Monitoring status footer */}
        <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center space-x-1.5 truncate max-w-[70%]">
            <Bell className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            {nextAlert ? (
              <span className="truncate">
                Alert: <strong className="text-zinc-300 font-medium">{nextAlert.type === 'PROFIT_PERCENT' ? `+${nextAlert.threshold}% target` : nextAlert.type === 'LOSS_PERCENT' ? `${nextAlert.threshold}% protection` : formatCurrency(nextAlert.targetPrice, entryCurrency)}</strong>
              </span>
            ) : (
              <span className="text-zinc-500">No active alerts</span>
            )}
          </div>

          {alerts.length > 0 && (
            <span className="text-[11px] text-zinc-500 font-mono">
              {alerts.length} alert{alerts.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { PositionWithMetrics, Alert } from '@/types/domain';
import { formatCurrency, formatRoi } from '@/lib/calculations';
import {
  ArrowLeft,
  Bell,
  Plus,
  Trash2,
  Pause,
  Play,
  Archive,
  MoreVertical,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Edit2,
  AlertTriangle,
} from 'lucide-react';

interface PositionDetailViewProps {
  position: PositionWithMetrics;
  onBack: () => void;
  onAddAlert: () => void;
  onDeleteAlert: (alertId: string) => void;
  onResetAlert: (alertId: string) => void;
  onPauseResume: (id: string, isPaused: boolean) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onEditEntryPrice: (newPrice: number) => void;
}

export function PositionDetailView({
  position,
  onBack,
  onAddAlert,
  onDeleteAlert,
  onResetAlert,
  onPauseResume,
  onArchive,
  onDelete,
  onEditEntryPrice,
}: PositionDetailViewProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditPrice, setShowEditPrice] = useState(false);
  const [priceInput, setPriceInput] = useState(position.entryPrice.toString());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { cryptocurrency, entryPrice, entryCurrency, currentPrice, metrics, status, alerts } = position;
  const isPositive = (metrics?.priceDifference ?? 0) >= 0;
  const isPaused = status === 'PAUSED';

  const handlePriceUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(priceInput);
    if (!isNaN(val) && val > 0) {
      onEditEntryPrice(val);
      setShowEditPrice(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Bar with Navigation & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        {/* Action Menu (Pause, Archive, Delete) */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-1.5 z-20 space-y-1">
              <button
                onClick={() => {
                  onPauseResume(position.id, isPaused);
                  setShowMenu(false);
                }}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
                <span>{isPaused ? 'Resume Monitoring' : 'Pause Monitoring'}</span>
              </button>

              <button
                onClick={() => {
                  onArchive(position.id);
                  setShowMenu(false);
                }}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <Archive className="w-4 h-4 text-zinc-400" />
                <span>Archive Position</span>
              </button>

              <div className="border-t border-zinc-800 my-1" />

              <button
                onClick={() => {
                  setShowDeleteConfirm(true);
                  setShowMenu(false);
                }}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Delete Position</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full rounded-3xl bg-zinc-900 border border-zinc-800 p-6 space-y-4 shadow-2xl">
            <h4 className="text-lg font-bold text-white">Delete {cryptocurrency.name} Position?</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This action is permanent and will delete this position and all its configured alerts. To keep records without active monitoring, consider Archiving instead.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onDelete(position.id)}
                className="px-4 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-colors"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {cryptocurrency.logoUrl ? (
              <img
                src={cryptocurrency.logoUrl}
                alt={cryptocurrency.name}
                className="w-12 h-12 rounded-full p-1 bg-zinc-800 ring-1 ring-zinc-700 object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-base text-zinc-300 ring-1 ring-zinc-700">
                {cryptocurrency.symbol}
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-bold text-white">{cryptocurrency.name}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono font-bold">
                  {cryptocurrency.symbol}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Holding: <strong className="text-zinc-200 font-mono">{position.quantity} {cryptocurrency.symbol}</strong>
              </p>
            </div>
          </div>

          <div>
            {isPaused ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Pause className="w-3.5 h-3.5 mr-1.5" /> Monitoring Paused
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2" />
                Live Monitoring Active
              </span>
            )}
          </div>
        </div>

        {/* HERO SIDE-BY-SIDE INVARIANT COMPARISON */}
        <div className="rounded-2xl bg-zinc-950/80 border border-zinc-800/80 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-zinc-800/70">
            {/* Entry Price Box */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider uppercase text-zinc-400">
                  ENTRY PRICE
                </span>
                <button
                  onClick={() => setShowEditPrice(true)}
                  className="inline-flex items-center space-x-1 text-[11px] text-zinc-400 hover:text-emerald-400 transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              {showEditPrice ? (
                <form onSubmit={handlePriceUpdate} className="flex items-center space-x-2 pt-2">
                  <input
                    type="number"
                    step="any"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    className="w-36 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-sm"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditPrice(false)}
                    className="px-2 py-1.5 rounded-xl text-zinc-400 text-xs hover:text-white"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <p className="text-3xl sm:text-4xl font-extrabold font-mono text-zinc-200">
                  {formatCurrency(entryPrice, entryCurrency)}
                </p>
              )}

              <p className="text-xs text-zinc-400 pt-1">
                Cost Basis: <strong className="text-zinc-300 font-mono">{formatCurrency(metrics?.costBasis ?? entryPrice * position.quantity, entryCurrency)}</strong>
              </p>
            </div>

            {/* Current Price Box */}
            <div className="md:pl-6 pt-4 md:pt-0 space-y-1">
              <span className="text-xs font-semibold tracking-wider uppercase text-zinc-400">
                CURRENT PRICE
              </span>
              <p className="text-3xl sm:text-4xl font-extrabold font-mono text-white">
                {currentPrice ? formatCurrency(currentPrice, entryCurrency) : '—'}
              </p>
              <p className="text-xs text-zinc-400 pt-1">
                Current Value: <strong className="text-zinc-300 font-mono">{currentPrice ? formatCurrency(metrics?.currentValue ?? 0, entryCurrency) : '—'}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Calculated Difference & Performance Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Difference
            </span>
            <span
              className={`text-lg font-bold font-mono ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {metrics ? (isPositive ? `+${formatCurrency(metrics.priceDifference, entryCurrency)}` : formatCurrency(metrics.priceDifference, entryCurrency)) : '—'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              ROI
            </span>
            <span
              className={`text-lg font-bold font-mono ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {metrics ? formatRoi(metrics.roi) : '0.00%'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Unrealized P/L
            </span>
            <span
              className={`text-lg font-bold font-mono ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {metrics ? (isPositive ? `+${formatCurrency(metrics.unrealizedPnl, entryCurrency)}` : formatCurrency(metrics.unrealizedPnl, entryCurrency)) : '—'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Purchase Date
            </span>
            <span className="text-sm font-semibold font-mono text-zinc-300">
              {position.purchaseDate || 'Not specified'}
            </span>
          </div>
        </div>
      </div>

      {/* Alerts Section (Screens 06 & 07 Integration) */}
      <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Bell className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">Active Alerts</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
              {alerts.length}
            </span>
          </div>

          <button
            onClick={onAddAlert}
            id="btn-add-alert"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Alert</span>
          </button>
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-zinc-800 rounded-2xl p-6">
            <p className="text-xs text-zinc-400">
              No alerts configured for {cryptocurrency.name}. Set a profit target or protection threshold.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const isTriggered = alert.status === 'TRIGGERED';

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${
                    isTriggered
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <div
                      className={`p-2 rounded-xl ${
                        alert.type === 'PROFIT_PERCENT'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : alert.type === 'LOSS_PERCENT'
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-sky-500/10 text-sky-400'
                      }`}
                    >
                      {alert.type === 'PROFIT_PERCENT' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : alert.type === 'LOSS_PERCENT' ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-white">
                          {alert.type === 'PROFIT_PERCENT'
                            ? `+${alert.threshold}% Profit Target`
                            : alert.type === 'LOSS_PERCENT'
                            ? `${alert.threshold}% Protection Threshold`
                            : alert.type === 'ENTRY_PRICE'
                            ? 'Return to Entry Price'
                            : `Price Target: ${formatCurrency(alert.targetPrice, entryCurrency)}`}
                        </span>
                        {isTriggered && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-400 text-zinc-950">
                            Triggered
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Trigger Price:{' '}
                        <strong className="text-zinc-200 font-mono">
                          {formatCurrency(alert.targetPrice, entryCurrency)}
                        </strong>{' '}
                        • Mode: <span className="capitalize">{alert.repeatMode.toLowerCase()}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isTriggered && (
                      <button
                        onClick={() => onResetAlert(alert.id)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteAlert(alert.id)}
                      className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

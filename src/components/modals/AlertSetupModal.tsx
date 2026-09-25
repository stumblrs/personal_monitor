'use client';

import { useState } from 'react';
import { Alert, AlertType, AlertDirection, AlertRepeatMode, Position } from '@/types/domain';
import { calculateAlertTargetPrice, formatCurrency } from '@/lib/calculations';
import { X, Target, TrendingUp, ShieldAlert, RotateCcw } from 'lucide-react';

interface AlertSetupModalProps {
  position: Position | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveAlert: (alertData: Omit<Alert, 'id' | 'createdAt' | 'updatedAt' | 'targetPrice'>) => void;
}

export function AlertSetupModal({
  position,
  isOpen,
  onClose,
  onSaveAlert,
}: AlertSetupModalProps) {
  const [type, setType] = useState<AlertType>('PROFIT_PERCENT');
  const [profitPct, setProfitPct] = useState<string>('10');
  const [lossPct, setLossPct] = useState<string>('5');
  const [targetPriceInput, setTargetPriceInput] = useState<string>('');
  const [direction, setDirection] = useState<AlertDirection>('ABOVE');
  const [repeatMode, setRepeatMode] = useState<AlertRepeatMode>('ONCE');
  const [cooldownMinutes, setCooldownMinutes] = useState<number>(30);

  if (!isOpen || !position) return null;

  let currentThreshold = 0;
  if (type === 'PROFIT_PERCENT') currentThreshold = parseFloat(profitPct) || 10;
  else if (type === 'LOSS_PERCENT') currentThreshold = -(parseFloat(lossPct) || 5);
  else if (type === 'PRICE') currentThreshold = parseFloat(targetPriceInput) || position.entryPrice;
  else if (type === 'ENTRY_PRICE') currentThreshold = position.entryPrice;

  const previewTriggerPrice = calculateAlertTargetPrice(type, position.entryPrice, currentThreshold);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalDirection: AlertDirection = direction;
    if (type === 'PROFIT_PERCENT') finalDirection = 'ABOVE';
    else if (type === 'LOSS_PERCENT') finalDirection = 'BELOW';
    else if (type === 'ENTRY_PRICE') {
      finalDirection = previewTriggerPrice >= position.entryPrice ? 'ABOVE' : 'BELOW';
    }

    onSaveAlert({
      positionId: position.id,
      type,
      direction: finalDirection,
      threshold: currentThreshold,
      repeatMode,
      cooldownMinutes,
      status: 'ACTIVE',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/80">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Add Alert</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Monitor {position.cryptocurrency.name} ({position.cryptocurrency.symbol})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step 1: Alert Condition Type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              What condition should trigger this alert?
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Profit Target */}
              <button
                type="button"
                onClick={() => {
                  setType('PROFIT_PERCENT');
                  setDirection('ABOVE');
                }}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  type === 'PROFIT_PERCENT'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white shadow-sm'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-xs">Profit Target</span>
                </div>
                <span className="text-[11px] text-zinc-500 mt-1.5">e.g. +10% ROI</span>
              </button>

              {/* Protection Threshold */}
              <button
                type="button"
                onClick={() => {
                  setType('LOSS_PERCENT');
                  setDirection('BELOW');
                }}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  type === 'LOSS_PERCENT'
                    ? 'bg-rose-500/10 border-rose-500/50 text-white shadow-sm'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span className="font-semibold text-xs">Protection</span>
                </div>
                <span className="text-[11px] text-zinc-500 mt-1.5">e.g. -5% downside</span>
              </button>

              {/* Specific Price Target */}
              <button
                type="button"
                onClick={() => setType('PRICE')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  type === 'PRICE'
                    ? 'bg-sky-500/10 border-sky-500/50 text-white shadow-sm'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-sky-400" />
                  <span className="font-semibold text-xs">Price Target</span>
                </div>
                <span className="text-[11px] text-zinc-500 mt-1.5">Specific fiat value</span>
              </button>

              {/* Break-Even / Entry Price */}
              <button
                type="button"
                onClick={() => setType('ENTRY_PRICE')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  type === 'ENTRY_PRICE'
                    ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-sm'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-xs">Return to Entry</span>
                </div>
                <span className="text-[11px] text-zinc-500 mt-1.5">Break-even alert</span>
              </button>
            </div>
          </div>

          {/* Value Inputs Based on Selected Alert Type */}
          <div className="space-y-4">
            {type === 'PROFIT_PERCENT' && (
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Target Profit Percentage
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={profitPct}
                    onChange={(e) => setProfitPct(e.target.value)}
                    placeholder="10"
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-400">
                    % ROI
                  </span>
                </div>
              </div>
            )}

            {type === 'LOSS_PERCENT' && (
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Protection Threshold Percentage Drop
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={lossPct}
                    onChange={(e) => setLossPct(e.target.value)}
                    placeholder="5"
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white font-mono text-sm focus:outline-none focus:border-rose-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-rose-400">
                    % Drop
                  </span>
                </div>
              </div>
            )}

            {type === 'PRICE' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">
                    Target Price ({position.entryCurrency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={targetPriceInput}
                    onChange={(e) => setTargetPriceInput(e.target.value)}
                    placeholder="Target price in fiat"
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white font-mono text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="dir"
                      checked={direction === 'ABOVE'}
                      onChange={() => setDirection('ABOVE')}
                      className="accent-emerald-500"
                    />
                    <span>Price crosses above</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="dir"
                      checked={direction === 'BELOW'}
                      onChange={() => setDirection('BELOW')}
                      className="accent-rose-500"
                    />
                    <span>Price crosses below</span>
                  </label>
                </div>
              </div>
            )}

            {type === 'ENTRY_PRICE' && (
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400">
                You will be notified immediately when {position.cryptocurrency.symbol} returns to your original Entry Price of{' '}
                <strong className="text-white font-mono font-bold">
                  {formatCurrency(position.entryPrice, position.entryCurrency)}
                </strong>
                .
              </div>
            )}

            {/* Calculated Trigger Confirmation Badge */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold block">
                  Calculated Trigger Price
                </span>
                <span className="text-lg font-bold font-mono text-white">
                  {formatCurrency(previewTriggerPrice, position.entryCurrency)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold block">
                  Entry Reference
                </span>
                <span className="text-xs font-mono text-zinc-400">
                  {formatCurrency(position.entryPrice, position.entryCurrency)}
                </span>
              </div>
            </div>
          </div>

          {/* Behavior / Anti-Spam Controls */}
          <div className="pt-2 border-t border-zinc-800/60 space-y-3">
            <label className="block text-xs font-semibold text-zinc-400">
              Notification Mode
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="radio"
                  name="repeat"
                  checked={repeatMode === 'ONCE'}
                  onChange={() => setRepeatMode('ONCE')}
                  className="accent-emerald-500"
                />
                <span>Notify Once</span>
              </label>
              <label className="flex items-center space-x-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="radio"
                  name="repeat"
                  checked={repeatMode === 'REPEAT'}
                  onChange={() => setRepeatMode('REPEAT')}
                  className="accent-emerald-500"
                />
                <span>Repeat on Re-arm</span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs tracking-wide transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-save-alert"
              className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs tracking-wide shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              Save Alert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

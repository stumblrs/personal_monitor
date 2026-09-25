'use client';

import { useState } from 'react';
import { Cryptocurrency, Currency, Position } from '@/types/domain';
import { formatCurrency } from '@/lib/calculations';
import { X, AlertCircle } from 'lucide-react';

interface PositionSetupModalProps {
  coin: Cryptocurrency | null;
  baseCurrency: Currency;
  isOpen: boolean;
  onClose: () => void;
  onSavePosition: (positionData: Omit<Position, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void;
}

export function PositionSetupModal({
  coin,
  baseCurrency,
  isOpen,
  onClose,
  onSavePosition,
}: PositionSetupModalProps) {
  const [quantity, setQuantity] = useState<string>('1.0');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>(baseCurrency);
  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [fees, setFees] = useState<string>('0');
  const [exchange, setExchange] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen || !coin) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedQty = parseFloat(quantity);
    const parsedPrice = parseFloat(entryPrice);
    const parsedFees = parseFloat(fees) || 0;

    if (isNaN(parsedQty) || parsedQty <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Entry Price must be greater than zero.');
      return;
    }

    onSavePosition({
      cryptocurrencyId: coin.id,
      cryptocurrency: coin,
      quantity: parsedQty,
      entryPrice: parsedPrice,
      entryCurrency: currency,
      purchaseDate,
      fees: parsedFees,
      exchange: exchange.trim() || undefined,
      notes: notes.trim() || undefined,
      status: 'ACTIVE',
    });

    onClose();
  };

  const calculatedCost = (parseFloat(quantity) || 0) * (parseFloat(entryPrice) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/80">
          <div className="flex items-center space-x-3">
            {coin.logoUrl && (
              <img
                src={coin.logoUrl}
                alt={coin.name}
                className="w-8 h-8 rounded-full bg-zinc-800 p-0.5"
              />
            )}
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Add Position</h3>
              <p className="text-xs text-zinc-400">
                {coin.name} ({coin.symbol})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-2.5 text-xs text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Quantity <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 0.25"
                className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white font-mono placeholder-zinc-600 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-zinc-500 uppercase">
                {coin.symbol}
              </span>
            </div>
          </div>

          {/* Entry Price (Required, Never "In-Price") */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Entry Price <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-3 relative">
                <input
                  type="number"
                  step="any"
                  required
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  placeholder="Price you paid per coin"
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white font-mono placeholder-zinc-600 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="col-span-1 px-3 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="NGN">NGN (₦)</option>
                <option value="GHS">GHS (GH₵)</option>
              </select>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Your exact cost per single {coin.symbol}.
            </p>
          </div>

          {/* Computed Cost Basis Live preview */}
          {calculatedCost > 0 && (
            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">Initial Cost Basis:</span>
              <span className="font-bold font-mono text-emerald-400 text-sm">
                {formatCurrency(calculatedCost, currency)}
              </span>
            </div>
          )}

          {/* Additional details expandable */}
          <div className="pt-2 border-t border-zinc-800/60 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Purchase Date (optional)
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-mono focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Fees (optional)
                </label>
                <input
                  type="number"
                  step="any"
                  value={fees}
                  onChange={(e) => setFees(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-mono focus:outline-none focus:border-zinc-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Exchange / Wallet (optional)
              </label>
              <input
                type="text"
                value={exchange}
                onChange={(e) => setExchange(e.target.value)}
                placeholder="e.g. Ledger, Kraken, Bitvavo"
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          {/* Action buttons */}
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
              id="btn-save-position"
              className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs tracking-wide shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              Save Position
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

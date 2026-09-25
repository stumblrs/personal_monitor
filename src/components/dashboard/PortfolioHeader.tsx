import { PortfolioSummary, Currency } from '@/types/domain';
import { formatCurrency, formatRoi } from '@/lib/calculations';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface PortfolioSummaryProps {
  summary: PortfolioSummary;
  baseCurrency: Currency;
  onSelectCoinClick: () => void;
}

export function PortfolioHeader({
  summary,
  baseCurrency,
  onSelectCoinClick,
}: PortfolioSummaryProps) {
  const isPositive = summary.unrealizedPnl >= 0;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 p-6 sm:p-8 shadow-2xl">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-1/4 -mt-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div
        className={`absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
          isPositive ? 'bg-emerald-500/10' : 'bg-rose-500/10'
        }`}
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Main Metric: Portfolio Value */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-semibold tracking-wider text-zinc-400">
              Portfolio Value
            </span>
            <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
              {summary.activePositionsCount} Active Position{summary.activePositionsCount === 1 ? '' : 's'}
            </span>
          </div>

          <div className="flex items-baseline space-x-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-mono tracking-tight text-white">
              {formatCurrency(summary.currentValue, baseCurrency)}
            </h1>
          </div>

          {/* Unrealized P/L & Total ROI */}
          <div className="flex items-center space-x-3 pt-2">
            <div
              className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-sm font-semibold font-mono ${
                isPositive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
              )}
              <span>
                {isPositive ? `+${formatCurrency(summary.unrealizedPnl, baseCurrency)}` : formatCurrency(summary.unrealizedPnl, baseCurrency)}
              </span>
              <span>({formatRoi(summary.roi)})</span>
            </div>

            <span className="text-xs text-zinc-400">
              Invested: <strong className="text-zinc-300 font-mono">{formatCurrency(summary.totalInvested, baseCurrency)}</strong>
            </span>
          </div>
        </div>

        {/* Action Button: Primary Gateway + SELECT COIN */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={onSelectCoinClick}
            id="btn-select-coin-primary"
            className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span className="text-base font-extrabold leading-none">+</span>
            <span>Select Coin</span>
          </button>
        </div>
      </div>
    </div>
  );
}

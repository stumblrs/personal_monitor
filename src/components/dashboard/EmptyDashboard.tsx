import { PlusCircle, Search } from 'lucide-react';

interface EmptyDashboardProps {
  onSelectCoinClick: () => void;
}

export function EmptyDashboard({
  onSelectCoinClick,
}: EmptyDashboardProps) {
  return (
    <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/30 p-10 sm:p-16 text-center max-w-2xl mx-auto my-8">
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-400 shadow-inner">
        <PlusCircle className="w-8 h-8 text-emerald-400 stroke-[1.75]" />
      </div>

      <h2 className="text-2xl font-bold text-white tracking-tight">
        No coins selected yet
      </h2>

      <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
        This is your private monitor. Coins only appear here when you explicitly choose to track them.
      </p>

      <div className="mt-8 flex items-center justify-center">
        <button
          onClick={onSelectCoinClick}
          id="btn-select-coin-empty"
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all cursor-pointer"
        >
          <span className="text-base font-extrabold">+</span>
          <span>Select Coin</span>
        </button>
      </div>

      <div className="mt-10 pt-6 border-t border-zinc-800/80 grid grid-cols-3 gap-4 text-xs text-zinc-500">
        <div>
          <span className="block font-semibold text-zinc-400">1. Select</span>
          <span>Pick your cryptocurrency</span>
        </div>
        <div>
          <span className="block font-semibold text-zinc-400">2. Record</span>
          <span>Enter your entry price</span>
        </div>
        <div>
          <span className="block font-semibold text-zinc-400">3. Monitor</span>
          <span>Live P/L & smart alerts</span>
        </div>
      </div>
    </div>
  );
}

import { Currency } from '@/types/domain';
import { Activity, Bell, RefreshCw, Settings, SlidersHorizontal, Smartphone } from 'lucide-react';
import { formatDeviceShortName } from '@/lib/deviceId';

interface NavbarProps {
  deviceId: string;
  baseCurrency: Currency;
  onCurrencyChange: (curr: Currency) => void;
  refreshInterval: number;
  onRefreshIntervalChange: (sec: number) => void;
  onRefreshNow: () => void;
  isRefreshing: boolean;
  activeView: 'dashboard' | 'archived' | 'history' | 'settings';
  onNavigate: (view: 'dashboard' | 'archived' | 'history' | 'settings') => void;
  unreadAlertsCount: number;
}

export function Navbar({
  deviceId,
  baseCurrency,
  onCurrencyChange,
  refreshInterval,
  onRefreshIntervalChange,
  onRefreshNow,
  isRefreshing,
  activeView,
  onNavigate,
  unreadAlertsCount,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center space-x-6">
          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-4 h-4 text-zinc-950 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                Crypto Position Monitor
              </span>
              <span className="text-[10px] text-zinc-500 font-medium">Personal Monitor</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden sm:flex items-center space-x-1">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeView === 'dashboard'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onNavigate('archived')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeView === 'archived'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Archived
            </button>
            <button
              onClick={() => onNavigate('history')}
              className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeView === 'history'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Alert History
              {unreadAlertsCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-emerald-500 text-zinc-950 font-bold text-[10px]">
                  {unreadAlertsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => onNavigate('settings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeView === 'settings'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>

        {/* Global Controls: Refresh Frequency, Currency, Settings Icon */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Device Identity Badge */}
          <div
            title={`Your Device ID: ${deviceId}`}
            className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>{formatDeviceShortName(deviceId)}</span>
          </div>

          {/* Quick Currency Selector */}
          <select
            value={baseCurrency}
            onChange={(e) => onCurrencyChange(e.target.value as Currency)}
            className="px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-xs focus:outline-none focus:border-zinc-700 cursor-pointer"
          >
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
            <option value="GBP">GBP (£)</option>
            <option value="NGN">NGN (₦)</option>
            <option value="GHS">GHS (GH₵)</option>
          </select>

          {/* Manual Refresh Trigger */}
          <button
            onClick={onRefreshNow}
            disabled={isRefreshing}
            title="Refresh current prices now"
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Quick Settings Icon Button (desktop only since mobile has bottom nav bar) */}
          <button
            onClick={() => onNavigate('settings')}
            title="Settings & Preferences"
            className={`hidden sm:flex p-2 rounded-xl border transition-colors cursor-pointer ${
              activeView === 'settings'
                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Tab Navigation for Phones (fixed at the bottom with safe area) */}
      <nav
        aria-label="Mobile Navigation"
        className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 border-t border-zinc-800/80 backdrop-blur-xl px-2 py-1.5 flex items-center justify-around shadow-2xl shadow-black/80 pb-[max(0.375rem,env(safe-area-inset-bottom))]"
      >
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex-1 flex flex-col items-center py-1.5 px-2 rounded-2xl text-[10px] font-semibold transition-all active:scale-95 ${
            activeView === 'dashboard'
              ? 'text-emerald-400 bg-emerald-500/10'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Activity className="w-5 h-5 mb-1" />
          <span>Monitor</span>
        </button>

        <button
          onClick={() => onNavigate('archived')}
          className={`flex-1 flex flex-col items-center py-1.5 px-2 rounded-2xl text-[10px] font-semibold transition-all active:scale-95 ${
            activeView === 'archived'
              ? 'text-emerald-400 bg-emerald-500/10'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5 mb-1" />
          <span>Archived</span>
        </button>

        <button
          onClick={() => onNavigate('history')}
          className={`relative flex-1 flex flex-col items-center py-1.5 px-2 rounded-2xl text-[10px] font-semibold transition-all active:scale-95 ${
            activeView === 'history'
              ? 'text-emerald-400 bg-emerald-500/10'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <Bell className="w-5 h-5 mb-1" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-emerald-500 text-zinc-950 font-extrabold text-[9px] flex items-center justify-center">
                {unreadAlertsCount}
              </span>
            )}
          </div>
          <span>Alerts</span>
        </button>

        <button
          onClick={() => onNavigate('settings')}
          className={`flex-1 flex flex-col items-center py-1.5 px-2 rounded-2xl text-[10px] font-semibold transition-all active:scale-95 ${
            activeView === 'settings'
              ? 'text-emerald-400 bg-emerald-500/10'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Settings className="w-5 h-5 mb-1" />
          <span>Settings</span>
        </button>
      </nav>
    </header>
  );
}

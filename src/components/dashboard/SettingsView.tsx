'use client';

import { useState } from 'react';
import { Currency } from '@/types/domain';
import { PositionStore } from '@/lib/storage';
import {
  Settings as SettingsIcon,
  Globe,
  Clock,
  RefreshCw,
  Bell,
  Smartphone,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { formatDeviceShortName } from '@/lib/deviceId';

interface SettingsViewProps {
  deviceId: string;
  baseCurrency: Currency;
  onCurrencyChange: (curr: Currency) => void;
  refreshInterval: number;
  onRefreshIntervalChange: (sec: number) => void;
  onClearAllData: () => void;
  onRefreshNow: () => void;
  isRefreshing: boolean;
}

const SUPPORTED_CURRENCIES: { code: Currency; name: string; symbol: string }[] = [
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
];

const REFRESH_OPTIONS = [
  { value: 10, label: '10 seconds', desc: 'Real-time high frequency' },
  { value: 30, label: '30 seconds', desc: 'Balanced default' },
  { value: 60, label: '1 minute', desc: 'Standard market monitoring' },
  { value: 300, label: '5 minutes', desc: 'Low bandwidth / battery saver' },
];

const COMMON_TIMEZONES = [
  'UTC',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Dubai',
  'Africa/Lagos',
  'Australia/Sydney',
];

export function SettingsView({
  deviceId,
  baseCurrency,
  onCurrencyChange,
  refreshInterval,
  onRefreshIntervalChange,
  onClearAllData,
  onRefreshNow,
  isRefreshing,
}: SettingsViewProps) {
  const [timezone, setTimezone] = useState<string>(() => PositionStore.getTimezone());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => PositionStore.isSoundEnabled());
  const [copiedDevice, setCopiedDevice] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleTimezoneChange = (tz: string) => {
    setTimezone(tz);
    PositionStore.setTimezone(tz);
  };

  const handleSoundToggle = (val: boolean) => {
    setSoundEnabled(val);
    PositionStore.setSoundEnabled(val);
  };

  const handleCopyDeviceId = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(deviceId);
      setCopiedDevice(true);
      setTimeout(() => setCopiedDevice(false), 2000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
            <SettingsIcon className="w-5 h-5 text-emerald-400 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Settings & Preferences</h1>
            <p className="text-xs text-zinc-400">
              Configure your local monitor preferences, currency, and background worker
            </p>
          </div>
        </div>

        <button
          onClick={onRefreshNow}
          disabled={isRefreshing}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Sync Now</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* SECTION 1: Base Currency */}
        <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Base Portfolio Currency
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Prices and performance metrics across all positions are converted and evaluated in this currency.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active: {baseCurrency}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
            {SUPPORTED_CURRENCIES.map((c) => {
              const isSelected = baseCurrency === c.code;
              return (
                <button
                  key={c.code}
                  onClick={() => onCurrencyChange(c.code)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/30 text-white'
                      : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold font-mono">{c.symbol}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div className="mt-1 font-bold text-xs">{c.code}</div>
                  <div className="text-[10px] text-zinc-500 truncate">{c.name}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: Price Refresh & Monitoring Interval */}
        <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Price Refresh Frequency
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                How often the active dashboard queries live spot quotes from market feeds.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700">
              {refreshInterval}s
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {REFRESH_OPTIONS.map((opt) => {
              const isSelected = refreshInterval === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onRefreshIntervalChange(opt.value)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/30'
                      : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div>
                    <div className={`text-xs font-bold ${isSelected ? 'text-emerald-400' : 'text-zinc-200'}`}>
                      {opt.label}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">{opt.desc}</div>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: Timezone & Alerts */}
        <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-5">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Alerts & Timezone
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Timezone picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 block">
                Display Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => handleTimezoneChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-zinc-500">
                Used to format timestamps in alert triggers and event logs.
              </p>
            </div>

            {/* Sound notification toggle */}
            <div className="space-y-1.5 flex flex-col justify-between">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block">
                  Audio Alert Chime
                </label>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Play subtle chime when a target price crossing is evaluated.
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  onClick={() => handleSoundToggle(!soundEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    soundEnabled ? 'bg-emerald-500' : 'bg-zinc-800'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      soundEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-xs font-medium text-zinc-400">
                  {soundEnabled ? 'Enabled' : 'Muted'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: Device Identity & Cloud Sync */}
        <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Device Session Identifier
                </h2>
              </div>
              <p className="text-xs text-zinc-400">
                Your monitored positions and alerts are securely linked to this unique anonymous token in the PostgreSQL database.
              </p>
            </div>

            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Private & Synced</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-2 truncate mr-3">
              <span className="text-xs font-mono text-zinc-300 truncate">{deviceId}</span>
              <span className="text-[10px] text-zinc-500 font-mono">({formatDeviceShortName(deviceId)})</span>
            </div>

            <button
              onClick={handleCopyDeviceId}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors cursor-pointer shrink-0"
            >
              {copiedDevice ? 'Copied!' : 'Copy Token'}
            </button>
          </div>
        </div>

        {/* SECTION 5: Danger Zone */}
        <div className="p-6 rounded-3xl bg-rose-950/10 border border-rose-900/30 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <h2 className="text-sm font-bold text-rose-300 uppercase tracking-wider">
                  Reset Data
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Wipe all cached positions, configured alerts, and event logs from this device.
              </p>
            </div>

            {!showConfirmReset ? (
              <button
                onClick={() => setShowConfirmReset(true)}
                className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold transition-all cursor-pointer"
              >
                Wipe Local Store
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-400 text-xs hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onClearAllData();
                    setShowConfirmReset(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-900/40 cursor-pointer"
                >
                  Confirm Wipe
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

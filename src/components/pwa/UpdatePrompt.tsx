'use client';

import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';

export function UpdatePrompt() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check version against /api/version
    const checkVersion = async () => {
      try {
        const res = await fetch(`/api/version?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: { Pragma: 'no-cache', 'Cache-Control': 'no-cache' },
        });
        if (!res.ok) return;

        const data = await res.json();
        const serverVersion = data.version;

        if (!currentVersion) {
          // Store first version seen on initial load
          setCurrentVersion(serverVersion);
        } else if (currentVersion !== serverVersion) {
          // New deployment detected!
          setUpdateAvailable(true);
        }
      } catch (err) {
        // Silently skip if offline
      }
    };

    // Initial check after 3 seconds
    const initialTimer = setTimeout(checkVersion, 3000);

    // Periodic check every 60 seconds
    const interval = setInterval(checkVersion, 60 * 1000);

    // Check whenever window gets focused (e.g., user resumes app on phone)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentVersion]);

  const handleReload = () => {
    if (typeof window !== 'undefined') {
      // Force reload ignoring cache
      window.location.reload();
    }
  };

  if (!updateAvailable || dismissed) return null;

  return (
    <div className="fixed top-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:w-96 z-50 animate-in slide-in-from-top-4 duration-300">
      <div className="p-4 rounded-2xl bg-zinc-900/95 border border-emerald-500/40 shadow-2xl shadow-emerald-950/50 backdrop-blur-xl flex items-center justify-between space-x-3 ring-1 ring-emerald-500/20">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>

          <div className="truncate">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-white">App Update Available</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-[11px] text-zinc-400 truncate">
              New features are ready. Tap reload to update.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            onClick={handleReload}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs tracking-tight transition-all active:scale-95 shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload</span>
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

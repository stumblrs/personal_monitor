'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode (already installed as PWA)
    const isInStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isInStandaloneMode) {
      setIsStandalone(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for Chrome/Android/Desktop install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Allow opening prompt on demand (e.g. from a button or menu)
    const handleManualOpen = () => setShowPrompt(true);
    window.addEventListener('cpm:open-install-prompt', handleManualOpen);

    // If on mobile (or test device) and not in standalone, show prompt after a short delay for smooth discoverability
    const isMobile = isIosDevice || /android|mobile/i.test(userAgent);
    if (isMobile && !isInStandaloneMode) {
      const dismissed = sessionStorage.getItem('cpm_install_dismissed');
      if (!dismissed) {
        const timer = setTimeout(() => setShowPrompt(true), 2000);
        return () => {
          clearTimeout(timer);
          window.removeEventListener('cpm:open-install-prompt', handleManualOpen);
          window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
      }
    }

    return () => {
      window.removeEventListener('cpm:open-install-prompt', handleManualOpen);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('cpm_install_dismissed', 'true');
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-bottom-6 duration-300">
      <div className="relative rounded-3xl bg-zinc-900 border border-emerald-500/40 p-5 shadow-2xl shadow-emerald-950/60 flex flex-col space-y-3.5 backdrop-blur-xl">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3.5 pr-6">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 p-1 flex items-center justify-center shrink-0 shadow-inner">
            <img
              src="/icons/icon-192x192.svg"
              alt="Crypto Position Monitor"
              className="w-10 h-10 rounded-xl object-contain"
            />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm tracking-tight">
              Install Crypto Monitor App
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Get instant price alerts & fullscreen cockpit experience on your mobile phone
            </p>
          </div>
        </div>

        {isIOS ? (
          <div className="pt-2 border-t border-zinc-800/80 text-xs text-zinc-300 space-y-1.5">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
              <Share className="w-4 h-4" />
              <span>Tap the Share button in Safari</span>
            </div>
            <p className="text-zinc-400 text-[11px]">
              Scroll down and tap <strong className="text-zinc-200">"Add to Home Screen"</strong> to install with the app icon.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {!deferredPrompt && (
              <p className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-800">
                Tap your browser menu (<strong className="text-zinc-200">⋮</strong>) and select <strong className="text-zinc-200">"Install app"</strong> or <strong className="text-zinc-200">"Add to Home screen"</strong>.
              </p>
            )}
            <div className="flex items-center justify-end space-x-2 pt-1 border-t border-zinc-800/80">
              <button
                onClick={handleDismiss}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Not Now
              </button>
              {deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  id="btn-install-app"
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Install to Phone</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
